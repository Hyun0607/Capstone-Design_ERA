/* eslint-disable */

import './App.css';
import { useState } from 'react';
// useState: React의 상태 관리 라이브러리
// 일반 변수 = 값 변경 시 바로 반영 X
// useState = 값 변경 시 바로 반영 O
import { useMediaQuery } from 'react-responsive';
//HomePC
const HomePC = () => {
  const isPC = useMediaQuery({
    query: "(min-width:1024px)"
  });
  return (
    <>
      {isPC &&
        <div>
          PC
        </div>
      }
    </>
  );
};
//HomeTablet
const HomeTablet = () => {
  const isTablet = useMediaQuery({
    query: "(min-width:768px) and (max-width:1023px)"
  });
  return (
    <>
      {isTablet &&
        <div>
          Tablet
        </div>
      }
    </>
  );
};
//HomeMobile
const HomeMobile = () => {
  const isMobile = useMediaQuery({
    query: "(max-width:767px)"
  });
  return (
    <>
      {isMobile &&
        <div>
          Mobile
        </div>
      }
    </>
  );
};

function App() {
  // 지역 메뉴의 가시성 관리 (false: 숨김 상태)
  // showRegions: 지역 메뉴 숨김 상태 여부 확인
  // setShowRegions: 지역 메뉴의 가시성을 변경 함수
  const [showRegions, setShowRegions] = useState(false);
  // 선택된 지역을 관리하는 상태
  const [selectedRegion, setSelectedRegion] = useState('지역');

  // 인원 메뉴의 가시성 관리
  const [showPeople, setShowPeople] = useState(false);
  // 선택된 인원을 관리하는 상태
  const [selectedPeople, setSelectedPeople] = useState('인원');

  // 기타 필터 상태 관리
  const [luggage, setLuggage] = useState(false);
  const [pets, setPets] = useState(false);
  const [breakfast, setBreakfast] = useState(false);
  const [trail, setTrail] = useState(false);

  // 쿼리 입력과 응답을 관리하는 상태
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');

  // 지역 메뉴의 가시성을 토글하는 함수
  const toggleRegions = () => {
    setShowRegions(!showRegions);
  };

  // 인원 메뉴의 가시성을 토글하는 함수
  const togglePeople = () => {
    setShowPeople(!showPeople);
  };

  // 지역을 선택했을 때 호출되는 함수
  const handleRegionSelect = (region) => {
    setSelectedRegion(region);
    setShowRegions(false);
  };

  // 인원을 선택했을 때 호출되는 함수
  const handlePeopleSelect = (people) => {
    setSelectedPeople(people);
    setShowPeople(false);
  };

  // 기타 필터를 토글하는 함수
  const toggleFilter = (filter, setFilter) => {
    setFilter(!filter);
  };

  // 쿼리 입력창의 내용이 변경될 때 호출되는 함수
  const handleQueryChange = (event) => {
    setQuery(event.target.value);
  };

  // '탐색' 버튼을 클릭했을 때 호출되는 함수
  const handleQuerySubmit = async () => {
    try {
      const res = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query, 
          region: selectedRegion === '지역' ? null : selectedRegion,
          people: selectedPeople === '인원' ? null : selectedPeople,
          luggage,
          pets,
          breakfast,
          trail
        }),
      });
      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // useState를 이용해 상태 관리
  let [regions, setRegions] = useState(['지역 전체', '춘천', '원주', '강릉', '동해', '태백', '속초', '삼척', '홍천', '횡성', '영월', '평창', '정선', '철원', '화천', '양구', '인제', '고성', '양양']);
  let [peopleOptions, setPeopleOptions] = useState(['1명', '2명', '3명', '4명', '5명', '6명', '7명', '8명 이상']);
  
  return (
    // 웹페이지 기본 세팅
    <div className="App">
      <div className="black-nav"> {/*상단 메뉴 세팅*/}
        <h3 style={{fontSize: '300%'}}>{'SilverStay'}
          <span style={{ 
            display: 'block'
            }}>
              {'노약자 & 장애인분들을 위한 강원도 숙소 가이드'}
            </span>
        </h3>
        
      </div> {/* 상단 메뉴 설정 종료 */}
        <h3 style={{fontSize: '30px'}}>{'사용방법'}
          <span style={{ 
            display: 'block'
            }}>
              <div>{'1. 원하시는 지역을 선택해 주세요.'}</div>
              <div>{'2. 원하시는 숙소의 조건을 입력 또는 원하시는 항목을 눌러 주세요.'}</div>
              <div>{'3. 탐색 버튼을 눌러주세요.'}</div>
            </span>
        </h3>

      {/* 메뉴 세팅 */}
      <div className="menu">
        <ul>
          <li onClick={toggleRegions}>
            {selectedRegion}
            {/* 하위 메뉴로 지역 목록, showRegions가 true일 때만 숨김 해제 */}
            {showRegions && (
              <ul>
                {regions.map((region, index) => (
                  <li key={index} onClick={() => handleRegionSelect(region)}>
                    {region}
                  </li>
                ))}
              </ul>
            )}
          </li>
          <li onClick={togglePeople}>
            {selectedPeople}
            {/* 하위 메뉴로 인원 목록, showPeople이 true일 때만 숨김 해제 */}
            {showPeople && (
              <ul>
                {peopleOptions.map((people, index) => (
                  <li key={index} onClick={() => handlePeopleSelect(people)}>
                    {people}
                  </li>
                ))}
              </ul>
            )}
          </li>
          <li 
            onClick={() => toggleFilter(luggage, setLuggage)} 
            className={luggage ? 'active' : ''}
          >
            짐 보관
          </li>
          <li 
            onClick={() => toggleFilter(pets, setPets)} 
            className={pets ? 'active' : ''}
          >
            반려동물 동반 여부
          </li>
          <li 
            onClick={() => toggleFilter(breakfast, setBreakfast)} 
            className={breakfast ? 'active' : ''}
          >
            조식
          </li>
          <li 
            onClick={() => toggleFilter(trail, setTrail)} 
            className={trail ? 'active' : ''}
          >
            산책로
          </li>
        </ul>
      </div> {/* 메뉴 설정 종료 */}

      {/* 탐색 위한 쿼리 창 추가 */}
      <div className="query-container">
        <textarea 
          placeholder="원하시는 숙소의 조건을 입력해 주세요." 
          className="query-input"
          value={query}
          onChange={handleQueryChange}
        />
        <button className="query-button" onClick={handleQuerySubmit}>
          탐색
        </button>
      </div> {/* 쿼리 창 설정 종료*/}

      {/* 응답 표시 */}
      {response && (
        <div className="response-container">
          <p>{response}</p>
        </div>
      )}

      {/* 반응형 컴포넌트 렌더링 */}
      <HomePC />
      <HomeTablet />
      <HomeMobile />
    </div> 
  );// return
}

export default App;
