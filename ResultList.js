// ResultList.js
import React, {useEffect, useState} from 'react';
// ���� ��õ ����� ����Ʈ ���·� ����ϴ� ������Ʈ
// ����κе��� ���ټ� ����� ���� ARIA �Ӽ�(��ũ�� ����)�� tabIndex(Tab Ű�� ���� ��Ŀ�� �̵�)�� ������
// ���� �ȳ� ����� �߰��Ͽ� ����ڰ� ���� ������ �������� ���� �� �ֵ��� ��

function ResultList({ hotels, onReset, onNext, onPrev, viewRange }) {
  const [voiceIndex, setVoiceIndex] = useState(0); // ���� �ȳ��� ���� �ε���
  const [isSpeaking, setIsSpeaking] = useState(false); // ���� �ȳ� ����
  const [caption, setCaption] = useState(''); // ���� �ȳ� �ؽ�Ʈ

  useEffect(() => {
    if (!isSpeaking || voiceIndex >= hotels.length) return;

    const hotel = hotels[voiceIndex];
    const text = `${voiceIndex + 1}�� ���Ҵ� ${hotel.name}. �ּҴ� ${hotel.description} �Դϴ�.`;
    setCaption(text);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9;

    utterance.onend = () => { // ���� �ȳ��� ������ ��
      setTimeout(() => setVoiceIndex((v) => v + 1), 1000);
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [voiceIndex, isSpeaking, hotels]);

  const handleVoiceToggle = () => { // ���� �ȳ� ����/����
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
        <button
          className="voice-guide"
          onClick={handleVoiceToggle}
          aria-label={isSpeaking ? "���� �ȳ� ����" : "���� ���� ���� �ȳ� ����"}
        >
          {isSpeaking ? "? ���� �ȳ� ����" : "? ���� ���� ���"}
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


