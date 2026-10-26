import React from 'react';

export default function Contact() {
  return (
    <div className="bg-3k-bg min-h-screen py-16 px-4 md:px-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-[2.5rem] font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-lg text-gray-700 font-medium leading-relaxed max-w-2xl mx-auto">
            Have questions, feedback, or need assistance? We'd love to hear from you. Get in touch with our team.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#FFB5AB]/30">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Get in Touch</h2>
            <div className="flex items-start mb-8 gap-4">
              <div className="text-2xl text-3k-red min-w-[30px] drop-shadow-sm">📍</div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Location</h3>
                <p className="text-base text-gray-600 font-medium leading-relaxed">GMA Cavite San Pedro Jeepney Terminal, 4117 Congressional Rd</p>
              </div>
            </div>
            <div className="flex items-start mb-8 gap-4">
              <div className="text-2xl text-3k-red min-w-[30px] drop-shadow-sm">📞</div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Phone</h3>
                <p className="text-base text-gray-600 font-medium leading-relaxed">+63 929 789 9902</p>
              </div>
            </div>
            <div className="flex items-start mb-8 gap-4">
              <div className="text-2xl text-3k-red min-w-[30px] drop-shadow-sm">✉️</div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Email</h3>
                <p className="text-base text-gray-600 font-medium leading-relaxed">harlyngrace@3kkitchen.com</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-2xl text-3k-red min-w-[30px] drop-shadow-sm">🕒</div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Hours</h3>
                <p className="text-base text-gray-600 font-medium leading-relaxed">We are open 24/7 Monday - Sunday<br />Delivery available 24/7</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#FFB5AB]/30">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Send us a Message</h2>
            <form>
              <div className="mb-6">
                <label htmlFor="name" className="block text-sm font-bold text-gray-800 mb-2">Full Name</label>
                <input type="text" id="name" placeholder="Your full name" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#E39A7B] focus:ring-2 focus:ring-[#E39A7B]/20 transition-all font-medium" />
              </div>
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-bold text-gray-800 mb-2">Email Address</label>
                <input type="email" id="email" placeholder="your@email.com" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#E39A7B] focus:ring-2 focus:ring-[#E39A7B]/20 transition-all font-medium" />
              </div>
              <div className="mb-6">
                <label htmlFor="subject" className="block text-sm font-bold text-gray-800 mb-2">Subject</label>
                <input type="text" id="subject" placeholder="What's this about?" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#E39A7B] focus:ring-2 focus:ring-[#E39A7B]/20 transition-all font-medium" />
              </div>
              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-bold text-gray-800 mb-2">Message</label>
                <textarea id="message" placeholder="Tell us how we can help you..." required rows="4" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#E39A7B] focus:ring-2 focus:ring-[#E39A7B]/20 transition-all resize-y font-medium"></textarea>
              </div>
              <button type="submit" className="w-full bg-3k-red text-white font-bold py-3 rounded-lg shadow-md hover:bg-3k-red-hover hover:-translate-y-1 transition-all duration-300">
                Send Message
              </button>
            </form>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Find Us</h2>
          <p className="text-lg text-gray-700 font-medium mb-8">Visit our location in GMA Cavite Terminal branch</p>
          <div className="bg-white rounded-2xl p-4 md:p-8 shadow-lg max-w-[1000px] mx-auto border border-[#FFB5AB]/30">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d812.8136221999195!2d121.00078059592121!3d14.287305280519776!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397d7b1b13ffdc1%3A0x87775aff8c452133!2s3K%20Kitchen-GMA%20Terminal%20Branch!5e0!3m2!1sen!2sph!4v1776925200646!5m2!1sen!2sph" 
              className="w-full h-[300px] md:h-[450px] rounded-lg border-0" 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade">
            </iframe>
          </div>
        </div>
      </div>
    </div>
  );
}