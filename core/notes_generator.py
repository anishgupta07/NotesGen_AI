from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
from core.llm import get_llm
from core.prompts import (
    STUDY_GUIDE_PROMPT,
    CORNELL_NOTES_PROMPT,
    CHEATSHEET_PROMPT,
    get_language_instruction,
)


def get_prompt_by_style(style: str):
    """Select the prompt template based on the chosen note style."""
    if style == "cornell":
        return CORNELL_NOTES_PROMPT
    elif style == "cheatsheet":
        return CHEATSHEET_PROMPT
    return STUDY_GUIDE_PROMPT  # Default: study_guide


def generate_video_notes(
    transcript: str,
    style: str = "study_guide",
    language: str = "english"
) -> str:
    """Generate structured educational notes from video transcript in English or Hinglish."""
    llm = get_llm(temperature=0.2)  # Low temperature for accurate, structured notes
    prompt = get_prompt_by_style(style)
    chain = prompt | llm | StrOutputParser()
    lang_inst = get_language_instruction(language)

    # For transcripts within context window (approx < 20,000 characters)
    if len(transcript) <= 20000:
        return chain.invoke({
            "text": transcript,
            "language_instruction": lang_inst,
        })

    # For very long transcripts, handle via chunking
    splitter = RecursiveCharacterTextSplitter(chunk_size=12000, chunk_overlap=500)
    chunks = splitter.split_text(transcript)

    section_notes = []
    for i, chunk in enumerate(chunks):
        print(f"Generating notes for section {i + 1}/{len(chunks)}...")
        section_note = chain.invoke({
            "text": chunk,
            "language_instruction": lang_inst,
        })
        section_notes.append(section_note)

    return "\n\n---\n\n".join(section_notes)