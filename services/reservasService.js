/**
 * services/reservasService.js
 * -------------------------------------------------------------
 * Lógica de negocio pura sobre el arreglo de reservas. No toca
 * el DOM ni el almacenamiento: recibe datos, responde datos.
 * Esto permite probar las reglas del evento de forma aislada.
 * -------------------------------------------------------------
 */
import { MAX_ACT } from "../config/constants.js";
import { norm } from "../utils/text.js";

/**
 * Busca si un espacio (día + hora + lugar) ya está ocupado.
 * @param {Array} reservas
 * @param {string} dia
 * @param {string} hora
 * @param {string} lugar
 * @param {string|null} exceptId - id de reserva a excluir de la búsqueda (para ediciones)
 * @returns {object|undefined} la reserva que ocupa el espacio, o undefined si está libre
 */
export const ocupado = (reservas, dia, hora, lugar, exceptId = null) =>
  reservas.find((r) => r.dia === dia && r.hora === hora && r.lugar === lugar && r.id !== exceptId);

/**
 * Cuenta cuántas actividades tiene registradas una institución.
 * La comparación se hace con el nombre normalizado.
 * @param {Array} reservas
 * @param {string} inst
 * @returns {number}
 */
export const charlasDe = (reservas, inst) =>
  reservas.filter((r) => norm(r.inst) === norm(inst)).length;

/**
 * Valida si una institución puede agregar `cantidad` actividades más
 * sin superar el cupo máximo (MAX_ACT).
 * @param {Array} reservas
 * @param {string} inst
 * @param {number} cantidad
 * @returns {{ok: boolean, libres: number}}
 */
export function validarCupo(reservas, inst, cantidad) {
  const usadas = charlasDe(reservas, inst);
  const libres = MAX_ACT - usadas;
  return { ok: cantidad <= libres, libres, usadas };
}

/**
 * Construye los registros de reserva listos para guardar a partir
 * del formulario del wizard.
 * @param {{inst:string, contacto:string, tel:string, acts:Array}} form
 * @returns {Array} nuevas reservas con estado inicial "parcial"
 */
export function crearReservasDesdeForm(form) {
  const ts = Date.now();
  return form.acts.map((a, i) => ({
    id: `r${ts}_${i}`,
    inst: form.inst,
    contacto: form.contacto,
    tel: form.tel,
    nombre: a.nombre.trim(),
    tipo: a.tipo,
    cat: a.cat,
    dia: a.dia,
    hora: a.hora,
    lugar: a.lugar,
    estado: "parcial",
    ts,
  }));
}

/**
 * Calcula los contadores generales para la vista de cronograma.
 * @param {Array} reservas
 * @param {Array} DIAS
 * @param {Array} HORAS
 * @param {Array} LUGARES
 */
export function contadoresGenerales(reservas, DIAS, HORAS, LUGARES) {
  const total = DIAS.length * HORAS.length * LUGARES.length;
  const usados = reservas.length ? new Set(reservas.map((r) => `${r.dia}|${r.hora}|${r.lugar}`)).size : 0;
  const instituciones = new Set(reservas.map((r) => norm(r.inst))).size;
  return { total, disponibles: total - usados, registradas: reservas.length, instituciones };
}
