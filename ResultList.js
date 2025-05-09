// ResultList.js
import React from 'react';
// 숙소 추천 결과를 리스트 형태로 출력하는 컴포넌트
// 장애인분들의 접근성 향상을 위해 ARIA 속성(스크린 리더)과 tabIndex(Tab 키를 통해 포커스 이동)를 포함함
// 음성 안내 기능을 추가하여 사용자가 숙소 정보를 음성으로 들을 수 있도록 함

function ResultList({ hotels, onReset, onNext, onPrev, viewRange }) {
  const handleVoiceGuide = () => {
    if (!window.speechSynthesis) {
      alert('음성 안내 기능을 지원하지 않는 브라우저입니다.');
      return;
    }

    if (!hotels || hotels.length === 0) return;

    const text = hotels.map((hotel, idx) => {
      return `${idx + 1}번 숙소, ${hotel.name}, 주소는 다음과 같습니다. ${hotel.description}`;
    }).join('. 다음 숙소는, ');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
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
        <button className="voice-guide" onClick={handleVoiceGuide} aria-label="숙소 정보 음성으로 다시 듣기">
          음성 안내
        </button>
      </div>
    </div>
  );
}

export default ResultList;

