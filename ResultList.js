// ResultList.js
import React from 'react';
// ���� ��õ ����� ����Ʈ ���·� ����ϴ� ������Ʈ
// ����κе��� ���ټ� ����� ���� ARIA �Ӽ�(��ũ�� ����)�� tabIndex(Tab Ű�� ���� ��Ŀ�� �̵�)�� ������
// ���� �ȳ� ����� �߰��Ͽ� ����ڰ� ���� ������ �������� ���� �� �ֵ��� ��

function ResultList({ hotels, onReset, onNext, onPrev, viewRange }) {
  const handleVoiceGuide = () => {
    if (!window.speechSynthesis) {
      alert('���� �ȳ� ����� �������� �ʴ� �������Դϴ�.');
      return;
    }

    if (!hotels || hotels.length === 0) return;

    const text = hotels.map((hotel, idx) => {
      return `${idx + 1}�� ����, ${hotel.name}, �ּҴ� ������ �����ϴ�. ${hotel.description}`;
    }).join('. ���� ���Ҵ�, ');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="results-section" id="results-section">
      <h2>��õ ���� ���</h2>
      <div className="results-container">
        <button
          onClick={onPrev}
          aria-label="���� ���� ����"
          className="nav-button prev-button"
        >
          &lt;
        </button>

        <ul className="results-list">
          {hotels.map((hotel, index) => (
            <li
              key={index}
              tabIndex={0}
              aria-label={`${hotel.name} ����. �ּ�: ${hotel.description}`}
              className="result-card"
            >
              <h3>���Ҹ� : {hotel.name}</h3>
              <h4>�ּ� : {hotel.description}</h4>
            </li>
          ))}
        </ul>

        <button
          onClick={onNext}
          aria-label="���� ���� ����"
          className="nav-button next-button"
        >
          &gt;
        </button>
      </div>

      <div className="result-actions">
        <button className="reset-button" onClick={onReset} aria-label="ù ȭ������ �̵�">
          ù ȭ������
        </button>
        <button className="voice-guide" onClick={handleVoiceGuide} aria-label="���� ���� �������� �ٽ� ���">
          ���� �ȳ�
        </button>
      </div>
    </div>
  );
}

export default ResultList;

