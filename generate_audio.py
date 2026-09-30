import asyncio
import os
import edge_tts

VOICE = "es-ES-ElviraNeural"  # Voz neuronal de alta definición en español

CLIPS = [
    # Palabras completas
    {"filename": "word_carro.mp3", "text": "¡Carro!", "rate": "-10%", "pitch": "+0Hz"},
    {"filename": "word_perro.mp3", "text": "¡Perro!", "rate": "-10%", "pitch": "+0Hz"},
    {"filename": "word_bano.mp3", "text": "¡Baño!", "rate": "-10%", "pitch": "+0Hz"},
    {"filename": "word_pelota.mp3", "text": "¡Pelota!", "rate": "-10%", "pitch": "+0Hz"},
    {"filename": "word_manzana.mp3", "text": "¡Manzana!", "rate": "-10%", "pitch": "+0Hz"},
    {"filename": "word_cuchara.mp3", "text": "¡Cuchara!", "rate": "-10%", "pitch": "+0Hz"},

    # Sílabas para CA-rro
    {"filename": "syl_ca_stressed.mp3", "text": "¡Cá!", "rate": "-15%", "pitch": "+15Hz"},
    {"filename": "syl_rro.mp3", "text": "rro.", "rate": "-15%", "pitch": "-5Hz"},

    # Sílabas para PE-rro
    {"filename": "syl_pe_stressed.mp3", "text": "¡Pé!", "rate": "-15%", "pitch": "+15Hz"},

    # Sílabas para BA-ño
    {"filename": "syl_ba_stressed.mp3", "text": "¡Bá!", "rate": "-15%", "pitch": "+15Hz"},
    {"filename": "syl_no.mp3", "text": "ño.", "rate": "-15%", "pitch": "-5Hz"},

    # Sílabas para pe-LO-ta
    {"filename": "syl_pe.mp3", "text": "pe.", "rate": "-15%", "pitch": "-5Hz"},
    {"filename": "syl_lo_stressed.mp3", "text": "¡Ló!", "rate": "-15%", "pitch": "+15Hz"},
    {"filename": "syl_ta.mp3", "text": "ta.", "rate": "-15%", "pitch": "-5Hz"},

    # Sílabas para man-ZA-na
    {"filename": "syl_man.mp3", "text": "man.", "rate": "-15%", "pitch": "-5Hz"},
    {"filename": "syl_za_stressed.mp3", "text": "¡Zá!", "rate": "-15%", "pitch": "+15Hz"},
    {"filename": "syl_na.mp3", "text": "na.", "rate": "-15%", "pitch": "-5Hz"},

    # Sílabas para cu-CHA*-ra
    {"filename": "syl_cu.mp3", "text": "cu.", "rate": "-15%", "pitch": "-5Hz"},
    {"filename": "syl_cha_sustained.mp3", "text": "¡Cháaa!", "rate": "-35%", "pitch": "+10Hz"},
    {"filename": "syl_ra.mp3", "text": "ra.", "rate": "-15%", "pitch": "-5Hz"},
]

async def generate_all():
    os.makedirs("audio", exist_ok=True)
    for clip in CLIPS:
        filepath = os.path.join("audio", clip["filename"])
        print(f"Generando {clip['filename']} con texto: '{clip['text']}'...")
        communicate = edge_tts.Communicate(
            text=clip["text"],
            voice=VOICE,
            rate=clip["rate"],
            pitch=clip["pitch"]
        )
        await communicate.save(filepath)
    print("¡Todos los audios HD fueron generados con éxito!")

if __name__ == "__main__":
    asyncio.run(generate_all())
