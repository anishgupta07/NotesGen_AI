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


def cleanup_downloads_dir() -> None:
    """Remove any lingering temporary audio or download files in data/downloads."""
    if os.path.exists(DOWNLOAD_DIR):
        for item in os.listdir(DOWNLOAD_DIR):
            item_path = os.path.join(DOWNLOAD_DIR, item)
            # Never delete cookie files
            if "cookie" in item.lower():
                continue
            if os.path.isfile(item_path):
                try:
                    os.remove(item_path)
                except Exception:
                    pass


def download_youtube_audio(url: str) -> str:
    """Download audio from a YouTube video URL, converting to lightweight 64kbps MP3 format
    to prevent cloud disk space exhaustion (Errno 28: No space left on device)."""
    cleanup_downloads_dir()

    video_id = extract_youtube_video_id(url)
    if not video_id and "list=" in url and "v=" not in url:
        raise ValueError(
            "The provided link appears to be a full playlist. "
            "Please provide a specific video URL (e.g. https://www.youtube.com/watch?v=...)."
        )

    clean_url = f"https://www.youtube.com/watch?v={video_id}" if video_id else url
    target_id = video_id or f"audio_{uuid.uuid4().hex[:8]}"
    out_template = os.path.join(DOWNLOAD_DIR, f"{target_id}.%(ext)s")
    expected_mp3 = os.path.join(DOWNLOAD_DIR, f"{target_id}.mp3")

    ffmpeg_exe = shutil.which("ffmpeg")
    ffmpeg_dir = os.path.dirname(ffmpeg_exe) if ffmpeg_exe else None

    # Client strategy order (cloud-IP optimised):
    client_strategies = [
        None,                                                        # Default visionos/web client
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
    proxy_options = [clean_proxy, None] if clean_proxy else [None]

    # Cookie support
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
                # Format ba/b/18 with lightweight 64kbps MP3 postprocessor saves 95% disk space
                "format": "ba/b/18/140/139/251/250/249/bestaudio/best",
                "outtmpl": out_template,
                "noplaylist": True,
                "socket_timeout": 25,
                "ffmpeg_location": ffmpeg_dir,
                "js_runtimes": {"deno": {}, "node": {}},
                "remote_components": ["ejs:github"],
                "postprocessors": [
                    {
                        "key": "FFmpegExtractAudio",
                        "preferredcodec": "mp3",
                        "preferredquality": "64",
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
                if os.path.exists(expected_mp3):
                    return expected_mp3
                # Fallback check for any generated audio matching target_id
                for f in os.listdir(DOWNLOAD_DIR):
                    if f.startswith(target_id) and f.endswith((".mp3", ".m4a", ".wav", ".webm")):
                        return os.path.join(DOWNLOAD_DIR, f)
            except Exception as e:
                last_error = e
                continue

    if not os.path.exists(expected_mp3):
        for f in os.listdir(DOWNLOAD_DIR):
            if f.startswith(target_id) and f.endswith((".mp3", ".m4a", ".wav", ".webm")):
                return os.path.join(DOWNLOAD_DIR, f)
        raise RuntimeError(f"Could not download audio from YouTube video: {last_error or 'Unknown error'}")

    return expected_mp3


def convert_to_mp3(input_path: str) -> str:
    """Convert any local audio/video file to compressed MP3 format using pydub."""
    file_id = f"local_{uuid.uuid4().hex[:8]}"
    output_path = os.path.join(DOWNLOAD_DIR, f"{file_id}.mp3")
    audio = AudioSegment.from_file(input_path)
    audio = audio.set_channels(1).set_frame_rate(16000)
    audio.export(output_path, format="mp3", bitrate="64k")
    return output_path


def chunk_audio(audio_path: str, chunk_minutes: int = 10) -> list:
    """Splits audio into compressed MP3 chunks of `chunk_minutes`. Immediately removes original audio_path to save disk space."""
    audio = AudioSegment.from_file(audio_path)
    chunk_ms = chunk_minutes * 60 * 1000

    chunks = []
    base_name = os.path.splitext(audio_path)[0]

    for i, start in enumerate(range(0, len(audio), chunk_ms)):
        chunk = audio[start: start + chunk_ms]
        chunk_path = f"{base_name}_chunk_{i}.mp3"
        chunk.export(chunk_path, format="mp3", bitrate="64k")
        chunks.append(chunk_path)

    # Immediately delete the parent audio file to save disk space
    if os.path.exists(audio_path):
        try:
            os.remove(audio_path)
        except Exception as e:
            print(f"Warning: could not delete parent audio {audio_path}: {e}")

    return chunks


def cleanup_audio_files(file_paths: list[str]) -> None:
    """Delete a list of temporary audio files safely."""
    for path in file_paths:
        if path and os.path.exists(path):
            try:
                os.remove(path)
            except Exception as e:
                print(f"Warning: could not delete {path}: {e}")


def process_input(source: str) -> list:
    """Process a YouTube URL or local file into manageable 10-minute compressed MP3 audio chunks."""
    cleanup_downloads_dir()

    if source.startswith("http://") or source.startswith("https://"):
        print("Detected YouTube URL. Downloading audio as compressed MP3...")
        audio_path = download_youtube_audio(source)
    else:
        print("Detected local file. Converting to MP3...")
        audio_path = convert_to_mp3(source)

    print("Chunking audio into 64kbps MP3s...")
    chunks = chunk_audio(audio_path)
    print(f"Audio ready — {len(chunks)} chunk(s) created.")
    return chunks
