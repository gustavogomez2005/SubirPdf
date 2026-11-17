import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { pool } from './database/db.js';
import { upload } from './Subir/uploadConfig.js';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(cors());


// Hacer pública la carpeta 'uploads' para acceder a los PDFs por URL
app.use('/uploads', express.static('uploads'));

// Ruta POST para subir el PDF ('archivoPdf' debe coincidir con el name del input)
app.post('/api/subir-pdf', upload.single('archivoPdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo PDF.' });
    }

    const { originalname, path: filePath } = req.file;

    // Guardar referencia en MySQL
    const query = 'INSERT INTO documentos (nombre_original, ruta_archivo) VALUES (?, ?)';
    const [result] = await pool.query(query, [originalname, filePath]);

    res.status(201).json({
      mensaje: 'PDF subido y registrado con éxito',
      id: result.insertId,
      archivo: originalname,
      url: `http://localhost:3000/${filePath.replace(/\\/g, '/')}`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno al guardar el archivo.' });
  }
});

// Middleware para capturar errores de Multer (ej. archivo muy pesado o no es PDF)
app.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

// 1. LISTAR TODOS LOS PDFs (GET)
app.get('/api/documentos', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre_original, ruta_archivo, fecha_subida FROM documentos ORDER BY fecha_subida DESC'
    );

    // Formateamos la respuesta para incluir la URL completa lista para usar en el frontend
    const documentos = rows.map((doc) => ({
      ...doc,
      url: `http://localhost:3000/${doc.ruta_archivo.replace(/\\/g, '/')}`
    }));

    res.json(documentos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la lista de documentos.' });
  }
});

// 2. ELIMINAR UN PDF POR ID (DELETE)
app.delete('/api/documentos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Paso A: Buscar la ruta del archivo en MySQL antes de borrar el registro
    const [rows] = await pool.query('SELECT ruta_archivo FROM documentos WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Documento no encontrado.' });
    }

    const rutaRelativa = rows[0].ruta_archivo;
    const rutaAbsoluta = path.resolve(rutaRelativa);

    // Paso B: Eliminar el registro de la base de datos
    await pool.query('DELETE FROM documentos WHERE id = ?', [id]);

    // Paso C: Eliminar el archivo físico de la carpeta 'uploads'
    try {
      await fs.unlink(rutaAbsoluta);
    } catch (fsError) {
      // Si el archivo ya no existía en disco (código ENOENT), lo ignoramos para no romper la respuesta
      if (fsError.code !== 'ENOENT') {
        console.error('Error al borrar el archivo físico:', fsError);
      }
    }

    res.json({ mensaje: 'Documento eliminado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno al eliminar el documento.' });
  }
});

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
