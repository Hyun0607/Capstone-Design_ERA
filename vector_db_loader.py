from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings

def load_vectordb(persist_dir="./chroma_db2"):
    embedding = OpenAIEmbeddings()
    return Chroma(persist_directory=persist_dir, embedding_function=embedding)