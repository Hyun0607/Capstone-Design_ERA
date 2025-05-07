import './App.css';
import './Reactive.css';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import ConfirmationPopup from './Popup';
import ResultList from './ResultList';
import properNouns from './properNouns.json';

function App() {
  // 지역, 인원, 쿼리, 응답, 뷰 범위, 팝업 상태, 드롭다운 상태, 결과 상태, 에러 메시지
  const [selectedRegion, setSelectedRegion] = useState('지역');
  const [selectedPeople, setSelectedPeople] = useState('인원');
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState([]);
  const [viewRange, setViewRange] = useState(0);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [showRegions, setShowRegions] = useState(false);
  const [showPeople, setShowPeople] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState('');
  const [micDenied, setMicDenied] = useState(false); // 마이크 차단 여부 -default 상태: 허용

  // 음성 인식 객체를 저장할 ref
  const recognitionRef = useRef(null);

  // 지역 목록
  const regions = useMemo(() => (
    [
      '춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시',
      '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'
    ]
  ), []);

  // 조건 초기화
  const [conditions, setConditions] = useState({
    wheelchair: false,
    elevator: false,
    ramp: false,
    parking: false,
    assistant: false,
    dog: false
  });
  
  // 조건 키워드 매핑
  // useMemo를 사용하여 조건 키워드 매핑
  const keywordMap = useMemo(() => ({
    wheelchair: ['휠체어', '휠체어 대여'],
    elevator: ['엘리베이터', '엘베', '승강기', '장애인용 엘리베이터'],
    ramp: ['경사로', '계단 없는', '단차'],
    parking: ['주차장', '장애인 주차장', '장애인용 주차장'],
    assistant: ['안내요원'],
    dog: ['보조견', '반려견', '동반 가능']
  }), []);
  

  // 지역과 인원 추출
  const extractRegionPeople = useCallback((text) => {
    const peopleMatch = text.match(/[0-9]+명/);
    const regionMatch = regions.find(r => text.includes(r)); // 바깥 변수 regions 사용
    if (regionMatch) setSelectedRegion(regionMatch);
    if (peopleMatch) setSelectedPeople(peopleMatch[0]);
  }, [regions]);
  
  // 조건 추출
  const extractConditions = useCallback((text) => {
    setConditions(prev => {
      const updated = { ...prev };
      Object.entries(keywordMap).forEach(([key, keywords]) => {
        if (keywords.some(word => text.includes(word))) {
          updated[key] = true;
        }
      });
      return updated;
    });
  }, [keywordMap]);
  
  // 핵심 명사 추출
  const extractProperNouns = useCallback((text) => {
    return properNouns.filter(noun => text.includes(noun)); // 명사 목록에서 필터링
  }, []);

  // 음성 인식 시작
  const startVoiceRecognition = useCallback(() => {
    const processVoiceInput = (text) => {
      setQuery(text);
      extractRegionPeople(text);
      extractConditions(text);
      extractProperNouns(text);
      setIsPopupVisible(true);
    };

    // 마이크 허용 여부 확인
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          console.warn('이 브라우저는 음성 인식을 지원하지 않습니다.');
          setMicDenied(true);
          return;
        }

        // 음성 인식 설정
        const recognition = new SpeechRecognition();
        recognition.lang = 'ko-KR';
        recognition.interimResults = false;
        recognition.continuous = false;

        // 음성 인식 결과 처리
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          processVoiceInput(transcript);
        };

        recognitionRef.current = recognition;
        recognition.start();
      })
    .catch(() => {
      setMicDenied(true);
      });
  }, [extractRegionPeople, extractConditions, extractProperNouns]);

  // 쿼리 작성 (마이크 허용 X 시)
  const handleQuerySubmit = useCallback(() => {
    if (selectedRegion === '지역' || selectedPeople === '인원') {
      setError('지역과 인원을 입력해 주세요.');
      return;
    }
    // 쿼리에서 지역과 인원 추출
    extractConditions(query);
    // 쿼리에서 조건 추출
    extractProperNouns(query);
    setError('');
    setIsPopupVisible(true);
  }, [selectedRegion, selectedPeople, query, extractConditions, extractProperNouns]);

  // 숙소 추천 요청
  const handleConfirm = useCallback(async () => { /* 오타 교정 */
    const correctTypos = (text) => {
      const corrections = {
        '잇ㅅ어요': '있어요',
        '없써요': '없어요',
        '휠체ㅓ': '휠체어',
        '휠체어대여': '휠체어 대여',
        '엘리베이타': '엘리베이터',
        '엘베이터': '엘리베이터',
        '장애인주차장': '장애인 주차장',
        '가깝은': '가까운',
        '짐보관': '짐 보관',
        '보조건': '보조견'
      };
      let corrected = text;
      for (const typo in corrections) { // 오타 교정
        const regex = new RegExp(typo, 'g');
        corrected = corrected.replace(regex, corrections[typo]); // 정규 표현식 사용
      }
      return corrected;
    };
    
    const correctedQuery = correctTypos(query);
    const matchedNouns = extractProperNouns(correctedQuery); // ✅ 핵심 명사 추출
    
    /* 백엔드로 정보 요청 */
    const fetchRecommendations = async (correctedQuery, matchedNouns) => {
      const res = await axios.post(`{API_URL}/api/recommend`, {
        query: correctedQuery,
        region: selectedRegion,
        people: selectedPeople,
        conditions,
        properNouns: matchedNouns
      });
      return res.data.results;
    };
    
    // ✅ 백엔드 API 호출
    try {
      const results = await fetchRecommendations(correctedQuery, matchedNouns); 
      if (results.length === 0) {
        setError('조건에 맞는 숙소가 없습니다.');
        return;
      }
      setResponse(results);
      setShowResults(true); // 검색 결과
      setIsPopupVisible(false);
      setViewRange(0); // 초기화
    } catch (error) {
      console.error('Error:', error);
    }
  }, [query, conditions, selectedRegion, selectedPeople, extractProperNouns]);


  // 팝업 취소
  // 마이크 허용 시 음성 인식 재시작
  // 마이크 차단 시 음성 인식 재시작 X
  const handleCancel = useCallback(() => {
    setIsPopupVisible(false);
    if (!micDenied) startVoiceRecognition(); // 마이크 허용 시, 음성 인식 재시작
  }, [micDenied, startVoiceRecognition]);

  // 숙소 추천 재검색
  const handleResearch = () => {
    const next = (viewRange + 1) * 3;
    if (next >= response.length) {
      alert('더 이상 숙소가 없습니다.');
      return;
    }
    setViewRange(viewRange + 1);
  };

  // 숙소 추천 초기화
  // 마이크 허용 시 음성 인식 재시작
  const handleReset = () => {
    setSelectedRegion('지역');
    setSelectedPeople('인원');
    setQuery('');
    setResponse([]);
    setViewRange(0);
    setShowResults(false);
    setError('');
    if (!micDenied) startVoiceRecognition();
  };

  // 마이크 허용 시 음성 인식 시작
  useEffect(() => {
    startVoiceRecognition();
  }, [startVoiceRecognition]);

  // Popup 열릴 때 "네 / 아니오" 음성 인식
  useEffect(() => {

    // 마이크 차단 시 음성 인식 X
    if (!isPopupVisible || micDenied) return;
  
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    // 음성 인식 지원 여부 확인
    if (!SpeechRecognition) return;
  
    const recognition = new SpeechRecognition(); // 음성 인식 객체 생성
    recognition.lang = 'ko-KR'; // 한국어 설정
    recognition.interimResults = false; // 중간 결과 비활성화
    recognition.continuous = false; // 연속 인식 비활성화
  
    // 음성 인식 결과 처리
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim().toLowerCase();
      if (transcript.includes("네")) handleConfirm();
      else if (transcript.includes("아니오")) handleCancel();
    };
  
    recognition.start();
    return () => recognition.abort();
  }, [isPopupVisible, micDenied, handleConfirm, handleCancel]);

  return (
    <div className="App">
      <div className="Title">
        <h3>SilverStay<span>노약자 & 장애인 전용 강원도 숙소 가이드</span></h3>
      </div>

      {!showResults && (
        <div className="query-container">
          <h3>{micDenied ? '조건을 직접 입력해 주세요' : '여행을 가실 지역 & 인원을 말씀해주세요'}</h3>
          
          {micDenied && (
            <div className="menu">
              <ul>
                {/* 지역 드롭다운 */}
                <li onClick={() => setShowRegions(!showRegions)}>
                  {selectedRegion}
                  {showRegions && (
                    <ul>
                      {regions.map((region, idx) => (
                        <li key={idx} onClick={() => {
                          setSelectedRegion(region);
                          setShowRegions(false);
                        }}>
                          {region}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>

                {/* 인원 드롭다운 */}
                <li onClick={() => setShowPeople(!showPeople)}>
                  {selectedPeople}
                  {showPeople && (
                    <ul>
                      {['1명', '2명', '3명', '4명', '5명 이상'].map((p, idx) => (
                        <li key={idx} onClick={() => {
                          setSelectedPeople(p);
                          setShowPeople(false);
                        }}>
                          {p}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              </ul>
            </div>
          )}

          <textarea
            placeholder="숙소 조건을 입력해 주세요."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="query-input"
          />
          <button className="query-button" onClick={handleQuerySubmit}>검색</button>
          {error && <div className="error-message" data-message={error}><button onClick={() => setError('')}>확인</button></div>}
        </div>
      )}

      {/* 결과 */}
      {isPopupVisible && (
        <ConfirmationPopup
          region={selectedRegion}
          people={selectedPeople}
          query={query}
          conditions={conditions} 
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {/* 검색 결과 */}
      {showResults && (
        <div className="result-header">
          <h3>추천 숙소</h3>
          <p>총 {response.length}개 숙소가 검색되었습니다.</p>
        </div>
      )}
      
      {/* 검색 결과 리스트 */}
      {showResults && (
        <ResultList
          hotels={response.slice(viewRange * 3, viewRange * 3 + 3)}
          onReset={handleReset}
          onResearch={handleResearch}
        />
      )}
    </div>
  );
}

export default App;
