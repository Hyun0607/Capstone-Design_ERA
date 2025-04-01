from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from app.core import llm_chain, retriever, engine

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    question: str

@app.post("/recommend")
async def recommend(query: QueryRequest):
    question = query.question

    # ✅ 비동기 문서 검색
    similar_docs = await retriever.ainvoke(question)
    context = "\n".join([doc.page_content for doc in similar_docs])

    # ✅ 비동기 응답 생성
    response = await llm_chain.ainvoke({
        "context": context,
        "question": question
    })

    # DB 로그 저장
    with engine.begin() as conn:
        conn.execute(
            text("INSERT INTO query_logs (user_query, model_response) VALUES (:q, :r)"),
            {"q": question, "r": response}
        )

    return {"response": response}
#.\venv310\Scripts\Activate.ps1
#uvicorn app.main:app --reload