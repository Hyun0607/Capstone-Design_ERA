import { useState } from "react";
import "./App.css";

function App() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalInput, setModalInput] = useState("");
  const [isResponseReady, setIsResponseReady] = useState(false);

  const regions = ["서울", "경기", "강원", "충청", "전라", "경상", "제주"];
  const [region, setRegion] = useState("");
  const [people, setPeople] = useState(1);
  const [wheelchair, setWheelchair] = useState(false);
  const [parking, setParking] = useState(false);
  const [pregnant, setPregnant] = useState(false);
  const [pets, setPets] = useState(false);

  // 추천 버튼 클릭 → 확인창 먼저 열기
  const handleAsk = () => {
    setShowConfirmModal(true);
  };

  // ⭕ 버튼 → 실제 추천 처리
  const proceedAsk = async () => {
    setShowConfirmModal(false);
    setIsModalOpen(true);
    setIsResponseReady(false);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();
      setResponse(data.response);
      setIsResponseReady(true);
    } catch (err) {
      setResponse("❌ 서버 요청에 실패했습니다.");
      setIsResponseReady(true);
    }

    setLoading(false);
  };

  const handleModalConfirm = () => {
    setIsModalOpen(false);
    // TODO: modalInput 값을 백엔드에 전달 예정
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Silver Stay</h1>
        <h2>AI 기반 숙소 추천</h2>
      </header>

      <main className="App-main">
        {/* 조건 설정 */}
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
            ✅ 현재 설정: 지역: {region || "선택 안함"} | 인원: {people}명 | 휠체어: {wheelchair ? "사용함" : "사용 안함"} | 주차: {parking ? "사용함" : "사용 안함"} | 임산부: {pregnant ? "사용함" : "사용 안함"} | 반려동물: {pets ? "사용함" : "사용 안함"}
          </div>
        </section>

        {/* 응답창 */}
        <section className="App-response-container">
          <button className="nav-button left" onClick={() => alert("이전 숙소")}>
            &lt;
          </button>

          <div className="App-response">
            <h3>🤖 AI 응답</h3>
            <div className="response-content">
              <div className="response-image">
                {response && (
                  <img
                    src="/images/sample.jpg"
                    alt="숙소 이미지"
                    className="response-img"
                  />
                )}
              </div>
              <div className="response-text">
                <pre>{response || "AI 응답이 여기에 표시됩니다."}</pre>
              </div>
            </div>
          </div>

          <button className="nav-button right" onClick={() => alert("다음 숙소")}>
            &gt;
          </button>
        </section>

        {/* 프롬프트 입력 */}
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

      {/* ✅ 확인 모달 */}
      {showConfirmModal && (
        <div className="Modal-backdrop">
          <div className="Modal-box">
            <h3>🔍 선택하신 내용을 확인해 주세요</h3>
            <p><strong>프롬프트:</strong> {question || "작성 안됨"}</p>
            <p><strong>조건:</strong> 지역: {region || "선택 안함"} | 인원: {people}명 | 휠체어: {wheelchair ? "사용함" : "사용 안함"} | 주차: {parking ? "사용함" : "사용 안함"} | 임산부: {pregnant ? "사용함" : "사용 안함"} | 반려동물: {pets ? "사용함" : "사용 안함"}</p>
            <p className="confirm-question">선택하신 내용이 맞습니까?</p>
            <div className="modal-footer">
              <button onClick={proceedAsk}>⭕</button>
              <button onClick={() => setShowConfirmModal(false)}>❌</button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ 추천 결과 모달 */}
      {isModalOpen && (
        <div className="Modal-backdrop">
          <div className="Modal-box">
            <textarea
              rows={4}
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              placeholder="모달 안에서 프롬프트 입력"
            />
            {isResponseReady && <p className="loaded-message">불러왔습니다 ✅</p>}
            <div className="modal-footer">
              <button onClick={handleModalConfirm}>확인</button>
              <button className="button1">버튼1</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
