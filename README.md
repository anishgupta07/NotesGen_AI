# NotesGen AI — Turn Videos into Smart Notes

> An intelligent, end-to-end AI study platform that converts educational YouTube videos into structured study notes, speaker analogies, and topic-isolated RAG chat. Built with FastAPI, React + TypeScript, Groq LLM orchestration, and ChromaDB vector search.

---

## ✨ Features

- **🛡️ Academic & Educational Guardrail**: Automatically validates whether a video is educational/academic before spending compute or generating notes.
- **📚 Detailed Notes & Cheat Sheets**:
  - **Detailed Notes**: 100% topic concept crux, speaker's real-life analogies, timestamp breakdown, and key note-down points.
  - **Cheat Sheet**: Rapid formula, principle, definition, and concept recap.
- **🇮🇳 Bilingual Intelligence (Hinglish & English)**: Natural, conversational Indian Hinglish explanations or formal academic English.
- **⏳ Timeline Slicing**: Generate notes for specific video chapters/ranges (e.g., `00:00` to `05:00`) or the entire video.
- **💬 Topic-Isolated RAG Chat**: Independent memory and vector store per chat session. Strictly answers questions related to the active video and politely deflects unrelated queries.
- **🎨 Midnight Dark UI**: Clean, responsive React + TypeScript interface powered by Tailwind CSS and Plus Jakarta Sans.

---

## 🚀 Quick Start

### 1. Environment Setup
Create a `.env` file in the root directory:
```env
GROQ_API_KEY=your_groq_api_key          # Primary high-speed LLM engine
MISTRAL_API_KEY=your_mistral_api_key    # Optional fallback provider
SARVAM_API_KEY=your_sarvam_api_key      # Required for Hinglish speech transcription
WHISPER_MODEL=small                     # Local Whisper model size (base, small, medium)
```

### 2. Install Dependencies
```bash
pip install -r Requirements.txt
cd frontend && npm install && npm run build && cd ..
```

### 3. Run NotesGen AI
Start the unified FastAPI server (serves the React UI on port 8000):
```bash
python server.py
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

Or run the interactive CLI:
```bash
python main.py
```
