import './App.css';
import './Reactive.css';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import Intro from './Intro';
import ConfirmationPopup from './Popup';
import ResultList from './ResultList';
import properNouns from './properNouns.json';

function App() {
  const [showIntro, setShowIntro] = useState(true); // 인트로 화면 상태
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
  const [matchedNouns, setMatchedNouns] = useState([]); // 핵심 명사 목록
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태
  const [logText, setLogText] = useState(''); // API 응답 로그

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
    wheelchair: ['휠체어', '휠체어 대여', '휠체어 접근', '휠체어 이동', '휠체어 이용 가능'],
    elevator: ['엘리베이터', '엘베', '승강기', '장애인용 엘리베이터', '리프트', '엘리베이터 있음'],
    ramp: ['경사로', '계단 없는', '단차', '슬로프', '경사 진입', '단차 없음', '보조 출입구'],
    parking: ['주차장', '장애인 주차장', '장애인용 주차장', '휠체어 주차', '전용 주차'],
    assistant: ['안내요원', '안내직원', '도움 필요', '보조 필요', '직원 도움', '도우미'],
    dog: ['보조견', '반려견', '동반 가능', '반려동물 가능', '강아지 가능', '펫 동반', '애견 동반']
  }), []);

  

  // 지역과 인원 추출
  const extractRegionPeople = useCallback((text) => {
    const regionMatch = regions.find(r => text.includes(r.replace('시', '').replace('군', '')) || text.includes(r));
    const peopleMatch = text.match(/[0-9]+(명|사람)/);
  
    if (regionMatch) {
      setSelectedRegion(regionMatch);
      console.log('지역 추출됨:', regionMatch);
    }
    if (peopleMatch) {
      const p = peopleMatch[0].replace('사람', '명');
      setSelectedPeople(p);
      console.log('인원 추출됨:', p);
    }
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

  // 음성 텍스트 입력 처리
  // 쿼리, 지역, 인원, 조건, 핵심어 추출
  const processVoiceInput = useCallback((text) => {
    console.log('? 음성 텍스트:', text);
    setQuery(text); // 음성 인식 결과를 쿼리에 설정
    extractRegionPeople(text); // 지역과 인원 추출
    extractConditions(text); // 조건 추출
    const nouns = extractProperNouns(text); // 핵심어 추출
    setMatchedNouns(nouns);
    console.log('? 핵심어 추출됨:', nouns);

    const hasRegion = regions.some(r => text.includes(r.replace('시', '').replace('군', '')) || text.includes(r));
    const hasPeople = /[0-9]+(명|사람)/.test(text);
    const hasCondition = Object.values(keywordMap).some(keywords => keywords.some(k => text.includes(k)));
    const hasProperNoun = nouns.length > 0;
    console.log('조건:', hasCondition, '지역:', hasRegion, '인원:', hasPeople, '고유명사:', hasProperNoun);
    if (hasRegion || hasPeople || hasCondition || hasProperNoun) {
      setIsPopupVisible(true);
    } else {
      setError('조건, 지역, 인원 중 하나 이상을 말씀해 주세요.');
    }
  }, [extractRegionPeople, extractConditions, extractProperNouns, regions, keywordMap]);

  // 음성 인식 시작
  
  const startVoiceRecognition = useCallback(() => {
    if (micDenied) {
      setError('마이크 권한이 허용되지 않았습니다.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicDenied(true);
      return;
    }

    if (recognitionRef.current) recognitionRef.current.abort();

    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      if (transcript.length < 5) {
        recognition.start();
        return;
      }
      processVoiceInput(transcript);
    };

    recognition.onerror = (e) => {
      if (e.error !== 'aborted') {
        console.error('음성 인식 오류:', e);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [micDenied, processVoiceInput]);

  // 앱 실행 시 1회만 권한 요청
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicDenied(true);
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => setMicDenied(false))  // 권한 허용됨
      .catch(() => setMicDenied(true)); // 권한 거부됨
  }, []);

  // 검색 버튼 클릭 시 동작
  const handleQuerySubmit = useCallback(() => {
    if (selectedRegion === '지역' || selectedPeople === '인원') {
      setError('지역과 인원을 입력해 주세요.');
      return;
    }
    
    if (query.trim() === '') { // 쿼리가 비어있을 때의 디폴트 질문
      setQuery(`${selectedRegion}에서 ${selectedPeople}이 지내기 좋은 숙소를 추천해줘`);
    }
    
    // 쿼리에서 지역과 인원 추출
    extractConditions(query);
    // 쿼리에서 고유명사 추출
    extractProperNouns(query);
    setError('');
    setIsPopupVisible(true);
  }, [selectedRegion, selectedPeople, query, extractConditions, extractProperNouns]);

  // 숙소 추천 결과 요청
  const handleConfirm = useCallback(async () => {
    // 오타 교정
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
        '반련견': '반려견',
        '잇는': '있는',
        '후ㅣㄹ채어': '휠체어',
        '알내': '안내'
      };
      let corrected = text; // 원본 텍스트를 복사
      for (const typo in corrections) { // 오타 목록을 순회
        const regex = new RegExp(typo, 'g'); // 정규 표현식으로 오타 찾기
        corrected = corrected.replace(regex, corrections[typo]); // 오타 교정
      }
      return corrected;
    };
  
    const correctedQuery = correctTypos(query); //오타 교정된 쿼리
  
    try {
      setIsLoading(true); // 로딩 상태
      // 백엔드로 API 요청 양식
      const res = await axios.post(`{API_URL}/api/recommend`, {
        query: correctedQuery,
        region: selectedRegion,
        people: selectedPeople,
        conditions,
        properNouns: matchedNouns   // ? 핵심어 함께 전송
      });
  
      setLogText(
        ` DEBUG 정보\n` +
        `${res.data.debug}\n`
      ); // API 응답 로그
      console.log('API 응답:', res.data);
      setIsLoading(false); // 로딩 상태 해제

      const results = res.data.results;
      if (results.length === 0) {
        setError('조건에 맞는 숙소가 없습니다.');
        return;
      }
  
      setResponse(results);
      setShowResults(true);
      setIsPopupVisible(false);
      setViewRange(0);

    } catch (error) {
      console.error('Error:', error);
    }
  }, [query, selectedRegion, selectedPeople, conditions, matchedNouns]);
  


  // 팝업 취소
  // 마이크 허용 시 음성 인식 재시작
  // 마이크 차단 시 음성 인식 재시작 X
  const handleCancel = useCallback(() => {
    setIsPopupVisible(false);
    setQuery('');
    setMatchedNouns([]);
    setConditions({
      wheelchair: false,
      elevator: false,
      ramp: false,
      parking: false,
      assistant: false,
      dog: false
    });
    if (!micDenied) startVoiceRecognition();
  }, [micDenied, startVoiceRecognition]);

  // 조건 초기화 및 첫 화면으로
  const handleReset = () => {
    setSelectedRegion('지역');
    setSelectedPeople('인원');
    setQuery('');
    setResponse([]);
    setViewRange(0);
    setShowResults(false);
    setError('');
    setMatchedNouns([]);
    setLogText('')
    if (!micDenied) startVoiceRecognition();
  };

  // ? 다음 숙소 보기 버튼 (>)
  const handleNext = () => {
    const next = (viewRange + 1) * 3;
    if (next >= response.length) {
      alert('더 이상 숙소가 없습니다.');
      return;
    }
    setViewRange(viewRange + 1);
  };

  // ? 이전 숙소 보기 버튼 (<)
  const handlePrev = () => {
    if (viewRange === 0) {
      alert('이전 숙소가 없습니다.');
      return;
    }
    setViewRange(viewRange - 1);
  };

  // 마이크 차단 여부 확인
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicDenied(true);
    }
  }, []);

  // Popup 열릴 때 "네 / 아니오" 음성 인식
  useEffect(() => {
    if (!isPopupVisible || micDenied) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicDenied(true);
      return;
    }
    // ? 기존 인식 종료
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
  
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ko-KR';
      recognition.interimResults = false;
      recognition.continuous = false;
  
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim().toLowerCase();
        if (/네|응|좋아|그래/.test(transcript)) { // "네" 또는 "응"이 포함된 경우 - 검색 시작
          handleConfirm(); 
        } else if (/아니|아니오|싫어|다시/.test(transcript)) { // "아니" 또는 "싫어"가 포함된 경우 - 팝업 닫기
          handleCancel();
        }
      };
  
      recognition.onerror = (e) => {
        console.error('팝업 내 음성 인식 오류:', e);
      };
  
      recognition.start();
      recognitionRef.current = recognition;
  
      return () => recognition.abort();
    } catch (error) {
      console.error('팝업 음성 인식 시작 중 오류:', error);
    }
  }, [isPopupVisible, micDenied, handleConfirm, handleCancel]);
  

  return (
    <>
    {showIntro && <Intro onFinish={() => setShowIntro(false)} />}
    {/* 인트로 화면이 끝나면 앱 화면 표시 */}
    {!showIntro && (
      <div className="App">
        {isLoading ? (
        <div className="loading-overlay">
          <p>
            AI가 조건에 맞는 숙소를 꼼꼼히 살펴보는 중이에요! ?<br />
            조금만 기다려 주세요 ?
          </p>
          <div className="spinner" />
          <pre className="log-text">{logText}</pre>
        </div>
        ) : (
        <>
        {/* 로딩 중일 때 오버레이 */} 
        <div className="Title">
          <h3>SilverStay<span>노약자 & 장애인 전용 강원도 숙소 가이드</span></h3>
        </div>

        {!showResults && (
          <div className="query-container">
            <h3>{micDenied ? '조건을 직접 입력해 주세요' : '원하시는 조건을 음성 인식 버튼을 누르신 뒤 말씀해주세요'}</h3>
          
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

            {micDenied ? (
              <>
                <textarea
                  className="query-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="숙소 조건을 입력해 주세요."
                />
                <button className="query-button" onClick={handleQuerySubmit}>검색</button>
              </>
              ) : (
                <button className="query-button" onClick={startVoiceRecognition}>음성 인식</button>
              )
            }
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
            hotels={response}
            onReset={handleReset}
            onNext={handleNext}
            onPrev={handlePrev}
            viewRange={viewRange}
          />
        )}
        </>
      )}
        </div>
      )}
      </>
  )
};

export default App;
