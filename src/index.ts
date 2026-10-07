import express from 'express';
import * as dotenv from 'dotenv';
import pool from './db';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// 1. Inicializar la base de datos automáticamente
pool.query(`
  CREATE TABLE IF NOT EXISTS contactos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`).then(() => {
  console.log('✅ Tabla de contactos lista en PostgreSQL');
}).catch((err) => {
  console.error('❌ Error creando la tabla:', err);
});

// 2. Ruta para OBTENER todos los contactos (GET)
app.get('/api/contactos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contactos ORDER BY fecha_creacion DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener los contactos' });
  }
});

// 3. Ruta para CREAR un nuevo contacto (POST)
app.post('/api/contactos', async (req, res) => {
  const { nombre, email, telefono, notas } = req.body;
  
  try {
    const result = await pool.query(
      'INSERT INTO contactos (nombre, email, telefono, notas) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, email, telefono, notas]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear el contacto (Revisa que el email no esté duplicado)' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor CRM corriendo en el puerto ${port}`);
});