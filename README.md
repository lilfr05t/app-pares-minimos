# FonemaSens - Estimulación Multisensorial del Lenguaje 🗣️✨

Aplicación web móvil (HTML5, CSS3, JavaScript Vanilla) diseñada especialmente para complementar terapias de retraso y desarrollo del lenguaje en niños y pacientes, mediante una experiencia sensorial simultánea: **Visual**, **Táctil (Háptica)** y **Auditiva Híbrida (Audio HD Neuronal + TTS Normalizado)**.

---

## 🌟 Características Principales

### 1. 👁️ Estímulo Visual Dinámico (ARASAAC)
- **Pictogramas Oficiales de ARASAAC**: Carga directa de imágenes en alta resolución certificadas bajo licencia CC (BY-NC-SA).
- **Segmentación Silábica en Tarjetas Interactivas**: Cada sílaba se presenta en burbujas táctiles grandes y coloridas según su categoría.
- **Resaltado y Halo en Tiempo Real**: Durante la reproducción, la sílaba en curso se eleva, pulsa y emite un resplandor característico.
- **Simulador Visual Háptico**: Barra con barras de onda de frecuencia animadas que visualizan el patrón de vibración exacto en cualquier pantalla.

### 2. 📳 Estímulo Táctil Potenciado de Precisión (Motor Háptico)
A través de la API estándar `navigator.vibrate`, la aplicación reproduce patrones de pulso optimizados para superar la inercia de los motores de celulares y fundas protectoras:
- 🍃 **Sílaba Átona / Normal** (ej. `man`, `ro`, `pe`): Pulso nítido y definido (**140 ms**).
- ⚡ **Sílaba Acentuada / Mayúscula** (ej. `CA`, `PE`, `ZA`): Patrón de impacto percutivo de **doble golpe** (**[220ms, 40ms pausa, 100ms]**, total ~360 ms). Genera un golpe táctil inconfundible para que el niño perciba el acento prosódico.
- 〰️ **Sílaba Acentuada y Sostenida / con asterisco** (ej. `CHA*`): Onda táctil prolongada y sostenida (**[380ms, 50ms pausa, 240ms]**, total ~670 ms), acompañando físicamente toda la duración de la vocal estirada.
- 🏆 **Celebración de Palabra Completa:** Secuencia rítmica de triple pulso (**[180, 50, 180, 50, 280]**, total ~740 ms) con confeti.
- 🎚️ **Selector de Potencia en Ajustes (⚙️):**
  - *Moderada / Estándar* (1.0x)
  - *Estimulación Fuerte (Predeterminada para Terapia de Niños)* (1.25x)
  - *Potencia Máxima (Para celulares con fundas gruesas de silicona o hiposensibilidad táctil)* (1.6x)

### 3. 🔊 Motor Auditivo Híbrido de Alta Fidelidad y Sincronización a 0ms (Web Audio API)
Para garantizar una experiencia sensorial óptima en niños con retraso del lenguaje:

- 🎧 **Modo Audio HD Neuronal con Sincronización a Nivel de Muestra (0ms Latency):**
  - Implementa **Web Audio API (`AudioBufferSourceNode`)** cargando y decodificando los clips de audio MP3 directamente en la memoria RAM del dispositivo.
  - Al iniciar la reproducción en `source.start(0)`, el pulso de vibración de `navigator.vibrate` y el resplandor visual de la sílaba se disparan **en el mismo ciclo de reloj**, eliminando el desfase de 150-300ms habitual de las etiquetas `<audio>` estándar.
  - Banco fonético con más de 30 clips neuronales en español (*Edge Neural Elvira*): sílabas átonas, acentuadas, sostenidas, palabras completas y consonantes complejas (`rra`, `rre`, `rro`, `ju`, `gue`, `te`).
- 🤖 **Modo TTS Inteligente con Diccionario Fonético Anti-Acrónimos:**
  - Si se añade una palabra nueva personalizada o se activa el modo TTS, el texto pasa por un algoritmo de normalización fonética:
    - `"na"` $\rightarrow$ `"ná."` (evita la interpretación química de *sodio*).
    - `"ZA"` $\rightarrow$ `"zá."` (evita el deletreo letra a letra de siglas o códigos ISO).
    - `"ju"` $\rightarrow$ `"jú."` (fuerza pronunciación de jota velar /x/ en español, impidiendo "yu").
    - `"rra"` / `"rro"` $\rightarrow$ `"¡Rra!"`, `"¡Rro!"` (el formato de interjección con exclamación activa la vibrante múltiple fuerte y evita que el TTS deletree "erre-erre-a").
    - `"CHA*"` $\rightarrow$ `"cháaa."` (elongación fónica de la vocal sostenida).
- ⏱️ **Cuenta Regresiva Preparatoria con Calentamiento Activo (3s):**
  - Un indicador visual y táctil animado (3... 2... 1... ¡Empieza!) enfoca la atención del niño y del orientador antes de cada secuencia.
  - Durante el conteo, el sistema ejecuta un calentamiento en segundo plano del daemon de síntesis de Android y precarga los buffers de audio, eliminando la latencia en frío y evitando por completo que la primera sílaba o la palabra se entrecorten.
- 🎛️ **Botón Rápido de Modo de Audio en Cabecera (`🎧 HD` / `🤖 TTS`):**
  - Permite al terapeuta alternar con un solo toque entre audios grabados HD y el sintetizador nativo.

---

## 📋 Palabras Prototipo Incluidas (con Audio HD y ARASAAC)

| Palabra | Formato Fonético | Sílabas | Clip Audio HD | Pictograma ARASAAC |
| :--- | :--- | :--- | :--- | :--- |
| **Carro** | `CA-rro` | **CA** (Acentuada ⚡) - **rro** (Átona 🍃) | `syl_ca_stressed`, `syl_rro`, `word_carro` | ID: 2339 |
| **Perro** | `PE-rro` | **PE** (Acentuada ⚡) - **rro** (Átona 🍃) | `syl_pe_stressed`, `syl_rro`, `word_perro` | ID: 7202 |
| **Baño** | `BA-ño` | **BA** (Acentuada ⚡) - **ño** (Átona 🍃) | `syl_ba_stressed`, `syl_no`, `word_bano` | ID: 6929 |
| **Pelota** | `pe-LO-ta` | **pe** (Átona 🍃) - **LO** (Acentuada ⚡) - **ta** (Átona 🍃) | `syl_pe`, `syl_lo_stressed`, `syl_ta`, `word_pelota` | ID: 3241 |
| **Manzana** | `man-ZA-na` | **man** (Átona 🍃) - **ZA** (Acentuada ⚡) - **na** (Átona 🍃) | `syl_man`, `syl_za_stressed`, `syl_na`, `word_manzana` | ID: 2462 |
| **Cuchara** | `cu-CHA*-ra` | **cu** (Átona 🍃) - **CHA\*** (Sostenida 〰️) - **ra** (Átona 🍃) | `syl_cu`, `syl_cha_sustained`, `syl_ra`, `word_cuchara` | ID: 2362 |

> **➕ Nuevas Palabras y Banco Silábico:** Puedes pulsar **"+ Nueva"** para ingresar cualquier palabra (ej. `ju-GUE-te` o `pe-RRA`). La app cuenta con clips neuronales pregrabados para sílabas frecuentes y utiliza el TTS normalizado para cualquier otra combinación.

---

## 📱 Modos de Uso Terapéutico

1. **Modo Secuencia ("Escuchar y Sentir")**:
   - Cuenta regresiva preparatoria de 3s con pulsos rítmicos $\rightarrow$ Sílaba 1 (luz + vibración + audio en exacta sincronía t=0) $\rightarrow$ Pausa $\rightarrow$ Sílaba 2 $\rightarrow$ ... $\rightarrow$ Palabra completa con resplandor y lluvia de confeti.
2. **Modo Exploratorio (Tocar Sílabas)**:
   - El niño o terapeuta puede tocar cualquier sílaba individual para sentir su vibración, escucharla y verla repetidas veces a su propio ritmo.
3. **Modo Lento ("Decir Más Lento")**:
   - Pronunciación pausada para facilitar la imitación articulatoria.
4. **Modo Palabra Completa**:
   - Pronunciación fluida continua de la palabra para consolidar el vocabulario.
5. **Edición y Eliminación de Palabras (✏️ / 🗑️):**
   - En la esquina superior de la tarjeta principal, el terapeuta puede pulsar **✏️** para modificar la estructura silábica o cambiar el término de búsqueda ARASAAC, o pulsar **🗑️** para eliminarla de la colección.
   - En el estante de palabras, el botón **"↺ Iniciales"** permite restaurar las 6 palabras prototipo originales en cualquier momento.
6. **Verificación Fonética en Ajustes (⚙️):**
   - Botones dedicados para probar directamente la pronunciación de `"ZA"`, `"na"`, `"ju"`, `"rra"` y `"CHA*"` y comprobar la claridad en vivo tanto en Audio HD como en TTS.

---

## 🔬 Soluciones Fonéticas Clave: ¿Cómo se solucionaron los problemas de audio?

### 1. ¿Por qué las sílabas con erre como "rra" se pronunciaban mal?
En la ortografía del español, ninguna palabra comienza con doble erre (`rr`). Cuando los sintetizadores de voz de los celulares reciben una sílaba aislada como `"rra."`, muchos motores la interpretan como un error de escritura y proceden a **deletrearla** (*"erre-erre-a"*), o si se reemplazaba simplemente por `"ra"` sonaba como una vibrante simple débil sin trino.
- **Solución implementada:** Se integró la normalización con formato de interjección enfática española (`¡Rra!`, `¡Rro!`, `¡Rré!`). Al llevar los signos de exclamación `¡... !`, el motor fonético de Android/iOS lo interpreta como una expresión onomatopéyica nativa, pronunciando la **vibrante múltiple sonora [r]** con máxima articulación sin deletrearla.
- Además, en **Modo Audio HD**, se incorporaron archivos de audio neuronales grabados específicamente para `syl_rra.mp3` y `syl_rra_stressed.mp3`.

### 2. ¿Por qué algunos celulares pronunciaban "ju" como "yu"?
En teléfonos con sintetizadores multilingües, `"ju"` aislado coincide con palabras germánicas donde la **J** suena como semiconsonante **/j/** (*"yu"*).
- **Solución implementada:** Se fuerza acentuación aguda (`jú.`, `já.`, `jé.`, `jí.`, `jó.`), activando obligatoriamente la regla de fonología española (/xu/).

### 3. ¿Por qué el TTS se entrecortaba al principio y cómo lo soluciona el contador?
En teléfonos móviles, el daemon de voz del sistema operativo entra en reposo para ahorrar batería. Al disparar la primera sílaba, el proceso tardaba entre 400 y 800 ms en despertar, provocando que la primera sílaba no sonara o se cortara a la mitad.
- **Solución implementada:** La **cuenta regresiva preparatoria de 3 segundos** no solo anticipa el momento exacto al niño y al orientador, sino que emite una pequeña señal inaudible de baja latencia que activa y estabiliza el motor de audio y voz antes de iniciar la primera sílaba.

---

## 🚀 Cómo Probar la App Localmente

### Opción A: Servidor local (Recomendado para celulares en la misma red Wi-Fi)
Ya hay un servidor HTTP ligero ejecutándose en el puerto 8000:
- Abre en tu navegador de PC: [http://localhost:8000](http://localhost:8000)
- Abre en el navegador de tu celular: `http://<IP-DE-TU-PC>:8000`

### Opción B: Directo en el navegador
Puedes hacer doble clic en el archivo [index.html](file:///c:/Users/enz0l/OneDrive/Desktop/TESTEO%20HTML/index.html) para abrirlo directamente en Chrome, Edge o Firefox.

---

## 🌐 Cómo Hostear Gratis en 1 Minuto

Dado que es una aplicación web estática (HTML5, CSS, JS y MP3s sin dependencias pesadas), se puede hostear gratis en:

### 1. GitHub Pages (100% Gratis y Recomendado)
1. Sube los archivos del proyecto a un repositorio en GitHub.
2. Ve a **Settings** > **Pages** > En **Branch** selecciona `main` y guarda.
3. En segundos tendrás tu enlace público HTTPS listo para abrir en cualquier teléfono.

### 2. Vercel o Netlify (Arrastrar y Soltar)
1. Entra a [netlify.com](https://www.netlify.com) o [vercel.com](https://vercel.com).
2. Simplemente arrastra la carpeta `TESTEO HTML` al panel de subida.
3. Se generará un enlace HTTPS seguro de inmediato.

---

## 📲 Nota Técnica sobre la Vibración Háptica en Móviles
- **En Android (Chrome / Firefox / Samsung Internet)**: La API de vibración requiere que el usuario interactúe con la pantalla al menos una vez por políticas de seguridad del navegador. Al presionar "Escuchar y Sentir" o cualquier sílaba, la vibración comenzará a responder.
- **En dispositivos sin motor de vibración (computadoras o iOS)**: La barra superior cuenta con un **simulador visual háptico** que oscila y vibra visualmente en tiempo real para que los padres o terapeutas puedan observar con precisión el estímulo háptico correspondiente.
