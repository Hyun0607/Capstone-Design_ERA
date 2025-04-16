import './App.css';
import './Reactive.css';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import ConfirmationPopup from './Popup';
import ResultList from './ResultList';

function App() {
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

  const recognitionRef = useRef(null);

  const regions = useMemo(() => (
    [
      '춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시',
      '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'
    ]
  ), []);

  // 음성 인식 시작
  const extractRegionPeople = useCallback((text) => {
    const peopleMatch = text.match(/[0-9]+명/);
    const regionMatch = regions.find(r => text.includes(r)); // 바깥 변수 regions 사용
    if (regionMatch) setSelectedRegion(regionMatch);
    if (peopleMatch) setSelectedPeople(peopleMatch[0]);
  }, [regions]);
  

  const startVoiceRecognition = useCallback(() => {
    const processVoiceInput = (text) => {
      setQuery(text);
      extractRegionPeople(text);
      setIsPopupVisible(true);
    };

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          console.warn('이 브라우저는 음성 인식을 지원하지 않습니다.');
          setMicDenied(true);
          return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'ko-KR';
        recognition.interimResults = false;
        recognition.continuous = false;

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
  }, [extractRegionPeople]);



  const handleQuerySubmit = useCallback(() => {
    if (selectedRegion === '지역' || selectedPeople === '인원') {
      setError('지역과 인원을 입력해 주세요.');
      return;
    }
    setError('');
    setIsPopupVisible(true);
  }, [selectedRegion, selectedPeople]);

  const handleConfirm = useCallback(async () => { /* 오타 교정 */
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

    const fetchRecommendations = async (correctedQuery) => { /* 백엔드로 정보 요청 */
      const res = await axios.post('https://c1a9-34-125-147-207.ngrok-free.app/recommend', {
        query: correctedQuery,
        region: selectedRegion,
        people: selectedPeople,
      });
      return res.data.results;
    };

    const correctedQuery = correctTypos(query);
    try {
      const results = await fetchRecommendations(correctedQuery);
      setResponse(results);
      setShowResults(true);
      setIsPopupVisible(false);
      setViewRange(0);
    } catch (error) {
      console.error('Error:', error);
    }
  }, [query, selectedRegion, selectedPeople]);


  const handleCancel = useCallback(() => {
    setIsPopupVisible(false);
    if (!micDenied) startVoiceRecognition(); // 마이크 허용 시, 음성 인식 재시작
  }, [micDenied, startVoiceRecognition]);

  const handleResearch = () => {
    const next = (viewRange + 1) * 3;
    if (next >= response.length) {
      alert('더 이상 숙소가 없습니다.');
      return;
    }
    setViewRange(viewRange + 1);
  };

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

  useEffect(() => {
    startVoiceRecognition();
  }, [startVoiceRecognition]);

  // Popup 열릴 때 "네 / 아니오" 음성 인식
  useEffect(() => {
    if (!isPopupVisible || micDenied) return;
  
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
  
    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.continuous = false;
  
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
        <h3>SilverStay<span>노약자 & 장애인분들을 위한 강원도 숙소 가이드</span></h3>
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

      {isPopupVisible && (
        <ConfirmationPopup
          region={selectedRegion}
          people={selectedPeople}
          query={query}
          conditions={{}} 
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

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
