import pandas as pd
from sqlalchemy import create_engine

DATABASE_URL = "postgresql://postgres:mypassword@localhost:5432/testdb"
engine = create_engine(DATABASE_URL)

csv_path = "review_Data.csv"
df = pd.read_csv(csv_path, encoding='cp949')  # ← 여기 인코딩만 수정

print(df.head())

df.to_sql('숙소리뷰', engine, if_exists='replace', index=False)

print("✅ DB 삽입 완료!")
