# ✅ 5. RDB 연결 (PostgreSQL on GCP)
DB_USER = "capstone"
DB_PASSWORD = "wjdgusdn1!"
DB_HOST = "34.31.99.157"
DB_PORT = "5432"
DB_NAME = "sliverstay"
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL)