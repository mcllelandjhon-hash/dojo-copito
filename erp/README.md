# 🧩 ERP Copito

Sistema de gestión empresarial (ERP) modular para PYMES, desarrollado dentro del mismo repositorio que **Dojo Copito**. Cubre ventas, compras, inventario, facturación y cobranza, finanzas, recursos humanos, tareas y reportes, con autenticación por roles y auditoría.

## Inicio rápido

```bash
cd erp
npm install

cp apps/api/.env.example apps/api/.env
npm run db:generate
npm run db:push
npm run db:seed

npm run dev
```

- **Web:** http://localhost:5173
- **API:** http://localhost:4000 · salud en `/health`
- **Usuario demo:** `admin@copito.local` / `Admin123!` (también `ventas@copito.local` / `Ventas123!`)

Con Docker: `docker compose up --build` → web en http://localhost:8080.

## Stack

TypeScript en todo el proyecto · React + Vite · Node.js + Express · Prisma (SQLite en desarrollo, PostgreSQL en producción) · JWT + bcrypt · Zod · Vitest + Supertest + Testing Library · Docker · GitHub Actions.

## Módulos

Panel de KPIs · Ventas (pedidos, stock y factura automática) · Compras (recepción e ingreso de stock) · Productos e inventario con movimientos y alertas · Clientes · Proveedores · Facturas por cobrar/pagar con pagos parciales · Finanzas · Recursos humanos · Tareas (kanban) · Reportes · Usuarios, roles y auditoría.

## Documentación

- [Arquitectura](docs/architecture.md) — decisiones, capas, módulos y reglas de negocio.
- [API](docs/api.md) — endpoints, ejemplos y convenciones.
- [Sistema de diseño](docs/design-system.md) — tokens y componentes.
- [Pruebas](docs/testing.md) — estrategia y casos críticos.
- [Despliegue](docs/deployment.md) — local, Docker y producción.

## Pruebas

```bash
npm test          # backend: unitarias + integración · frontend: utilidades + componentes
npm run typecheck
```

## Estructura

```text
erp/
├── apps/api    # API REST (Express + Prisma) y sus pruebas
├── apps/web    # SPA React y sus pruebas
├── docs/       # Documentación del sistema
└── docker-compose.yml
```
