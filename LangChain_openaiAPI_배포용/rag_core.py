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

# ✅ 사용자 쿼리에 따른 숙소 추천 응답 생성
def recommend_accommodations(query, 지역명=None):
    vectordb = Chroma(
        persist_directory=PERSIST_DIR,
        embedding_function=OpenAIEmbeddings()
    )

    filter_kwargs = {"시군구명": 지역명} if 지역명 else {}
    retriever = vectordb.as_retriever(search_kwargs={"k": 5, "filter": filter_kwargs})
    docs = retriever.get_relevant_documents(query)

    context_blocks = []
    for i, doc in enumerate(docs, 1):
        숙소명 = doc.metadata.get("숙소명", "이름없음")

        rdb_result = pd.read_sql_query(
            'SELECT * FROM accommodations WHERE 숙소명 = %s',
            engine,
            params=(숙소명,)
        )

        if not rdb_result.empty:
            row = rdb_result.iloc[0]
            context_blocks.append(
                f"{i}. [숙소명]: {row['숙소명']}\n[설명]: {doc.page_content}"
            )
        else:
            context_blocks.append(
                f"{i}. [숙소명]: {숙소명}\n[설명]: {doc.page_content}"
            )

    context = "\n\n".join(context_blocks)
    if len(context.split()) > 700:
        context = " ".join(context.split()[:700])

    try:
        response = llm_chain.run({"context": context, "question": query})
    except Exception as e:
        response = f"❌ 오류 발생: {e}"

    return response
