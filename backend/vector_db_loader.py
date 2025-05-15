import os
from dotenv import load_dotenv
load_dotenv()

from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

PERSIST_DIRECTORY = os.getenv("PERSIST_DIRECTORY", "./chroma_db2")

def load_vectordb(persist_dir=PERSIST_DIRECTORY):
    embedding = OpenAIEmbeddings()
    return Chroma(persist_directory=persist_dir, embedding_function=embedding)
