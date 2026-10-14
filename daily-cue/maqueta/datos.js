/* Daily Cue — datos de ejemplo de la maqueta: personas ficticias, frases y consejos.
   Las redes de cada perfil son ficticias; en la maqueta los botones no abren sitios reales. */
"use strict";

const YO = "nightoboe"; // la cuenta "propia" del prototipo

const PERSONAS = [
  { h: "nightoboe", n: "Lucía R.", c: "#F2A93B", city: "Bogotá", inst: ["oboe", "piano"], gen: ["orchestral", "lo-fi", "film"],
    bio: { en: "Oboist by day, bedroom film-scorer by night. Mostly Logic + a cheap MIDI keyboard.", es: "Oboísta de día, compositora de cine en su cuarto de noche. Casi todo en Logic con un teclado MIDI barato." },
    collab: { en: "Looking for a lyricist for a short-film theme.", es: "Busco letrista para el tema de un cortometraje." },
    links: { bandcamp: "nightoboe", soundcloud: "nightoboe", instagram: "lucia.oboe", youtube: "nightoboe" } },
  { h: "pixelbassoon", n: "Kenji T.", c: "#4FB8A8", city: "Osaka", inst: ["bassoon", "synth"], gen: ["chiptune", "games"],
    bio: { en: "Game-jam composer. If it has 4 channels, I'll write for it.", es: "Compositor de game jams. Si tiene 4 canales, le escribo." },
    links: { soundcloud: "pixelbassoon", x: "pixelbassoon", youtube: "pixelbassoon" } },
  { h: "lofi_lupe", n: "Lupe M.", c: "#E5484D", city: "Guadalajara", inst: ["guitar", "voice"], gen: ["lo-fi", "bolero", "bedroom pop"],
    bio: { en: "Boleros my grandma sang, beats I make at 2 am.", es: "Los boleros que cantaba mi abuela y los beats que hago a las 2 am." },
    collab: { en: "Want a producer for a bolero-lofi EP.", es: "Busco productor para un EP de bolero-lofi." },
    links: { instagram: "lofi_lupe", tiktok: "lofi_lupe", spotify: "lofilupe", soundcloud: "lofi_lupe" } },
  { h: "marimba_ghost", n: "Ade O.", c: "#B38CF2", city: "Lagos", inst: ["marimba", "percussion"], gen: ["afrobeat", "ambient"],
    bio: { en: "Percussionist. Everything is a drum if you're brave enough.", es: "Percusionista. Todo es tambor si tienes valor." },
    links: { instagram: "marimba.ghost", youtube: "marimbaghost", bandcamp: "marimbaghost" } },
  { h: "syntharella", n: "Ella V.", c: "#6FA8F2", city: "Berlin", inst: ["synth"], gen: ["electronic", "sound design"],
    bio: { en: "Modular cables everywhere. I score imaginary sci-fi.", es: "Cables modulares por todos lados. Musicalizo ciencia ficción imaginaria." },
    links: { bandcamp: "syntharella", soundcloud: "syntharella", instagram: "syntharella" } },
  { h: "fugue_state", n: "Tomasz W.", c: "#F2D16B", city: "Kraków", inst: ["piano", "organ"], gen: ["classical", "choral"],
    bio: { en: "Conservatory dropout, counterpoint lifer.", es: "Dejé el conservatorio, pero el contrapunto nunca me dejó a mí." },
    collab: { en: "Will write strings for your track.", es: "Te escribo cuerdas para tu tema." },
    links: { youtube: "fuguestate", facebook: "tomasz.fugue" } },
  { h: "kora_kid", n: "Moussa D.", c: "#F28C6B", city: "Dakar", inst: ["kora", "voice"], gen: ["folk", "ambient"],
    bio: { en: "Twenty-one strings and a lot of patience.", es: "Veintiún cuerdas y mucha paciencia." },
    links: { instagram: "korakid", tiktok: "korakid" } },
  { h: "tubaleaks", n: "Gus H.", c: "#8CE0A0", city: "New Orleans", inst: ["tuba", "trumpet"], gen: ["jazz", "brass band"],
    bio: { en: "Low end, high spirits. Second-line every day.", es: "Graves bajos, ánimo alto. Second-line todos los días." },
    links: { facebook: "gus.tubaleaks", instagram: "tubaleaks", x: "tubaleaks" } },
  { h: "808_requiem", n: "Dre P.", c: "#F26BA8", city: "Atlanta", inst: ["drums", "voice"], gen: ["trap", "rap", "hip-hop"],
    bio: { en: "Mozart's Requiem flipped on an 808. Bars included.", es: "El Réquiem de Mozart volteado en una 808. Con rimas incluidas." },
    collab: { en: "Need beats? Need verses? Both.", es: "¿Necesitas beats? ¿Versos? Las dos cosas." },
    links: { soundcloud: "808requiem", instagram: "808_requiem", tiktok: "808requiem", spotify: "808requiem" } },
  { h: "thereminista", n: "Ilse K.", c: "#6BE0E0", city: "Vienna", inst: ["theremin"], gen: ["horror", "film"],
    bio: { en: "I play an instrument you don't touch. Horror scores, mostly.", es: "Toco un instrumento que no se toca. Sobre todo música de terror." },
    links: { youtube: "thereminista", bandcamp: "thereminista" } },
  { h: "celloandchill", n: "Ana P.", c: "#E0B36B", city: "Lisbon", inst: ["cello"], gen: ["classical", "lo-fi"],
    bio: { en: "Cello loops in a tiny apartment. Neighbors are fans (I think).", es: "Loops de chelo en un depa diminuto. Los vecinos son fans (creo)." },
    links: { instagram: "celloandchill", tiktok: "celloandchill", youtube: "celloandchill" } },
  { h: "dr_ostinato", n: "Ravi S.", c: "#A0A8F2", city: "Mumbai", inst: ["sitar", "synth"], gen: ["minimalism", "film"],
    bio: { en: "Music teacher. Repetition is my love language.", es: "Profe de música. La repetición es mi lenguaje del amor." },
    links: { x: "dr_ostinato", soundcloud: "drostinato" } },
  { h: "hollow_choir", n: "Freya N.", c: "#C2E06B", city: "Reykjavík", inst: ["voice", "choir"], gen: ["choral", "ambient"],
    bio: { en: "One voice, forty layers.", es: "Una voz, cuarenta capas." },
    links: { bandcamp: "hollowchoir", instagram: "hollow.choir" } },
  { h: "zampona_zen", n: "Inti Q.", c: "#F2A0D0", city: "Cusco", inst: ["zampoña", "charango"], gen: ["andean", "ambient"],
    bio: { en: "Andean winds meet reverb pedals.", es: "Vientos andinos y pedales de reverb." },
    collab: { en: "Open to fusion projects.", es: "Abierto a proyectos de fusión." },
    links: { youtube: "zamponazen", facebook: "inti.zampona", instagram: "zampona_zen" } },
];
const persona = h => PERSONAS.find(p => p.h === h);

// Redes: cómo se arma la liga y su ícono (trazos simples, no logotipos oficiales)
const REDES = {
  bandcamp:   { nombre: "Bandcamp",   url: u => `https://${u}.bandcamp.com`, svg: '<path d="M3 17L9 7h12l-6 10z"/>' },
  soundcloud: { nombre: "SoundCloud", url: u => `https://soundcloud.com/${u}`, svg: '<path d="M8 17h10a3.5 3.5 0 0 0 0-7 5.5 5.5 0 0 0-10.5-1.5M5 11v6M2.5 13v4"/>' },
  spotify:    { nombre: "Spotify",    url: u => `https://open.spotify.com/artist/${u}`, svg: '<circle cx="12" cy="12" r="9"/><path d="M7.5 9.5c3-1 6.5-.7 9 .8M8 12.6c2.5-.7 5-.5 7.2.7M8.6 15.4c2-.5 3.8-.3 5.4.5"/>' },
  youtube:    { nombre: "YouTube",    url: u => `https://youtube.com/@${u}`, svg: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10 9.5v5l4.5-2.5z"/>' },
  instagram:  { nombre: "Instagram",  url: u => `https://instagram.com/${u}`, svg: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/>' },
  tiktok:     { nombre: "TikTok",     url: u => `https://tiktok.com/@${u}`, svg: '<path d="M13 4v11a3.5 3.5 0 1 1-3.5-3.5M13 4c.5 2.5 2.5 4 5 4"/>' },
  x:          { nombre: "X",          url: u => `https://x.com/${u}`, svg: '<path d="M4 4l16 16M20 4L4 20"/>' },
  facebook:   { nombre: "Facebook",   url: u => `https://facebook.com/${u}`, svg: '<path d="M14 21v-8h3l.5-3.5H14V7.5c0-1 .4-1.7 1.8-1.7h1.8V2.7c-.5 0-1.6-.2-2.8-.2-2.6 0-4.3 1.6-4.3 4.5v2.5H7.5V13h3v8"/>' },
};

const FRASES = [
  { en: ["Inspiration is a guest that does not willingly visit the lazy."], es: ["La inspiración es una visita que no le gusta ir con los perezosos."], a: "Piotr Ilich Chaikovski" },
  { en: ["Talent works, genius creates."], es: ["El talento trabaja; el genio crea."], a: "Robert Schumann" },
  { en: ["Without craftsmanship, inspiration is a mere reed shaken in the wind."], es: ["Sin oficio, la inspiración es apenas una caña sacudida por el viento."], a: "Johannes Brahms" },
  { en: ["The more constraints one imposes, the more one frees one's self of the chains that shackle the spirit."], es: ["Cuantas más restricciones uno se impone, más se libera de las cadenas que atan al espíritu."], a: "Igor Stravinsky" },
  { en: ["Cut off from the world, I was forced to become original."], es: ["Aislado del mundo, no me quedó más remedio que volverme original."], a: "Joseph Haydn" },
  { en: ["Play always as if in the presence of a master."], es: ["Toca siempre como si te escuchara un maestro."], a: "Robert Schumann" },
  { en: ["I was obliged to be industrious. Whoever is equally industrious will succeed equally well."], es: ["Tuve que ser trabajador. Quien trabaje igual llegará igual de lejos."], a: "J. S. Bach" },
];
const CONSEJOS = [
  { en: "Finish something small before you polish something big. A rough 40 seconds teaches you more than a perfect 4 bars.", es: "Termina algo pequeño antes de pulir algo grande. Cuarenta segundos en bruto enseñan más que cuatro compases perfectos." },
  { en: "Stuck? Take your best bar and play it backwards, upside down, or twice as slow. One of the three is a new idea.", es: "¿Atorado? Toma tu mejor compás y tócalo al revés, invertido o al doble de lento. Uno de los tres es una idea nueva." },
  { en: "Decide the last note first. Composing toward a destination is easier than composing into fog.", es: "Decide primero la última nota. Componer hacia un destino es más fácil que componer en la niebla." },
  { en: "Record your phone voice memo before you open your DAW. Ideas die while plugins load.", es: "Graba la nota de voz antes de abrir tu DAW. Las ideas se mueren mientras cargan los plugins." },
  { en: "Repetition is not laziness: say it once, say it again, then change one thing. That's a phrase.", es: "Repetir no es flojera: dilo una vez, dilo otra, y luego cambia una cosa. Eso es una frase." },
  { en: "If the harmony feels obvious, keep the melody and change only the bass note. Same tune, new world.", es: "Si la armonía suena obvia, conserva la melodía y cambia solo el bajo. Misma tonada, otro mundo." },
  { en: "Silence is an instrument. Try deleting the busiest beat of your loop.", es: "El silencio es un instrumento. Prueba borrar el tiempo más cargado de tu loop." },
  { en: "Limit yourself to three sounds today. Constraint is where personality hides.", es: "Hoy limítate a tres sonidos. En la restricción se esconde la personalidad." },
];
const COMENTARIOS = {
  en: ["that chord change 🔥", "the bass entrance gave me chills", "this is so the dragon's point of view", "how did you get that sound on a phone??",
    "love the restraint here", "wish it was longer — expand this!", "the silence before the end 👌", "this would kill in a boss fight"],
  es: ["ese cambio de acorde 🔥", "la entrada del bajo me puso la piel chinita", "esto es totalmente el punto de vista del dragón", "¿cómo sacaste ese sonido en un celular??",
    "me encanta lo contenido", "¡quiero que dure más, desarróllalo!", "el silencio antes del final 👌", "esto rompería en una pelea de jefe final"],
};
const ETIQUETAS_PIEZA = ["made on phone", "written first", "one take", "Logic", "Ableton", "FL Studio", "MuseScore", "voice memo", "found sounds", "piano", "guitar", "synth", "strings sample"];
const TITULOS_PIEZA = ["first light", "the long way round", "attempt #2", "I hummed this on the bus", "drums on a cereal box", "the wizard isn't coming back",
  "boceto en re dórico", "too sweet (on purpose)", "kalimba + lluvia", "3am version", "ostinato para nadie", "minor key, major feelings", "what the dragon remembers", "solo la línea de bajo"];
