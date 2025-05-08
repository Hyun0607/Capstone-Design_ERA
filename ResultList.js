// ResultList.js
import React from 'react';
// ���� ��õ ����� ����Ʈ ���·� ����ϴ� ������Ʈ
// ����κе��� ���ټ� ����� ���� ARIA �Ӽ�(��ũ�� ����)�� tabIndex(Tab Ű�� ���� ��Ŀ�� �̵�)�� ������
// ���� �ȳ� ����� �߰��Ͽ� ����ڰ� ���� ������ �������� ���� �� �ֵ��� ��

function ResultList({ hotels, onReset, onResearch }) {
  const handleVoiceGuide = () => { //��� ���� �ȳ� ���
    if (!window.speechSynthesis) {
      alert('���� �ȳ� ����� �������� �ʴ� �������Դϴ�.');
      return;
    }

    // ���� �ȳ� ����� �����ϴ� ���
    if (!hotels || hotels.length === 0) return;
  
    const text = hotels.map((hotel, idx) => {
      const conditionText = hotel.conditions?.length > 0
        ? `�������δ� ${hotel.conditions.join(', ')} �� �ֽ��ϴ�`
        : '���� ������ �����ϴ�';
  
      const keywordText = hotel.properNouns?.length > 0
        ? `���Ե� Ű����� ${hotel.properNouns.join(', ')} �Դϴ�`
        : '';
  
      return `${idx + 1}�� ����, ${hotel.name}, ��ġ�� ${hotel.region}. ${conditionText}. ${keywordText}. ����� ������ �����ϴ�. ${hotel.description}`;
    }).join('. ���� ���Ҵ�, ');
  
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    window.speechSynthesis.cancel();  // ���� ���� ����
    window.speechSynthesis.speak(utterance); // �б� ����
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
            aria-label={`${hotel.name} ����. �ּ�: ${hotel.description}`}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            {/* ���� �̸��� ���� */}
            <h3>���Ҹ� : {hotel.name}</h3> 
            
            {/* ���� �ּ� (�鿣�忡�� �ּ� �Ѱ���) */}
            <h4>�ּ� : {hotel.description}</h4>
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
          aria-label="�ٸ� ���� ��õ �ޱ�"
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
