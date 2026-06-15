/**
 * modules/admin.js
 * -------------------------------------------------------------
 * Módulo "Administración": acceso protegido por contraseña donde
 * el equipo organizador revisa todos los registros, los aprueba,
 * marca "Requiere ajuste", los elimina, o exporta todo a CSV.
 * -------------------------------------------------------------
 */
import { DIAS, LUGARES, CATS, ADMIN_KEY } from "../config/constants.js";
import { $ } from "../utils/dom.js";
import { esc } from "../utils/text.js";
import { cargarReservas, guardarReservas } from "../services/storageService.js";
import { getReservas, setReservas, isAdminOk, setAdminOk } from "./state.js";

const ESTADO_LABEL = { parcial: "Confirmado parcialmente", aprobado: "Confirmado", ajuste: "Requiere ajuste" };

export function renderAdmin() {
  if (!isAdminOk()) {
    $("#main").innerHTML = `<section class="card" style="max-width:420px">
      <h2>Acceso de administración</h2>
      <label class="lbl" for="clave">Clave</label>
      <input class="inp" id="clave" type="password">
      <div id="eA" class="err" role="alert"></div>
      <div style="margin-top:16px"><button class="btn" onclick="entrarAdmin()">Entrar</button></div></section>`;
    return;
  }

  const orden = [...getReservas()].sort((a, b) => a.ts - b.ts);
  let h = `<section class="card"><h2>Validación de registros (${orden.length})</h2>
    <p style="font-size:.82rem;color:var(--muted);margin-top:4px">Aprueba cada actividad, márcala como "Requiere ajuste" para coordinar un cambio con la institución, o elimínala para liberar el espacio.</p>
    <div style="margin-top:12px"><button class="btn sm ghost" onclick="exportCSV()">Descargar CSV</button></div>`;

  if (!orden.length) h += '<div class="notice info">Aún no hay registros.</div>';

  orden.forEach((r) => {
    const d = DIAS.find((x) => x.id === r.dia);
    const l = LUGARES.find((x) => x.id === r.lugar);
    h += `<div class="admrow">
      <div><b>${esc(r.inst)}</b> — ${esc(r.nombre)} <span class="pill ${r.estado}">${ESTADO_LABEL[r.estado]}</span>
        <div class="meta">${r.tipo} · ${CATS[r.cat].nombre} · ${d.label} sep · ${r.hora} · ${l.nombre} · Contacto: ${esc(r.contacto)} (${esc(r.tel)})</div></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn sm" onclick="setEstado('${r.id}','aprobado')">Aprobar</button>
        <button class="btn sm ghost" onclick="setEstado('${r.id}','ajuste')">Requiere ajuste</button>
        <button class="btn sm" style="background:var(--bad)" onclick="borrar('${r.id}')">Eliminar</button>
      </div></div>`;
  });

  $("#main").innerHTML = h + "</section>";
}

export function entrarAdmin() {
  if ($("#clave").value === ADMIN_KEY) {
    setAdminOk(true);
    renderAdmin();
  } else {
    $("#eA").textContent = "Clave incorrecta.";
  }
}

export async function setEstado(id, estado) {
  try {
    const reservas = await cargarReservas();
    const r = reservas.find((x) => x.id === id);
    if (r) r.estado = estado;
    await guardarReservas(reservas);
    setReservas(reservas);
    renderAdmin();
  } catch (e) {
    alert("No fue posible actualizar. Intenta de nuevo.");
  }
}

export async function borrar(id) {
  if (!confirm("¿Eliminar este registro y liberar el espacio?")) return;
  try {
    let reservas = await cargarReservas();
    reservas = reservas.filter((x) => x.id !== id);
    await guardarReservas(reservas);
    setReservas(reservas);
    renderAdmin();
  } catch (e) {
    alert("No fue posible eliminar. Intenta de nuevo.");
  }
}

export function exportCSV() {
  const reservas = getReservas();
  const head = "Institucion,Contacto,Telefono,Actividad,Tipo,Categoria,Dia,Hora,Lugar,Estado";
  const cell = (v) => '"' + String(v).replace(/"/g, '""') + '"';
  const lines = reservas.map((r) => {
    const d = DIAS.find((x) => x.id === r.dia);
    const l = LUGARES.find((x) => x.id === r.lugar);
    return [r.inst, r.contacto, r.tel, r.nombre, r.tipo, CATS[r.cat].nombre, d.label + " sep", r.hora, l.nombre, r.estado]
      .map(cell)
      .join(",");
  });
  const a = document.createElement("a");
  a.href = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent([head, ...lines].join("\n"));
  a.download = "reservas_semana_juventud.csv";
  a.click();
}
