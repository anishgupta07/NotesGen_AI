from dotenv import load_dotenv
load_dotenv()   # MUST be before any core/ imports

from core.audio_processor import process_input
from core.transcriber import transcribe_all
from core.summarizer import summarize, generate_title
from core.extractor import extract_key_concepts, extract_questions

source = "https://www.youtube.com/watch?v=_Q-e_nczWqM&t=223s"
language = "english"   # "english" -> Whisper, "hinglish" -> Sarvam

print("Testing NotesGen AI pipeline components...")

chunks = process_input(source)
transcript = transcribe_all(chunks, language=language)

print("\n" + "=" * 60)
print("📝 TRANSCRIPT PREVIEW")
print("=" * 60)
print(transcript[:500] + "..." if len(transcript) > 500 else transcript)

title = generate_title(transcript)
summary = summarize(transcript)

print("\n" + "=" * 60)
print(f"📌 TITLE: {title}")
print("=" * 60)
print("\n📋 SUMMARY")
print("-" * 60)
print(summary)

key_concepts = extract_key_concepts(transcript)
questions = extract_questions(transcript)

print("\n" + "=" * 60)
print("💡 KEY CONCEPTS")
print("=" * 60)
print(key_concepts)

print("\n" + "=" * 60)
print("❓ STUDY QUESTIONS")
print("=" * 60)
print(questions)