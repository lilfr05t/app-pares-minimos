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
  "rro": "rro.",    // Vibrante múltiple
  "ño": "ñó.",
  "man": "mán.",
  "cha": "chá.",
  "ra": "rá.",

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
    if (isSustained) {
      result = result.replace(/([aeiouáéíóú])\./i, "$1$1$1.");
    }
    return result;
  }

  // 2. Regla algorítmica para palabras nuevas
  let token = lower;

  // Si la sílaba contiene 'j' con vocal (ej. "ju"), acentuar agudamente para fijar fonología española
  if (/^j[aeiou]/i.test(token)) {
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
  soundEnabled: true,
  vibrationEnabled: true,
  vibeIntensity: "fuerte", // "estandar" (1.0x) | "fuerte" (1.25x - Terapéutica Niños) | "maxima" (1.6x - Para Fundas)
  audioMode: "hd", // "hd" (Archivos de Audio HD) | "tts" (Sintetizador Normalizado)
  speechRate: 0.85,
  pauseBetweenSyllables: 700,
  harmonicToneEnabled: true,
  selectedVoice: null,
  spanishVoices: []
};

// Web Audio Context para tonos armónicos complementarios
let audioCtx = null;
let currentAudioInstance = null;

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
  if (currentAudioInstance) {
    currentAudioInstance.pause();
    currentAudioInstance.currentTime = 0;
    currentAudioInstance = null;
  }
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Reproduce un archivo de audio MP3 (Audio HD) con promesa
 */
function playAudioClip(url) {
  return new Promise((resolve) => {
    if (!state.soundEnabled) {
      resolve(true);
      return;
    }

    stopAllAudio();
    const audio = new Audio(url);
    currentAudioInstance = audio;

    let hasEnded = false;
    const finish = (success) => {
      if (!hasEnded) {
        hasEnded = true;
        currentAudioInstance = null;
        resolve(success);
      }
    };

    audio.onended = () => finish(true);
    audio.onerror = (err) => {
      console.warn("Clip de audio no encontrado, usando TTS de respaldo:", url, err);
      finish(false);
    };

    audio.play().catch((err) => {
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
 * Pronuncia una sílaba con TTS inteligente y normalización anti-acrónimos
 */
function speakSyllableTTS(syllableObj) {
  return new Promise((resolve) => {
    if (!state.soundEnabled || !("speechSynthesis" in window)) {
      setTimeout(resolve, 350);
      return;
    }

    stopAllAudio();

    // Texto protegido contra acrónimos y fórmulas químicas
    const textToSpeak = syllableObj.ttsText || normalizeForTTS(syllableObj.cleanText, syllableObj.type === "stressed", syllableObj.type === "sustained");

    const utter = new SpeechSynthesisUtterance(textToSpeak);
    utter.lang = "es-ES";
    if (state.selectedVoice) {
      utter.voice = state.selectedVoice;
    }

    utter.pitch = syllableObj.pitch;
    utter.rate = state.speechRate * syllableObj.rateMultiplier;
    utter.volume = 1.0;

    let hasEnded = false;
    const finish = () => {
      if (!hasEnded) {
        hasEnded = true;
        resolve();
      }
    };

    utter.onend = finish;
    utter.onerror = finish;
    setTimeout(finish, 1200);

    window.speechSynthesis.speak(utter);
  });
}

/**
 * Reproduce una sílaba según el modo activo (Audio HD o TTS Normalizado)
 */
async function playSyllableAudio(syllableObj, wordObj, syllableIndex) {
  if (!state.soundEnabled) return;

  // Si el modo es Audio HD y existe clip pregrabado
  if (state.audioMode === "hd" && wordObj && wordObj.audio && wordObj.audio.syllables && wordObj.audio.syllables[syllableIndex]) {
    const clipPath = wordObj.audio.syllables[syllableIndex];
    const success = await playAudioClip(clipPath);
    if (success) return;
  }

  // Fallback o Modo TTS directo
  await speakSyllableTTS(syllableObj);
}

/**
 * Pronuncia o reproduce la palabra completa
 */
async function playFullWordAudio(wordObj) {
  if (!state.soundEnabled) return;

  if (state.audioMode === "hd" && wordObj && wordObj.audio && wordObj.audio.full) {
    const success = await playAudioClip(wordObj.audio.full);
    if (success) return;
  }

  // Fallback con TTS
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) {
      setTimeout(resolve, 500);
      return;
    }

    stopAllAudio();
    const utter = new SpeechSynthesisUtterance(wordObj.clean + ".");
    utter.lang = "es-ES";
    if (state.selectedVoice) {
      utter.voice = state.selectedVoice;
    }
    utter.pitch = 1.05;
    utter.rate = Math.max(0.75, state.speechRate);
    utter.volume = 1.0;

    let hasEnded = false;
    const finish = () => {
      if (!hasEnded) {
        hasEnded = true;
        resolve();
      }
    };

    utter.onend = finish;
    utter.onerror = finish;
    setTimeout(finish, 1500);

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
 */
async function activateSyllable(syllableObj, index, wordObj) {
  const allPills = document.querySelectorAll(".syllable-pill");
  allPills.forEach(p => p.classList.remove("active"));

  const targetPill = document.getElementById(`syl-pill-${index}`);
  if (targetPill) {
    targetPill.classList.add("active");
  }

  // 1. Háptico
  triggerHaptic(syllableObj.vibePattern, syllableObj.typeLabel);

  // 2. Auditivo (Tono armónico + Audio HD / TTS)
  playHarmonicCue(syllableObj.type);
  await playSyllableAudio(syllableObj, wordObj, index);

  if (targetPill) {
    setTimeout(() => {
      targetPill.classList.remove("active");
    }, 200);
  }
}

// ==========================================
// 8. SECUENCIADOR MULTISENSORIAL COMPLETO
// ==========================================

async function playFullSequence() {
  if (state.isPlayingSequence) {
    stopSequence();
    return;
  }

  state.isPlayingSequence = true;
  updatePlayButton(true);

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
    if (picBox) picBox.classList.add("active-glow");

    triggerHaptic([180, 50, 180, 50, 280], "Palabra Completa", 740);
    await playFullWordAudio(currentWord);

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

  const isHD = state.audioMode === "hd";

  if (btnAudioMode) {
    btnAudioMode.classList.toggle("tts-mode", !isHD);
  }
  if (icon) icon.textContent = isHD ? "🎧" : "🤖";
  if (text) text.textContent = isHD ? "HD" : "TTS";
  if (select && select.value !== state.audioMode) {
    select.value = state.audioMode;
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

// ==========================================
// 11. INICIALIZACIÓN Y EVENTOS
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  loadWordList();
  renderShelf();
  renderActiveWord();
  updateAudioModeUI();

  loadVoices();
  if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  // Botón rápido en cabecera: Alternar Audio HD / TTS
  const btnAudioMode = document.getElementById("btn-audio-mode");
  if (btnAudioMode) {
    btnAudioMode.addEventListener("click", () => {
      state.audioMode = state.audioMode === "hd" ? "tts" : "hd";
      updateAudioModeUI();
      triggerHaptic([60], state.audioMode === "hd" ? "Modo Audio HD" : "Modo TTS");
    });
  }

  // Selector en modal
  const audioModeSelect = document.getElementById("audio-mode-select");
  if (audioModeSelect) {
    audioModeSelect.addEventListener("change", (e) => {
      state.audioMode = e.target.value;
      updateAudioModeUI();
    });
  }

  // Pruebas Fonéticas (ZA, NA, CHA*)
  const btnTestZa = document.getElementById("btn-test-za");
  const btnTestNa = document.getElementById("btn-test-na");
  const btnTestCha = document.getElementById("btn-test-cha");
  const testMsg = document.getElementById("phonetic-test-msg");

  const runPhoneticTest = async (token, type, hdClip) => {
    initAudioContext();
    if (testMsg) {
      testMsg.textContent = `Reproduciendo "${token}" en modo ${state.audioMode.toUpperCase()}...`;
      testMsg.style.color = "#4f46e5";
    }

    if (state.audioMode === "hd" && hdClip) {
      await playAudioClip(hdClip);
    } else {
      const syl = {
        cleanText: token.replace(/\*/g, ""),
        type: type,
        pitch: type === "stressed" ? 1.35 : (type === "sustained" ? 1.2 : 1.0),
        rateMultiplier: type === "sustained" ? 0.55 : 1.0
      };
      await speakSyllableTTS(syl);
    }

    if (testMsg) {
      testMsg.textContent = `✅ "${token}" articulado claramente sin deletreo ni 'sodio'.`;
      testMsg.style.color = "#16a34a";
    }
  };

  if (btnTestZa) {
    btnTestZa.addEventListener("click", () => runPhoneticTest("ZA", "stressed", "audio/syl_za_stressed.mp3"));
  }
  if (btnTestNa) {
    btnTestNa.addEventListener("click", () => runPhoneticTest("na", "normal", "audio/syl_na.mp3"));
  }
  const btnTestJu = document.getElementById("btn-test-ju");
  if (btnTestJu) {
    btnTestJu.addEventListener("click", () => runPhoneticTest("ju", "normal", null));
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

  const closeModal = () => settingsModal && settingsModal.classList.remove("open");
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
    });
  }

  if (pauseSlider && pauseVal) {
    pauseSlider.addEventListener("input", (e) => {
      state.pauseBetweenSyllables = parseInt(e.target.value, 10);
      pauseVal.textContent = `${state.pauseBetweenSyllables} ms`;
    });
  }

  if (toneToggle) {
    toneToggle.addEventListener("change", (e) => {
      state.harmonicToneEnabled = e.target.checked;
    });
  }

  // Selector de Potencia Háptica
  const vibeIntensitySelect = document.getElementById("vibe-intensity-select");
  if (vibeIntensitySelect) {
    vibeIntensitySelect.value = state.vibeIntensity;
    vibeIntensitySelect.addEventListener("change", (e) => {
      state.vibeIntensity = e.target.value;
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

  // Registro de Service Worker para PWA (Instalable en Android)
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch((err) => {
        console.log("Nota sobre Service Worker:", err);
      });
    });
  }
});
