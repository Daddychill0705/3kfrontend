import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function BestSellers({ showForVisitors = false }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [notification, setNotification] = useState('');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const isGuest = user?.role === 'guest' || user?.email === 'guest@3kkitchen.local';

  useEffect(() => {
    if (isGuest || (!user && !showForVisitors)) return;

    let isCurrent = true;
    fetch(`${API_URL}/api/menu/best-sellers`)
      .then(response => response.ok ? response.json() : [])
      .then(data => {
        if (isCurrent) setItems(Array.isArray(data) ? data : []);
      })
      .catch(error => console.error('Failed to load best sellers:', error));

    return () => { isCurrent = false; };
  }, [API_URL, isGuest, showForVisitors, user]);

  useEffect(() => {
    if (!notification) return undefined;
    const timeoutId = window.setTimeout(() => setNotification(''), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [notification]);

  if (isGuest || (!user && !showForVisitors) || items.length === 0) return null;

  const imageSource = item => {
    const imageUrl = item.image_url || '/img/default-food.jpg';
    return imageUrl.startsWith('http')
      ? imageUrl
      : `${API_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  };

  const buyNow = item => {
    if (!user) {
      setNotification('Sign in above to order from our best sellers.');
      document.getElementById('email')?.focus();
      return;
    }
    addToCart({ ...item, qty: 1 });
    navigate('/checkout');
  };

  const addBestSellerToCart = item => {
    if (!user) {
      setNotification('Sign in above to add this item to your cart.');
      document.getElementById('email')?.focus();
      return;
    }
    addToCart({ ...item, qty: 1 });
    setNotification(`${item.name} added to your cart.`);
  };

  return (
    <section className="w-full px-4 md:px-8" aria-labelledby="best-sellers-title">
      {notification && (
        <div role="status" className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-gray-900 px-5 py-3 text-center text-sm font-bold text-white shadow-xl">
          {notification}
        </div>
      )}
      <div className="mx-auto max-w-[1400px] rounded-3xl border border-[#C9A77C]/40 bg-white/90 p-5 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-[#815633]">Customer favorites</p>
            <h2 id="best-sellers-title" className="text-2xl font-black text-gray-900 sm:text-3xl">Our 3 Best Sellers</h2>
          </div>
          {user && (
            <Link to="/menu" className="text-sm font-bold text-[#815633] underline-offset-4 hover:underline">View full menu</Link>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <article key={item.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#C9A77C]/30 bg-[#FFFCF7] shadow-sm transition-shadow hover:shadow-md">
              <div className="relative h-44 overflow-hidden bg-[#E6D4B8]/30 sm:h-52">
                <img
                  src={imageSource(item)}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                  onError={event => { event.currentTarget.src = `${API_URL}/img/default-food.jpg`; }}
                />
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-[#815633] shadow">
                  {Number(item.total_sold) > 0 ? `#${index + 1} Best Seller` : 'Popular Pick'}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">{item.category}</p>
                <h3 className="line-clamp-2 min-h-12 text-lg font-bold text-gray-900">{item.name}</h3>
                <p className="mb-4 mt-2 text-xl font-black text-[#815633]">₱{Number(item.price).toFixed(2)}</p>
                <div className="mt-auto flex gap-2">
                  <button
                    type="button"
                    onClick={() => addBestSellerToCart(item)}
                    className="flex-1 rounded-lg border border-[#815633] px-3 py-2.5 text-sm font-bold text-[#815633] transition-colors hover:bg-[#815633] hover:text-white"
                  >
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => buyNow(item)}
                    className="flex-1 rounded-lg bg-[#815633] px-3 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#62432B]"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
