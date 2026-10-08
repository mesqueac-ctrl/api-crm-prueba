import express from 'express';
import * as dotenv from 'dotenv';
import pool from './db';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Crear la tabla solo si no existe (los datos persisten entre reinicios)
pool.query(`
  CREATE TABLE IF NOT EXISTS contactos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    empresa VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`).then(() => console.log('✅ Tabla contactos lista')).catch(console.error);

// Función auxiliar para validar correos
const esEmailValido = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// REQ 1 & 5: Crear contacto con validaciones
app.post('/api/contactos', async (req, res): Promise<any> => {
  const { nombre, email, telefono, empresa } = req.body;
  
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
  if (!email || !esEmailValido(email)) return res.status(400).json({ error: 'Formato de correo inválido' });

  try {
    const result = await pool.query(
      'INSERT INTO contactos (nombre, email, telefono, empresa) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, email, telefono, empresa]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') return res.status(400).json({ error: 'El email ya está registrado' });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// REQ 2: Listar contactos con búsqueda opcional
app.get('/api/contactos', async (req, res) => {
  const { buscar } = req.query;
  try {
    let query = 'SELECT * FROM contactos';
    const params: any[] = [];

    if (buscar) {
      query += ' WHERE nombre ILIKE $1 OR empresa ILIKE $1';
      params.push(`%${buscar}%`);
    }
    
    query += ' ORDER BY fecha_creacion DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener los contactos' });
  }
});

// REQ 3: Ver un contacto por su identificador
app.get('/api/contactos/:id', async (req, res): Promise<any> => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM contactos WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Contacto no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener el contacto' });
  }
});

// REQ 4: Agregar una nota a un contacto
app.patch('/api/contactos/:id/notas', async (req, res): Promise<any> => {
  const { id } = req.params;
  const { nota } = req.body;

  if (!nota) return res.status(400).json({ error: 'La nota es obligatoria' });

  try {
    const result = await pool.query(
      `UPDATE contactos SET notas = CONCAT(COALESCE(notas, ''), '\n- ', $1::text) WHERE id = $2 RETURNING *`,
      [nota, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Contacto no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al agregar la nota' });
  }
});

// Extra Opcional: Eliminar
app.delete('/api/contactos/:id', async (req, res): Promise<any> => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM contactos WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Contacto no encontrado' });
    res.json({ mensaje: 'Contacto eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar el contacto' });
  }
});

app.listen(port, () => console.log(`🚀 Servidor CRM corriendo en el puerto ${port}`));