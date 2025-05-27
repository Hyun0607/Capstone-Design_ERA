from sqlalchemy import create_engine, text
from config import DATABASE_URL

engine = create_engine(DATABASE_URL)

# ✅ 지역 기준 숙소명 리스트 조회
def get_hotels_by_region(region_name):
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT 숙소명 FROM 숙소정보 WHERE 시군구명 = :region"),
            {"region": region_name}
        )
        return {row[0] for row in result.fetchall()}

# ✅ 숙소명 리스트로 context 구성
def build_context_from_sql(hotel_names):
    context = ""
    with engine.connect() as conn:
        for name in hotel_names:
            name = name.strip()
            query = text("""
                SELECT 주소, 장애인편의시설, 숙소설명 
                  FROM 숙소정보 
                 WHERE 숙소명 = :name
            """)
            result = conn.execute(query, {"name": name}).fetchone()
            if not result:
                print(f"[WARN] '{name}'에 대한 숙소 정보가 없습니다.")
                continue

            주소, 장애인편의시설, 숙소설명 = result
            # X 표시는 정보 없음
            if 장애인편의시설 == "X":
                장애인편의시설 = "편의시설 정보 없음"

            context += (
                f"숙소명: {name}\n"
                f"주소: {주소}\n"
                f"장애인 편의시설: {장애인편의시설}\n"
                f"설명: {숙소설명}\n\n"
            )
    return context.strip()

# ✅ 숙소명으로 숙소 정보 1개 조회 (후순위 숙소용)
def get_hotel_info_by_name(hotel_name):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT 숙소명, 주소, 장애인편의시설
                  FROM 숙소정보 
                 WHERE 숙소명 = :name
            """),
            {"name": hotel_name}
        ).fetchone()

        if not result:
            return None

        name, address, raw_tags = result
        # X 표시는 정보 없음
        if raw_tags == "X":
            tags = []
        else:
            tags = [t.strip() for t in raw_tags.split(",") if t.strip()]

        return {
            "name": name,
            "address": address,
            "tags": tags,
            "imageUrl": ""
        }
