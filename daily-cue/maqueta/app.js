/* Daily Cue — maqueta navegable (Fase 0).
   Sin servidor: los retos salen de ../retos/banco-100(.es).json y las pistas de la Room se sintetizan
   en el navegador (WebAudio) para que el reproductor funcione de verdad.
   Textos de interfaz en textos.js; personas, frases y redes en datos.js. */
"use strict";

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---------- idioma ----------
const guardado = k => { try { return localStorage.getItem(k); } catch { return null; } };
const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
let LANG = guardado("dc_lang") || (/^es/i.test(navigator.language) ? "es" : "en");
const t = (k, vars = {}) => String((TEXTOS[LANG][k] ?? TEXTOS.en[k] ?? k)).replace(/\{(\w+)\}/g, (_, v) => vars[v] ?? "");
const T = k => TEXTOS[LANG][k] ?? TEXTOS.en[k];
const etiq = w => (LANG === "es" && ETIQ_ES[String(w).toLowerCase()]) || String(w).replace(/_/g, " ");

// ---------- azar con semilla (todo es reproducible por día) ----------
function rng(seed) {
  let s = (Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) ^ (seed >>> 13)) >>> 0 || 1;
  for (let i = 0; i < 4; i++) { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; }
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const hash = str => [...String(str)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

// ---------- retos ----------
const RESPALDO = [
  { id: "DC-001", title: "The Village the Maps Forgot", day_slot: "thu_story_cue", format: "text_only", constraints: ["rhythmic"], world: "imaginary_ethnography", genre: "any", difficulty: "medium",
    prompt: "Deep in the jungle, a village has kept playing the same festival rhythms for six hundred years, untouched by the outside world. Compose the drum pattern that wakes them at dawn on the day of the festival.",
    twist: null, image_prompt: null, seed: null, quick_version: "One 8-bar rhythmic loop on any surface.", deep_version: "Three layered patterns that interlock, plus a call-and-response voice.", tags: ["rhythm"], credit: "Claude" },
];
const estado = { banco: { en: RESPALDO, es: null }, likes: new Set(), reposts: new Set(), reac: new Set(), sigo: new Set(["fugue_state", "lofi_lupe"]), filtro: "shuffle", semillaMezcla: 0, buscar: "", soloColab: false, editando: false };

async function cargarJSON(url) {
  try { const r = await fetch(url, { cache: "no-store" }); if (!r.ok) return null; const d = await r.json(); return Array.isArray(d) && d.length ? d : null; } catch { return null; }
}
async function cargarBancos() {
  const [en, es] = await Promise.all([cargarJSON("../retos/banco-100.json"), cargarJSON("../retos/banco-100.es.json")]);
  if (en) estado.banco.en = en;
  estado.banco.es = es;
}
const banco = () => (LANG === "es" && estado.banco.es) || estado.banco.en;

// Día UTC: el reto cambia a las 00:00 UTC para todo el mundo
const DIA_MS = 864e5;
const DIAS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const RANURA_CLAVE = { Sun: "sun_", Mon: "mon_", Tue: "tue_", Wed: "wed_", Thu: "thu_", Fri: "fri_", Sat: "sat_" };
const diaUTC = (off = 0) => Math.floor(Date.now() / DIA_MS) + off;
const diaSemana = dia => DIAS[new Date(dia * DIA_MS).getUTCDay()];
function retoDelDia(off = 0) {
  const dia = diaUTC(off), ds = diaSemana(dia), b = banco();
  const candidatos = b.filter(c => String(c.day_slot || "").startsWith(RANURA_CLAVE[ds]));
  const lista = candidatos.length ? candidatos : b;
  return { reto: lista[Math.floor(dia / 7) % lista.length], ranura: T("slots")[ds], dia };
}

// ---------- pistas (ideas subidas) ----------
const REG = new Map();
function pistasDelDia(off) {
  const { reto, dia } = retoDelDia(off);
  const r = rng(dia * 97 + 13);
  return PERSONAS.map((u, i) => {
    const seed = hash(u.h + dia), rr = rng(seed);
    const p = {
      id: `${dia}-${u.h}`, user: u.h, seed, dia, reto,
      titulo: TITULOS_PIEZA[(i + dia) % TITULOS_PIEZA.length],
      dur: 18 + Math.floor(rr() * 16),
      likes: Math.floor(r() * 90) + 3, reposts: Math.floor(r() * 14), coments: 2 + Math.floor(r() * 7),
      reac: { fire: Math.floor(r() * 40), film: Math.floor(r() * 25), loop: Math.floor(r() * 30), idea: Math.floor(r() * 12) },
      pide: rr() < 0.4 ? ["melody", "harmony", "mix", "rhythm"][Math.floor(rr() * 4)] : null,
      tags: [ETIQUETAS_PIEZA[Math.floor(rr() * ETIQUETAS_PIEZA.length)], ETIQUETAS_PIEZA[Math.floor(rr() * ETIQUETAS_PIEZA.length)]].filter((v, k, a) => a.indexOf(v) === k),
      onda: Array.from({ length: 64 }, (_, k) => 0.25 + 0.75 * Math.abs(Math.sin(k * (0.2 + rr() * 0.3)) * (0.5 + rr() * 0.5))),
    };
    REG.set(p.id, p);
    return p;
  }).filter(p => p.user === YO || rng(p.seed + 1)() < 0.88); // no todos participan todos los días
}
const pistasDeAyer = () => pistasDelDia(-1);
const REAC = { fire: "🔥", film: "🎬", loop: "🔁", idea: "💡" };
const totalReac = p => Object.keys(REAC).reduce((a, k) => a + p.reac[k] + (estado.reac.has(`${p.id}:${k}`) ? 1 : 0), 0);
// Comentarios fijos por pista (con su segundo exacto), para la lista y para los marcadores sobre la onda
const misComentarios = new Map(); // id de pista → comentarios escritos en esta sesión
function comentariosDe(p) {
  const r = rng(p.seed + 5), otros = PERSONAS.filter(u => u.h !== p.user && u.h !== YO), n = Math.min(p.coments, 5);
  return Array.from({ length: n }, () => ({ u: otros[Math.floor(r() * otros.length)], t: 1 + Math.floor(r() * (p.dur - 2)), i: Math.floor(r() * 8) }))
    .concat(misComentarios.get(p.id) || [])
    .sort((a, b) => a.t - b.t);
}
const textoComentario = c => c.txt ?? COMENTARIOS[LANG][c.i];
const numComentarios = p => p.coments + (misComentarios.get(p.id)?.length || 0);
// Si la pista está sonando, el comentario se ancla al segundo actual; si no, al inicio
const segundoParaComentar = p => player.pista?.id === p.id ? Math.floor(tiempoActual()) : 0;
function publicarComentario(id, input) {
  const txt = input.value.trim(); if (!txt) return;
  const p = REG.get(id), lista = misComentarios.get(id) || [];
  lista.push({ u: persona(YO), t: segundoParaComentar(p), txt, mio: true });
  misComentarios.set(id, lista);
  const hilo = document.querySelector(`[data-hilo="${id}"]`);
  if (hilo) hilo.innerHTML = comentariosHTML(p);
  const pista = document.querySelector(`.pista[data-id="${id}"]`);
  if (pista) pista.outerHTML = pistaHTML(p);
  if (player.pista?.id === id) $("#pMarcas").innerHTML = marcadoresHTML(p);
  pintarPlayer();
  document.querySelector(`[data-hilo="${id}"] input`)?.focus();
}
const pistasDe = h => Array.from({ length: 10 }, (_, k) => pistasDelDia(-1 - k)).flat().filter(p => p.user === h).slice(0, 6);
function mezclar(arr, seed) {
  const a = arr.slice(), r = rng(seed);
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const MODOS = { dorian: [0, 2, 3, 5, 7, 9, 10], aeolian: [0, 2, 3, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11], pent: [0, 3, 5, 7, 10], major: [0, 2, 4, 5, 7, 9, 11], phryg: [0, 1, 3, 5, 7, 8, 10] };
const cacheBuffers = new Map();
async function sintetizar(p) {
  if (cacheBuffers.has(p.id)) return cacheBuffers.get(p.id);
  const sr = 44100, ctx = new OfflineAudioContext(2, sr * p.dur, sr), r = rng(p.seed);
  const modo = Object.values(MODOS)[Math.floor(r() * 6)], raiz = 45 + Math.floor(r() * 12);
  const bpm = 70 + Math.floor(r() * 50), beat = 60 / bpm, onda = ["triangle", "sine", "square", "sawtooth"][Math.floor(r() * 4)];
  const master = ctx.createGain(); master.gain.value = 0.22; master.connect(ctx.destination);
  const eco = ctx.createDelay(); eco.delayTime.value = beat * 0.75; const fb = ctx.createGain(); fb.gain.value = 0.3;
  eco.connect(fb); fb.connect(eco); eco.connect(master);
  const freq = n => 440 * Math.pow(2, (n - 69) / 12);
  const nota = (tt, n, d, tipo, vol, filtro) => {
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = tipo; o.frequency.value = freq(n); f.type = "lowpass"; f.frequency.value = filtro;
    g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(vol, tt + 0.015); g.gain.exponentialRampToValueAtTime(0.001, tt + d);
    o.connect(f); f.connect(g); g.connect(master); g.connect(eco); o.start(tt); o.stop(tt + d + 0.05);
  };
  const motivo = Array.from({ length: 8 }, () => Math.floor(r() * modo.length * 1.5));
  let grado = 0;
  for (let tt = 0.1, k = 0; tt < p.dur - 1; tt += beat / 2, k++) {
    if (k % 8 === 0) nota(tt, raiz - 12 + modo[[0, 3, 4, 0][(k / 8) % 4] % modo.length], beat * 3.5, "sine", 0.5, 600);
    if (r() < 0.72) {
      grado = (k % 16 < 8 ? motivo[k % 8] : grado + Math.floor(r() * 3) - 1 + modo.length * 3) % (modo.length * 2);
      const n = raiz + 12 + modo[grado % modo.length] + 12 * Math.floor(grado / modo.length);
      nota(tt, n, beat * (r() < 0.3 ? 1.5 : 0.6), onda, onda === "sawtooth" || onda === "square" ? 0.12 : 0.3, 2400);
    }
  }
  const buf = await ctx.startRendering();
  cacheBuffers.set(p.id, buf);
  return buf;
}

// ---------- reproductor ----------
const player = { ctx: null, src: null, pista: null, inicio: 0, offset: 0, tocando: false, cola: [], raf: 0 };
async function reproducir(p, cola, desde) {
  if (cola) player.cola = cola;
  if (player.pista?.id === p.id && player.tocando && desde == null) return pausar();
  if (player.pista?.id !== p.id) player.offset = 0;
  if (desde != null) { player.offset = desde; player.tocando = false; }
  player.ctx ??= new (window.AudioContext || window.webkitAudioContext)();
  await player.ctx.resume();
  detenerFuente();
  player.pista = p;
  pintarPlayer();
  const buf = await sintetizar(p);
  const src = player.ctx.createBufferSource();
  src.buffer = buf;
  if (!player.analizador) { player.analizador = player.ctx.createAnalyser(); player.analizador.fftSize = 256; player.analizador.connect(player.ctx.destination); }
  src.connect(player.analizador);
  src.onended = () => { if (player.src === src && player.tocando) siguiente(); };
  src.start(0, player.offset);
  player.src = src; player.inicio = player.ctx.currentTime - player.offset; player.tocando = true;
  pintarPlayer(); bucle();
}
function detenerFuente() { if (player.src) { const s = player.src; player.src = null; try { s.stop(); } catch {} } }
function pausar() {
  if (!player.tocando) return player.pista && reproducir(player.pista);
  player.offset = player.ctx.currentTime - player.inicio; player.tocando = false; detenerFuente(); pintarPlayer();
}
function siguiente() {
  const i = player.cola.findIndex(x => x.id === player.pista?.id);
  const sig = player.cola[(i + 1) % player.cola.length];
  player.offset = 0; player.tocando = false;
  if (sig) reproducir(sig);
}
function buscarEn(frac) {
  if (!player.pista) return;
  player.offset = Math.max(0, Math.min(player.pista.dur - 0.1, frac * player.pista.dur));
  if (player.tocando) { player.tocando = false; reproducir(player.pista); } else pintarProgreso();
}
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
function tiempoActual() { return player.tocando ? player.ctx.currentTime - player.inicio : player.offset; }
function bucle() { cancelAnimationFrame(player.raf); const f = () => { pintarProgreso(); if (player.tocando) player.raf = requestAnimationFrame(f); }; f(); }
function burbujas() {
  const p = player.pista, ahora = tiempoActual(), b = $("#burbuja");
  const c = comentariosDe(p).find(c => ahora >= c.t && ahora < c.t + 2.6);
  if (!c) { b.classList.remove("ver"); return; }
  if (b.dataset.k !== `${p.id}:${c.t}`) {
    b.dataset.k = `${p.id}:${c.t}`;
    b.innerHTML = `<span class="marca" style="position:static;background:${c.u.c}">${esc(c.u.n[0])}</span><b>@${esc(c.u.h)}</b> ${esc(textoComentario(c))}`;
    b.style.left = `${Math.min(45, Math.max(0, c.t / p.dur * 100 - 4))}%`;
  }
  b.classList.add("ver");
}
function pintarProgreso() {
  if (!player.pista) return;
  if (player.tocando) burbujas(); else $("#burbuja").classList.remove("ver");
  const frac = Math.min(1, tiempoActual() / player.pista.dur);
  $("#pTiempo").textContent = mmss(tiempoActual());
  document.querySelectorAll(`[data-onda="${player.pista.id}"], #pOnda`).forEach(el => {
    const barras = el.children, lim = Math.floor(frac * barras.length);
    for (let i = 0; i < barras.length; i++) barras[i].classList.toggle("on", i < lim);
  });
}
function barrasHTML(onda) { return onda.map(v => `<i style="height:${Math.round(v * 100)}%"></i>`).join(""); }
function pintarPlayer() {
  const p = player.pista; if (!p) return;
  $("#player").hidden = false;
  $("#pTitulo").textContent = p.titulo;
  $("#pAutor").innerHTML = `<a href="#u/${p.user}">@${esc(p.user)}</a> · ${esc(p.reto.title)}`;
  if ($("#pOnda").dataset.id !== p.id) { $("#pOnda").innerHTML = barrasHTML(p.onda); $("#pOnda").dataset.id = p.id; $("#pMarcas").innerHTML = marcadoresHTML(p); }
  $("#pPlay").classList.toggle("pausa", player.tocando);
  document.querySelectorAll(".pista").forEach(el => {
    const on = el.dataset.id === p.id;
    el.classList.toggle("sonando", on);
    el.querySelector(".play-btn").classList.toggle("pausa", on && player.tocando);
  });
  pintarProgreso();
}

// ---------- piezas de UI ----------
const ICONO = {
  like: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  repost: '<svg viewBox="0 0 24 24"><path d="M4 9V7a2 2 0 0 1 2-2h12l-3-3M20 15v2a2 2 0 0 1-2 2H6l3 3"/></svg>',
  coment: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  subir: '<svg viewBox="0 0 24 24"><path d="M12 16V4M6 10l6-6 6 6M4 20h16"/></svg>',
  pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/></svg>',
  mano: '<svg viewBox="0 0 24 24"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12m0-1.5v-6a1.5 1.5 0 0 1 3 0V12m0-5a1.5 1.5 0 0 1 3 0v7a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 5 16l-1.5-3a1.5 1.5 0 0 1 2.6-1.5L8 14"/></svg>',
};
const iconoRed = k => `<svg viewBox="0 0 24 24">${REDES[k].svg}</svg>`;
function chipDif(d) { return `<span class="chip dif-${esc(d)}">${esc(T("dif")[d] || d)}</span>`; }
const avatarHTML = (u, tam = 96) => `<a href="#u/${u.h}" class="avatar" style="width:${tam}px;height:${tam}px;font-size:${Math.round(tam * .36)}px;background:linear-gradient(135deg,${u.c},#E5484D)" aria-label="${esc(u.n)}">${esc(u.n[0])}</a>`;
const enlaceUsuario = h => `<a class="usuario" href="#u/${esc(h)}">@${esc(h)}</a>`;

function marcadoresHTML(p) {
  return `<div class="marcas">${comentariosDe(p).map(c => `<span class="marca" style="left:${(c.t / p.dur * 100).toFixed(1)}%;background:${c.u.c}" title="@${esc(c.u.h)} · ${mmss(c.t)}">${esc(c.u.n[0])}</span>`).join("")}</div>`;
}
function pistaHTML(p) {
  const rp = estado.reposts.has(p.id);
  return `<div class="pista" data-id="${p.id}">
    <button class="play-btn" data-play="${p.id}" aria-label="Play ${esc(p.titulo)}"></button>
    <div class="pista-cuerpo">
      <div class="pista-titulo">${esc(p.titulo)}</div>
      <div class="pista-autor">${enlaceUsuario(p.user)} · ${mmss(p.dur)} · ${p.tags.map(x => esc(etiq(x))).join(" · ")}</div>
      ${p.pide ? `<div class="pide">${t("asks_feedback")} <b>${esc(T("fb_opts")[p.pide])}</b></div>` : ""}
      <div class="onda-caja">${marcadoresHTML(p)}<div class="mini-onda" data-onda="${p.id}" data-seek="${p.id}">${barrasHTML(p.onda)}</div></div>
      <div class="reacciones">${Object.keys(REAC).map(k => { const on = estado.reac.has(`${p.id}:${k}`);
        return `<button class="reac ${on ? "on" : ""}" data-reac="${p.id}:${k}" title="${esc(T("reac")[k])}" aria-label="${esc(T("reac")[k])}">${REAC[k]}<span>${p.reac[k] + (on ? 1 : 0)}</span></button>`; }).join("")}</div>
    </div>
    <div class="acciones">
      <button class="accion ${rp ? "on" : ""}" data-repost="${p.id}" aria-label="Repost">${ICONO.repost}${p.reposts + (rp ? 1 : 0)}</button>
      <button class="accion" data-coment="${p.id}" aria-label="Comments">${ICONO.coment}${numComentarios(p)}</button>
    </div>
  </div>`;
}
function comentariosHTML(p) {
  return `<div class="comentarios">${comentariosDe(p).map(c =>
    `<div class="comentario ${c.mio ? "mio" : ""}"><button class="t" data-ir="${p.id}:${c.t}">${mmss(c.t)}</button>${enlaceUsuario(c.u.h)} ${esc(textoComentario(c))}</div>`).join("")}
  <form class="comentar" data-comentar="${p.id}">
    <input placeholder="${t("comment_at")} ${mmss(segundoParaComentar(p))}…" aria-label="${t("write_comment")}" enterkeyhint="send" maxlength="280">
    <button class="btn" type="submit">${t("send")}</button>
  </form></div>`;
}
function arteGenerativo(seed) {
  const r = rng(seed), h1 = Math.floor(r() * 360), h2 = (h1 + 40 + r() * 80) % 360;
  return `background:
    radial-gradient(60% 50% at ${20 + r() * 60}% ${20 + r() * 40}%, hsla(${h1},70%,60%,.55), transparent 70%),
    radial-gradient(50% 60% at ${r() * 100}% ${60 + r() * 40}%, hsla(${h2},60%,45%,.6), transparent 70%),
    linear-gradient(${Math.floor(r() * 360)}deg, hsl(${h1},35%,10%), hsl(${h2},40%,16%))`;
}
function toast(msg) { const el = $("#toast"); el.textContent = msg; el.classList.add("ver"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("ver"), 2800); }
const cabeceraMovil = () => `<div class="cabecera-movil"><a class="logo" href="#home">Daily <em>Cue</em><span class="cuemark"></span></a>
  <div style="display:flex;gap:8px"><button class="chip" data-idioma>${t("lang_switch_short")}</button><a class="chip" href="#suggest">${t("suggest_short")}</a></div></div>`;
function cuentaRegresiva() {
  const fin = (diaUTC() + 1) * DIA_MS, s = Math.max(0, Math.floor((fin - Date.now()) / 1000));
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(n => String(n).padStart(2, "0")).join(":");
}
function creditoReto(c) {
  if (!/community/.test(c.credit || "")) return "Claude";
  const h = (c.prompt.match(/@([\w.]+)/) || [])[1];
  return h ? enlaceUsuario(h) : t("the_community");
}

// Redes del perfil: las mías pueden venir editadas (guardadas en este navegador)
function linksDe(u) {
  if (u.h !== YO) return u.links || {};
  try { return JSON.parse(guardado("dc_links") || "null") || u.links; } catch { return u.links; }
}
function collabDe(u) {
  if (u.h === YO) { const g = guardado("dc_collab"); if (g !== null) return g; }
  return u.collab ? u.collab[LANG] : "";
}
const limpiarUsuario = v => String(v || "").trim().replace(/^https?:\/\/[^/]+\/?/, "").replace(/^@/, "").replace(/\/.*$/, "");
function redesHTML(u) {
  const links = linksDe(u), claves = Object.keys(REDES).filter(k => links[k]);
  if (!claves.length) return `<p class="fino">${t("no_links")}</p>`;
  return `<div class="redes">${claves.map(k => `<a class="red" href="${esc(REDES[k].url(links[k]))}" data-red="${esc(REDES[k].url(links[k]))}" title="${REDES[k].nombre}" target="_blank" rel="noopener">${iconoRed(k)}<span>${REDES[k].nombre}</span></a>`).join("")}</div>`;
}
const redesMini = u => { const l = linksDe(u); return `<div class="redes-mini">${Object.keys(REDES).filter(k => l[k]).map(k => `<span title="${REDES[k].nombre}">${iconoRed(k)}</span>`).join("")}</div>`; };
const rachaDe = u => u.h === YO ? 23 : 1 + Math.floor(rng(hash(u.h))() * 60);

// ---------- pantallas ----------
const VISTAS = {
  home() {
    const { reto, ranura } = retoDelDia(0), ayer = retoDelDia(-1).reto, d = diaUTC();
    const fr = FRASES[d % FRASES.length], consejo = CONSEJOS[d % CONSEJOS.length][LANG];
    const pistas = mezclar(pistasDeAyer(), d).slice(0, 5);
    const semana = Array.from({ length: 7 }, (_, i) => 40 + Math.floor(rng(d - 6 + i)() * 140));
    const sellado = guardado("dc_abierto") !== String(d);
    if (sellado) return `${cabeceraMovil()}
    <section class="hero hero-sellado" data-abrir>
      <div class="sello" aria-hidden="true"><span class="sello-anillo"></span><span class="sello-punto"></span></div>
      <div class="eyebrow">${t("todays_cue")} · ${esc(ranura)} · ${esc(reto.id)}</div>
      <h1>${t("sealed_title")}</h1>
      <p class="prompt">${t("sealed_sub")}</p>
      <button class="btn" data-abrir>${t("open_cue")}</button>
    </section>` + VISTAS.homeResto(d, ayer, fr, consejo, pistas, semana);
    return `${cabeceraMovil()}
    <section class="hero ${estado.recienAbierto ? "revelado" : ""}">
      <span class="cuemark-grande" aria-hidden="true"></span>
      <div class="eyebrow">${t("todays_cue")} · ${esc(ranura)} · ${esc(reto.id)}</div>
      <h1>${esc(reto.title)}</h1>
      <p class="prompt">${esc(reto.prompt)}</p>
      <div class="hero-pie">
        <a class="btn" href="#challenge">${t("take_challenge")}</a>
        <button class="btn btn-ghost" data-tocar-room>${t("play_room")}</button>
        <div class="cuenta"><span class="num mono" data-cuenta>${cuentaRegresiva()}</span><span class="lbl">${t("left_to_submit")} · ${chipDif(reto.difficulty)}</span></div>
      </div>
    </section>` + VISTAS.homeResto(d, ayer, fr, consejo, pistas, semana);
  },

  homeResto(d, ayer, fr, consejo, pistas, semana) {
    return `

    <div class="grid-2 seccion">
      <div class="card">
        <div class="eyebrow" style="margin-bottom:14px">${t("words_today")}</div>
        <div class="frase"><blockquote>“${esc(fr[LANG][0])}”</blockquote><cite>— ${esc(fr.a)}</cite></div>
        <div class="tip"><strong>${t("composer_tip")}</strong>${esc(consejo)}</div>
      </div>
      <div class="card">
        <div class="eyebrow" style="margin-bottom:14px">${t("week_in_room")}</div>
        <div class="grid-3" style="grid-template-columns:1fr 1fr">
          <div class="stat"><div class="num">${semana.reduce((a, b) => a + b, 0)}</div><div class="lbl">${t("ideas_uploaded")}</div><div class="delta">${t("vs_last_week")}</div></div>
          <div class="stat"><div class="num">41</div><div class="lbl">${t("countries")}</div><div class="delta">${t("new_countries")}</div></div>
        </div>
        <div class="barras">${semana.map(v => `<i style="height:${Math.round(v / 1.8)}%"></i>`).join("")}</div>
        <div class="barras-lbl">${Array.from({ length: 7 }, (_, i) => `<span>${T("days_short")[diaSemana(d - 6 + i)]}</span>`).join("")}</div>
      </div>
    </div>

    <section class="seccion">
      <div class="seccion-cab"><h2>${t("yesterdays_room")} <span class="fino" style="font-family:var(--sans)">· ${esc(ayer.title)}</span></h2><a href="#room">${t("open_room")}</a></div>
      ${pistas.map(pistaHTML).join("")}
    </section>

    <section class="seccion">
      <div class="seccion-cab"><h2>${t("week_ahead")}</h2><a href="#suggest">${t("suggest_arrow")}</a></div>
      <div class="grid-3">${Array.from({ length: 3 }, (_, i) => {
        const ds = diaSemana(d + i + 1);
        return `<div class="card"><div class="eyebrow">${T("days_short")[ds]}</div><h3 style="font-size:22px;margin:8px 0 6px">${esc(T("slots")[ds])}</h3><p class="fino" style="margin:0">${t("sealed")}</p></div>`;
      }).join("")}</div>
    </section>`;
  },

  challenge(off = 0) {
    const { reto: c, ranura } = retoDelDia(off);
    const esImagen = /image/.test(c.format || "");
    return `${cabeceraMovil()}
    <div class="reto-cab">
      <div class="eyebrow">${esc(c.id)} · ${esc(ranura)} · ${t("challenge_by")} ${creditoReto(c)}</div>
      ${off < 0 ? "" : `<div class="cuenta" style="text-align:right"><span class="num mono" data-cuenta>${cuentaRegresiva()}</span><span class="lbl">${t("until_room")}</span></div>`}
    </div>
    ${off < 0 ? `<div class="aviso-pasado">${t("past_banner")}</div>` : ""}
    <h1 class="reto-titulo">${esc(c.title)}</h1>
    <div class="chips" style="margin-bottom:22px">${chipDif(c.difficulty)}${[c.genre, c.world, ...(c.constraints || [])].filter(x => x && x !== "any").map(x => `<span class="chip">${esc(etiq(x))}</span>`).join("")}</div>
    ${esImagen ? `<div class="imagen-ia" style="${arteGenerativo(hash(c.id))}"><span class="etiqueta">${t("ai_placeholder")} ${esc(c.image_prompt || "")}</span></div>` : ""}
    <p class="reto-prompt">${esc(c.prompt)}</p>
    ${c.twist ? `<div class="giro"><div class="eyebrow">${t("twist_label")}</div><p>${esc(c.twist)}</p></div>` : ""}
    ${c.seed ? `<div class="eyebrow" style="margin-top:22px">${t("your_seed")}</div><div class="semilla">${esc(c.seed)}</div>` : ""}
    <div class="versiones">
      <div class="card"><h3>${t("got_20")}</h3><p>${esc(c.quick_version)}</p></div>
      <div class="card"><h3>${t("got_afternoon")}</h3><p>${esc(c.deep_version)}</p></div>
    </div>

    <h2 class="seccion" style="font-size:26px">${t("your_idea")}</h2>
    <p class="fino" style="font-size:14px;margin:6px 0 0">${t("no_masterpiece")}</p>
    <div class="subir">
      <label class="zona" id="zona">
        ${ICONO.subir}<h3>${t("upload_file")}</h3>
        <p>${t("upload_formats")}</p>
        <span class="btn btn-ghost" style="margin-top:6px">${t("choose_file")}</span>
        <input type="file" accept="audio/*,.m4a,.mp3,.wav,.aac,.ogg,.flac" id="archivo" hidden>
      </label>
      <div class="zona">
        <button class="rec-punto" id="rec" aria-label="Record"></button><h3 id="recTxt">${t("record_here")}</h3>
        <p id="recSub">${t("record_sub")}</p>
        <span class="mono" id="recTiempo" style="font-size:20px" hidden>0:00</span>
      </div>
    </div>
    <div class="listo card" id="listo" hidden>
      <div class="eyebrow">${t("ready_submit")}</div>
      <audio controls id="previa"></audio>
      <div class="campo"><label for="tit">${t("title")}</label><input id="tit" placeholder="${t("title_ph")}"></div>
      <div class="campo"><label for="nota">${t("note_listeners")}</label><textarea id="nota" placeholder="${t("note_ph")}"></textarea></div>
      <div class="campo"><label for="pide">${t("ask_feedback_q")}</label><select id="pide"><option value="">${t("fb_none")}</option>${Object.entries(T("fb_opts")).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("")}</select></div>
      <div class="chips" style="margin-bottom:16px">${T("piece_checks").map(x => `<label class="chip"><input type="checkbox"> ${esc(x)}</label>`).join("")}</div>
      <button class="btn" id="enviar">${t("submit_room")}</button>
    </div>`;
  },

  room() {
    const ayer = retoDelDia(-1).reto;
    let pistas = pistasDeAyer();
    if (estado.filtro === "shuffle") pistas = mezclar(pistas, diaUTC() + estado.semillaMezcla);
    if (estado.filtro === "liked") pistas.sort((a, b) => totalReac(b) - totalReac(a));
    if (estado.filtro === "comments") pistas.sort((a, b) => b.coments - a.coments);
    const total = pistas.reduce((a, p) => a + p.dur, 0);
    return `${cabeceraMovil()}
    <div class="room-cab">
      <div>
        <div class="eyebrow">${t("room_eyebrow")} · ${esc(ayer.id)}</div>
        <h1>${esc(ayer.title)}</h1>
        <p>${esc(ayer.prompt)}</p>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn" data-tocar-room>${t("play_all")}</button>
        <button class="btn btn-ghost" data-remezclar>${t("reshuffle")}</button>
        <button class="btn btn-ghost" data-cine>▣ ${t("cinema")}</button>
        <a class="btn btn-ghost" href="#archive">${t("archive")}</a>
      </div>
    </div>
    <p class="fino" style="font-size:13px">${pistas.length} ${t("ideas")} · ${mmss(total)} ${t("total")} · ${t("own_order")} <span style="color:var(--paper)">${t("synth_note")}</span></p>
    <div class="filtros">${[["shuffle", "f_shuffle"], ["liked", "f_liked"], ["comments", "f_comments"]].map(([k, l]) => `<button data-filtro="${k}" class="${estado.filtro === k ? "on" : ""}">${t(l)}</button>`).join("")}</div>
    <div id="listaRoom">${pistas.map(p => pistaHTML(p) + `<div data-hilo="${p.id}"></div>`).join("")}</div>`;
  },

  composers() {
    const q = estado.buscar.toLowerCase();
    const lista = PERSONAS.filter(u => {
      const texto = [u.h, u.n, u.city, ...u.inst, ...u.gen, ...u.inst.map(etiq), ...u.gen.map(etiq)].join(" ").toLowerCase();
      return (!q || texto.includes(q)) && (!estado.soloColab || collabDe(u));
    });
    return `${cabeceraMovil()}
    <div class="eyebrow">${t("composers_eyebrow")}</div>
    <h1 class="reto-titulo" style="font-size:clamp(32px,4.6vw,50px);margin-bottom:8px">${t("composers_title")}</h1>
    <p class="fino" style="font-size:15px;max-width:60ch;margin:0 0 20px">${t("composers_sub")}</p>
    <div class="buscador">
      <div class="campo" style="margin:0;flex:1;min-width:200px"><input id="buscar" value="${esc(estado.buscar)}" placeholder="${t("search_ph")}" aria-label="${t("search_ph")}"></div>
      <label class="chip ${estado.soloColab ? "on-chip" : ""}"><input type="checkbox" id="soloColab" ${estado.soloColab ? "checked" : ""}> ${t("only_collab")}</label>
    </div>
    <div class="grid-3 seccion" style="margin-top:20px">${lista.length ? lista.map(u => `
      <a class="card persona" href="#u/${u.h}">
        <div style="display:flex;gap:14px;align-items:center">
          <span class="avatar" style="width:52px;height:52px;font-size:20px;background:linear-gradient(135deg,${u.c},#E5484D)">${esc(u.n[0])}</span>
          <div style="min-width:0"><div class="pista-titulo">${esc(u.n)}</div><div class="fino">@${esc(u.h)}</div></div>
        </div>
        <div class="fino persona-ciudad">${ICONO.pin}${esc(u.city)} · <span class="mono" style="color:var(--tungsten)">${rachaDe(u)}</span> ${t("streak_short")}</div>
        <div class="chips">${[...u.inst, ...u.gen].slice(0, 4).map(x => `<span class="chip">${esc(etiq(x))}</span>`).join("")}</div>
        ${collabDe(u) ? `<div class="colab-mini">${ICONO.mano}<span>${esc(collabDe(u))}</span></div>` : ""}
        ${redesMini(u)}
      </a>`).join("") : `<p class="vacio">${t("nobody")}</p>`}</div>`;
  },

  perfil(h) {
    const u = persona(h) || persona(YO), mio = u.h === YO, r = rng(hash(u.h)), semanas = 26;
    const celdas = Array.from({ length: semanas * 7 }, (_, i) => {
      if (mio && i > semanas * 7 - 24) return r() < 0.12 ? "descanso" : `n${1 + Math.floor(r() * 3)}`;
      const x = r(); return x < 0.45 ? "" : x < 0.5 ? "descanso" : `n${1 + Math.floor(r() * 3)}`;
    });
    const sigo = estado.sigo.has(u.h), colab = collabDe(u);
    const mes = new Intl.DateTimeFormat(LANG, { month: "long" }).format(new Date()).replace(/^./, c => c.toUpperCase());
    const links = linksDe(u);
    const editor = mio && estado.editando ? `
      <div class="card seccion" id="editor">
        <div class="eyebrow">${t("links_title")}</div>
        <p class="fino" style="font-size:14px;margin:8px 0 16px">${t("links_help")}</p>
        <div class="grid-3 editor-redes">${Object.keys(REDES).map(k => `
          <div class="campo"><label for="l_${k}">${iconoRed(k)} ${REDES[k].nombre}</label><input id="l_${k}" data-link="${k}" value="${esc(links[k] || "")}" placeholder="${t("handle_ph")}"></div>`).join("")}</div>
        <div class="campo"><label for="l_collab">${ICONO.mano} ${t("collab_field")}</label><input id="l_collab" value="${esc(colab)}" placeholder="${t("collab_ph")}"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" id="guardarLinks">${t("done")}</button><button class="btn btn-ghost" data-bienvenida>${t("ob_restart")}</button></div>
      </div>` : "";
    return `${cabeceraMovil()}
    <div class="perfil-cab">
      ${avatarHTML(u)}
      <div style="flex:1;min-width:240px">
        <h1>${esc(u.n)} <span class="fino" style="font:500 15px var(--sans)">@${esc(u.h)}</span></h1>
        <p class="bio">${esc(u.bio[LANG])}</p>
        <div class="fino persona-ciudad" style="margin-bottom:10px">${ICONO.pin}${esc(u.city)}</div>
        <div class="chips">${[...u.inst, ...u.gen].map(x => `<span class="chip">${esc(etiq(x))}</span>`).join("")}</div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${mio ? `<button class="btn btn-ghost" data-editar>${t("edit_profile")}</button>`
              : `<button class="btn ${sigo ? "btn-ghost" : ""}" data-seguir="${u.h}">${sigo ? "✓ " + t("following") : t("follow")}</button>`}
        <button class="btn btn-ghost" data-compartir="${u.h}">${t("share")}</button>
      </div>
    </div>

    <div class="card seccion">
      <div class="eyebrow" style="margin-bottom:14px">${t("find_elsewhere", { name: esc(u.n.split(" ")[0]) })}</div>
      ${redesHTML(u)}
      ${colab ? `<div class="colab">${ICONO.mano}<div><b>${t("open_collab")}</b><br>${esc(colab)}</div></div>` : ""}
    </div>
    ${editor}

    <div class="grid-2 seccion">
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap">
          <div><div class="eyebrow">${t("current_streak")}</div><div class="racha-num" style="margin-top:10px">${rachaDe(u)} <span style="font-size:16px;color:var(--muted)">${t("days")}</span></div></div>
          <div class="fino" style="max-width:30ch">${t("rest_note")}</div>
        </div>
        <div class="calendario">${celdas.map(c => `<i class="${c}"></i>`).join("")}</div>
        <div class="leyenda"><span><i style="background:var(--stage-2)"></i>${t("no_cue")}</span><span><i style="background:var(--tungsten)"></i>${t("composed")}</span><span><i style="background:rgba(79,184,168,.45)"></i>${t("rest_day")}</span></div>
      </div>
      <div class="card">
        <div class="eyebrow" style="margin-bottom:16px">${esc(mes)} ${t("so_far")}</div>
        <div class="grid-3" style="grid-template-columns:1fr 1fr;gap:20px">
          <div class="stat"><div class="num">${4 + Math.floor(r() * 10)}</div><div class="lbl">${t("cues_composed")}</div></div>
          <div class="stat"><div class="num">${50 + Math.floor(r() * 400)}</div><div class="lbl">${t("likes_received")}</div></div>
          <div class="stat"><div class="num">${3 + Math.floor(r() * 40)}</div><div class="lbl">${t("comments_given")}</div></div>
          <div class="stat"><div class="num">${mio ? 1 : Math.floor(r() * 2)}</div><div class="lbl">${t("challenge_featured")}</div></div>
        </div>
      </div>
    </div>

    ${logrosHTML(u)}
    ${mio ? `<a class="card wrapped-link seccion" href="#wrapped"><span class="eyebrow">Wrapped</span><span class="wl-txt">${t("wrapped_link", { month: esc(mes.toLowerCase()) })}</span></a>` : ""}
    <section class="seccion"><div class="seccion-cab"><h2>${mio ? t("my_cues") : t("cues_of", { name: esc(u.n.split(" ")[0]) })}</h2></div>${pistasDe(u.h).map(pistaHTML).join("")}</section>`;
  },

  suggest() {
    return `${cabeceraMovil()}
    <div class="eyebrow">${t("cp_eyebrow")}</div>
    <h1 class="reto-titulo" style="font-size:clamp(32px,4.6vw,50px)">${t("suggest_title")}</h1>
    <div class="grid-2">
      <div class="card">
        <div class="credito">★ <span>${t("credit_banner")}</span></div>
        <div class="campo"><label for="sTit">${t("working_title")}</label><input id="sTit" placeholder="${t("working_ph")}"></div>
        <div class="campo"><label for="sTxt">${t("the_challenge")}</label><textarea id="sTxt" placeholder="${t("challenge_ph")}"></textarea></div>
        <div class="grid-3" style="grid-template-columns:1fr 1fr;gap:12px">
          <div class="campo"><label for="sFmt">${t("format")}</label><select id="sFmt">${T("fmt_opts").map(o => `<option>${o}</option>`).join("")}</select></div>
          <div class="campo"><label for="sDif">${t("difficulty")}</label><select id="sDif">${T("dif_opts").map((o, i) => `<option ${i === 1 ? "selected" : ""}>${o}</option>`).join("")}</select></div>
        </div>
        <button class="btn" id="sEnviar">${t("send_queue")}</button>
      </div>
      <div class="card">
        <div class="eyebrow" style="margin-bottom:16px">${t("what_next")}</div>
        <ol class="pasos">${T("steps").map(s => `<li>${s}</li>`).join("")}</ol>
      </div>
    </div>`;
  },
};

// ---------- ruteo y eventos ----------
function pintarMarco() {
  document.documentElement.lang = LANG;
  document.querySelectorAll("[data-t]").forEach(el => el.textContent = t(el.dataset.t));
}
function ruta() {
  const [r, arg] = (location.hash.slice(1) || "home").split("/");
  let html, activo = r;
  if (r === "u" && arg) { html = VISTAS.perfil(arg); activo = arg === YO ? "profile" : "composers"; }
  else if (r === "profile") html = VISTAS.perfil(YO);
  else if (r === "cue") { html = VISTAS.challenge(Math.min(0, parseInt(arg, 10) || 0)); activo = "room"; }
  else if (r === "archive") { html = VISTAS.archive(); activo = "room"; }
  else if (r === "wrapped") { html = VISTAS.wrapped(); activo = "profile"; }
  else if (VISTAS[r]) html = VISTAS[r]();
  else { html = VISTAS.home(); activo = "home"; }
  pintarMarco();
  $("#vista").innerHTML = html;
  document.querySelectorAll(".nav a").forEach(a => a.classList.toggle("activo", a.dataset.ruta === activo));
  if (r === "challenge" || r === "cue") prepararSubida();
  estado.recienAbierto = false;
  if (r === "composers") prepararBuscador();
  pintarPlayer();
}
function irA(hash) { if (location.hash === hash) ruta(); else location.hash = hash; window.scrollTo(0, 0); }
const colaVisible = () => [...document.querySelectorAll(".pista")].map(el => REG.get(el.dataset.id)).filter(Boolean);

document.addEventListener("click", e => {
  const red = e.target.closest("[data-red]");
  if (red) { e.preventDefault(); toast(t("link_proto", { url: red.dataset.red })); return; }
  const tt = e.target.closest("button, [data-seek]"); if (!tt) return;
  const d = tt.dataset;
  if (d.play) reproducir(REG.get(d.play), colaVisible());
  else if (d.seek && tt.classList.contains("mini-onda")) {
    const p = REG.get(d.seek), frac = (e.clientX - tt.getBoundingClientRect().left) / tt.clientWidth;
    if (player.pista?.id !== p.id) reproducir(p, colaVisible(), frac * p.dur); else buscarEn(frac);
  }
  else if (d.reac || d.repost) {
    const clave = d.reac || d.repost, set = d.reac ? estado.reac : estado.reposts, id = clave.split(":")[0];
    set.has(clave) ? set.delete(clave) : set.add(clave);
    const hilo = tt.closest(".pista");
    hilo.outerHTML = pistaHTML(REG.get(id)); pintarPlayer();
    if (d.repost && set.has(clave)) toast(t("reposted"));
  }
  else if (d.ir) {
    const [id, seg] = d.ir.split(":");
    reproducir(REG.get(id), colaVisible(), Math.max(0, +seg - 1));
  }
  else if (d.coment) {
    const hilo = document.querySelector(`[data-hilo="${d.coment}"]`);
    if (hilo) hilo.innerHTML = hilo.innerHTML ? "" : comentariosHTML(REG.get(d.coment));
    else irA("#room");
  }
  else if ("tocarRoom" in d) { const cola = mezclar(pistasDeAyer(), diaUTC() + estado.semillaMezcla); reproducir(cola[0], cola); }
  else if ("remezclar" in d) { estado.semillaMezcla++; estado.filtro = "shuffle"; ruta(); toast(t("fresh_shuffle")); }
  else if (d.filtro) { estado.filtro = d.filtro; ruta(); }
  else if (d.seguir) { estado.sigo.has(d.seguir) ? estado.sigo.delete(d.seguir) : estado.sigo.add(d.seguir); ruta(); }
  else if (d.compartir) { const url = `${location.origin}${location.pathname}#u/${d.compartir}`; navigator.clipboard?.writeText(url).catch(() => {}); toast(url); }
  else if ("editar" in d) { estado.editando = !estado.editando; ruta(); if (estado.editando) $("#editor")?.scrollIntoView({ behavior: "smooth", block: "center" }); }
  else if (tt.id === "guardarLinks") {
    const nuevos = {};
    document.querySelectorAll("[data-link]").forEach(inp => { const v = limpiarUsuario(inp.value); if (v) nuevos[inp.dataset.link] = v; });
    guardar("dc_links", JSON.stringify(nuevos)); guardar("dc_collab", $("#l_collab").value.trim());
    estado.editando = false; ruta(); toast(t("links_saved"));
  }
  else if ("abrir" in d) {
    const hero = tt.closest(".hero") || $(".hero-sellado");
    hero.classList.add("abriendo");
    setTimeout(() => { guardar("dc_abierto", String(diaUTC())); estado.recienAbierto = true; ruta(); }, 1100);
  }
  else if ("idioma" in d) { LANG = LANG === "es" ? "en" : "es"; guardar("dc_lang", LANG); ruta(); }
  else if (tt.id === "sEnviar") toast(t("thanks_suggest"));
});
document.addEventListener("submit", e => {
  const f = e.target.closest("[data-comentar]"); if (!f) return;
  e.preventDefault(); publicarComentario(f.dataset.comentar, f.querySelector("input"));
});
$("#pPlay").onclick = () => pausar();
$("#pNext").onclick = () => siguiente();
$("#pOnda").onclick = e => buscarEn((e.clientX - $("#pOnda").getBoundingClientRect().left) / $("#pOnda").clientWidth);

function prepararBuscador() {
  const inp = $("#buscar");
  inp.oninput = () => { estado.buscar = inp.value; const pos = inp.selectionStart; ruta(); const n = $("#buscar"); n.focus(); n.setSelectionRange(pos, pos); };
  $("#soloColab").onchange = e => { estado.soloColab = e.target.checked; ruta(); };
}

// Subir / grabar (real, en el navegador; nada se manda a ningún servidor)
function prepararSubida() {
  const zona = $("#zona"), input = $("#archivo");
  const mostrar = (blob, nombre) => { $("#listo").hidden = false; $("#previa").src = URL.createObjectURL(blob); $("#tit").value = nombre || ""; $("#listo").scrollIntoView({ behavior: "smooth", block: "center" }); };
  input.onchange = () => input.files[0] && mostrar(input.files[0], input.files[0].name.replace(/\.[^.]+$/, ""));
  ["dragenter", "dragover"].forEach(ev => zona.addEventListener(ev, e => { e.preventDefault(); zona.classList.add("encima"); }));
  ["dragleave", "drop"].forEach(ev => zona.addEventListener(ev, e => { e.preventDefault(); zona.classList.remove("encima"); }));
  zona.addEventListener("drop", e => { const f = e.dataTransfer.files[0]; if (f && /audio|\.m4a$/i.test(f.type + f.name)) mostrar(f, f.name.replace(/\.[^.]+$/, "")); });

  let rec = null, trozos = [], t0 = 0, reloj = 0;
  $("#rec").onclick = async () => {
    if (rec?.state === "recording") { rec.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      rec = new MediaRecorder(stream); trozos = [];
      rec.ondataavailable = e => trozos.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach(x => x.stop()); clearInterval(reloj);
        $("#rec").classList.remove("grabando"); $("#recTxt").textContent = t("record_again"); $("#recTiempo").hidden = true;
        mostrar(new Blob(trozos, { type: rec.mimeType }), t("voice_idea"));
      };
      rec.start(); t0 = Date.now();
      $("#rec").classList.add("grabando"); $("#recTxt").textContent = t("recording"); $("#recTiempo").hidden = false;
      reloj = setInterval(() => $("#recTiempo").textContent = mmss((Date.now() - t0) / 1000), 250);
    } catch { toast(t("mic_na")); }
  };
  $("#enviar").onclick = () => { toast(t("submitted")); $("#listo").hidden = true; abrirTarjeta("pieza", { titulo: $("#tit").value }); };
}

setInterval(() => { document.querySelectorAll("[data-cuenta]").forEach(el => el.textContent = cuentaRegresiva()); if (player.tocando) {
  pintarProgreso();
  const inp = document.querySelector(`[data-comentar="${player.pista.id}"] input`);
  if (inp) inp.placeholder = `${t("comment_at")} ${mmss(Math.floor(tiempoActual()))}…`;
} }, 1000);
window.addEventListener("hashchange", () => { ruta(); window.scrollTo(0, 0); });
cargarBancos().then(ruta);
