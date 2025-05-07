from sqlalchemy import create_engine, text
from config import DATABASE_URL

engine = create_engine(DATABASE_URL)

def get_hotels_by_region(region_name):
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 숙소명 FROM 숙소정보 WHERE 시군구명 = :region"), {"region": region_name})
        return {row[0] for row in result.fetchall()}

def build_context_from_sql(hotel_names):
    context = ""
    with engine.connect() as conn:
        for name in hotel_names:
            result = conn.execute(
                text("SELECT 주소, 장애인편의시설 FROM 숙소정보 WHERE 숙소명 = :name"),
                {"name": name.strip()}
            ).fetchone()
            if result:
                주소, 장애인편의시설 = result
                context += f"[숙소명] {name}\n[주소] {주소}\n[장애인편의시설] {장애인편의시설}\n\n"
    return context.strip()