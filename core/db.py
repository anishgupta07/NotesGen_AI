import sqlite3
import os
import uuid
from datetime import datetime
from pathlib import Path

DB_DIR = Path(__file__).resolve().parent.parent / "data"
DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DB_DIR / "notesgen.db"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS chats (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                video_url TEXT NOT NULL,
                language TEXT DEFAULT 'english',
                note_style TEXT DEFAULT 'study_guide',
                notes TEXT NOT NULL,
                transcript TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                chat_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE
            )
        """)
    conn.close()


def create_chat(title: str, video_url: str, language: str, note_style: str, notes: str, transcript: str) -> dict:
    chat_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    conn = get_db()
    with conn:
        conn.execute("""
            INSERT INTO chats (id, title, video_url, language, note_style, notes, transcript, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (chat_id, title, video_url, language, note_style, notes, transcript, now))
    conn.close()
    return {
        "id": chat_id,
        "title": title,
        "video_url": video_url,
        "language": language,
        "note_style": note_style,
        "notes": notes,
        "transcript": transcript,
        "created_at": now,
        "messages": [],
    }


def get_all_chats() -> list:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, title, video_url, language, note_style, created_at
        FROM chats
        ORDER BY created_at DESC
    """)
    rows = cursor.fetchall()
    chats = [dict(row) for row in rows]
    conn.close()
    return chats


def get_chat(chat_id: str) -> dict | None:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM chats WHERE id = ?", (chat_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    chat = dict(row)
    cursor.execute("SELECT id, role, content, created_at FROM messages WHERE chat_id = ? ORDER BY created_at ASC", (chat_id,))
    chat["messages"] = [dict(m) for m in cursor.fetchall()]
    conn.close()
    return chat


def add_message(chat_id: str, role: str, content: str) -> dict:
    msg_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    conn = get_db()
    with conn:
        conn.execute("""
            INSERT INTO messages (id, chat_id, role, content, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (msg_id, chat_id, role, content, now))
    conn.close()
    return {
        "id": msg_id,
        "chat_id": chat_id,
        "role": role,
        "content": content,
        "created_at": now,
    }


def delete_chat(chat_id: str) -> bool:
    conn = get_db()
    with conn:
        conn.execute("DELETE FROM messages WHERE chat_id = ?", (chat_id,))
        conn.execute("DELETE FROM chats WHERE id = ?", (chat_id,))
    conn.close()
    return True


# Initialize database upon import
init_db()
