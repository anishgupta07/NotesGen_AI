import uuid
from dotenv import load_dotenv
from core.youtube_helper import get_youtube_transcript_with_timestamps
from core.audio_processor import process_input
from core.transcriber import transcribe_all
from core.summarizer import generate_title
from core.notes_generator import generate_video_notes
from core.guardrail import check_video_educational
from rag.isolated_engine import build_isolated_vector_store, query_isolated_rag

load_dotenv()


def run_pipeline(source: str, language: str = "hinglish", style: str = "detailed") -> dict:
    print("\n🚀 Starting NotesGen AI...")

    # Fast path: check for YouTube subtitles first
    transcript = None
    if "youtube.com" in source or "youtu.be" in source:
        print("Checking for YouTube subtitles...")
        transcript = get_youtube_transcript_with_timestamps(source)

    if not transcript:
        print("Processing audio and transcribing speech...")
        chunks = process_input(source)
        transcript = transcribe_all(chunks, language)

    # Educational guardrail check
    is_educational, guardrail_msg = check_video_educational(transcript, title=source)
    if not is_educational:
        print(f"\n🛡️ Guardrail Block: {guardrail_msg}")
        return None

    # Generate title
    title = generate_title(transcript)

    # Generate structured study notes
    print(f"Generating {style} notes in {language}...")
    notes = generate_video_notes(transcript, style=style, language=language)

    # Build isolated vector store
    chat_id = f"cli_{uuid.uuid4().hex[:8]}"
    print("Indexing transcript into vector database...")
    build_isolated_vector_store(chat_id, transcript)

    return {
        "chat_id": chat_id,
        "title": title,
        "transcript": transcript,
        "notes": notes,
        "language": language,
    }


if __name__ == "__main__":
    print("=" * 60)
    print(" 📚 NotesGen AI — Turn Videos into Smart Notes")
    print("=" * 60)

    source = input("\nEnter YouTube URL or local video/audio path: ").strip()
    if not source:
        print("Error: No source provided.")
        exit(1)

    language = input("Language (hinglish / english) [default: hinglish]: ").strip().lower() or "hinglish"
    style = input("Notes Style (detailed / cheatsheet) [default: detailed]: ").strip().lower() or "detailed"

    result = run_pipeline(source, language, style)
    if not result:
        exit(1)

    print("\n" + "=" * 60)
    print(f"📌 Title: {result['title']}")
    print("=" * 60)
    print(f"\n📖 Structured Notes:\n{result['notes']}")
    print("=" * 60)

    # Chat with video transcript via isolated RAG
    print(f"\n💬 Chat with '{result['title']}' (type 'exit' to quit)\n")
    chat_id = result["chat_id"]
    history = []

    while True:
        question = input("You: ").strip()
        if question.lower() in ["exit", "quit", "q"]:
            print("👋 Goodbye!")
            break
        if not question:
            continue

        answer = query_isolated_rag(
            chat_id=chat_id,
            question=question,
            video_title=result["title"],
            language=result["language"],
            recent_history=history,
        )
        history.append({"role": "user", "content": question})
        history.append({"role": "assistant", "content": answer})
        print(f"\n🤖 NotesGen: {answer}\n")