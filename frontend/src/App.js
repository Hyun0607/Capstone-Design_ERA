import { useState } from "react";
import "./App.css";

function App() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

        {response && (
          <section className="App-response">
            <h3>🤖 AI 응답</h3>
            <pre>{response}</pre>
          </section>
        )}
      </main>

      <footer className="App-footer">
        <p>ⓒ 2025 Silver Stay</p>
      </footer>
    </div>
  );
}

export default App;