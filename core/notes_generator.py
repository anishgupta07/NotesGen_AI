from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
from core.llm import get_llm
from core.prompts import (
    DETAILED_NOTES_PROMPT,
    CHEATSHEET_PROMPT,
    get_language_instruction,
)


def get_prompt_by_style(style: str):
    """Select the prompt template based on the chosen note style."""
    if style in ["cheatsheet", "cheat_sheet"]:
        return CHEATSHEET_PROMPT
    return DETAILED_NOTES_PROMPT  # Default: detailed notes


def generate_video_notes(
    transcript: str,
    style: str = "detailed",
    language: str = "hinglish"
) -> str:
    """Generate structured educational notes from video transcript in English or Hinglish.
    Preserves speaker's exact analogies, structures timeline blocks, and adheres to strict length."""
    llm = get_llm(temperature=0.2)
    prompt = get_prompt_by_style(style)
    chain = prompt | llm | StrOutputParser()
    lang_inst = get_language_instruction(language)

    # For transcripts up to 20,000 characters (covers ~25-30 min videos easily)
    if len(transcript) <= 20000:
        return chain.invoke({
            "text": transcript,
            "language_instruction": lang_inst,
        })

    # For longer transcripts, split into chronological blocks with overlap
    splitter = RecursiveCharacterTextSplitter(chunk_size=14000, chunk_overlap=800)
    chunks = splitter.split_text(transcript)

    section_notes = []
    for i, chunk in enumerate(chunks):
        section_note = chain.invoke({
            "text": chunk,
            "language_instruction": lang_inst,
        })
        section_notes.append(section_note)

    return "\n\n---\n\n".join(section_notes)