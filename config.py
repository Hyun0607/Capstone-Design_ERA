import os

# OpenAI
os.environ["OPENAI_API_KEY"] = "sk-...·"  # 보안상 .env로 대체 권장

# PostgreSQL 연결 정보
DB_USER = "capstone"
DB_PASSWORD = "qzwxec7462!"
DB_HOST = "34.64.95.231"
DB_PORT = "5432"
DB_NAME = "sliverstay"
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
