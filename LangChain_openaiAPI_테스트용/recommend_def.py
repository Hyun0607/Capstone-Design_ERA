# ✅ 6. 추천 함수 (MMR + 다양성 지시 반영)
def recommend_accommodations(query, 지역명=None): # 사용자의 질문과 선택적인 지역명을 입력받아 숙소를 추천해주는 함수 정의
    vectordb = Chroma(
        persist_directory="./chroma_db_v2",
        embedding_function=OpenAIEmbeddings() # 바로위에 임베딩은 저장용, 이 임베딩은 검색용이라 보면 됨
    )

    filter_kwargs = {"시군구명": 지역명} if 지역명 else {} # 지역명을 전달 받았으면 시군구명 기준으로 필터링 조건 설정

    retriever = vectordb.as_retriever( # 벡터 검색을 위한 retriever 객체를 생성
        search_type="mmr",  # ✅ MMR 방식으로 다양성 확보
        search_kwargs={"k": 5, "filter": filter_kwargs} # 최종적으로 상위 5개의 문서를 검색
    )
    docs = retriever.get_relevant_documents(query) # 실제 사용자 질의 기반으로 VectorDB에서 관련 문서 5개 검색

    context_blocks = [] # LLM에게 전달할 context(문서 텍스트)를 하나로 합치기 위해 블록별로 저장할 빈 리스트를 선언
    for i, doc in enumerate(docs, 1): # 검색된 문서를 하나씩 순회하면서 context를 구성 "i"는 출력용 번호
        숙소명 = doc.metadata.get("숙소명", "이름없음") # 문서의 metatdata에서 "숙소명"을 꺼냄
        시군구명 = doc.metadata.get("시군구명", "")
        
        rdb_result = pd.read_sql_query(
            'SELECT * FROM accommodations WHERE 숙소명 = %s AND 시군구명 = %s', # RDB에서 해당 숙소명, 시군구명의 상세정보를 조회
            engine, # SQL 연결 객체, 
            params=(숙소명, 시군구명) # 숙소명은 튜플 형태로 넘겨야 SQLAlchemy가 제대로 인식함
        )

        if not rdb_result.empty:
            row = rdb_result.iloc[0] # 쿼리 결과가 있다면 첫 번째 행을 꺼냄, 하나의 숙소 정보만 사용하여 context 블록 만듬
            context_blocks.append(
                f"{i}. [숙소명]: {row['숙소명']}\n"
                f"[설명]: {doc.page_content}"
            ) # 숙소명은 DB에서 가져온 값, 설명은 벡터DB에서 가져온 값
        else:
            context_blocks.append(
                f"{i}. [숙소명]: {숙소명}\n"
                f"[설명]: {doc.page_content}"
            ) # RDB에서 숙소 상세정보가 없을 경우에도, metdata에서 가져온 숙소명과 설명을 그대로 사용하여 블록 생성

    context = "\n\n".join(context_blocks) # 각 블록을 두 줄 간격으로 이어 붙여서 하나의 LLM 입력용 context 완성
    if len(context.split()) > 700:
        context = " ".join(context.split()[:700]) # conetx가 너무 길 경우 LLM token 제한을 피하기 위해 자름.

    try:
        response = llm_chain.run({"context": context, "question": query})
    except Exception as e:
        response = f"❌ 오류 발생: {e}"

    return response
