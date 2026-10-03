import asyncio
import os
import edge_tts

VOICE = "es-ES-ElviraNeural"

CLIPS = [
    # Palabras completas para los 4 pares
    {"filename": "word_casa.mp3", "text": "¡Casa!", "rate": "-10%", "pitch": "+0Hz"},
    {"filename": "word_taza.mp3", "text": "¡Taza!", "rate": "-10%", "pitch": "+0Hz"},
    {"filename": "word_pato.mp3", "text": "¡Pato!", "rate": "-10%", "pitch": "+0Hz"},
    {"filename": "word_gato.mp3", "text": "¡Gato!", "rate": "-10%", "pitch": "+0Hz"},
    {"filename": "word_jamon.mp3", "text": "¡Jamón!", "rate": "-10%", "pitch": "+0Hz"},
    {"filename": "word_jabon.mp3", "text": "¡Jabón!", "rate": "-10%", "pitch": "+0Hz"},
    {"filename": "word_pino.mp3", "text": "¡Pino!", "rate": "-10%", "pitch": "+0Hz"},
    {"filename": "word_vino.mp3", "text": "¡Vino!", "rate": "-10%", "pitch": "+0Hz"},

    # Sílabas para CASA vs TAZA
    {"filename": "syl_ca_stressed.mp3", "text": "¡Cá!", "rate": "-15%", "pitch": "+15Hz"},
    {"filename": "syl_sa.mp3", "text": "sa.", "rate": "-15%", "pitch": "-5Hz"},
    {"filename": "syl_ta_stressed.mp3", "text": "¡Tá!", "rate": "-15%", "pitch": "+15Hz"},
    {"filename": "syl_za.mp3", "text": "za.", "rate": "-15%", "pitch": "-5Hz"},

    # Sílabas para PATO vs GATO
    {"filename": "syl_pa_stressed.mp3", "text": "¡Pá!", "rate": "-15%", "pitch": "+15Hz"},
    {"filename": "syl_ga_stressed.mp3", "text": "¡Gá!", "rate": "-15%", "pitch": "+15Hz"},
    {"filename": "syl_to.mp3", "text": "to.", "rate": "-15%", "pitch": "-5Hz"},

    # Sílabas para JAMÓN vs JABÓN
    {"filename": "syl_ja.mp3", "text": "ja.", "rate": "-15%", "pitch": "-5Hz"},
    {"filename": "syl_mon_stressed.mp3", "text": "¡Món!", "rate": "-15%", "pitch": "+15Hz"},
    {"filename": "syl_bon_stressed.mp3", "text": "¡Bón!", "rate": "-15%", "pitch": "+15Hz"},

    # Sílabas para PINO vs VINO
    {"filename": "syl_pi_stressed.mp3", "text": "¡Pí!", "rate": "-15%", "pitch": "+15Hz"},
    {"filename": "syl_vi_stressed.mp3", "text": "¡Ví!", "rate": "-15%", "pitch": "+15Hz"},
    {"filename": "syl_no.mp3", "text": "no.", "rate": "-15%", "pitch": "-5Hz"},
]

async def generate():
    os.makedirs("audio", exist_ok=True)
    for c in CLIPS:
        dest = os.path.join("audio", c["filename"])
        print(f"Generando {c['filename']}...")
        comm = edge_tts.Communicate(text=c["text"], voice=VOICE, rate=c["rate"], pitch=c["pitch"])
        await comm.save(dest)
    print("¡Todos los audios de pares mínimos generados con éxito!")

if __name__ == "__main__":
    asyncio.run(generate())
