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

// 4. Ruta para ACTUALIZAR un contacto (PUT)
app.put('/api/contactos/:id', async (req, res): Promise<any> => {
    const { id } = req.params;
    const { nombre, email, telefono, notas } = req.body;
    
    try {
      const result = await pool.query(
        'UPDATE contactos SET nombre = $1, email = $2, telefono = $3, notas = $4 WHERE id = $5 RETURNING *',
        [nombre, email, telefono, notas, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Contacto no encontrado' });
      }
      
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Error al actualizar el contacto' });
    }
  });
  
  // 5. Ruta para ELIMINAR un contacto (DELETE)
  app.delete('/api/contactos/:id', async (req, res): Promise<any> => {
    const { id } = req.params;
    
    try {
      const result = await pool.query(
        'DELETE FROM contactos WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Contacto no encontrado' });
      }
      
      res.json({ mensaje: 'Contacto eliminado correctamente', contacto: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: 'Error al eliminar el contacto' });
    }
  });

app.listen(port, () => {
  console.log(`🚀 Servidor CRM corriendo en el puerto ${port}`);
});