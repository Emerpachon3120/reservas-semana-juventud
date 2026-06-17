/**
 * modules/inicio.js
 * -------------------------------------------------------------
 * Módulo "Inicio": página de presentación del evento. Es lo primero
 * que ve cualquier institución al entrar: qué categorías temáticas
 * existen (y sus temas sugeridos), qué lugares hay disponibles con
 * su aforo, un resumen en vivo de cuántos espacios quedan libres en
 * el cronograma, y un botón grande para pasar a reservar.
 *
 * Es mayormente contenido de solo lectura a partir de
 * config/constants.js; el resumen de cronograma sí depende de las
 * reservas ya guardadas (estado global).
 * -------------------------------------------------------------
 */
import { CATS, DIAS, HORAS, LUGARES } from "../config/constants.js";
import { $ } from "../utils/dom.js";
import { esc } from "../utils/text.js";
import { contadoresGenerales } from "../services/reservasService.js";
import { getReservas } from "./state.js";

/** Para cada categoría, en qué día(s) puede dictarse según el eje temático. */
function diasDeCategoria(catKey) {
  return DIAS.filter((d) => d.cats.includes(catKey)).map((d) => d.label);
}

function seccionCategorias() {
  let h = `<section class="card cat-intro">
    <h2>¿Qué se puede tratar esta semana?</h2>
    <p style="font-size:.88rem;color:var(--muted);margin-top:6px">Seis categorías temáticas agrupan las charlas, talleres, laboratorios y experiencias del evento. Cada día tiene un eje temático: revisa qué categoría corresponde a qué día antes de reservar.</p>
  </section>`;

  h += '<div class="cat-grid">';
  Object.entries(CATS).forEach(([key, cat]) => {
    const dias = diasDeCategoria(key);
    h += `<article class="cat-card" style="--cat-c:${cat.c};--cat-l:${cat.l}">
      <div class="cat-card-head">
        <span class="cat-card-name">${esc(cat.nombre)}</span>
        <span class="cat-card-dias">${dias.join(" · ")}</span>
      </div>
      <div class="cat-card-temas">
        ${cat.temas.map((t) => `<span class="cat-chip">${esc(t)}</span>`).join("")}
      </div>
    </article>`;
  });
  h += "</div>";
  return h;
}

function seccionLugares() {
  let h = `<section class="card" style="margin-top:22px">
    <h2 style="font-family:'Playfair Display',serif;font-size:1.3rem">Lugares disponibles</h2>
    <p style="font-size:.88rem;color:var(--muted);margin-top:6px">Tres espacios físicos, cada uno con su propio calendario y aforo máximo.</p>
  </section>`;
  h += '<div class="lugar-grid">';
  LUGARES.forEach((l) => {
    h += `<article class="lugar-card">
      <div class="lugar-card-name">📍 ${esc(l.nombre)}</div>
      <div class="lugar-card-aforo">Aforo: ${l.aforo} personas</div>
      <div class="lugar-card-nota">${esc(l.nota)}</div>
    </article>`;
  });
  h += "</div>";
  return h;
}

function seccionResumen() {
  const reservas = getReservas();
  const { total, disponibles, registradas, instituciones } = contadoresGenerales(reservas, DIAS, HORAS, LUGARES);
  return `<section class="card" style="margin-top:22px">
    <h2 style="font-family:'Playfair Display',serif;font-size:1.3rem">Cronograma en vivo</h2>
    <div class="counts" style="margin-top:12px">
      <div class="count">Espacios disponibles<b>${disponibles} de ${total}</b></div>
      <div class="count">Actividades registradas<b>${registradas}</b></div>
      <div class="count">Instituciones participantes<b>${instituciones}</b></div>
    </div>
    <button class="btn ghost sm" style="margin-top:14px" onclick="window.go('crono')">Ver cronograma completo</button>
  </section>`;
}

function seccionCta() {
  return `<section class="card cta-card">
    <div>
      <h2 style="font-family:'Playfair Display',serif;font-size:1.4rem">¿Ya sabes qué quieres proponer?</h2>
      <p style="font-size:.88rem;color:var(--muted);margin-top:6px">Registra tu institución y reserva tu espacio en menos de 5 minutos.</p>
    </div>
    <button class="btn cta-btn" onclick="window.go('reservar')">Quiero hacer una reserva</button>
  </section>`;
}

export function renderInicio() {
  const h = seccionCategorias() + seccionLugares() + seccionResumen() + seccionCta();
  $("#main").innerHTML = h;
}
