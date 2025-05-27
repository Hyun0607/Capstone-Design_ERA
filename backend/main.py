# main.py
from dotenv import load_dotenv
load_dotenv()

import os
import json
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, List
from rag_engine import recommend_accommodations

app = FastAPI()

# 프로젝트 루트(또는 main.py와 같은 폴더)에 위치한 image_urls.json 파일 경로 설정
BASE_DIR = os.path.dirname(__file__)
IMAGE_URLS_PATH = os.path.join(BASE_DIR, "image_urls.json")

# JSON 파일에서 URL 매핑 불러오기
try:
    with open(IMAGE_URLS_PATH, encoding="utf-8") as f:
        url_map: Dict[str, str] = json.load(f)
except FileNotFoundError:
    print(f"[WARN] image_urls.json 파일을 찾을 수 없습니다: {IMAGE_URLS_PATH}")
    url_map = {}
except json.JSONDecodeError as e:
    print(f"[ERROR] image_urls.json 파싱 실패: {e}")
    url_map = {}

print("[DEBUG] OPENAI_API_KEY →", os.getenv("OPENAI_API_KEY"))

# 프런트에서 보내는 요청 구조 정의
class RecommendRequest(BaseModel):
    query: str
    region: str
    people: str
    conditions: Dict[str, bool]
    properNouns: List[str]

@app.post("/api/recommend")
def recommend(req: RecommendRequest):
    print("\n🔹 [프런트에서 받은 요청]")
    print(f" - query       : {req.query}")
    print(f" - region      : {req.region}")
    print(f" - people      : {req.people}")
    print(f" - conditions  : {req.conditions}")
    print(f" - properNouns : {req.properNouns}")

    # 숙소 추천 실행
    response = recommend_accommodations(
        user_query=req.query,
        region_name=req.region,
        conditions=req.conditions,
        proper_nouns=req.properNouns
    )

    # JSON 파일에서 불러온 매핑으로 imageUrl 할당
    for item in response:
        name = item.get("name", "")
        item["imageUrl"] = url_map.get(name, "")

    print("\n✅ [백엔드 응답 결과]")
    for item in response:
        print(f"- {item}")

    return {"results": response}
