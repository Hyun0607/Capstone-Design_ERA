from vector_db_loader import load_vectordb
from rdb_utils import get_hotels_by_region, build_context_from_sql, get_hotel_info_by_name
from langchain.prompts.chat import SystemMessagePromptTemplate, HumanMessagePromptTemplate, ChatPromptTemplate
from langchain.chat_models import ChatOpenAI
from langchain.chains import LLMChain
import re

# 시스템 프롬프트 템플릿
system_template = """
당신은 고령자 및 장애인을 위한 숙소 추천 도우미입니다.

아래는 후보 숙소 목록입니다. 사용자의 질문을 읽고, **가장 적절한 숙소 3곳을 추천**해 주세요.
추천할 때는 반드시 **context에 주어진 정보만을 바탕으로 판단**해야 하며, **다른 정보는 절대 참고하지 마세요.**
context 중에서도 **숙소 설명**을 우선적으로 참고하세요.

[추천 기준]
- 고령자, 휠체어 이용자, 시각장애인 등 **이동 또는 감각에 제약이 있는 사용자의 요구사항**을 우선적으로 고려하세요.
- 질문에 명시된 조건(예: 휠체어, 엘리베이터, 점자 안내판 등)에 **정확히 대응하는 숙소**를 선별하세요.
- 반드시 숙소 **3곳을 추천해야 하며**, 3개 미만일 경우 추천된 숙소만 출력하세요
- 출력 형식은 아래 예시를 **정확히 그대로 따라야 합니다.**

출력 예시 (정확히 이 형식이어야 함):

1. 숙소명: 속초바다호텔
   주소: 해안로 406번길 17
   장애인 편의시설: 휠체어, 엘리베이터, 점자 안내판

2. 숙소명: 설악힐게스트하우스
   주소: 중앙로 233
   장애인 편의시설: 휠체어, 장애인 주차, 금연 

3. 숙소명: 스카이베이 경포
   주소: 경포로 476
   장애인편의시설: 휠체어, 키 낮은 개수대, 엘리베이터
"""

# 프롬프트 구성
system_msg = SystemMessagePromptTemplate.from_template(system_template)
human_msg = HumanMessagePromptTemplate.from_template("{context}\n\n[사용자 질문]\n{question}")
chat_prompt = ChatPromptTemplate.from_messages([system_msg, human_msg])
llm_chain = LLMChain(prompt=chat_prompt, llm=ChatOpenAI(model_name="gpt-4o", temperature=0.7))

# 벡터 DB 로딩
vectordb = load_vectordb()

def recommend_accommodations(
    user_query: str,
    region_name: str,
    conditions: dict,
    proper_nouns: list,
    top_k: int = 5
) -> list:
    # 1) 프론트 요청 로깅
    print(f"[DEBUG] [프런트 요청] query={user_query!r}, region={region_name!r}, "
          f"conditions={conditions}, properNouns={proper_nouns}")

    # 2) 지역 필터링 포함한 벡터 검색 (메타데이터 키가 실제는 'region'일 수도 있으니 확인 필요)
    try:
        filtered_docs = vectordb.similarity_search(
            user_query,
            k=top_k * 6,
            filter={"시군구명": region_name}  # ← 실제 키명이 'region'이면 여기만 바꾸세요
        )
    except TypeError:
        filtered_docs = vectordb.similarity_search(user_query, k=top_k * 6)

    # 3) RDB 폴백: 벡터 필터가 비었을 때만
    if not filtered_docs:
        region_names = set(get_hotels_by_region(region_name))
        all_docs = vectordb.similarity_search(user_query, k=top_k * 6)
        filtered_docs = [
            doc for doc in all_docs
            if doc.metadata.get("숙소명") in region_names
        ]

    print(f"[DEBUG] 📍 지역 필터 후 문서 수: {len(filtered_docs)}")

    # 4) 상위 K개 숙소 ID 추출
    추천숙소들 = list({doc.metadata["숙소명"] for doc in filtered_docs[:top_k]})
    print(f"[DEBUG] ✅ LLM 파싱 대상 숙소: {추천숙소들}")

    # 5) RDB에서 context 생성
    context = build_context_from_sql(추천숙소들)
    print(f"[DEBUG] 📦 생성된 context:\n{context}")

    # 6) 빈 context 방어: 정보 없으면 LLM 호출 없이 빈 결과 반환
    if not context.strip():
        print("⚠️ context가 비어 있어 LLM 호출 없이 빈 결과 반환")
        return []

    # 7) LLM 호출 (invoke 메서드로 교체)
    llm_response = llm_chain.invoke({"context": context, "question": user_query})
    # invoke가 dict를 반환하면 "text" 필드 사용, 아니면 그대로
    raw_output = llm_response["text"] if isinstance(llm_response, dict) and "text" in llm_response else llm_response
    print("[DEBUG] 🤖 LLM 응답 원문:")
    print(raw_output)

    # 8) LLM 출력 파싱 (번호·공백·콜론 변형 대응)
    pattern = re.compile(
        r"(?:\d+\.\s*)?숙소명[:：]\s*(.+?)\s*[\r\n]+\s*"
        r"주소[:：]\s*(.+?)\s*[\r\n]+\s*"
        r"장애인\s*편의시설[:：]\s*(.+)",
        re.IGNORECASE
    )
    parsed = []
    selected_names = []
    for match in pattern.finditer(raw_output):
        name, desc, tags_str = match.groups()
        # 줄바꿈도 쉼표로 치환해 여러 구분자 대응
        tags = [t.strip() for t in re.split(r"[,\n;]+", tags_str) if t.strip()]
        parsed.append({
            "name": name.strip(),
            "description": desc.strip(),
            "tags": tags,
            "imageUrl": ""
        })
        selected_names.append(name.strip())

    # 9) 후보 숙소 추가 (LLM 추천 외 문서 중)
    candidates = []
    for doc in filtered_docs:
        name = doc.metadata.get("숙소명")
        if name and name not in selected_names and name not in [h["name"] for h in candidates]:
            info = get_hotel_info_by_name(name) or {}
            db_tags = info.get("tags", [])
            meta_tags = doc.metadata.get("tags") or []
            final_tags = db_tags if db_tags else meta_tags
            candidates.append({
                "name": info.get("name", name),
                "description": info.get("address", "") or "",
                "tags": final_tags,
                "imageUrl": info.get("imageUrl") or doc.metadata.get("imageUrl", "")
            })
        if len(candidates) >= 3:
            break

    # 10) LLM 결과 + 후보 숙소 병합
    combined = parsed + candidates
    print(f"[DEBUG] ✅ 최종 반환 숙소 수: {len(combined)}")
    print(f"[DEBUG] ✅ 반환 리스트 내용:\n{combined}")

    return combined
