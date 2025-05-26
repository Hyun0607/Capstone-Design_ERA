import pandas as pd
from langchain.schema import Document
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings

df = pd.read_csv("VectorDB_캡스톤.csv").fillna("")

docs = []
for _, row in df.iterrows():
    숙소명 = row["숙소명"]
    시군구명 = row["시군구명"]
    질문들 = [row[f"질문{i}"] for i in range(1, 6) if row[f"질문{i}"].strip()]
    for 질문 in 질문들:
        doc = Document(page_content=질문, metadata={"숙소명": 숙소명, "시군구명": 시군구명})
        docs.append(doc)

embedding = OpenAIEmbeddings()
vectordb = Chroma.from_documents(docs, embedding, persist_directory="./chroma_db2")
vectordb.persist()
print("✅ VectorDB 저장 완료: ./chroma_db2")
