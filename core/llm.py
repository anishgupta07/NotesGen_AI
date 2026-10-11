import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


def get_llm(
    temperature: float = 0.2,
    model: str = None,
    max_tokens: int = 1500,
    enable_fallbacks: bool = True,
    api_key: Optional[str] = None,
):
    """Factory function returning the best available LLM with automatic rate limit fallback.
    Default: Groq openai/gpt-oss-120b with fallback to qwen/qwen3.8-27b and openai/gpt-oss-20b.
    Accepts custom BYOK Groq API key per user so the host pays $0 for LLM inference.
    """
    groq_api_key = api_key or os.getenv("GROQ_API_KEY")
    if groq_api_key:
        from langchain_groq import ChatGroq

        default_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
        chosen_model = model or default_model

        primary = ChatGroq(
            model=chosen_model,
            groq_api_key=groq_api_key,
            temperature=temperature,
            max_tokens=max_tokens,
            max_retries=2,
        )

        if not enable_fallbacks or model is not None:
            return primary

        # Create fallbacks with independent rate limit pools on Groq
        fallbacks = []
        if chosen_model != "qwen/qwen3.8-27b":
            fallbacks.append(
                ChatGroq(
                    model="qwen/qwen3.8-27b",
                    groq_api_key=groq_api_key,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    max_retries=2,
                )
            )
        if chosen_model != "openai/gpt-oss-20b":
            fallbacks.append(
                ChatGroq(
                    model="openai/gpt-oss-20b",
                    groq_api_key=groq_api_key,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    max_retries=2,
                )
            )

        if fallbacks:
            return primary.with_fallbacks(fallbacks)
        return primary

    # 2. Google Gemini fallback
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if gemini_key:
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=model or "gemini-1.5-flash",
            google_api_key=gemini_key,
            temperature=temperature,
            max_tokens=max_tokens,
            max_retries=3,
        )

    # 3. Mistral AI fallback
    mistral_api_key = os.getenv("MISTRAL_API_KEY")
    if mistral_api_key:
        from langchain_mistralai import ChatMistralAI
        return ChatMistralAI(
            model=model or "mistral-small-latest",
            mistral_api_key=mistral_api_key,
            temperature=temperature,
            max_tokens=max_tokens,
            max_retries=3,
        )

    raise ValueError(
        "❌ No LLM API key found! Please configure your personal Groq API key in Settings."
    )