import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';

// slick-carousel 스타일
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

// 내 스타일
import './App.css';
import './Reactive.css';

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
  const [matchedNouns, setMatchedNouns] = useState([]); // 핵심 명사 목록

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
    }
    if (peopleMatch) {
      const p = peopleMatch[0].replace('사람', '명');
      setSelectedPeople(p);
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
    return properNouns.filter(noun => text.includes(noun));
  }, []);

  // 음성 텍스트 입력 처리
  const processVoiceInput = useCallback((text) => {
    setQuery(text);
    extractRegionPeople(text);
    extractConditions(text);
    const nouns = extractProperNouns(text);
    setMatchedNouns(nouns);

    const hasRegion = regions.some(r => text.includes(r.replace('시', '').replace('군', '')) || text.includes(r));
    const hasPeople = /[0-9]+(명|사람)/.test(text);
    const hasCondition = Object.values(keywordMap).some(keywords => keywords.some(k => text.includes(k)));

    if (hasRegion || hasPeople || hasCondition || nouns.length > 0) {
      setIsPopupVisible(true);
    } else {
      setError('조건, 지역, 인원 중 하나 이상을 말씀해 주세요.');
    }
  }, [extractRegionPeople, extractConditions, extractProperNouns, regions, keywordMap]);

  // 음성 인식 시작
  const startVoiceRecognition = useCallback(() => {
    if (recognitionRef.current) recognitionRef.current.abort();

    navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: false,
        autoGainControl: true
      }
    }).then(() => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setMicDenied(true);
        return;
      }
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'ko-KR';
        recognition.interimResults = false;
        recognition.continuous = true;
        recognition.maxAlternatives = 1;

        let shouldContinue = true;

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript.trim();
          if (transcript.length < 5) {
            recognition.start();
            return;
          }
          shouldContinue = false;
          processVoiceInput(transcript);
        };

        recognition.onend = () => {
          if (shouldContinue) recognition.start();
        };

        recognition.onerror = (e) => {
          if (e.error !== 'aborted') console.error(e);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (error) {
        console.error(error);
      }
    }).catch(() => setMicDenied(true));
  }, [extractRegionPeople, extractConditions, extractProperNouns, processVoiceInput]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    startVoiceRecognition();
  }, [startVoiceRecognition]);

  // 검색 버튼 클릭 시
  const handleQuerySubmit = useCallback(() => {
    if (selectedRegion === '지역' || selectedPeople === '인원') {
      setError('지역과 인원을 입력해 주세요.');
      return;
    }
    extractConditions(query);
    extractProperNouns(query);
    setError('');
    setIsPopupVisible(true);
  }, [selectedRegion, selectedPeople, query, extractConditions, extractProperNouns]);

  // 팝업 확인 시 API 호출
  const handleConfirm = useCallback(async () => {
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
        '보조건': '보조견',
        '반련견': '반려견',
        '잇는': '있는',
        '후ㅣㄹ채어': '휠체어',
        '알내': '안내'
      };
      let corrected = text;
      for (const typo in corrections) {
        const regex = new RegExp(typo, 'g');
        corrected = corrected.replace(regex, corrections[typo]);
      }
      return corrected;
    };

    const correctedQuery = correctTypos(query);

    try {
      const res = await axios.post(
        '/api/recommend',
        {
          query: correctedQuery,
          region: selectedRegion,
          people: selectedPeople,
          conditions,
          properNouns: matchedNouns
        }
      );

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
      console.error(error);
    }
  }, [query, selectedRegion, selectedPeople, conditions, matchedNouns]);

  // 팝업 취소
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

  // 초기화
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

  // 다음/이전
  const handleNext = () => {
    const next = (viewRange + 1) * 3;
    if (next >= response.length) {
      alert('더 이상 숙소가 없습니다.');
      return;
    }
    setViewRange(viewRange + 1);
  };
  const handlePrev = () => {
    if (viewRange === 0) {
      alert('이전 숙소가 없습니다.');
      return;
    }
    setViewRange(viewRange - 1);
  };

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

      {showResults && (
        <div className="result-header">
          <h3>추천 숙소</h3>
          <p>총 {response.length}개 숙소가 검색되었습니다.</p>
        </div>
      )}

      {showResults && (
        <ResultList
          hotels={response.slice(viewRange * 3, (viewRange + 1) * 3)}
          onReset={handleReset}
          onNext={handleNext}
          onPrev={handlePrev}
          viewRange={viewRange}
        />
      )}
    </div>
  );
}

export default App;
