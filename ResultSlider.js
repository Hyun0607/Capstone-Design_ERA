// ResultSlider.js
import React from 'react';

// 숙소 추천 결과 슬라이더 컴포넌트
function ResultSlider({ response, currentIndex, viewRange, onSlide, onReset, onResearch }) {
  const current = response[currentIndex];

  // 음성 안내 기능 - 화면에 있는 숙소 정보 읽어줌.
  const handleSpeak = (hotel) => {
    if (!hotel) return;
    const utterance = new SpeechSynthesisUtterance(
      `${hotel.name}. ${hotel.description}`
    );
    utterance.lang = 'ko-KR';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    // 슬라이더 이동 버튼과 숙소 정보 표시
    <div className="results-section" id="results-section">
      <div className="slider-controls">
        <button onClick={() => onSlide('left')}>{'<'}</button>

        {/* ? 현재 추천 숙소 정보 */}
        <div className="result-card">
          <h2>추천 숙소: {current.name}</h2>
          <img src={current.imageUrl} alt="숙소 이미지" style={{ width: '100%', borderRadius: '12px' }} />
          <p>{current.description}</p>
          <button onClick={() => alert('상세 정보 페이지로 이동 예정입니다.')}>자세히 보기</button>
        </div>
        <button onClick={() => onSlide('right')}>{'>'}</button>
      </div>

      {/* ? 하단 음성 안내 / 초기 화면으로(Return) / 다른 숙소(Research) 버튼 영역 */}
      <div className="result-actions">
        <button className="reset-button" onClick={onReset}>초기 화면으로</button>
        <button className="query-button" onClick={onResearch}>다른 숙소</button>
      </div>

      <button className="voice-guide" onClick={() => handleSpeak(current)}>음성 안내</button>
    </div>
  );
}

export default ResultSlider;
