from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, List
from rag_engine import recommend_accommodations

app = FastAPI()

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

    print("\n✅ [백엔드 응답 결과]")
    print(response)

    # ——— 하드코딩 이미지 URL 매핑 ———
    url_map = {
        "주문진리조트":       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWlOEH2zomiGPWdrFyMlbnLWSyCh6vY0y88g&s",
        "경포수 호텔":         "https://mblogthumb-phinf.pstatic.net/MjAyNDA4MjVfMTgg/MDAxNzI0NTc1NjAyMzA1.-baoxkCCv1ywB_QnKHsBSydsMkEfq23UHMs0pZ992TIg.K2WGjQJFAtx440-XTN_n-4ytEIJp7Kvvpe4tS3C02FIg.PNG/%EA%B0%95%EB%A6%89%EA%B2%BD%ED%8F%AC%EC%88%98%ED%98%B8%ED%85%94-1.png?type=w800",
        "루이스호텔":           "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRocbxKOV9MaYgUnDbCSwRXPUpSr06ZPTapNQ&s",
        "스카이 베이 경포":     "https://mblogthumb-phinf.pstatic.net/MjAyNDA4MDhfMjAx/MDAxNzIzMTAwMDM1MDI2.Dovpt_bHO_5Vm7ibuzIeadfrSk_7vKN6hnUdmXl1JPsg.VTcORaTQ42E_05dwHOo6k8ieywWruOqJQlYk_0xo8_Ig.JPEG/SE-33f0f3f2-2df3-46e3-9d4e-6e48d377691a.jpg?type=w800",
        "강릉 그레이 호텔":    "https://cf.bstatic.com/xdata/images/hotel/max1024x768/421300564.jpg?k=e1602a47a5840c9720cca824afa6314b533ae8cc75d1a54c4e198ebbadd2bd43&o=&hp=1",
    }

    for item in response:
        # item은 {'name':…, 'description':…, 'imageUrl':…} 구조라고 가정
        item["imageUrl"] = url_map.get(item.get("name", ""), "")

    # 프론트가 기대하는 형태로 감싸서 반환
    return {"results": response}
