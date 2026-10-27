"use strict";

/* ============ Datos: roles de la empresa y sus rutas ============ */
const TRONCO_COMUN = [
  { title: "Qué es programar con IA (y qué no es)", mins: 10,
    desc: "La IA escribe código a partir de tus instrucciones. Tú eres el jefe del proyecto: defines el problema, revisas y decides." },
  { title: "Anatomía de un buen prompt", mins: 15,
    desc: "Rol + contexto + datos de entrada + resultado esperado + formato. Practica con el Constructor de prompts de abajo." },
  { title: "Leer código sin miedo", mins: 20,
    desc: "Aprende a leer el código que genera la IA: qué entra, qué se transforma y qué sale. Pídele que te lo explique línea por línea." },
  { title: "Probar y corregir (debugging con IA)", mins: 20,
    desc: "Cómo reportar un error a la IA: mensaje exacto, datos de ejemplo y qué esperabas que pasara. Itera en pasos pequeños." },
];

const ROLES = [
  {
    id: "gerencia", emoji: "🧭", name: "Dirección y Gerencia",
    desc: "Liderazgo, estrategia y toma de decisiones.",
    power: "Tableros automáticos con los números de la empresa actualizados sin pedir reportes a nadie.",
    project: "Un panel semanal que resume ventas, gastos y pendientes a partir de los archivos del equipo.",
    tasks: ["Crear un tablero de indicadores (KPIs) desde un Excel",
            "Resumir reportes largos en 5 puntos clave",
            "Generar una presentación de resultados desde datos"],
    prompt: "Actúa como analista de datos. Te paso una tabla con las ventas mensuales por sucursal. Escríbeme un script en Python que calcule el total por sucursal, la variación contra el mes anterior y genere un gráfico de barras. Explícame cada parte del código.",
    lessons: [
      { title: "Pedir resúmenes ejecutivos con código", mins: 15, desc: "Convierte tablas crudas en conclusiones: totales, promedios y variaciones, con gráficos listos para presentar." },
      { title: "Automatizar el reporte semanal", mins: 25, desc: "Un script que lee los archivos de la semana y arma el mismo informe, siempre con el mismo formato." },
      { title: "Tableros sin programar de cero", mins: 25, desc: "Pídele a la IA una página web simple que lea un CSV y muestre tus KPIs con filtros por fecha." },
    ],
  },
  {
    id: "ventas", emoji: "💼", name: "Ventas y Marketing",
    desc: "Clientes, campañas, cotizaciones y seguimiento comercial.",
    power: "Cotizaciones, listas de clientes y mensajes de seguimiento generados en minutos, no en horas.",
    project: "Un generador de cotizaciones: eliges productos y cantidades, y produce el documento listo para enviar.",
    tasks: ["Generar cotizaciones desde una lista de precios",
            "Limpiar y ordenar una base de clientes en Excel/CSV",
            "Crear mensajes personalizados de seguimiento para clientes"],
    prompt: "Actúa como asistente comercial. Escríbeme un programa que lea una lista de precios en CSV, me pida el nombre del cliente y los productos, y genere una cotización en un archivo de texto con el total y el IGV calculado. Quiero ver un ejemplo funcionando.",
    lessons: [
      { title: "Limpiar bases de clientes con IA", mins: 20, desc: "Quita duplicados, corrige formatos de teléfonos y correos, y separa nombres y apellidos automáticamente." },
      { title: "Cotizaciones automáticas", mins: 25, desc: "De la lista de precios al documento final: totales, descuentos e impuestos sin errores de calculadora." },
      { title: "Seguimiento que no se olvida", mins: 20, desc: "Un script que revisa tu lista y te dice a qué clientes toca escribirles hoy según su última compra." },
    ],
  },
  {
    id: "operaciones", emoji: "📦", name: "Operaciones y Logística",
    desc: "Inventarios, almacén, compras y despachos.",
    power: "Alertas de stock, control de inventarios y rutas de despacho sin revisar planillas a mano.",
    project: "Un control de inventario que avisa qué productos están por agotarse y arma la orden de compra sugerida.",
    tasks: ["Crear alertas de stock mínimo desde el inventario",
            "Comparar el inventario del sistema contra el conteo físico",
            "Armar listas de despacho ordenadas por ruta o zona"],
    prompt: "Actúa como programador. Tengo un CSV de inventario con columnas Producto, Stock y StockMinimo. Escríbeme un script que liste los productos con stock por debajo del mínimo, ordenados de más urgente a menos, y guarde el resultado en otro archivo.",
    lessons: [
      { title: "Tu inventario, tus reglas", mins: 20, desc: "Filtros, ordenamientos y alertas: el 80% del trabajo de operaciones es mover datos con reglas claras." },
      { title: "Conciliar conteos sin llorar", mins: 25, desc: "Cruza dos listas (sistema vs. conteo físico) y encuentra diferencias automáticamente." },
      { title: "Reportes de despacho en un clic", mins: 20, desc: "Genera la hoja del día ordenada como la necesita quien reparte, no como sale del sistema." },
    ],
  },
  {
    id: "finanzas", emoji: "💰", name: "Finanzas y Contabilidad",
    desc: "Pagos, cobros, planillas y reportes contables.",
    power: "Conciliaciones y reportes repetitivos hechos por script, con menos errores y trazabilidad total.",
    project: "Una conciliación automática: cruza el extracto del banco contra tu registro y marca las diferencias.",
    tasks: ["Conciliar un extracto bancario contra mis registros",
            "Detectar facturas duplicadas o vencidas en una lista",
            "Calcular planillas o comisiones desde una tabla"],
    prompt: "Actúa como contador programador. Te doy dos archivos: movimientos del banco y mi registro interno, ambos con Fecha, Descripción y Monto. Escríbeme un script que los cruce por fecha y monto, y me entregue una lista de los que no coinciden en ninguno de los dos lados.",
    lessons: [
      { title: "Conciliación automática paso a paso", mins: 30, desc: "El caso clásico: dos fuentes, una clave de cruce y una lista de diferencias para revisar." },
      { title: "Caza-duplicados y vencidos", mins: 20, desc: "Detecta facturas repetidas, montos raros y documentos por vencer sin revisar fila por fila." },
      { title: "Fórmulas que se vuelven scripts", mins: 20, desc: "Lo que hoy haces con fórmulas frágiles en Excel, mañana lo hace un script que cualquiera puede repetir." },
    ],
  },
  {
    id: "rrhh", emoji: "🧑‍🤝‍🧑", name: "Recursos Humanos",
    desc: "Personal, asistencia, planillas de datos y clima laboral.",
    power: "Control de asistencia, filtros de CVs y encuestas de clima procesados en minutos.",
    project: "Un reporte de asistencia mensual: tardanzas, faltas y horas extra por área, listo para revisar.",
    tasks: ["Resumir la asistencia del mes desde el registro de marcaciones",
            "Ordenar CVs según los requisitos de un puesto",
            "Analizar respuestas de una encuesta de clima laboral"],
    prompt: "Actúa como analista de recursos humanos. Tengo un CSV con las marcaciones del personal (Nombre, Fecha, HoraEntrada, HoraSalida). Escríbeme un script que calcule tardanzas y horas trabajadas por persona en el mes y me entregue una tabla resumen. No incluyas datos reales, trabaja con el ejemplo que te doy.",
    lessons: [
      { title: "Asistencia sin planillas eternas", mins: 25, desc: "De marcaciones sueltas a un resumen por persona y por área, con tardanzas y horas extra." },
      { title: "Filtrar CVs con criterios claros", mins: 20, desc: "Define los requisitos del puesto y deja que el código ordene; la decisión final siempre es humana." },
      { title: "Encuestas que se leen solas", mins: 20, desc: "Agrupa respuestas abiertas por tema y cuenta frecuencias para ver qué preocupa al equipo." },
    ],
  },
  {
    id: "atencion", emoji: "🎧", name: "Atención al Cliente y Soporte",
    desc: "Consultas, reclamos, tickets y satisfacción del cliente.",
    power: "Respuestas rápidas y consistentes: clasifica mensajes, sugiere respuestas y detecta reclamos urgentes.",
    project: "Un clasificador de mensajes de clientes: los ordena por tema y urgencia, y sugiere la respuesta base.",
    tasks: ["Clasificar mensajes de clientes por tema y urgencia",
            "Crear respuestas modelo para las preguntas más frecuentes",
            "Resumir reclamos largos en los datos que necesito registrar"],
    prompt: "Actúa como supervisor de atención al cliente. Escríbeme un programa que lea mensajes de clientes desde un archivo de texto, los clasifique en Consulta, Pedido, Reclamo o Urgente según palabras clave, y genere una tabla con el mensaje, su categoría y una respuesta sugerida corta y amable.",
    lessons: [
      { title: "Clasificar antes de responder", mins: 20, desc: "Ordena la bandeja por urgencia y tema para que nada importante se pierda entre mensajes simples." },
      { title: "Biblioteca de respuestas vivas", mins: 20, desc: "Genera y mejora tus respuestas frecuentes con ayuda de la IA, manteniendo el tono de tu empresa." },
      { title: "Del reclamo al dato", mins: 25, desc: "Extrae de cada reclamo el producto, el motivo y la fecha, y arma el registro sin copiar a mano." },
    ],
  },
  {
    id: "produccion", emoji: "🏭", name: "Producción y Calidad",
    desc: "Procesos, control de calidad y mantenimiento.",
    power: "Registros de producción analizados solos: defectos, paradas y tendencias visibles a tiempo.",
    project: "Un reporte de calidad que agrupa defectos por tipo y turno, y grafica los más frecuentes.",
    tasks: ["Analizar registros de producción y detectar paradas o caídas",
            "Agrupar defectos de calidad por tipo y frecuencia",
            "Crear una lista de chequeo digital para inspecciones"],
    prompt: "Actúa como ingeniero de calidad que programa. Tengo un CSV con registros de producción (Fecha, Turno, Producto, Cantidad, Defectos). Escríbeme un script que calcule el porcentaje de defectos por turno y genere un gráfico con los 5 productos con más defectos.",
    lessons: [
      { title: "Ver la producción en números", mins: 25, desc: "Totales por turno, por línea y por producto: el primer paso para mejorar cualquier proceso." },
      { title: "Pareto de defectos en minutos", mins: 20, desc: "El 20% de causas que explica el 80% de problemas, calculado y graficado automáticamente." },
      { title: "Listas de chequeo que se guardan", mins: 20, desc: "Una página simple para registrar inspecciones desde el celular y guardarlas como tabla." },
    ],
  },
  {
    id: "ti", emoji: "💻", name: "TI y Desarrollo",
    desc: "Sistemas, soporte técnico y desarrollo de software.",
    power: "Del ticket repetitivo al script reutilizable, y del script a herramientas internas para todo el equipo.",
    project: "Una herramienta interna pequeña que resuelva la tarea repetitiva más pedida por los usuarios.",
    tasks: ["Automatizar una tarea repetitiva de soporte con un script",
            "Crear una herramienta web interna para el equipo",
            "Documentar y explicar código heredado que nadie entiende"],
    prompt: "Actúa como desarrollador senior. Te paso un script que funciona pero está desordenado. Refactorízalo en funciones con nombres claros, agrega comentarios en español, maneja errores de lectura de archivos y dime qué cambiaste y por qué. No cambies su comportamiento.",
    lessons: [
      { title: "Pair programming con IA", mins: 25, desc: "Flujos reales: generar, revisar, probar, refactorizar. La IA como copiloto, tú como piloto." },
      { title: "De script a herramienta interna", mins: 30, desc: "Empaqueta tu automatización con una interfaz simple para que otros la usen sin tocar código." },
      { title: "Revisar código de IA como un senior", mins: 25, desc: "Seguridad, casos borde y pruebas: la lista de chequeo para aceptar código generado." },
    ],
  },
  {
    id: "administracion", emoji: "🗂️", name: "Administración y Oficina",
    desc: "Documentos, archivo, agenda y trámites internos.",
    power: "Documentos, actas y archivos renombrados, ordenados y resumidos sin trabajo manual repetitivo.",
    project: "Un organizador de documentos: renombra y ordena archivos por fecha y tipo siguiendo tu criterio.",
    tasks: ["Renombrar y ordenar muchos archivos según una regla",
            "Resumir actas o documentos largos en acuerdos y pendientes",
            "Convertir listas desordenadas en tablas limpias"],
    prompt: "Actúa como asistente de oficina que programa. Escríbeme un script que recorra una carpeta, y renombre cada archivo PDF con el formato AÑO-MES-TIPO-NOMBRE usando la fecha del archivo y palabras de su nombre actual. Primero muéstrame la lista de cambios sin aplicarlos, para revisarla.",
    lessons: [
      { title: "Archivos que se ordenan solos", mins: 20, desc: "Renombrar, mover y clasificar documentos por reglas es el primer script de casi toda oficina." },
      { title: "Actas en acuerdos y pendientes", mins: 20, desc: "Pega el texto, define el formato de salida y obtén la tabla lista para repartir tareas." },
      { title: "De texto desordenado a tabla", mins: 15, desc: "Listas pegadas de correos o chats convertidas en filas y columnas listas para Excel." },
    ],
  },
];

/* ============ Quiz ============ */
const QUIZ = [
  { q: "¿Cuál es el mejor primer paso antes de pedirle código a una IA?",
    opts: ["Pedirle “hazme un programa completo” sin más detalles",
           "Definir el problema, los datos de entrada y el resultado esperado",
           "Darle acceso a todos los archivos de la empresa"],
    ok: 1, why: "Un buen resultado empieza con un problema bien definido: entradas, salidas y formato." },
  { q: "La IA te entrega un código que “se ve bien”. ¿Qué haces?",
    opts: ["Lo ejecuto directo con los datos reales",
           "Le pido que me lo explique y lo pruebo con datos de ejemplo",
           "Lo reenvío al equipo para que lo use"],
    ok: 1, why: "Se revisa y se prueba en pequeño primero. La IA puede equivocarse con mucha seguridad." },
  { q: "¿Qué información NO deberías pegar en un chat de IA no autorizado?",
    opts: ["Un ejemplo inventado con datos falsos",
           "La lista de tareas de tu área",
           "Contraseñas y datos personales de clientes"],
    ok: 2, why: "Datos sensibles solo van en herramientas aprobadas por la empresa. Para practicar, usa datos inventados." },
  { q: "Tu script falla con un error. La forma más útil de pedir ayuda a la IA es…",
    opts: ["Decirle “no funciona, arréglalo”",
           "Pegar el mensaje de error, los datos de ejemplo y qué esperabas que pasara",
           "Pedirle que lo escriba todo de nuevo desde cero"],
    ok: 1, why: "Error exacto + ejemplo + resultado esperado = corrección rápida y certera." },
  { q: "Un prompt funciona perfecto para tu tarea de todos los meses. ¿Qué conviene hacer?",
    opts: ["Guardarlo y documentarlo para el equipo",
           "Borrarlo, total la IA se acordará",
           "Guardarlo en secreto para que nadie más lo use"],
    ok: 0, why: "Un buen prompt es un activo del equipo: se guarda, se comparte y se mejora entre todos." },
];

/* ============ Estado (localStorage) ============ */
const LS_KEY = "dojoCopitoProgressV1";
let progress = {};
try { progress = JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch (e) { progress = {}; }
let currentRole = ROLES[0].id;

function roleLessons(role) { return TRONCO_COMUN.concat(role.lessons); }
function doneSet(roleId) { return new Set(progress[roleId] || []); }
function saveProgress() { localStorage.setItem(LS_KEY, JSON.stringify(progress)); }
function rolePercent(role) {
  const total = roleLessons(role).length;
  return Math.round((doneSet(role.id).size / total) * 100);
}
function beltFor(pct) {
  if (pct >= 100) return "Cinturón negro ⚫";
  if (pct >= 75) return "Cinturón marrón 🟤";
  if (pct >= 50) return "Cinturón verde 🟢";
  if (pct >= 25) return "Cinturón amarillo 🟡";
  return "Cinturón blanco ⚪";
}

/* ============ Render: tarjetas de roles ============ */
const rolesGrid = document.getElementById("rolesGrid");
function renderRoles() {
  rolesGrid.innerHTML = "";
  ROLES.forEach((role) => {
    const pct = rolePercent(role);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "role-card" + (role.id === currentRole ? " selected" : "");
    btn.setAttribute("role", "listitem");
    btn.innerHTML = `<span class="role-emoji">${role.emoji}</span>
      <h3>${role.name}</h3><p>${role.desc}</p>
      <div class="role-progress">${pct}% completado · ${roleLessons(role).length} lecciones</div>`;
    btn.addEventListener("click", () => { currentRole = role.id; renderRoles(); renderRoute(); document.getElementById("ruta").scrollIntoView({ behavior: "smooth" }); });
    rolesGrid.appendChild(btn);
  });
}

/* ============ Render: ruta del rol ============ */
const lessonsList = document.getElementById("lessonsList");
function renderRoute() {
  const role = ROLES.find((r) => r.id === currentRole);
  const lessons = roleLessons(role);
  const done = doneSet(role.id);
  const pct = rolePercent(role);

  document.getElementById("routeTitle").textContent = `Ruta: ${role.emoji} ${role.name}`;
  document.getElementById("routeDesc").textContent = role.desc + " Primero el tronco común (vale para todos) y luego las lecciones de tu área.";
  document.getElementById("routePower").textContent = role.power;
  document.getElementById("routeProject").textContent = role.project;
  document.getElementById("routeBelt").textContent = beltFor(pct);
  document.getElementById("routeProgressText").textContent = pct + "%";
  document.getElementById("routeProgressFill").style.width = pct + "%";
  document.getElementById("routePrompt").textContent = role.prompt;

  lessonsList.innerHTML = "";
  lessons.forEach((lesson, idx) => {
    const li = document.createElement("li");
    li.className = "lesson" + (done.has(idx) ? " done" : "");
    const isCommon = idx < TRONCO_COMUN.length;
    li.innerHTML = `
      <input type="checkbox" ${done.has(idx) ? "checked" : ""} aria-label="Marcar lección como completada">
      <div><h4>${isCommon ? "🌱 " : "🎯 "}${lesson.title}</h4><p>${lesson.desc}</p></div>
      <span class="mins">${lesson.mins} min</span>`;
    li.querySelector("input").addEventListener("change", (ev) => {
      const set = doneSet(role.id);
      if (ev.target.checked) set.add(idx); else set.delete(idx);
      progress[role.id] = Array.from(set);
      saveProgress(); renderRoute(); renderRoles(); renderGlobal();
    });
    lessonsList.appendChild(li);
  });
}

function renderGlobal() {
  let total = 0, doneCount = 0;
  ROLES.forEach((role) => {
    total += roleLessons(role).length;
    doneCount += Math.min(doneSet(role.id).size, roleLessons(role).length);
  });
  // El tronco común cuenta una sola vez por rol en esta vista simple de avance personal:
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  document.getElementById("globalProgressText").textContent = pct + "%";
  document.getElementById("globalProgressFill").style.width = pct + "%";
}

/* ============ Copiar texto ============ */
function copyText(text, badgeId) {
  const show = () => {
    const el = document.getElementById(badgeId);
    el.hidden = false; setTimeout(() => { el.hidden = true; }, 1800);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(show).catch(show);
  } else { show(); }
}
document.getElementById("copyRoutePrompt").addEventListener("click", () => {
  const role = ROLES.find((r) => r.id === currentRole);
  copyText(role.prompt, "copiedRoute");
});

/* ============ Constructor de prompts ============ */
const builderRole = document.getElementById("builderRole");
const builderTask = document.getElementById("builderTask");
ROLES.forEach((role) => {
  const opt = document.createElement("option");
  opt.value = role.id; opt.textContent = `${role.emoji} ${role.name}`;
  builderRole.appendChild(opt);
});
function fillTasks() {
  const role = ROLES.find((r) => r.id === builderRole.value);
  builderTask.innerHTML = "";
  role.tasks.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t; opt.textContent = t; builderTask.appendChild(opt);
  });
}
builderRole.addEventListener("change", fillTasks);
fillTasks();

document.getElementById("builderForm").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const role = ROLES.find((r) => r.id === builderRole.value);
  const task = builderTask.value;
  const level = document.getElementById("builderLevel").value;
  const detail = document.getElementById("builderDetail").value.trim();
  const nivelTxt = {
    principiante: "Soy principiante: explícame cada paso en lenguaje simple y comenta el código en español.",
    intermedio: "Tengo nivel intermedio: ve al grano, pero explica las partes nuevas para mí.",
    avanzado: "Tengo nivel avanzado: entrégame código limpio, modular y con manejo de errores, sin explicaciones básicas.",
  }[level];
  const prompt =
`Actúa como un programador experto que ayuda a una persona del área de ${role.name} en una empresa.

Objetivo: ${task}.
${detail ? "Contexto de mis datos: " + detail + "." : "Si te falta información sobre mis datos, pregúntame antes de inventarla."}
Nivel: ${nivelTxt}

Entrégame:
1) El código completo y listo para probar con datos de ejemplo.
2) Una explicación breve de qué hace cada parte.
3) Qué datos reales debo reemplazar y dónde.
4) Un ejemplo de salida para verificar que funciona.`;
  document.getElementById("builderOutput").textContent = prompt;
});
document.getElementById("copyBuilderPrompt").addEventListener("click", () => {
  copyText(document.getElementById("builderOutput").textContent, "copiedBuilder");
});

/* ============ Quiz ============ */
let quizState = [];
function renderQuiz() {
  quizState = QUIZ.map(() => ({ answered: false, correct: false }));
  const box = document.getElementById("quizBox");
  box.innerHTML = "";
  document.getElementById("quizResult").hidden = true;
  updateScore();
  QUIZ.forEach((item, qi) => {
    const div = document.createElement("div");
    div.className = "quiz-q";
    div.innerHTML = `<h3>${qi + 1}. ${item.q}</h3>`;
    const opts = document.createElement("div");
    opts.className = "quiz-opts";
    item.opts.forEach((opt, oi) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "quiz-opt"; b.textContent = opt;
      b.addEventListener("click", () => {
        if (quizState[qi].answered) return;
        quizState[qi].answered = true;
        quizState[qi].correct = oi === item.ok;
        Array.from(opts.children).forEach((child, ci) => {
          if (ci === item.ok) child.classList.add("correct");
          else if (ci === oi) child.classList.add("wrong");
          child.disabled = true;
        });
        const why = document.createElement("p");
        why.className = "quiz-why";
        why.textContent = (quizState[qi].correct ? "✅ ¡Correcto! " : "❌ Casi. ") + item.why;
        div.appendChild(why);
        updateScore(); checkQuizEnd();
      });
      opts.appendChild(b);
    });
    div.appendChild(opts);
    box.appendChild(div);
  });
}
function updateScore() {
  const score = quizState.filter((s) => s.correct).length;
  document.getElementById("quizScore").textContent = `Puntaje: ${score} / ${QUIZ.length}`;
}
function checkQuizEnd() {
  if (!quizState.every((s) => s.answered)) return;
  const score = quizState.filter((s) => s.correct).length;
  const el = document.getElementById("quizResult");
  el.hidden = false;
  el.textContent =
    score === 5 ? "🏆 ¡Perfecto! Ya piensas como programador asistido por IA. A por tu cinturón negro." :
    score >= 3 ? "💪 ¡Muy bien! Repasa las reglas de oro y tu próximo intento será perfecto." :
                 "🌱 Buen comienzo. Vuelve a las lecciones del tronco común y reinténtalo.";
}
document.getElementById("quizRestart").addEventListener("click", renderQuiz);

/* ============ Menú móvil ============ */
const navToggle = document.getElementById("navToggle");
const mainNav = document.getElementById("mainNav");
navToggle.addEventListener("click", () => {
  const open = mainNav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});
mainNav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => mainNav.classList.remove("open")));

/* ============ Inicio ============ */
renderRoles();
renderRoute();
renderGlobal();
renderQuiz();
