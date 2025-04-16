// ResultList.js
import React from 'react';
// 숙소 추천 결과를 리스트 형태로 출력하는 컴포넌트
// 장애인분들의 접근성 향상을 위해 ARIA 속성(스크린 리더)과 tabIndex(Tab 키를 통해 포커스 이동)를 포함함
// 음성 안내 기능을 추가하여 사용자가 숙소 정보를 음성으로 들을 수 있도록 함

function ResultList({ hotels, onReset, onResearch }) {
  const handleVoiceGuide = () => {
    if (!hotels || hotels.length === 0) return;
    const text = hotels
      .map((hotel, idx) =>
        `${idx + 1}번 숙소, ${hotel.name}, 위치는 ${hotel.region}, 설명: ${hotel.description}`
      )
      .join('. ');

    // 음성 합성 API로 안내
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="results-section" id="results-section">
      <h2>추천 숙소 목록</h2>
      {/* 숙소 목록 리스트, 접근성 위해 role="list" 지정 */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {hotels.map((hotel, index) => (
          // 개별 숙소 정보 카드
          // tabIndex={0} 으로 키보드 포커스 가능하게 함
          // aria-label 로 스크린 리더용 설명 제공
          <li
            key={index}
            tabIndex={0}
            aria-label={`${hotel.name} 숙소. 위치는 ${hotel.region}. 조건: ${hotel.conditions?.join(', ') || '없음'}. 설명: ${hotel.description}`}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <h3>{hotel.name} ({hotel.region})</h3>
            <p>{hotel.description}</p>
            <p><strong>조건:</strong> {hotel.conditions?.join(', ') || '없음'}</p>
            
            {/* 숙소 이미지 (alt 포함하여 시각장애인 대응) */}
            {hotel.imageUrl && (
              <img
                src={hotel.imageUrl}
                alt={`${hotel.name} 숙소 이미지`}
                style={{ width: '100%', borderRadius: '8px', marginTop: '10px' }}
              />
            )}
          </li>
        ))}
      </ul>

      <div className="result-actions">
        <button
          className="reset-button"
          onClick={onReset}
          aria-label="첫 화면으로 이동"
        >
          첫 화면으로
        </button>
        <button
          className="query-button"
          onClick={onResearch}
          aria-label="다음 숙소 추천 받기"
        >
          다른 숙소
        </button>
      </div>

      <button
        className="voice-guide"
        onClick={handleVoiceGuide}
        aria-label="숙소 정보 음성으로 다시 듣기"
      >
        음성 안내
      </button>
    </div>
  );
}

export default ResultList;
