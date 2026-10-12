import os
import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException, Depends, Header, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

# Ensure project root is in sys.path
sys.path.append(str(Path(__file__).resolve().parent))

from core.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)
from core.db import (
    create_user,
    get_user_by_email,
    get_user_by_id,
    update_user_groq_key,
    create_chat,
    get_all_chats,
    get_chat,
    add_message,
    delete_chat,
)
from core.youtube_helper import (
    get_youtube_transcript_with_timestamps,
    filter_transcript_by_timeline,
)
from core.audio_processor import process_input, cleanup_audio_files, cleanup_downloads_dir, DOWNLOAD_DIR
from core.transcriber import transcribe_all
from core.summarizer import generate_title
from core.notes_generator import generate_video_notes
from core.guardrail import check_video_educational
from rag.isolated_engine import (
    build_isolated_vector_store,
    query_isolated_rag,
)

app = FastAPI(
    title="NotesGen API",
    description="Turn YouTube videos into smart notes with topic-isolated RAG chat and BYOK user auth",
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

# Purge any stale download files on startup to ensure max free disk space
cleanup_downloads_dir()


# ─── Pydantic Schemas ───────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    groq_api_key: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class UpdateGroqKeyRequest(BaseModel):
    groq_api_key: str


class GenerateNotesRequest(BaseModel):
    url: str
    language: str = "hinglish"          # "hinglish" or "english"
    style: str = "detailed"             # "detailed" or "cheatsheet"
    timeline_mode: str = "full"         # "full" or "custom"
    start_time: Optional[str] = None    # e.g. "00:00"
    end_time: Optional[str] = None      # e.g. "05:00"


class ChatMessageRequest(BaseModel):
    question: str


# ─── Auth Dependency ───────────────────────────────────────────────────────────

def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """Extract and validate bearer token from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
        )
    token = authorization.split(" ", 1)[1].strip()
    payload = decode_access_token(token)
    if not payload or "user_id" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please log in again.",
        )
    user = get_user_by_id(payload["user_id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists.",
        )
    return user


# ─── Auth Endpoints ─────────────────────────────────────────────────────────────

@app.post("/api/auth/register")
def register(req: RegisterRequest):
    email_clean = req.email.strip().lower()
    existing = get_user_by_email(email_clean)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Please log in.",
        )
    if len(req.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long.",
        )

    pwd_hash = hash_password(req.password)
    user = create_user(
        name=req.name,
        email=email_clean,
        password_hash=pwd_hash,
        groq_api_key=req.groq_api_key.strip() if req.groq_api_key else None,
    )
    token = create_access_token(user_id=user["id"], email=user["email"], name=user["name"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "has_groq_key": user["has_groq_key"],
        },
    }


@app.post("/api/auth/login")
def login(req: LoginRequest):
    email_clean = req.email.strip().lower()
    user = get_user_by_email(email_clean)
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password. Please try again.",
        )
    token = create_access_token(user_id=user["id"], email=user["email"], name=user["name"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "has_groq_key": bool(user.get("groq_api_key")),
        },
    }


@app.get("/api/auth/me")
def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "has_groq_key": bool(current_user.get("groq_api_key")),
    }


@app.put("/api/auth/groq-key")
def update_groq_key(req: UpdateGroqKeyRequest, current_user: dict = Depends(get_current_user)):
    key = req.groq_api_key.strip()
    if not key:
        raise HTTPException(status_code=400, detail="Groq API key cannot be empty.")
    update_user_groq_key(current_user["id"], key)
    return {"success": True, "has_groq_key": True}


# ─── Chat & Note Endpoints ──────────────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "NotesGen API"}


@app.get("/api/chats")
def list_chats(current_user: dict = Depends(get_current_user)):
    """Retrieve chat sessions strictly belonging to the authenticated user."""
    return get_all_chats(user_id=current_user["id"])


@app.post("/api/generate-notes")
def api_generate_notes(req: GenerateNotesRequest, current_user: dict = Depends(get_current_user)):
    """Fetch transcript, run educational guardrail, filter timeline if requested, generate notes, and initialize vector store.
    Strictly isolates generation under current_user['id'] and utilizes their BYOK Groq API key."""
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="Please provide a valid YouTube URL.")

    # Check for active Groq API Key
    user_groq_key = current_user.get("groq_api_key") or os.getenv("GROQ_API_KEY")
    if not user_groq_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Groq API Key is required. Please set your personal free Groq API key in the top settings modal.",
        )

    transcript = None

    # 1. Fast path: check for direct YouTube subtitles
    if "youtube.com" in url or "youtu.be" in url:
        transcript = get_youtube_transcript_with_timestamps(url)

    # 2. Fallback: download audio and transcribe via Groq Cloud Whisper / local Whisper
    if not transcript:
        chunks = []
        try:
            chunks = process_input(url)
            transcript = transcribe_all(chunks, req.language, auto_cleanup=True, groq_api_key=user_groq_key)
        except ValueError as e:
            cleanup_downloads_dir()
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            cleanup_audio_files(chunks)
            cleanup_downloads_dir()
            err_str = str(e)
            if "player response" in err_str.lower() or "bot" in err_str.lower() or "confirm you" in err_str.lower():
                detail_msg = (
                    "This video has subtitles disabled by the creator, and YouTube blocked audio downloading "
                    "on this cloud server. Please try a video with closed captions (CC enabled), or run NotesGen "
                    "locally on your PC to process videos without captions."
                )
            else:
                detail_msg = f"Failed to extract and transcribe audio: {err_str}"
            raise HTTPException(
                status_code=400,
                detail=detail_msg
            )
        finally:
            cleanup_downloads_dir()

    if not transcript:
        raise HTTPException(
            status_code=400,
            detail="Could not retrieve transcript from the provided video."
        )

    # 3. Educational & Academic Guardrail Layer
    is_educational, guardrail_msg = check_video_educational(transcript, title=url, groq_api_key=user_groq_key)
    if not is_educational:
        raise HTTPException(
            status_code=400,
            detail=guardrail_msg
        )

    # 4. Timeline Range Filtering (if custom timeline specified)
    transcript_to_process = transcript
    timeline_suffix = ""
    if req.timeline_mode == "custom" and (req.start_time or req.end_time):
        filtered = filter_transcript_by_timeline(transcript, req.start_time, req.end_time)
        if not filtered.strip():
            raise HTTPException(
                status_code=400,
                detail=f"No transcript found for timeline range [{req.start_time or '00:00'} - {req.end_time or 'end'}]. Please check video timestamps."
            )
        transcript_to_process = filtered
        timeline_suffix = f" [{req.start_time or '00:00'} - {req.end_time or 'end'}]"

    # 5. Generate concise Title
    try:
        title = generate_title(transcript_to_process, groq_api_key=user_groq_key) + timeline_suffix
    except Exception:
        title = f"YouTube Notes{timeline_suffix}"

    # 6. Generate Structured Notes (Detailed Notes or Cheat Sheet with speaker's analogies)
    try:
        notes = generate_video_notes(
            transcript=transcript_to_process,
            style=req.style,
            language=req.language,
            groq_api_key=user_groq_key,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating notes: {str(e)}"
        )

    # 7. Save session in SQLite associated with user_id
    chat = create_chat(
        user_id=current_user["id"],
        title=title,
        video_url=url,
        language=req.language,
        note_style=req.style,
        notes=notes,
        transcript=transcript_to_process,
    )

    # 8. Build isolated vector store for RAG chat
    try:
        build_isolated_vector_store(chat["id"], transcript_to_process)
    except Exception as e:
        print(f"Warning: vector store build error: {e}")

    return chat


@app.post("/api/generate-from-file")
async def api_generate_from_file(
    file: UploadFile = File(...),
    language: str = Form("hinglish"),
    style: str = Form("detailed"),
    current_user: dict = Depends(get_current_user),
):
    """Direct audio/video file upload (MP3, WAV, M4A, MP4) fallback:
    Allows generating notes directly from local recordings or downloaded audio without depending on YouTube."""
    user_groq_key = current_user.get("groq_api_key") or os.getenv("GROQ_API_KEY")
    if not user_groq_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Groq API Key is required. Please set your personal free Groq API key in the top settings modal.",
        )

    file_ext = os.path.splitext(file.filename or "")[1] or ".mp3"
    temp_upload_path = os.path.join(DOWNLOAD_DIR, f"upload_{uuid.uuid4().hex[:8]}{file_ext}")

    try:
        contents = await file.read()
        with open(temp_upload_path, "wb") as f:
            f.write(contents)

        chunks = process_input(temp_upload_path)
        transcript = transcribe_all(chunks, language, auto_cleanup=True, groq_api_key=user_groq_key)
    except Exception as e:
        cleanup_downloads_dir()
        raise HTTPException(status_code=400, detail=f"Failed to process uploaded file: {str(e)}")
    finally:
        if os.path.exists(temp_upload_path):
            try:
                os.remove(temp_upload_path)
            except Exception:
                pass
        cleanup_downloads_dir()

    if not transcript or not transcript.strip():
        raise HTTPException(status_code=400, detail="Could not extract transcript from uploaded audio.")

    # Educational guardrail
    is_educational, guardrail_msg = check_video_educational(transcript, title=file.filename or "Uploaded Audio", groq_api_key=user_groq_key)
    if not is_educational:
        raise HTTPException(status_code=400, detail=guardrail_msg)

    try:
        title = generate_title(transcript, groq_api_key=user_groq_key)
    except Exception:
        title = file.filename or "Uploaded Lecture Notes"

    try:
        notes = generate_video_notes(transcript, style=style, language=language, groq_api_key=user_groq_key)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating notes: {str(e)}")

    chat = create_chat(
        user_id=current_user["id"],
        title=title,
        video_url=file.filename or "Local File Upload",
        language=language,
        note_style=style,
        notes=notes,
        transcript=transcript,
    )

    try:
        build_isolated_vector_store(chat["id"], transcript)
    except Exception as e:
        print(f"Warning: vector store build error: {e}")

    return chat


@app.get("/api/chats/{chat_id}")
def api_get_chat(chat_id: str, current_user: dict = Depends(get_current_user)):
    """Retrieve complete chat details strictly if belonging to the current user."""
    chat = get_chat(chat_id, user_id=current_user["id"])
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found or access denied.")
    return chat


@app.post("/api/chats/{chat_id}/chat")
def api_ask_question(chat_id: str, req: ChatMessageRequest, current_user: dict = Depends(get_current_user)):
    """Ask a question with strict topic-isolation using user's BYOK Groq API key."""
    chat = get_chat(chat_id, user_id=current_user["id"])
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found or access denied.")

    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # Record user message in DB
    user_msg = add_message(chat_id, "user", question)

    # Get user's Groq key
    user_groq_key = current_user.get("groq_api_key") or os.getenv("GROQ_API_KEY")
    if not user_groq_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Groq API key required. Please configure in Settings.",
        )

    # Query topic-isolated RAG engine with language and video title
    chat_lang = chat.get("language", "english")
    try:
        answer = query_isolated_rag(
            chat_id=chat_id,
            question=question,
            video_title=chat["title"],
            language=chat_lang,
            recent_history=chat.get("messages", []),
            groq_api_key=user_groq_key,
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
def api_delete_chat(chat_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a chat session strictly belonging to current user."""
    chat = get_chat(chat_id, user_id=current_user["id"])
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found or access denied.")
    delete_chat(chat_id, user_id=current_user["id"])
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
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port)
