import os
from sqlalchemy import create_engine

# ✅ OpenAI API 키 설정
# 배포 시 .env 파일이나 환경변수로 관리하는 것을 권장합니다
os.environ["OPENAI_API_KEY"] = "sk-proj-...."

# ✅ 벡터 DB 저장 위치
PERSIST_DIR = "./chroma_db_v2"

# ✅ PostgreSQL 연결 정보 (GCP Cloud SQL)
DB_USER = "capstone"
DB_PASSWORD = "wjdgusdn1!"
DB_HOST = "34.31.99.157"
DB_PORT = "5432"
DB_NAME = "sliverstay"

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL)
