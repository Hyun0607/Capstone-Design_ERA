// ResultList.js
import React, {useEffect, useState} from 'react';
// 숙소 추천 결과를 리스트 형태로 출력하는 컴포넌트
// 장애인분들의 접근성 향상을 위해 ARIA 속성(스크린 리더)과 tabIndex(Tab 키를 통해 포커스 이동)를 포함함
// 음성 안내 기능을 추가하여 사용자가 숙소 정보를 음성으로 들을 수 있도록 함

function ResultList({ hotels, onReset, onNext, onPrev, viewRange }) {
  const [voiceIndex, setVoiceIndex] = useState(0); // 음성 안내를 위한 인덱스
  const [isSpeaking, setIsSpeaking] = useState(false); // 음성 안내 상태
  const [caption, setCaption] = useState(''); // 음성 안내 텍스트

  useEffect(() => {
    if (!isSpeaking || voiceIndex >= hotels.length) return;

    const hotel = hotels[voiceIndex];
    const text = `${voiceIndex + 1}번 숙소는 ${hotel.name}. 주소는 ${hotel.description} 입니다.`;
    setCaption(text);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9;

    utterance.onend = () => { // 음성 안내가 끝났을 때
      setTimeout(() => setVoiceIndex((v) => v + 1), 1000);
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [voiceIndex, isSpeaking, hotels]);

  const handleVoiceToggle = () => { // 음성 안내 시작/중지
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setVoiceIndex(0);
      setCaption('');
    } else {
      setIsSpeaking(true);
      setVoiceIndex(0);
    }
  };

  return (
    <div className="results-section" id="results-section">
      <h2>추천 숙소 목록</h2>
      <div className="results-container">
        <button
          onClick={onPrev}
          aria-label="이전 숙소 보기"
          className="nav-button prev-button"
        >
          &lt;
        </button>

        <ul className="results-list">
          {hotels.map((hotel, index) => (
            <li
              key={index}
              tabIndex={0}
              aria-label={`${hotel.name} 숙소. 주소: ${hotel.description}`}
              className="result-card"
            >
              <h3>숙소명 : {hotel.name}</h3>
              <h4>주소 : {hotel.description}</h4>
            </li>
          ))}
        </ul>

        <button
          onClick={onNext}
          aria-label="다음 숙소 보기"
          className="nav-button next-button"
        >
          &gt;
        </button>
      </div>

      <div className="result-actions">
        <button className="reset-button" onClick={onReset} aria-label="첫 화면으로 이동">
          첫 화면으로
        </button>
        <button
          className="voice-guide"
          onClick={handleVoiceToggle}
          aria-label={isSpeaking ? "음성 안내 중지" : "숙소 정보 음성 안내 시작"}
        >
          {isSpeaking ? "? 음성 안내 중지" : "? 숙소 정보 듣기"}
        </button>
      </div>

      {caption && (
        <div className="caption-box" aria-live="polite">
          <p>{caption}</p>
        </div>
      )}
    </div>
  );
}

export default ResultList;


