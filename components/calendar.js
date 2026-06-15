/**
 * components/calendar.js
 * -------------------------------------------------------------
 * Componente de tabla-calendario reutilizable. Antes existían dos
 * versiones casi idénticas (una en el wizard y otra en el
 * cronograma); esta función las unifica con un parámetro `modo`:
 *
 *   - modo "seleccion": permite elegir un espacio libre (wizard,
 *     paso 3). Marca como "no aplica" los días que no correspondan
 *     a la categoría elegida, y distingue espacios ya tomados por
 *     OTRAS actividades del mismo formulario ("Tu actividad N").
 *
 *   - modo "lectura": vista pública del cronograma, sin botones,
 *     mostrando "Disponible" u ocupado con institución y actividad.
 *
 * Ambos modos comparten el armazón de filas/columnas (horas x días)
 * y el bloque de Inauguración del lunes 14.
 * -------------------------------------------------------------
 */
import { DIAS, HORAS, CATS } from "../config/constants.js";
import { esc } from "../utils/text.js";
import { ocupado } from "../services/reservasService.js";

/**
 * Renderiza el encabezado común (Hora | Lunes 14 | Martes..Viernes con su eje).
 */
function encabezado() {
  let h = '<tr><th>Hora</th><th>Lunes 14<span class="eje">Inauguración</span></th>';
  DIAS.forEach((d) => (h += `<th>${d.label}<span class="eje">${d.eje}</span></th>`));
  return h + "</tr>";
}

/**
 * Renderiza una celda del cronograma en modo lectura.
 */
function celdaLectura(reservas, dia, hora, lugarId) {
  const occ = ocupado(reservas, dia, hora, lugarId);
  if (occ) {
    return `<td style="background:${CATS[occ.cat].l}"><div class="cell" style="color:${CATS[occ.cat].c}">
      <span class="who">🔒 ${esc(occ.inst)}</span>${esc(occ.nombre)}<span style="font-weight:500">${occ.tipo}</span></div></td>`;
  }
  return `<td><div class="cell" style="color:var(--ok)">✅ Disponible</div></td>`;
}

/**
 * Renderiza una celda del calendario en modo selección (wizard).
 * @param {Array} reservas - reservas ya guardadas (de otras instituciones)
 * @param {object} actividad - actividad actual del formulario {cat, lugar, dia, hora}
 * @param {Array} actsForm - todas las actividades del formulario actual (para detectar auto-ocupación)
 * @param {number} indexActual - índice de la actividad actual dentro de actsForm
 * @param {string} dia
 * @param {string} hora
 * @param {Function} onSelect - nombre de la función global a invocar en el onclick del slot
 */
function celdaSeleccion(reservas, actividad, actsForm, indexActual, dia, hora, onSelectFn) {
  const diaCfg = DIAS.find((d) => d.id === dia);
  const vetado = actividad.cat && !diaCfg.cats.includes(actividad.cat);
  const occ = ocupado(reservas, dia, hora, actividad.lugar);
  const propio = actsForm.find((x, xi) => xi !== indexActual && x.dia === dia && x.hora === hora && x.lugar === actividad.lugar);

  if (vetado) {
    return `<td class="veta"><div class="cell">No aplica<br>para esta categoría</div></td>`;
  }
  if (occ) {
    return `<td class="busy" style="background:${CATS[occ.cat].l}"><div class="cell" style="color:${CATS[occ.cat].c}"><span class="who">🔒 ${esc(occ.inst)}</span>${esc(occ.nombre)}</div></td>`;
  }
  if (propio) {
    return `<td class="busy" style="background:var(--primary-soft)"><div class="cell" style="color:var(--primary)"><span class="who">Tu actividad ${actsForm.indexOf(propio) + 1}</span></div></td>`;
  }
  const sel = actividad.dia === dia && actividad.hora === hora;
  return `<td><button class="slot ${sel ? "sel" : ""}" onclick="${onSelectFn}(${indexActual},'${dia}','${hora}')" aria-label="${diaCfg.label}, ${hora}">${sel ? "✓ Elegido" : "Disponible"}</button></td>`;
}

/**
 * Renderiza la tabla de calendario completa.
 *
 * @param {object} opts
 * @param {"lectura"|"seleccion"} opts.modo
 * @param {Array} opts.reservas - reservas guardadas
 * @param {string} opts.lugarId - id del lugar a mostrar
 * @param {object} [opts.actividad] - (modo seleccion) actividad actual {cat, lugar, dia, hora}
 * @param {Array} [opts.actsForm] - (modo seleccion) actividades del formulario actual
 * @param {number} [opts.indexActual] - (modo seleccion) índice de la actividad actual
 * @param {string} [opts.onSelectFn="setSlot"] - (modo seleccion) función global a llamar al elegir un espacio
 * @returns {string} HTML de `<div class="calwrap"><table class="cal">...</table></div>`
 */
export function renderCalendario(opts) {
  const { modo, reservas, lugarId } = opts;
  let h = '<div class="calwrap"><table class="cal">' + encabezado();

  HORAS.forEach((hora) => {
    h += `<tr><td class="hora">${hora}</td><td class="inau">🎤 INAUGURACIÓN</td>`;
    DIAS.forEach((d) => {
      if (modo === "lectura") {
        h += celdaLectura(reservas, d.id, hora, lugarId);
      } else {
        h += celdaSeleccion(
          reservas,
          opts.actividad,
          opts.actsForm,
          opts.indexActual,
          d.id,
          hora,
          opts.onSelectFn || "setSlot"
        );
      }
    });
    h += "</tr>";
  });

  return h + "</table></div>";
}
