# Sistema de diseño — ERP Copito

## Principios

1. **Claridad operativa:** es una herramienta de trabajo diario; cada pantalla responde a una tarea concreta (vender, cobrar, reponer, pagar).
2. **Consistencia:** mismos patrones en todos los módulos: encabezado de página, buscador, tabla, modal de creación/edición y avisos (toast).
3. **Estados siempre visibles:** badges de color para estados de documentos, facturas y stock.
4. **Responsive real:** en móvil la barra lateral se convierte en menú desplegable y las tablas permiten desplazamiento horizontal.

## Tokens (en `apps/web/src/styles/app.css`)

| Token | Valor | Uso |
|---|---|---|
| `--brand` | `#4f46e5` | Acciones principales, enlaces, foco |
| `--brand-2` | `#7c5cff` | Degradados y gráficos |
| `--accent` | `#f59e0b` | Marca y destaques |
| `--ink` / `--ink-2` | `#17203a` / `#5a6380` | Texto principal / secundario |
| `--bg` / `--surface` | `#f4f6fb` / `#ffffff` | Fondo / tarjetas |
| `--ok`, `--warn`, `--bad` | verde, ámbar, rojo | Estados correctos, atención y error |
| `--radius` | `14px` | Bordes de tarjetas y paneles |
| `--shadow` | suave | Elevación de tarjetas |

## Componentes base (`apps/web/src/components/ui.tsx`)

- `StatCard`: KPI con ícono, valor y ayuda.
- `Badge`: estado con tono semántico (ok/warn/bad/neutral) y etiqueta en español.
- `PageHead`: título, subtítulo y acción principal.
- `EntityForm`: formulario generado desde una lista de campos (texto, número, fecha, select), con error integrado.
- `Modal`: diálogo accesible (cierre con Escape y clic fuera, `role="dialog"`).
- `Toast`: confirmación breve de acciones.
- `EmptyState`: estado vacío con guía de siguiente paso.

## Patrones de pantalla

- **Listados:** tabla con búsqueda, badges de estado y acciones por fila.
- **Creación/edición:** siempre en modal; nunca se pierde el contexto de la lista.
- **Flujos de documentos:** botones de acción (Confirmar, Recibir, Cancelar, Registrar pago) que llaman a la API y muestran el nuevo estado al instante.
- **Panel:** tarjetas KPI + alertas accionables (stock bajo).
- **Tareas:** tablero kanban de tres columnas; clic para avanzar estado.

## Accesibilidad

- Etiquetas `aria-label` en botones de solo ícono y campos de búsqueda.
- Errores de formulario con `role="alert"`.
- Contraste de texto sobre fondos de estado verificado visualmente.
- Foco visible del navegador sin eliminar.
