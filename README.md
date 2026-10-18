---
title: NotesGen AI (LectureCraft)
emoji: 📚
colorFrom: amber
colorTo: red
sdk: docker
app_port: 8000
pinned: true
license: mit
short_description: Turn video lectures into structured, analogy-preserving study notes with an AI doubt tutor
---

<div align="center">

# 📚 NotesGen AI (LectureCraft)
### *Paste a lecture. Get notes you will actually finish.*

An intelligent, analogy-preserving study companion that transforms long educational YouTube lectures and video recordings into comprehensive, structured notes with chapter navigation, native Hinglish support, and an isolated AI doubt tutor.

[![Live Deployment](https://img.shields.io/badge/Live%20App-Railway-000000?style=for-the-badge&logo=railway&logoColor=white)](https://notesgenai-production.up.railway.app)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)](https://langchain.com)
[![Groq](https://img.shields.io/badge/Groq%20Cloud-F55036?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com)
[![LangSmith](https://img.shields.io/badge/LangSmith-Observability-blue?style=for-the-badge&logo=langchain)](https://smith.langchain.com)

</div>

---

## 💡 App Name Suggestions

If you are rebranding or choosing the official name for this project, here are the top curated options:

| Name | Vibe / Tagline | Why it works |
|------|----------------|--------------|
| **LectureCraft** *(Top Pick)* | *"Crafting lectures into notes you'll actually finish"* | Sounds professional, memorable, and directly describes the editorial craftsmanship of the generated notes. |
| **NotesGen AI** *(Current)* | *"Turn videos into smart notes"* | Clean, direct, and already established across your GitHub and Railway deployment. |
| **CruxNotes** | *"Never miss the teacher's analogy"* | Highlights the unique value proposition: extracting the core *crux* and real-world examples. |
| **SamajhAI** *(Hinglish Focus)* | *"Pehle idea samjho, phir code"* | Exceptional for student communities in India and South Asia who learn tech/DSA in Hinglish. |
| **MarginNote AI** | *"Your personal lecture tutor in the margin"* | Evokes the classic study feeling of annotations and side-by-side doubt clearing. |

---

## 🎯 The Problem

Students, engineers, and lifelong learners spend hundreds of hours watching technical lectures, university courses, and tutorials on YouTube (Data Structures & Algorithms, System Design, Machine Learning, GATE, UPSC). 

However, modern online video learning suffers from four major pain points:

1. **Manual Note-Taking Kills Flow:** Writing down every formula, diagram, and code snippet forces students to constantly pause and rewind. Most students abandon taking notes halfway through a 2-hour lecture.
2. **Generic AI Summarizers Omit 80% of Nuance:** Standard AI tools generate lazy, high-level 5-bullet summaries. They miss edge cases, mathematical steps, and crucially **the teacher's intuitive analogies** (e.g., *"think of recursion like Russian nesting dolls"*) that actually make complex topics stick.
3. **The "Hinglish" Language Gap:** The vast majority of top technical tutorials in India and South Asia are taught in natural, conversational Hinglish (Roman Hindi + English technical terms). Standard summarizers force robotic English translations that strip away the instructor's conversational clarity.
4. **Unanswered Doubts & Closed Captions Blockades:** When students review their notes days later, they have specific doubts. Re-watching a 90-minute video to answer a 1-minute question is frustrating. Furthermore, if a YouTube video has captions disabled by the creator, typical AI tools crash completely.

---

## 🚀 The Solution

**NotesGen AI** is an end-to-end lecture-to-notes system tailored specifically for deep academic learning:

- **100% Concept Crux with Instructor's Exact Analogies:** Breaks down lectures into timestamped chapters (`00:00 Problem statement`, `01:00 Core intuition`), highlights key terms, extracts the exact real-world stories used by the instructor, and summarizes actionable *crux points to note down*.
- **Native Bilingual Fluency:** Seamlessly generates structured notes in natural, flowing conversational Hinglish or clear academic English.
- **Topic-Isolated AI Doubt Tutor (RAG):** An interactive assistant placed right beside the notes. Grounded strictly in the video transcript, it explains concepts in simple language without hallucinating.
- **Zero Caption Lockout (Dual Ingestion):** Pulls captions directly in milliseconds; if captions are disabled, it automatically falls back to audio download or lets users upload local video/audio files (`.mp3`, `.mp4`, `.m4a`).
- **Bring Your Own Key (BYOK) Architecture:** Users provide their free personal Groq API key. The host incurs **$0 in LLM inference costs**, while users enjoy blazing-fast sub-second generation.
- **LangSmith Observability Layer:** Real-time token telemetry (TPM limit monitoring, prompt/completion token tracking, latency) and HTTP 429 rate-limit diagnostics.
- **Editorial Paper Aesthetic:** A distraction-free UI styled with warm cream paper tones (`#FBF9F5`), Newsreader serif typography, chapter reading progress, and instant PDF/Markdown export.

---

## 🏗️ Technical Architecture & Implementation

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React 19 + TypeScript SPA                       │
│  (Editorial Paper Theme, Newsreader Serif, Chapter Index, Doubt Chat) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          FastAPI Backend Core                          │
│         (Auth, SQLite WAL, Rate-Limit Protection, BYOK Key Store)      │
└────────┬──────────────────────────┬───────────────────────────┬────────┘
         │                          │                           │
         ▼                          ▼                           ▼
┌──────────────────┐      ┌──────────────────┐        ┌──────────────────┐
│ Ingestion Layer  │      │ LLM LCEL Chains  │        │   Isolated RAG   │
│ • Captions API   │      │ • gpt-oss-120b   │        │ • TFIDF Index    │
│ • Cloud Whisper  │      │ • gpt-oss-20b    │        │ • Strict Topic   │
│ • File Upload    │      │ • Safe 8k TPM    │        │   Guardrails     │
└──────────────────┘      └─────────┬────────┘        └──────────────────┘
                                    │
                                    ▼
                          ┌──────────────────┐
                          │ LangSmith Layer  │
                          │ • Live Telemetry │
                          │ • 429 Diagnostic │
                          │ • Token Tracking │
                          └──────────────────┘
```

### 1. Multi-Stage Ingestion Pipeline
- **Fast Caption Path:** Evaluates YouTube URLs using `youtube-transcript-api` with language prioritization (`en`, `hi`, `en-US`, `auto`). Fetches timestamped transcripts in `< 250ms`.
- **Cloud Whisper Fallback:** If subtitles are disabled by the video owner, the backend extracts the audio stream using `yt-dlp` in ultra-compact 32k mono MP3 chunks and transcribes them via **Groq Cloud Whisper** (`whisper-large-v3-turbo`) in parallel.
- **Offline File Upload:** Users can directly upload `.mp3`, `.wav`, `.m4a`, or `.mp4` recordings via `/api/generate-from-file`, bypassing YouTube bot-detection entirely.

### 2. Rate-Limit Protection & Model Pool Rotation
Groq free-tier imposes a strict **8,000 Tokens-Per-Minute (TPM)** limit per model (`input_tokens + max_completion_tokens`).
- **Chunk Sizing:** Transcripts are partitioned into `SAFE_CHUNK_SIZE = 12000` characters (~3,000 tokens) with `SAFE_MAX_TOKENS = 1400`, ensuring any single request caps at ~4,400 tokens — safely beneath the 8k threshold.
- **Dynamic Pool Rotation:** If a model hits a temporary 429 rate limit, the engine automatically catches the exception, logs diagnostic telemetry, and rotates across independent model pools:
  $$\text{openai/gpt-oss-120b} \longrightarrow \text{openai/gpt-oss-20b} \longrightarrow \text{qwen/qwen3.8-27b}$$

### 3. Topic-Isolated RAG Engine
- To prevent cloud Out-Of-Memory (OOM) crashes on 512 MB memory instances, heavyweight embeddings and vector databases (PyTorch/ChromaDB) are replaced with an ultra-lightweight **TF-IDF Retriever** (`< 1 MB RAM`).
- Each lecture maintains an isolated JSON index on disk. When asking doubts, the LLM is injected with strict system guardrails enforcing refusal of off-topic queries and mandating the use of the instructor's metaphors.

### 4. LangSmith Observability & Telemetry
- Automatic tracing integration with LangSmith via `LANGCHAIN_TRACING_V2`.
- Inspects `response.response_metadata["token_usage"]` and `AIMessage.usage_metadata` on every generation pass to log:
  ```text
  📊 [LangSmith/Token Telemetry] Model: openai/gpt-oss-120b | Prompt: 2,845 tokens | Output: 1,120 tokens | Total: 3,965 tokens (~49.6% of Groq 8k TPM limit)
  ```
- If an HTTP 429 occurs, `log_rate_limit_diagnostic` prints exact token overflow counts and wait times.

---

## 💻 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, React Markdown |
| **Typography** | Newsreader (Editorial Serif), Plus Jakarta Sans, JetBrains Mono |
| **Backend API** | Python 3.11, FastAPI, Uvicorn, Pydantic v2 |
| **LLM & Orchestration** | LangChain Core (LCEL), ChatGroq, LangSmith SDK |
| **Speech-to-Text** | Groq Cloud Whisper (`whisper-large-v3-turbo`), yt-dlp |
| **Database & Auth** | SQLite (WAL Mode), Passlib PBKDF2 Password Hashing, JWT Bearer Tokens |
| **Observability** | LangSmith (`smith.langchain.com`), real-time stdout token telemetry |
| **Deployment** | Docker multi-stage build, Railway Cloud / Hugging Face Spaces |

---

## ⚡ Quick Start (Local Setup)

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- A free Groq API key from [console.groq.com](https://console.groq.com)

### 1. Clone & Set Up Backend

```bash
# Clone the repository
git clone https://github.com/anishgupta07/NotesGen_AI.git
cd NotesGen_AI

# Create and activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
JWT_SECRET=your_super_secret_jwt_key_here
GROQ_API_KEY=gsk_your_groq_api_key_optional_host_default

# Optional LangSmith Tracing
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=lsv2_pt_your_langsmith_api_key
LANGCHAIN_PROJECT=NotesGen-AI
```

### 3. Build Frontend & Run

```bash
# Install frontend dependencies and build assets
cd frontend
npm install
npm run build
cd ..

# Start FastAPI server
python server.py
```

The application will be live at **`http://localhost:8000`** (or your assigned `$PORT`).

---

## 🔒 Security & Privacy (BYOK Model)

- **User Data Isolation:** SQLite ensures chat sessions and notes are strictly scoped to the authenticated user's ID.
- **Zero Host LLM Bills:** Personal Groq and LangSmith keys are stored per user in the encrypted database. Inference is executed under their personal account quota.
- **Safe Sandboxing:** Audio files processed during Whisper transcription are cleaned up immediately following completion to maintain zero disk footprint.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.
