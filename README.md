# AI Video Assistant

> An end-to-end AI intelligence system for YouTube videos and meeting recordings: Audio Processing, Dual-Engine Transcription (Whisper & Sarvam AI), Smart Summaries, Meeting Intelligence Extraction, and Interactive RAG Chat using LangChain, Mistral AI, and ChromaDB.

---

## 📖 Complete Documentation

A comprehensive, file-by-file English documentation with all code and the architecture roadmap for adding a **YouTube Video Notes Generator** is available in:

👉 **[PROJECT_DOCUMENTATION.md](file:///d:/Projects/AI-Video-Assistant/AI-Video-Assistant--main/PROJECT_DOCUMENTATION.md)**

---

## 🚀 Quick Start

### 1. Environment Setup
Create a `.env` file in the root directory:
```env
MISTRAL_API_KEY=your_mistral_api_key
SARVAM_API_KEY=your_sarvam_api_key      # Required only for Hinglish/Hindi
WHISPER_MODEL=small                     # local whisper model size (e.g. base, small, medium)
```

### 2. Install Dependencies
```bash
pip install -r Requirements.txt
```

### 3. Run the Web Application
```bash
streamlit run app.py
```

### 4. Run the Terminal CLI
```bash
python main.py
```
