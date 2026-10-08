# CRM API REST - Prueba Técnica

API REST para gestionar contactos de clientes de un CRM, hecha con Node.js, Express y TypeScript, con PostgreSQL levantado mediante Docker Compose.

## Tecnologías
- Node.js 18+, Express 5, TypeScript (ejecutado con `tsx`)
- PostgreSQL 15 (Docker Compose), cliente `pg` con consultas parametrizadas
- Git

## Requisitos previos
- [Node.js](https://nodejs.org/) 18 o superior
- [Docker Desktop](https://www.docker.com/) abierto

## Instalación y ejecución

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. (Opcional) Copiar la configuración de ejemplo. Sin `.env` se usan los mismos valores por defecto:
   ```bash
   cp .env.example .env
   ```
3. Levantar PostgreSQL con Docker Compose:
   ```bash
   docker compose up -d
   ```
4. Arrancar la API (crea la tabla `contactos` si no existe):
   ```bash
   npm run dev
   ```
   La API queda en `http://localhost:3000`. Para detener la base de datos: `docker compose down` (agrega `-v` para borrar también los datos).

## Endpoints

Base: `http://localhost:3000/api/contactos`

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/contactos` | Crear contacto |
| GET | `/api/contactos?buscar=texto` | Listar; `buscar` filtra por nombre o empresa |
| GET | `/api/contactos/:id` | Ver un contacto |
| PATCH | `/api/contactos/:id/notas` | Agregar una nota |
| DELETE | `/api/contactos/:id` | Eliminar (extra) |

### Crear contacto
```bash
curl -X POST http://localhost:3000/api/contactos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Ana Pérez","email":"ana@acme.com","telefono":"3001234567","empresa":"Acme"}'
```
Respuesta `201`:
```json
{ "id": 1, "nombre": "Ana Pérez", "empresa": "Acme", "email": "ana@acme.com", "telefono": "3001234567", "notas": null, "fecha_creacion": "2026-10-07T15:00:00.000Z" }
```

### Listar y buscar
```bash
curl http://localhost:3000/api/contactos
curl "http://localhost:3000/api/contactos?buscar=acme"
```

### Ver por id
```bash
curl http://localhost:3000/api/contactos/1
```

### Agregar nota
```bash
curl -X PATCH http://localhost:3000/api/contactos/1/notas \
  -H "Content-Type: application/json" \
  -d '{"nota":"Llamada de seguimiento el 5 de octubre"}'
```
Las notas se acumulan en el campo `notas`, una por línea.

### Eliminar
```bash
curl -X DELETE http://localhost:3000/api/contactos/1
```

### Errores

| Código | Cuándo | Ejemplo de respuesta |
|--------|--------|----------------------|
| 400 | Nombre ausente/vacío, correo con formato inválido, campos que no son texto o superan el largo permitido, nota vacía, id no numérico | `{"error":"Formato de correo inválido"}` |
| 404 | El contacto no existe | `{"error":"Contacto no encontrado"}` |
| 409 | Ya existe un contacto con ese correo | `{"error":"El email ya está registrado"}` |
| 500 | Error inesperado del servidor | `{"error":"Error interno del servidor"}` |

## Decisiones de diseño
- **Las notas viven en una columna `TEXT`** del contacto. Es lo más simple para el alcance de la prueba; con más tiempo usaría una tabla `notas` (con fecha y autor) relacionada por `contacto_id`.
- **La tabla se crea al arrancar** con `CREATE TABLE IF NOT EXISTS`. Es suficiente aquí; en un proyecto real usaría migraciones.
- **Consultas parametrizadas** (`$1`, `$2`) para evitar inyección SQL.
- **`PATCH` para notas** porque modifica parcialmente un recurso existente.

## Qué mejoraría con más tiempo
- Pruebas automatizadas (por ejemplo Vitest + Supertest) con una base de datos de prueba.
- Paginación en el listado.
- Migraciones, y separar rutas, controladores y validación en archivos distintos (hoy todo está en `src/index.ts`).
- Arreglar la configuración de `tsconfig.json`: `npx tsc --noEmit` reporta errores de módulos (ESM vs CommonJS). No afecta la ejecución con `tsx`.
- Tabla de notas, `PUT` para editar contactos y un manejador de errores centralizado.

## Uso de IA
- **Qué usé:** Gemini para generar el esqueleto inicial (configuración, tabla y endpoints) y Claude Code para revisar el repositorio, corregir problemas y redactar parte de este README.
- **Qué corregí o verifiqué:**
  - La API borraba la tabla con `DROP TABLE` en cada arranque, así que se perdían los datos; ahora usa `CREATE TABLE IF NOT EXISTS`.
  - Un id no numérico (`/api/contactos/abc`) producía un error 500; ahora responde 400.
  - La validación aceptaba valores que no eran texto; ahora se comprueban tipos y longitudes.
  - Un correo duplicado respondía 400; lo cambié a 409.
  - Un mensaje de commit mencionaba un `PUT` que ya no existe en el código; lo dejé anotado en el PR.
  - Probé cada endpoint con `curl` contra PostgreSQL en Docker y comprobé los códigos 200, 201, 400, 404 y 409.
- **Qué entiendo y puedo explicar:** cada ruta de `src/index.ts`, por qué se usan consultas parametrizadas, y la diferencia entre los códigos 400, 404 y 409.
