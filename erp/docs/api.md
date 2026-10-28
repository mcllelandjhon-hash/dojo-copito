# API del ERP Copito

Base: `http://localhost:4000` — todas las rutas de negocio viven bajo `/api/v1` y requieren JWT salvo `/health` y el login.

## Formato de respuesta

```json
{ "data": { } }
```

Listados paginados:

```json
{ "data": [ ], "meta": { "page": 1, "pageSize": 20, "total": 57, "pages": 3 } }
```

Errores:

```json
{ "error": { "message": "Descripción del problema" } }
```

Parámetros comunes de listado: `?page=1&pageSize=20&q=texto`.

## Autenticación

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/auth/login` | Body `{email, password}` → `{token, user}` |
| GET | `/api/v1/auth/me` | Usuario de la sesión actual |
| GET/POST | `/api/v1/users` | Solo ADMIN: listar y crear usuarios |
| PATCH | `/api/v1/users/:id` | Solo ADMIN: editar usuario/rol/contraseña |

Roles: `ADMIN`, `MANAGER`, `SALES`, `WAREHOUSE`, `ACCOUNTING`, `HR`, `VIEWER`. ADMIN puede todo; cada módulo restringe la escritura a sus roles (ver arquitectura).

## Módulos y endpoints

| Módulo | Endpoints |
|---|---|
| Panel | `GET /api/v1/dashboard/summary` |
| Reportes | `GET /api/v1/reports/top-products`, `GET /api/v1/reports/sales-by-month`, `GET /api/v1/reports/inventory-valuation` |
| Clientes | CRUD `/api/v1/customers` |
| Proveedores | CRUD `/api/v1/suppliers` |
| Categorías | CRUD `/api/v1/categories` |
| Productos | CRUD `/api/v1/products`, `GET /api/v1/products/low-stock` |
| Inventario | `GET/POST /api/v1/inventory/movements` |
| Ventas | `GET/POST /api/v1/sales`, `GET /api/v1/sales/:id`, `POST /api/v1/sales/:id/confirm`, `POST /api/v1/sales/:id/fulfill`, `POST /api/v1/sales/:id/cancel` |
| Compras | `GET/POST /api/v1/purchases`, `GET /api/v1/purchases/:id`, `POST /api/v1/purchases/:id/receive`, `POST /api/v1/purchases/:id/cancel` |
| Facturas | `GET /api/v1/invoices?kind=RECEIVABLE\|PAYABLE&status=`, `GET /api/v1/invoices/aging?kind=`, `GET /api/v1/invoices/:id`, `POST /api/v1/invoices/:id/payments` |
| Finanzas | CRUD `/api/v1/finance/transactions` |
| RR. HH. | CRUD `/api/v1/employees`, CRUD `/api/v1/departments` |
| Tareas | CRUD `/api/v1/tasks` |
| Ajustes | `GET/PUT /api/v1/settings` (PUT solo ADMIN) |
| Auditoría | `GET /api/v1/audit` (últimos 100 eventos) |
| Salud | `GET /health` |

## Ejemplos

Crear un pedido de venta:

```http
POST /api/v1/sales
Authorization: Bearer <token>
Content-Type: application/json

{ "customerId": "…", "items": [ { "productId": "…", "quantity": 2 } ] }
```

El precio se toma del producto si no se envía `unitPriceCents` en la línea. La respuesta incluye subtotal, IGV y total en centavos.

Confirmar el pedido (descuenta stock y genera la factura):

```http
POST /api/v1/sales/:id/confirm
```

Registrar un pago:

```http
POST /api/v1/invoices/:id/payments
{ "amountCents": 10000, "method": "YAPE", "reference": "Op. 12345" }
```

## Convenciones

- **Dinero siempre en centavos** (`amountCents`, `totalCents`, …) para evitar errores de decimales.
- Los documentos usan correlativos: pedidos `PED-000001`, compras `OC-000001`, facturas `FAC-000001`.
- Las acciones de flujo (`confirm`, `receive`, `cancel`, pagos) son transaccionales: o se aplican por completo o no se aplica nada.
