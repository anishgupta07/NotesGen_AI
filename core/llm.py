import os
from dotenv import load_dotenv

load_dotenv()


def get_llm(temperature: float = 0.3, model: str = None):
    """Factory function returning the best available LLM.
    Checks environment for GROQ_API_KEY, GEMINI_API_KEY/GOOGLE_API_KEY,
    or falls back to MISTRAL_API_KEY.
    """
    # 1. Groq — Ultra-fast, generous free rate limits (14,400 requests/day)
    groq_api_key = os.getenv("GROQ_API_KEY")
    if groq_api_key:
        from langchain_groq import ChatGroq
        default_groq = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
        return ChatGroq(
            model=model or default_groq,
            groq_api_key=groq_api_key,
            temperature=temperature,
            max_retries=3,
        )

    # 2. Google Gemini — 1M token context window, generous free tier (1,500 req/day)
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if gemini_key:
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=model or "gemini-1.5-flash",
            google_api_key=gemini_key,
            temperature=temperature,
            max_retries=3,
        )

    # 3. Mistral AI — Fallback
    mistral_api_key = os.getenv("MISTRAL_API_KEY")
    if mistral_api_key:
        from langchain_mistralai import ChatMistralAI
        return ChatMistralAI(
            model=model or "mistral-small-latest",
            mistral_api_key=mistral_api_key,
            temperature=temperature,
            max_retries=5,
        )

    raise ValueError(
        "❌ No LLM API key found! Please set GROQ_API_KEY, GEMINI_API_KEY, or MISTRAL_API_KEY in your .env file."
    )