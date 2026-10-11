import streamlit as st
import time
from dotenv import load_dotenv
from core.audio_processor import process_input
from core.transcriber import transcribe_all
from core.summarizer import generate_title
from core.notes_generator import generate_video_notes
from core.youtube_helper import get_youtube_transcript_with_timestamps, filter_transcript_by_timeline
from core.guardrail import check_video_educational
from rag.isolated_engine import build_isolated_vector_store, query_isolated_rag

load_dotenv()

# ─── Page Config ────────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="NotesGen AI — Turn Videos into Smart Notes",
    page_icon="📚",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─── Custom CSS ─────────────────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

/* ── Root Variables ── */
:root {
    --bg: #090a0c;
    --surface: #101115;
    --surface-2: #171820;
    --border: #22232e;
    --accent: #ff2442;
    --accent-hover: #e01b37;
    --accent-glow: #ff4d66;
    --text: #f1f3f7;
    --text-muted: #8b92a4;
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
}

/* ── Global Reset ── */
html, body, [class*="css"] {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background-color: var(--bg) !important;
    color: var(--text) !important;
}

.stApp {
    background: var(--bg) !important;
}

/* ── Sidebar ── */
[data-testid="stSidebar"] {
    background: var(--surface) !important;
    border-right: 1px solid var(--border) !important;
}

[data-testid="stSidebar"] * {
    color: var(--text) !important;
}

/* ── Headings ── */
h1, h2, h3, h4, h5, h6 {
    font-family: 'Plus Jakarta Sans', sans-serif !important;
    font-weight: 700 !important;
    color: var(--text) !important;
}

/* ── Hero Title ── */
.hero-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: clamp(2rem, 5vw, 3.2rem);
    font-weight: 800;
    line-height: 1.1;
    margin: 0;
    letter-spacing: -0.03em;
    color: #ffffff;
}

.hero-sub {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.95rem;
    color: var(--text-muted);
    margin-top: 0.4rem;
}

/* ── Cards ── */
.card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1rem;
    position: relative;
    overflow: hidden;
    transition: border-color 0.2s;
}

.card:hover {
    border-color: #333446;
}

.card::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 3px; height: 100%;
    background: var(--accent);
}

.card-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.card-content {
    font-size: 0.92rem;
    line-height: 1.8;
    color: var(--text);
}

/* ── Accent Badge ── */
.badge {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
}

.badge-red   { background: rgba(255,36,66,0.15); color: var(--accent-glow); border: 1px solid rgba(255,36,66,0.3); }
.badge-green { background: rgba(16,185,129,0.15); color: var(--success);    border: 1px solid rgba(16,185,129,0.3); }

/* ── Input & Buttons ── */
.stTextInput > div > div > input,
.stSelectbox > div > div {
    background: var(--surface-2) !important;
    border: 1px solid var(--border) !important;
    border-radius: 8px !important;
    color: var(--text) !important;
}

.stTextInput > div > div > input:focus {
    border-color: var(--accent) !important;
    box-shadow: 0 0 0 2px rgba(255,36,66,0.2) !important;
}

.stButton > button {
    background: var(--accent) !important;
    color: white !important;
    border: none !important;
    border-radius: 8px !important;
    font-family: 'Plus Jakarta Sans', sans-serif !important;
    font-weight: 700 !important;
    font-size: 0.875rem !important;
    padding: 0.6rem 1.5rem !important;
    transition: all 0.2s !important;
}

.stButton > button:hover {
    background: var(--accent-hover) !important;
    box-shadow: 0 4px 15px rgba(255,36,66,0.3) !important;
}

/* ── Status Bar ── */
.status-bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 1rem;
    background: var(--surface-2);
    border-radius: 8px;
    margin: 0.4rem 0;
    border: 1px solid var(--border);
    font-size: 0.8rem;
}

.status-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.dot-active   { background: var(--accent); box-shadow: 0 0 8px var(--accent); animation: pulse 1.5s infinite; }
.dot-done     { background: var(--success); }
.dot-pending  { background: var(--border); }

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
}

/* ── Chat ── */
.chat-container {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.25rem;
    max-height: 420px;
    overflow-y: auto;
    margin-bottom: 1rem;
}

.chat-msg {
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.chat-label {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
}

.chat-bubble {
    display: inline-block;
    padding: 0.7rem 1.1rem;
    border-radius: 10px;
    font-size: 0.88rem;
    line-height: 1.6;
    max-width: 90%;
}

.user-label  { color: var(--accent-glow); }
.bot-label   { color: #94a3b8; }

.user-bubble { background: rgba(255,36,66,0.12); border: 1px solid rgba(255,36,66,0.25); align-self: flex-end; }
.bot-bubble  { background: #16171f; border: 1px solid #232532; align-self: flex-start; }

/* ── Transcript box ── */
.transcript-box {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.25rem;
    font-size: 0.85rem;
    line-height: 1.8;
    max-height: 320px;
    overflow-y: auto;
    color: var(--text-muted);
    white-space: pre-wrap;
    word-break: break-word;
}
</style>
""", unsafe_allow_html=True)

# ─── Session State Init ──────────────────────────────────────────────────────────
for key, default in {
    "result": None,
    "chat_history": [],
    "processing": False,
    "pipeline_done": False,
    "pipeline_steps": {},
}.items():
    if key not in st.session_state:
        st.session_state[key] = default

# ─── Helpers ────────────────────────────────────────────────────────────────────
def step_status(steps: dict, key: str) -> str:
    s = steps.get(key, "pending")
    if s == "active":  return "dot-active"
    if s == "done":    return "dot-done"
    return "dot-pending"

def render_step_bar(label: str, key: str, icon: str):
    css = step_status(st.session_state.pipeline_steps, key)
    st.markdown(f"""
    <div class="status-bar">
        <div class="status-dot {css}"></div>
        <span>{icon} {label}</span>
    </div>""", unsafe_allow_html=True)

# ─── Sidebar ────────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("""
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:0.5rem">
        <div style="width:36px;height:36px;background:#ff2442;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;font-weight:bold;color:white">
            N
        </div>
        <div>
            <div style="font-weight:800;font-size:1.1rem;color:white;display:flex;align-items:center;gap:6px">
                NotesGen <span style="font-size:9px;background:#2a0b11;color:#ff4d66;padding:1px 5px;border-radius:4px;border:1px solid rgba(255,36,66,0.3)">AI</span>
            </div>
            <div style="font-size:0.75rem;color:#8b92a4">Video Study Intelligence</div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    st.markdown("---")

    st.markdown('<span class="badge badge-red">Notes Format</span>', unsafe_allow_html=True)
    note_style = st.selectbox(
        "Notes Format",
        ["detailed", "cheatsheet"],
        index=0,
        format_func=lambda x: {
            "detailed": "📖 Detailed Notes (100% Concept Crux)",
            "cheatsheet": "⚡ Quick Cheat Sheet (Crux Only)"
        }[x],
        label_visibility="collapsed"
    )

    st.markdown('<span class="badge badge-red" style="margin-top:0.75rem">Timeline Mode</span>', unsafe_allow_html=True)
    timeline_mode = st.radio(
        "Timeline Option",
        ["Full Video", "Custom Range (e.g. 00:00 - 05:00)"],
        index=0,
        label_visibility="collapsed"
    )

    start_time = None
    end_time = None
    if timeline_mode == "Custom Range (e.g. 00:00 - 05:00)":
        c_t1, c_t2 = st.columns(2)
        with c_t1:
            start_time = st.text_input("Start", value="00:00", placeholder="00:00")
        with c_t2:
            end_time = st.text_input("End", value="05:00", placeholder="05:00")

    st.markdown("---")
    st.markdown('<span class="badge badge-red">Input Video</span>', unsafe_allow_html=True)
    source = st.text_input("YouTube URL or File Path", placeholder="https://youtube.com/watch?v=...")

    language = st.selectbox(
        "Language",
        ["hinglish", "english"],
        index=0,
        format_func=lambda x: "🇮🇳 Hinglish (Natural Indian Flow)" if x == "hinglish" else "🌐 English (Standard Academic)"
    )

    run_btn = st.button("✨  Generate Smart Notes", use_container_width=True)

    if st.session_state.pipeline_done:
        st.markdown("---")
        st.markdown('<span class="badge badge-green">Pipeline Status</span>', unsafe_allow_html=True)
        pipeline_steps_list = [
            ("transcript", "📝", "Transcript Retrieval"),
            ("guardrail",  "🛡️", "Educational Guardrail"),
            ("title",      "🏷️", "Title Generation"),
            ("notes",      "📚", "Notes Generation"),
            ("rag",        "🧠", "Isolated RAG Engine"),
        ]
        for step, icon, label in pipeline_steps_list:
            render_step_bar(label, step, icon)

# ─── Main Area ──────────────────────────────────────────────────────────────────
st.markdown('<div class="hero-title">NotesGen AI</div>', unsafe_allow_html=True)
st.markdown('<div class="hero-sub">Turn educational videos into comprehensive study notes with speaker analogies and topic-isolated chat.</div>', unsafe_allow_html=True)
st.markdown("---")

# ── Run Pipeline ────────────────────────────────────────────────────────────────
if run_btn:
    if not source.strip():
        st.error("Please enter a valid YouTube video URL or file path.")
    else:
        st.session_state.pipeline_done = False
        st.session_state.result = None
        st.session_state.chat_history = []
        st.session_state.pipeline_steps = {}

        progress_placeholder = st.empty()

        def update_step(key, state):
            st.session_state.pipeline_steps[key] = state

        try:
            with progress_placeholder.container():
                st.info("⚙️ Processing video — follow the live status in sidebar…")

            transcript = None

            # 1. Fast path: check for YouTube subtitles
            if "youtube.com" in source or "youtu.be" in source:
                update_step("transcript", "active")
                transcript = get_youtube_transcript_with_timestamps(source)
                if transcript:
                    update_step("transcript", "done")

            # 2. Fallback: download audio and transcribe
            if not transcript:
                update_step("transcript", "active")
                chunks = process_input(source)
                transcript = transcribe_all(chunks, language)
                update_step("transcript", "done")

            # 3. Educational & Academic Guardrail Layer
            update_step("guardrail", "active")
            is_educational, guardrail_msg = check_video_educational(transcript, title=source)
            if not is_educational:
                update_step("guardrail", "pending")
                progress_placeholder.error(f"🛡️ Guardrail Block: {guardrail_msg}")
                st.stop()
            update_step("guardrail", "done")

            # 4. Timeline Range Filtering if custom
            transcript_to_use = transcript
            time_suffix = ""
            if timeline_mode.startswith("Custom") and (start_time or end_time):
                filtered = filter_transcript_by_timeline(transcript, start_time, end_time)
                if filtered.strip():
                    transcript_to_use = filtered
                    time_suffix = f" [{start_time or '00:00'} - {end_time or 'end'}]"

            # 5. Generate Title
            update_step("title", "active")
            title = generate_title(transcript_to_use) + time_suffix
            update_step("title", "done")

            # 6. Generate Video Notes
            update_step("notes", "active")
            notes = generate_video_notes(transcript_to_use, style=note_style, language=language)
            update_step("notes", "done")

            # 7. Build Isolated Vector Store
            update_step("rag", "active")
            chat_id = "streamlit_session"
            build_isolated_vector_store(chat_id, transcript_to_use)
            update_step("rag", "done")

            st.session_state.result = {
                "chat_id": chat_id,
                "title": title,
                "transcript": transcript_to_use,
                "notes": notes,
                "language": language,
            }

            st.session_state.pipeline_done = True
            progress_placeholder.success("✅ Notes generated successfully!")
            time.sleep(0.5)
            progress_placeholder.empty()
            st.rerun()

        except Exception as e:
            for k in ["transcript", "guardrail", "title", "notes", "rag"]:
                if st.session_state.pipeline_steps.get(k) == "active":
                    st.session_state.pipeline_steps[k] = "pending"
            progress_placeholder.error(f"❌ Error: {e}")

# ── Results ──────────────────────────────────────────────────────────────────────
if st.session_state.result:
    r = st.session_state.result

    # Title banner
    st.markdown(f"""
    <div class="card">
        <div class="card-title">📌 Video Title</div>
        <div style="font-size:1.35rem;font-weight:700;color:var(--text)">
            {r['title']}
        </div>
    </div>""", unsafe_allow_html=True)

    # Generated Notes Section
    col_note_title, col_dl = st.columns([4, 1], gap="medium")
    with col_note_title:
        st.markdown('<div class="card-title" style="font-size:1.1rem;margin:0.5rem 0">📚 Generated Study Notes</div>', unsafe_allow_html=True)
    with col_dl:
        st.download_button(
            label="📥 Download (.md)",
            data=r.get("notes", ""),
            file_name=f"{r['title'][:30].strip()}_notes.md",
            mime="text/markdown",
            use_container_width=True
        )

    st.markdown(f"""
    <div class="card">
        <div class="card-content" style="white-space: pre-wrap; font-size: 0.92rem; line-height: 1.8;">
{r.get('notes', '')}
        </div>
    </div>""", unsafe_allow_html=True)

    with st.expander("📝 Full Video Transcript with Timestamps", expanded=False):
        st.markdown(f'<div class="transcript-box">{r["transcript"]}</div>', unsafe_allow_html=True)

    st.markdown("---")

    # ── RAG Chat ──────────────────────────────────────────────────────────────
    st.markdown('<div style="font-size:1.2rem;font-weight:700;margin-bottom:1rem">💬 Chat with Video Notes</div>', unsafe_allow_html=True)

    # Chat history display
    if st.session_state.chat_history:
        chat_html = '<div class="chat-container">'
        for msg in st.session_state.chat_history:
            if msg["role"] == "user":
                chat_html += f"""
                <div class="chat-msg" style="align-items:flex-end">
                    <span class="chat-label user-label">You</span>
                    <div class="chat-bubble user-bubble">{msg['content']}</div>
                </div>"""
            else:
                chat_html += f"""
                <div class="chat-msg" style="align-items:flex-start">
                    <span class="chat-label bot-label">🤖 NotesGen</span>
                    <div class="chat-bubble bot-bubble">{msg['content']}</div>
                </div>"""
        chat_html += '</div>'
        st.markdown(chat_html, unsafe_allow_html=True)
    else:
        st.markdown("""
        <div class="card" style="text-align:center;padding:2rem">
            <div style="font-size:2rem;margin-bottom:0.5rem">💬</div>
            <div style="color:var(--text-muted);font-size:0.85rem">Ask anything about the video concepts, analogies, or notes</div>
        </div>""", unsafe_allow_html=True)

    # Chat input
    chat_col1, chat_col2 = st.columns([5, 1], gap="small")
    with chat_col1:
        user_input = st.text_input("Your question", placeholder="Ask a question about this video...", label_visibility="collapsed")
    with chat_col2:
        send_btn = st.button("Send →", use_container_width=True)

    if send_btn and user_input.strip():
        with st.spinner("Analyzing transcript…"):
            answer = query_isolated_rag(
                chat_id=r.get("chat_id", "streamlit_session"),
                question=user_input.strip(),
                video_title=r["title"],
                language=r.get("language", "hinglish"),
                recent_history=st.session_state.chat_history,
            )
        st.session_state.chat_history.append({"role": "user",      "content": user_input.strip()})
        st.session_state.chat_history.append({"role": "assistant", "content": answer})
        st.rerun()

    if st.session_state.chat_history:
        if st.button("🗑️ Clear Chat", type="secondary"):
            st.session_state.chat_history = []
            st.rerun()

else:
    # Empty state
    st.markdown("""
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:5rem 2rem;text-align:center">
        <div style="font-size:3.5rem;margin-bottom:1rem">📚</div>
        <div style="font-size:1.5rem;font-weight:700;color:var(--text);margin-bottom:0.5rem">
            Ready to Generate Smart Notes
        </div>
        <div style="color:var(--text-muted);font-size:0.88rem;max-width:420px;line-height:1.7">
            Paste a YouTube URL in the sidebar, choose your language & style, and hit <strong>Generate Smart Notes</strong>.
        </div>
        <div style="margin-top:2rem;display:flex;gap:0.75rem;flex-wrap:wrap;justify-content:center">
            <span class="badge badge-red">100% Concept Crux</span>
            <span class="badge badge-red">Speaker Analogies</span>
            <span class="badge badge-red">Topic-Isolated Chat</span>
        </div>
    </div>""", unsafe_allow_html=True)