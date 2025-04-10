# ✅ 4. 프롬프트 템플릿
template = """
당신은 고령자나 장애인을 위한 숙소 추천 설명을 생성하는 AI입니다.

아래는 사용자 요청과 관련된 숙소 정보 목록입니다.
각 숙소명을 그대로 사용해서, 왜 적합한지 1~2문장으로 설명해 주세요.
❗절대 새로운 숙소명을 만들어내지 마세요.

출력 예시 (참고용):
1. [숙소명]: 탑스텐 강릉 호텔
   [설명]: 휠체어 진입 가능, 욕실 손잡이 있어 고령자 적합

2. [숙소명]: 호텔 이스트나인
   [설명]: 계단 없는 출입구와 엘리베이터 있어 휠체어 이용자 적합

👇 아래 숙소 정보를 참고하여 결과를 생성하세요.

숙소 정보:
{context}

사용자 질문:
{question}
"""


prompt = PromptTemplate(input_variables=["context", "question"], template=template)
llm_chain = LLMChain(llm=llm, prompt=prompt)