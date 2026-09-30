import sys
import os

# Asegurar que el directorio api y la raíz estén en el path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

try:
    from api.tts import handler
except ImportError:
    from tts import handler

# Vercel puede buscar tanto 'handler' como 'app'
app = handler
