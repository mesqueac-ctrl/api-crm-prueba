import type { ErrorRequestHandler, RequestHandler } from 'express';
import { HttpError } from '../errors';

// Ruta inexistente -> 404 en JSON (en lugar del HTML por defecto de Express)
export const rutaNoEncontrada: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
};

// Único lugar donde se decide la respuesta ante un error.
// Express 5 envía aquí también los errores de handlers async.
export const manejadorErrores: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  // Postgres: violación de restricción UNIQUE (correo repetido)
  if (err?.code === '23505') {
    res.status(409).json({ error: 'El email ya está registrado' });
    return;
  }
  // express.json(): el cuerpo no es un JSON válido
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
};
