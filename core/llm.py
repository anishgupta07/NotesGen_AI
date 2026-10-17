import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


def setup_langsmith_tracing(api_key: Optional[str] = None, project: Optional[str] = None) -> bool:
    """Configures LangSmith tracing layer to monitor token counts, latency, and rate-limit diagnostics.
    Can be configured via environment variables (LANGCHAIN_API_KEY / LANGSMITH_API_KEY) or per-user key."""
    key = api_key or os.getenv("LANGCHAIN_API_KEY") or os.getenv("LANGSMITH_API_KEY")
    if key and key.strip():
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_API_KEY"] = key.strip()
        os.environ["LANGCHAIN_ENDPOINT"] = os.getenv("LANGCHAIN_ENDPOINT", "https://api.smith.langchain.com")
        os.environ["LANGCHAIN_PROJECT"] = project or os.getenv("LANGCHAIN_PROJECT", "NotesGen-AI")
        return True
    return False


# Auto-activate on startup if environment keys are present
setup_langsmith_tracing()


def get_langsmith_status() -> dict:
    """Check if LangSmith observability tracing is currently enabled."""
    is_active = os.getenv("LANGCHAIN_TRACING_V2", "").lower() == "true" and bool(os.getenv("LANGCHAIN_API_KEY"))
    return {
        "active": is_active,
        "project": os.getenv("LANGCHAIN_PROJECT", "NotesGen-AI") if is_active else None,
        "endpoint": os.getenv("LANGCHAIN_ENDPOINT", "https://api.smith.langchain.com") if is_active else None,
    }


def extract_and_log_token_usage(
    response,
    model_name: str = "Unknown",
    step_name: str = "Generation"
) -> dict:
    """Extract token counts (prompt, completion, total) and log telemetry to console for rate-limit tracking."""
    usage = {}
    if hasattr(response, "usage_metadata") and response.usage_metadata:
        usage = {
            "prompt_tokens": response.usage_metadata.get("input_tokens", 0),
            "completion_tokens": response.usage_metadata.get("output_tokens", 0),
            "total_tokens": response.usage_metadata.get("total_tokens", 0),
        }
    elif hasattr(response, "response_metadata") and response.response_metadata:
        raw_usage = response.response_metadata.get("token_usage", {})
        usage = {
            "prompt_tokens": raw_usage.get("prompt_tokens", 0),
            "completion_tokens": raw_usage.get("completion_tokens", 0),
            "total_tokens": raw_usage.get("total_tokens", 0),
        }

    prompt_tokens = usage.get("prompt_tokens", 0)
    completion_tokens = usage.get("completion_tokens", 0)
    total_tokens = usage.get("total_tokens", prompt_tokens + completion_tokens)
    pct_tpm = (total_tokens / 8000.0) * 100.0 if total_tokens else 0.0

    print(
        f"📊 [LangSmith/Token Telemetry] [{step_name}] Model: {model_name} | "
        f"Prompt: {prompt_tokens:,} tokens | Output: {completion_tokens:,} tokens | "
        f"Total: {total_tokens:,} tokens (~{pct_tpm:.1f}% of Groq 8k TPM limit)"
    )
    return {
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "total_tokens": total_tokens,
        "pct_tpm": pct_tpm,
    }


def log_rate_limit_diagnostic(error: Exception, model_name: str) -> str:
    """Diagnose and explain why a rate limit (HTTP 429) or model error occurred."""
    err_str = str(error)
    print(f"⚠️ [Rate Limit Diagnostic] Model '{model_name}' encountered error:\n   ↳ {err_str}")

    lower = err_str.lower()
    if "rate limit" in lower or "429" in lower or "tpm" in lower:
        print(
            f"💡 [Rate Limit Analysis] Model '{model_name}' hit Groq's 8,000 TPM limit. "
            f"Rotating immediately to another model pool with an independent TPM quota..."
        )
        return "TPM_RATE_LIMIT"
    elif "404" in lower or "does not exist" in lower:
        print(
            f"💡 [Model Deprecation Notice] Model '{model_name}' is deprecated or requires enterprise tier. "
            f"Rotating to next active developer model..."
        )
        return "MODEL_NOT_FOUND"
    return "UNKNOWN_ERROR"


def get_llm(
    temperature: float = 0.2,
    model: str = None,
    max_tokens: int = 1500,
    enable_fallbacks: bool = True,
    api_key: Optional[str] = None,
):
    """Factory function returning the best available LLM with automatic rate limit fallback.
    Default: Groq openai/gpt-oss-120b (flagship open-source model, 131k context) with fallback to openai/gpt-oss-20b.
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

        # Create fallbacks with independent models on Groq developer plan
        fallbacks = []
        for fb_model in ["openai/gpt-oss-20b", "qwen/qwen3.8-27b"]:
            if chosen_model != fb_model:
                fallbacks.append(
                    ChatGroq(
                        model=fb_model,
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