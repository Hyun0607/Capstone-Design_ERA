df = pd.read_csv("VectorDB(최종).csv")
df = df.dropna(subset=["설명문", "숙소명", "시군구명"])

documents = []
for _, row in df.iterrows():
    질문 = row.get("예상 질문 리스트", "")
    설명 = row.get("설명문", "")

    if pd.isna(질문) or not isinstance(질문, str):
        질문 = ""
    if pd.isna(설명) or not isinstance(설명, str) or 설명.strip() == "":
        continue

    page_text = f"[예상 질문]\n{질문}\n\n[숙소 설명]\n{설명}"

    documents.append(Document(
        page_content=page_text,
        metadata={
            "숙소명": str(row["숙소명"]),
            "시군구명": str(row["시군구명"])  # ✅ 필터링 키 통일!
        }
    ))
