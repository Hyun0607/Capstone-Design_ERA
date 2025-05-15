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
            result = conn.execute(
                text("SELECT 주소, 장애인편의시설, 숙소설명 FROM 숙소정보 WHERE 숙소명 = :name"),
                {"name": name.strip()}
            ).fetchone()
            if result:
                주소, 장애인편의시설, 숙소설명 = result
                context += f"[숙소명] {name}\n[주소] {주소}\n[장애인편의시설] {장애인편의시설}\n[숙소설명] {숙소설명}\n\n"
    return context.strip()

# ✅ 숙소명으로 숙소 정보 1개 조회 (후순위 숙소용)
def get_hotel_info_by_name(hotel_name):
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT 숙소명, 주소 FROM 숙소정보 WHERE 숙소명 = :name"),
            {"name": hotel_name}
        ).fetchone()
        if result:
            return {"name": result[0], "address": result[1]}
        else:
            return None
