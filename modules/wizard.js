/**
 * modules/wizard.js
 * -------------------------------------------------------------
 * Módulo "Reservar": asistente de 4 pasos para que una
 * institución registre sus actividades.
 *
 *   Paso 1: datos de la institución (nombre, contacto, teléfono/correo)
 *   Paso 2: cantidad de actividades a registrar (1 a 3, según cupo)
 *   Paso 3: formulario + calendario por cada actividad
 *   Paso 4: resumen y confirmación
 *   Paso 5: pantalla de éxito
 *
 * Mantiene su propio estado de formulario (`form`, `paso`) y
 * delega las reglas de negocio a reservasService y el dibujo del
 * calendario a components/calendar.
 * -------------------------------------------------------------
 */
import { DIAS, LUGARES, CATS, TIPOS, MAX_ACT } from "../config/constants.js";
import { $ } from "../utils/dom.js";
import { esc } from "../utils/text.js";
import { renderCalendario } from "../components/calendar.js";
import { validarCupo, ocupado, crearReservasDesdeForm, charlasDe } from "../services/reservasService.js";
import { cargarReservas, guardarReservas } from "../services/storageService.js";
import { getReservas, setReservas } from "./state.js";

/** Estado propio del wizard (vive solo mientras se llena el formulario). */
let paso = 1; // 1 institución · 2 cantidad · 3 actividades · 4 resumen · 5 éxito
const form = { inst: "", contacto: "", tel: "", n: 0, acts: [] };

/** Crea una actividad vacía con valores por defecto. */
function actVacia() {
  return { nombre: "", tipo: "Charla", cat: "", lugar: "teatrino", dia: "", hora: "" };
}

/**
 * Reinicia el wizard para registrar otra institución.
 * Muta el objeto `form` existente (en lugar de reemplazarlo) porque
 * `window.form` mantiene una referencia directa a este objeto.
 */
export function reiniciarWizard() {
  form.inst = "";
  form.contacto = "";
  form.tel = "";
  form.n = 0;
  form.acts = [];
  paso = 1;
}

/** Indicador visual de pasos (1..4) con estado actual / completado. */
function stepsHtml() {
  const names = ["Institución", "Actividades", "Asignación", "Confirmación"];
  return (
    '<div class="steps">' +
    names
      .map((n, i) => {
        const k = i + 1;
        const cls = k === paso ? "on" : k < paso ? "done" : "";
        return `<span class="step ${cls}"><b>${k < paso ? "✓" : k}</b>${n}</span>`;
      })
      .join("") +
    "</div>"
  );
}

/**
 * Renderiza el "ticket" de formulario + calendario para una actividad.
 */
function ticketHtml(a, i) {
  const dEje = a.cat ? DIAS.filter((d) => d.cats.includes(a.cat)) : [];
  const calendarioHtml = renderCalendario({
    modo: "seleccion",
    reservas: getReservas(),
    lugarId: a.lugar,
    actividad: a,
    actsForm: form.acts,
    indexActual: i,
    onSelectFn: "setSlot",
  });

  return `<article class="ticket">
    <div class="head"><span class="num">${i + 1}</span> Actividad ${i + 1} de ${form.n}</div>
    <div class="body">
      <div class="grid2">
        <div><label class="lbl" for="nom${i}">Nombre de la actividad</label>
          <input class="inp" id="nom${i}" value="${esc(a.nombre)}" oninput="actualizarCampo(${i},'nombre',this.value)" placeholder="Ej: Robots autónomos en acción"></div>
        <div><label class="lbl" for="tip${i}">Tipo de actividad</label>
          <select class="inp" id="tip${i}" onchange="actualizarCampo(${i},'tipo',this.value)">
            ${TIPOS.map((t) => `<option ${a.tipo === t ? "selected" : ""}>${t}</option>`).join("")}</select></div>
      </div>
      <label class="lbl">Categoría temática</label>
      <div class="chips">${Object.entries(CATS)
        .map(
          ([k, c]) =>
            `<button class="chip ${a.cat === k ? "on" : ""}" style="${a.cat === k ? `background:${c.c}` : ""}" onclick="setCat(${i},'${k}')">${c.nombre}</button>`
        )
        .join("")}</div>
      ${a.cat ? `<p style="font-size:.76rem;color:var(--muted);margin-top:8px">Esta categoría puede dictarse: ${dEje.map((d) => d.label).join(", ")} de septiembre.</p>` : ""}
      <label class="lbl">Lugar</label>
      <div class="chips">${LUGARES.map(
        (l) =>
          `<button class="lugar ${a.lugar === l.id ? "on" : ""}" onclick="setLugar(${i},'${l.id}')">
          <div class="nm">📍 ${l.nombre}</div><div class="af">Aforo: ${l.aforo} personas · ${l.nota}</div></button>`
      ).join("")}</div>
      <label class="lbl">Elige el espacio en el calendario (${LUGARES.find((l) => l.id === a.lugar).nombre})</label>
      ${calendarioHtml}
      ${a.dia ? `<p style="font-size:.8rem;font-weight:600;color:var(--primary);margin-top:10px">Seleccionado: ${DIAS.find((d) => d.id === a.dia).label} sep · ${a.hora}</p>` : ""}
    </div></article>`;
}

/**
 * Renderiza el paso actual del wizard dentro de #main.
 * @param {Function} onDone - callback a ejecutar tras renderizar (p.ej. para refrescar otra vista)
 */
export function renderWizard() {
  let h = `<div class="wizard-note">⚠️ Importante: cada registro queda en estado <b>Confirmado parcialmente</b> hasta que la administración del evento lo valide, y puede estar sujeto a cambios.</div>`;
  h += stepsHtml();

  if (paso === 1) {
    h += `<section class="card">
      <h2>Datos de la institución</h2>
      <div class="grid2">
        <div><label class="lbl" for="fInst">Institución / Universidad / Empresa</label>
          <input class="inp" id="fInst" value="${esc(form.inst)}" placeholder="Ej: Universidad del Centro"></div>
        <div><label class="lbl" for="fCon">Expositor o persona de contacto</label>
          <input class="inp" id="fCon" value="${esc(form.contacto)}" placeholder="Nombre completo"></div>
        <div><label class="lbl" for="fTel">Teléfono o correo</label>
          <input class="inp" id="fTel" value="${esc(form.tel)}" placeholder="Para coordinar la validación"></div>
      </div>
      <div id="e1" class="err" role="alert"></div>
      <div style="margin-top:18px"><button class="btn" onclick="paso1()">Continuar</button></div>
    </section>`;
  }

  if (paso === 2) {
    const { libres, usadas } = validarCupo(getReservas(), form.inst, 0);
    h += `<section class="card">
      <h2>¿Cuántas actividades realizará <span style="color:var(--primary)">${esc(form.inst)}</span>?</h2>
      <p style="font-size:.85rem;color:var(--muted);margin-top:6px">Cada institución puede registrar máximo ${MAX_ACT} actividades en la semana, en uno o varios días.${usadas ? ` Ya tienen ${usadas} registrada(s); pueden agregar hasta ${libres} más.` : ""}</p>
      <div class="qty">${[1, 2, 3]
        .map(
          (n) => `
        <button ${n > libres ? "disabled" : ""} class="${form.n === n ? "on" : ""}" onclick="setN(${n})">
          <div class="n">${n}</div><div class="t">${n === 1 ? "actividad" : "actividades"}</div>
        </button>`
        )
        .join("")}
      </div>
      ${libres <= 0 ? '<div class="notice bad">Esta institución ya alcanzó el límite de 3 actividades. Si necesitan un cambio, contacten a la administración.</div>' : ""}
      <div id="e2" class="err" role="alert"></div>
      <div style="margin-top:18px;display:flex;gap:10px">
        <button class="btn ghost" onclick="setPaso(1)">Atrás</button>
        <button class="btn" onclick="paso2()" ${libres <= 0 ? "disabled" : ""}>Continuar</button>
      </div>
    </section>`;
  }

  if (paso === 3) {
    h += form.acts.map((a, i) => ticketHtml(a, i)).join("");
    h += `<div id="e3" class="err" role="alert"></div>
      <div style="margin-top:18px;display:flex;gap:10px">
        <button class="btn ghost" onclick="setPaso(2)">Atrás</button>
        <button class="btn" onclick="paso3()">Revisar y confirmar</button>
      </div>`;
  }

  if (paso === 4) {
    h += `<section class="card"><h2>Confirma tu registro</h2>
      <div class="sum"><b>${esc(form.inst)}</b><br>
        <span style="font-size:.83rem;color:var(--muted)">${esc(form.contacto)} · ${esc(form.tel)}</span></div>
      ${form.acts
        .map((a, i) => {
          const d = DIAS.find((x) => x.id === a.dia);
          const l = LUGARES.find((x) => x.id === a.lugar);
          return `<div class="sum"><b>Actividad ${i + 1}: ${esc(a.nombre)}</b><br>
          <span style="font-size:.85rem">${a.tipo} · ${CATS[a.cat].nombre}</span><br>
          <span style="font-size:.85rem;color:var(--muted)">${d.label} sep · ${a.hora} · ${l.nombre} (${l.aforo} personas)</span></div>`;
        })
        .join("")}
      <div class="notice info">Al confirmar, los espacios quedan bloqueados con estado <b>Confirmado parcialmente</b>. La administración del evento los revisará y los pasará a <b>Confirmado</b>, o se comunicará contigo si requiere algún ajuste.</div>
      <div id="e4" class="err" role="alert"></div>
      <div style="margin-top:18px;display:flex;gap:10px">
        <button class="btn ghost" onclick="setPaso(3)">Atrás</button>
        <button class="btn" id="btnConf" onclick="confirmar()">Confirmar registro</button>
      </div>
    </section>`;
  }

  if (paso === 5) {
    h = `<section class="card" style="text-align:center;padding:40px 20px">
      <div style="font-size:2.4rem">🎟️</div>
      <h2 style="margin-top:8px">¡Registro recibido!</h2>
      <p style="color:var(--muted);font-size:.9rem;max-width:480px;margin:10px auto 0">
        Las actividades de <b>${esc(form.inst)}</b> quedaron en estado <span class="pill parcial">Confirmado parcialmente</span>.
        La administración validará el registro; cualquier ajuste se coordinará con ${esc(form.contacto)}.</p>
      <div style="margin-top:22px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button class="btn ghost" onclick="go('crono')">Ver cronograma</button>
        <button class="btn" onclick="nuevoRegistro()">Registrar otra institución</button>
      </div></section>`;
  }

  $("#main").innerHTML = h;
}

/* ===================== acciones del wizard ===================== */
/* Estas funciones se exponen en window (ver app.js) porque el HTML
   generado dinámicamente las invoca mediante atributos onclick/oninput. */

export function paso1() {
  form.inst = $("#fInst").value.trim();
  form.contacto = $("#fCon").value.trim();
  form.tel = $("#fTel").value.trim();
  if (!form.inst || !form.contacto || !form.tel) {
    $("#e1").textContent = "Completa los tres campos para continuar.";
    return;
  }
  paso = 2;
  renderWizard();
}

export function setN(n) {
  form.n = n;
  renderWizard();
}

export function paso2() {
  if (!form.n) {
    $("#e2").textContent = "Selecciona cuántas actividades realizarán.";
    return;
  }
  while (form.acts.length < form.n) form.acts.push(actVacia());
  form.acts = form.acts.slice(0, form.n);
  paso = 3;
  renderWizard();
}

/**
 * Actualiza un campo de texto/select de una actividad sin volver a
 * dibujar la pantalla (se usa en oninput/onchange para no perder el
 * foco mientras el usuario escribe).
 */
export function actualizarCampo(i, campo, valor) {
  if (form.acts[i]) form.acts[i][campo] = valor;
}

/**
 * Lee del DOM los valores actuales de los campos de texto y "tipo"
 * de cada ticket (paso 3) y los guarda en `form.acts`.
 *
 * Esto evita que un re-render (disparado al elegir categoría, lugar
 * u hora) sobrescriba el input "Nombre de la actividad" con un valor
 * desactualizado: antes de regenerar el HTML, primero se "congela"
 * lo que el usuario ya escribió.
 */
function sincronizarCampos() {
  form.acts.forEach((a, i) => {
    const nom = $(`#nom${i}`);
    const tip = $(`#tip${i}`);
    if (nom) a.nombre = nom.value;
    if (tip) a.tipo = tip.value;
  });
}

export function setCat(i, k) {
  sincronizarCampos();
  const a = form.acts[i];
  a.cat = k;
  const d = DIAS.find((x) => x.id === a.dia);
  if (d && !d.cats.includes(k)) {
    a.dia = "";
    a.hora = "";
  }
  renderWizard();
}

export function setLugar(i, l) {
  sincronizarCampos();
  const a = form.acts[i];
  if (a.lugar !== l) {
    a.lugar = l;
    a.dia = "";
    a.hora = "";
  }
  renderWizard();
}

export function setSlot(i, d, h) {
  sincronizarCampos();
  form.acts[i].dia = d;
  form.acts[i].hora = h;
  renderWizard();
}

export function paso3() {
  sincronizarCampos();
  for (let i = 0; i < form.acts.length; i++) {
    const a = form.acts[i];
    if (!a.nombre.trim()) {
      $("#e3").textContent = `Actividad ${i + 1}: escribe el nombre de la actividad.`;
      return;
    }
    if (!a.cat) {
      $("#e3").textContent = `Actividad ${i + 1}: selecciona la categoría temática.`;
      return;
    }
    if (!a.dia || !a.hora) {
      $("#e3").textContent = `Actividad ${i + 1}: elige un espacio disponible en el calendario.`;
      return;
    }
  }
  paso = 4;
  renderWizard();
}

/**
 * Revalida disponibilidad y cupo en el servidor compartido, guarda
 * las nuevas reservas y avanza a la pantalla de éxito.
 */
export async function confirmar() {
  const b = $("#btnConf");
  b.disabled = true;
  b.textContent = "Verificando disponibilidad…";
  try {
    const reservas = await cargarReservas(); // releer por si otra institución reservó mientras tanto
    setReservas(reservas);

    const { ok } = validarCupo(reservas, form.inst, form.acts.length);
    if (!ok) throw new Error("La institución superaría el límite de 3 actividades. Reduce la cantidad.");

    for (const a of form.acts) {
      const occ = ocupado(reservas, a.dia, a.hora, a.lugar);
      if (occ) throw new Error(`El espacio de "${a.nombre}" acaba de ser reservado por ${occ.inst}. Vuelve al paso anterior y elige otro.`);
    }

    const nuevas = crearReservasDesdeForm(form);
    const actualizadas = [...reservas, ...nuevas];
    await guardarReservas(actualizadas);
    setReservas(actualizadas);

    paso = 5;
    renderWizard();
  } catch (e) {
    $("#e4").textContent = e.message || "Ocurrió un error al guardar. Intenta de nuevo.";
    b.disabled = false;
    b.textContent = "Confirmar registro";
    setReservas(await cargarReservas());
  }
}

export function nuevoRegistro() {
  reiniciarWizard();
  renderWizard();
}

/** Cambia de paso del wizard y vuelve a dibujar (usado por los botones "Atrás"). */
export function setPaso(p) {
  paso = p;
  renderWizard();
}

/** Exporta el estado del formulario para que app.js lo expanga a window (los oninput lo necesitan). */
export function getForm() {
  return form;
}
