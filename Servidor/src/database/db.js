import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Tannf130',
  database: 'galeria_archivos',
  waitForConnections: true,
  connectionLimit: 10
});
