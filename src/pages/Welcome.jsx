import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.jpg';

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
      className={`min-h-screen bg-gradient-to-br from-[#FFD3AC] to-[#FFB5AB] flex flex-col items-center justify-center cursor-pointer transition-opacity duration-700 ease-in-out ${isFading ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="w-[200px] h-[200px] md:w-[250px] md:h-[250px] bg-white rounded-full flex justify-center items-center shadow-xl animate-[bounce_3s_ease-in-out_infinite] border-4 border-white/40 mb-8">
        <img src={logoImg} alt="3K Kitchen Logo" className="max-w-[160px] md:max-w-[200px] h-auto drop-shadow-md rounded-full" />
      </div>
      <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 drop-shadow-sm mb-4 text-center tracking-tight">
        Welcome to <span className="text-[#E39A7B]">3K Kitchen</span>
      </h1>
      <p className="text-gray-800 font-bold text-lg md:text-xl animate-pulse">
        Click anywhere to enter
      </p>
    </div>
  );
}