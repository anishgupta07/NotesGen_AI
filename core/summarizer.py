from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from core.llm import get_llm
import os 


def split_transcript(transcript: str) -> list:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=3000,
        chunk_overlap=200
    )
    return splitter.split_text(transcript)


def summarize(transcript: str, groq_api_key: str = None) -> str:
    llm = get_llm(api_key=groq_api_key)

    map_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "Summarize this portion of a video transcript concisely."),
            ("human", "{text}"),
        ]
    )

    map_chain = map_prompt | llm | StrOutputParser()

    chunks = split_transcript(transcript)
    chunk_summaries = [map_chain.invoke({"text": chunk}) for chunk in chunks]
    combined = "\n\n".join(chunk_summaries)

    combined_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are an expert video summarizer and study note analyst. Combine these partial summaries "
                "into one comprehensive, structured video summary in bullet points.",
            ),
            ("human", "{text}"),
        ]
    )

    combined_chain = (
        RunnablePassthrough() | RunnableLambda(lambda x: {"text": x}) | combined_prompt | llm | StrOutputParser()
    )

    return combined_chain.invoke(combined)


def generate_title(transcript: str, groq_api_key: str = None) -> str:
    llm = get_llm(model="qwen/qwen3.8-27b", max_tokens=40, temperature=0.2, api_key=groq_api_key)

    title_chain = (
        RunnablePassthrough() | RunnableLambda(lambda x: {"text": x}) | 
        ChatPromptTemplate.from_messages([
            (
                "system",
                "Based on the transcript, generate a short professional educational video title "
                "(max 7 words). Only return the title, nothing else.",
            ),
            ("human", "{text}"),
        ])
        | llm
        | StrOutputParser()
    )

    return title_chain.invoke(transcript[:1000]).strip().strip('"\'')
