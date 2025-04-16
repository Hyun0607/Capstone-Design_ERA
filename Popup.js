import React from 'react';
import './App.css';

// 사용자가 입력한 쿼리 조건을 팝업으로 보여주는 컴포넌트
// 사용자가 입력한 지역, 인원, 조건을 보여주고 확인 버튼을 클릭하면 API 호출

function ConfirmationPopup({ region, people, conditions, query, onConfirm, onCancel }) {
  // 조건을 렌더링하는 함수 & 조건이 없을 경우 출력 X
  const renderConditions = () => {
    if (!Object.values(conditions).some(v => v)) return null;

    return (
      <>
        <p><strong>조건:</strong></p>
        <ul>
          {conditions.luggage && <li>짐 보관 가능</li>}
          {conditions.pets && <li>반려동물 동반 가능</li>}
          {conditions.wheelchair && <li>휠체어 접근 가능</li>}
          {conditions.trail && <li>산책로 있음</li>}
        </ul>
      </>
    );
  };

  return (
    // 팝업을 위한 div, 접근성을 위해 role과 aria 속성 추가
    // aria-labelledby: 팝업 제목을 지정
    // aria-describedby: 팝업 설명을 지정
    // role="dialog" & aria-modal="true": 스크린 리더가 "대화상자"로 인식
    <div
      className="confirmation-popup"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
      aria-describedby="popup-desc"
    >
      <div className="popup-content">
        <h2 id="popup-title">입력한 내용이 맞으신가요?</h2>
        <p>숙소를 추천하기 위해 아래 정보를 확인해 주세요.</p>

        {/* 지역, 인원, 조건을 보여주는 부분 */}
        <div id="popup-desc">
          <p><strong>지역:</strong> {region}</p>
          <p><strong>인원:</strong> {people}</p>

          {renderConditions()}
          
          <p><strong>입력하신 내용:</strong> {query}</p>
        </div>

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
