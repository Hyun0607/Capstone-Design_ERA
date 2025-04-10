import React from 'react';
import './App.css';

// 사용자가 입력한 쿼리 조건을 팝업으로 보여주는 컴포넌트
function ConfirmationPopup({ region, people, conditions, query, onConfirm, onCancel }) {
  return (
    <div className="confirmation-popup">
      <div className="popup-content">
      <h2>입력하신 내용이 맞으신가요?</h2>
        <ul>
          <li><strong>지역:</strong> {region}</li>
          <li><strong>인원:</strong> {people}</li>
          <strong>요청하신 조건</strong>
          {conditions.luggage && <li>짐 보관 필요</li>}
          {conditions.pets && <li>반려동물 동반 가능</li>}
          {conditions.wheelchair && <li>휠체어 접근 가능</li>}
          {conditions.trail && <li>산책로 있음</li>}
        </ul>
        <p><strong>입력하신 내용</strong><br/> {query}</p>
        <div className="popup-buttons">
          <button className="confirm-button" onClick={onConfirm}>네</button>
          <button className="cancel-button" onClick={onCancel}>아니오</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationPopup;