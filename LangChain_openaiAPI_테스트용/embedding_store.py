embedding_model = OpenAIEmbeddings()
vectordb = Chroma.from_documents(
    documents=documents,
    embedding=embedding_model,
    persist_directory="./chroma_db_v2"
)
vectordb.persist()