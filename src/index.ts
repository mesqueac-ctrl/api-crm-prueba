import { createApp } from './app';
import pool, { initSchema } from './db';

const port = process.env.PORT || 3000;

// Primero se prepara la base de datos; solo entonces se acepta tráfico
const start = async () => {
  await initSchema();
  console.log('✅ Tabla contactos lista');
  createApp().listen(port, () => console.log(`🚀 Servidor CRM corriendo en el puerto ${port}`));
};

start().catch(async (err) => {
  console.error('❌ No se pudo iniciar la API:', err);
  await pool.end();
  process.exit(1);
});
