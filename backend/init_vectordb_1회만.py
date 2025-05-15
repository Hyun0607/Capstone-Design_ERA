import pandas as pd
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.schema import Document
from dotenv import load_dotenv
import os

load_dotenv()
PERSIST_DIRECTORY = os.getenv("PERSIST_DIRECTORY", "./chroma_db2")

# ✅ CSV 파일 불러오기
df = pd.read_csv("VectorDB_캡스톤.csv").fillna("")

# ✅ Document 리스트 구성
docs = []
for _, row in df.iterrows():
    name = row["숙소명"].strip()
    for i in range(1, 6):
        question = row.get(f"질문{i}", "").strip()
        if question:
            docs.append(Document(
                page_content=question,
                metadata={"숙소명": name}
            ))

# ✅ 임베딩 및 벡터 저장
embedding = OpenAIEmbeddings()
vectordb = Chroma.from_documents(docs, embedding, persist_directory=PERSIST_DIRECTORY)
print("✅ 벡터 DB 저장 완료")
