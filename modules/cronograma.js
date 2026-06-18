/**
 * modules/cronograma.js
 * -------------------------------------------------------------
 * Módulo "Cronograma": vista pública de solo lectura con un
 * calendario por cada lugar (Teatro, Biblioteca El Futuro,
 * Biblioteca Ricardo Moros), coloreado por categoría temática,
 * más los contadores generales del evento.
 * -------------------------------------------------------------
 */
import { LUGARES, DIAS, HORAS } from "../config/constants.js";
import { $ } from "../utils/dom.js";
import { renderCalendario } from "../components/calendar.js";
import { contadoresGenerales } from "../services/reservasService.js";
import { getReservas } from "./state.js";

export function renderCrono() {
  const reservas = getReservas();
  const { total, disponibles, registradas, instituciones } = contadoresGenerales(reservas, DIAS, HORAS, LUGARES);

  let h = `<div class="counts">
    <div class="count">Espacios disponibles<b>${disponibles} de ${total}</b></div>
    <div class="count">Actividades registradas<b>${registradas}</b></div>
    <div class="count">Instituciones<b>${instituciones}</b></div></div>`;

  LUGARES.forEach((l) => {
    const occL = reservas.filter((r) => r.lugar === l.id).length;
    h += `<section class="card"><h3>📍 ${l.nombre} · Aforo ${l.aforo} personas · ${16 - occL} de 16 disponibles</h3>`;
    h += renderCalendario({ modo: "lectura", reservas, lugarId: l.id });
    h += "</section>";
  });

  $("#main").innerHTML = h;
}
