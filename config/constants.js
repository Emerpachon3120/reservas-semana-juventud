/**
 * config/constants.js
 * -------------------------------------------------------------
 * Configuración central del evento "Semana de Ciencia, Tecnología,
 * Innovación y Juventud" (Nemocón).
 *
 * Cualquier cambio en fechas, lugares, categorías, ejes temáticos
 * por día, tipos de actividad o reglas de negocio (cupo máximo,
 * claves) se hace ÚNICAMENTE aquí. Ningún otro módulo debe
 * contener estos valores "hardcodeados".
 * -------------------------------------------------------------
 */

/** Días disponibles para reservar (lunes 14 queda fuera: es Inauguración). */
export const DIAS = [
  { id: "mar", label: "Martes 15", eje: "Gaming · Int. Artificial", cats: ["gaming", "ia"] },
  { id: "mie", label: "Miércoles 16", eje: "Deporte · Creación Digital", cats: ["deporte", "creacion"] },
  { id: "jue", label: "Jueves 17", eje: "Futuro · Medio Ambiente", cats: ["futuro", "ambiente"] },
  { id: "vie", label: "Viernes 18", eje: "Todas las categorías", cats: ["gaming", "ia", "futuro", "creacion", "deporte", "ambiente"] },
];

/** Franjas horarias disponibles cada día (8:00 a.m. a 12:00 m.). */
export const HORAS = ["8:00 - 9:00", "9:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00"];

/** Lugares físicos disponibles para las actividades, con su aforo. */
export const LUGARES = [
  { id: "teatrino", nombre: "Teatrino Municipal", aforo: 120, nota: "Charlas magistrales y actividades grandes" },
  { id: "futuro", nombre: "Biblioteca El Futuro", aforo: 35, nota: "Talleres y grupos pequeños" },
  { id: "moros", nombre: "Biblioteca Ricardo Moros", aforo: 35, nota: "Talleres y grupos pequeños" },
];

/** Categorías temáticas: nombre visible y colores (referencian variables CSS). */
export const CATS = {
  gaming: { nombre: "🎮 Gaming", c: "var(--c-gaming)", l: "var(--l-gaming)" },
  ia: { nombre: "🤖 Inteligencia Artificial", c: "var(--c-ia)", l: "var(--l-ia)" },
  futuro: { nombre: "🌎 Futuro y Tecnología", c: "var(--c-futuro)", l: "var(--l-futuro)" },
  creacion: { nombre: "🎬 Creación Digital", c: "var(--c-creacion)", l: "var(--l-creacion)" },
  deporte: { nombre: "⚽ Deporte y Mundial", c: "var(--c-deporte)", l: "var(--l-deporte)" },
  ambiente: { nombre: "🌱 Medio Ambiente", c: "var(--c-ambiente)", l: "var(--l-ambiente)" },
};

/** Tipos de actividad que una institución puede registrar. */
export const TIPOS = ["Charla", "Taller práctico", "Laboratorio", "Experiencia tecnológica", "Demostración", "Otro"];

/** Reglas de negocio y claves de acceso/almacenamiento. */
export const MAX_ACT = 3;
export const STORAGE_KEY = "reservas_semana_juventud";
export const ADMIN_KEY = "juventud2026";
