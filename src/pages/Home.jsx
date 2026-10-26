import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch(`${API_URL}/api/branches`);
        if (response.ok) {
          const data = await response.json();
          setBranches(data);
          if (data.length > 0) {
            setSelectedBranch(data.find(b => b.is_active) || data[0]);
          }
        }
      } catch (error) {
        console.error('Failed to load branches', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBranches();
  }, [API_URL]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Loading branches...</div>;

  return (
    <div className="bg-[#fffaf7] min-h-[calc(100vh-80px)] flex items-center py-12">
      <div className="max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 px-6 md:px-12">
        
        <div className="flex flex-col justify-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            📍 {branches.length} Branches across Cavite
          </p>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-[1.1] mb-6 tracking-tight">
            Home-style<br/>favorites, <span className="text-[#E39A7B] italic">near you.</span>
          </h1>
          <p className="text-lg text-gray-600 font-medium mb-10 max-w-md leading-relaxed">
            Sizzling sisig, lechon kawali, pancit and bilao from the 3K Kitchen branch closest to you. Pick it up, have it delivered, or order ahead.
          </p>

          <div className="relative mb-8 max-w-md">
            <select 
              className="w-full appearance-none bg-white border border-gray-200 text-gray-900 font-bold py-4 px-6 rounded-xl shadow-sm focus:outline-none focus:border-[#E39A7B] cursor-pointer"
              value={selectedBranch?.id || ''}
              onChange={(e) => setSelectedBranch(branches.find(b => b.id === Number(e.target.value)))}
            >
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
          </div>

          {selectedBranch && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm max-w-md relative overflow-hidden transition-all">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Suggested Branch</p>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded ${selectedBranch.is_active ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {selectedBranch.is_active ? 'Open now' : 'Closed now'}
                </span>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">{selectedBranch.name}</h3>
              <p className="text-sm font-bold text-gray-500 mb-4 flex items-center gap-2">
                🕒 {selectedBranch.opening_time || '8:00 AM'} - {selectedBranch.closing_time || '8:00 PM'}
              </p>
              
              {!selectedBranch.is_active && (
                <p className="text-sm text-gray-600 font-medium mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  Closed right now, but you can order ahead for later.
                </p>
              )}

              <div className="flex gap-3">
                <Link to="/menu" className="flex-1">
                  <button className="w-full bg-[#E39A7B] text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-[#DBB06B] transition-all">
                    Order from {selectedBranch.name}
                  </button>
                </Link>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedBranch.address || selectedBranch.name)}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex-none bg-white border border-gray-200 text-gray-700 px-6 py-3.5 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center"
                >
                  🗺️ Directions
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Removed lg:h-auto and set a fixed min-height so absolute elements show up */}
        <div className="relative h-[400px] md:h-[500px] w-full bg-white rounded-3xl overflow-hidden shadow-sm border border-[#FFB5AB]/40 flex items-center justify-center">
          {selectedBranch ? (
            <iframe 
              src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15474.321!2d120.98!3d14.30!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z!5e0!3m2!1sen!2sph!4v1700000000000!5m2!1sen!2sph&q=${encodeURIComponent(selectedBranch.address || selectedBranch.name + " 3k kitchen cavite")}`}
              className="w-full h-full border-0 absolute inset-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400">
               <span className="text-4xl mb-3">📍</span>
               <p className="font-bold">Select a branch to view map</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}