// ResultSlider.js
import React from 'react';

// ���� ��õ ��� �����̴� ������Ʈ
function ResultSlider({ response, currentIndex, viewRange, onSlide, onReset, onResearch }) {
  const current = response[currentIndex];

  // ���� �ȳ� ��� - ȭ�鿡 �ִ� ���� ���� �о���.
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
    // �����̴� �̵� ��ư�� ���� ���� ǥ��
    <div className="results-section" id="results-section">
      <div className="slider-controls">
        <button onClick={() => onSlide('left')}>{'<'}</button>

        {/* ? ���� ��õ ���� ���� */}
        <div className="result-card">
          <h2>��õ ����: {current.name}</h2>
          <img src={current.imageUrl} alt="���� �̹���" style={{ width: '100%', borderRadius: '12px' }} />
          <p>{current.description}</p>
          <button onClick={() => alert('�� ���� �������� �̵� �����Դϴ�.')}>�ڼ��� ����</button>
        </div>
        <button onClick={() => onSlide('right')}>{'>'}</button>
      </div>

      {/* ? �ϴ� ���� �ȳ� / �ʱ� ȭ������(Return) / �ٸ� ����(Research) ��ư ���� */}
      <div className="result-actions">
        <button className="reset-button" onClick={onReset}>�ʱ� ȭ������</button>
        <button className="query-button" onClick={onResearch}>�ٸ� ����</button>
      </div>

      <button className="voice-guide" onClick={() => handleSpeak(current)}>���� �ȳ�</button>
    </div>
  );
}

export default ResultSlider;
