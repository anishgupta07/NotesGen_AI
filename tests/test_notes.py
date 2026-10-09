import sys
from pathlib import Path

# Add project root to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from dotenv import load_dotenv
load_dotenv()
from core.notes_generator import generate_video_notes
from core.youtube_helper import get_youtube_transcript_with_timestamps

# Test with any educational YouTube video
test_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # Replace with educational video URL

print("1. Fetching transcript...")
transcript = get_youtube_transcript_with_timestamps(test_url)

if not transcript:
    print("Captions not found, testing with sample text.")
    transcript = "[00:00] Introduction to Python lists. [01:30] How to append items to a list."

print("2. Generating study notes in Hinglish...")
notes = generate_video_notes(transcript, style="study_guide", language="hinglish")

print("\n" + "=" * 60)
print(notes)
print("=" * 60)