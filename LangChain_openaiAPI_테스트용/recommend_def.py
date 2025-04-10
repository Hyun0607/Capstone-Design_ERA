def recommend_accommodations(query, 지역명=None):
    # ✅ VectorDB 불러오기
    vectordb = Chroma(
        persist_directory="./chroma_db_v2",
        embedding_function=OpenAIEmbeddings()
    )

    # ✅ 지역 필터링 조건 설정
    filter_kwargs = {"시군구명": 지역명} if 지역명 else {}

    # ✅ 관련 문서 검색
    retriever = vectordb.as_retriever(
        search_kwargs={"k": 5, "filter": filter_kwargs}
    )
    docs = retriever.get_relevant_documents(query)

    # ✅ context 구성
    context_blocks = []
    for i, doc in enumerate(docs, 1):
        숙소명 = doc.metadata.get("숙소명", "이름없음")

        # ✅ RDB에서 숙소 상세정보 가져오기 (튜플로 전달!)
        rdb_result = pd.read_sql_query(
            'SELECT * FROM accommodations WHERE 숙소명 = %s',
            engine,
            params=(숙소명,)  # ✅ 반드시 튜플로!
        )

        if not rdb_result.empty:
            row = rdb_result.iloc[0]
            context_blocks.append(
                f"{i}. [숙소명]: {row['숙소명']}\n"
                f"[설명]: {doc.page_content}"
            )
        else:
            context_blocks.append(
                f"{i}. [숙소명]: {숙소명}\n"
                f"[설명]: {doc.page_content}"
            )

    # ✅ 전체 context 병합
    context = "\n\n".join(context_blocks)

    # ✅ LLM에 넘기는 토큰 길이 제한
    if len(context.split()) > 700:
        context = " ".join(context.split()[:700])

    # ✅ LLM 호출
    try:
        response = llm_chain.run({"context": context, "question": query})
    except Exception as e:
        response = f"❌ 오류 발생: {e}"

    return response
