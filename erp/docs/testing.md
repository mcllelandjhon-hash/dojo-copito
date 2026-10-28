# Estrategia de pruebas — ERP Copito

## Pirámide de pruebas

| Nivel | Herramienta | Qué cubre | Dónde |
|---|---|---|---|
| Unitaria (backend) | Vitest | Reglas puras: totales e IGV, estados de factura, validación de stock, antigüedad de saldos, correlativos | `apps/api/tests/logic.test.ts` |
| Integración API | Vitest + Supertest | Flujo completo contra una base SQLite de prueba: login, permisos por rol, stock → venta → factura → pagos, dashboard | `apps/api/tests/api.test.ts` |
| Unitaria (frontend) | Vitest | Formato de dinero/fechas y traducción de estados | `apps/web/tests/format.test.ts` |
| Componentes | Testing Library | Render de componentes base (StatCard, Badge) y sus tonos/etiquetas | `apps/web/tests/ui.test.tsx` |
| Tipos | TypeScript (`tsc --noEmit`) | Seguridad de tipos en API y web | ambos paquetes |

## Cómo se ejecutan

```bash
cd erp
npm install
npm test         # todas las suites (api + web)
npm run typecheck
```

La suite de integración crea su propia base (`prisma/test.db`), aplica el esquema con `prisma db push`, siembra un admin y un lector, y corre el flujo comercial entero. No toca la base de desarrollo.

## Casos críticos cubiertos

1. Login con credenciales correctas e incorrectas; rechazo sin token (401).
2. Un rol VIEWER no puede crear clientes (403).
3. El stock entra solo por movimientos y se refleja en el producto.
4. Al confirmar una venta: baja el stock, se genera la factura y el total incluye IGV 18%.
5. Una venta sin stock suficiente se rechaza (400) sin alterar el inventario (transacción).
6. Pagos: el sobrepago se rechaza; pago parcial → `PARTIAL`; pago total → `PAID`.
7. El dashboard suma la venta del mes y las cuentas por cobrar quedan en cero tras pagar.

## CI

GitHub Actions (`.github/workflows/erp-ci.yml`) corre en cada push/PR que toque `erp/`: instala dependencias, genera el cliente Prisma, verifica tipos y ejecuta todas las pruebas en Node 20.

## Qué queda recomendado a futuro

- E2E con Playwright para el flujo visual de login → venta → cobro.
- Pruebas de carga ligeras en los endpoints de reportes.
- Cobertura mínima objetivo: 70% en `domain/` y `routes/`.
