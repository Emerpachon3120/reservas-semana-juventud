/**
 * app.js
 * -------------------------------------------------------------
 * Punto de entrada de la aplicación. Responsabilidades:
 *
 *   1. Router simple entre las 3 pestañas (Reservar / Cronograma /
 *      Administración), recargando las reservas compartidas cada
 *      vez que se cambia de pestaña.
 *   2. Inicialización al cargar la página.
 *   3. Exponer en `window` las funciones que el HTML generado
 *      dinámicamente invoca vía atributos onclick/oninput (esto es
 *      necesario porque ese HTML se inserta como innerHTML y no
 *      pasa por el sistema de módulos).
 *
 * Toda la lógica real vive en modules/, services/ y components/;
 * este archivo solo conecta las piezas.
 * -------------------------------------------------------------
 */
import { $ } from "./utils/dom.js";
import { cargarReservas } from "./services/storageService.js";
import { getReservas, setReservas, getVista, setVista } from "./modules/state.js";
import { renderWizard, paso1, setN, paso2, setCat, setLugar, setSlot, paso3, confirmar, nuevoRegistro, setPaso, getForm, actualizarCampo } from "./modules/wizard.js";
import { renderCrono } from "./modules/cronograma.js";
import { renderAdmin, entrarAdmin, setEstado, borrar, exportCSV } from "./modules/admin.js";

const TAB_IDS = { reservar: "Reservar", crono: "Crono", admin: "Admin" };

/** Dibuja la vista activa actual. */
function render() {
  const vista = getVista();
  if (vista === "reservar") renderWizard();
  else if (vista === "crono") renderCrono();
  else renderAdmin();
}

/** Cambia de pestaña, recarga las reservas compartidas y vuelve a dibujar. */
async function go(v) {
  setVista(v);
  Object.values(TAB_IDS).forEach((t) => $("#tab" + t).classList.remove("on"));
  $("#tab" + TAB_IDS[v]).classList.add("on");
  $("#main").innerHTML = '<div class="loading"><span class="spin"></span>Actualizando disponibilidad…</div>';
  setReservas(await cargarReservas());
  render();
}

/* -------------------------------------------------------------
 * Puente con el HTML dinámico (onclick="..."/oninput="...").
 * Se expone el mínimo necesario; toda la implementación real
 * está en los módulos importados arriba.
 *
 * `form` se expone como objeto directo (no getter) porque el HTML
 * generado escribe sobre sus propiedades de forma mutable, por
 * ejemplo: oninput="form.acts[0].nombre=this.value".
 * ----------------------------------------------------------- */
Object.assign(window, {
  go,
  render,
  form: getForm(),
  // wizard
  paso1, setN, paso2, setCat, setLugar, setSlot, paso3, confirmar, nuevoRegistro, setPaso, actualizarCampo,
  // admin
  entrarAdmin, setEstado, borrar, exportCSV,
});

/* ------------------------- inicio ------------------------- */
(async () => {
  setReservas(await cargarReservas());
  render();
})();
