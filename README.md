# reels-transcribe

Pipeline en Python para procesar un reel o post publico de Instagram:

1. Extrae el `caption` del post.
2. Si el caption contiene alguna palabra clave configurable, envia ese texto a OpenAI.
3. Si no hay coincidencia, obtiene el media del post y lo transcribe con AssemblyAI.
4. El resultado final tambien se envia a OpenAI para su procesamiento.

## Requisitos

- Python 3.11+
- Credenciales de OpenAI
- Credenciales de AssemblyAI
- `ffmpeg` solo si la transcripcion remota falla y hay que extraer audio localmente

## Instalacion

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

## Uso

```bash
python main.py "https://www.instagram.com/reel/xxxxxxxxxxx/"
```

## Variables de entorno

- `OPENAI_API_KEY`: API key de OpenAI
- `ASSEMBLYAI_API_KEY`: API key de AssemblyAI
- `OPENAI_MODEL`: modelo para procesar el texto final
- `KEYWORDS`: lista separada por comas para filtrar el caption

## Flujo

- Si una keyword aparece en el caption, no se transcribe el video.
- Si no aparece, se intenta transcripcion remota con la URL directa del media.
- Si AssemblyAI no puede leer esa URL, se descarga temporalmente el media y se reintenta con subida local.
