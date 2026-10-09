import express from 'express';
import contactosRouter from './routes/contactos';
import { manejadorErrores, rutaNoEncontrada } from './middleware/errores';

// Construye la app sin levantar el servidor, para poder probarla (tests).
export const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/contactos', contactosRouter);
  app.use(rutaNoEncontrada);
  app.use(manejadorErrores);
  return app;
};
