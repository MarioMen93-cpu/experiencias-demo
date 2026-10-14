/* Daily Cue — vuelta "pro" de la maqueta: bienvenida, modo cine, tarjetas para historias,
   Wrapped mensual, archivo de retos, logros, tema claro/oscuro e instalación (PWA).
   Usa las funciones y datos globales de app.js, datos.js y textos.js. */
"use strict";

// ---------- perfil propio guardado por la bienvenida ----------
const INSTRUMENTOS = ["piano", "guitar", "voice", "synth", "drums", "bass", "violin", "cello", "flute", "oboe", "trumpet", "percussion", "choir", "theremin", "kora", "marimba"];
const GENEROS = ["orchestral", "film", "games", "lo-fi", "jazz", "trap", "rap", "folk", "electronic", "ambient", "classical", "bolero", "chiptune", "choral", "afrobeat", "andean", "sound design", "bedroom pop"];
function aplicarPerfilGuardado() {
  try {
    const g = JSON.parse(guardado("dc_perfil") || "null"); if (!g) return;
    const yo = persona(YO);
    if (g.inst?.length) yo.inst = g.inst;
    if (g.gen?.length) yo.gen = g.gen;
  } catch {}
}
aplicarPerfilGuardado();

// ---------- capa (overlay) genérica ----------
function capa(html, clase = "") {
  cerrarCapa();
  const el = document.createElement("div");
  el.className = `capa ${clase}`; el.id = "capa";
  el.innerHTML = html;
  document.body.appendChild(el);
  document.body.classList.add("con-capa");
  setTimeout(() => el.classList.add("ver"), 20);
  return el;
}
function cerrarCapa() {
  const el = $("#capa"); if (!el) return;
  cancelAnimationFrame(cine.raf); cine.abierto = false;
  el.remove(); document.body.classList.remove("con-capa");
}
document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarCapa(); });

// ---------- 1. Bienvenida en 3 pasos ----------
const ob = { paso: 1, inst: new Set(), gen: new Set(), dif: "medium" };
function bienvenida() {
  const pasos = {
    1: [t("ob_inst_q"), t("ob_inst_sub"), INSTRUMENTOS.map(x => `<button class="op ${ob.inst.has(x) ? "on" : ""}" data-ob-inst="${x}">${esc(etiq(x))}</button>`).join("")],
    2: [t("ob_gen_q"), t("ob_gen_sub"), GENEROS.map(x => `<button class="op ${ob.gen.has(x) ? "on" : ""}" data-ob-gen="${x}">${esc(etiq(x))}</button>`).join("")],
    3: [t("ob_dif_q"), t("ob_dif_sub"), `<div class="ob-dif">${Object.entries(T("ob_dif")).map(([k, [a, b]]) =>
      `<button class="ob-dif-op ${ob.dif === k ? "on" : ""}" data-ob-dif="${k}"><b>${esc(a)}</b><span>${esc(b)}</span></button>`).join("")}</div>`],
  };
  const [q, sub, cuerpo] = pasos[ob.paso];
  const html = `<div class="dialogo bienvenida" role="dialog" aria-modal="true" aria-label="${t("ob_welcome")}">
    <div class="ob-cab"><a class="logo" style="font-size:22px">Daily <em>Cue</em><span class="cuemark"></span></a>
      <button class="chip" data-idioma>${t("lang_switch_short")}</button></div>
    <div class="ob-progreso">${[1, 2, 3].map(n => `<i class="${n <= ob.paso ? "on" : ""}"></i>`).join("")}</div>
    <div class="eyebrow">${ob.paso === 1 ? t("ob_welcome") + " · " : ""}${t("ob_step", { n: ob.paso })}</div>
    <h2 class="ob-q">${q}</h2><p class="fino ob-sub">${sub}</p>
    <div class="ops">${cuerpo}</div>
    <div class="ob-pie">
      ${ob.paso > 1 ? `<button class="btn btn-ghost" data-ob-atras>${t("ob_back")}</button>` : "<span></span>"}
      <button class="btn" data-ob-sig>${ob.paso === 3 ? t("ob_finish") : t("ob_next")}</button>
    </div></div>`;
  const el = $("#capa.capa-ob");
  if (el) el.innerHTML = html; else capa(html, "capa-ob");
}
function terminarBienvenida() {
  guardar("dc_perfil", JSON.stringify({ inst: [...ob.inst], gen: [...ob.gen], dif: ob.dif }));
  aplicarPerfilGuardado(); cerrarCapa(); ruta();
}

// ---------- 2. Modo cine ----------
const cine = { abierto: false, raf: 0, ultimo: null };
function abrirCine() {
  if (!player.pista) { const cola = mezclar(pistasDeAyer(), diaUTC() + estado.semillaMezcla); reproducir(cola[0], cola); }
  cine.abierto = true; cine.ultimo = null;
  capa(`<div class="cine-fondo" id="cineFondo"></div>
    <button class="icon-btn cine-cerrar" data-cerrar aria-label="${t("close")}"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <div class="cine-centro">
      <div class="eyebrow" id="cineReto"></div>
      <canvas id="cineVis" width="900" height="300" aria-hidden="true"></canvas>
      <h2 class="cine-titulo" id="cineTitulo"></h2>
      <div class="cine-autor" id="cineAutor"></div>
      <div class="cine-onda-caja"><div id="cineMarcas"></div><div class="p-onda cine-onda" id="cineOnda"></div></div>
      <div class="cine-controles">
        <button class="icon-btn" data-cine-ant aria-label="Previous"><svg viewBox="0 0 24 24"><path d="M18 5L8 12l10 7zM6 5v14"/></svg></button>
        <button class="play-btn cine-play" data-cine-play aria-label="Play/pause"></button>
        <button class="icon-btn" data-cine-sig aria-label="Next"><svg viewBox="0 0 24 24"><path d="M6 5l10 7-10 7zM18 5v14"/></svg></button>
      </div>
    </div>`, "capa-cine");
  const loop = () => { if (!cine.abierto) return; pintarCine(); cine.raf = requestAnimationFrame(loop); };
  loop();
  document.documentElement.requestFullscreen?.().catch(() => {});
}
function pintarCine() {
  const p = player.pista; if (!p) return;
  if (cine.ultimo !== p.id) {
    cine.ultimo = p.id;
    $("#cineFondo").style.cssText = arteGenerativo(hash(p.reto.id));
    $("#cineReto").textContent = `${t("now_playing")} · ${p.reto.title}`;
    $("#cineTitulo").textContent = p.titulo;
    $("#cineAutor").innerHTML = `${enlaceUsuario(p.user)} · ${esc(persona(p.user)?.city || "")}`;
    $("#cineOnda").innerHTML = barrasHTML(p.onda); $("#cineOnda").dataset.onda = p.id;
    $("#cineMarcas").innerHTML = marcadoresHTML(p);
  }
  $(".cine-play").classList.toggle("pausa", player.tocando);
  const frac = Math.min(1, tiempoActual() / p.dur), barras = $("#cineOnda").children, lim = Math.floor(frac * barras.length);
  for (let i = 0; i < barras.length; i++) barras[i].classList.toggle("on", i < lim);
  // Visualizador: barras espejo que responden al audio
  const cv = $("#cineVis"), g = cv.getContext("2d"), W = cv.width, H = cv.height;
  g.clearRect(0, 0, W, H);
  const datos = new Uint8Array(player.analizador ? player.analizador.frequencyBinCount : 64);
  if (player.analizador && player.tocando) player.analizador.getByteFrequencyData(datos);
  const color = getComputedStyle(document.documentElement).getPropertyValue("--tungsten").trim() || "#F2A93B";
  const mitad = 28, ancho = W / (mitad * 2);
  for (let i = 0; i < mitad; i++) {
    // escala logarítmica: los graves no acaparan todo, centro = graves, orillas = agudos
    const bin = Math.floor(1 + Math.pow(i / mitad, 1.6) * 44), v = (datos[bin] || 0) / 255, h = Math.max(3, Math.pow(v, 2.2) * H * 0.48);
    g.fillStyle = color; g.globalAlpha = 0.3 + v * 0.7;
    [W / 2 + i * ancho, W / 2 - (i + 1) * ancho].forEach(x => g.fillRect(x + 2, H / 2 - h, ancho - 4, h * 2));
  }
  g.globalAlpha = 1;
}
function anteriorEnCola() {
  const i = player.cola.findIndex(x => x.id === player.pista?.id);
  const ant = player.cola[(i - 1 + player.cola.length) % player.cola.length];
  if (ant) reproducir(ant, null, 0);
}

// ---------- 3. Tarjetas para historias (1080×1920) ----------
function envolver(g, texto, x, y, maxAncho, alto, maxLineas) {
  const palabras = String(texto).split(/\s+/), lineas = []; let linea = "";
  for (const w of palabras) { const prueba = linea ? linea + " " + w : w; if (g.measureText(prueba).width > maxAncho && linea) { lineas.push(linea); linea = w; } else linea = prueba; }
  if (linea) lineas.push(linea);
  lineas.slice(0, maxLineas).forEach((l, i) => g.fillText(i === maxLineas - 1 && lineas.length > maxLineas ? l + "…" : l, x, y + i * alto));
  return Math.min(lineas.length, maxLineas) * alto;
}
async function dibujarTarjeta(tipo, datos) {
  await Promise.all(["600 120px Fraunces", "italic 400 120px Fraunces", "600 40px Inter", "600 34px 'JetBrains Mono'"].map(f => document.fonts.load(f).catch(() => {})));
  const cv = document.createElement("canvas"); cv.width = 1080; cv.height = 1920;
  const g = cv.getContext("2d"), r = rng(hash(datos.semilla || "dc"));
  g.fillStyle = "#0F0E13"; g.fillRect(0, 0, 1080, 1920);
  const h1 = Math.floor(r() * 360), h2 = (h1 + 60 + r() * 80) % 360;
  [[200 + r() * 600, 300 + r() * 400, 900, `hsla(${h1},70%,55%,.45)`], [r() * 1080, 1100 + r() * 500, 1000, `hsla(${h2},60%,45%,.45)`], [900, 200, 600, "rgba(242,169,59,.25)"]].forEach(([x, y, rad, c]) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, c); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 1080, 1920);
  });
  // marca
  g.fillStyle = "#EFE9DF"; g.font = "600 64px Fraunces"; g.textBaseline = "alphabetic"; g.fillText("Daily", 96, 170);
  const anchoDaily = g.measureText("Daily ").width; g.fillStyle = "#F2A93B"; g.font = "italic 400 64px Fraunces"; g.fillText("Cue", 96 + anchoDaily, 170);
  const xm = 96 + anchoDaily + g.measureText("Cue").width + 22;
  g.strokeStyle = "#F2A93B"; g.lineWidth = 5; g.beginPath(); g.arc(xm, 118, 15, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(xm, 118, 6, 0, Math.PI * 2); g.fill();
  // cuerpo
  g.fillStyle = "#F2A93B"; g.font = "600 34px 'JetBrains Mono'"; g.fillText(datos.eyebrow.toUpperCase(), 96, 640);
  g.fillStyle = "#EFE9DF"; g.font = "600 112px Fraunces";
  const alto = envolver(g, datos.titulo, 96, 790, 888, 124, 4);
  g.fillStyle = "#D8D1C6"; g.font = "400 44px Inter"; envolver(g, datos.sub, 96, 790 + alto + 40, 888, 60, 3);
  // onda
  const onda = datos.onda || Array.from({ length: 48 }, () => 0.2 + r() * 0.8), ox = 96, ow = 888, oy = 1500, bw = ow / onda.length;
  onda.forEach((v, i) => { g.fillStyle = i < onda.length * 0.62 ? "#F2A93B" : "rgba(239,233,223,.25)"; const h = v * 150; g.fillRect(ox + i * bw + 3, oy - h / 2, bw - 6, h); });
  g.fillStyle = "#EFE9DF"; g.font = "600 44px Inter"; g.fillText("@" + datos.usuario, 96, 1700);
  g.fillStyle = "#9C95A8"; g.font = "400 34px 'JetBrains Mono'"; g.fillText("dailycue.app", 96, 1780);
  return cv;
}
async function abrirTarjeta(tipo, extra = {}) {
  const { reto } = retoDelDia(0), yo = persona(YO);
  const datos = tipo === "mes"
    ? { semilla: "mes" + diaUTC(), eyebrow: t("card_month"), titulo: extra.titulo, sub: extra.sub, usuario: YO }
    : { semilla: reto.id, eyebrow: `${t("card_composed")} · ${reto.id}`, titulo: reto.title, sub: extra.titulo ? `“${extra.titulo}”` : yo.n, usuario: YO,
        onda: pistasDe(YO)[0]?.onda };
  const cv = await dibujarTarjeta(tipo, datos);
  const url = cv.toDataURL("image/png");
  capa(`<div class="dialogo tarjeta-dlg" role="dialog" aria-modal="true">
    <button class="icon-btn cine-cerrar" data-cerrar aria-label="${t("close")}"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <div class="eyebrow">${t("share_title")}</div><p class="fino" style="font-size:14px;margin:6px 0 16px">${t("share_sub")}</p>
    <img class="tarjeta-img" src="${url}" alt="">
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">
      <a class="btn" href="${url}" download="daily-cue-${datos.semilla}.png">${t("download")}</a>
      <button class="btn btn-ghost" data-compartir-img>${t("share_native")}</button>
    </div></div>`, "capa-tarjeta");
  $("[data-compartir-img]").onclick = async () => {
    try {
      const blob = await (await fetch(url)).blob(), file = new File([blob], "daily-cue.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: "Daily Cue" });
      else toast(t("download"));
    } catch {}
  };
}

// ---------- 4. Logros ----------
const LOGROS = { week: "7", month: "30", calendar: "7/7", hopper: "5", picked: "★", brave: "?!", ear: "50", first: "1st" };
function logrosHTML(u) {
  const r = rng(hash(u.h + "logros")), racha = rachaDe(u);
  const prog = {
    week: Math.min(1, racha / 7), month: Math.min(1, racha / 30), calendar: u.h === YO ? 1 : Math.min(1, 0.3 + r()),
    hopper: u.h === YO ? 1 : Math.min(1, 0.2 + r()), picked: u.h === YO ? 1 : r() < 0.3 ? 1 : 0,
    brave: u.h === YO ? 0 : r() < 0.4 ? 1 : 0, ear: u.h === YO ? 27 / 50 : Math.min(1, r() * 1.3), first: r() < 0.5 ? 1 : 0,
  };
  return `<section class="seccion"><div class="seccion-cab"><h2>${t("badges")}</h2><span class="fino">${Object.values(prog).filter(v => v >= 1).length}/8</span></div>
    <div class="logros">${Object.keys(LOGROS).map(k => { const v = prog[k], ok = v >= 1, [nom, desc] = T("bdg")[k];
      return `<div class="logro ${ok ? "ok" : ""}" title="${esc(desc)}">
        <div class="medalla"><span>${LOGROS[k]}</span></div>
        <b>${esc(nom)}</b><span class="fino">${esc(desc)}</span>
        ${ok ? "" : `<div class="logro-barra"><i style="width:${Math.round(v * 100)}%"></i></div>`}
      </div>`; }).join("")}</div></section>`;
}

// ---------- 5. Archivo de retos pasados ----------
VISTAS.archive = function () {
  const fmt = new Intl.DateTimeFormat(LANG, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  const filas = Array.from({ length: 30 }, (_, k) => {
    const off = -k, { reto, ranura, dia } = retoDelDia(off), n = 180 + Math.floor(rng(dia)() * 700);
    const cuando = off === 0 ? t("today") : off === -1 ? t("yesterday") : fmt.format(new Date(dia * DIA_MS));
    return `<div class="archivo-fila">
      <div class="archivo-fecha mono">${esc(cuando)}</div>
      <div class="archivo-cuerpo">
        <a href="${off === 0 ? "#challenge" : `#cue/${off}`}" class="archivo-titulo">${esc(reto.title)}</a>
        <div class="fino">${esc(reto.id)} · ${esc(ranura)} · ${off === 0 ? "" : `${n} ${t("entries")}`}</div>
      </div>
      <div class="archivo-acc">${chipDif(reto.difficulty)}
        ${off < 0 ? `<button class="accion" data-room-de="${off}">▶ ${t("hear_room")}</button>` : ""}
        <a class="accion" href="${off === 0 ? "#challenge" : `#cue/${off}`}">${t("do_it")} →</a></div>
    </div>`;
  }).join("");
  return `${cabeceraMovil()}
    <div class="eyebrow">${t("archive")}</div>
    <h1 class="reto-titulo" style="font-size:clamp(32px,4.6vw,50px);margin-bottom:8px">${t("archive_title")}</h1>
    <p class="fino" style="font-size:15px;max-width:62ch;margin:0 0 22px">${t("archive_sub")}</p>
    <div class="archivo">${filas}</div>`;
};

// ---------- 6. Wrapped mensual (historias) ----------
const wr = { i: 0 };
VISTAS.wrapped = function () {
  const yo = persona(YO), mes = new Intl.DateTimeFormat(LANG, { month: "long" }).format(new Date());
  const piezas = pistasDe(YO), top = piezas.slice().sort((a, b) => totalReac(b) - totalReac(a))[0];
  const otros = yo.gen.slice(1).map(etiq).join(", ") || etiq("ambient");
  const slides = [
    [t("wr_title", { month: mes }), `<div class="wr-grande">Daily <em>Cue</em></div>`, t("wr_tap")],
    [t("wr_s1"), `<div class="wr-num">12</div>`, t("wr_s1b")],
    [t("wr_s2"), `<div class="wr-palabra">${esc(etiq(yo.gen[0]))}</div>`, `${t("wr_s2b")} ${esc(otros)}.`],
    [t("wr_s3"), `<div class="wr-palabra" style="font-size:clamp(30px,7vw,44px)">“${esc(top?.titulo || "")}”</div>`, `${top ? totalReac(top) : 0} ${t("wr_s3b")} · ${esc(top?.reto.title || "")}`],
    [t("wr_s4"), `<div class="wr-num">418</div>`, `${t("wr_s4b")} 37 ${t("wr_s4c")}`],
    [t("wr_s5"), `<div class="wr-num">23</div>`, t("wr_s5b"), true],
  ];
  wr.i = Math.min(wr.i, slides.length - 1);
  const [cab, centro, pie, final] = slides[wr.i];
  return `<div class="wrapped-escena">
    <div class="historia" data-wr-sig style="${arteGenerativo(hash("wr" + wr.i))}">
      <div class="historia-barras">${slides.map((_, k) => `<i class="${k < wr.i ? "lleno" : k === wr.i ? "actual" : ""}"></i>`).join("")}</div>
      <div class="historia-cab eyebrow">${esc(cab)}</div>
      <div class="historia-centro">${centro}</div>
      <div class="historia-pie">${esc(pie)}</div>
      ${final ? `<button class="btn" data-wr-compartir>${t("wr_share")}</button>` : ""}
    </div>
    <div class="wrapped-nav"><button class="btn btn-ghost" data-wr-ant ${wr.i ? "" : "disabled"}>←</button><a class="btn btn-ghost" href="#profile">${t("close")}</a><button class="btn btn-ghost" data-wr-sig>→</button></div>
  </div>`;
};

// ---------- 7. Tema claro / oscuro ----------
function aplicarTema(tema) { document.documentElement.dataset.theme = tema; guardar("dc_tema", tema); const b = $("[data-tema] span"); if (b) b.textContent = tema === "light" ? t("theme_dark") : t("theme_light"); }
aplicarTema(guardado("dc_tema") || "dark");

// ---------- 8. App instalable ----------
let avisoInstalar = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); avisoInstalar = e; const b = $("[data-instalar]"); if (b) b.hidden = false; });
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register("sw.js").catch(() => {});

// ---------- eventos ----------
document.addEventListener("click", e => {
  const b = e.target.closest("button, [data-wr-sig]"); if (!b) return;
  const d = b.dataset;
  if (d.obInst) { ob.inst.has(d.obInst) ? ob.inst.delete(d.obInst) : ob.inst.add(d.obInst); bienvenida(); }
  else if (d.obGen) { ob.gen.has(d.obGen) ? ob.gen.delete(d.obGen) : ob.gen.add(d.obGen); bienvenida(); }
  else if (d.obDif) { ob.dif = d.obDif; bienvenida(); }
  else if ("obSig" in d) { if (ob.paso === 3) terminarBienvenida(); else { ob.paso++; bienvenida(); } }
  else if ("obAtras" in d) { ob.paso--; bienvenida(); }
  else if ("bienvenida" in d) { ob.paso = 1; bienvenida(); }
  else if ("cine" in d) abrirCine();
  else if ("cerrar" in d) cerrarCapa();
  else if ("cinePlay" in d) pausar();
  else if ("cineSig" in d) siguiente();
  else if ("cineAnt" in d) anteriorEnCola();
  else if (d.roomDe) { const cola = mezclar(pistasDelDia(+d.roomDe), diaUTC()); reproducir(cola[0], cola); }
  else if ("wrCompartir" in d) { e.stopPropagation(); abrirTarjeta("mes", { titulo: `12 ${t("wr_s1b")}`, sub: `23 ${t("days")} · ${etiq(persona(YO).gen[0])}` }); }
  else if ("wrSig" in d) { if (wr.i < 5) { wr.i++; ruta(); } }
  else if ("wrAnt" in d) { if (wr.i > 0) { wr.i--; ruta(); } }
  else if ("tema" in d) aplicarTema(document.documentElement.dataset.theme === "light" ? "dark" : "light");
  else if ("instalar" in d && avisoInstalar) { avisoInstalar.prompt(); avisoInstalar = null; b.hidden = true; }
});
// El idioma también se cambia dentro de la bienvenida
document.addEventListener("click", e => { if (e.target.closest("[data-idioma]") && $("#capa.capa-ob")) setTimeout(bienvenida, 0); });
// Primera visita: bienvenida
window.addEventListener("load", () => { if (!guardado("dc_perfil")) setTimeout(bienvenida, 400); });
