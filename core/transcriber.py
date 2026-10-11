import os
import whisper

WHISPER_MODEL = os.getenv("WHISPER_MODEL", "small")
_model = None


def load_model():
    """Load local OpenAI Whisper model lazily."""
    global _model
    if _model is None:
        print(f"Loading local Whisper model: {WHISPER_MODEL} ...")
        _model = whisper.load_model(WHISPER_MODEL)
        print("Whisper model loaded.")
    return _model


def transcribe_chunk(chunk_path: str, language: str = "english") -> str:
    """Transcribe an audio chunk using local Whisper without needing any external API keys."""
    model = load_model()
    # For Indian languages/Hindi audio, Whisper translate converts to English text automatically
    task = "translate" if language.lower() in ["hinglish", "hindi"] else "transcribe"
    result = model.transcribe(chunk_path, task=task)
    return result.get("text", "")


def transcribe_all(chunks: list, language: str = "english", auto_cleanup: bool = True) -> str:
    """Transcribe all chunks using local Whisper and automatically remove temporary files to free disk space."""
    full_transcript = ""
    print(f"Using local Whisper ({WHISPER_MODEL}) for speech transcription.")

    try:
        for i, chunk in enumerate(chunks):
            print(f"Transcribing chunk {i + 1}/{len(chunks)}...")
            try:
                text = transcribe_chunk(chunk, language=language)
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
