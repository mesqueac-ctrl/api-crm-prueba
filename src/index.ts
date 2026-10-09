import express from 'express';
import * as dotenv from 'dotenv';
import pool, { initSchema } from './db';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Función auxiliar para validar correos
const esEmailValido = (email: unknown) =>
  typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Un campo opcional debe ser texto (o no venir) y respetar la longitud de la columna
const textoOpcionalValido = (valor: unknown, max: number) =>
  valor === undefined || valor === null || (typeof valor === 'string' && valor.length <= max);

// El id debe ser un entero positivo; si no, Postgres lanzaría un error de tipo (500)
const esIdValido = (id: string) => /^\d+$/.test(id) && Number(id) <= 2147483647;

// Valida el parámetro :id en todas las rutas que lo usan
app.param('id', (req, res, next, id) => {
  if (!esIdValido(id)) return res.status(400).json({ error: 'El id debe ser un número entero positivo' });
  next();
});

// REQ 1 & 5: Crear contacto con validaciones
app.post('/api/contactos', async (req, res): Promise<any> => {
  const { nombre, email, telefono, empresa } = req.body ?? {};

  if (typeof nombre !== 'string' || nombre.trim() === '') {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }
  if (nombre.length > 100) return res.status(400).json({ error: 'El nombre no puede superar 100 caracteres' });
  if (!esEmailValido(email)) return res.status(400).json({ error: 'Formato de correo inválido' });
  if (email.length > 100) return res.status(400).json({ error: 'El correo no puede superar 100 caracteres' });
  if (!textoOpcionalValido(telefono, 20)) return res.status(400).json({ error: 'El teléfono debe ser texto de máximo 20 caracteres' });
  if (!textoOpcionalValido(empresa, 100)) return res.status(400).json({ error: 'La empresa debe ser texto de máximo 100 caracteres' });

  try {
    const result = await pool.query(
      'INSERT INTO contactos (nombre, email, telefono, empresa) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre.trim(), email, telefono ?? null, empresa ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ error: 'El email ya está registrado' });
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
  const { nota } = req.body ?? {};

  if (typeof nota !== 'string' || nota.trim() === '') {
    return res.status(400).json({ error: 'La nota es obligatoria y debe ser texto' });
  }

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

// Primero se prepara la base de datos; solo entonces se acepta tráfico
const start = async () => {
  await initSchema();
  console.log('✅ Tabla contactos lista');
  app.listen(port, () => console.log(`🚀 Servidor CRM corriendo en el puerto ${port}`));
};

start().catch((err) => {
  console.error('❌ No se pudo iniciar la API:', err);
  process.exit(1);
});