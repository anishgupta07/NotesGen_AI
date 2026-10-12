import re
from youtube_transcript_api import YouTubeTranscriptApi


def extract_youtube_video_id(url: str) -> str | None:
    """Extract YouTube video ID from various URL formats."""
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'youtu\.be\/([0-9A-Za-z_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


import os
from typing import Optional

def get_proxy_config():
    proxy_url = os.getenv("YOUTUBE_PROXY") or os.getenv("PROXY_URL") or os.getenv("HTTPS_PROXY") or os.getenv("HTTP_PROXY")
    if proxy_url:
        try:
            from youtube_transcript_api.proxies import GenericProxyConfig
            clean_proxy = proxy_url.strip()
            if not clean_proxy.startswith("http://") and not clean_proxy.startswith("https://"):
                clean_proxy = f"http://{clean_proxy}"
            return GenericProxyConfig(http_url=clean_proxy, https_url=clean_proxy)
        except Exception as e:
            print(f"Warning: could not initialize proxy configuration: {e}")
    return None


def fetch_raw_transcript(video_id: str, proxy_config=None):
    """Fetch transcript with thorough language and auto-generated fallback."""
    api = YouTubeTranscriptApi(proxy_config=proxy_config) if proxy_config else YouTubeTranscriptApi()
    
    # 1. Try explicit fetch for common languages
    for langs in (['en', 'en-US', 'en-GB', 'hi', 'hi-Latn'], ['en'], None):
        try:
            if langs:
                obj = api.fetch(video_id, languages=langs)
            else:
                obj = api.fetch(video_id)
            if obj:
                return obj.to_raw_data()
        except Exception:
            pass

    # 2. Try listing all available transcripts (manually created first, then auto-generated)
    try:
        transcript_list = api.list(video_id)
        # Check for English or Hindi manually created
        for lang in ['en', 'hi']:
            try:
                t = transcript_list.find_manually_created_transcript([lang])
                if t:
                    return t.fetch().to_raw_data()
            except Exception:
                pass
        # Check for any generated transcript
        for lang in ['en', 'hi']:
            try:
                t = transcript_list.find_generated_transcript([lang])
                if t:
                    return t.fetch().to_raw_data()
            except Exception:
                pass
        # Fallback to the first available transcript in any language
        for t in transcript_list:
            try:
                return t.fetch().to_raw_data()
            except Exception:
                pass
    except Exception:
        pass

    # 3. Legacy method fallback
    if hasattr(YouTubeTranscriptApi, "get_transcript"):
        for langs in (['en', 'hi'], None):
            try:
                if langs:
                    return YouTubeTranscriptApi.get_transcript(video_id, languages=langs)
                return YouTubeTranscriptApi.get_transcript(video_id)
            except Exception:
                pass
    return None


def get_youtube_transcript_with_timestamps(url: str) -> str | None:
    """Fetch official or auto-generated YouTube subtitles formatted with [MM:SS] timestamps.
    Resilient: tries proxy first if configured, then falls back to direct connection.
    """
    video_id = extract_youtube_video_id(url)
    if not video_id:
        return None

    proxy_config = get_proxy_config()
    transcript_data = None

    # 1. If proxy is configured, try proxy first
    if proxy_config:
        try:
            transcript_data = fetch_raw_transcript(video_id, proxy_config=proxy_config)
        except Exception as e:
            print(f"Proxy transcript attempt failed ({e}). Falling back to direct connection...")

    # 2. If proxy was not configured or failed, try direct connection
    if not transcript_data:
        try:
            transcript_data = fetch_raw_transcript(video_id, proxy_config=None)
        except Exception as e:
            print(f"Direct transcript attempt notice: {e}")

    if not transcript_data:
        return None

    try:
        formatted_transcript = []
        for entry in transcript_data:
            start_seconds = int(entry['start'])
            minutes = start_seconds // 60
            seconds = start_seconds % 60
            timestamp = f"[{minutes:02d}:{seconds:02d}]"
            formatted_transcript.append(f"{timestamp} {entry['text']}")

        return "\n".join(formatted_transcript)
    except Exception as e:
        print(f"Formatting transcript error ({e}).")
        return None


def parse_time_str_to_seconds(time_str: str) -> int:
    """Parse 'MM:SS', 'HH:MM:SS', or total seconds into integer seconds."""
    if not time_str:
        return 0
    clean = time_str.strip().strip("[]()")
    parts = clean.split(":")
    try:
        if len(parts) == 1:
            return int(float(parts[0]))
        elif len(parts) == 2:
            return int(parts[0]) * 60 + int(parts[1])
        elif len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
    except ValueError:
        return 0
    return 0


def filter_transcript_by_timeline(transcript: str, start_time: str | None = None, end_time: str | None = None) -> str:
    """Filter transcript lines to only those falling between start_time and end_time."""
    if not start_time and not end_time:
        return transcript

    start_sec = parse_time_str_to_seconds(start_time) if start_time else 0
    end_sec = parse_time_str_to_seconds(end_time) if end_time else float('inf')

    if end_sec <= start_sec:
        end_sec = float('inf')

    lines = transcript.splitlines()
    filtered_lines = []
    timestamp_pattern = re.compile(r"^\[(?:(\d+):)?(\d+):(\d+)\]")

    for line in lines:
        match = timestamp_pattern.match(line.strip())
        if match:
            h, m, s = match.groups()
            line_sec = (int(h) * 3600 if h else 0) + int(m) * 60 + int(s)
            if start_sec <= line_sec <= end_sec:
                filtered_lines.append(line)
        else:
            if filtered_lines:
                filtered_lines.append(line)

    if not filtered_lines:
        return transcript

    return "\n".join(filtered_lines)