import os
import shutil
import uuid
from pathlib import Path
import static_ffmpeg
static_ffmpeg.add_paths()

import yt_dlp
from pydub import AudioSegment
from core.youtube_helper import extract_youtube_video_id

DOWNLOAD_DIR = str(Path(__file__).resolve().parent.parent / "data" / "downloads")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)


def download_youtube_audio(url: str) -> str:
    """Download audio from a YouTube video URL, converting to 16kHz mono WAV format."""
    video_id = extract_youtube_video_id(url)
    
    if not video_id and "list=" in url and "v=" not in url:
        raise ValueError(
            "The provided link appears to be a full playlist. "
            "Please provide a specific video URL (e.g. https://www.youtube.com/watch?v=...)."
        )

    clean_url = f"https://www.youtube.com/watch?v={video_id}" if video_id else url
    target_id = video_id or f"audio_{uuid.uuid4().hex[:8]}"
    out_template = os.path.join(DOWNLOAD_DIR, f"{target_id}.%(ext)s")
    expected_wav = os.path.join(DOWNLOAD_DIR, f"{target_id}.wav")

    ffmpeg_exe = shutil.which("ffmpeg")
    ffmpeg_dir = os.path.dirname(ffmpeg_exe) if ffmpeg_exe else None

    # Resilient multi-client strategy: try android client first (bypasses EJS cipher challenges), then default, then web/mweb
    client_strategies = [
        {"youtube": {"player_client": ["android"]}},  # Android client bypasses EJS cipher and provides direct audio
        None,                                          # Default smart multi-client extraction (visionos/web)
        {"youtube": {"player_client": ["web"]}},
        {"youtube": {"player_client": ["mweb"]}},
        {"youtube": {"player_client": ["ios", "web"]}},
    ]

    last_error = None
    for extractor_args in client_strategies:
        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": out_template,
            "noplaylist": True,
            "ffmpeg_location": ffmpeg_dir,
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "wav",
                    "preferredquality": "192",
                }
            ],
            "quiet": True,
            "no_warnings": True,
        }
        if extractor_args:
            ydl_opts["extractor_args"] = extractor_args

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.extract_info(clean_url, download=True)
            if os.path.exists(expected_wav):
                return expected_wav
            # Fallback check for any generated wav matching target_id
            for f in os.listdir(DOWNLOAD_DIR):
                if f.startswith(target_id) and f.endswith(".wav"):
                    return os.path.join(DOWNLOAD_DIR, f)
        except Exception as e:
            last_error = e
            continue

    if not os.path.exists(expected_wav):
        # Final fallback check for any generated wav matching target_id
        for f in os.listdir(DOWNLOAD_DIR):
            if f.startswith(target_id) and f.endswith(".wav"):
                return os.path.join(DOWNLOAD_DIR, f)
        raise RuntimeError(f"Could not download audio from YouTube video: {last_error or 'Unknown error'}")

    return expected_wav


def convert_to_wav(input_path: str) -> str:
    """Convert any local audio/video file to WAV format using pydub."""
    file_id = f"local_{uuid.uuid4().hex[:8]}"
    output_path = os.path.join(DOWNLOAD_DIR, f"{file_id}.wav")
    audio = AudioSegment.from_file(input_path)
    audio = audio.set_channels(1).set_frame_rate(16000)
    audio.export(output_path, format="wav")
    return output_path


def chunk_audio(wav_path: str, chunk_minutes: int = 10) -> list:
    """Splits WAV audio into chunks of `chunk_minutes`. Immediately removes original wav_path to save space."""
    audio = AudioSegment.from_wav(wav_path)
    chunk_ms = chunk_minutes * 60 * 1000

    chunks = []
    base_name = os.path.splitext(wav_path)[0]

    for i, start in enumerate(range(0, len(audio), chunk_ms)):
        chunk = audio[start: start + chunk_ms]
        chunk_path = f"{base_name}_chunk_{i}.wav"
        chunk.export(chunk_path, format="wav")
        chunks.append(chunk_path)

    # Immediately delete the parent WAV file to save disk space
    if os.path.exists(wav_path):
        try:
            os.remove(wav_path)
        except Exception as e:
            print(f"Warning: could not delete parent wav {wav_path}: {e}")

    return chunks


def cleanup_audio_files(file_paths: list[str]) -> None:
    """Delete a list of temporary audio files safely."""
    for path in file_paths:
        if path and os.path.exists(path):
            try:
                os.remove(path)
            except Exception as e:
                print(f"Warning: could not delete {path}: {e}")


def cleanup_downloads_dir() -> None:
    """Remove any lingering temporary audio or download files in data/downloads."""
    if os.path.exists(DOWNLOAD_DIR):
        for item in os.listdir(DOWNLOAD_DIR):
            item_path = os.path.join(DOWNLOAD_DIR, item)
            if os.path.isfile(item_path):
                try:
                    os.remove(item_path)
                except Exception:
                    pass


def process_input(source: str) -> list:
    """Process a YouTube URL or local file into manageable 10-minute audio chunks."""
    if source.startswith("http://") or source.startswith("https://"):
        print("Detected YouTube URL. Downloading audio...")
        wav_path = download_youtube_audio(source)
    else:
        print("Detected local file. Converting to WAV...")
        wav_path = convert_to_wav(source)

    print("Chunking audio...")
    chunks = chunk_audio(wav_path)
    print(f"Audio ready — {len(chunks)} chunk(s) created.")
    return chunks
