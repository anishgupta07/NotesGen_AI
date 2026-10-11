import os
from typing import Optional, List

WHISPER_MODEL = os.getenv("WHISPER_MODEL", "small")
_local_model = None


def load_local_model():
    """Load local OpenAI Whisper model lazily only when needed."""
    global _local_model
    if _local_model is None:
        import whisper
        print(f"Loading local Whisper model: {WHISPER_MODEL} ...")
        _local_model = whisper.load_model(WHISPER_MODEL)
        print("Local Whisper model loaded.")
    return _local_model


def transcribe_chunk_with_groq(chunk_path: str, api_key: str, language: str = "english") -> Optional[str]:
    """Transcribe audio chunk using Groq's high-speed cloud Whisper API (whisper-large-v3-turbo)."""
    try:
        from groq import Groq
        client = Groq(api_key=api_key)
        is_hindi = language.lower() in ["hinglish", "hindi"]

        with open(chunk_path, "rb") as f:
            file_tuple = (os.path.basename(chunk_path), f.read())

        # If audio is Hindi/Hinglish, translations endpoint converts speech to English text automatically
        if is_hindi:
            res = client.audio.translations.create(
                file=file_tuple,
                model="whisper-large-v3-turbo",
                response_format="text",
            )
        else:
            res = client.audio.transcriptions.create(
                file=file_tuple,
                model="whisper-large-v3-turbo",
                response_format="text",
                language="en",
            )

        if isinstance(res, str):
            return res
        return getattr(res, "text", str(res))
    except Exception as e:
        print(f"Groq cloud transcription notice ({e}). Falling back to local Whisper.")
        return None


def transcribe_chunk(chunk_path: str, language: str = "english", groq_api_key: Optional[str] = None) -> str:
    """Transcribe chunk: prioritizes Groq cloud Whisper, falls back to local Whisper only on local PCs."""
    active_key = groq_api_key or os.getenv("GROQ_API_KEY")
    if active_key:
        groq_text = transcribe_chunk_with_groq(chunk_path, active_key, language=language)
        if groq_text:
            return groq_text

    # Cloud environments (Render, Railway, etc.) have strict 512MB RAM limits.
    # Running local PyTorch Whisper on 512MB RAM triggers kernel OOM SIGKILL (502 Bad Gateway).
    is_cloud = bool(os.getenv("RENDER") or os.getenv("RAILWAY_ENVIRONMENT"))
    if is_cloud:
        raise RuntimeError(
            "Cloud transcription requires an active Groq API Key. "
            "Please click 'Set Groq Key' in the top bar and paste your free Groq key."
        )

    # 2. Local Whisper fallback (for local development machines with sufficient RAM)
    model = load_local_model()
    task = "translate" if language.lower() in ["hinglish", "hindi"] else "transcribe"
    result = model.transcribe(chunk_path, task=task)
    return result.get("text", "")


def transcribe_all(
    chunks: list,
    language: str = "english",
    auto_cleanup: bool = True,
    groq_api_key: Optional[str] = None
) -> str:
    """Transcribe all chunks with automatic temp file cleanup and fallback protection."""
    full_transcript = ""
    active_key = groq_api_key or os.getenv("GROQ_API_KEY")
    if active_key:
        print("Using Groq Cloud Whisper (whisper-large-v3-turbo) for ultra-fast cloud transcription.")
    else:
        print(f"Using local Whisper ({WHISPER_MODEL}) for speech transcription.")

    try:
        for i, chunk in enumerate(chunks):
            print(f"Transcribing chunk {i + 1}/{len(chunks)}...")
            try:
                text = transcribe_chunk(chunk, language=language, groq_api_key=groq_api_key)
                full_transcript += text + " "
            finally:
                if auto_cleanup and os.path.exists(chunk):
                    try:
                        os.remove(chunk)
                        print(f"Deleted temporary audio chunk: {os.path.basename(chunk)}")
                    except Exception as e:
                        print(f"Warning: could not remove chunk {chunk}: {e}")
    finally:
        if auto_cleanup:
            for remaining in chunks:
                if os.path.exists(remaining):
                    try:
                        os.remove(remaining)
                    except Exception:
                        pass

    print("Transcription complete.")
    return full_transcript.strip()
