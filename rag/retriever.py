

from langchain_chroma import Chroma

def get_retriever(vector_store: Chroma, k: int = 4):
    return vector_store.as_retriever(
        search_type = 'similarity',
        search_kwargs = {"k":k}
    )