from dotenv import load_dotenv
from core.audio_processor import process_input
from core.transcriber import transcribe_all
from core.summarizer import generate_title
from core.notes_generator import generate_video_notes
from core.extractor import extract_key_concepts, extract_questions
from rag.rag_engine import build_rag_chain, ask_question

load_dotenv()


def run_pipeline(source: str, language: str = "hinglish", style: str = "detailed") -> dict:
    print("\n🚀 Starting NotesGen AI...")

    # Process audio chunks
    chunks = process_input(source)

    # Transcribe speech
    transcript = transcribe_all(chunks, language)
    print(f"Transcript preview: {transcript[:200]}...")

    # Generate title
    title = generate_title(transcript)

    # Generate structured study notes
    print(f"Generating {style} notes in {language}...")
    notes = generate_video_notes(transcript, style=style, language=language)

    # Extract key concepts and study questions
    key_concepts = extract_key_concepts(transcript)
    questions = extract_questions(transcript)

    # Build RAG chain
    rag_chain = build_rag_chain(transcript)

    return {
        "title": title,
        "transcript": transcript,
        "notes": notes,
        "key_concepts": key_concepts,
        "open_questions": questions,
        "rag_chain": rag_chain,
    }


if __name__ == "__main__":
    print("=" * 60)
    print(" 📚 NotesGen AI — Turn Videos into Smart Notes")
    print("=" * 60)

    source = input("\nEnter YouTube URL or local video/audio path: ").strip()
    language = input("Language (hinglish / english) [default: hinglish]: ").strip().lower() or "hinglish"
    style = input("Notes Style (detailed / cheatsheet) [default: detailed]: ").strip().lower() or "detailed"

    result = run_pipeline(source, language, style)

    print("\n" + "=" * 60)
    print(f"📌 Title: {result['title']}")
    print("=" * 60)
    print(f"\n📖 Structured Notes:\n{result['notes']}")
    print("\n" + "-" * 60)
    print(f"\n💡 Core Concepts & Analogies:\n{result['key_concepts']}")
    print(f"\n❓ Self-Study Questions:\n{result['open_questions']}")
    print("=" * 60)

    # Chat with video transcript via RAG
    print("\n💬 Chat with your video notes (type 'exit' to quit)\n")
    rag_chain = result["rag_chain"]
    while True:
        question = input("You: ").strip()
        if question.lower() in ["exit", "quit", "q"]:
            print("👋 Goodbye!")
            break
        if not question:
            continue
        answer = ask_question(rag_chain, question)
        print(f"\n🤖 NotesGen: {answer}\n")