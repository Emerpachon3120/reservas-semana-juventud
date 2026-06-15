/**
 * modules/state.js
 * -------------------------------------------------------------
 * Estado global mínimo compartido entre módulos:
 *   - reservas: copia en memoria de la lista compartida
 *   - vista: pestaña activa ("reservar" | "crono" | "admin")
 *   - adminOk: si la sesión de administración está autenticada
 *
 * Cada módulo lee/escribe a través de estos getters/setters en
 * lugar de variables globales sueltas, lo que facilita rastrear
 * quién modifica qué.
 * -------------------------------------------------------------
 */

let reservas = [];
let vista = "reservar";
let adminOk = false;

export const getReservas = () => reservas;
export const setReservas = (nuevas) => { reservas = nuevas; };

export const getVista = () => vista;
export const setVista = (v) => { vista = v; };

export const isAdminOk = () => adminOk;
export const setAdminOk = (v) => { adminOk = v; };
