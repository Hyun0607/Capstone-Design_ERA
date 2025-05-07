from fastapi import FastAPI
from pydantic import BaseModel
from rag_engine import recommend_accommodations

app = FastAPI()

class RecommendRequest(BaseModel):
    question: str
    region: str

@app.post("/recommend")
def recommend(req: RecommendRequest):
    response = recommend_accommodations(req.question, req.region)
    return {"result": response}