/**
 * FONEMASENS - MOTOR MULTISENSORIAL DEL LENGUAJE
 * Visual (ARASAAC) + Táctil (API Háptica) + Auditivo (TTS Inflexión)
 */

// ==========================================
// 1. DATOS INICIALES Y MODELO DE PALABRAS
// ==========================================

const INITIAL_WORDS = [
  {
    raw: "CA-rro",
    clean: "Carro",
    searchTerm: "carro",
    arasaacId: 2339
  },
  {
    raw: "PE-rro",
    clean: "Perro",
    searchTerm: "perro",
    arasaacId: 7202
  },
  {
    raw: "BA-ño",
    clean: "Baño",
    searchTerm: "baño",
    arasaacId: 6929
  },
  {
    raw: "pe-LO-ta",
    clean: "Pelota",
    searchTerm: "pelota",
    arasaacId: 3241
  },
  {
    raw: "man-ZA-na",
    clean: "Manzana",
    searchTerm: "manzana",
    arasaacId: 2462
  },
  {
    raw: "cu-CHA*-ra",
    clean: "Cuchara",
    searchTerm: "cuchara",
    arasaacId: 2362
  }
];

// ==========================================
// 2. ESTADO GLOBAL DE LA APLICACIÓN
// ==========================================

const state = {
  words: [],
  currentIndex: 0,
  isPlayingSequence: false,
  sequenceTimeout: null,
  soundEnabled: true,
  vibrationEnabled: true,
  speechRate: 0.85,
  pauseBetweenSyllables: 700,
  harmonicToneEnabled: true,
  selectedVoice: null,
  spanishVoices: []
};

// Web Audio Context para tonos armónicos complementarios
let audioCtx = null;

// ==========================================
// 3. ANALIZADOR FONÉTICO DE SÍLABAS
// ==========================================

/**
 * Analiza un patrón de palabra separada por guiones ("man-ZA-na", "cu-CHA*-ra")
 * Identifica tipo de sílaba:
 * - normal: Átona / minúscula -> vibración suave y corta
 * - stressed: Acentuada / MAYÚSCULA -> vibración fuerte y seca
 * - sustained: Con asterisco (*) -> vibración prolongada y sostenida
 */
function parseWordPattern(wordPattern) {
  const parts = wordPattern.split("-");
  
  return parts.map((part) => {
    const rawPart = part.trim();
    const hasAsterisk = rawPart.includes("*");
    const cleanToken = rawPart.replace(/\*/g, "");
    
    // Determinar si es mayúscula (sílaba acentuada)
    const isUppercase = cleanToken.length > 0 && 
                        cleanToken === cleanToken.toUpperCase() && 
                        /[A-ZÁÉÍÓÚÑ]/.test(cleanToken);
    
    let type = "normal";
    let typeLabel = "Átona";
    let vibeDesc = "Suave (60ms)";
    let vibePattern = [60];
    let pitch = 1.0;
    let rateMultiplier = 1.0;

    if (hasAsterisk) {
      type = "sustained";
      typeLabel = "Sostenida (*)";
      vibeDesc = "Fuerte Sostenida (360ms)";
      vibePattern = [200, 40, 160]; // 400ms total con micro-pulso
      pitch = 1.2;
      rateMultiplier = 0.55; // Habla más lenta para prolongar
    } else if (isUppercase) {
      type = "stressed";
      typeLabel = "Acentuada";
      vibeDesc = "Fuerte y Seca (180ms)";
      vibePattern = [180];
      pitch = 1.35; // Inflexión de tono más alta
      rateMultiplier = 0.95;
    }

    return {
      text: cleanToken + (hasAsterisk ? "*" : ""),
      cleanText: cleanToken.toLowerCase(),
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
// 4. MOTOR HÁPTICO / VIBRACIÓN
// ==========================================

/**
 * Dispara la vibración física (navigator.vibrate) y la simulación visual
 */
function triggerHaptic(pattern, typeLabel, durationMs = 200) {
  if (!state.vibrationEnabled) return;

  // 1. Vibración en hardware nativo
  if ("vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      console.warn("navigator.vibrate error:", e);
    }
  }

  // 2. Simulación visual activa (para pantallas, desktop o iOS)
  const hapticBar = document.getElementById("haptic-bar");
  const hapticBadge = document.getElementById("haptic-badge");
  const hapticDesc = document.getElementById("haptic-desc");

  if (hapticBar && hapticBadge && hapticDesc) {
    hapticBar.classList.add("active-vibe");
    hapticBadge.className = `haptic-badge ${typeLabel.toLowerCase().includes("sostenida") ? "sustained" : typeLabel.toLowerCase().includes("acentuada") ? "stressed" : ""}`;
    hapticBadge.textContent = typeLabel;
    hapticDesc.textContent = `Vibrando: ${typeLabel}`;

    // Calcular duración total del patrón
    const totalMs = Array.isArray(pattern) 
      ? pattern.reduce((a, b) => a + b, 0) 
      : (typeof pattern === "number" ? pattern : durationMs);

    setTimeout(() => {
      hapticBar.classList.remove("active-vibe");
      hapticBadge.className = "haptic-badge";
      hapticBadge.textContent = "Normal";
      hapticDesc.textContent = "Motor háptico listo";
    }, Math.max(totalMs + 50, 250));
  }
}

// ==========================================
// 5. MOTOR AUDITIVO (TTS + TONOS ARMÓNICOS)
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

/**
 * Tono armónico complementario para discriminación auditiva
 */
function playHarmonicCue(type) {
  if (!state.harmonicToneEnabled || !state.soundEnabled) return;
  initAudioContext();
  if (!audioCtx) return;

  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    let freq = 440; // La4 normal
    let duration = 0.12;

    if (type === "stressed") {
      freq = 660; // Mi5 agudo
      duration = 0.2;
    } else if (type === "sustained") {
      freq = 554.37; // Do#5
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
 * Carga y detecta voces en español disponibles en el navegador/celular
 */
function loadVoices() {
  if (!("speechSynthesis" in window)) {
    console.warn("SpeechSynthesis no soportado");
    return;
  }

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
        // Preferir voces naturales comunes
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
 * Pronuncia una sílaba individual con inflexión y duración calibradas
 */
function speakSyllable(syllableObj) {
  return new Promise((resolve) => {
    if (!state.soundEnabled || !("speechSynthesis" in window)) {
      setTimeout(resolve, 350);
      return;
    }

    window.speechSynthesis.cancel();

    // Texto para pronunciación fonética clara
    let textToSpeak = syllableObj.cleanText;
    
    // Si es sostenida, estirar la última vocal suavemente en el string si es posible
    if (syllableObj.type === "sustained") {
      const lastChar = textToSpeak.slice(-1);
      if ("aeiouáéíóú".includes(lastChar)) {
        textToSpeak = textToSpeak + lastChar; // ej: "cha" -> "chaa"
      }
    }

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

    // Timeout de seguridad si el TTS no dispara onend
    setTimeout(finish, 1200);

    window.speechSynthesis.speak(utter);
  });
}

/**
 * Pronuncia la palabra completa de corrido
 */
function speakFullWord(wordText) {
  return new Promise((resolve) => {
    if (!state.soundEnabled || !("speechSynthesis" in window)) {
      setTimeout(resolve, 500);
      return;
    }

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(wordText);
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
// 6. RENDERIZADO Y CONTROL DE LA INTERFAZ
// ==========================================

/**
 * Carga las palabras desde LocalStorage o usa las 6 iniciales
 */
function loadWordList() {
  const saved = localStorage.getItem("fonemasens_words");
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
  localStorage.setItem("fonemasens_words", JSON.stringify(state.words));
}

/**
 * Renderiza el carrusel inferior de selección rápida
 */
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
      : (item.customImg || "https://static.arasaac.org/pictograms/2339/2339_300.png");

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

/**
 * Renderiza la palabra activa en la tarjeta principal
 */
function renderActiveWord() {
  const currentWord = state.words[state.currentIndex];
  if (!currentWord) return;

  // Actualizar metadatos
  const counter = document.getElementById("word-counter");
  if (counter) {
    counter.textContent = `Palabra ${state.currentIndex + 1} de ${state.words.length}`;
  }

  const cleanLabel = document.getElementById("target-word-clean");
  if (cleanLabel) {
    cleanLabel.textContent = currentWord.clean.toUpperCase();
  }

  // Actualizar imagen ARASAAC
  const imgEl = document.getElementById("pictogram-img");
  const loader = document.getElementById("pictogram-loader");
  
  if (imgEl) {
    if (loader) loader.classList.add("show");
    
    const imgSrc = currentWord.arasaacId
      ? `https://static.arasaac.org/pictograms/${currentWord.arasaacId}/${currentWord.arasaacId}_500.png`
      : (currentWord.customImg || "https://static.arasaac.org/pictograms/2339/2339_500.png");

    imgEl.onload = () => {
      if (loader) loader.classList.remove("show");
    };
    imgEl.onerror = () => {
      if (loader) loader.classList.remove("show");
    };

    imgEl.src = imgSrc;
    imgEl.alt = `Pictograma de ${currentWord.clean}`;
  }

  // Parsear y renderizar sílabas
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

    // Tocar individualmente la sílaba (Modo Exploratorio)
    pill.addEventListener("click", () => {
      initAudioContext();
      stopSequence();
      activateSyllable(syl, index);
    });

    stage.appendChild(pill);
  });
}

/**
 * Activa los estímulos multisensoriales para una sílaba específica
 */
async function activateSyllable(syllableObj, index) {
  // 1. Resaltado Visual
  const allPills = document.querySelectorAll(".syllable-pill");
  allPills.forEach(p => p.classList.remove("active"));
  
  const targetPill = document.getElementById(`syl-pill-${index}`);
  if (targetPill) {
    targetPill.classList.add("active");
  }

  // 2. Estímulo Háptico / Vibración
  triggerHaptic(syllableObj.vibePattern, syllableObj.typeLabel);

  // 3. Estímulo Auditivo (Tono armónico + TTS)
  playHarmonicCue(syllableObj.type);
  await speakSyllable(syllableObj);

  // Desactivar el resaltado al terminar
  if (targetPill) {
    setTimeout(() => {
      targetPill.classList.remove("active");
    }, 200);
  }
}

// ==========================================
// 7. SECUENCIADOR MULTISENSORIAL COMPLETO
// ==========================================

/**
 * Reproduce la palabra completa sílaba por sílaba con pausas terapéuticas
 */
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
    await activateSyllable(syl, i);

    // Pausa entre sílabas para que el niño procese o repita
    if (i < syllables.length - 1) {
      await delay(state.pauseBetweenSyllables);
    }
  }

  // Final: Resaltar pictograma y decir la palabra completa
  if (state.isPlayingSequence) {
    await delay(350);

    const picBox = document.getElementById("pictogram-box");
    if (picBox) picBox.classList.add("active-glow");

    triggerHaptic([100, 60, 100], "Palabra Completa", 300);
    await speakFullWord(currentWord.clean);

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
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

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

// ==========================================
// 8. EFECTO CELEBRATORIO (CONFETTI)
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
// 9. BÚSQUEDA Y ADICIÓN CON ARASAAC API
// ==========================================

/**
 * Consulta la API pública de ARASAAC para obtener el pictograma
 */
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
// 10. INICIALIZACIÓN Y EVENTOS
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  // 1. Cargar datos
  loadWordList();
  renderShelf();
  renderActiveWord();

  // 2. Cargar Voces TTS
  loadVoices();
  if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  // 3. Botones de Navegación de Palabra
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

  // 4. Botón Principal: Escuchar y Sentir
  const btnPlayAll = document.getElementById("btn-play-all");
  if (btnPlayAll) {
    btnPlayAll.addEventListener("click", () => {
      initAudioContext();
      playFullSequence();
    });
  }

  // 5. Botones Secundarios
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
      speakFullWord(currentWord.clean);
    });
  }

  // 6. Controles de Cabecera (Sonido / Vibración)
  const btnSoundToggle = document.getElementById("btn-sound-toggle");
  const soundIcon = document.getElementById("sound-icon");
  if (btnSoundToggle) {
    btnSoundToggle.addEventListener("click", () => {
      state.soundEnabled = !state.soundEnabled;
      btnSoundToggle.classList.toggle("muted", !state.soundEnabled);
      if (soundIcon) soundIcon.textContent = state.soundEnabled ? "🔊" : "🔇";
      if (!state.soundEnabled && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
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

  // 7. Modal de Ajustes
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
      if (state.selectedVoice) {
        const test = new SpeechSynthesisUtterance("Hola");
        test.voice = state.selectedVoice;
        test.rate = state.speechRate;
        window.speechSynthesis.speak(test);
      }
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

  // Botones de prueba de vibración en el modal
  const testVibeBtns = document.querySelectorAll(".test-vibe-btn");
  testVibeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const mode = btn.getAttribute("data-vibe");
      if (mode === "normal") {
        triggerHaptic([60], "Átona Suave", 60);
        playHarmonicCue("normal");
      } else if (mode === "stressed") {
        triggerHaptic([180], "Acentuada Fuerte", 180);
        playHarmonicCue("stressed");
      } else if (mode === "sustained") {
        triggerHaptic([200, 40, 160], "Sostenida (*)", 400);
        playHarmonicCue("sustained");
      }
    });
  });

  // 8. Modal para Añadir Nueva Palabra
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

      // Extraer palabra limpia para buscar
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
          arasaacId: arasaacId || 2339 // fallback si no encuentra
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

  // 9. Registro de Service Worker para PWA (Instalable en Android)
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch((err) => {
        console.log("Nota sobre Service Worker:", err);
      });
    });
  }
});
