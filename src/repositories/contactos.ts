import pool from '../db';

export interface NuevoContacto {
  nombre: string;
  email: string;
  telefono: string | null;
  empresa: string | null;
}

export interface Contacto extends NuevoContacto {
  id: number;
  notas: string | null;
  fecha_creacion: Date;
}

// Capa de datos: es el único lugar donde se escribe SQL.

export const crear = async (c: NuevoContacto): Promise<Contacto> => {
  const result = await pool.query(
    'INSERT INTO contactos (nombre, email, telefono, empresa) VALUES ($1, $2, $3, $4) RETURNING *',
    [c.nombre, c.email, c.telefono, c.empresa]
  );
  return result.rows[0];
};

export const listar = async (buscar?: string): Promise<Contacto[]> => {
  if (buscar) {
    const result = await pool.query(
      'SELECT * FROM contactos WHERE nombre ILIKE $1 OR empresa ILIKE $1 ORDER BY fecha_creacion DESC',
      [`%${buscar}%`]
    );
    return result.rows;
  }
  const result = await pool.query('SELECT * FROM contactos ORDER BY fecha_creacion DESC');
  return result.rows;
};

export const obtenerPorId = async (id: number): Promise<Contacto | null> => {
  const result = await pool.query('SELECT * FROM contactos WHERE id = $1', [id]);
  return result.rows[0] ?? null;
};

export const agregarNota = async (id: number, nota: string): Promise<Contacto | null> => {
  const result = await pool.query(
    `UPDATE contactos SET notas = CONCAT(COALESCE(notas, ''), '\n- ', $1::text) WHERE id = $2 RETURNING *`,
    [nota, id]
  );
  return result.rows[0] ?? null;
};

export const eliminar = async (id: number): Promise<boolean> => {
  const result = await pool.query('DELETE FROM contactos WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
};
