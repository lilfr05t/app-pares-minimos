from http.server import BaseHTTPRequestHandler
import urllib.parse
import asyncio
import io
import re
import edge_tts

def format_phonetic_text(text, syl_type):
    """
    Formatea el texto fonéticamente para que Edge-TTS pronuncie
    las sílabas aisladas con acentuación y compás clínico infantil.
    """
    clean = text.strip()
    # Si ya tiene puntuación, devolver limpio
    if clean.startswith("¡") or clean.endswith("."):
        return clean
        
    if syl_type == "stressed":
        return f"¡{clean}!"
    elif syl_type == "sustained":
        # Prolongar la última vocal suavemente
        clean_no_star = clean.replace("*", "")
        if re.search(r'[aeiouáéíóú]$', clean_no_star, re.IGNORECASE):
            last_vowel = clean_no_star[-1]
            return f"¡{clean_no_star}{last_vowel * 2}!"
        return f"¡{clean_no_star}!"
    elif syl_type == "word":
        return f"¡{clean}!"
    else:
        # Sílaba normal / átona con punto final para evitar tono interrogativo
        return f"{clean}."

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

        raw_text = params.get('text', [''])[0]
        syl_type = params.get('type', ['normal'])[0]
        voice = params.get('voice', ['es-ES-ElviraNeural'])[0]

        if not raw_text:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"error": "Falta parametro text"}')
            return

        speech_text = format_phonetic_text(raw_text, syl_type)

        # Ajuste de entonación y velocidad según la acentuación
        if syl_type == "stressed":
            rate = params.get('rate', ['-15%'])[0]
            pitch = params.get('pitch', ['+15Hz'])[0]
        elif syl_type == "sustained":
            rate = params.get('rate', ['-30%'])[0]
            pitch = params.get('pitch', ['+10Hz'])[0]
        elif syl_type == "word":
            rate = params.get('rate', ['-10%'])[0]
            pitch = params.get('pitch', ['+0Hz'])[0]
        else:
            rate = params.get('rate', ['-15%'])[0]
            pitch = params.get('pitch', ['-5Hz'])[0]

        async def generate_mp3():
            communicate = edge_tts.Communicate(
                text=speech_text,
                voice=voice,
                rate=rate,
                pitch=pitch
            )
            buffer = io.BytesIO()
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    buffer.write(chunk["data"])
            return buffer.getvalue()

        try:
            mp3_bytes = asyncio.run(generate_mp3())
            if not mp3_bytes:
                raise ValueError("Edge-TTS no devolvió datos de audio")

            self.send_response(200)
            self.send_header('Content-Type', 'audio/mpeg')
            self.send_header('Content-Length', str(len(mp3_bytes)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
            self.end_headers()
            self.wfile.write(mp3_bytes)
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(f'{{"error": "{str(e)}"}}'.encode('utf-8'))
