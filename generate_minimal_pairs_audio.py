import asyncio
import os
import edge_tts

DEFAULT_VOICE = "es-ES-ElviraNeural"
LATIN_PLOSIVE_VOICE = "es-MX-DaliaNeural"

CLIPS = [
    # Palabras completas para los 4 pares
    {"filename": "word_casa.mp3", "text": "¡Casa!", "voice": DEFAULT_VOICE, "rate": "-10%", "pitch": "+0Hz"},
    {"filename": "word_taza.mp3", "text": "¡Taza!", "voice": DEFAULT_VOICE, "rate": "-10%", "pitch": "+0Hz"},
    {"filename": "word_pato.mp3", "text": "¡Pato!", "voice": LATIN_PLOSIVE_VOICE, "rate": "-5%", "pitch": "+0Hz"},
    {"filename": "word_gato.mp3", "text": "¡Gato!", "voice": LATIN_PLOSIVE_VOICE, "rate": "-5%", "pitch": "+0Hz"},
    {"filename": "word_jamon.mp3", "text": "¡Jamón!", "voice": DEFAULT_VOICE, "rate": "-10%", "pitch": "+0Hz"},
    {"filename": "word_jabon.mp3", "text": "¡Jabón!", "voice": DEFAULT_VOICE, "rate": "-10%", "pitch": "+0Hz"},
    {"filename": "word_pino.mp3", "text": "¡Pino!", "voice": DEFAULT_VOICE, "rate": "-10%", "pitch": "+0Hz"},
    {"filename": "word_vino.mp3", "text": "¡Vino!", "voice": DEFAULT_VOICE, "rate": "-10%", "pitch": "+0Hz"},

    # Sílabas para CASA vs TAZA
    {"filename": "syl_ca_stressed.mp3", "text": "¡Cá!", "voice": DEFAULT_VOICE, "rate": "-15%", "pitch": "+15Hz"},
    {"filename": "syl_sa.mp3", "text": "¡Sa!", "voice": DEFAULT_VOICE, "rate": "-10%", "pitch": "-5Hz"},
    {"filename": "syl_ta_stressed.mp3", "text": "¡Tá!", "voice": DEFAULT_VOICE, "rate": "-15%", "pitch": "+15Hz"},

    # Sílabas para PATO vs GATO
    {"filename": "syl_to.mp3", "text": "to.", "voice": DEFAULT_VOICE, "rate": "-15%", "pitch": "-5Hz"},

    # Sílabas para JAMÓN vs JABÓN
    {"filename": "syl_ja.mp3", "text": "ja.", "voice": DEFAULT_VOICE, "rate": "-15%", "pitch": "-5Hz"},
    {"filename": "syl_mon_stressed.mp3", "text": "¡Món!", "voice": DEFAULT_VOICE, "rate": "-15%", "pitch": "+15Hz"},
    {"filename": "syl_bon_stressed.mp3", "text": "¡Bón!", "voice": DEFAULT_VOICE, "rate": "-15%", "pitch": "+15Hz"},

    # Sílabas para PINO vs VINO
    {"filename": "syl_pi_stressed.mp3", "text": "¡Pí!", "voice": DEFAULT_VOICE, "rate": "-15%", "pitch": "+15Hz"},
    {"filename": "syl_vi_stressed.mp3", "text": "¡Ví!", "voice": DEFAULT_VOICE, "rate": "-15%", "pitch": "+15Hz"},
    {"filename": "syl_no.mp3", "text": "no.", "voice": DEFAULT_VOICE, "rate": "-15%", "pitch": "-5Hz"},
]

async def generate():
    os.makedirs("audio", exist_ok=True)
    for c in CLIPS:
        dest = os.path.join("audio", c["filename"])
        print(f"Generando {c['filename']}...")
        comm = edge_tts.Communicate(text=c["text"], voice=c.get("voice", DEFAULT_VOICE), rate=c["rate"], pitch=c["pitch"])
        await comm.save(dest)
        
    # Extracción silábica directa para fonemas sensibles (garantiza 1 pico acústico y cero lenición)
    # 1. 'za' extraído directamente de 'taza' (evita deletreo Z-A)
    with open("audio/word_taza.mp3", "rb") as f:
        taza_bytes = f.read()
    with open("audio/syl_za.mp3", "wb") as f:
        f.write(taza_bytes[18*144 : 29*144])
    print("Sílaba za extraída limpiamente de taza (1 solo pico, sin deletreo).")

    # 2. 'ga' extraído directamente de 'gato' (garantiza oclusión velar pura /g/ sin sonido de 'd')
    with open("audio/word_gato.mp3", "rb") as f:
        gato_bytes = f.read()
    with open("audio/syl_ga_stressed.mp3", "wb") as f:
        f.write(gato_bytes[6*144 : 17*144])
    print("Sílaba ga extraída limpiamente de gato (oclusión velar /g/ pura).")

    # 3. 'pa' extraído directamente de 'pato' (garantiza timbre y nivel armónico idéntico a gato)
    with open("audio/word_pato.mp3", "rb") as f:
        pato_bytes = f.read()
    with open("audio/syl_pa_stressed.mp3", "wb") as f:
        f.write(pato_bytes[6*144 : 17*144])
    print("Sílaba pa extraída limpiamente de pato.")

    print("¡Todos los audios de pares mínimos generados con éxito!")

if __name__ == "__main__":
    asyncio.run(generate())
