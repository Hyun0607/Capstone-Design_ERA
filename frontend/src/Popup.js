import React from 'react';
import './App.css';

function ConfirmationPopup({ region, people, query, conditions, onConfirm, onCancel }) {
  const renderConditions = () => {
    const conditionLabels = {
      wheelchair: '휠체어 접근 가능',
      elevator: '엘리베이터 있음',
      ramp: '경사로 있음',
      parking: '장애인 주차장',
      assistant: '안내요원 도움 가능',
      dog: '반려견 동반 가능',
    };

    const active = Object.entries(conditions)
      .filter(([_, v]) => v)
      .map(([k]) => conditionLabels[k]);

    if (active.length === 0) return null;

    return (
      <>
        <p><strong>조건:</strong></p>
        <ul>
          {active.map((label, idx) => (
            <li key={idx}>{label}</li>
          ))}
        </ul>
      </>
    );
  };

  return (
    <div
      className="confirmation-popup"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
    >
      <div className="popup-content">
        <h2 id="popup-title">입력한 내용이 맞으신가요?</h2>
        <p>숙소를 추천하기 위해 아래 정보를 확인해 주세요.</p>

        <p><strong>지역:</strong> {region}</p>
        <p><strong>인원:</strong> {people}</p>
        {renderConditions()}
        <p><strong>입력하신 내용:</strong> {query}</p>
        <p>위 내용으로 검색을 진행하시겠습니까?</p>

        <div className="popup-buttons">
          <button
            className="confirm-button"
            onClick={onConfirm}
            aria-label="입력한 조건으로 검색을 진행합니다"
          >
            네
          </button>
          <button
            className="cancel-button"
            onClick={onCancel}
            aria-label="조건을 다시 입력합니다"
          >
            아니오
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationPopup;
