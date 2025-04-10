!pip install -U langchain langchain-community
!pip install chromadb
!pip install tiktoken

from langchain.chat_models import ChatOpenAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.vectorstores import Chroma
from langchain.schema import Document
from langchain.embeddings import OpenAIEmbeddings
import pandas as pd
from sqlalchemy import create_engine
import os