import type { Request, Response } from 'express';
import { HttpError } from '../errors';
import * as repo from '../repositories/contactos';
import { validarId, validarNota, validarNuevoContacto } from '../validators/contactos';

// Cada controlador: valida la entrada -> llama a la capa de datos -> responde.
// Los errores se lanzan (throw) y los atrapa el middleware de errores.

export const crear = async (req: Request, res: Response) => {
  const datos = validarNuevoContacto(req.body);
  res.status(201).json(await repo.crear(datos));
};

export const listar = async (req: Request, res: Response) => {
  const buscar = typeof req.query.buscar === 'string' ? req.query.buscar : undefined;
  res.json(await repo.listar(buscar));
};

export const obtener = async (req: Request, res: Response) => {
  const contacto = await repo.obtenerPorId(validarId(String(req.params.id)));
  if (!contacto) throw new HttpError(404, 'Contacto no encontrado');
  res.json(contacto);
};

export const agregarNota = async (req: Request, res: Response) => {
  const nota = validarNota(req.body);
  const contacto = await repo.agregarNota(validarId(String(req.params.id)), nota);
  if (!contacto) throw new HttpError(404, 'Contacto no encontrado');
  res.json(contacto);
};

export const eliminar = async (req: Request, res: Response) => {
  const eliminado = await repo.eliminar(validarId(String(req.params.id)));
  if (!eliminado) throw new HttpError(404, 'Contacto no encontrado');
  res.json({ mensaje: 'Contacto eliminado' });
};
