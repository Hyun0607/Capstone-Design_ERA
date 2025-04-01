import os
import torch
from sqlalchemy import create_engine, text
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from langchain_huggingface import HuggingFacePipeline, HuggingFaceEmbeddings
from langchain.prompts import PromptTemplate
from langchain_core.runnables import RunnableSequence
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from dotenv import load_dotenv

# 환경 변수 로딩
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:mypassword@localhost:5432/testdb")
engine = create_engine(DATABASE_URL)

# 모델 로딩 (GPU 최적화)
model_id = "tiiuae/falcon-rw-1b"
tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(
    model_id,
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    device_map="auto",
    offload_folder="./offload"
)

text_gen_pipeline = pipeline(
    model=model,
    tokenizer=tokenizer,
    task="text-generation",
    temperature=0.2,
    return_full_text=True,
    max_new_tokens=200  # ✅ 필요 시 조절
)

llm = HuggingFacePipeline(pipeline=text_gen_pipeline)

# 프롬프트 템플릿
prompt_template = """
당신은 고령층과 장애인을 위한 숙소 추천 전문가입니다.
아래에 사용자의 요구사항과 리뷰 기반의 숙소 정보(context)가 주어졌습니다.

당신의 목표는 **사용자의 요구를 충족하는 숙소를 친절하게 요약하여 추천하는 것**입니다.

[숙소 정보 및 리뷰 데이터]
{context}

[사용자 질문]
{question}

아래의 형식으로 대답해주세요:
1. 추천 숙소 요약 (장점 중심으로)
2. 사용자의 조건과 어떻게 일치하는지
3. 기타 유의사항 (있는 경우)
"""

prompt = PromptTemplate(input_variables=["context", "question"], template=prompt_template)
llm_chain = prompt | llm

# 문서 로딩
with engine.connect() as conn:
    result = conn.execute(text('SELECT "숙소 설명", 리뷰 FROM 숙소리뷰')).fetchall()
documents = [f"{row[0]}\n리뷰: {row[1]}" for row in result]

# 텍스트 청크 + GPU 임베딩
splitter = RecursiveCharacterTextSplitter(chunk_size=1024, chunk_overlap=50)
chunks = splitter.split_text("\n".join(documents))
embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L12-v2",
    model_kwargs={"device": "cuda"}  # ✅ GPU 사용
)

# ChromaDB 로딩
chroma_db = Chroma.from_texts(
    texts=chunks,
    embedding=embedding_model,
    persist_directory="chroma_db"
)
retriever = chroma_db.as_retriever(search_kwargs={"k": 5})
