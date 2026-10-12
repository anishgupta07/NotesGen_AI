import os
import shutil
import uuid
from pathlib import Path
import static_ffmpeg
static_ffmpeg.add_paths()

import subprocess
import yt_dlp
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
    """Convert any local audio/video file to compressed MP3 format using FFmpeg (zero Python RAM)."""
    file_id = f"local_{uuid.uuid4().hex[:8]}"
    output_path = os.path.join(DOWNLOAD_DIR, f"{file_id}.mp3")
    ffmpeg_exe = shutil.which("ffmpeg") or "ffmpeg"
    cmd = [
        ffmpeg_exe, "-y",
        "-i", input_path,
        "-vn",
        "-ar", "16000",
        "-ac", "1",
        "-b:a", "64k",
        output_path
    ]
    import subprocess
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    return output_path


def chunk_audio(audio_path: str, max_chunk_mb: int = 22) -> list:
    """Zero-RAM audio handler:
    1. If MP3 is <= 22MB, returns [audio_path] directly.
       Zero RAM, zero extra disk writes, direct upload to Groq Whisper.
    2. If > 22MB, streams directly via FFmpeg without loading audio into Python memory.
    """
    if not os.path.exists(audio_path):
        return []

    file_size_mb = os.path.getsize(audio_path) / (1024 * 1024)
    # Most YouTube videos up to 45 mins at 64k are < 22MB, so no chunking is needed at all!
    if file_size_mb <= max_chunk_mb:
        print(f"Audio file is {file_size_mb:.2f} MB (within 24MB Groq limit) — processing directly without chunking.")
        return [audio_path]

    print(f"Audio file is {file_size_mb:.2f} MB (>22MB limit) — segmenting via streaming FFmpeg...")
    ffmpeg_exe = shutil.which("ffmpeg") or "ffmpeg"
    base_name = os.path.splitext(audio_path)[0]
    output_pattern = f"{base_name}_part_%03d.mp3"

    import subprocess
    cmd = [
        ffmpeg_exe, "-y",
        "-i", audio_path,
        "-f", "segment",
        "-segment_time", "600",
        "-c", "copy",
        output_pattern
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

    chunk_dir = os.path.dirname(audio_path)
    prefix = os.path.basename(base_name) + "_part_"
    chunks = sorted([
        os.path.join(chunk_dir, f)
        for f in os.listdir(chunk_dir)
        if f.startswith(prefix) and f.endswith(".mp3")
    ])

    if chunks:
        try:
            os.remove(audio_path)
        except Exception:
            pass
        return chunks

    return [audio_path]


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
