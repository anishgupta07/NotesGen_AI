import os

from langchain_mistralai import ChatMistralAI

os.getenv("MISTRAL_API_KEY")

def get_llm(temperature: float = 0.3, model: str = None):
    return ChatMistralAI(
        model=model or "mistral-small-latest",
        mistral_api_key=os.getenv("MISTRAL_API_KEY"),
        temperature=temperature,
    )