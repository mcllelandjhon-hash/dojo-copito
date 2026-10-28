# Despliegue — ERP Copito

## Opción A: desarrollo local (la más simple)

```bash
cd erp
npm install
cp apps/api/.env.example apps/api/.env
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:4000 (salud: `/health`)
- Usuario demo: `admin@copito.local` / `Admin123!`

## Opción B: Docker Compose

```bash
cd erp
docker compose up --build
```

Levanta la API (puerto 4000) y la web servida con Nginx (puerto 8080 → http://localhost:8080). La base SQLite queda en un volumen persistente. Al primer arranque conviene sembrar:

```bash
docker compose exec api npm run db:seed
```

## Opción C: producción gratuita (la usada para el despliegue en vivo)

| Pieza | Servicio | Configuración |
|---|---|---|
| Base de datos | Neon (PostgreSQL, plan gratuito) | Proyecto nuevo; se usa su cadena de conexión **directa** (sin `-pooler`) como `DATABASE_URL`. |
| API | Render (Web Service, plan gratuito) | Repo dojo-copito, directorio raíz `erp`. Build: `npm install && npm run build -w @erp-copito/api` tras generar el cliente con el esquema de producción. Start: `cd apps/api && npx prisma db push --schema prisma/schema.prod.prisma && npm run db:seed && node dist/server.js`. Variables: `DATABASE_URL` (Neon), `JWT_SECRET` (largo y aleatorio), `CORS_ORIGIN` (la URL pública de la web). |
| Web | Render (Static Site, plan gratuito) | Directorio raíz `erp`. Build: `npm install && npm run build -w @erp-copito/web`. Publish: `apps/web/dist`. Variable: `VITE_API_URL` (la URL pública de la API). Regla de reescritura: `/* → /index.html` para que el enrutado SPA funcione. |

El repositorio trae `apps/api/prisma/schema.prod.prisma` (mismo modelo, proveedor `postgresql`) para producción, sin tocar el `schema.prisma` de desarrollo (SQLite). Los scripts `db:generate:prod` y `db:push:prod` de la API lo usan.

Notas de los planes gratuitos: la API de Render “duerme” tras ~15 minutos sin uso y el primer acceso puede tardar hasta un minuto; Neon ofrece un tamaño de base modesto, suficiente para una PYME que empieza.

### Seguridad antes de publicar

- Cambia `JWT_SECRET` por un valor largo y aleatorio.
- Cambia la contraseña del admin sembrado (o crea otro admin y desactiva el demo).
- Restringe `CORS_ORIGIN` a tu dominio real.
- Sirve todo por HTTPS (los proveedores sugeridos lo dan gratis).

## GitHub Pages y este ERP

Dojo Copito (la raíz del repositorio) se publica en GitHub Pages porque es estático. El ERP **no** puede correr solo en Pages: necesita la API y la base de datos. Lo correcto es desplegar la web del ERP como sitio estático y la API aparte, conectadas por `VITE_API_URL`.
