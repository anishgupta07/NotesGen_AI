import time
from typing import Optional
from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
from core.llm import (
    get_llm,
    extract_and_log_token_usage,
    log_rate_limit_diagnostic,
)
from core.prompts import (
    DETAILED_NOTES_PROMPT,
    CHEATSHEET_PROMPT,
    get_language_instruction,
)

# Safe token limits to strictly stay within Groq free-tier's 8,000 TPM limit:
# 12,000 chars (~3,000 tokens) + 1,400 max completion tokens = ~4,400 tokens per request (< 8,000 TPM limit)
SAFE_CHUNK_SIZE = 12000
SAFE_MAX_TOKENS = 1400

# Rotate across models with independent TPM buckets on Groq
MODEL_ROTATION_POOL = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
]


def get_prompt_by_style(style: str):
    """Select the prompt template based on the chosen note style."""
    if style in ["cheatsheet", "cheat_sheet"]:
        return CHEATSHEET_PROMPT
    return DETAILED_NOTES_PROMPT


def invoke_chain_with_rate_limit_protection(
    chain,
    payload: dict,
    groq_api_key: Optional[str] = None
) -> str:
    """Invokes chain with LangSmith observability, token usage telemetry, and automatic model-pool rotation."""
    prompt = payload.get("__prompt__", DETAILED_NOTES_PROMPT)
    inputs = {k: v for k, v in payload.items() if not k.startswith("__")}
    last_err = None

    for model_name in MODEL_ROTATION_POOL:
        try:
            llm = get_llm(
                temperature=0.2,
                model=model_name,
                max_tokens=SAFE_MAX_TOKENS,
                enable_fallbacks=False,
                api_key=groq_api_key
            )
            pv = prompt.invoke(inputs)
            response = llm.invoke(pv)
            extract_and_log_token_usage(response, model_name=model_name, step_name="Notes Generation")
            return response.content
        except Exception as e:
            last_err = e
            log_rate_limit_diagnostic(e, model_name=model_name)
            time.sleep(1.0)
            continue

    raise RuntimeError(f"Failed to generate notes across model pool: {last_err}")


def generate_video_notes(
    transcript: str,
    style: str = "detailed",
    language: str = "hinglish",
    groq_api_key: Optional[str] = None
) -> str:
    """Generate structured educational notes from video transcript in English or Hinglish.
    Uses the authenticated user's BYOK Groq API key.
    Rotates model pools and sizes requests safely to avoid 8,000 TPM rate limits and 502 timeouts."""
    prompt = get_prompt_by_style(style)
    lang_inst = get_language_instruction(language)

    # 1. Single-pass execution for transcripts within safe TPM size (up to 12,000 characters ~ 3,000 tokens)
    if len(transcript) <= SAFE_CHUNK_SIZE:
        return invoke_chain_with_rate_limit_protection(None, {
            "text": transcript,
            "language_instruction": lang_inst,
            "__prompt__": prompt,
        }, groq_api_key=groq_api_key)

    # 2. Multi-chunk breakdown for longer lectures (> 12,000 chars)
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=SAFE_CHUNK_SIZE,
        chunk_overlap=400,
        separators=["\n[", "\n", " "]
    )
    chunks = splitter.split_text(transcript)

    section_notes = []
    for i, chunk in enumerate(chunks):
        print(f"Generating notes for timeline section {i + 1}/{len(chunks)}...")
        section_note = invoke_chain_with_rate_limit_protection(None, {
            "text": chunk,
            "language_instruction": lang_inst,
            "__prompt__": prompt,
        }, groq_api_key=groq_api_key)
        section_notes.append(section_note)

        # Brief 1s pause between chunks
        if i < len(chunks) - 1:
            time.sleep(1.0)

    return "\n\n---\n\n".join(section_notes)