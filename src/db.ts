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