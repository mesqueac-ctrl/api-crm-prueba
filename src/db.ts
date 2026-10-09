import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'usuario_crm',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_NAME || 'crm_db',
});

export default pool;
// Crea la tabla si no existe. Se llama (y se espera) antes de levantar el servidor.
export const initSchema = async (): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contactos (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      empresa VARCHAR(100),
      email VARCHAR(100) UNIQUE NOT NULL,
      telefono VARCHAR(20),
      notas TEXT,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};
