# test_db.py
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres:mypassword@localhost:5432/testdb"

# 엔진 생성
engine = create_engine(DATABASE_URL)

# 연결 테스트 및 간단한 SQL 실행
try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 'DB 연결 성공!'"))
        message = result.scalar()
        print(message)

except Exception as e:
    print("DB 연결 중 오류가 발생했습니다.")
    print(e)
