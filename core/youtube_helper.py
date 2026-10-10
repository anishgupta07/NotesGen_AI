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


def get_youtube_transcript_with_timestamps(url: str) -> str | None:
    """Fetch official or auto-generated YouTube subtitles formatted with [MM:SS] timestamps.
    Returns None if subtitles are unavailable or disabled.
    """
    video_id = extract_youtube_video_id(url)
    if not video_id:
        return None

    try:
        # Supports both youtube-transcript-api 1.x (fetch) and legacy (<1.0 get_transcript)
        api = YouTubeTranscriptApi()
        if hasattr(api, "fetch"):
            transcript_obj = api.fetch(video_id, languages=['en', 'hi'])
            transcript_data = transcript_obj.to_raw_data()
        elif hasattr(YouTubeTranscriptApi, "get_transcript"):
            transcript_data = YouTubeTranscriptApi.get_transcript(video_id, languages=['en', 'hi'])
        else:
            raise AttributeError("No supported transcript fetch method found on YouTubeTranscriptApi")

        formatted_transcript = []
        for entry in transcript_data:
            start_seconds = int(entry['start'])
            minutes = start_seconds // 60
            seconds = start_seconds % 60
            timestamp = f"[{minutes:02d}:{seconds:02d}]"
            formatted_transcript.append(f"{timestamp} {entry['text']}")

        return "\n".join(formatted_transcript)
    except Exception as e:
        print(f"Direct YouTube subtitle fetch failed ({e}). Falling back to audio Whisper transcription...")
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