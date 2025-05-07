from vector_db_loader import load_vectordb
from db_utils import get_hotels_by_region, build_context_from_sql
from langchain.prompts.chat import SystemMessagePromptTemplate, HumanMessagePromptTemplate, ChatPromptTemplate
from langchain.chat_models import ChatOpenAI
from langchain.chains import LLMChain

# ✅ 프롬프트 (사용자 정의 스타일 반영)
system_template = """
당신은 고령자 및 장애인을 위한 숙소 추천 도우미입니다.

아래는 후보 숙소 목록입니다. 사용자의 질문을 읽고, **가장 적절한 숙소 3곳을 추천**해 주세요.
추천할 때는 반드시 **context에 주어진 정보만을 바탕으로 판단**해야 하며, **다른 정보는 절대 참고하지 마세요.**

[추천 기준]
- 고령자, 휠체어 이용자, 시각장애인 등 **이동 또는 감각에 제약이 있는 사용자의 요구사항**을 우선적으로 고려하세요.
- 질문에 명시된 조건(예: 휠체어, 엘리베이터, 점자 안내판 등)에 **정확히 대응하는 숙소**를 선별하세요.
- 반드시 숙소 **3곳을 추천해야 하며, 3개 미만 또는 초과로 출력하지 마세요.**
- 출력 형식은 아래 예시를 **정확히 그대로 따라야 합니다.**

출력 예시 (정확히 이 형식이어야 함):

1. 숙소명: 속초바다호텔
   주소: 해안로 406번길 17

2. 숙소명: 설악힐게스트하우스
   주소: 중앙로 233

3. 숙소명: 스카이베이 경포
   주소: 경포로 476
"""

system_msg = SystemMessagePromptTemplate.from_template(system_template)
human_msg = HumanMessagePromptTemplate.from_template("{context}\n\n[사용자 질문]\n{question}")
chat_prompt = ChatPromptTemplate.from_messages([system_msg, human_msg])
llm_chain = LLMChain(prompt=chat_prompt, llm=ChatOpenAI(model_name="gpt-4o", temperature=0.7))

vectordb = load_vectordb()

# ✅ 최종 추천 함수
def recommend_accommodations(user_query: str, region_name: str, top_k: int = 3) -> str:
    region_hotel_names = get_hotels_by_region(region_name)
    all_docs = vectordb.similarity_search(user_query, k=top_k * 6)
    filtered_docs = [doc for doc in all_docs if doc.metadata["숙소명"] in region_hotel_names]
    추천숙소들 = list({doc.metadata["숙소명"] for doc in filtered_docs[:top_k]})
    context = build_context_from_sql(추천숙소들)
    return llm_chain.run({"context": context, "question": user_query})