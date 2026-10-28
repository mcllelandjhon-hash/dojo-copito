# 🥋 Dojo Copito

**Aprende a programar con IA, desde tu propio rol en la empresa.**

Dojo Copito es una aplicación web interactiva y responsive que enseña a empleados
de cualquier área a programar con ayuda de asistentes de IA. No se necesita
experiencia previa: cada persona elige su rol y sigue una ruta práctica con
lecciones cortas, prompts de ejemplo y un mini proyecto aplicable a su trabajo.

## Roles incluidos

La app identifica los roles más comunes de una empresa y adapta la ruta a cada uno:

- 🧭 Dirección y Gerencia
- 💼 Ventas y Marketing
- 📦 Operaciones y Logística
- 💰 Finanzas y Contabilidad
- 🧑‍🤝‍🧑 Recursos Humanos
- 🎧 Atención al Cliente y Soporte
- 🏭 Producción y Calidad
- 💻 TI y Desarrollo
- 🗂️ Administración y Oficina

Cada ruta combina un **tronco común** (qué es programar con IA, anatomía de un
buen prompt, leer código, probar y corregir) con lecciones propias del área,
un prompt de ejemplo listo para copiar y un mini proyecto final.

## Funcionalidades

- Selector de roles con rutas de aprendizaje personalizadas
- Lecciones marcables con progreso persistente (localStorage) y sistema de cinturones
- Constructor de prompts: elige rol, tarea y nivel, y genera un prompt profesional listo para copiar
- Quiz interactivo de 5 preguntas con retroalimentación inmediata
- Reglas de oro para programar con IA de forma segura en la empresa
- Diseño responsive (celular, tablet y computadora), sin dependencias externas

## Cómo ejecutarla

Es un sitio estático (HTML, CSS y JavaScript puro). Basta con servir la carpeta:

```bash
# Con Python
python3 -m http.server 8000

# O con Node
npx serve .
```

Y abrir `http://localhost:8000` en el navegador.

## Despliegue

Publicada con **GitHub Pages** (costo: $0) desde este mismo repositorio.
Cada push a `main` actualiza el sitio automáticamente.

## 🧩 ERP Copito (nuevo)

Este repositorio también contiene **[ERP Copito](erp/)**, un sistema de gestión empresarial completo (backend + frontend + base de datos) en la carpeta [`erp/`](erp/): ventas, compras, inventario, facturación, finanzas, RR. HH., tareas y reportes, con su propia documentación de arquitectura, API, diseño, pruebas y despliegue. Ver [erp/README.md](erp/README.md).

## Licencia

Proyecto educativo de uso libre para capacitación interna.
