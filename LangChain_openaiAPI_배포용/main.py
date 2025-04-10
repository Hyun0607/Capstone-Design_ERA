from rag_core import build_documents, store_embeddings, recommend_accommodations
from config import PERSIST_DIR
import os

# ✅ 조건부 실행: 벡터 DB가 없을 때만 초기화
if not os.path.exists(PERSIST_DIR + "/index"):
    print("🔄 벡터 DB가 없어서 새로 생성 중...")
    documents = build_documents("VectorDB(최종).csv")
    store_embeddings(documents)
else:
    print("✅ 기존 벡터 DB가 존재하여 로딩합니다.")

# ✅ 테스트 쿼리 실행
query = "휠체어가 이동할 수 있는 숙소를 추천해줘"
지역명 = "강릉시"

print("\n🤖 AI 추천 결과:\n")
print(recommend_accommodations(query, 지역명))
