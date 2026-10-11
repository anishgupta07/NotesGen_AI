import sqlite3
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any

DB_DIR = Path(__file__).resolve().parent.parent / "data"
DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DB_DIR / "notesgen.db"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_db()
    with conn:
        # Users table for authentication & BYOK Groq API key storage
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                groq_api_key TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)")

        # Chats table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS chats (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                title TEXT NOT NULL,
                video_url TEXT NOT NULL,
                language TEXT DEFAULT 'english',
                note_style TEXT DEFAULT 'study_guide',
                notes TEXT NOT NULL,
                transcript TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        """)

        # Migration: Add user_id column if it doesn't exist in existing chats table
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(chats)")
        columns = [row["name"] for row in cursor.fetchall()]
        if "user_id" not in columns:
            cursor.execute("ALTER TABLE chats ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE")

        conn.execute("CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats (user_id)")

        # Messages table
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
        conn.execute("CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages (chat_id)")
    conn.close()


# ─── User CRUD ─────────────────────────────────────────────────────────────────

def create_user(name: str, email: str, password_hash: str, groq_api_key: Optional[str] = None) -> Dict[str, Any]:
    user_id = str(uuid.uuid4())
    email_clean = email.strip().lower()
    now = datetime.utcnow().isoformat()
    conn = get_db()
    with conn:
        conn.execute("""
            INSERT INTO users (id, name, email, password_hash, groq_api_key, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_id, name.strip(), email_clean, password_hash, groq_api_key, now))
    conn.close()
    return {
        "id": user_id,
        "name": name.strip(),
        "email": email_clean,
        "has_groq_key": bool(groq_api_key),
        "created_at": now,
    }


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE lower(email) = lower(?)", (email.strip(),))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def update_user_groq_key(user_id: str, groq_api_key: str) -> bool:
    conn = get_db()
    with conn:
        conn.execute("UPDATE users SET groq_api_key = ? WHERE id = ?", (groq_api_key.strip(), user_id))
    conn.close()
    return True


# ─── Multi-Tenant Chats CRUD ───────────────────────────────────────────────────

def create_chat(
    user_id: str,
    title: str,
    video_url: str,
    language: str,
    note_style: str,
    notes: str,
    transcript: str
) -> dict:
    chat_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    conn = get_db()
    with conn:
        conn.execute("""
            INSERT INTO chats (id, user_id, title, video_url, language, note_style, notes, transcript, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (chat_id, user_id, title, video_url, language, note_style, notes, transcript, now))
    conn.close()
    return {
        "id": chat_id,
        "user_id": user_id,
        "title": title,
        "video_url": video_url,
        "language": language,
        "note_style": note_style,
        "notes": notes,
        "transcript": transcript,
        "created_at": now,
        "messages": [],
    }


def get_all_chats(user_id: Optional[str] = None) -> list:
    """Retrieve all chats belonging strictly to this user."""
    conn = get_db()
    cursor = conn.cursor()
    if user_id:
        cursor.execute("""
            SELECT id, user_id, title, video_url, language, note_style, created_at
            FROM chats
            WHERE user_id = ?
            ORDER BY created_at DESC
        """, (user_id,))
    else:
        cursor.execute("""
            SELECT id, user_id, title, video_url, language, note_style, created_at
            FROM chats
            ORDER BY created_at DESC
        """)
    rows = cursor.fetchall()
    chats = [dict(row) for row in rows]
    conn.close()
    return chats


def get_chat(chat_id: str, user_id: Optional[str] = None) -> Optional[dict]:
    """Retrieve chat session, optionally validating ownership."""
    conn = get_db()
    cursor = conn.cursor()
    if user_id:
        cursor.execute("SELECT * FROM chats WHERE id = ? AND user_id = ?", (chat_id, user_id))
    else:
        cursor.execute("SELECT * FROM chats WHERE id = ?", (chat_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    chat = dict(row)
    cursor.execute("""
        SELECT id, chat_id, role, content, created_at
        FROM messages
        WHERE chat_id = ?
        ORDER BY created_at ASC
    """, (chat_id,))
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


def delete_chat(chat_id: str, user_id: Optional[str] = None) -> bool:
    conn = get_db()
    with conn:
        if user_id:
            conn.execute("DELETE FROM messages WHERE chat_id IN (SELECT id FROM chats WHERE id = ? AND user_id = ?)", (chat_id, user_id))
            conn.execute("DELETE FROM chats WHERE id = ? AND user_id = ?", (chat_id, user_id))
        else:
            conn.execute("DELETE FROM messages WHERE chat_id = ?", (chat_id,))
            conn.execute("DELETE FROM chats WHERE id = ?", (chat_id,))
    conn.close()
    return True


# Initialize database upon import
init_db()
