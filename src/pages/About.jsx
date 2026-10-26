import React from 'react';
import logoImg from '../assets/logo.jpg';

export default function About() {
  // Array for company values
  // Images are referenced directly via string paths to the public folder.
  const companyValues = [
    {
      title: "Authentic Flavors",
      desc: "We stay true to traditional Filipino recipes while adding our unique touch to create memorable dining experiences.",
      img: "/img/values/flavorsvalues.jpg", 
      fallbackIcon: "🍲"
    },
    {
      title: "Fresh Ingredients",
      desc: "We source our ingredients from local farmers and markets to ensure the highest quality and support our community.",
      img: "/img/values/freshingredientsvalues.jpg", 
      fallbackIcon: "🥬"
    },
    {
      title: "Made with Love",
      desc: "Every dish is prepared with care and passion, just like how our grandmothers used to cook for their families.",
      img: "/img/values/makingfoodwithlovevalues.jpg", 
      fallbackIcon: "❤️"
    },
    {
      title: "Delivery",
      desc: "We prioritize quick and reliable delivery to ensure your food arrives hot and fresh at your doorstep.",
      img: "/img/values/riderValues.png", 
      fallbackIcon: "🛵"
    }
  ];

  return (
    <div className="bg-3k-bg min-h-screen py-16 px-4 md:px-8">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-[2.5rem] font-bold text-gray-900 mb-4">About 3K Kitchen</h1>
          <p className="text-lg text-gray-700 font-medium leading-relaxed max-w-[600px] mx-auto">
            Learn about our story, our passion for Filipino cuisine, and what makes us the go-to spot for authentic comfort food in GMA Cavite.
          </p>
        </div>
        
        {/* Our Story Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center mb-16">
          <div className="p-4 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h2>
            <p className="text-base text-gray-700 font-medium leading-relaxed mb-6">
              Founded in 2020, 3K Kitchen started as a small family operation in GMA Cavite with a simple mission: to bring the authentic flavors of Filipino home cooking to every household. What began as weekend gatherings around the dining table has grown into a beloved local institution.
            </p>
            <p className="text-base text-gray-700 font-medium leading-relaxed mb-6">
              Our name "3K" represents our core values: Kaaya-aya (comfortable), Katanggap-tanggap (acceptable), and Katumbas (worth it). Every dish we serve embodies these principles, ensuring that our food not only tastes amazing but also brings comfort and satisfaction to our customers.
            </p>
            <p className="text-base text-gray-700 font-medium leading-relaxed">
              From our signature Chicken Adobo to our innovative twists on traditional favorites, we use only the freshest local ingredients and time-honored cooking techniques passed down through generations.
            </p>
          </div>
          <div className="flex justify-center items-center p-4 md:p-8">
            <div className="w-[250px] h-[250px] md:w-[300px] md:h-[300px] bg-[radial-gradient(ellipse_at_50%_50%,#FFB5AB,#FFD3AC)] rounded-full flex justify-center items-center shadow-[0_20px_60px_rgba(227,154,123,0.3)] animate-[bounce_3s_ease-in-out_infinite]">
              <img src={logoImg} alt="3K Kitchen Logo" className="w-full h-auto max-w-[200px] md:max-w-[250px] rounded-full" />
            </div>
          </div>
        </div>
        
        {/* Our Values Section */}
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg mb-16 border border-[#FFB5AB]/30">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Our Values</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {companyValues.map((val, index) => (
              <div 
                key={index} 
                className="flex flex-col bg-[#fffaf7] rounded-xl border border-[#FFB5AB]/30 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden"
              >
                {/* Image Cover Container (Matches Reference Image) */}
                <div className="h-40 w-full bg-[#FFD3AC]/40 relative overflow-hidden flex items-center justify-center">
                  <img 
                    src={val.img} 
                    alt={val.title} 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `<span class="text-6xl drop-shadow-sm">${val.fallbackIcon}</span>`;
                    }}
                  />
                </div>
                
                {/* Text Content Container */}
                <div className="p-6 text-center flex-1 flex flex-col">
                  <h3 className="text-xl font-black text-gray-900 mb-3">{val.title}</h3>
                  <p className="text-sm text-gray-600 font-medium leading-relaxed flex-1">{val.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}