// ResultList.js
import React from 'react';
// ���� ��õ ����� ����Ʈ ���·� ����ϴ� ������Ʈ
// ����κе��� ���ټ� ����� ���� ARIA �Ӽ�(��ũ�� ����)�� tabIndex(Tab Ű�� ���� ��Ŀ�� �̵�)�� ������
// ���� �ȳ� ����� �߰��Ͽ� ����ڰ� ���� ������ �������� ���� �� �ֵ��� ��

function ResultList({ hotels, onReset, onResearch }) {
  const handleVoiceGuide = () => {
    if (!hotels || hotels.length === 0) return;
    const text = hotels
      .map((hotel, idx) =>
        `${idx + 1}�� ����, ${hotel.name}, ��ġ�� ${hotel.region}, ����: ${hotel.description}`
      )
      .join('. ');

    // ���� �ռ� API�� �ȳ�
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="results-section" id="results-section">
      <h2>��õ ���� ���</h2>
      {/* ���� ��� ����Ʈ, ���ټ� ���� role="list" ���� */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {hotels.map((hotel, index) => (
          // ���� ���� ���� ī��
          // tabIndex={0} ���� Ű���� ��Ŀ�� �����ϰ� ��
          // aria-label �� ��ũ�� ������ ���� ����
          <li
            key={index}
            tabIndex={0}
            aria-label={`${hotel.name} ����. ��ġ�� ${hotel.region}. ����: ${hotel.conditions?.join(', ') || '����'}. ����: ${hotel.description}`}
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
            <p><strong>����:</strong> {hotel.conditions?.join(', ') || '����'}</p>
            
            {/* ���� �̹��� (alt �����Ͽ� �ð������ ����) */}
            {hotel.imageUrl && (
              <img
                src={hotel.imageUrl}
                alt={`${hotel.name} ���� �̹���`}
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
          aria-label="ù ȭ������ �̵�"
        >
          ù ȭ������
        </button>
        <button
          className="query-button"
          onClick={onResearch}
          aria-label="���� ���� ��õ �ޱ�"
        >
          �ٸ� ����
        </button>
      </div>

      <button
        className="voice-guide"
        onClick={handleVoiceGuide}
        aria-label="���� ���� �������� �ٽ� ���"
      >
        ���� �ȳ�
      </button>
    </div>
  );
}

export default ResultList;
