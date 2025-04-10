import './App.css';
import './Reactive.css';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ConfirmationPopup from './Popup';
import ResultSlider from './ResultSlider';

function App() {
  const [showRegions, setShowRegions] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('지역');
  const [showPeople, setShowPeople] = useState(false);
  const [selectedPeople, setSelectedPeople] = useState('인원');
  const [luggage, setLuggage] = useState(false);
  const [pets, setPets] = useState(false);
  const [wheelchair, setWheelchair] = useState(false);
  const [trail, setTrail] = useState(false);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState([]);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewRange, setViewRange] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('이 브라우저는 음성 인식을 지원하지 않습니다.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setQuery(transcript);
    };

    recognition.onend = () => {
      handleQuerySubmit();
    };

    recognition.start();
  }, []);

  // 지역 / 인원 드롭다운 
  const toggleRegions = () => setShowRegions(!showRegions);
  const togglePeople = () => setShowPeople(!showPeople);

  // 지역 / 인원 선택
  const handleRegionSelect = (region) => {
    setSelectedRegion(region);
    setShowRegions(false);
  };

  const handlePeopleSelect = (people) => {
    setSelectedPeople(people);
    setShowPeople(false);
  };

  // 필터 토글
  const toggleFilter = (filter, setFilter) => setFilter(!filter);

  const handleQueryChange = (event) => setQuery(event.target.value);

  // 예외 흐름 처리 (지역, 인원 선택 안했을 때)
  // 되물음 팝업 표시
  const handleQuerySubmit = useCallback(() => {
    if (selectedRegion === '지역') {
      setError('지역을 설정해 주세요.');
      return;
    } else if (selectedPeople === '인원' || selectedPeople === '0명') {
      setError('인원을 설정해 주세요.');
      return;
    }
    setError('');
    setIsPopupVisible(true);
  }, [selectedRegion, selectedPeople]);

  // 오타 교정
  const correctTypos = (text) => {
    const corrections = {
      '잇ㅅ어요': '있어요',
      '없써요': '없어요',
      '휠체ㅓ': '휠체어',
      '반려도물': '반려동물',
      '가깝은': '가까운',
      '짐보관': '짐 보관'
    };
    let corrected = text;
    for (const typo in corrections) {
      const regex = new RegExp(typo, 'g');
      corrected = corrected.replace(regex, corrections[typo]);
    }
    return corrected;
  };

  // 백엔드에 숙소 API 호출 요청
  const fetchRecommendations = async (correctedQuery) => {
    const res = await axios.post('http://localhost:8000/query', {
      query: correctedQuery,
      region: selectedRegion,
      people: selectedPeople,
      luggage,
      pets,
      wheelchair,
      trail,
    });
    return res.data.results;
  };
  
  // 되물음 창에서 "네" 클릭 시
  const handleConfirm = async () => {
    const correctedQuery = correctTypos(query);
    try {
      const results = await fetchRecommendations(correctedQuery);
      setResponse(results);
      setIsPopupVisible(false);
      setShowResults(true);
      setTimeout(() => {
        window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
      }, 200);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // 결과 화면에서 "초기 화면으로" 클릭 시
  const handleReset = () => {
    setShowResults(false);
    setSelectedRegion('지역');
    setSelectedPeople('인원');
    setLuggage(false);
    setPets(false);
    setWheelchair(false);
    setTrail(false);
    setQuery('');
    setResponse([]);
    setError('');
    setCurrentIndex(0);
    setViewRange(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 결과 화면에서 "다른 숙소" 클릭 시
  const handleResearch = () => {
    const nextRange = (viewRange + 1) * 3;
    if (nextRange >= response.length) {
      alert('더 이상 조건에 해당하는 숙소가 없습니다.');
      return;
    }
    setViewRange(viewRange + 1);
    setCurrentIndex(nextRange);
  };

  // 슬라이드 좌우 이동
  const handleSlide = (dir) => {
    const base = viewRange * 3;
    setCurrentIndex((prev) => {
      const max = Math.min(response.length - 1, base + 2);
      const min = base;
      if (dir === 'left') {
        return prev === min ? max : prev - 1;
      } else {
        return prev === max ? min : prev + 1;
      }
    });
  };

  const regions = ['춘천', '원주', '강릉', '동해', '태백', '속초', '삼척', '홍천', '횡성', '영월', '평창', '정선', '철원', '화천', '양구', '인제', '고성', '양양'];

  return (
    <div className="App">
      <div className="Title">
        <h3>SilverStay
          <span>노약자 & 장애인분들을 위한 강원도 숙소 가이드</span>
        </h3>
      </div>

      <h3>사용방법
        <span>
          <div>1. 원하시는 지역과 인원을 선택해 주세요.</div>
          <div>2. 조건을 입력 또는 눌러 주세요.</div>
          <div>3. 검색 버튼을 누르세요.</div>
        </span>
      </h3>

      {/* 지역 / 인원 / 조건 선택 UI */}
      <div className="menu">
        <ul>
          <li onClick={toggleRegions}>{selectedRegion}
            {showRegions && (<ul>{regions.map((region, idx) => (<li key={idx} onClick={() => handleRegionSelect(region)}>{region}</li>))}</ul>)}
          </li>
          <li onClick={togglePeople}>{selectedPeople}
            {showPeople && (<ul>{['0명', '1명', '2명', '3명', '4명', '5명', '6명', '7명', '8명 이상'].map((p, idx) => (<li key={idx} onClick={() => handlePeopleSelect(p)}>{p}</li>))}</ul>)}
          </li>
          <li onClick={() => toggleFilter(luggage, setLuggage)} className={luggage ? 'active' : ''}>짐 보관</li>
          <li onClick={() => toggleFilter(pets, setPets)} className={pets ? 'active' : ''}>반려동물 동반 여부</li>
          <li onClick={() => toggleFilter(wheelchair, setWheelchair)} className={wheelchair ? 'active' : ''}>휠체어</li>
          <li onClick={() => toggleFilter(trail, setTrail)} className={trail ? 'active' : ''}>산책로</li>
        </ul>
      </div>

      {/* 쿼리 입력창 */}
      <div className="query-container">
        <textarea placeholder="원하시는 숙소의 조건을 입력해 주세요." 
                  className="query-input" value={query} 
                  onChange={handleQueryChange} />
        <button className="query-button" onClick={handleQuerySubmit}>
          검색
        </button>
        {error && (
        <div className="error-message" data-message={error}>
          <button onClick={() => setError('')}>네</button>
        </div>
        )}
      </div>

      {/* 되물음 팝업 */}
      {isPopupVisible && (
        <ConfirmationPopup
          region={selectedRegion}
          people={selectedPeople}
          query={query}
          conditions={{ luggage, pets, wheelchair, trail }}
          onConfirm={handleConfirm}
          onCancel={() => setIsPopupVisible(false)}
        />
      )}

      {/* 추천 결과 표시 */}
      {showResults && response.length > 0 && (
        <ResultSlider
          response={response}
          currentIndex={currentIndex}
          viewRange={viewRange}
          onSlide={handleSlide}
          onReset={handleReset}
          onResearch={handleResearch}
        />
      )}
      {showResults && response.length === 0 && (
        <div className="no-results">
          <h3>조건에 맞는 숙소가 없습니다.</h3>
          <button onClick={handleReset}>초기 화면으로</button>
        </div>
      )}

      {/* 반응형 디자인 */}
      <div className="HomePC">PC</div>
      <div className="HomeTablet">Tablet</div>
      <div className="HomeMobile">Mobile</div>
    </div>
  );
}

export default App;