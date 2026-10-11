# Educational insights and concept extraction for NotesGen AI

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from core.llm import get_llm
import os 


def build_chain(system_prompt: str):
    llm = get_llm(temperature=0.2)
    return (
        RunnablePassthrough() | RunnableLambda(lambda x: {"text": x}) | ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{text}"),
        ]) | llm | StrOutputParser()
    )


def extract_key_concepts(transcript: str) -> str:
    """Extract primary educational concepts and definitions from video transcript."""
    chain = build_chain(
        "You are an expert video study analyst. From the video transcript, "
        "extract the core concepts, principles, and key definitions covered. "
        "For each concept, explain its crux and any analogy used by the speaker. "
        "Format as a structured numbered list."
    )
    return chain.invoke(transcript)


def extract_action_items(transcript: str) -> str:
    """Extract practical exercises, steps, or homework mentioned in the video."""
    chain = build_chain(
        "You are an expert educational coach. From the video transcript, "
        "extract all practical exercises, action steps, or practice tasks mentioned for learners:\n"
        "- Task / Exercise description\n"
        "- Suggested approach or tool\n\n"
        "Format as a numbered list. If none found say 'No specific practice tasks assigned.'"
    )
    return chain.invoke(transcript)


def extract_key_decisions(transcript: str) -> str:
    """Extract key takeaways and conclusions from the video."""
    chain = build_chain(
        "You are an expert educational analyst. From the video transcript, "
        "extract all major takeaways, conclusions, and core lessons established. "
        "Format as a numbered list. If none found say 'No key conclusions found.'"
    )
    return chain.invoke(transcript)


def extract_questions(transcript: str) -> str:
    """Extract self-study questions or practice questions from the video."""
    chain = build_chain(
        "From the video transcript, extract important questions raised, self-test questions, "
        "or thought experiments that test understanding of the material. "
        "Format as a numbered list. If none found say 'No open questions found.'"
    )
    return chain.invoke(transcript)