import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

// Se simula la capa de datos: estas pruebas verifican rutas, validaciones y errores sin base de datos.
vi.mock('../src/repositories/contactos');

import { createApp } from '../src/app';
import * as repo from '../src/repositories/contactos';

const app = createApp();
const contacto = {
  id: 1,
  nombre: 'Ana',
  email: 'ana@acme.com',
  telefono: null,
  empresa: 'Acme',
  notas: null,
  fecha_creacion: new Date('2026-10-08T00:00:00Z'),
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('POST /api/contactos', () => {
  it('crea un contacto válido y responde 201', async () => {
    vi.mocked(repo.crear).mockResolvedValue(contacto);
    const res = await request(app).post('/api/contactos').send({ nombre: 'Ana', email: 'ana@acme.com', empresa: 'Acme' });
    expect(res.status).toBe(201);
    expect(res.body.nombre).toBe('Ana');
    expect(repo.crear).toHaveBeenCalledWith({ nombre: 'Ana', email: 'ana@acme.com', telefono: null, empresa: 'Acme' });
  });

  it('responde 400 si falta el nombre', async () => {
    const res = await request(app).post('/api/contactos').send({ email: 'ana@acme.com' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('El nombre es obligatorio');
  });

  it('responde 400 si el correo tiene formato inválido', async () => {
    const res = await request(app).post('/api/contactos').send({ nombre: 'Ana', email: 'no-es-correo' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Formato de correo inválido');
  });

  it('responde 400 si el nombre no es texto', async () => {
    const res = await request(app).post('/api/contactos').send({ nombre: 123, email: 'ana@acme.com' });
    expect(res.status).toBe(400);
  });

  it('responde 409 si el correo ya existe', async () => {
    vi.mocked(repo.crear).mockRejectedValue({ code: '23505' });
    const res = await request(app).post('/api/contactos').send({ nombre: 'Ana', email: 'ana@acme.com' });
    expect(res.status).toBe(409);
  });

  it('responde 400 si el JSON está mal formado', async () => {
    const res = await request(app).post('/api/contactos').set('Content-Type', 'application/json').send('{mal');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/contactos', () => {
  it('lista contactos y pasa el texto de búsqueda', async () => {
    vi.mocked(repo.listar).mockResolvedValue([contacto]);
    const res = await request(app).get('/api/contactos?buscar=acme');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(repo.listar).toHaveBeenCalledWith('acme');
  });
});

describe('GET /api/contactos/:id', () => {
  it('devuelve el contacto si existe', async () => {
    vi.mocked(repo.obtenerPorId).mockResolvedValue(contacto);
    const res = await request(app).get('/api/contactos/1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it('responde 404 si no existe', async () => {
    vi.mocked(repo.obtenerPorId).mockResolvedValue(null);
    const res = await request(app).get('/api/contactos/999');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Contacto no encontrado');
  });

  it('responde 400 si el id no es numérico', async () => {
    const res = await request(app).get('/api/contactos/abc');
    expect(res.status).toBe(400);
    expect(repo.obtenerPorId).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/contactos/:id/notas', () => {
  it('agrega una nota', async () => {
    vi.mocked(repo.agregarNota).mockResolvedValue({ ...contacto, notas: '\n- Llamar el 5' });
    const res = await request(app).patch('/api/contactos/1/notas').send({ nota: 'Llamar el 5' });
    expect(res.status).toBe(200);
    expect(repo.agregarNota).toHaveBeenCalledWith(1, 'Llamar el 5');
  });

  it('responde 400 si la nota está vacía', async () => {
    const res = await request(app).patch('/api/contactos/1/notas').send({ nota: '  ' });
    expect(res.status).toBe(400);
  });

  it('responde 404 si el contacto no existe', async () => {
    vi.mocked(repo.agregarNota).mockResolvedValue(null);
    const res = await request(app).patch('/api/contactos/999/notas').send({ nota: 'hola' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/contactos/:id', () => {
  it('elimina un contacto existente', async () => {
    vi.mocked(repo.eliminar).mockResolvedValue(true);
    const res = await request(app).delete('/api/contactos/1');
    expect(res.status).toBe(200);
  });

  it('responde 404 si no existe', async () => {
    vi.mocked(repo.eliminar).mockResolvedValue(false);
    const res = await request(app).delete('/api/contactos/999');
    expect(res.status).toBe(404);
  });
});

describe('errores generales', () => {
  it('responde 500 ante un error inesperado', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(repo.listar).mockRejectedValue(new Error('boom'));
    const res = await request(app).get('/api/contactos');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Error interno del servidor');
  });

  it('responde 404 en JSON para una ruta inexistente', async () => {
    const res = await request(app).get('/api/otra-cosa');
    expect(res.status).toBe(404);
  });
});
