/**
 * utils/text.js
 * -------------------------------------------------------------
 * Funciones puras de manejo de texto: normalización para
 * comparar nombres de instituciones y escape de HTML para
 * evitar inyección al insertar texto de usuarios en el DOM.
 * -------------------------------------------------------------
 */

/** Normaliza un texto para comparaciones: minúsculas, sin espacios extra. */
export const norm = (s) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");

/** Escapa caracteres HTML peligrosos antes de insertar texto en innerHTML. */
export const esc = (s) =>
  (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
