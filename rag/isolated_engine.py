import os
import json
from pathlib import Path
from typing import List, Optional
from langchain_community.retrievers import TFIDFRetriever
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from core.llm import get_llm, extract_and_log_token_usage
from core.db import get_chat

DATA_DIR_ENV = os.getenv("DATA_DIR")
if DATA_DIR_ENV:
    CHROMA_DIR = Path(DATA_DIR_ENV) / "vector_db"
else:
    CHROMA_DIR = Path(__file__).resolve().parent.parent / "data" / "vector_db"

CHROMA_DIR.mkdir(parents=True, exist_ok=True)


def build_isolated_vector_store(chat_id: str, transcript: str):
    """Build and persist lightweight chunk index for this specific chat.
    Uses ultra-efficient text splitting that consumes < 1MB RAM (prevents cloud server 512MB OOM crashes).
    """
    clean_id = chat_id.replace("-", "_")
    store_file = CHROMA_DIR / f"{clean_id}.json"

    splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=80)
    chunks = splitter.split_text(transcript)

    doc_data = [
        {"content": chunk, "chunk_index": i, "chat_id": chat_id}
        for i, chunk in enumerate(chunks)
    ]

    with open(store_file, "w", encoding="utf-8") as f:
        json.dump(doc_data, f, ensure_ascii=False)


def get_isolated_retriever(chat_id: str, k: int = 5) -> TFIDFRetriever:
    """Build lightweight on-demand TF-IDF retriever for this chat."""
    clean_id = chat_id.replace("-", "_")
    store_file = CHROMA_DIR / f"{clean_id}.json"

    docs: List[Document] = []

    if store_file.exists():
        try:
            with open(store_file, "r", encoding="utf-8") as f:
                doc_data = json.load(f)
            docs = [Document(page_content=d["content"], metadata={"chunk_index": d["chunk_index"]}) for d in doc_data]
        except Exception:
            docs = []

    # Fallback to loading transcript from database if json not found
    if not docs:
        chat_record = get_chat(chat_id)
        if chat_record and chat_record.get("transcript"):
            splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=80)
            chunks = splitter.split_text(chat_record["transcript"])
            docs = [Document(page_content=c, metadata={"chunk_index": i}) for i, c in enumerate(chunks)]

    if not docs:
        docs = [Document(page_content="No transcript context available for this video.")]

    k_val = min(k, len(docs))
    return TFIDFRetriever.from_documents(docs, k=k_val)


# Backwards compatibility alias
load_isolated_vector_store = get_isolated_retriever


def format_docs(docs: List[Document]) -> str:
    return "\n\n".join([doc.page_content for doc in docs])


def query_isolated_rag(
    chat_id: str,
    question: str,
    video_title: str,
    language: str = "english",
    recent_history: list = None,
    groq_api_key: Optional[str] = None
) -> str:
    """Query the isolated RAG engine with strict topic guardrails, speaker analogy preservation, and Hinglish fidelity."""
    retriever = get_isolated_retriever(chat_id, k=5)
    llm = get_llm(temperature=0.2, api_key=groq_api_key)

    history_context = ""
    if recent_history:
        history_lines = [f"{m['role'].capitalize()}: {m['content']}" for m in recent_history[-4:]]
        history_context = "Recent Conversation:\n" + "\n".join(history_lines) + "\n\n"

    lang_rule = (
        "5. STRICT HINGLISH: The session language is 'hinglish'. You MUST explain the answers in natural, fluent Hinglish (Hindi written in Roman/English alphabet, e.g., 'Video mein sir ne bataya ki...', 'Iska intuition yeh hai...'). Keep technical terms in English, but write sentences in conversational Roman Hindi. DO NOT answer in pure English!"
        if language.lower() in ["hinglish", "hindi"]
        else "5. LANGUAGE: Provide clear, professional answers in English."
    )

    system_prompt = f"""You are an expert AI tutor strictly dedicated to the educational video: "{video_title}".
Your job is to answer user questions using ONLY the video transcript context provided below.

CRITICAL GUARDRAIL & TUTOR RULES:
1. TOPIC RESTRICTION: You must ONLY answer questions that are directly related to "{video_title}" and its transcript content.
2. STRICT REFUSAL: If the user asks about ANY topic outside this video (including general trivia, other academic subjects, off-topic coding questions, cooking, jokes, or general AI queries not covered in this video), you MUST refuse politely:
   "I can only answer questions related to this video on '{video_title}'. Please ask a question about this topic."
3. GROUNDING: Do not hallucinate. If the user asks about something from this video that was not mentioned in the transcript, say clearly: "This detail was not mentioned in the video."
4. SPEAKER'S EXACT ANALOGIES: When explaining any concept, solution, or intuition, you MUST use the EXACT analogies, metaphors, and real-world examples given by the speaker in the video rather than textbook definitions.
{lang_rule}
6. TIMELINE AWARENESS: If the user asks what happens in a specific timeline (e.g., '0:00 - 5:00' or 'at 03:45'), locate the relevant timestamped chunks and summarize that portion.

Video Title: {video_title}
{history_context}Transcript Context:
{{context}}
"""

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{question}"),
    ])

    llm_runner = (
        {
            "context": retriever | RunnableLambda(format_docs),
            "question": RunnablePassthrough(),
        }
        | prompt
        | llm
    )

    response = llm_runner.invoke(question)
    model_name = getattr(llm, "model_name", getattr(llm, "model", "Groq"))
    extract_and_log_token_usage(response, model_name=model_name, step_name="RAG Chat")
    return response.content
