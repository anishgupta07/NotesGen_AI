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