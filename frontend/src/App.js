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
    <div className="App" style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h1>Silver Stay 숙소 추천</h1>
      <textarea
        rows={4}
        style={{ width: "100%" }}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="예: 휠체어로 접근 가능한 조용한 숙소 추천해줘."
      />
      <button onClick={handleAsk} style={{ marginTop: 10 }}>
        {loading ? "추천 중..." : "AI 추천 받기"}
      </button>

      {response && (
        <div style={{ marginTop: 30 }}>
          <h3>🤖 AI 응답</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>{response}</pre>
        </div>
      )}
    </div>
  );
}

export default App;

