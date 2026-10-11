import time
from typing import Optional
from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
from core.llm import get_llm
from core.prompts import (
    DETAILED_NOTES_PROMPT,
    CHEATSHEET_PROMPT,
    get_language_instruction,
)

# Safe token limits to strictly respect Groq's 8,000 TPM limit
SAFE_CHUNK_SIZE = 4200        # ~1,000 tokens of transcript text
SAFE_MAX_TOKENS = 1400        # Max completion tokens per chunk call


def get_prompt_by_style(style: str):
    """Select the prompt template based on the chosen note style."""
    if style in ["cheatsheet", "cheat_sheet"]:
        return CHEATSHEET_PROMPT
    return DETAILED_NOTES_PROMPT  # Default: detailed notes


def invoke_chain_with_rate_limit_protection(
    chain,
    payload: dict,
    max_retries: int = 3,
    groq_api_key: Optional[str] = None
) -> str:
    """Invokes chain with automatic retry, backoff, and fallback handling for TPM limits."""
    for attempt in range(max_retries):
        try:
            return chain.invoke(payload)
        except Exception as e:
            err_str = str(e).lower()
            if "rate_limit" in err_str or "too large" in err_str or "tpm" in err_str or "413" in err_str or "429" in err_str:
                wait_sec = (attempt + 1) * 3
                print(f"Rate limit / TPM pause: waiting {wait_sec}s before retry ({attempt + 1}/{max_retries})...")
                time.sleep(wait_sec)
                # On last retry, try with fast fallback model
                if attempt == max_retries - 2:
                    try:
                        fallback_llm = get_llm(
                            temperature=0.2,
                            model="qwen/qwen3.8-27b",
                            max_tokens=SAFE_MAX_TOKENS,
                            api_key=groq_api_key
                        )
                        fallback_chain = payload.get("__prompt__", DETAILED_NOTES_PROMPT) | fallback_llm | StrOutputParser()
                        return fallback_chain.invoke(payload)
                    except Exception:
                        pass
            else:
                raise e
    raise RuntimeError("Failed to generate notes after rate-limit backoff retries.")


def generate_video_notes(
    transcript: str,
    style: str = "detailed",
    language: str = "hinglish",
    groq_api_key: Optional[str] = None
) -> str:
    """Generate structured educational notes from video transcript in English or Hinglish.
    Uses the authenticated user's BYOK Groq API key and respects TPM limits."""
    llm = get_llm(temperature=0.2, max_tokens=SAFE_MAX_TOKENS, enable_fallbacks=True, api_key=groq_api_key)
    prompt = get_prompt_by_style(style)
    chain = prompt | llm | StrOutputParser()
    lang_inst = get_language_instruction(language)

    # 1. Single-chunk execution for short/medium clips (up to 4,200 chars ~ 1,000 tokens)
    if len(transcript) <= SAFE_CHUNK_SIZE:
        return invoke_chain_with_rate_limit_protection(chain, {
            "text": transcript,
            "language_instruction": lang_inst,
            "__prompt__": prompt,
        }, groq_api_key=groq_api_key)

    # 2. Multi-chunk timeline breakdown for longer videos
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=SAFE_CHUNK_SIZE,
        chunk_overlap=300,
        separators=["\n[", "\n", " "]
    )
    chunks = splitter.split_text(transcript)

    section_notes = []
    for i, chunk in enumerate(chunks):
        print(f"Generating notes for timeline section {i + 1}/{len(chunks)}...")
        section_note = invoke_chain_with_rate_limit_protection(chain, {
            "text": chunk,
            "language_instruction": lang_inst,
            "__prompt__": prompt,
        }, groq_api_key=groq_api_key)
        section_notes.append(section_note)

        # Brief pause between chunks to let Groq's per-minute token bucket replenish
        if i < len(chunks) - 1:
            time.sleep(2.0)

    return "\n\n---\n\n".join(section_notes)