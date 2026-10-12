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

    # Client strategy order (cloud-IP optimised):
    # Default yt-dlp client provides real audio-only format URLs (140/139/251) on datacenter IPs.
    # Android/iOS clients return SABR-only formats on cloud IPs which have no downloadable URL.
    client_strategies = [
        None,                                                        # Default visionos/web client → formats 140/139/251 have real URLs
        {"youtube": {"player_client": ["android", "ios", "web"]}},  # Combined cascade
        {"youtube": {"player_client": ["android"]}},                 # Android only
        {"youtube": {"player_client": ["ios"]}},                     # iOS only
    ]

    proxy_url = os.getenv("YOUTUBE_PROXY") or os.getenv("PROXY_URL") or os.getenv("HTTPS_PROXY") or os.getenv("HTTP_PROXY")
    clean_proxy = None
    if proxy_url:
        clean_proxy = proxy_url.strip()
        if not clean_proxy.startswith("http://") and not clean_proxy.startswith("https://"):
            clean_proxy = f"http://{clean_proxy}"

    last_error = None
    # If proxy is provided, try with proxy first; if it fails, try without proxy as fallback
    proxy_options = [clean_proxy, None] if clean_proxy else [None]

    # Cookie support: check for cookies.txt file or YOUTUBE_COOKIES environment variable
    cookie_file_path = None
    cookies_env = os.getenv("YOUTUBE_COOKIES")
    local_cookie_file = Path(__file__).resolve().parent.parent / "cookies.txt"
    data_cookie_file = Path(DOWNLOAD_DIR).parent / "cookies.txt"

    if local_cookie_file.exists():
        cookie_file_path = str(local_cookie_file)
    elif data_cookie_file.exists():
        cookie_file_path = str(data_cookie_file)
    elif cookies_env:
        try:
            temp_cookie_file = os.path.join(DOWNLOAD_DIR, "temp_cookies.txt")
            with open(temp_cookie_file, "w", encoding="utf-8") as f:
                f.write(cookies_env.strip())
            cookie_file_path = temp_cookie_file
        except Exception as e:
            print(f"Warning: could not write cookies from env: {e}")

    for current_proxy in proxy_options:
        for extractor_args in client_strategies:
            ydl_opts = {
                "format": "140/139/251/250/249/bestaudio/ba/b/18/best",
                "outtmpl": out_template,
                "noplaylist": True,
                "socket_timeout": 20,
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
            if cookie_file_path and os.path.exists(cookie_file_path):
                ydl_opts["cookiefile"] = cookie_file_path
            if current_proxy:
                ydl_opts["proxy"] = current_proxy
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
