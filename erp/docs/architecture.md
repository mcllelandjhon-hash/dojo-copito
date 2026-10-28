# Arquitectura del ERP Copito

## 1. Propósito

ERP Copito es un sistema de gestión empresarial modular para PYMES. Vive en el mismo repositorio que Dojo Copito, pero como una aplicación independiente dentro de `/erp`, para no mezclar el sitio estático educativo con el sistema transaccional.

## 2. Decisión de stack

| Capa | Tecnología | Motivo |
|---|---|---|
| Lenguaje | TypeScript en todo el proyecto | Un solo lenguaje, tipos compartidos y menor costo de mantenimiento. |
| Frontend | React + Vite | SPA rápida, componentes reutilizables y build simple. |
| Backend | Node.js + Express | API REST madura, flexible y fácil de desplegar. |
| Base de datos | Prisma ORM + SQLite en desarrollo; PostgreSQL en producción | Desarrollo sin fricción y migración a un motor empresarial sin reescribir la lógica. |
| Autenticación | JWT + bcrypt | Sesiones stateless y contraseñas con hash. |
| Validación | Zod | Contratos de entrada explícitos y errores consistentes. |
| Pruebas | Vitest + Supertest + Testing Library | Unitarias, integración API y componentes. |
| Contenedores | Docker + Docker Compose | Entorno reproducible para API, web y base de datos. |
| CI | GitHub Actions | Instala, genera Prisma, ejecuta lint de tipos y pruebas en cada cambio. |

## 3. Estilo arquitectónico

Se usa una **arquitectura modular por dominio**, con una API REST versionada.

```text
erp/
├── apps/
│   ├── api/                 # Backend
│   │   ├── prisma/          # Esquema, migraciones y seed
│   │   ├── src/
│   │   │   ├── config/      # Entorno y constantes
│   │   │   ├── domain/      # Reglas puras de negocio
│   │   │   ├── middleware/  # Auth, roles, errores, auditoría
│   │   │   ├── routes/      # Endpoints HTTP por módulo
│   │   │   ├── services/    # Casos de uso y transacciones
│   │   │   └── utils/       # Respuestas, paginación, fechas
│   │   └── tests/
│   └── web/                 # Frontend React
│       ├── src/
│       │   ├── components/  # UI reutilizable
│       │   ├── lib/         # Cliente API, sesión, formatos
│       │   ├── pages/       # Pantallas por módulo
│       │   └── styles/      # Design system CSS
│       └── tests/
├── docs/                    # Arquitectura, API, diseño, pruebas y despliegue
└── docker-compose.yml
```

## 4. Flujo de una petición

```text
React SPA
  │  HTTPS + JWT
  ▼
Express Router (/api/v1/...)
  │
  ├─ Middleware de autenticación y autorización por rol
  ├─ Validación Zod del request
  ▼
Service del módulo
  │
  ├─ Reglas de negocio puras (domain)
  ├─ Transacciones de base de datos
  └─ Registro de auditoría
  ▼
Prisma ──► SQLite (dev) / PostgreSQL (prod)
```

## 5. Módulos funcionales

1. **Seguridad y administración:** usuarios, roles, permisos por módulo, auditoría y configuración de empresa.
2. **Dashboard:** KPIs de ventas, compras, inventario, cuentas por cobrar/pagar y flujo del mes.
3. **Clientes y CRM básico:** datos fiscales, contacto, estado y saldo.
4. **Proveedores:** datos de contacto, documento y estado.
5. **Productos e inventario:** categorías, SKU, costos, precios, stock, movimientos y alertas de stock mínimo.
6. **Ventas:** cotizaciones convertidas en pedidos, flujo de estados, control de stock, facturación y cobranza.
7. **Compras:** órdenes a proveedores, aprobación y recepción con ingreso de stock.
8. **Finanzas:** facturas por cobrar/pagar, pagos parciales/totales, ingresos, egresos y flujo de caja.
9. **Recursos humanos:** departamentos, cargos y empleados.
10. **Tareas internas:** responsables, prioridad, vencimiento y estado.
11. **Reportes:** ventas por periodo, productos más vendidos, valorización de inventario y antigüedad de saldos.

## 6. Reglas de negocio centrales

- El dinero se almacena en **centavos enteros** para evitar errores de redondeo.
- El stock nunca se edita “a mano” en el producto: cambia solo mediante **movimientos de inventario** auditables.
- Confirmar un pedido de venta descuenta stock; si no hay stock suficiente, toda la transacción se revierte.
- Recibir una orden de compra ingresa stock y genera la cuenta por pagar.
- Confirmar una venta genera su factura por cobrar.
- Los pagos actualizan el estado de la factura: `UNPAID`, `PARTIAL` o `PAID`.
- Cancelar un documento revierte sus efectos de stock cuando corresponde.
- Toda mutación relevante queda en el registro de auditoría con usuario, acción, entidad y detalle.

## 7. Seguridad

- Contraseñas con hash bcrypt; nunca se devuelven en respuestas.
- JWT firmado con secreto configurable, expiración por defecto de 8 horas.
- Autorización por roles: ADMIN, MANAGER, SALES, WAREHOUSE, ACCOUNTING, HR y VIEWER.
- Validación de todos los cuerpos de petición con Zod.
- Cabeceras de seguridad con Helmet y CORS restringible por entorno.
- Rate limiting básico en autenticación.
- Variables sensibles solo por entorno; `.env.example` no contiene secretos reales.

## 8. Escalamiento futuro

- Separar reportes pesados a consultas programadas o vistas materializadas.
- Añadir colas para correos, documentos PDF y notificaciones.
- Multi-empresa (tenancy) agregando `companyId` a las entidades raíz.
- Sustituir SQLite por PostgreSQL cambiando `DATABASE_URL` y el proveedor de Prisma en producción.
