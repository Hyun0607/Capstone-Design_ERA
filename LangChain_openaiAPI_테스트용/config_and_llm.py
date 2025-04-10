# ✅ 2. OpenAI API 키 설정
os.environ["OPENAI_API_KEY"] = "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"

# ✅ 3. LLM 설정
llm = ChatOpenAI(
    model_name="gpt-4-turbo",  # 또는 gpt-4
    temperature=0.1,
    max_tokens=256
)