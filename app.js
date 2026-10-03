/**
 * FONEMASENS - MOTOR MULTISENSORIAL DEL LENGUAJE
 * Visual (ARASAAC) + Táctil (API Háptica) + Auditivo Híbrido (Audio HD + TTS Normalizado)
 */

// ==========================================
// 1. DATOS INICIALES Y MODELO DE PALABRAS
// ==========================================

const INITIAL_WORDS = [
  {
    raw: "CA-rro",
    clean: "Carro",
    searchTerm: "carro",
    arasaacId: 2339,
    audio: {
      syllables: ["audio/syl_ca_stressed.mp3", "audio/syl_rro.mp3"],
      full: "audio/word_carro.mp3"
    }
  },
  {
    raw: "PE-rro",
    clean: "Perro",
    searchTerm: "perro",
    arasaacId: 7202,
    audio: {
      syllables: ["audio/syl_pe_stressed.mp3", "audio/syl_rro.mp3"],
      full: "audio/word_perro.mp3"
    }
  },
  {
    raw: "BA-ño",
    clean: "Baño",
    searchTerm: "baño",
    arasaacId: 6929,
    audio: {
      syllables: ["audio/syl_ba_stressed.mp3", "audio/syl_no.mp3"],
      full: "audio/word_bano.mp3"
    }
  },
  {
    raw: "pe-LO-ta",
    clean: "Pelota",
    searchTerm: "pelota",
    arasaacId: 3241,
    audio: {
      syllables: ["audio/syl_pe.mp3", "audio/syl_lo_stressed.mp3", "audio/syl_ta.mp3"],
      full: "audio/word_pelota.mp3"
    }
  },
  {
    raw: "man-ZA-na",
    clean: "Manzana",
    searchTerm: "manzana",
    arasaacId: 2462,
    audio: {
      syllables: ["audio/syl_man.mp3", "audio/syl_za_stressed.mp3", "audio/syl_na.mp3"],
      full: "audio/word_manzana.mp3"
    }
  },
  {
    raw: "cu-CHA*-ra",
    clean: "Cuchara",
    searchTerm: "cuchara",
    arasaacId: 2362,
    audio: {
      syllables: ["audio/syl_cu.mp3", "audio/syl_cha_sustained.mp3", "audio/syl_ra.mp3"],
      full: "audio/word_cuchara.mp3"
    }
  }
];

// ==========================================
// 2. DICCIONARIO FONÉTICO ANTI-ACRÓNIMOS (TTS)
// ==========================================

/**
 * Resuelve el problema donde los sintetizadores de Android / Chrome
 * confunden fragmentos de dos letras con símbolos químicos o siglas:
 * - "na" o "Na" -> Ya no dice "sodio", sino "ná."
 * - "ZA" o "za" -> Ya no deletrea "Z-A", sino "zá."
 * - "ca" -> Ya no dice "calcio", sino "cá."
 * - "ba" -> Ya no dice "bario", sino "bá."
 */
const PHONETIC_TTS_MAP = {
  // Evitar símbolos químicos y abreviaturas en motores TTS de celulares
  "na": "ná.",      // Evita 'Sodio' o 'N/A'
  "no": "nó.",
  "za": "zá.",      // Evita 'Zeta-A' o Sudáfrica
  "zo": "zó.",
  "zu": "zú.",
  "ca": "cá.",      // Evita 'Calcio'
  "ba": "bá.",      // Evita 'Bario'
  "cu": "cú.",      // Evita 'Cobre'
  "pe": "pé.",
  "lo": "ló.",
  "ta": "tá.",
  "te": "té.",
  "ño": "ñó.",
  "man": "mán.",
  "cha": "chá.",
  "ra": "rá.",

  // Sílabas con erre fuerte (vibrante múltiple /r/)
  // ¡Usamos exclamación ¡Rra! para forzar interjección fonológica en español,
  // impidiendo que cualquier sintetizador lo deletree como "erre-erre-a" o lo debilite a erre simple!
  "rra": "¡Rra!",
  "rre": "¡Rre!",
  "rri": "¡Rri!",
  "rro": "¡Rro!",
  "rru": "¡Rru!",

  // Fonemas de 'j' (fuerza pronunciación de jota velar en español y evita 'yu' o /j/ en motores multilingües)
  "ju": "jú.",
  "ja": "já.",
  "je": "jé.",
  "ji": "jí.",
  "jo": "jó.",

  // Fonemas 'gue' / 'gui' / 'que' / 'qui' (evita que el TTS lea "g-u-e" o "güe")
  "gue": "gué.",
  "gui": "guí.",
  "que": "qué.",
  "qui": "quí.",
  "ge": "jé.",
  "gi": "jí."
};

/**
 * Normaliza cualquier sílaba (incluso de palabras nuevas añadidas por el usuario)
 * para garantizar que el motor TTS jamás la deletree ni la confunda con siglas o pronunciaciones en inglés/germánico.
 */
function normalizeForTTS(cleanSyllable, isStressed, isSustained) {
  const lower = cleanSyllable.toLowerCase().trim();

  // 1. Si está en el diccionario explícito
  if (PHONETIC_TTS_MAP[lower]) {
    let result = PHONETIC_TTS_MAP[lower];
    if (lower.startsWith("rr")) {
      const vowel = lower.slice(2, 3);
      if (isSustained) {
        return `¡Rr${vowel}${vowel}${vowel}!`;
      }
      if (isStressed) {
        const acc = { a: "á", e: "é", i: "í", o: "ó", u: "ú" }[vowel] || vowel;
        return `¡Rr${acc}!`;
      }
      return result;
    }

    if (isSustained) {
      result = result.replace(/([aeiouáéíóú])\./i, "$1$1$1.");
    }
    return result;
  }

  // 2. Regla algorítmica para palabras nuevas
  let token = lower;

  // Si la sílaba contiene 'rr' (ej. "rra", "rro"), usar exclamación española para forzar vibrante múltiple
  if (/^rr[aeiou]/i.test(token)) {
    const vowel = token.slice(2, 3);
    const accentedVowel = { a: "á", e: "é", i: "í", o: "ó", u: "ú" }[vowel] || vowel;
    if (isSustained) {
      return `¡Rr${vowel}${vowel}${vowel}!`;
    }
    if (isStressed) {
      return `¡Rr${accentedVowel}!`;
    }
    return `¡Rr${vowel}!`;
  } else if (/^j[aeiou]/i.test(token)) {
    token = token
      .replace(/^ja/i, "já")
      .replace(/^je/i, "jé")
      .replace(/^ji/i, "jí")
      .replace(/^jo/i, "jó")
      .replace(/^ju/i, "jú");
  } else if (/^gu[ei]/i.test(token)) {
    token = token.replace(/^gue/i, "gué").replace(/^gui/i, "guí");
  } else if (/^qu[ei]/i.test(token)) {
    token = token.replace(/^que/i, "qué").replace(/^qui/i, "quí");
  } else if (isSustained) {
    const lastChar = token.slice(-1);
    if ("aeiouáéíóú".includes(lastChar)) {
      token = token + lastChar + lastChar;
    }
  } else if (isStressed) {
    // Acentuar la primera vocal
    token = token.replace(/a/i, "á").replace(/e/i, "é").replace(/i/i, "í").replace(/o/i, "ó").replace(/u/i, "ú");
  }

  // Terminar con punto para forzar al sintetizador a tratarlo como token terminal léxico
  return token.endsWith(".") ? token : token + ".";
}

// ==========================================
// 3. ESTADO GLOBAL DE LA APLICACIÓN
// ==========================================

const state = {
  words: [],
  currentIndex: 0,
  isPlayingSequence: false,
  sequenceTimeout: null,
  countdownTimeout: null,
  countdownSeconds: 3, // 3 segundos para enfocar al niño, anticipar compás y precargar audio
  soundEnabled: true,
  vibrationEnabled: true,
  vibeIntensity: "fuerte", // "estandar" (1.0x) | "fuerte" (1.25x - Terapéutica Niños) | "maxima" (1.6x - Para Fundas)
  audioMode: "hd", // "hd" (Archivos de Audio HD) | "edge" (Edge-TTS Neuronal) | "tts" (Sintetizador Normalizado)
  edgeVoiceName: localStorage.getItem("fonemasens_edge_voice") || "es-ES-ElviraNeural",
  edgeEndpoint: localStorage.getItem("fonemasens_edge_endpoint") || 
    (window.location.hostname.includes("github.io") ? "https://web-app-fros4.vercel.app/api/tts" : "/api/tts"),
  speechRate: 0.85,
  pauseBetweenSyllables: 700,
  harmonicToneEnabled: true,
  selectedVoice: null,
  spanishVoices: [],

  // Estado del Modo Pares Mínimos
  currentAppMode: "syllables", // "syllables" (Segmentación) | "pairs" (Pares Mínimos)
  currentPairIndex: 0,
  isPlayingPairSequence: false,
  pairSequenceTimeout: null,
  gameChallengeSecret: null // Para el desafío "¿Cuál sonó?"
};

// Banco Fonético de Clips Neuronales HD Pregrabados (0ms de latencia)
const KNOWN_HD_CLIPS = new Set([
  // Clips de Segmentación Prototipo
  "audio/syl_ca_stressed.mp3",
  "audio/syl_rro.mp3",
  "audio/syl_rro_stressed.mp3",
  "audio/syl_rra.mp3",
  "audio/syl_rra_stressed.mp3",
  "audio/syl_rre.mp3",
  "audio/syl_rre_stressed.mp3",
  "audio/syl_rri.mp3",
  "audio/syl_rri_stressed.mp3",
  "audio/syl_rru.mp3",
  "audio/syl_rru_stressed.mp3",
  "audio/syl_pe_stressed.mp3",
  "audio/syl_pe.mp3",
  "audio/syl_ba_stressed.mp3",
  "audio/syl_no.mp3",
  "audio/syl_lo_stressed.mp3",
  "audio/syl_ta.mp3",
  "audio/syl_man.mp3",
  "audio/syl_za_stressed.mp3",
  "audio/syl_na.mp3",
  "audio/syl_cu.mp3",
  "audio/syl_cha_sustained.mp3",
  "audio/syl_ra.mp3",
  "audio/syl_ju.mp3",
  "audio/syl_ju_stressed.mp3",
  "audio/syl_gue.mp3",
  "audio/syl_gue_stressed.mp3",
  "audio/syl_te.mp3",
  "audio/syl_te_stressed.mp3",
  "audio/word_carro.mp3",
  "audio/word_perro.mp3",
  "audio/word_bano.mp3",
  "audio/word_pelota.mp3",
  "audio/word_manzana.mp3",
  "audio/word_cuchara.mp3",
  "audio/word_juguete.mp3",

  // Clips HD para los 4 Pares Mínimos de Prueba
  "audio/word_casa.mp3",
  "audio/word_taza.mp3",
  "audio/word_pato.mp3",
  "audio/word_gato.mp3",
  "audio/word_jamon.mp3",
  "audio/word_jabon.mp3",
  "audio/word_pino.mp3",
  "audio/word_vino.mp3",
  "audio/syl_sa.mp3",
  "audio/syl_ta_stressed.mp3",
  "audio/syl_za.mp3",
  "audio/syl_pa_stressed.mp3",
  "audio/syl_ga_stressed.mp3",
  "audio/syl_to.mp3",
  "audio/syl_ja.mp3",
  "audio/syl_mon_stressed.mp3",
  "audio/syl_bon_stressed.mp3",
  "audio/syl_pi_stressed.mp3",
  "audio/syl_vi_stressed.mp3"
]);

// Web Audio Context y Caché de Precarga en Memoria RAM
let audioCtx = null;
let currentSourceNode = null;
let currentAudioInstance = null;
const audioBufferCache = {};
const audioCache = {};

// ==========================================
// SERVICIO EDGE-TTS (VOCES NEURONALES & CACHÉ INDEXEDDB)
// ==========================================

const EDGE_AUDIO_CACHE = {}; // Caché en memoria (AudioBuffers decodificados)
const DB_NAME = "FonemaSensAudioDB";
const STORE_NAME = "edge_audio";

function openAudioDB() {
  return new Promise((resolve) => {
    if (!("indexedDB" in window)) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = () => resolve(null);
  });
}

async function getCachedAudioFromDB(key) {
  const db = await openAudioDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

async function saveAudioToDB(key, arrayBuffer) {
  const db = await openAudioDB();
  if (!db) return;
  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(arrayBuffer, key);
  } catch (e) {}
}

/**
 * Consulta el microservicio de Edge-TTS (/api/tts) para sintetizar audio neuronal
 * Devuelve un AudioBuffer decodificado en memoria para reproducción a 0ms de latencia.
 */
async function synthesizeWithEdgeTTS(text, sylType = "normal") {
  initAudioContext();
  if (!audioCtx) return null;

  const voice = state.edgeVoiceName || "es-ES-ElviraNeural";
  const clean = text.trim();
  const cacheKey = `edge_${clean.toLowerCase()}_${sylType}_${voice}`;

  // 1. Caché en memoria RAM (0ms)
  if (EDGE_AUDIO_CACHE[cacheKey]) {
    return EDGE_AUDIO_CACHE[cacheKey];
  }

  // 2. Caché persistente en IndexedDB (0ms y funciona sin internet)
  const cachedBuffer = await getCachedAudioFromDB(cacheKey);
  if (cachedBuffer) {
    try {
      const decoded = await audioCtx.decodeAudioData(cachedBuffer.slice(0));
      EDGE_AUDIO_CACHE[cacheKey] = decoded;
      return decoded;
    } catch (e) {
      console.warn("Error decodificando audio de IndexedDB:", e);
    }
  }

  // 3. Petición al microservicio de Edge-TTS (/api/tts)
  const endpoint = state.edgeEndpoint || "/api/tts";
  const url = `${endpoint}?text=${encodeURIComponent(clean)}&type=${encodeURIComponent(sylType)}&voice=${encodeURIComponent(voice)}`;

  const res = await fetch(url);
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Edge-TTS respondió con código ${res.status}: ${errText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new Error("Respuesta vacía del microservicio Edge-TTS");
  }

  // Guardar en IndexedDB para no volver a pedirlo por red
  saveAudioToDB(cacheKey, arrayBuffer.slice(0));

  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  EDGE_AUDIO_CACHE[cacheKey] = audioBuffer;
  return audioBuffer;
}

/**
 * Reproduce un AudioBuffer decodificado con sincronización sample-accurate
 */
function playDecodedAudioBuffer(buffer, onAudioActuallyStarted) {
  if (!state.soundEnabled) {
    if (typeof onAudioActuallyStarted === "function") onAudioActuallyStarted();
    return Promise.resolve(true);
  }

  stopAllAudio();
  initAudioContext();
  if (!audioCtx || !buffer) return Promise.resolve(false);

  return new Promise((resolve) => {
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    currentSourceNode = source;

    let hasEnded = false;
    const finish = () => {
      if (!hasEnded) {
        hasEnded = true;
        currentSourceNode = null;
        resolve(true);
      }
    };

    source.onended = finish;

    // Disparar vibración háptica exactamente al empezar el sonido
    if (typeof onAudioActuallyStarted === "function") {
      onAudioActuallyStarted();
    }
    source.start(0);

    setTimeout(finish, Math.round(buffer.duration * 1000) + 120);
  });
}

/**
 * Carga y decodifica un archivo de audio en un AudioBuffer (PCM en memoria)
 * Permite reproducción con 0ms de latencia de decodificación y reloj maestro sample-accurate.
 */
async function loadAndDecodeAudio(url) {
  if (!url) return null;
  if (audioBufferCache[url]) return audioBufferCache[url];
  initAudioContext();
  if (!audioCtx) return null;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    audioBufferCache[url] = audioBuffer;
    return audioBuffer;
  } catch (e) {
    console.warn("No se pudo decodificar AudioBuffer:", url, e);
    return null;
  }
}

function preloadAudioClip(url) {
  if (!url) return null;
  // Si Web Audio está activo, decodificar en memoria en segundo plano
  if (audioCtx && audioCtx.state === "running") {
    loadAndDecodeAudio(url).catch(() => {});
  }
  if (audioCache[url]) return audioCache[url];
  try {
    const a = new Audio();
    a.preload = "auto";
    a.src = url;
    a.load();
    audioCache[url] = a;
    return a;
  } catch (e) {
    return null;
  }
}

function preloadWordAudios(wordObj) {
  if (!wordObj) return;

  // 1. Clips estáticos HD
  if (wordObj.audio) {
    if (wordObj.audio.full) preloadAudioClip(wordObj.audio.full);
    if (Array.isArray(wordObj.audio.syllables)) {
      wordObj.audio.syllables.forEach(url => preloadAudioClip(url));
    }
  }

  // 2. Si el modo activo es Edge-TTS (o HD en palabras añadidas), precargar en segundo plano
  if ((state.audioMode === "edge" || state.audioMode === "hd") && wordObj.raw) {
    try {
      const syllables = parseWordPattern(wordObj.raw);
      syllables.forEach(syl => {
        synthesizeWithEdgeTTS(syl.cleanText, syl.type).catch(() => {});
      });
      if (wordObj.clean) {
        synthesizeWithEdgeTTS(wordObj.clean, "word").catch(() => {});
      }
    } catch (e) {}
  }
}

// ==========================================
// 4. ANALIZADOR FONÉTICO DE SÍLABAS
// ==========================================

function parseWordPattern(wordPattern) {
  const parts = wordPattern.split("-");

  return parts.map((part) => {
    const rawPart = part.trim();
    const hasAsterisk = rawPart.includes("*");
    const cleanToken = rawPart.replace(/\*/g, "");

    const isUppercase = cleanToken.length > 0 &&
                        cleanToken === cleanToken.toUpperCase() &&
                        /[A-ZÁÉÍÓÚÑ]/.test(cleanToken);

    let type = "normal";
    let typeLabel = "Átona";
    let vibeDesc = "Átona Nítida (140ms)";
    let vibePattern = [140]; // Aumentado de 60ms a 140ms para máxima percepción
    let pitch = 1.0;
    let rateMultiplier = 1.0;

    if (hasAsterisk) {
      type = "sustained";
      typeLabel = "Sostenida (*)";
      vibeDesc = "Sostenida Fuerte (Larga 670ms)";
      vibePattern = [380, 50, 240]; // Onda táctil extendida con modulación
      pitch = 1.2;
      rateMultiplier = 0.55;
    } else if (isUppercase) {
      type = "stressed";
      typeLabel = "Acentuada";
      vibeDesc = "Acentuada Fuerte (Doble Golpe 360ms)";
      vibePattern = [220, 40, 100]; // Doble golpe percutivo inconfundible
      pitch = 1.35;
      rateMultiplier = 0.95;
    }

    const ttsText = normalizeForTTS(cleanToken, isUppercase, hasAsterisk);

    return {
      text: cleanToken + (hasAsterisk ? "*" : ""),
      cleanText: cleanToken.toLowerCase(),
      ttsText: ttsText,
      type: type,
      typeLabel: typeLabel,
      vibeDesc: vibeDesc,
      vibePattern: vibePattern,
      pitch: pitch,
      rateMultiplier: rateMultiplier
    };
  });
}

// ==========================================
// 5. MOTOR HÁPTICO / VIBRACIÓN
// ==========================================

function triggerHaptic(pattern, typeLabel, durationMs = 200) {
  if (!state.vibrationEnabled) return;

  // Escalar patrón según el nivel de potencia elegido (fuerte por defecto)
  const mult = state.vibeIntensity === "maxima" ? 1.6 : (state.vibeIntensity === "estandar" ? 0.9 : 1.25);
  const scaledPattern = Array.isArray(pattern)
    ? pattern.map(val => Math.round(val * mult))
    : Math.round(pattern * mult);

  if ("vibrate" in navigator) {
    try {
      navigator.vibrate(scaledPattern);
    } catch (e) {
      console.warn("navigator.vibrate error:", e);
    }
  }

  const hapticBar = document.getElementById("haptic-bar");
  const hapticBadge = document.getElementById("haptic-badge");
  const hapticDesc = document.getElementById("haptic-desc");

  if (hapticBar && hapticBadge && hapticDesc) {
    const isStressed = typeLabel.toLowerCase().includes("acentuada");
    const isSustained = typeLabel.toLowerCase().includes("sostenida");

    hapticBar.classList.add("active-vibe");
    if (isStressed) hapticBar.classList.add("vibe-stressed");
    if (isSustained) hapticBar.classList.add("vibe-sustained");

    hapticBadge.className = `haptic-badge ${isSustained ? "sustained" : isStressed ? "stressed" : ""}`;
    hapticBadge.textContent = typeLabel;
    hapticDesc.textContent = `Vibrando: ${typeLabel}`;

    const totalMs = Array.isArray(scaledPattern)
      ? scaledPattern.reduce((a, b) => a + b, 0)
      : (typeof scaledPattern === "number" ? scaledPattern : durationMs);

    setTimeout(() => {
      hapticBar.classList.remove("active-vibe", "vibe-stressed", "vibe-sustained");
      hapticBadge.className = "haptic-badge";
      hapticBadge.textContent = "Normal";
      hapticDesc.textContent = "Motor háptico listo";
    }, Math.max(totalMs + 50, 250));
  }
}

// ==========================================
// 6. MOTOR AUDITIVO HÍBRIDO (AUDIO HD + TTS)
// ==========================================

function initAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

function stopAllAudio() {
  if (currentSourceNode) {
    try {
      currentSourceNode.stop();
      currentSourceNode.disconnect();
    } catch (e) {}
    currentSourceNode = null;
  }
  if (currentAudioInstance) {
    try {
      currentAudioInstance.pause();
      currentAudioInstance.currentTime = 0;
    } catch (e) {}
    currentAudioInstance = null;
  }
}

/**
 * Reproduce un archivo de audio MP3 (Audio HD) con sincronización de latencia cero (0ms)
 * usando Web Audio API (AudioBufferSourceNode) y fallback seguro a HTMLAudioElement.
 */
async function playAudioClip(url, onAudioActuallyStarted) {
  if (!state.soundEnabled) {
    if (typeof onAudioActuallyStarted === "function") onAudioActuallyStarted();
    return true;
  }

  stopAllAudio();
  initAudioContext();

  // 1. MÉTODO PRIMARIO: Web Audio API (Precisión sample-accurate a nivel de microsegundo)
  if (audioCtx) {
    try {
      const buffer = await loadAndDecodeAudio(url);
      if (buffer) {
        return new Promise((resolve) => {
          const source = audioCtx.createBufferSource();
          source.buffer = buffer;
          source.connect(audioCtx.destination);
          currentSourceNode = source;

          let hasEnded = false;
          const finish = () => {
            if (!hasEnded) {
              hasEnded = true;
              currentSourceNode = null;
              resolve(true);
            }
          };

          source.onended = finish;

          // SINCRONIZACIÓN MILIMÉTRICA: Disparar vibración y feedback visual simultáneamente en t=0
          if (typeof onAudioActuallyStarted === "function") {
            onAudioActuallyStarted();
          }
          source.start(0);

          setTimeout(finish, Math.round(buffer.duration * 1000) + 120);
        });
      }
    } catch (e) {
      console.warn("Web Audio API falló, usando fallback HTMLAudioElement:", e);
    }
  }

  // 2. MÉTODO SECUNDARIO: HTMLAudioElement con escucha precisa al evento 'playing'
  return new Promise((resolve) => {
    let audio = audioCache[url];
    if (!audio) {
      audio = preloadAudioClip(url) || new Audio(url);
    }

    currentAudioInstance = audio;
    audio.currentTime = 0;

    let hasEnded = false;
    const finish = (success) => {
      if (!hasEnded) {
        hasEnded = true;
        currentAudioInstance = null;
        resolve(success);
      }
    };

    let started = false;
    const triggerStart = () => {
      if (!started) {
        started = true;
        if (typeof onAudioActuallyStarted === "function") {
          onAudioActuallyStarted();
        }
      }
    };

    audio.addEventListener("playing", triggerStart, { once: true });
    audio.onended = () => finish(true);
    audio.onerror = (err) => {
      console.warn("Clip de audio no encontrado, usando TTS de respaldo:", url, err);
      finish(false);
    };

    audio.play().then(() => {
      setTimeout(triggerStart, 40);
    }).catch((err) => {
      console.warn("Error al reproducir audio clip:", err);
      finish(false);
    });

    setTimeout(() => finish(true), 2500);
  });
}

/**
 * Tono armónico complementario
 */
function playHarmonicCue(type) {
  if (!state.harmonicToneEnabled || !state.soundEnabled) return;
  initAudioContext();
  if (!audioCtx) return;

  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    let freq = 440;
    let duration = 0.12;

    if (type === "stressed") {
      freq = 660;
      duration = 0.2;
    } else if (type === "sustained") {
      freq = 554.37;
      duration = 0.45;
    }

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn("Audio cue error:", e);
  }
}

/**
 * Carga voces del dispositivo
 */
function loadVoices() {
  if (!("speechSynthesis" in window)) return;

  const voices = window.speechSynthesis.getVoices();
  state.spanishVoices = voices.filter(v => v.lang.startsWith("es") || v.lang.includes("es-"));

  const voiceSelect = document.getElementById("voice-select");
  if (voiceSelect) {
    voiceSelect.innerHTML = "";
    if (state.spanishVoices.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "Voz predeterminada del sistema";
      voiceSelect.appendChild(opt);
    } else {
      state.spanishVoices.forEach((voice, i) => {
        const opt = document.createElement("option");
        opt.value = voice.name;
        opt.textContent = `${voice.name} (${voice.lang})`;
        if (voice.name.toLowerCase().includes("natural") ||
            voice.name.toLowerCase().includes("google") ||
            i === 0) {
          if (!state.selectedVoice) {
            state.selectedVoice = voice;
            opt.selected = true;
          }
        }
        voiceSelect.appendChild(opt);
      });
    }
  }
}

/**
 * Pronuncia una sílaba con TTS inteligente sin entrecortes en Android y sincronización exacta onstart
 */
function speakSyllableTTS(syllableObj, onAudioActuallyStarted) {
  return new Promise((resolve) => {
    if (!state.soundEnabled || !("speechSynthesis" in window)) {
      if (typeof onAudioActuallyStarted === "function") onAudioActuallyStarted();
      setTimeout(resolve, 350);
      return;
    }

    stopAllAudio();
    // Solo cancelar si la síntesis está activa para evitar el bug de aborto prematuro de Android
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const textToSpeak = syllableObj.ttsText || normalizeForTTS(syllableObj.cleanText, syllableObj.type === "stressed", syllableObj.type === "sustained");

    const utter = new SpeechSynthesisUtterance(textToSpeak);
    utter.lang = state.selectedVoice ? state.selectedVoice.lang : "es-ES";
    if (state.selectedVoice) {
      utter.voice = state.selectedVoice;
    }

    utter.pitch = syllableObj.pitch;
    utter.rate = state.speechRate * syllableObj.rateMultiplier;
    utter.volume = 1.0;

    let started = false;
    let fallbackTimer = null;
    let finishTimer = null;

    const triggerStart = () => {
      if (!started) {
        started = true;
        if (fallbackTimer) clearTimeout(fallbackTimer);
        if (typeof onAudioActuallyStarted === "function") {
          onAudioActuallyStarted();
        }
      }
    };

    utter.onstart = triggerStart;

    let hasEnded = false;
    const finish = () => {
      if (!hasEnded) {
        hasEnded = true;
        if (finishTimer) clearTimeout(finishTimer);
        if (fallbackTimer) clearTimeout(fallbackTimer);
        resolve();
      }
    };

    utter.onend = finish;
    utter.onerror = finish;

    // Sincronización sample-accurate: utter.onstart es el evento primario exacto.
    // Solo si onstart no dispara en 380ms (dispositivos antiguos con fallo de evento), actúa el fallback.
    fallbackTimer = setTimeout(triggerStart, 380);
    finishTimer = setTimeout(finish, 2200);

    window.speechSynthesis.speak(utter);
  });
}

/**
 * Busca si existe un clip neuronal HD para una sílaba (sea palabra prototipo o agregada por el usuario)
 */
function getHDSyllableClip(syllableObj, wordObj, syllableIndex) {
  // 1. Asignado explícitamente en el objeto palabra
  if (wordObj && wordObj.audio && Array.isArray(wordObj.audio.syllables) && wordObj.audio.syllables[syllableIndex]) {
    return wordObj.audio.syllables[syllableIndex];
  }

  // 2. Buscar en la biblioteca fonética de clips HD pregrabados
  const token = syllableObj.cleanText;
  const isStressed = syllableObj.type === "stressed";
  const isSustained = syllableObj.type === "sustained";

  const candidates = [];
  if (isSustained) {
    candidates.push(`audio/syl_${token}_sustained.mp3`);
  }
  if (isStressed) {
    candidates.push(`audio/syl_${token}_stressed.mp3`);
    candidates.push(`audio/syl_${token}.mp3`);
  } else {
    candidates.push(`audio/syl_${token}.mp3`);
    candidates.push(`audio/syl_${token}_stressed.mp3`);
  }

  for (const path of candidates) {
    if (audioBufferCache[path] || KNOWN_HD_CLIPS.has(path)) {
      return path;
    }
  }

  return null;
}

/**
 * Reproduce una sílaba según el modo activo con callback de sincronización exacta
 */
async function playSyllableAudio(syllableObj, wordObj, syllableIndex, onAudioActuallyStarted) {
  if (!state.soundEnabled) {
    if (typeof onAudioActuallyStarted === "function") onAudioActuallyStarted();
    return;
  }

  // 1. Si el modo es Audio HD, buscar clip pregrabado (en la palabra o en el banco fonético)
  if (state.audioMode === "hd") {
    const clipPath = getHDSyllableClip(syllableObj, wordObj, syllableIndex);
    if (clipPath) {
      const success = await playAudioClip(clipPath, onAudioActuallyStarted);
      if (success) return;
    }
  }

  // 2. Si el modo es Edge-TTS (o HD cuando no hay clip pregrabado)
  if ((state.audioMode === "edge" || state.audioMode === "hd") && state.audioMode !== "tts") {
    try {
      const sylType = syllableObj.type || "normal";
      const token = syllableObj.cleanText;
      const buffer = await synthesizeWithEdgeTTS(token, sylType);
      if (buffer) {
        const success = await playDecodedAudioBuffer(buffer, onAudioActuallyStarted);
        if (success) return;
      }
    } catch (e) {
      console.warn("Fallo en síntesis Edge-TTS, usando fallback TTS:", e);
    }
  }

  // 3. Fallback o Modo TTS directo del navegador
  await speakSyllableTTS(syllableObj, onAudioActuallyStarted);
}

/**
 * Pronuncia o reproduce la palabra completa
 */
async function playFullWordAudio(wordObj, onAudioActuallyStarted) {
  if (!state.soundEnabled) {
    if (typeof onAudioActuallyStarted === "function") onAudioActuallyStarted();
    return;
  }

  if (state.audioMode === "hd") {
    // 1. Clip explícito en el objeto
    if (wordObj && wordObj.audio && wordObj.audio.full) {
      const success = await playAudioClip(wordObj.audio.full, onAudioActuallyStarted);
      if (success) return;
    }

    // 2. Clip correspondiente en el banco por nombre de palabra
    const cleanNormalized = (wordObj.clean || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const candidatePath = `audio/word_${cleanNormalized}.mp3`;
    if (audioBufferCache[candidatePath] || KNOWN_HD_CLIPS.has(candidatePath)) {
      const success = await playAudioClip(candidatePath, onAudioActuallyStarted);
      if (success) return;
    }
  }

  // 3. Edge-TTS para palabra completa si no hay clip estático
  if ((state.audioMode === "edge" || state.audioMode === "hd") && state.audioMode !== "tts") {
    try {
      const clean = wordObj.clean || "";
      const buffer = await synthesizeWithEdgeTTS(clean, "word");
      if (buffer) {
        const success = await playDecodedAudioBuffer(buffer, onAudioActuallyStarted);
        if (success) return;
      }
    } catch (e) {
      console.warn("Fallo en Edge-TTS para palabra, usando fallback:", e);
    }
  }

  // Fallback con TTS
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) {
      if (typeof onAudioActuallyStarted === "function") onAudioActuallyStarted();
      setTimeout(resolve, 500);
      return;
    }

    stopAllAudio();
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utter = new SpeechSynthesisUtterance(wordObj.clean + ".");
    utter.lang = state.selectedVoice ? state.selectedVoice.lang : "es-ES";
    if (state.selectedVoice) {
      utter.voice = state.selectedVoice;
    }
    utter.pitch = 1.05;
    utter.rate = Math.max(0.75, state.speechRate);
    utter.volume = 1.0;

    let started = false;
    let fallbackTimer = null;
    let finishTimer = null;

    const triggerStart = () => {
      if (!started) {
        started = true;
        if (fallbackTimer) clearTimeout(fallbackTimer);
        if (typeof onAudioActuallyStarted === "function") {
          onAudioActuallyStarted();
        }
      }
    };

    utter.onstart = triggerStart;

    let hasEnded = false;
    const finish = () => {
      if (!hasEnded) {
        hasEnded = true;
        if (finishTimer) clearTimeout(finishTimer);
        if (fallbackTimer) clearTimeout(fallbackTimer);
        resolve();
      }
    };

    utter.onend = finish;
    utter.onerror = finish;

    fallbackTimer = setTimeout(triggerStart, 380);
    finishTimer = setTimeout(finish, 2200);

    window.speechSynthesis.speak(utter);
  });
}

// ==========================================
// 7. RENDERIZADO Y CONTROL DE LA INTERFAZ
// ==========================================

function loadWordList() {
  const saved = localStorage.getItem("fonemasens_words_v2");
  if (saved) {
    try {
      state.words = JSON.parse(saved);
    } catch (e) {
      state.words = [...INITIAL_WORDS];
    }
  } else {
    state.words = [...INITIAL_WORDS];
  }
}

function saveWordList() {
  localStorage.setItem("fonemasens_words_v2", JSON.stringify(state.words));
}

function renderShelf() {
  const shelf = document.getElementById("word-shelf");
  if (!shelf) return;

  shelf.innerHTML = "";

  state.words.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = `shelf-card ${index === state.currentIndex ? "active" : ""}`;
    card.setAttribute("role", "tab");
    card.setAttribute("aria-selected", index === state.currentIndex);
    card.title = item.clean;

    const img = document.createElement("img");
    img.className = "shelf-thumb";
    img.alt = item.clean;
    img.loading = "lazy";
    img.src = item.arasaacId
      ? `https://static.arasaac.org/pictograms/${item.arasaacId}/${item.arasaacId}_300.png`
      : "https://static.arasaac.org/pictograms/2339/2339_300.png";

    const label = document.createElement("span");
    label.className = "shelf-word-name";
    label.textContent = item.clean;

    card.appendChild(img);
    card.appendChild(label);

    card.addEventListener("click", () => {
      if (state.currentIndex !== index) {
        stopSequence();
        state.currentIndex = index;
        renderActiveWord();
        renderShelf();
      }
    });

    shelf.appendChild(card);
  });
}

function renderActiveWord() {
  const currentWord = state.words[state.currentIndex];
  if (!currentWord) return;

  const counter = document.getElementById("word-counter");
  if (counter) {
    counter.textContent = `Palabra ${state.currentIndex + 1} de ${state.words.length}`;
  }

  const cleanLabel = document.getElementById("target-word-clean");
  if (cleanLabel) {
    cleanLabel.textContent = currentWord.clean.toUpperCase();
  }

  const imgEl = document.getElementById("pictogram-img");
  const loader = document.getElementById("pictogram-loader");

  if (imgEl) {
    if (loader) loader.classList.add("show");

    const imgSrc = currentWord.arasaacId
      ? `https://static.arasaac.org/pictograms/${currentWord.arasaacId}/${currentWord.arasaacId}_500.png`
      : "https://static.arasaac.org/pictograms/2339/2339_500.png";

    imgEl.onload = () => {
      if (loader) loader.classList.remove("show");
    };
    imgEl.onerror = () => {
      if (loader) loader.classList.remove("show");
    };

    imgEl.src = imgSrc;
    imgEl.alt = `Pictograma de ${currentWord.clean}`;
  }

  const syllables = parseWordPattern(currentWord.raw);
  const stage = document.getElementById("syllables-stage");
  if (!stage) return;

  stage.innerHTML = "";

  syllables.forEach((syl, index) => {
    const pill = document.createElement("button");
    pill.className = `syllable-pill type-${syl.type}`;
    pill.id = `syl-pill-${index}`;
    pill.setAttribute("aria-label", `Sílaba ${syl.text}, tipo ${syl.typeLabel}`);

    const textSpan = document.createElement("span");
    textSpan.className = "syllable-text";
    textSpan.textContent = syl.text;

    const badge = document.createElement("span");
    badge.className = "syllable-type-badge";
    badge.textContent = syl.type === "sustained" ? "〰️ Sost." : (syl.type === "stressed" ? "⚡ Acent." : "Suave");

    pill.appendChild(textSpan);
    pill.appendChild(badge);

    // Clic individual
    pill.addEventListener("click", () => {
      initAudioContext();
      stopSequence();
      activateSyllable(syl, index, currentWord);
    });

    stage.appendChild(pill);
  });
}

/**
 * Activa los estímulos multisensoriales para una sílaba específica
 * Garantiza que la vibración y el audio se disparen en el milisegundo exacto de inicio sonoro
 */
async function activateSyllable(syllableObj, index, wordObj) {
  const allPills = document.querySelectorAll(".syllable-pill");
  allPills.forEach(p => p.classList.remove("active"));

  const targetPill = document.getElementById(`syl-pill-${index}`);

  // Callback de sincronización exacta: se ejecuta en el instante exacto en que el sonido sale por el altavoz (t=0)
  const onAudioStart = () => {
    if (targetPill) targetPill.classList.add("active");
    triggerHaptic(syllableObj.vibePattern, syllableObj.typeLabel);
    playHarmonicCue(syllableObj.type);
  };

  await playSyllableAudio(syllableObj, wordObj, index, onAudioStart);

  if (targetPill) {
    setTimeout(() => {
      targetPill.classList.remove("active");
    }, 150);
  }
}

// ==========================================
// 8. SECUENCIADOR MULTISENSORIAL COMPLETO
// ==========================================

/**
 * Cuenta regresiva visual y táctil preparatoria (3s por defecto) para enfocar la atención del niño,
 * anticipar el compás y precargar el motor de audio/TTS para evitar entrecortes.
 */
async function runPreparationCountdown() {
  if (state.countdownSeconds <= 0) {
    const currentWord = state.words[state.currentIndex];
    preloadWordAudios(currentWord);
    return true;
  }

  const overlay = document.getElementById("countdown-overlay");
  const numEl = document.getElementById("countdown-number");
  const labelEl = document.getElementById("countdown-label");

  if (!overlay || !numEl) return true;

  overlay.classList.add("show");

  // Calentamiento del sintetizador TTS en segundo plano:
  // Dispara un token breve inaudible para despertar el daemon de voz de Android/Chrome
  // eliminando la latencia de arranque en frío y evitando que la primera sílaba se entrecorte
  if ("speechSynthesis" in window) {
    try {
      const warmup = new SpeechSynthesisUtterance(".");
      warmup.volume = 0.01;
      warmup.rate = 2.0;
      window.speechSynthesis.speak(warmup);
    } catch (e) {}
  }

  // Precargar y decodificar audios del elemento activo
  const currentWord = state.words[state.currentIndex];
  preloadWordAudios(currentWord);

  const countdownMessages = {
    3: "¡Preparados...! 👀",
    2: "¡Atentos...! 👂",
    1: "¡Listos...! 🚀"
  };

  for (let sec = state.countdownSeconds; sec >= 1; sec--) {
    if (!state.isPlayingSequence) {
      overlay.classList.remove("show");
      return false;
    }

    numEl.textContent = sec;
    numEl.style.animation = "none";
    void numEl.offsetHeight; // Forzar reflow para reiniciar animación CSS
    numEl.style.animation = "countdownPop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)";

    if (labelEl) {
      labelEl.textContent = countdownMessages[sec] || "¡Listos...! 🚀";
    }

    // Pulso sutil táctil y auditivo para anticipar el compás
    triggerHaptic([35], "Cuenta Regresiva");
    playHarmonicCue("normal");

    await new Promise(r => {
      state.countdownTimeout = setTimeout(r, 900);
    });
  }

  if (labelEl) labelEl.textContent = "¡Empieza! ✨";
  await new Promise(r => setTimeout(r, 220));

  overlay.classList.remove("show");
  return true;
}

async function playFullSequence() {
  if (state.isPlayingSequence) {
    stopSequence();
    return;
  }

  state.isPlayingSequence = true;
  updatePlayButton(true);

  // Ejecutar cuenta regresiva preparatoria para enfocar al niño y orientador
  const ready = await runPreparationCountdown();
  if (!ready || !state.isPlayingSequence) {
    stopSequence();
    return;
  }

  const currentWord = state.words[state.currentIndex];
  const syllables = parseWordPattern(currentWord.raw);

  const delay = (ms) => new Promise(resolve => {
    state.sequenceTimeout = setTimeout(resolve, ms);
  });

  for (let i = 0; i < syllables.length; i++) {
    if (!state.isPlayingSequence) break;

    const syl = syllables[i];
    await activateSyllable(syl, i, currentWord);

    if (i < syllables.length - 1) {
      await delay(state.pauseBetweenSyllables);
    }
  }

  // Final: Resaltar pictograma y pronunciar la palabra completa
  if (state.isPlayingSequence) {
    await delay(350);

    const picBox = document.getElementById("pictogram-box");
    const onWordAudioStart = () => {
      if (picBox) picBox.classList.add("active-glow");
      triggerHaptic([180, 50, 180, 50, 280], "Palabra Completa", 740);
    };

    await playFullWordAudio(currentWord, onWordAudioStart);

    if (picBox) picBox.classList.remove("active-glow");
    triggerConfetti();
  }

  stopSequence();
}

function stopSequence() {
  state.isPlayingSequence = false;
  if (state.sequenceTimeout) {
    clearTimeout(state.sequenceTimeout);
    state.sequenceTimeout = null;
  }
  if (state.countdownTimeout) {
    clearTimeout(state.countdownTimeout);
    state.countdownTimeout = null;
  }
  const overlay = document.getElementById("countdown-overlay");
  if (overlay) overlay.classList.remove("show");

  stopAllAudio();

  const allPills = document.querySelectorAll(".syllable-pill");
  allPills.forEach(p => p.classList.remove("active"));

  const picBox = document.getElementById("pictogram-box");
  if (picBox) picBox.classList.remove("active-glow");

  updatePlayButton(false);
}

function updatePlayButton(isPlaying) {
  const btn = document.getElementById("btn-play-all");
  const icon = document.getElementById("play-icon");
  const text = document.getElementById("play-text");

  if (!btn || !icon || !text) return;

  if (isPlaying) {
    btn.classList.add("playing");
    icon.textContent = "⏹";
    text.textContent = "Detener";
  } else {
    btn.classList.remove("playing");
    icon.textContent = "▶";
    text.textContent = "Escuchar y Sentir";
  }
}

function updateAudioModeUI() {
  const btnAudioMode = document.getElementById("btn-audio-mode");
  const icon = document.getElementById("audio-mode-icon");
  const text = document.getElementById("audio-mode-text");
  const select = document.getElementById("audio-mode-select");

  const mode = state.audioMode;

  if (btnAudioMode) {
    btnAudioMode.classList.toggle("tts-mode", mode === "tts");
    btnAudioMode.classList.toggle("edge-mode", mode === "edge");
  }
  if (icon) {
    icon.textContent = mode === "hd" ? "🎧" : mode === "edge" ? "⚡" : "🤖";
  }
  if (text) {
    text.textContent = mode === "hd" ? "HD" : mode === "edge" ? "Edge" : "TTS";
  }
  if (select && select.value !== mode) {
    select.value = mode;
  }
}

// ==========================================
// 9. EFECTO CELEBRATORIO (CONFETTI)
// ==========================================

function triggerConfetti() {
  const colors = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
  const container = document.body;

  for (let i = 0; i < 24; i++) {
    const p = document.createElement("div");
    p.className = "confetti-particle";
    p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    p.style.left = `${Math.random() * 80 + 10}vw`;
    p.style.top = `${Math.random() * 30 + 20}vh`;
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    container.appendChild(p);

    setTimeout(() => {
      p.remove();
    }, 1300);
  }
}

// ==========================================
// 10. BÚSQUEDA EN ARASAAC API
// ==========================================

async function searchArasaac(term) {
  const cleanTerm = term.trim().toLowerCase();
  const url = `https://api.arasaac.org/api/pictograms/es/search/${encodeURIComponent(cleanTerm)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("No se pudo conectar con ARASAAC");
  }

  const results = await response.json();
  if (Array.isArray(results) && results.length > 0) {
    return results[0]._id;
  }
  return null;
}

function saveSettings() {
  localStorage.setItem("fonemasens_countdown_seconds", state.countdownSeconds.toString());
  localStorage.setItem("fonemasens_vibe_intensity", state.vibeIntensity);
  localStorage.setItem("fonemasens_audio_mode", state.audioMode);
  localStorage.setItem("fonemasens_speech_rate", state.speechRate.toString());
  localStorage.setItem("fonemasens_pause_between", state.pauseBetweenSyllables.toString());
  localStorage.setItem("fonemasens_edge_voice", state.edgeVoiceName || "es-ES-ElviraNeural");
  localStorage.setItem("fonemasens_edge_endpoint", state.edgeEndpoint || "/api/tts");
}

function loadSettings() {
  const savedCountdown = localStorage.getItem("fonemasens_countdown_seconds");
  if (savedCountdown !== null) {
    state.countdownSeconds = parseInt(savedCountdown, 10);
  }

  const savedVibe = localStorage.getItem("fonemasens_vibe_intensity");
  if (savedVibe) {
    state.vibeIntensity = savedVibe;
  }

  const savedMode = localStorage.getItem("fonemasens_audio_mode");
  if (savedMode) {
    state.audioMode = savedMode;
  }

  const savedRate = localStorage.getItem("fonemasens_speech_rate");
  if (savedRate) {
    state.speechRate = parseFloat(savedRate);
  }

  const savedPause = localStorage.getItem("fonemasens_pause_between");
  if (savedPause) {
    state.pauseBetweenSyllables = parseInt(savedPause, 10);
  }

  const savedVoice = localStorage.getItem("fonemasens_edge_voice");
  if (savedVoice) {
    state.edgeVoiceName = savedVoice;
  }

  const savedEndpoint = localStorage.getItem("fonemasens_edge_endpoint");
  if (savedEndpoint) {
    state.edgeEndpoint = savedEndpoint;
  }
}

// ==========================================
// 11. INICIALIZACIÓN Y EVENTOS
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  loadWordList();
  renderShelf();
  renderActiveWord();
  updateAudioModeUI();

  // Primer gesto táctil del usuario desbloquea AudioContext y precarga audios en memoria
  const unlockAudioOnGesture = () => {
    initAudioContext();
    preloadWordAudios(state.words[state.currentIndex]);
    window.removeEventListener("pointerdown", unlockAudioOnGesture);
    window.removeEventListener("keydown", unlockAudioOnGesture);
  };
  window.addEventListener("pointerdown", unlockAudioOnGesture, { once: true });
  window.addEventListener("keydown", unlockAudioOnGesture, { once: true });

  loadVoices();
  if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  // Botón rápido en cabecera: Alternar Audio HD / Edge-TTS / TTS Local
  const btnAudioMode = document.getElementById("btn-audio-mode");
  if (btnAudioMode) {
    btnAudioMode.addEventListener("click", () => {
      if (state.audioMode === "hd") {
        state.audioMode = "edge";
      } else if (state.audioMode === "edge") {
        state.audioMode = "tts";
      } else {
        state.audioMode = "hd";
      }
      updateAudioModeUI();
      saveSettings();
      const label = state.audioMode === "hd" ? "Modo Audio HD" : state.audioMode === "edge" ? "Modo Edge-TTS Neuronal" : "Modo TTS Local";
      triggerHaptic([60], label);
    });
  }

  // Selector en modal
  const audioModeSelect = document.getElementById("audio-mode-select");
  if (audioModeSelect) {
    audioModeSelect.addEventListener("change", (e) => {
      state.audioMode = e.target.value;
      updateAudioModeUI();
      saveSettings();
    });
  }

  // Pruebas Fonéticas (ZA, NA, JU, RRA, CHA*)
  const btnTestZa = document.getElementById("btn-test-za");
  const btnTestNa = document.getElementById("btn-test-na");
  const btnTestJu = document.getElementById("btn-test-ju");
  const btnTestRra = document.getElementById("btn-test-rra");
  const btnTestCha = document.getElementById("btn-test-cha");
  const testMsg = document.getElementById("phonetic-test-msg");

  const runPhoneticTest = async (token, type, hdClip) => {
    initAudioContext();
    if (testMsg) {
      testMsg.textContent = `Reproduciendo "${token}" en modo ${state.audioMode.toUpperCase()}...`;
      testMsg.style.color = "#4f46e5";
    }

    const syl = {
      cleanText: token.replace(/\*/g, "").toLowerCase(),
      type: type,
      pitch: type === "stressed" ? 1.35 : (type === "sustained" ? 1.2 : 1.0),
      rateMultiplier: type === "sustained" ? 0.55 : 1.0,
      vibePattern: type === "sustained" ? [380, 50, 240] : (type === "stressed" ? [220, 40, 100] : [140]),
      typeLabel: type === "sustained" ? "Sostenida (*)" : (type === "stressed" ? "Acentuada" : "Átona")
    };

    const onAudioStart = () => {
      triggerHaptic(syl.vibePattern, syl.typeLabel);
      playHarmonicCue(syl.type);
    };

    if (state.audioMode === "hd") {
      let clip = hdClip;
      if (!clip) {
        clip = getHDSyllableClip(syl, null, 0);
      }
      if (clip) {
        await playAudioClip(clip, onAudioStart);
      } else {
        await speakSyllableTTS(syl, onAudioStart);
      }
    } else if (state.audioMode === "edge") {
      try {
        const buffer = await synthesizeWithEdgeTTS(syl.cleanText, syl.type);
        if (buffer) {
          await playDecodedAudioBuffer(buffer, onAudioStart);
        } else {
          await speakSyllableTTS(syl, onAudioStart);
        }
      } catch (e) {
        await speakSyllableTTS(syl, onAudioStart);
      }
    } else {
      await speakSyllableTTS(syl, onAudioStart);
    }

    if (testMsg) {
      testMsg.textContent = `✅ "${token}" articulado claramente sin deletreo, sin 'sodio' y con vibrante múltiple.`;
      testMsg.style.color = "#16a34a";
    }
  };

  if (btnTestZa) {
    btnTestZa.addEventListener("click", () => runPhoneticTest("ZA", "stressed", "audio/syl_za_stressed.mp3"));
  }
  if (btnTestNa) {
    btnTestNa.addEventListener("click", () => runPhoneticTest("na", "normal", "audio/syl_na.mp3"));
  }
  if (btnTestJu) {
    btnTestJu.addEventListener("click", () => runPhoneticTest("ju", "normal", "audio/syl_ju.mp3"));
  }
  if (btnTestRra) {
    btnTestRra.addEventListener("click", () => runPhoneticTest("rra", "stressed", "audio/syl_rra_stressed.mp3"));
  }
  if (btnTestCha) {
    btnTestCha.addEventListener("click", () => runPhoneticTest("CHA*", "sustained", "audio/syl_cha_sustained.mp3"));
  }

  // Botones de Navegación de Palabra
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");

  if (btnPrev) {
    btnPrev.addEventListener("click", () => {
      stopSequence();
      state.currentIndex = (state.currentIndex - 1 + state.words.length) % state.words.length;
      renderActiveWord();
      renderShelf();
    });
  }

  if (btnNext) {
    btnNext.addEventListener("click", () => {
      stopSequence();
      state.currentIndex = (state.currentIndex + 1) % state.words.length;
      renderActiveWord();
      renderShelf();
    });
  }

  // Botón Principal: Escuchar y Sentir
  const btnPlayAll = document.getElementById("btn-play-all");
  if (btnPlayAll) {
    btnPlayAll.addEventListener("click", () => {
      initAudioContext();
      playFullSequence();
    });
  }

  // Botones Secundarios
  const btnRepeat = document.getElementById("btn-repeat-word");
  if (btnRepeat) {
    btnRepeat.addEventListener("click", () => {
      initAudioContext();
      const currentRateBackup = state.speechRate;
      state.speechRate = Math.max(0.55, currentRateBackup * 0.75);
      playFullSequence().then(() => {
        state.speechRate = currentRateBackup;
      });
    });
  }

  const btnNatural = document.getElementById("btn-natural-speech");
  if (btnNatural) {
    btnNatural.addEventListener("click", () => {
      initAudioContext();
      stopSequence();
      const currentWord = state.words[state.currentIndex];
      triggerHaptic([120], "Palabra Completa", 150);
      playFullWordAudio(currentWord);
    });
  }

  // Controles de Cabecera (Sonido / Vibración)
  const btnSoundToggle = document.getElementById("btn-sound-toggle");
  const soundIcon = document.getElementById("sound-icon");
  if (btnSoundToggle) {
    btnSoundToggle.addEventListener("click", () => {
      state.soundEnabled = !state.soundEnabled;
      btnSoundToggle.classList.toggle("muted", !state.soundEnabled);
      if (soundIcon) soundIcon.textContent = state.soundEnabled ? "🔊" : "🔇";
      if (!state.soundEnabled) {
        stopAllAudio();
      }
    });
  }

  const btnVibeToggle = document.getElementById("btn-vibrate-toggle");
  if (btnVibeToggle) {
    btnVibeToggle.addEventListener("click", () => {
      state.vibrationEnabled = !state.vibrationEnabled;
      btnVibeToggle.classList.toggle("muted", !state.vibrationEnabled);
      if (state.vibrationEnabled) {
        triggerHaptic([150], "Prueba de Vibración");
      }
    });
  }

  // Modal de Ajustes
  const settingsModal = document.getElementById("settings-modal");
  const btnOpenSettings = document.getElementById("btn-open-settings");
  const btnCloseSettings = document.getElementById("btn-close-settings");
  const btnSaveSettings = document.getElementById("btn-save-settings");

  const voiceSelect = document.getElementById("voice-select");
  const speedSlider = document.getElementById("speed-slider");
  const speedVal = document.getElementById("speed-val");
  const pauseSlider = document.getElementById("pause-slider");
  const pauseVal = document.getElementById("pause-val");
  const toneToggle = document.getElementById("tone-toggle");
  const countdownSelect = document.getElementById("countdown-select");
  const vibeIntensitySelect = document.getElementById("vibe-intensity-select");

  if (btnOpenSettings && settingsModal) {
    btnOpenSettings.addEventListener("click", () => {
      settingsModal.classList.add("open");
      updateAudioModeUI();
      const vibeMsg = document.getElementById("vibe-compatibility-msg");
      if (vibeMsg) {
        if ("vibrate" in navigator) {
          vibeMsg.textContent = "✅ Tu navegador y dispositivo soportan la API háptica de vibración.";
          vibeMsg.style.color = "#16a34a";
        } else {
          vibeMsg.textContent = "ℹ️ Vibración simulada visualmente en pantalla (el dispositivo no expone motor físico).";
          vibeMsg.style.color = "#d97706";
        }
      }
    });
  }

  // Cargar valores iniciales en los controles
  if (countdownSelect) countdownSelect.value = state.countdownSeconds.toString();
  if (vibeIntensitySelect) vibeIntensitySelect.value = state.vibeIntensity;
  if (speedSlider) {
    speedSlider.value = state.speechRate;
    if (speedVal) speedVal.textContent = `${state.speechRate.toFixed(2)}x`;
  }
  if (pauseSlider) {
    pauseSlider.value = state.pauseBetweenSyllables;
    if (pauseVal) pauseVal.textContent = `${state.pauseBetweenSyllables} ms`;
  }

  // Controles de Edge-TTS en Modal
  const selectEdgeVoice = document.getElementById("select-edge-voice");
  const inputEdgeEndpoint = document.getElementById("input-edge-endpoint");
  const btnTestEdgeTts = document.getElementById("btn-test-edge-tts");
  const edgeTtsStatus = document.getElementById("edge-tts-status");

  if (selectEdgeVoice) {
    selectEdgeVoice.value = state.edgeVoiceName || "es-ES-ElviraNeural";
    selectEdgeVoice.addEventListener("change", (e) => {
      state.edgeVoiceName = e.target.value;
      saveSettings();
    });
  }

  if (inputEdgeEndpoint) {
    const defaultEndpoint = window.location.hostname.includes("github.io")
      ? "https://web-app-fros4.vercel.app/api/tts"
      : "/api/tts";
    inputEdgeEndpoint.value = state.edgeEndpoint || defaultEndpoint;
    inputEdgeEndpoint.placeholder = defaultEndpoint;
    inputEdgeEndpoint.addEventListener("input", (e) => {
      state.edgeEndpoint = e.target.value.trim() || defaultEndpoint;
      saveSettings();
    });
  }

  if (btnTestEdgeTts) {
    btnTestEdgeTts.addEventListener("click", async () => {
      if (edgeTtsStatus) {
        edgeTtsStatus.textContent = "⏳ Conectando con Edge-TTS...";
        edgeTtsStatus.style.color = "#4f46e5";
      }

      try {
        initAudioContext();
        const buffer = await synthesizeWithEdgeTTS("rra", "stressed");
        if (buffer) {
          triggerHaptic([220, 40, 100], "Prueba Edge-TTS");
          await playDecodedAudioBuffer(buffer);
          if (edgeTtsStatus) {
            edgeTtsStatus.textContent = `✅ ¡Éxito! "rra" sintetizado con ${state.edgeVoiceName}.`;
            edgeTtsStatus.style.color = "#16a34a";
          }
        }
      } catch (err) {
        console.error("Error en prueba Edge-TTS:", err);
        if (edgeTtsStatus) {
          const isFetchErr = err && (err.message || "").includes("Failed to fetch");
          if (isFetchErr) {
            edgeTtsStatus.innerHTML = `❌ <strong>Failed to fetch:</strong> Vercel tiene activada la protección privada ("Vercel Authentication").<br><span style="font-size:0.75rem; color:#475569;">Desactiva "Vercel Authentication" en Settings &gt; Deployment Protection de tu proyecto Vercel para permitir acceso público.</span>`;
          } else {
            edgeTtsStatus.textContent = `❌ ${err.message || "Error al conectar"}`;
          }
          edgeTtsStatus.style.color = "#dc2626";
        }
      }
    });
  }

  const closeModal = () => {
    if (settingsModal) settingsModal.classList.remove("open");
    saveSettings();
  };
  if (btnCloseSettings) btnCloseSettings.addEventListener("click", closeModal);
  if (btnSaveSettings) btnSaveSettings.addEventListener("click", closeModal);

  if (voiceSelect) {
    voiceSelect.addEventListener("change", (e) => {
      const vName = e.target.value;
      state.selectedVoice = state.spanishVoices.find(v => v.name === vName) || null;
    });
  }

  if (speedSlider && speedVal) {
    speedSlider.addEventListener("input", (e) => {
      state.speechRate = parseFloat(e.target.value);
      speedVal.textContent = `${state.speechRate.toFixed(2)}x`;
      saveSettings();
    });
  }

  if (pauseSlider && pauseVal) {
    pauseSlider.addEventListener("input", (e) => {
      state.pauseBetweenSyllables = parseInt(e.target.value, 10);
      pauseVal.textContent = `${state.pauseBetweenSyllables} ms`;
      saveSettings();
    });
  }

  if (toneToggle) {
    toneToggle.addEventListener("change", (e) => {
      state.harmonicToneEnabled = e.target.checked;
    });
  }

  // Selector de Cuenta Regresiva
  if (countdownSelect) {
    countdownSelect.value = state.countdownSeconds.toString();
    countdownSelect.addEventListener("change", (e) => {
      state.countdownSeconds = parseInt(e.target.value, 10);
      saveSettings();
    });
  }

  // Selector de Potencia Háptica
  if (vibeIntensitySelect) {
    vibeIntensitySelect.value = state.vibeIntensity;
    vibeIntensitySelect.addEventListener("change", (e) => {
      state.vibeIntensity = e.target.value;
      saveSettings();
      triggerHaptic([220, 40, 100], `Potencia ${state.vibeIntensity.toUpperCase()}`);
    });
  }

  // Pruebas de Vibración en el modal
  const testVibeBtns = document.querySelectorAll(".test-vibe-btn");
  testVibeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const mode = btn.getAttribute("data-vibe");
      if (mode === "normal") {
        triggerHaptic([140], "Átona Nítida", 140);
        playHarmonicCue("normal");
      } else if (mode === "stressed") {
        triggerHaptic([220, 40, 100], "Acentuada Fuerte", 360);
        playHarmonicCue("stressed");
      } else if (mode === "sustained") {
        triggerHaptic([380, 50, 240], "Sostenida (*)", 670);
        playHarmonicCue("sustained");
      }
    });
  });

  // Modal para Añadir Nueva Palabra
  const addWordModal = document.getElementById("add-word-modal");
  const btnOpenAddWord = document.getElementById("btn-add-word-modal");
  const btnCloseAddWord = document.getElementById("btn-close-add-word");
  const btnCancelAdd = document.getElementById("btn-cancel-add");
  const btnSaveWord = document.getElementById("btn-save-word");
  const inputPattern = document.getElementById("input-word-pattern");
  const inputSearch = document.getElementById("input-search-term");
  const feedback = document.getElementById("add-word-feedback");

  if (btnOpenAddWord && addWordModal) {
    btnOpenAddWord.addEventListener("click", () => {
      addWordModal.classList.add("open");
      if (inputPattern) inputPattern.value = "";
      if (inputSearch) inputSearch.value = "";
      if (feedback) feedback.style.display = "none";
    });
  }

  const closeAddModal = () => addWordModal && addWordModal.classList.remove("open");
  if (btnCloseAddWord) btnCloseAddWord.addEventListener("click", closeAddModal);
  if (btnCancelAdd) btnCancelAdd.addEventListener("click", closeAddModal);

  if (btnSaveWord) {
    btnSaveWord.addEventListener("click", async () => {
      const pattern = inputPattern ? inputPattern.value.trim() : "";
      if (!pattern || !pattern.includes("-")) {
        if (feedback) {
          feedback.className = "feedback-msg error";
          feedback.textContent = "Por favor ingresa la palabra separando las sílabas con guiones (ej. PLA-ta-no).";
          feedback.style.display = "block";
        }
        return;
      }

      const cleanWord = pattern.replace(/-/g, "").replace(/\*/g, "");
      const searchTerm = (inputSearch && inputSearch.value.trim()) ? inputSearch.value.trim() : cleanWord;

      btnSaveWord.disabled = true;
      btnSaveWord.textContent = "Buscando en ARASAAC...";

      try {
        let arasaacId = await searchArasaac(searchTerm);

        const newWordObj = {
          raw: pattern,
          clean: cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase(),
          searchTerm: searchTerm,
          arasaacId: arasaacId || 2339
        };

        state.words.push(newWordObj);
        saveWordList();
        state.currentIndex = state.words.length - 1;

        renderShelf();
        renderActiveWord();
        closeAddModal();
        triggerConfetti();
      } catch (err) {
        if (feedback) {
          feedback.className = "feedback-msg error";
          feedback.textContent = "No se pudo conectar a ARASAAC. Se guardó con imagen predeterminada.";
          feedback.style.display = "block";
        }
        const newWordObj = {
          raw: pattern,
          clean: cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase(),
          searchTerm: searchTerm,
          arasaacId: 2339
        };
        state.words.push(newWordObj);
        saveWordList();
        state.currentIndex = state.words.length - 1;
        renderShelf();
        renderActiveWord();
        setTimeout(closeAddModal, 1500);
      } finally {
        btnSaveWord.disabled = false;
        btnSaveWord.textContent = "Buscar Pictograma y Guardar";
      }
    });
  }

  // Modal de Edición de Palabra
  const editWordModal = document.getElementById("edit-word-modal");
  const btnOpenEditWord = document.getElementById("btn-edit-current-word");
  const btnCloseEditWord = document.getElementById("btn-close-edit-word");
  const btnCancelEdit = document.getElementById("btn-cancel-edit");
  const btnSaveEditWord = document.getElementById("btn-save-edit-word");
  const editPattern = document.getElementById("edit-word-pattern");
  const editSearch = document.getElementById("edit-search-term");
  const editFeedback = document.getElementById("edit-word-feedback");

  if (btnOpenEditWord && editWordModal) {
    btnOpenEditWord.addEventListener("click", () => {
      const current = state.words[state.currentIndex];
      if (!current) return;

      editWordModal.classList.add("open");
      if (editPattern) editPattern.value = current.raw;
      if (editSearch) editSearch.value = current.searchTerm || current.clean;
      if (editFeedback) editFeedback.style.display = "none";
    });
  }

  const closeEditModal = () => editWordModal && editWordModal.classList.remove("open");
  if (btnCloseEditWord) btnCloseEditWord.addEventListener("click", closeEditModal);
  if (btnCancelEdit) btnCancelEdit.addEventListener("click", closeEditModal);

  if (btnSaveEditWord) {
    btnSaveEditWord.addEventListener("click", async () => {
      const pattern = editPattern ? editPattern.value.trim() : "";
      if (!pattern || !pattern.includes("-")) {
        if (editFeedback) {
          editFeedback.className = "feedback-msg error";
          editFeedback.textContent = "Por favor ingresa la palabra separando las sílabas con guiones (ej. ju-GUE-te).";
          editFeedback.style.display = "block";
        }
        return;
      }

      const cleanWord = pattern.replace(/-/g, "").replace(/\*/g, "");
      const searchTerm = (editSearch && editSearch.value.trim()) ? editSearch.value.trim() : cleanWord;
      const current = state.words[state.currentIndex];

      btnSaveEditWord.disabled = true;
      btnSaveEditWord.textContent = "Guardando cambios...";

      try {
        let arasaacId = current.arasaacId;
        if (searchTerm.toLowerCase() !== (current.searchTerm || "").toLowerCase()) {
          const newId = await searchArasaac(searchTerm);
          if (newId) arasaacId = newId;
        }

        current.raw = pattern;
        current.clean = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase();
        current.searchTerm = searchTerm;
        current.arasaacId = arasaacId;
        // Si se modificó una palabra del prototipo, retirar el clip fijo para que refleje los cambios fonéticos
        if (current.audio) {
          delete current.audio;
        }

        saveWordList();
        renderActiveWord();
        renderShelf();
        closeEditModal();
        triggerConfetti();
      } catch (err) {
        current.raw = pattern;
        current.clean = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase();
        current.searchTerm = searchTerm;
        saveWordList();
        renderActiveWord();
        renderShelf();
        closeEditModal();
      } finally {
        btnSaveEditWord.disabled = false;
        btnSaveEditWord.textContent = "Guardar Cambios";
      }
    });
  }

  // Modal de Eliminación de Palabra
  const deleteConfirmModal = document.getElementById("delete-confirm-modal");
  const btnOpenDeleteWord = document.getElementById("btn-delete-current-word");
  const btnCloseDeleteModal = document.getElementById("btn-close-delete-modal");
  const btnCancelDelete = document.getElementById("btn-cancel-delete");
  const btnConfirmDelete = document.getElementById("btn-confirm-delete");
  const deleteTargetName = document.getElementById("delete-word-target-name");

  if (btnOpenDeleteWord && deleteConfirmModal) {
    btnOpenDeleteWord.addEventListener("click", () => {
      const current = state.words[state.currentIndex];
      if (!current) return;
      deleteConfirmModal.classList.add("open");
      if (deleteTargetName) deleteTargetName.textContent = `"${current.clean}"`;
    });
  }

  const closeDeleteModal = () => deleteConfirmModal && deleteConfirmModal.classList.remove("open");
  if (btnCloseDeleteModal) btnCloseDeleteModal.addEventListener("click", closeDeleteModal);
  if (btnCancelDelete) btnCancelDelete.addEventListener("click", closeDeleteModal);

  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener("click", () => {
      if (state.words.length <= 1) {
        state.words = JSON.parse(JSON.stringify(INITIAL_WORDS));
        state.currentIndex = 0;
      } else {
        state.words.splice(state.currentIndex, 1);
        state.currentIndex = Math.max(0, Math.min(state.currentIndex, state.words.length - 1));
      }
      saveWordList();
      closeDeleteModal();
      renderShelf();
      renderActiveWord();
      triggerHaptic([140, 40, 100], "Palabra Eliminada");
    });
  }

  // Botón Restaurar Palabras Iniciales
  const btnResetWords = document.getElementById("btn-reset-words");
  if (btnResetWords) {
    btnResetWords.addEventListener("click", () => {
      if (confirm("¿Deseas restaurar la colección a las 6 palabras prototipo iniciales?")) {
        state.words = JSON.parse(JSON.stringify(INITIAL_WORDS));
        state.currentIndex = 0;
        saveWordList();
        renderShelf();
        renderActiveWord();
        triggerHaptic([180, 40, 180], "Colección Restaurada");
        triggerConfetti();
      }
    });
  }

  // Inicialización del Modo Pares Mínimos
  initModeTabs();
  initMinimalPairs();

  // Registro de Service Worker para PWA (Instalable en Android)
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch((err) => {
        console.log("Nota sobre Service Worker:", err);
      });
    });
  }
});

// =========================================================================
// 12. SISTEMA DE PARES MÍNIMOS (CONTRASTACIÓN MULTISENSORIAL FONÉMICA)
// =========================================================================

/**
 * Banco de datos de Pares Mínimos Clínicos para discriminación fonológica.
 * Sigue la especificación técnica del Punto 3:
 * - Sílaba Diana (cambiante): patrón háptico dinámico y exclusivo según el fonema.
 * - Sílaba Base (compartida): patrón háptico estándar neutro uniforme ([50ms]).
 */
const MINIMAL_PAIRS_DATA = [
  {
    id: "casa-taza",
    title: "CASA vs TAZA",
    contrastBadge: "/k/ vs /t/",
    contrastDesc: "Punto de Articulación: Oclusiva Velar /k/ vs Oclusiva Dental /t/",
    targetSyllableIndex: 0,
    hapticSignature: {
      targetA: "CA: Doble pulso percusivo seco ([140, 40, 90] ms) - Oclusión velar sorda explosiva",
      targetB: "TA: Chasquido dental corto y agudo ([50, 40, 50, 40, 50] ms) - Oclusión dental de alta frecuencia",
      shared: "sa / za: Pulso rítmico suave idéntico ([50] ms) - Base neutra no diferenciadora"
    },
    wordA: {
      name: "CASA",
      arasaacId: 2317,
      audioFull: "audio/word_casa.mp3",
      syllables: [
        {
          text: "CA",
          isTarget: true,
          audio: "audio/syl_ca_stressed.mp3",
          vibePattern: [140, 40, 90],
          vibeLabel: "Oclusión Velar /k/",
          targetClass: "type-target-a"
        },
        {
          text: "sa",
          isTarget: false,
          audio: "audio/syl_sa.mp3",
          vibePattern: [50],
          vibeLabel: "Sílaba Neutra Base",
          targetClass: "type-shared"
        }
      ]
    },
    wordB: {
      name: "TAZA",
      arasaacId: 2582,
      audioFull: "audio/word_taza.mp3",
      syllables: [
        {
          text: "TA",
          isTarget: true,
          audio: "audio/syl_ta_stressed.mp3",
          vibePattern: [50, 40, 50, 40, 50],
          vibeLabel: "Oclusión Dental /t/",
          targetClass: "type-target-b"
        },
        {
          text: "za",
          isTarget: false,
          audio: "audio/syl_za.mp3",
          vibePattern: [50],
          vibeLabel: "Sílaba Neutra Base",
          targetClass: "type-shared"
        }
      ]
    }
  },
  {
    id: "pato-gato",
    title: "PATO vs GATO",
    contrastBadge: "/p/ vs /g/",
    contrastDesc: "Sonoridad y Punto: Bilabial Sorda /p/ vs Velar Sonora /g/",
    targetSyllableIndex: 0,
    hapticSignature: {
      targetA: "PA: Golpe seco y explosivo ([170] ms) - Oclusión bilabial sorda sin vibración cordal",
      targetB: "GA: Onda grave continua y resonante ([70, 40, 150] ms) - Sonoridad laríngea sostenida",
      shared: "to: Pulso rítmico suave idéntico ([50] ms) - Base neutra compartida"
    },
    wordA: {
      name: "PATO",
      arasaacId: 2563,
      audioFull: "audio/word_pato.mp3",
      syllables: [
        {
          text: "PA",
          isTarget: true,
          audio: "audio/syl_pa_stressed.mp3",
          vibePattern: [170],
          vibeLabel: "Explosión Bilabial /p/",
          targetClass: "type-target-a"
        },
        {
          text: "to",
          isTarget: false,
          audio: "audio/syl_to.mp3",
          vibePattern: [50],
          vibeLabel: "Sílaba Neutra Base",
          targetClass: "type-shared"
        }
      ]
    },
    wordB: {
      name: "GATO",
      arasaacId: 2406,
      audioFull: "audio/word_gato.mp3",
      syllables: [
        {
          text: "GA",
          isTarget: true,
          audio: "audio/syl_ga_stressed.mp3",
          vibePattern: [70, 40, 150],
          vibeLabel: "Resonancia Velar /g/",
          targetClass: "type-target-b"
        },
        {
          text: "to",
          isTarget: false,
          audio: "audio/syl_to.mp3",
          vibePattern: [50],
          vibeLabel: "Sílaba Neutra Base",
          targetClass: "type-shared"
        }
      ]
    }
  },
  {
    id: "jamon-jabon",
    title: "JAMÓN vs JABÓN",
    contrastBadge: "/m/ vs /b/",
    contrastDesc: "Modo de Articulación en 2ª Sílaba: Nasal Sonora /m/ vs Oclusiva Sonora /b/",
    targetSyllableIndex: 1, // Diana en la segunda sílaba
    hapticSignature: {
      targetA: "MÓN: Zumbido resonante de cavidad nasal ([100, 40, 100] ms) - Resonancia continua",
      targetB: "BÓN: Pulso elástico pleno y percutivo ([230] ms) - Explosión bilabial plena",
      shared: "ja: Pulso rítmico suave idéntico ([50] ms) - Base inicial idéntica"
    },
    wordA: {
      name: "JAMÓN",
      arasaacId: 2433,
      audioFull: "audio/word_jamon.mp3",
      syllables: [
        {
          text: "ja",
          isTarget: false,
          audio: "audio/syl_ja.mp3",
          vibePattern: [50],
          vibeLabel: "Sílaba Neutra Base",
          targetClass: "type-shared"
        },
        {
          text: "MÓN",
          isTarget: true,
          audio: "audio/syl_mon_stressed.mp3",
          vibePattern: [100, 40, 100],
          vibeLabel: "Resonancia Nasal /m/",
          targetClass: "type-target-a"
        }
      ]
    },
    wordB: {
      name: "JABÓN",
      arasaacId: 2964,
      audioFull: "audio/word_jabon.mp3",
      syllables: [
        {
          text: "ja",
          isTarget: false,
          audio: "audio/syl_ja.mp3",
          vibePattern: [50],
          vibeLabel: "Sílaba Neutra Base",
          targetClass: "type-shared"
        },
        {
          text: "BÓN",
          isTarget: true,
          audio: "audio/syl_bon_stressed.mp3",
          vibePattern: [230],
          vibeLabel: "Oclusión Bilabial /b/",
          targetClass: "type-target-b"
        }
      ]
    }
  },
  {
    id: "pino-vino",
    title: "PINO vs VINO",
    contrastBadge: "/p/ vs /v/",
    contrastDesc: "Modo y Sonoridad: Oclusiva Sorda /p/ vs Fricativa Sonora /v/",
    targetSyllableIndex: 0,
    hapticSignature: {
      targetA: "PI: Impulso seco de alta amplitud ([160] ms) - Oclusión percutiva sin cuerda vocal",
      targetB: "VI: Rampa de vibración continua y suave ([40, 25, 70, 25, 120] ms) - Fricción sonora ondulante",
      shared: "no: Pulso estándar neutro uniforme ([50] ms) - Marca el ritmo silábico sin distraer"
    },
    wordA: {
      name: "PINO",
      arasaacId: 3216,
      audioFull: "audio/word_pino.mp3",
      syllables: [
        {
          text: "PI",
          isTarget: true,
          audio: "audio/syl_pi_stressed.mp3",
          vibePattern: [160],
          vibeLabel: "Oclusiva Sorda /p/",
          targetClass: "type-target-a"
        },
        {
          text: "no",
          isTarget: false,
          audio: "audio/syl_no.mp3",
          vibePattern: [50],
          vibeLabel: "Sílaba Neutra Base",
          targetClass: "type-shared"
        }
      ]
    },
    wordB: {
      name: "VINO",
      arasaacId: 2614,
      audioFull: "audio/word_vino.mp3",
      syllables: [
        {
          text: "VI",
          isTarget: true,
          audio: "audio/syl_vi_stressed.mp3",
          vibePattern: [40, 25, 70, 25, 120],
          vibeLabel: "Fricativa Sonora /v/",
          targetClass: "type-target-b"
        },
        {
          text: "no",
          isTarget: false,
          audio: "audio/syl_no.mp3",
          vibePattern: [50],
          vibeLabel: "Sílaba Neutra Base",
          targetClass: "type-shared"
        }
      ]
    }
  }
];

/**
 * Inicializa las pestañas de navegación de modos:
 * - Segmentación Silábica (Modo estándar)
 * - Pares Mínimos (Nuevo modo de discriminación)
 */
function initModeTabs() {
  const tabSyllables = document.getElementById("tab-btn-syllables");
  const tabPairs = document.getElementById("tab-btn-pairs");
  const viewSyllables = document.getElementById("view-syllables-mode");
  const viewPairs = document.getElementById("view-pairs-mode");

  if (!tabSyllables || !tabPairs || !viewSyllables || !viewPairs) return;

  const switchMode = (mode) => {
    state.currentAppMode = mode;
    stopSequence();
    stopPairSequence();

    if (mode === "syllables") {
      tabSyllables.classList.add("active");
      tabSyllables.setAttribute("aria-selected", "true");
      tabPairs.classList.remove("active");
      tabPairs.setAttribute("aria-selected", "false");

      viewSyllables.style.display = "block";
      viewSyllables.classList.add("active");
      viewPairs.style.display = "none";
      viewPairs.classList.remove("active");

      triggerHaptic([40], "Modo Segmentación");
    } else {
      tabPairs.classList.add("active");
      tabPairs.setAttribute("aria-selected", "true");
      tabSyllables.classList.remove("active");
      tabSyllables.setAttribute("aria-selected", "false");

      viewPairs.style.display = "block";
      viewPairs.classList.add("active");
      viewSyllables.style.display = "none";
      viewSyllables.classList.remove("active");

      renderMinimalPair(state.currentPairIndex);
      preloadMinimalPairAudios(MINIMAL_PAIRS_DATA[state.currentPairIndex]);
      triggerHaptic([60, 40, 60], "Modo Pares Mínimos");
    }
  };

  tabSyllables.addEventListener("click", () => switchMode("syllables"));
  tabPairs.addEventListener("click", () => switchMode("pairs"));
}

/**
 * Inicializa los eventos y el estado del módulo de Pares Mínimos
 */
function initMinimalPairs() {
  renderPairShelf();
  renderMinimalPair(state.currentPairIndex);

  // Navegación entre pares
  const btnPrev = document.getElementById("btn-pair-prev");
  const btnNext = document.getElementById("btn-pair-next");

  if (btnPrev) {
    btnPrev.addEventListener("click", () => {
      stopPairSequence();
      state.currentPairIndex = (state.currentPairIndex - 1 + MINIMAL_PAIRS_DATA.length) % MINIMAL_PAIRS_DATA.length;
      renderMinimalPair(state.currentPairIndex);
      renderPairShelf();
    });
  }

  if (btnNext) {
    btnNext.addEventListener("click", () => {
      stopPairSequence();
      state.currentPairIndex = (state.currentPairIndex + 1) % MINIMAL_PAIRS_DATA.length;
      renderMinimalPair(state.currentPairIndex);
      renderPairShelf();
    });
  }

  // Botón Principal: Comparar Par
  const btnPlayPair = document.getElementById("btn-play-pair-sequence");
  if (btnPlayPair) {
    btnPlayPair.addEventListener("click", () => {
      initAudioContext();
      playMinimalPairSequence();
    });
  }

  // Botón Secundario: Solo Sílabas Diana
  const btnCompareTargets = document.getElementById("btn-compare-targets-only");
  if (btnCompareTargets) {
    btnCompareTargets.addEventListener("click", () => {
      initAudioContext();
      compareTargetSyllables();
    });
  }

  // Botón Escuchar Palabra A
  const btnListenA = document.getElementById("btn-listen-word-a");
  if (btnListenA) {
    btnListenA.addEventListener("click", () => {
      initAudioContext();
      stopPairSequence();
      playContrastWordAudio("a");
    });
  }

  // Botón Escuchar Palabra B
  const btnListenB = document.getElementById("btn-listen-word-b");
  if (btnListenB) {
    btnListenB.addEventListener("click", () => {
      initAudioContext();
      stopPairSequence();
      playContrastWordAudio("b");
    });
  }

  // Botón Juego ¿Cuál Sonó?
  const btnToggleGame = document.getElementById("btn-toggle-game-mode");
  const gamePanel = document.getElementById("game-challenge-panel");
  const btnCloseGame = document.getElementById("btn-close-game");
  const btnPlayChallenge = document.getElementById("btn-play-challenge");

  if (btnToggleGame && gamePanel) {
    btnToggleGame.addEventListener("click", () => {
      const isVisible = gamePanel.style.display !== "none";
      if (isVisible) {
        gamePanel.style.display = "none";
      } else {
        gamePanel.style.display = "block";
        startPairChallengeGame();
      }
    });
  }

  if (btnCloseGame && gamePanel) {
    btnCloseGame.addEventListener("click", () => {
      gamePanel.style.display = "none";
      stopPairSequence();
    });
  }

  if (btnPlayChallenge) {
    btnPlayChallenge.addEventListener("click", () => {
      initAudioContext();
      playChallengeSecretAudio();
    });
  }
}

/**
 * Renderiza el carrusel superior con los 4 pares de prueba
 */
function renderPairShelf() {
  const shelf = document.getElementById("pair-shelf-scroll");
  if (!shelf) return;

  shelf.innerHTML = "";

  MINIMAL_PAIRS_DATA.forEach((pair, index) => {
    const item = document.createElement("button");
    item.className = `pair-shelf-item ${index === state.currentPairIndex ? "active" : ""}`;
    item.setAttribute("role", "tab");
    item.setAttribute("aria-selected", index === state.currentPairIndex ? "true" : "false");

    item.innerHTML = `
      <span class="shelf-pair-title">${pair.wordA.name} / ${pair.wordB.name}</span>
      <span class="shelf-pair-badge">${pair.contrastBadge}</span>
    `;

    item.addEventListener("click", () => {
      if (state.currentPairIndex !== index) {
        stopPairSequence();
        state.currentPairIndex = index;
        renderMinimalPair(index);
        renderPairShelf();
      }
    });

    shelf.appendChild(item);
  });
}

/**
 * Renderiza el par seleccionado en el escenario dual de contraste
 */
function renderMinimalPair(index) {
  const pair = MINIMAL_PAIRS_DATA[index];
  if (!pair) return;

  // Actualizar metadatos
  const counter = document.getElementById("pair-counter");
  if (counter) counter.textContent = `Par ${index + 1} de ${MINIMAL_PAIRS_DATA.length}`;

  const title = document.getElementById("pair-active-title");
  if (title) title.textContent = pair.title;

  const badge = document.getElementById("pair-contrast-badge");
  if (badge) badge.textContent = pair.contrastBadge;

  const typeDesc = document.getElementById("contrast-type-text");
  if (typeDesc) typeDesc.textContent = pair.contrastDesc;

  // Renderizar Tarjeta A
  const imgA = document.getElementById("img-pair-a");
  if (imgA) {
    imgA.src = `https://static.arasaac.org/pictograms/${pair.wordA.arasaacId}/${pair.wordA.arasaacId}_500.png`;
    imgA.alt = `Pictograma de ${pair.wordA.name}`;
  }
  const nameA = document.getElementById("name-pair-a");
  if (nameA) nameA.textContent = pair.wordA.name;

  const sylContainerA = document.getElementById("syllables-pair-a");
  if (sylContainerA) {
    sylContainerA.innerHTML = "";
    pair.wordA.syllables.forEach((syl, sylIdx) => {
      const pill = createContrastSyllablePill(syl, "a", sylIdx);
      sylContainerA.appendChild(pill);
    });
  }

  // Renderizar Tarjeta B
  const imgB = document.getElementById("img-pair-b");
  if (imgB) {
    imgB.src = `https://static.arasaac.org/pictograms/${pair.wordB.arasaacId}/${pair.wordB.arasaacId}_500.png`;
    imgB.alt = `Pictograma de ${pair.wordB.name}`;
  }
  const nameB = document.getElementById("name-pair-b");
  if (nameB) nameB.textContent = pair.wordB.name;

  const sylContainerB = document.getElementById("syllables-pair-b");
  if (sylContainerB) {
    sylContainerB.innerHTML = "";
    pair.wordB.syllables.forEach((syl, sylIdx) => {
      const pill = createContrastSyllablePill(syl, "b", sylIdx);
      sylContainerB.appendChild(pill);
    });
  }

  // Renderizar caja de firma háptica
  renderHapticSignatureBox(pair);

  // Si el panel de juego está abierto, actualizarlo para este par
  const gamePanel = document.getElementById("game-challenge-panel");
  if (gamePanel && gamePanel.style.display !== "none") {
    startPairChallengeGame();
  }

  // Precargar audios del par
  preloadMinimalPairAudios(pair);
}

/**
 * Crea una píldora interactiva para una sílaba en el modo de contraste
 */
function createContrastSyllablePill(syl, wordKey, sylIndex) {
  const pill = document.createElement("button");
  pill.className = `contrast-syllable-pill ${syl.targetClass}`;
  pill.id = `pair-${wordKey}-syl-${sylIndex}`;
  pill.setAttribute("aria-label", `Sílaba ${syl.text} (${syl.vibeLabel})`);

  const textSpan = document.createElement("span");
  textSpan.className = "syl-text";
  textSpan.textContent = syl.text;

  const badge = document.createElement("span");
  badge.className = "syl-type-tag";
  badge.textContent = syl.isTarget ? "DIANA 🎯" : "COMPARTIDA";

  pill.appendChild(textSpan);
  pill.appendChild(badge);

  pill.addEventListener("click", () => {
    initAudioContext();
    stopPairSequence();
    playContrastSyllableAudio(syl, wordKey, pill);
  });

  return pill;
}

/**
 * Renderiza la caja explicativa de la firma háptica según el par
 */
function renderHapticSignatureBox(pair) {
  const sigContent = document.getElementById("sig-content");
  if (!sigContent) return;

  sigContent.innerHTML = `
    <div class="sig-item target-a">
      <span class="sig-badge a">Diana A</span>
      <span class="sig-desc">${pair.hapticSignature.targetA}</span>
    </div>
    <div class="sig-item target-b">
      <span class="sig-badge b">Diana B</span>
      <span class="sig-desc">${pair.hapticSignature.targetB}</span>
    </div>
    <div class="sig-item shared">
      <span class="sig-badge base">Compartida</span>
      <span class="sig-desc">${pair.hapticSignature.shared}</span>
    </div>
  `;
}

/**
 * Reproduce el audio y dispara la vibración diferenciada de una sílaba en el modo de pares
 */
async function playContrastSyllableAudio(syl, wordKey, pillEl) {
  const allPills = document.querySelectorAll(".contrast-syllable-pill");
  allPills.forEach(p => p.classList.remove("active"));

  if (pillEl) pillEl.classList.add("active");

  const onAudioStart = () => {
    triggerHaptic(syl.vibePattern, syl.vibeLabel);
    playHarmonicCue(syl.isTarget ? (wordKey === "a" ? "stressed" : "sustained") : "normal");
  };

  try {
    if (state.audioMode === "hd" && syl.audio && KNOWN_HD_CLIPS.has(syl.audio)) {
      await playAudioClip(syl.audio, onAudioStart);
    } else if (state.audioMode === "edge") {
      const buffer = await synthesizeWithEdgeTTS(syl.text.toLowerCase(), syl.isTarget ? "stressed" : "normal");
      if (buffer) {
        await playDecodedAudioBuffer(buffer, onAudioStart);
      } else {
        await speakContrastTTS(syl.text, syl.isTarget, onAudioStart);
      }
    } else {
      await speakContrastTTS(syl.text, syl.isTarget, onAudioStart);
    }
  } catch (e) {
    await speakContrastTTS(syl.text, syl.isTarget, onAudioStart);
  } finally {
    if (pillEl) {
      setTimeout(() => {
        pillEl.classList.remove("active");
      }, 150);
    }
  }
}

/**
 * Reproduce la palabra completa de una de las tarjetas (A o B)
 */
async function playContrastWordAudio(wordKey) {
  const pair = MINIMAL_PAIRS_DATA[state.currentPairIndex];
  if (!pair) return;

  const wordObj = wordKey === "a" ? pair.wordA : pair.wordB;
  const cardEl = document.getElementById(`contrast-card-${wordKey}`);

  if (cardEl) cardEl.classList.add("active-glow");

  const onAudioStart = () => {
    triggerHaptic([180, 50, 180, 50, 240], `Palabra: ${wordObj.name}`, 700);
  };

  try {
    if (state.audioMode === "hd" && wordObj.audioFull && KNOWN_HD_CLIPS.has(wordObj.audioFull)) {
      await playAudioClip(wordObj.audioFull, onAudioStart);
    } else if (state.audioMode === "edge") {
      const buffer = await synthesizeWithEdgeTTS(wordObj.name.toLowerCase(), "word");
      if (buffer) {
        await playDecodedAudioBuffer(buffer, onAudioStart);
      } else {
        await speakWordTTS(wordObj.name, onAudioStart);
      }
    } else {
      await speakWordTTS(wordObj.name, onAudioStart);
    }
  } catch (e) {
    await speakWordTTS(wordObj.name, onAudioStart);
  } finally {
    if (cardEl) {
      setTimeout(() => {
        cardEl.classList.remove("active-glow");
      }, 250);
    }
  }
}

/**
 * Fallback TTS para sílaba contrastante
 */
function speakContrastTTS(text, isTarget, onStart) {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window) || !state.soundEnabled) {
      if (typeof onStart === "function") onStart();
      resolve(true);
      return;
    }

    const clean = text.replace(/\*/g, "").toLowerCase();
    const ttsText = normalizeForTTS(clean, isTarget, false);
    const utt = new SpeechSynthesisUtterance(ttsText);
    utt.lang = "es-ES";
    utt.rate = 0.85;
    utt.pitch = isTarget ? 1.3 : 1.0;

    let fired = false;
    utt.onstart = () => {
      if (!fired) {
        fired = true;
        if (typeof onStart === "function") onStart();
      }
    };
    utt.onend = () => resolve(true);
    utt.onerror = () => resolve(false);

    window.speechSynthesis.speak(utt);
  });
}

/**
 * Fallback TTS para palabra completa
 */
function speakWordTTS(name, onStart) {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window) || !state.soundEnabled) {
      if (typeof onStart === "function") onStart();
      resolve(true);
      return;
    }

    const utt = new SpeechSynthesisUtterance(name);
    utt.lang = "es-ES";
    utt.rate = 0.85;

    let fired = false;
    utt.onstart = () => {
      if (!fired) {
        fired = true;
        if (typeof onStart === "function") onStart();
      }
    };
    utt.onend = () => resolve(true);
    utt.onerror = () => resolve(false);

    window.speechSynthesis.speak(utt);
  });
}

/**
 * Ejecuta la secuencia comparativa completa:
 * Palabra A (Sílaba 1 -> Sílaba 2 -> Palabra completa)
 * -> Pausa
 * -> Palabra B (Sílaba 1 -> Sílaba 2 -> Palabra completa)
 */
async function playMinimalPairSequence() {
  if (state.isPlayingPairSequence) {
    stopPairSequence();
    return;
  }

  const pair = MINIMAL_PAIRS_DATA[state.currentPairIndex];
  if (!pair) return;

  state.isPlayingPairSequence = true;
  updatePairPlayButton(true);

  const delay = (ms) => new Promise(resolve => {
    state.pairSequenceTimeout = setTimeout(resolve, ms);
  });

  // PARTE 1: PALABRA A
  const cardA = document.getElementById("contrast-card-a");
  if (cardA) cardA.classList.add("active-glow");

  for (let i = 0; i < pair.wordA.syllables.length; i++) {
    if (!state.isPlayingPairSequence) break;
    const syl = pair.wordA.syllables[i];
    const pill = document.getElementById(`pair-a-syl-${i}`);
    await playContrastSyllableAudio(syl, "a", pill);
    await delay(550);
  }

  if (state.isPlayingPairSequence) {
    await playContrastWordAudio("a");
    if (cardA) cardA.classList.remove("active-glow");
    await delay(700); // Pausa de respiración entre A y B
  }

  // PARTE 2: PALABRA B
  if (state.isPlayingPairSequence) {
    const cardB = document.getElementById("contrast-card-b");
    if (cardB) cardB.classList.add("active-glow");

    for (let i = 0; i < pair.wordB.syllables.length; i++) {
      if (!state.isPlayingPairSequence) break;
      const syl = pair.wordB.syllables[i];
      const pill = document.getElementById(`pair-b-syl-${i}`);
      await playContrastSyllableAudio(syl, "b", pill);
      await delay(550);
    }

    if (state.isPlayingPairSequence) {
      await playContrastWordAudio("b");
      if (cardB) cardB.classList.remove("active-glow");
      triggerConfetti();
    }
  }

  stopPairSequence();
}

/**
 * Detiene la reproducción de la secuencia de pares
 */
function stopPairSequence() {
  state.isPlayingPairSequence = false;
  if (state.pairSequenceTimeout) {
    clearTimeout(state.pairSequenceTimeout);
    state.pairSequenceTimeout = null;
  }

  stopAllAudio();

  const allPills = document.querySelectorAll(".contrast-syllable-pill");
  allPills.forEach(p => p.classList.remove("active"));

  const cardA = document.getElementById("contrast-card-a");
  const cardB = document.getElementById("contrast-card-b");
  if (cardA) cardA.classList.remove("active-glow");
  if (cardB) cardB.classList.remove("active-glow");

  updatePairPlayButton(false);
}

function updatePairPlayButton(isPlaying) {
  const btn = document.getElementById("btn-play-pair-sequence");
  const icon = document.getElementById("pair-play-icon");
  const text = document.getElementById("pair-play-text");

  if (!btn || !icon || !text) return;

  if (isPlaying) {
    btn.classList.add("playing");
    icon.textContent = "⏹";
    text.textContent = "Detener";
  } else {
    btn.classList.remove("playing");
    icon.textContent = "▶";
    text.textContent = "Comparar Par";
  }
}

/**
 * Comparación directa y rápida de solo las sílabas diana (contrastantes)
 */
async function compareTargetSyllables() {
  stopPairSequence();
  const pair = MINIMAL_PAIRS_DATA[state.currentPairIndex];
  if (!pair) return;

  const targetA = pair.wordA.syllables.find(s => s.isTarget);
  const targetB = pair.wordB.syllables.find(s => s.isTarget);
  const targetAIdx = pair.wordA.syllables.findIndex(s => s.isTarget);
  const targetBIdx = pair.wordB.syllables.findIndex(s => s.isTarget);

  if (!targetA || !targetB) return;

  const pillA = document.getElementById(`pair-a-syl-${targetAIdx}`);
  const pillB = document.getElementById(`pair-b-syl-${targetBIdx}`);

  // Reproducir Diana A
  await playContrastSyllableAudio(targetA, "a", pillA);
  await new Promise(r => setTimeout(r, 450));

  // Reproducir Diana B
  await playContrastSyllableAudio(targetB, "b", pillB);
}

/**
 * Inicializa el juego interactivo "¿Cuál Sonó?" para discriminar el par actual
 */
function startPairChallengeGame() {
  const pair = MINIMAL_PAIRS_DATA[state.currentPairIndex];
  if (!pair) return;

  // Elegir aleatoriamente palabra A o B
  const pick = Math.random() < 0.5 ? "a" : "b";
  state.gameChallengeSecret = {
    wordKey: pick,
    wordObj: pick === "a" ? pair.wordA : pair.wordB
  };

  const feedback = document.getElementById("game-feedback-msg");
  if (feedback) {
    feedback.textContent = "";
    feedback.className = "game-feedback-msg";
  }

  // Renderizar las 2 opciones interactivas
  const optionsRow = document.getElementById("game-options-row");
  if (optionsRow) {
    optionsRow.innerHTML = `
      <button class="game-opt-card" id="game-opt-a" data-choice="a">
        <img src="https://static.arasaac.org/pictograms/${pair.wordA.arasaacId}/${pair.wordA.arasaacId}_500.png" alt="${pair.wordA.name}">
        <span>${pair.wordA.name}</span>
      </button>
      <button class="game-opt-card" id="game-opt-b" data-choice="b">
        <img src="https://static.arasaac.org/pictograms/${pair.wordB.arasaacId}/${pair.wordB.arasaacId}_500.png" alt="${pair.wordB.name}">
        <span>${pair.wordB.name}</span>
      </button>
    `;

    const optA = document.getElementById("game-opt-a");
    const optB = document.getElementById("game-opt-b");

    const handleChoice = (chosenKey) => {
      const isCorrect = chosenKey === state.gameChallengeSecret.wordKey;
      if (isCorrect) {
        if (feedback) {
          feedback.textContent = "🎉 ¡Excelente! ¡Diferenciaste la palabra correctamente!";
          feedback.className = "game-feedback-msg success";
        }
        triggerConfetti();
        triggerHaptic([100, 40, 200, 40, 300], "¡Correcto!", 680);
        playHarmonicCue("stressed");

        // Preparar siguiente desafío tras 2 segundos
        setTimeout(() => {
          if (document.getElementById("game-challenge-panel").style.display !== "none") {
            startPairChallengeGame();
          }
        }, 2200);
      } else {
        if (feedback) {
          feedback.textContent = "🤔 Casi. Escucha y siente la vibración de nuevo para notar la diferencia.";
          feedback.className = "game-feedback-msg error";
        }
        triggerHaptic([60, 40, 60], "Inténtalo de nuevo");
      }
    };

    if (optA) optA.addEventListener("click", () => handleChoice("a"));
    if (optB) optB.addEventListener("click", () => handleChoice("b"));
  }
}

/**
 * Reproduce el sonido secreto del juego con su firma háptica correspondiente
 */
async function playChallengeSecretAudio() {
  if (!state.gameChallengeSecret) return;

  const { wordKey, wordObj } = state.gameChallengeSecret;
  const onAudioStart = () => {
    triggerHaptic([180, 50, 180, 50, 240], "Sonido Secreto", 700);
  };

  try {
    if (state.audioMode === "hd" && wordObj.audioFull && KNOWN_HD_CLIPS.has(wordObj.audioFull)) {
      await playAudioClip(wordObj.audioFull, onAudioStart);
    } else if (state.audioMode === "edge") {
      const buffer = await synthesizeWithEdgeTTS(wordObj.name.toLowerCase(), "word");
      if (buffer) {
        await playDecodedAudioBuffer(buffer, onAudioStart);
      } else {
        await speakWordTTS(wordObj.name, onAudioStart);
      }
    } else {
      await speakWordTTS(wordObj.name, onAudioStart);
    }
  } catch (e) {
    await speakWordTTS(wordObj.name, onAudioStart);
  }
}

/**
 * Precarga en memoria los clips de audio del par mínimo actual para reproducción con 0ms de latencia
 */
function preloadMinimalPairAudios(pair) {
  if (!pair) return;

  if (pair.wordA.audioFull) preloadAudioClip(pair.wordA.audioFull);
  if (pair.wordB.audioFull) preloadAudioClip(pair.wordB.audioFull);

  pair.wordA.syllables.forEach(s => {
    if (s.audio) preloadAudioClip(s.audio);
  });
  pair.wordB.syllables.forEach(s => {
    if (s.audio) preloadAudioClip(s.audio);
  });
}

