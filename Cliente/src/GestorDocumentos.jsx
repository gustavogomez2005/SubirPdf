import { useState, useEffect, useRef } from 'react';
import './GestorDocumentos.css';

const API_URL = 'http://localhost:3000/api';

export function GestorDocumentos() {
  const [archivo, setArchivo] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const inputRef = useRef(null);

  // Cargar la lista de PDFs al montar el componente
  useEffect(() => {
    obtenerDocumentos();
  }, []);

  const obtenerDocumentos = async () => {
    try {
      const res = await fetch(`${API_URL}/documentos`);
      const data = await res.json();
      if (res.ok) setDocumentos(data);
    } catch (error) {
      mostrarMensaje('No se pudo conectar con el servidor.', 'error');
    }
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
  };

  const handleSeleccionarArchivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      mostrarMensaje('Solo se permiten archivos en formato PDF.', 'error');
      e.target.value = '';
      setArchivo(null);
      return;
    }

    setArchivo(file);
    setMensaje({ texto: '', tipo: '' });
  };

  const handleSubir = async (e) => {
    e.preventDefault();
    if (!archivo) return;

    // Empaquetar el archivo con FormData (el nombre 'archivoPdf' debe coincidir con Multer)
    const formData = new FormData();
    formData.append('archivoPdf', archivo);

    try {
      setCargando(true);
      const res = await fetch(`${API_URL}/subir-pdf`, {
        method: 'POST',
        body: formData, // No agregar headers Content-Type manualmente
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir el PDF');

      mostrarMensaje('PDF subido correctamente.', 'exito');
      setArchivo(null);
      if (inputRef.current) inputRef.current.value = '';
      
      // Actualizar la lista en pantalla
      obtenerDocumentos();
    } catch (error) {
      mostrarMensaje(error.message, 'error');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id) => {
    try {
      const res = await fetch(`${API_URL}/documentos/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('No se pudo eliminar el documento');

      setDocumentos((prev) => prev.filter((doc) => doc.id !== id));
      mostrarMensaje('Documento eliminado.', 'exito');
    } catch (error) {
      mostrarMensaje(error.message, 'error');
    }
  };

  return (
    <div className="contenedor-pdf">
      <h2>Gestor de Documentos PDF</h2>

      {/* Formulario HTML de subida */}
      <form onSubmit={handleSubir} className="formulario-subida">
        <label className="zona-archivo">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={handleSeleccionarArchivo}
            hidden
          />
          <span className="icono-pdf">📄</span>
          <span>
            {archivo ? archivo.name : 'Haz clic aquí para seleccionar un PDF'}
          </span>
        </label>

        <button
          type="submit"
          className="btn-subir"
          disabled={!archivo || cargando}
        >
          {cargando ? 'Subiendo...' : 'Subir a MySQL'}
        </button>
      </form>

      {/* Alertas de estado */}
      {mensaje.texto && (
        <div className={`alerta ${mensaje.tipo}`}>{mensaje.texto}</div>
      )}

      {/* Lista de documentos guardados */}
      <div className="lista-documentos">
        <h3>Archivos Guardados ({documentos.length})</h3>
        {documentos.length === 0 ? (
          <p className="vacio">Aún no hay archivos PDF subidos.</p>
        ) : (
          <ul>
            {documentos.map((doc) => (
              <li key={doc.id} className="item-documento">
                <div className="info-doc">
                  <strong>{doc.nombre_original}</strong>
                  <small>
                    {new Date(doc.fecha_subida).toLocaleDateString()}
                  </small>
                </div>
                <div className="acciones-doc">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ver"
                  >
                    Ver PDF
                  </a>
                  <button
                    onClick={() => handleEliminar(doc.id)}
                    className="btn-eliminar"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
