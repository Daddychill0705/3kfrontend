import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../assets/logo.jpg';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-[#E39A7B] to-[#DBB06B] text-white pt-12 pb-8 px-4 md:px-8 mt-16">
      {/* Changed lg:grid-cols-4 to lg:grid-cols-3 to center the 3 remaining columns */}
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Brand Info */}
        <div>
          <div className="flex items-center mb-4">
            <img src={logoImg} alt="3K Kitchen Logo" className="w-10 h-10 mr-2 drop-shadow-md rounded-full" />
            <h3 className="text-white m-0 text-2xl font-bold">3K Kitchen</h3>
          </div>
          <p className="text-orange-50 leading-relaxed mb-4">
            Serving authentic flavors with passion. Experience the taste of tradition in every bite.
          </p>
        </div>
        
        {/* Quick Links */}
        <div>
          <h4 className="text-white mb-4 text-lg font-bold drop-shadow-sm">Quick Links</h4>
          <ul className="list-none p-0 m-0 space-y-2">
            <li><Link to="/menu" className="text-orange-50 no-underline transition-colors duration-300 hover:text-white font-medium">Menu</Link></li>
            <li><Link to="/order" className="text-orange-50 no-underline transition-colors duration-300 hover:text-white font-medium">Order Online</Link></li>
            <li><Link to="/about" className="text-orange-50 no-underline transition-colors duration-300 hover:text-white font-medium">About Us</Link></li>
            <li><Link to="/contact" className="text-orange-50 no-underline transition-colors duration-300 hover:text-white font-medium">Contact</Link></li>
          </ul>
        </div>
        
        {/* Contact Info */}
        <div>
          <h4 className="text-white mb-4 text-lg font-bold drop-shadow-sm">Branch Location</h4>
          <div className="text-orange-50 leading-loose font-medium">
            <p className="m-0">San Pedro Jeepney Terminal, 4117 Congressional Rd<br />GMA Cavite</p>
            
            
            
          </div>
        </div>

      </div>
      
      {/* Copyright */}
      <div className="border-t border-white/20 mt-8 pt-4 text-center text-orange-50 text-sm font-medium">
        <p className="m-0">&copy; {new Date().getFullYear()} 3K Kitchen. All rights reserved.</p>
      </div>
    </footer>
  );
}