from langchain.chat_models import ChatOpenAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.vectorstores import Chroma
from langchain.schema import Document
from langchain.embeddings import OpenAIEmbeddings
import pandas as pd
from config import engine, PERSIST_DIR

# ✅ GPT-4 Turbo 모델 및 프롬프트 템플릿 정의
llm = ChatOpenAI(model_name="gpt-4-turbo", temperature=0.1, max_tokens=256)

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

# ✅ CSV → Document 리스트 생성
def build_documents(csv_path: str):
    df = pd.read_csv(csv_path)
    df = df.dropna(subset=["설명문", "숙소명", "시군구명"])

    documents = []
    for _, row in df.iterrows():
        질문 = row.get("예상 질문 리스트", "") or ""
        설명 = row.get("설명문", "")
        if not isinstance(설명, str) or 설명.strip() == "":
            continue

        page_text = f"[예상 질문]\n{질문}\n\n[숙소 설명]\n{설명}"

        documents.append(Document(
            page_content=page_text,
            metadata={
                "숙소명": str(row["숙소명"]),
                "시군구명": str(row["시군구명"])
            }
        ))
    return documents

# ✅ Document → Chroma 벡터DB에 저장
def store_embeddings(documents):
    embedding_model = OpenAIEmbeddings()
    vectordb = Chroma.from_documents(
        documents=documents,
        embedding=embedding_model,
        persist_directory=PERSIST_DIR
    )
    vectordb.persist()

#  추천 함수 (MMR + 다양성 지시 반영)
def recommend_accommodations(query, 지역명=None): # 사용자의 질문과 선택적인 지역명을 입력받아 숙소를 추천해주는 함수 정의
    vectordb = Chroma(
        persist_directory="./chroma_db_v2",
        embedding_function=OpenAIEmbeddings() # 바로위에 임베딩은 저장용, 이 임베딩은 검색용이라 보면 됨
    )

    filter_kwargs = {"시군구명": 지역명} if 지역명 else {} # 지역명을 전달 받았으면 시군구명 기준으로 필터링 조건 설정

    retriever = vectordb.as_retriever( # 벡터 검색을 위한 retriever 객체를 생성
        search_type="mmr",  # ✅ MMR 방식으로 다양성 확보
        search_kwargs={"k": 5, "filter": filter_kwargs} # 최종적으로 상위 5개의 문서를 검색
    )
    docs = retriever.get_relevant_documents(query) # 실제 사용자 질의 기반으로 VectorDB에서 관련 문서 5개 검색

    context_blocks = [] # LLM에게 전달할 context(문서 텍스트)를 하나로 합치기 위해 블록별로 저장할 빈 리스트를 선언
    for i, doc in enumerate(docs, 1): # 검색된 문서를 하나씩 순회하면서 context를 구성 "i"는 출력용 번호
        숙소명 = doc.metadata.get("숙소명", "이름없음") # 문서의 metatdata에서 "숙소명"을 꺼냄
        시군구명 = doc.metadata.get("시군구명", "")
        
        rdb_result = pd.read_sql_query(
            'SELECT * FROM accommodations WHERE 숙소명 = %s AND 시군구명 = %s', # RDB에서 해당 숙소명, 시군구명의 상세정보를 조회
            engine, # SQL 연결 객체, 
            params=(숙소명, 시군구명) # 숙소명은 튜플 형태로 넘겨야 SQLAlchemy가 제대로 인식함
        )

        if not rdb_result.empty:
            row = rdb_result.iloc[0] # 쿼리 결과가 있다면 첫 번째 행을 꺼냄, 하나의 숙소 정보만 사용하여 context 블록 만듬
            context_blocks.append(
                f"{i}. [숙소명]: {row['숙소명']}\n"
                f"[설명]: {doc.page_content}"
            ) # 숙소명은 DB에서 가져온 값, 설명은 벡터DB에서 가져온 값
        else:
            context_blocks.append(
                f"{i}. [숙소명]: {숙소명}\n"
                f"[설명]: {doc.page_content}"
            ) # RDB에서 숙소 상세정보가 없을 경우에도, metdata에서 가져온 숙소명과 설명을 그대로 사용하여 블록 생성

    context = "\n\n".join(context_blocks) # 각 블록을 두 줄 간격으로 이어 붙여서 하나의 LLM 입력용 context 완성
    if len(context.split()) > 700:
        context = " ".join(context.split()[:700]) # conetx가 너무 길 경우 LLM token 제한을 피하기 위해 자름.

    try:
        response = llm_chain.run({"context": context, "question": query})
    except Exception as e:
        response = f"❌ 오류 발생: {e}"

    return response
