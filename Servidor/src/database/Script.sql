create database galeria_archivos;
use galeria_archivos;
CREATE TABLE documentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre_original VARCHAR(255) NOT NULL,
  ruta_archivo VARCHAR(255) NOT NULL,
  fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

