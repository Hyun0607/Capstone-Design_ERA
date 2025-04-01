# 베이스 이미지
FROM python:3.10-slim

# 작업 디렉터리 생성
WORKDIR /app

# 필요한 파일 복사
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# 포트 설정
EXPOSE 8000

# 실행 명령
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
