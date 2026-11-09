import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.jpg';
import './Welcome.css';

export default function Welcome() {
  const [isFading, setIsFading] = useState(false);
  const navigate = useNavigate();

  const proceedToHome = () => {
    setIsFading(true);
    
    setTimeout(() => {
      navigate('/home');
    }, 700); 
  };

  useEffect(() => {
    // Automatically trigger the fade and redirect after 3 seconds "here"
    const timer = setTimeout(() => {
      proceedToHome();
    }, 3000);
    
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      onClick={proceedToHome}
      className={`welcome-interior min-h-screen flex flex-col items-center justify-center cursor-pointer transition-opacity duration-700 ease-in-out ${isFading ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="welcome-room-frame">
        <div className="welcome-header">
          <div className="welcome-logo-medallion">
            <img src={logoImg} alt="3K Kitchen Logo" />
          </div>
          <p className="welcome-kicker">Filipino comfort food • Cavite</p>
          <div className="welcome-branches" aria-label="Our Cavite branches">
            <span>Silang</span>
            <span>GMA Terminal</span>
            <span>Dasma Bayan</span>
          </div>
        </div>

        <main className="welcome-chalkboard">
          <span className="welcome-script">Welcome to</span>
          <h1>3K KITCHEN</h1>
          <span className="welcome-rule" aria-hidden="true"></span>
          <p>Good food. Warm welcome.</p>
        </main>

        <button type="button" className="welcome-enter" onClick={event => { event.stopPropagation(); proceedToHome(); }}>
          Click anywhere to enter
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
