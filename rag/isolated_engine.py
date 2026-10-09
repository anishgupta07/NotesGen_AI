import os
from pathlib import Path
from langchain_chroma import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from rag.embeddings import get_embeddings
from core.llm import get_llm

CHROMA_DIR = str(Path(__file__).resolve().parent.parent / "data" / "vector_db")


def sanitize_collection_name(chat_id: str) -> str:
    """Chroma collection names must be alphanumeric between 3-63 characters."""
    clean_id = chat_id.replace("-", "_")
    return f"c_{clean_id}"[:63]


def build_isolated_vector_store(chat_id: str, transcript: str) -> Chroma:
    """Build or update an isolated Chroma collection dedicated to this specific chat."""
    collection_name = sanitize_collection_name(chat_id)
    splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=80)
    chunks = splitter.split_text(transcript)

    docs = [
        Document(page_content=chunk, metadata={"chat_id": chat_id, "chunk_index": i})
        for i, chunk in enumerate(chunks)
    ]

    embeddings = get_embeddings()
    vector_store = Chroma.from_documents(
        documents=docs,
        embedding=embeddings,
        collection_name=collection_name,
        persist_directory=CHROMA_DIR,
    )
    return vector_store


def load_isolated_vector_store(chat_id: str) -> Chroma:
    """Load existing isolated Chroma collection for this chat."""
    collection_name = sanitize_collection_name(chat_id)
    embeddings = get_embeddings()
    return Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=CHROMA_DIR,
    )


def format_docs(docs) -> str:
    return "\n\n".join([doc.page_content for doc in docs])


def query_isolated_rag(chat_id: str, question: str, video_title: str, recent_history: list = None) -> str:
    """Query the isolated RAG engine with strict topic guardrails."""
    vector_store = load_isolated_vector_store(chat_id)
    retriever = vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 4})
    llm = get_llm(temperature=0.2)

    history_context = ""
    if recent_history:
        history_lines = [f"{m['role'].capitalize()}: {m['content']}" for m in recent_history[-4:]]
        history_context = "Recent Conversation:\n" + "\n".join(history_lines) + "\n\n"

    system_prompt = f"""You are an expert AI tutor strictly dedicated to the video: "{video_title}".
Your job is to answer user questions using ONLY the video transcript context provided below.

CRITICAL GUARDRAIL RULES:
1. TOPIC RESTRICTION: You must ONLY answer questions that are directly related to "{video_title}" and its transcript content.
2. STRICT REFUSAL: If the user asks about ANY topic outside this video (including general trivia, other academic subjects, off-topic coding questions, cooking, jokes, or general AI queries not covered in this video), you MUST refuse politely:
   "I can only answer questions related to this video on '{video_title}'. Please ask a question about this topic."
3. GROUNDING: Do not hallucinate. If the user asks about something from this video that was not mentioned in the transcript, say clearly: "This detail was not mentioned in the video."
4. LANGUAGE MATCH: If the user asks in Hinglish, reply in clear Hinglish. If in English, reply in English.

Video Title: {video_title}
{history_context}Transcript Context:
{{context}}
"""

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{question}"),
    ])

    rag_chain = (
        {
            "context": retriever | RunnableLambda(format_docs),
            "question": RunnablePassthrough(),
        }
        | prompt
        | llm
        | StrOutputParser()
    )

    return rag_chain.invoke(question)
