---
title: NotesGen AI
emoji: 🎓
colorFrom: indigo
colorTo: blue
sdk: docker
app_port: 7860
pinned: true
license: mit
short_description: Generate structured notes from any YouTube video using AI
---

# 🎓 NotesGen AI

> **Turn any YouTube video into structured, exam-ready notes in seconds.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-HuggingFace%20Spaces-orange?logo=huggingface)](https://huggingface.co/spaces/anishgupta07/NotesGen_AI)
[![GitHub](https://img.shields.io/badge/Source-GitHub-black?logo=github)](https://github.com/anishgupta07/NotesGen_AI)

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 📝 **AI Notes Generation** | Paste a YouTube URL → get structured Markdown notes with headings, bullet points, and code blocks |
| 🎙️ **Cloud Transcription** | Uses **Groq Whisper** (whisper-large-v3-turbo) for ultra-fast speech-to-text |
| 🌐 **YouTube Captions** | Pulls existing captions directly when available (instant, no audio download needed) |
| 🔍 **Chat with Notes (RAG)** | Ask follow-up questions about the video content — powered by a lightweight TFIDF retriever |
| 🔑 **Bring Your Own Key** | Each user sets their own free [Groq API key](https://console.groq.com) — no shared quota |
| 👤 **User Accounts** | Register/login — chat history is saved per user |
| 📄 **Export** | Download notes as **PDF** or **Markdown** |
| 🛡️ **Guardrail** | Rejects non-educational videos before wasting tokens |

---

## 🚀 Getting Started

### 1. Get a free Groq API Key
Sign up at [console.groq.com](https://console.groq.com) → **API Keys** → **Create API Key**. It's free.

### 2. Register an account
Click **Sign In → Register** in the top bar.

### 3. Set your Groq key
Click **Set Groq Key** in the top bar and paste your key. It's stored securely per-user.

### 4. Paste a YouTube URL and generate notes
Paste any educational YouTube video URL into the input box and click **Generate Notes**.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS |
| **Backend** | FastAPI (Python 3.11) + Uvicorn |
| **LLM** | Groq Cloud (Llama-3.3-70b / Qwen-32b) via LangChain |
| **Transcription** | Groq Cloud Whisper (whisper-large-v3-turbo) |
| **Transcripts** | youtube-transcript-api (captions) + yt-dlp (audio fallback) |
| **RAG** | LangChain TFIDFRetriever (no PyTorch, < 5 MB RAM) |
| **Database** | SQLite (per-user auth + chat history) |
| **Deployment** | Docker → Hugging Face Spaces |

---

## 🔧 Environment Variables (Space Secrets)

Set these in your Space's **Settings → Secrets**:

| Secret | Required | Description |
|--------|----------|-------------|
| `JWT_SECRET` | ✅ Yes | Random string for signing auth tokens. Generate with: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `GROQ_API_KEY` | Optional | Host-level Groq key (fallback if users don't set their own) |
| `YOUTUBE_PROXY` | Optional | HTTP proxy URL to bypass YouTube datacenter IP blocks (e.g. from [Webshare.io](https://webshare.io)) |

---

## ⚠️ Known Limitations

- **Persistent storage**: The SQLite DB resets on Space restarts. You'll need to re-register after a cold restart. *(Upgrade to HF Persistent Storage to fix this.)*
- **YouTube blocking**: Videos without captions on cloud IPs may fail without a proxy in `YOUTUBE_PROXY`.
- **No local Whisper**: Local Whisper (PyTorch) is disabled on cloud to prevent OOM. A Groq key is required for videos without captions.

---

## 📁 Project Structure

```
NotesGen_AI/
├── server.py              # FastAPI app (all API routes)
├── core/
│   ├── auth.py            # PBKDF2 password hashing + HMAC JWT
│   ├── db.py              # SQLite schema (users, chats)
│   ├── transcriber.py     # Groq Cloud Whisper transcription
│   ├── audio_processor.py # yt-dlp audio download + chunking
│   ├── youtube_helper.py  # YouTube caption fetch + proxy support
│   ├── notes_generator.py # LangChain LCEL notes pipeline
│   ├── summarizer.py      # Chat title generation
│   ├── llm.py             # Multi-provider LLM factory
│   └── guardrail.py       # Educational content filter
├── rag/
│   ├── isolated_engine.py # TFIDF RAG (no torch/chromadb)
│   └── embeddings.py      # (legacy, unused in cloud mode)
├── frontend/              # React + TypeScript + Vite
│   └── src/
│       ├── App.tsx
│       ├── api.ts
│       ├── components/
│       │   ├── AuthModal.tsx
│       │   ├── KeySettingsModal.tsx
│       │   ├── TopNav.tsx
│       │   └── ...
│       └── types.ts
├── Dockerfile             # Multi-stage Docker build
└── requirements.txt       # Python deps (no torch/chromadb)
```

---

## 🛠️ Local Development

```bash
# Clone
git clone https://github.com/anishgupta07/NotesGen_AI.git
cd NotesGen_AI

# Backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt

# Frontend
cd frontend
npm install
npm run build
cd ..

# Run
python server.py
# → http://localhost:7860
```

---

## 📜 License

MIT — feel free to fork, modify, and deploy your own instance.
