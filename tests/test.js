/**
 * Prueba funcional end-to-end con jsdom.
 *
 * NOTA: jsdom no ejecuta <script type="module"> de forma confiable.
 * Para correr este test, genera una copia de index.html con los
 * módulos "bundleados" en un <script> normal (sin type="module"),
 * o usa un runner de pruebas con soporte real de navegador
 * (Playwright, Cypress) apuntando a `npx serve .`.
 */
const { JSDOM } = require("jsdom");
const fs = require("fs");

(async () => {
  const html = fs.readFileSync("../index.html", "utf-8");

  // window.storage en memoria (simula el almacenamiento compartido del entorno real)
  const store = {};
  const storageImpl = {
    get: async (key, shared) => (key in store ? { key, value: store[key], shared } : null),
    set: async (key, value, shared) => { store[key] = value; return { key, value, shared }; },
  };

  const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`, {
    runScripts: "dangerously",
    resources: "usable",
    url: "https://example.org/",
  });

  dom.window.storage = storageImpl;
  // jsdom no implementa alert/confirm
  dom.window.alert = (m) => console.log("ALERT:", m);
  dom.window.confirm = () => true;

  // esperar a que el módulo cargue y haga su render inicial
  await new Promise((r) => setTimeout(r, 300));

  const { document, window } = dom.window;
  const $ = (s) => document.querySelector(s);

  console.log("== Estado inicial ==");
  console.log("Tab activo:", $(".tab.on")?.id);
  console.log("Paso 1 visible:", !!$("#fInst"));

  // ---- Paso 1: institución ----
  $("#fInst").value = "Universidad de Prueba";
  $("#fCon").value = "Ana Pérez";
  $("#fTel").value = "300-000-0000";
  window.paso1();
  await new Promise((r) => setTimeout(r, 50));
  console.log("\n== Paso 2 ==");
  console.log("Pregunta cantidad:", $("h2")?.textContent.trim().slice(0, 60));

  // ---- Paso 2: cantidad = 2 ----
  window.setN(2);
  window.paso2();
  await new Promise((r) => setTimeout(r, 50));
  console.log("\n== Paso 3 ==");
  console.log("Tickets renderizados:", document.querySelectorAll(".ticket").length);

  // ---- Paso 3: llenar actividad 0 (Gaming, martes 8-9, Teatrino) ----
  $("#nom0").value = "Taller de VR";
  window.form.acts[0].nombre = "Taller de VR";
  window.setCat(0, "gaming");
  await new Promise((r) => setTimeout(r, 20));
  // elegir slot: buscar el botón "Disponible" de Martes (col 3) fila 8:00-9:00 dentro del primer ticket
  const ticket0 = document.querySelectorAll(".ticket")[0];
  const firstRow = ticket0.querySelectorAll("table.cal tr")[1]; // primera fila de horas
  const martesCell = firstRow.querySelectorAll("td")[2]; // Hora | Lunes | Martes...
  const slotBtn = martesCell.querySelector("button.slot");
  console.log("Slot a elegir (Actividad 1):", slotBtn?.textContent.trim());
  window.setSlot(0, "mar", "8:00 - 9:00");
  await new Promise((r) => setTimeout(r, 20));

  // ---- Paso 3: llenar actividad 1 (IA, martes 9-10, Biblioteca El Futuro) ----
  $("#nom1").value = "Charla IA";
  window.form.acts[1].nombre = "Charla IA";
  window.setCat(1, "ia");
  window.setLugar(1, "futuro");
  await new Promise((r) => setTimeout(r, 20));
  window.setSlot(1, "mar", "9:00 - 10:00");
  await new Promise((r) => setTimeout(r, 20));

  console.log("\nForm tras llenar:", JSON.stringify(window.form.acts.map(a=>({nombre:a.nombre,cat:a.cat,dia:a.dia,hora:a.hora,lugar:a.lugar}))));

  // ---- Paso 3 -> 4 ----
  window.paso3();
  await new Promise((r) => setTimeout(r, 50));
  console.log("\n== Paso 4 ==");
  console.log("Título:", $("h2")?.textContent.trim());
  console.log("Resúmenes:", document.querySelectorAll(".sum").length);

  // ---- Confirmar ----
  await window.confirmar();
  await new Promise((r) => setTimeout(r, 100));
  console.log("\n== Paso 5 (éxito) ==");
  console.log("Título:", $("h2")?.textContent.trim());
  console.log("Storage guardado, nº reservas:", JSON.parse(store["reservas_semana_juventud"]).length);

  // ---- Ir a Cronograma ----
  await window.go("crono");
  await new Promise((r) => setTimeout(r, 100));
  console.log("\n== Cronograma ==");
  console.log("Tarjetas de lugar:", document.querySelectorAll(".card h3").length);
  console.log("Contadores:", Array.from(document.querySelectorAll(".count b")).map(e=>e.textContent.trim()));
  const occCells = Array.from(document.querySelectorAll(".cell .who")).map(e=>e.parentElement.textContent.trim());
  console.log("Celdas ocupadas:", occCells);

  // ---- Probar segunda institución con cruce de horario ----
  window.nuevoRegistro();
  await window.go("reservar");
  await new Promise((r) => setTimeout(r, 50));
  $("#fInst").value = "Empresa Cruce";
  $("#fCon").value = "Luis";
  $("#fTel").value = "300-111-1111";
  window.paso1();
  window.setN(1);
  window.paso2();
  await new Promise((r) => setTimeout(r, 50));
  $("#nom0").value = "Choque";
  window.form.acts[0].nombre = "Choque";
  window.setCat(0, "gaming"); // gaming -> martes/IA día válido
  await new Promise((r) => setTimeout(r, 20));
  // El mismo slot (martes 8-9, teatrino) ya está ocupado -> debe verse como ocupado, no como botón
  const ticketCruce = document.querySelectorAll(".ticket")[0];
  const rowCruce = ticketCruce.querySelectorAll("table.cal tr")[1];
  const martesCellCruce = rowCruce.querySelectorAll("td")[2];
  console.log("\n== Prueba de cruce ==");
  console.log("Celda Martes 8-9 (Teatrino) para 2da institución:", martesCellCruce.textContent.replace(/\s+/g," ").trim());
  console.log("¿Tiene botón seleccionable?", !!martesCellCruce.querySelector("button.slot"));

  // ---- Admin: login y aprobar ----
  await window.go("admin");
  await new Promise((r) => setTimeout(r, 50));
  $("#clave").value = "juventud2026";
  window.entrarAdmin();
  await new Promise((r) => setTimeout(r, 50));
  console.log("\n== Admin ==");
  console.log("Registros listados:", document.querySelectorAll(".admrow").length);
  const reservasNow = JSON.parse(store["reservas_semana_juventud"]);
  const idAprobar = reservasNow[0].id;
  await window.setEstado(idAprobar, "aprobado");
  await new Promise((r) => setTimeout(r, 50));
  const reservasAfter = JSON.parse(store["reservas_semana_juventud"]);
  console.log("Estado actualizado:", reservasAfter.find(r=>r.id===idAprobar).estado);
  console.log("Pill en UI:", document.querySelector(".pill")?.textContent.trim());

  console.log("\n== Límite de 3 actividades ==");
  // Universidad de Prueba ya tiene 2; intentar registrar 1 más (debe permitir hasta completar 3)
  window.nuevoRegistro();
  await window.go("reservar");
  await new Promise(r=>setTimeout(r,50));
  $("#fInst").value = "Universidad de Prueba";
  $("#fCon").value = "Ana"; $("#fTel").value = "300";
  window.paso1();
  await new Promise(r=>setTimeout(r,50));
  console.log("Texto cupo:", $("h2 + p")?.textContent.trim());
  const qtyButtons = document.querySelectorAll(".qty button");
  console.log("Botones de cantidad y disabled:", Array.from(qtyButtons).map(b=>[b.textContent.replace(/\s+/g," ").trim(), b.disabled]));

  console.log("\nTODO OK");
})().catch(e => { console.error("ERROR:", e); process.exit(1); });
