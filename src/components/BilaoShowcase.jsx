import React from 'react';

const bilaoSizes = [
  {
    dish: 'Creamy Carbonara',
    image: '/img/menu/carbonara.jpg',
    description: 'A shareable bilao for a cozy meal at home with family or friends.'
  },
  {
    dish: 'Classic Palabok',
    image: '/img/menu/palabok.jpg',
    description: 'A generous choice for family gatherings and weekend get-togethers.'
  },
  {
    dish: 'Pancit Bilao',
    image: '/img/menu/pancitmalabon(makapal).jpg',
    description: 'Made for celebrations, office gatherings, and sharing with a bigger crowd.'
  }
];

export default function BilaoShowcase() {
  return (
    <section className="w-full px-4 md:px-8" aria-labelledby="bilao-showcase-title">
      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-3xl border border-[#C9A77C]/40 bg-[#FFFCF7] shadow-md">
        <div className="bg-gradient-to-r from-[#815633] to-[#A87448] px-5 py-8 text-center text-white sm:px-8 sm:py-10">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-[#F4D8B0]">Made fresh for sharing</p>
          <h2 id="bilao-showcase-title" className="text-2xl font-black sm:text-4xl">Bring a 3K Kitchen Bilao to the table</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">
            Available in Small, Medium, Large, and Party Size. Each bilao is freshly prepared for sharing at home, family gatherings, and celebrations.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-3">
          {bilaoSizes.map(({ dish, image, description }) => (
            <article key={dish} className="flex flex-col overflow-hidden rounded-2xl border border-[#C9A77C]/35 bg-white shadow-sm transition-shadow hover:shadow-lg">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#E6D4B8]/40">
                <img src={image} alt={`${dish} served in a bilao`} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="mb-1 text-xs font-black uppercase tracking-wider text-[#9A704B]">{dish}</p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">{description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
