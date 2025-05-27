import { useEffect, useState } from 'react';
import './App.css';


function Intro({ onFinish }) {
  const [shrink, setShrink] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShrink(true), 3000); // 3초 후 축소 시작
    const timer2 = setTimeout(() => onFinish(), 5000); // 5초 후 완료
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinish]);

  return (
    <div className={`intro-overlay ${shrink ? 'shrink' : ''}`}>
      <div className="intro-background" />
      <div className="intro-content">
        <h1 className="intro-title">SilverStay</h1>
        <p className="intro-subtitle">모두의 즐거운 여행, SilverStay가 도와드리겠습니다.</p>
      </div>
    </div>
  );
}

export default Intro;
