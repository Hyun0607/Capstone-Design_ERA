# ✅ 2. OpenAI API 키 설정
os.environ["OPENAI_API_KEY"] = "sk-proj-.."

# ✅ 3. LLM 설정
llm = ChatOpenAI(
    model_name="gpt-4-turbo",  # 또는 gpt-4
    temperature=0.1,
    max_tokens=256
)
