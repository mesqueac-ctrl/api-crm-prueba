import { HttpError } from '../errors';
import type { NuevoContacto } from '../repositories/contactos';

const MAX_ID = 2147483647; // máximo de un INTEGER en Postgres

const esEmailValido = (email: unknown): email is string =>
  typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Un campo opcional debe ser texto (o no venir) y respetar la longitud de la columna
const textoOpcional = (valor: unknown, max: number, campo: string): string | null => {
  if (valor === undefined || valor === null) return null;
  if (typeof valor !== 'string' || valor.length > max) {
    throw new HttpError(400, `${campo} debe ser texto de máximo ${max} caracteres`);
  }
  return valor;
};

// El id debe ser un entero positivo; si no, Postgres lanzaría un error de tipo (500)
export const validarId = (id: string): number => {
  if (!/^\d+$/.test(id) || Number(id) > MAX_ID) {
    throw new HttpError(400, 'El id debe ser un número entero positivo');
  }
  return Number(id);
};

export const validarNuevoContacto = (body: any): NuevoContacto => {
  const { nombre, email, telefono, empresa } = body ?? {};

  if (typeof nombre !== 'string' || nombre.trim() === '') {
    throw new HttpError(400, 'El nombre es obligatorio');
  }
  if (nombre.length > 100) throw new HttpError(400, 'El nombre no puede superar 100 caracteres');
  if (!esEmailValido(email)) throw new HttpError(400, 'Formato de correo inválido');
  if (email.length > 100) throw new HttpError(400, 'El correo no puede superar 100 caracteres');

  return {
    nombre: nombre.trim(),
    email,
    telefono: textoOpcional(telefono, 20, 'El teléfono'),
    empresa: textoOpcional(empresa, 100, 'La empresa'),
  };
};

export const validarNota = (body: any): string => {
  const nota = body?.nota;
  if (typeof nota !== 'string' || nota.trim() === '') {
    throw new HttpError(400, 'La nota es obligatoria y debe ser texto');
  }
  return nota;
};
