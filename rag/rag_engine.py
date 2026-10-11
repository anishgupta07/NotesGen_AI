import os
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from rag.vector_store import build_vector_store, load_vector_store
from rag.retriever import get_retriever
from core.llm import get_llm

def format_docs(docs):
    return "\n\n".join([doc.page_content for doc in docs])

def build_rag_chain(transcript: str):
    vector_store = build_vector_store(transcript)
    retriever = get_retriever(vector_store, k=4)
    llm = get_llm()

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are NotesGen AI, an expert video learning assistant. Answer the user's question 
based ONLY on the video transcript context provided below.

If the answer is not found in the context, say: 
"I could not find this information in the video transcript."

Always be concise, precise, and educational. If the speaker used a specific analogy or example, cite it clearly.

Context from video transcript:
{context}""",
            ),
            ("human", "{question}"),
        ]
    )

    rag_chain = (
        {
            "context": retriever | RunnableLambda(format_docs),
            "question": RunnablePassthrough(),
        }
        | prompt
        | llm
        | StrOutputParser()
    )

    return rag_chain


def load_rag_chain():
    vector_store = load_vector_store()
    retriever = get_retriever(vector_store, k=4)
    llm = get_llm()

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """You are NotesGen AI, an expert video learning assistant. Answer the user's question 
based ONLY on the video transcript context provided below.

If the answer is not found in the context, say: 
"I could not find this information in the video transcript."

Always be concise, precise, and educational. If the speaker used a specific analogy or example, cite it clearly.

Context from video transcript:
{context}""",
        ),
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

    return rag_chain


def ask_question(rag_chain, question: str) -> str:
    print(f"Question: {question}")
    answer = rag_chain.invoke(question)
    print(f"Answer: {answer}")
    return answer
