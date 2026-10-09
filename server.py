import os
import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional, List

# Ensure project root is in sys.path
sys.path.append(str(Path(__file__).resolve().parent))

from core.db import (
    create_chat,
    get_all_chats,
    get_chat,
    add_message,
    delete_chat,
)
from core.youtube_helper import get_youtube_transcript_with_timestamps
from core.audio_processor import process_input
from core.transcriber import transcribe_all
from core.summarizer import generate_title
from core.notes_generator import generate_video_notes
from rag.isolated_engine import (
    build_isolated_vector_store,
    query_isolated_rag,
)

app = FastAPI(
    title="NotesGen API",
    description="Turn YouTube videos into smart notes with topic-isolated RAG chat",
    version="1.0.0",
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Pydantic Schemas ───────────────────────────────────────────────────────────
class GenerateNotesRequest(BaseModel):
    url: str
    language: str = "hinglish"      # "hinglish" or "english"
    style: str = "study_guide"       # "study_guide", "cornell", "cheatsheet"


class ChatMessageRequest(BaseModel):
    question: str


# ─── API Endpoints ──────────────────────────────────────────────────────────────
@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "NotesGen API"}


@app.get("/api/chats")
def list_chats():
    """Retrieve all chat sessions for the sidebar history."""
    return get_all_chats()


@app.post("/api/generate-notes")
def api_generate_notes(req: GenerateNotesRequest):
    """Fetch transcript, generate structured notes, persist to DB, and initialize isolated vector store."""
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="Please provide a valid YouTube URL.")

    transcript = None

    # 1. Fast path: check for direct YouTube subtitles
    if "youtube.com" in url or "youtu.be" in url:
        transcript = get_youtube_transcript_with_timestamps(url)

    # 2. Fallback: download audio and transcribe via Whisper
    if not transcript:
        try:
            chunks = process_input(url)
            transcript = transcribe_all(chunks, req.language)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to extract and transcribe audio: {str(e)}"
            )

    if not transcript:
        raise HTTPException(
            status_code=400,
            detail="Could not retrieve transcript from the provided video."
        )

    # 3. Generate concise Title
    try:
        title = generate_title(transcript)
    except Exception:
        title = "YouTube Video Notes"

    # 4. Generate Structured Notes
    try:
        notes = generate_video_notes(
            transcript=transcript,
            style=req.style,
            language=req.language
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating notes: {str(e)}"
        )

    # 5. Save session in SQLite
    chat = create_chat(
        title=title,
        video_url=url,
        language=req.language,
        note_style=req.style,
        notes=notes,
        transcript=transcript,
    )

    # 6. Build isolated vector store in background for RAG chat
    try:
        build_isolated_vector_store(chat["id"], transcript)
    except Exception as e:
        print(f"Warning: vector store build error: {e}")

    return chat


@app.get("/api/chats/{chat_id}")
def api_get_chat(chat_id: str):
    """Retrieve complete chat details, notes, transcript, and full message history."""
    chat = get_chat(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")
    return chat


@app.post("/api/chats/{chat_id}/chat")
def api_ask_question(chat_id: str, req: ChatMessageRequest):
    """Ask a question with strict topic-isolation. Questions outside this video topic are rejected."""
    chat = get_chat(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")

    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # Record user message in DB
    user_msg = add_message(chat_id, "user", question)

    # Query topic-isolated RAG engine
    try:
        answer = query_isolated_rag(
            chat_id=chat_id,
            question=question,
            video_title=chat["title"],
            recent_history=chat.get("messages", []),
        )
    except Exception as e:
        answer = f"Sorry, could not process query: {str(e)}"

    # Record assistant answer in DB
    bot_msg = add_message(chat_id, "assistant", answer)

    return {
        "user_message": user_msg,
        "assistant_message": bot_msg,
    }


@app.delete("/api/chats/{chat_id}")
def api_delete_chat(chat_id: str):
    """Delete a chat session and its messages."""
    delete_chat(chat_id)
    return {"success": True, "message": "Chat deleted."}


# ─── Static Files for Built React SPA ─────────────────────────────────────────
frontend_dist = Path(__file__).resolve().parent / "frontend" / "dist"
if frontend_dist.exists():
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    if (frontend_dist / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Endpoint not found")
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)

