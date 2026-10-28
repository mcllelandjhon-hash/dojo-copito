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

## Opción C: producción

Arquitectura recomendada de bajo costo:

| Pieza | Servicio sugerido | Notas |
|---|---|---|
| Web (build de Vite) | GitHub Pages, Netlify, Vercel o Cloudflare Pages | Es estática; define `VITE_API_URL` con la URL pública de la API. |
| API | Render, Railway, Fly.io o un VPS con Docker | Variables: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `PORT`. |
| Base de datos | PostgreSQL gestionado (Neon, Supabase, Render) | Cambia el proveedor en `prisma/schema.prisma` a `postgresql`, genera la migración y usa la URL del proveedor. |

Pasos de producción para la API:

```bash
npm ci
npm run db:generate
npx prisma migrate deploy   # con PostgreSQL y migraciones generadas
npm run build
npm start
```

### Seguridad antes de publicar

- Cambia `JWT_SECRET` por un valor largo y aleatorio.
- Cambia la contraseña del admin sembrado (o crea otro admin y desactiva el demo).
- Restringe `CORS_ORIGIN` a tu dominio real.
- Sirve todo por HTTPS (los proveedores sugeridos lo dan gratis).

## GitHub Pages y este ERP

Dojo Copito (la raíz del repositorio) se publica en GitHub Pages porque es estático. El ERP **no** puede correr solo en Pages: necesita la API y la base de datos. Lo correcto es desplegar la web del ERP como sitio estático y la API aparte, conectadas por `VITE_API_URL`.
