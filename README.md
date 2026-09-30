# FonemaSens - Estimulación Multisensorial del Lenguaje 🗣️✨

Aplicación web móvil (HTML5, CSS3, JavaScript Vanilla) diseñada especialmente para complementar terapias de retraso y desarrollo del lenguaje en niños y pacientes, mediante una experiencia sensorial simultánea: **Visual**, **Táctil (Háptica)** y **Auditiva (TTS)**.

---

## 🌟 Características Principales

### 1. 👁️ Estímulo Visual Dinámico (ARASAAC)
- **Pictogramas Oficiales de ARASAAC**: Carga directa de imágenes en alta resolución certificadas bajo licencia CC (BY-NC-SA).
- **Segmentación Silábica en Tarjetas Interactivas**: Cada sílaba se presenta en burbujas táctiles grandes y coloridas según su categoría.
- **Resaltado y Halo en Tiempo Real**: Durante la reproducción, la sílaba en curso se eleva, pulsa y emite un resplandor característico.
- **Simulador Visual Háptico**: Barra con barras de onda de frecuencia animadas que visualizan el patrón de vibración exacto en cualquier pantalla.

### 2. 📳 Estímulo Táctil de Precisión (Motor Háptico)
A través de la API estándar `navigator.vibrate`, la aplicación reproduce tres patrones de estímulo táctil definidos clínicamente:
- 🍃 **Sílaba Átona / Normal** (ej. `man`, `ro`, `pe`): Vibración suave y corta (**60 ms**).
- ⚡ **Sílaba Acentuada / Mayúscula** (ej. `CA`, `PE`, `ZA`): Vibración fuerte y seca (**180 ms**).
- 〰️ **Sílaba Acentuada y Sostenida / con asterisco** (ej. `CHA*`): Vibración fuerte y prolongada (**360 ms - 400 ms**).

### 3. 🔊 Estímulo Auditivo Sincronizado (Text-To-Speech)
- **Web Speech API**: Motor de síntesis de voz nativo en español con ajuste dinámico de tono y velocidad.
- **Inflexión de Tono**: Las sílabas acentuadas se emiten con un tono (pitch) más agudo (1.35x) para marcar la prosodia.
- **Alargamiento Fonético**: Las sílabas sostenidas (`*`) se reproducen a velocidad reducida (0.55x) y alargando la vocal de apoyo.
- **Tonos Armónicos Complementarios**: Generador de audio de frecuencias puras con la Web Audio API para reforzar la discriminación auditiva.

---

## 📋 Palabras Prototipo Incluidas

La app viene preconfigurada con las 6 palabras solicitadas y sus pictogramas oficiales:
1. `CA-rro` 🚗 (CA = Acentuada, rro = Átona)
2. `PE-rro` 🐶 (PE = Acentuada, rro = Átona)
3. `BA-ño` 🚽 (BA = Acentuada, ño = Átona)
4. `pe-LO-ta` ⚽ (pe = Átona, LO = Acentuada, ta = Átona)
5. `man-ZA-na` 🍎 (man = Átona, ZA = Acentuada, na = Átona)
6. `cu-CHA*-ra` 🥄 (cu = Átona, CHA* = Sostenida, ra = Átona)

> **➕ Puedes añadir más palabras:** Usa el botón **"+ Nueva"** dentro de la app con el formato fonético (ej. `PLA-ta-no` o `ju-GUE*-te`) y el sistema buscará automáticamente el pictograma oficial en la API de ARASAAC.

---

## 📱 Modos de Uso Terapéutico

1. **Modo Secuencia ("Escuchar y Sentir")**:
   - Reproduce la palabra paso a paso: Sílaba 1 (luz + vibración + voz) $\rightarrow$ Pausa para procesar $\rightarrow$ Sílaba 2 $\rightarrow$ ... $\rightarrow$ Palabra completa con resplandor y lluvia de confeti.
2. **Modo Exploratorio (Tocar Sílabas)**:
   - El niño o terapeuta puede tocar cualquier sílaba individual para sentir su vibración, escucharla y verla repetidas veces a su propio ritmo.
3. **Modo Lento ("Decir Más Lento")**:
   - Pronunciación pausada para facilitar la imitación articulatoria.
4. **Modo Palabra Completa**:
   - Pronunciación fluida continua de la palabra para consolidar el vocabulario.

---

## 🚀 Cómo Probar la App Localmente

### Opción A: Servidor local (Recomendado para celulares en la misma red Wi-Fi)
Ya hay un servidor HTTP ligero ejecutándose en el puerto 8000:
- Abre en tu navegador: `http://localhost:8000`
- O abre en el navegador de tu celular: `http://<IP-DE-TU-PC>:8000`

### Opción B: Directo en el navegador
Puedes hacer doble clic en el archivo [index.html](file:///c:/Users/enz0l/OneDrive/Desktop/TESTEO%20HTML/index.html) para abrirlo directamente en Chrome, Edge o Firefox.

---

## 🌐 Cómo Hostear Gratis en 1 Minuto

Dado que es una aplicación web estática (Vanilla HTML5, CSS y JS sin dependencias ni compiladores pesados), se puede hostear gratis en cualquiera de estas plataformas:

### 1. GitHub Pages (100% Gratis y Recomendado)
1. Crea un repositorio en GitHub (ej. `fonemasens`).
2. Sube los archivos (`index.html`, `styles.css`, `app.js`, `manifest.json`, `sw.js`).
3. Ve a **Settings** > **Pages** > En **Branch** selecciona `main` y guarda.
4. En segundos tendrás tu enlace HTTPS público listo para abrir en cualquier celular.

### 2. Vercel o Netlify (Arrastrar y Soltar)
1. Entra a [netlify.com](https://www.netlify.com) o [vercel.com](https://vercel.com).
2. Simplemente arrastra la carpeta `TESTEO HTML` al panel de subida.
3. Se generará un enlace HTTPS seguro inmediatamente.

---

## 📲 Nota Técnica sobre la Vibración Háptica en Móviles
- **En Android (Chrome / Firefox / Samsung Internet)**: La API de vibración requiere que el usuario toque la pantalla al menos una vez para activarse por políticas de seguridad del navegador. Al presionar "Escuchar y Sentir" o cualquier sílaba, la vibración comenzará a responder.
- **En dispositivos sin motor de vibración (computadoras o iOS)**: La barra superior cuenta con un **simulador visual háptico** que oscila y vibra visualmente en tiempo real para que los padres o terapeutas puedan observar con precisión el estímulo háptico correspondiente.
