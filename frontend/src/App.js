import { useState } from "react";
import "./App.css";

function App() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const regions = ["서울", "경기", "강원", "충청", "전라", "경상", "제주"];
  const [region, setRegion] = useState("");
  const [people, setPeople] = useState(1);
  const [wheelchair, setWheelchair] = useState(false);
  const [parking, setParking] = useState(false);
  const [pregnant, setPregnant] = useState(false);
  const [pets, setPets] = useState(false);

  const handleAsk = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();
      setResponse(data.response);
    } catch (err) {
      setResponse("❌ 서버 요청에 실패했습니다.");
    }
    setLoading(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Silver Stay</h1>
        <h2>AI 기반 숙소 추천</h2>
      </header>

      <main className="App-main">
        <section className="App-filters">
          <h4>🔧 조건 설정</h4>
          <div className="filters-inline">
            <label>
              지역
              <select value={region} onChange={(e) => setRegion(e.target.value)}>
                <option value="">선택</option>
                {regions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>

            <label>
              인원
              <select value={people} onChange={(e) => setPeople(parseInt(e.target.value))}>
                {[...Array(8)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}명</option>
                ))}
              </select>
            </label>

            <label>
              <input type="checkbox" checked={wheelchair} onChange={() => setWheelchair(!wheelchair)} />
              휠체어
            </label>
            <label>
              <input type="checkbox" checked={parking} onChange={() => setParking(!parking)} />
              주차
            </label>
            <label>
              <input type="checkbox" checked={pregnant} onChange={() => setPregnant(!pregnant)} />
              임산부
            </label>
            <label>
              <input type="checkbox" checked={pets} onChange={() => setPets(!pets)} />
              반려동물
            </label>
          </div>

          <div className="filters-summary-line">
            ✅ 현재 설정: 지역: {region || "선택 안함"}  |  인원: {people}명  |  휠체어: {wheelchair ? "사용함" : "사용 안함"}  |  주차: {parking ? "사용함" : "사용 안함"}  |  임산부: {pregnant ? "사용함" : "사용 안함"}  |  반려동물: {pets ? "사용함" : "사용 안함"}
          </div>
        </section>

        <section className="App-response-container">
          <button className="nav-button left" onClick={() => alert("이전 숙소")}>
            &lt;
          </button>

          <div className="App-response">
            <h3>🤖 AI 응답</h3>
            <pre>{response || "AI 응답이 여기에 표시됩니다."}</pre>
          </div>

          <button className="nav-button right" onClick={() => alert("다음 숙소")}>
            &gt;
          </button>
        </section>

        <section className="App-prompt">
          <textarea
            rows={4}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="예: 휠체어로 접근 가능한 조용한 숙소 추천해줘."
          />
          <button onClick={handleAsk}>
            {loading ? "추천 중..." : "AI 추천 받기"}
          </button>
        </section>
      </main>

      <footer className="App-footer">
        <p>ⓒ 2025 Silver Stay</p>
      </footer>
    </div>
  );
}

export default App;
