# ✅ 6. 추천 함수 (MMR + 다양성 지시 반영)
def recommend_accommodations(query, 지역명=None):
    vectordb = Chroma(
        persist_directory="./chroma_db_v2",
        embedding_function=OpenAIEmbeddings()
    )

    filter_kwargs = {"시군구명": 지역명} if 지역명 else {}

    retriever = vectordb.as_retriever(
        search_type="mmr",  # ✅ MMR 방식으로 다양성 확보
        search_kwargs={"k": 5, "filter": filter_kwargs}
    )
    docs = retriever.get_relevant_documents(query)

    context_blocks = []
    for i, doc in enumerate(docs, 1):
        숙소명 = doc.metadata.get("숙소명", "이름없음")

        rdb_result = pd.read_sql_query(
            'SELECT * FROM accommodations WHERE 숙소명 = %s',
            engine,
            params=(숙소명,)
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

    context = "\n\n".join(context_blocks)
    if len(context.split()) > 700:
        context = " ".join(context.split()[:700])

    try:
        response = llm_chain.run({"context": context, "question": query})
    except Exception as e:
        response = f"❌ 오류 발생: {e}"

    return response
