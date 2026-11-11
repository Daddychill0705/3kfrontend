import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { formatOrderNumber } from '../utils/orderNumber';

const money = amount => `₱${Number(amount || 0).toFixed(2)}`;

const defaultDrinks = ['Coke', 'Sprite', 'Royal'].flatMap((brand, brandIndex) => {
  const color = ['#d9272e', '#159447', '#ed7c22'][brandIndex];
  return [
    { size: 'Small · 250 ml', price: 25 },
    { size: 'Medium · 500 ml', price: 35 },
    { size: 'Large · 1 L', price: 50 }
  ].map(({ size, price }) => ({
    id: `pos-${brand.toLowerCase()}-${size.split(' ')[0].toLowerCase()}`,
    name: `${brand} ${size}`,
    category: 'Drinks',
    price,
    brand,
    drinkColor: color
  }));
});

function DrinkCan({ brand, color }) {
  return (
    <svg viewBox="0 0 120 100" role="img" aria-label={`${brand} drink`} className="h-full w-full">
      <defs>
        <linearGradient id={`can-${brand}`} x1="0" x2="1">
          <stop offset="0" stopColor="#b7b7b7" />
          <stop offset="0.2" stopColor="#fff" />
          <stop offset="0.8" stopColor="#e7e7e7" />
          <stop offset="1" stopColor="#999" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="89" rx="27" ry="5" fill="#493524" opacity=".16" />
      <path d="M43 17h34l5 12v48l-5 10H43l-5-10V29z" fill={`url(#can-${brand})`} stroke="#aaa" />
      <path d="M40 30h40v42H40z" fill={color} />
      <ellipse cx="60" cy="18" rx="17" ry="4" fill="#dadada" stroke="#999" />
      <path d="M54 17h12" stroke="#888" strokeWidth="2" />
      <text x="60" y="52" fill="white" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize={brand === 'Coke' ? '12' : '11'} fontWeight="900" fontStyle="italic">{brand}</text>
      <text x="60" y="63" fill="white" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="5" fontWeight="700">REFRESHING</text>
      <path d="M44 76h32" stroke="#fff" strokeOpacity=".65" strokeWidth="2" />
    </svg>
  );
}

export default function CashierPOS({ branch, cashierUser, onBack }) {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const { showToast } = useToast();
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState('');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderType, setOrderType] = useState('');
  const [isOrderTypeSelectionOpen, setIsOrderTypeSelectionOpen] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [cashTendered, setCashTendered] = useState('');
  const [gcashRef, setGcashRef] = useState('');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [isCashierAccessOpen, setIsCashierAccessOpen] = useState(false);
  const [cashierPassword, setCashierPassword] = useState('');
  const [isVerifyingCashier, setIsVerifyingCashier] = useState(false);
  const setError = message => { if (message) showToast(message, 'error'); };
  const setCashierAccessError = message => { if (message) showToast(message, 'error'); };

  useEffect(() => {
    let isCurrent = true;
    const fetchMenu = async () => {
      setMenuLoading(true);
      setMenuError('');
      try {
        const response = await fetch(`${API_URL}/api/menu`);
        if (!response.ok) throw new Error('Could not load the menu. Please try again.');
        const items = await response.json();
        if (isCurrent) setMenuItems(Array.isArray(items) ? items : []);
      } catch (fetchError) {
        if (isCurrent) setMenuError(fetchError.message || 'Could not load the menu.');
      } finally {
        if (isCurrent) setMenuLoading(false);
      }
    };
    fetchMenu();
    return () => { isCurrent = false; };
  }, [API_URL]);

  const categories = useMemo(() => {
    const otherCategories = [...new Set(menuItems.map(item => item.category).filter(Boolean))]
      .filter(category => String(category).trim().toLowerCase() !== 'drinks');
    return ['All', ...otherCategories, 'Drinks'];
  }, [menuItems]);
  const posMenuItems = useMemo(() => {
    const menuDrinks = menuItems.filter(item => String(item.category || '').trim().toLowerCase() === 'drinks');
    const defaultMenuDrinks = defaultDrinks.filter(drink => !menuDrinks.some(item => {
      const name = String(item.name || '').toLowerCase();
      const sizeName = drink.size.split(' ')[0].toLowerCase();
      const sizeTokens = sizeName === 'small' ? ['small', '250'] : sizeName === 'medium' ? ['medium', '500'] : ['large', '1000', '1l'];
      const normalizedName = name.replace(/\s/g, '');
      return name.includes(drink.brand.toLowerCase()) && sizeTokens.some(token => name.includes(token) || normalizedName.includes(token.replace(/\s/g, '')));
    }));
    return [...menuItems, ...defaultMenuDrinks];
  }, [menuItems]);
  const visibleItems = useMemo(() => posMenuItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || String(item.category || '').toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch = String(item.name || '').toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchesCategory && matchesSearch;
  }), [posMenuItems, activeCategory, searchQuery]);
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);
  const vatableSales = subtotal / 1.12;
  const vatAmount = subtotal - vatableSales;
  const changeDue = Math.max(0, Number(cashTendered || 0) - subtotal);

  const buildCart = (existingItems, incomingItems) => {
    const merged = new Map();
    [...existingItems, ...incomingItems].forEach(item => {
      const key = String(item.id);
      const existing = merged.get(key);
      merged.set(key, existing ? { ...existing, qty: existing.qty + item.qty } : { ...item });
    });
    return [...merged.values()];
  };

  const beginItemOrder = item => {
    if (!orderType || Number(item.is_sold_out) === 1 || item.is_sold_out === true) return;
    const lineItem = {
      id: item.id,
      name: item.name,
      price: Number(item.price),
      image: item.image_url || null,
      qty: 1
    };
    setCart(previous => buildCart(previous, [lineItem]));
    showToast(`${item.name} added to ticket.`, 'success');
  };

  const updateQuantity = (id, change) => {
    setCart(previous => previous
      .map(item => String(item.id) === String(id) ? { ...item, qty: item.qty + change } : item)
      .filter(item => item.qty > 0));
  };

  const openPayment = () => {
    if (!cart.length || !orderType) return;
    if (!customerName.trim()) {
      setError('Enter the customer name or calling name to continue.');
      return;
    }
    setIsCartOpen(false);
    setError('');
    setCashTendered(subtotal.toFixed(2));
    setIsPaymentOpen(true);
  };

  const returnToOrderSummary = () => {
    setIsPaymentOpen(false);
    setError('');
  };

  const verifyCashierAccess = async event => {
    event.preventDefault();
    if (isVerifyingCashier || !cashierPassword || !cashierUser?.email) return;
    setIsVerifyingCashier(true);
    setCashierAccessError('');
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cashierUser.email, password: cashierPassword })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.user?.email?.toLowerCase() !== cashierUser.email.toLowerCase() || result.user?.role !== cashierUser.role || !['admin', 'cashier'].includes(result.user?.role)) {
        throw new Error('Incorrect cashier password.');
      }
      setIsCashierAccessOpen(false);
      setCashierPassword('');
      onBack();
    } catch (accessError) {
      setCashierAccessError(accessError.message || 'Could not verify cashier access.');
    } finally {
      setIsVerifyingCashier(false);
    }
  };

  const completeSale = async event => {
    event.preventDefault();
    if (isSubmitting || cart.length === 0 || !orderType) return;
    if (!customerName.trim()) {
      setError('Enter the customer name or calling name to complete this sale.');
      return;
    }
    if (paymentMethod === 'Cash' && Number(cashTendered) < subtotal) {
      setError('Cash tendered must cover the total amount.');
      return;
    }
    if (paymentMethod === 'GCash' && !/^\d{13}$/.test(gcashRef)) {
      setError('GCash reference number must contain exactly 13 digits.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    const token = localStorage.getItem('token');
    const tendered = paymentMethod === 'Cash' ? Number(cashTendered) : subtotal;
    const notes = orderNotes.trim();

    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items: JSON.stringify(cart.map(({ name, qty, price }) => ({ name, qty, price }))),
          totalAmount: subtotal,
          orderType,
          branch,
          address: null,
          phone: null,
          paymentMethod,
          notes,
          receipt_url: null,
          customerName: customerName.trim(),
          gcashReference: paymentMethod === 'GCash' ? gcashRef : null,
          cashTendered: paymentMethod === 'Cash' ? tendered : null
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not save this sale. Please try again.');
      if (!result.orderId) throw new Error('The sale was saved but the server did not return an order number. Please check the order queue before retrying.');

      // Mark this paid counter sale as confirmed so it can be sent to the kitchen.
      let statusConfirmed = false;
      try {
        const statusResponse = await fetch(`${API_URL}/api/admin/orders/${result.orderId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: 'Confirmed' })
        });
        statusConfirmed = statusResponse.ok;
      } catch (statusError) {
        console.error('Sale was saved but could not confirm its kitchen status.', statusError);
      }

      setReceipt({
        id: result.orderId,
        orderNumber: result.orderNumber,
        branch,
        customerName: customerName.trim(),
        orderType,
        items: cart.map(item => ({ ...item })),
        subtotal,
        vatableSales,
        vatAmount,
        paymentMethod,
        cashTendered: tendered,
        change: paymentMethod === 'Cash' ? tendered - subtotal : 0,
        gcashReference: paymentMethod === 'GCash' ? gcashRef : '',
        amountPaid: subtotal,
        notes,
        createdAt: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
        status: statusConfirmed ? 'Confirmed' : 'Pending'
      });
      setCart([]);
      setCustomerName('');
      setOrderNotes('');
      setGcashRef('');
      setPaymentMethod('Cash');
      setIsPaymentOpen(false);
    } catch (submitError) {
      setError(submitError.message || 'Could not save this sale. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startNewOrder = () => {
    setReceipt(null);
    setCart([]);
    setCustomerName('');
    setOrderNotes('');
    setOrderType('');
    setPaymentMethod('Cash');
    setCashTendered('');
    setGcashRef('');
    setError('');
    setIsCartOpen(false);
    setIsOrderTypeSelectionOpen(true);
  };

  const canReturnToCashier = ['admin', 'cashier'].includes(cashierUser?.role);
  const formatMoney = money;

  return (
    <div className="fixed inset-0 z-[60] flex min-h-0 flex-col bg-[#F5EFE3] font-sans text-gray-800">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#60452f] bg-[#33251b] px-4 py-3 text-white shadow-md sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#E6D4B8] to-[#C9A77C] font-black text-[#815633] shadow-sm">3K</div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white sm:text-lg">3K Kitchen POS</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#dfc4a3]">{branch || 'Cashier register'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-md border border-[#8c6846] bg-[#493524] px-3 py-1.5 text-xs font-bold text-[#f5dfc4] sm:inline-flex">COUNTER SALE</span>
          <button type="button" onClick={() => setIsCartOpen(true)} className="rounded-lg border border-[#c9a77c] bg-[#f5efe3] px-4 py-2 text-sm font-bold text-[#60452f] shadow-sm hover:bg-white lg:hidden">View Cart <span className="ml-1 rounded-full bg-[#815633] px-2 py-0.5 text-xs text-white">{cartCount}</span></button>
          {canReturnToCashier && <button type="button" onClick={() => { setCashierAccessError(''); setCashierPassword(''); setIsCashierAccessOpen(true); }} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50">🔒 Cashier</button>}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_360px] lg:overflow-hidden">
        <section className="flex min-h-[55vh] min-w-0 flex-col p-4 sm:p-6 lg:min-h-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search menu</span>
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
              <input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search dishes..." className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-[#815633] focus:ring-2 focus:ring-[#815633]/15" />
            </label>
            <div className="flex items-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-600"><span className="mr-2 text-[#815633]">⌖</span>{branch || 'Select branch'}</div>
          </div>

          <div className="mb-3 flex shrink-0 flex-wrap gap-1.5 overflow-x-auto pb-1">
            {categories.map(category => (
              <button key={category} type="button" onClick={() => setActiveCategory(category)} className={`shrink-0 rounded-md border px-3 py-2 text-[11px] font-black uppercase tracking-wide transition ${activeCategory === category ? 'border-[#815633] bg-[#815633] text-white shadow-sm' : 'border-[#C9A77C]/40 bg-white text-gray-700 hover:border-[#815633]'}`}>
                {category}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {menuLoading ? (
              <div className="py-16 text-center text-sm font-semibold text-gray-500">Loading menu...</div>
            ) : menuError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{menuError}</div>
            ) : visibleItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 p-10 text-center text-sm font-semibold text-gray-500">No menu items found.</div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {visibleItems.map(item => {
                  const soldOut = Number(item.is_sold_out) === 1 || item.is_sold_out === true;
                  return (
                    <button key={item.id} type="button" disabled={soldOut} onClick={() => beginItemOrder(item)} className={`group overflow-hidden rounded-lg border bg-white p-1.5 text-left shadow-sm transition ${soldOut ? 'cursor-not-allowed opacity-55 grayscale' : 'border-[#d8c2a4] hover:-translate-y-0.5 hover:border-[#815633] hover:shadow-md active:scale-[0.99]'}`}>
                      <div className="relative mb-1.5 h-16 overflow-hidden rounded-md bg-[#F5EFE3] sm:h-[72px]">
                        {item.image_url ? <img src={item.image_url} alt={item.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" /> : item.brand ? <DrinkCan brand={item.brand} color={item.drinkColor} /> : <span className="flex h-full items-center justify-center text-2xl text-[#b99971]">3K</span>}
                        {item.category && <span className="absolute left-1 top-1 max-w-[90%] truncate rounded border border-white/70 bg-white/90 px-1.5 py-0.5 text-[8px] font-black text-gray-700 shadow-sm">{item.category}</span>}
                        {soldOut && <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-black tracking-widest text-white">SOLD OUT</span>}
                      </div>
                      <span className="line-clamp-2 block min-h-8 text-[10px] font-bold leading-tight text-gray-900 sm:text-[11px]">{item.name}</span>
                      <span className="mt-1 flex items-center justify-between border-t border-gray-100 pt-1.5">
                        <span className="text-xs font-black text-[#815633]">{formatMoney(item.price)}</span>
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-[#815633] text-base font-bold text-white">+</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="hidden min-h-0 flex-col border-l border-[#d8c2a4] bg-[#fbf8f1] shadow-[-8px_0_20px_rgba(80,55,30,0.08)] lg:flex">
          <div className="flex items-center justify-between border-b border-[#e4d5bf] bg-[#f2e8d8] px-4 py-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b6847]">Register ticket</p>
              <h2 className="mt-1 text-sm font-black text-[#33251b]">Current order</h2>
            </div>
            <span className="rounded-md border border-[#d8c2a4] bg-white px-2 py-1 text-[10px] font-black uppercase text-[#815633]">{orderType || 'New sale'}</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {cart.length === 0 ? (
              <div className="flex h-full min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-[#d8c2a4] bg-white/70 p-5 text-center">
                <span className="mb-2 text-3xl text-[#b99971]">▤</span>
                <p className="text-xs font-black text-[#60452f]">No items on ticket</p>
                <p className="mt-1 text-[11px] text-gray-500">Select a menu item to start this sale.</p>
              </div>
            ) : cart.map((item, index) => (
              <div key={item.id} className="border-b border-dashed border-[#d8c2a4] py-3 first:pt-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold leading-snug text-gray-900">{index + 1}. {item.name}</p>
                    <p className="mt-1 text-[10px] text-gray-500">{formatMoney(item.price)} each</p>
                  </div>
                  <span className="shrink-0 text-[11px] font-black text-[#60452f]">{formatMoney(item.price * item.qty)}</span>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <button type="button" aria-label={`Remove one ${item.name}`} onClick={() => updateQuantity(item.id, -1)} className="h-6 w-7 rounded border border-[#d8c2a4] bg-white text-sm font-bold text-[#60452f] hover:bg-[#f2e8d8]">-</button>
                  <span className="w-7 text-center text-xs font-black">{item.qty}</span>
                  <button type="button" aria-label={`Add one ${item.name}`} onClick={() => updateQuantity(item.id, 1)} className="h-6 w-7 rounded border border-[#d8c2a4] bg-white text-sm font-bold text-[#60452f] hover:bg-[#f2e8d8]">+</button>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-[#e4d5bf] bg-white p-4">
            <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500">Customer / calling name <span className="text-red-600">*</span>
              <input autoComplete="off" value={customerName} onChange={event => { setCustomerName(event.target.value); setError(''); }} placeholder="Walk-in customer" maxLength={255} className="mt-1 w-full rounded-md border border-[#d8c2a4] bg-[#fbf8f1] px-3 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-[#815633]" />
            </label>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500">Order notes
              <textarea value={orderNotes} onChange={event => setOrderNotes(event.target.value)} maxLength={500} rows={2} placeholder="Optional kitchen notes" className="mt-1 w-full resize-y rounded-md border border-[#d8c2a4] bg-[#fbf8f1] px-3 py-2 text-xs font-medium text-gray-800 outline-none focus:border-[#815633]" />
            </label>
            <div className="flex justify-between text-[11px] font-semibold text-gray-500"><span>Vatable sales</span><span>{formatMoney(vatableSales)}</span></div>
            <div className="flex justify-between text-[11px] font-semibold text-gray-500"><span>VAT (12%)</span><span>{formatMoney(vatAmount)}</span></div>
            <div className="flex justify-between border-t border-dashed border-[#d8c2a4] pt-2 text-xs font-black text-[#33251b]"><span>Grand total</span><span className="text-base text-[#815633]">{formatMoney(subtotal)}</span></div>
            <button type="button" onClick={openPayment} disabled={!cart.length || isSubmitting} className="mt-2 w-full rounded-lg bg-[#815633] py-3 text-xs font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-[#62432B] disabled:cursor-not-allowed disabled:bg-gray-300">Process payment</button>
            <button type="button" onClick={() => setCart([])} disabled={!cart.length || isSubmitting} className="w-full rounded-lg border border-red-200 py-2 text-[11px] font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">Clear ticket</button>
          </div>
        </aside>

        {isCartOpen && <div className="fixed inset-0 z-[70] bg-black/50" onMouseDown={event => { if (event.target === event.currentTarget) setIsCartOpen(false); }}>
        <aside role="dialog" aria-modal="true" aria-labelledby="cart-title" className="absolute inset-y-0 right-0 flex w-full max-w-[440px] min-w-0 flex-col border-l border-gray-200 bg-white shadow-2xl">
          <div className="space-y-3 border-b border-gray-100 bg-gray-50/70 p-4">
            <div className="flex items-center justify-between">
              <h2 id="cart-title" className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-600"><span className="text-lg text-[#815633]">▣</span> Current order summary</h2>
              <button type="button" aria-label="Close cart" onClick={() => setIsCartOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-gray-400 hover:bg-gray-200">×</button>
            </div>
          </div>

          <div className="min-h-36 flex-1 space-y-3 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="flex h-full min-h-40 flex-col items-center justify-center px-5 text-center">
                <span className="mb-3 text-4xl text-[#C9A77C]">♨</span>
                <p className="text-sm font-bold text-gray-700">Your order tray is empty</p>
                <p className="mt-1 text-xs text-gray-500">Tap a menu item to add it to this sale.</p>
              </div>
            ) : cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[#C9A77C]/25 bg-[#FBFAF4] p-3">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-xs font-bold leading-snug text-gray-900">{item.name}</p>
                  <p className="mt-1 text-xs font-bold text-[#815633]">{formatMoney(item.price)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
                  <button type="button" aria-label={`Remove one ${item.name}`} onClick={() => updateQuantity(item.id, -1)} className="flex h-8 w-8 items-center justify-center rounded text-lg font-bold text-gray-600 hover:bg-gray-100">−</button>
                  <span className="w-7 text-center text-sm font-black">{item.qty}</span>
                  <button type="button" aria-label={`Add one ${item.name}`} onClick={() => updateQuantity(item.id, 1)} className="flex h-8 w-8 items-center justify-center rounded text-lg font-bold text-gray-600 hover:bg-gray-100">+</button>
                </div>
                <span className="w-20 shrink-0 text-right text-xs font-black text-gray-900">{formatMoney(item.price * item.qty)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-gray-200 bg-gray-50 p-4">
            <label className="block text-xs font-bold text-gray-600">Customer / calling name <span className="text-red-600">*</span>
              <input autoComplete="off" value={customerName} onChange={event => { setCustomerName(event.target.value); setError(''); }} placeholder="Walk-in customer" maxLength={255} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#815633]" />
            </label>
            <label className="block text-xs font-bold text-gray-600">Order notes
              <textarea value={orderNotes} onChange={event => setOrderNotes(event.target.value)} maxLength={500} rows={2} placeholder="Optional kitchen notes" className="mt-1 w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-[#815633]" />
            </label>
            <div className="flex justify-between text-xs font-bold text-gray-600"><span>Vatable sales</span><span>{formatMoney(vatableSales)}</span></div>
            <div className="flex justify-between text-xs font-bold text-gray-600"><span>VAT (12%)</span><span>{formatMoney(vatAmount)}</span></div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-black text-gray-900"><span>Grand total</span><span className="text-xl text-[#815633]">{formatMoney(subtotal)}</span></div>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => setCart([])} disabled={!cart.length || isSubmitting} className="shrink-0 rounded-xl border border-red-200 bg-white px-4 py-3.5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">Clear all</button>
              <button type="button" onClick={openPayment} disabled={!cart.length || isSubmitting} className="flex-1 rounded-xl bg-[#815633] py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-md transition hover:bg-[#62432B] disabled:cursor-not-allowed disabled:bg-gray-300">
                Process payment
              </button>
            </div>
          </div>
        </aside>
        </div>}
      </div>

      {isPaymentOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-5">
              <h2 className="text-lg font-black text-gray-900">Process cashier payment</h2>
              <button type="button" aria-label="Close payment" onClick={() => setIsPaymentOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-gray-400 hover:bg-gray-200">×</button>
            </div>
            <form onSubmit={completeSale} className="space-y-5 p-5 sm:p-6">
              <div className="rounded-2xl border border-[#C9A77C]/30 bg-[#FBFAF4] p-4 text-center">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Total amount due</span>
                <p className="mt-1 text-3xl font-black text-[#815633]">{formatMoney(subtotal)}</p>
              </div>
              <div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Payment mode</span>
                <div className="grid grid-cols-2 gap-2">
                  {['Cash', 'GCash'].map(method => <button key={method} type="button" onClick={() => setPaymentMethod(method)} className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${paymentMethod === method ? 'border-[#815633] bg-[#815633] text-white' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}>{method === 'Cash' ? 'Cash tendered' : 'GCash'}</button>)}
                </div>
              </div>
              {paymentMethod === 'Cash' ? (
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Cash tendered
                    <input type="number" min={subtotal} step="0.01" required value={cashTendered} onChange={event => setCashTendered(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-xl font-black text-gray-900 outline-none focus:border-[#815633]" />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[subtotal, ...[200, 500, 1000].filter(amount => amount >= subtotal)].filter((amount, index, list) => list.indexOf(amount) === index).map(amount => <button key={amount} type="button" onClick={() => setCashTendered(Number(amount).toFixed(2))} className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100">{formatMoney(amount)}</button>)}
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-3"><span className="text-xs font-bold uppercase text-green-800">Change to return</span><span className="text-xl font-black text-green-700">{formatMoney(changeDue)}</span></div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
                    <p className="text-sm font-black text-blue-900">GCash payment</p>
                    <p className="mt-1 text-sm font-bold text-blue-800">Amount paid: {formatMoney(subtotal)}</p>
                    <p className="mt-1 text-xs font-medium text-blue-700">Verify payment through your branch&apos;s approved GCash process before confirming.</p>
                  </div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">GCash reference number
                    <input type="text" required inputMode="numeric" pattern="[0-9]{13}" maxLength={13} value={gcashRef} onChange={event => setGcashRef(event.target.value.replace(/\D/g, '').slice(0, 13))} placeholder="13-digit reference number" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#815633]" />
                    {gcashRef.length !== 13 && <span role="status" className="mt-2 block text-xs font-semibold normal-case tracking-normal text-amber-700">Enter exactly 13 digits ({gcashRef.length}/13).</span>}
                    {gcashRef.length === 13 && <span className="mt-2 block text-xs font-semibold normal-case tracking-normal text-green-700">13-digit reference entered. Payment still requires cashier verification.</span>}
                  </label>
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={returnToOrderSummary} disabled={isSubmitting} className="flex-1 rounded-xl border border-gray-200 py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60">Back</button>
                <button type="submit" disabled={isSubmitting || (paymentMethod === 'GCash' && !/^\d{13}$/.test(gcashRef)) || (paymentMethod === 'Cash' && Number(cashTendered) < subtotal)} className="flex-[2] rounded-xl bg-green-600 py-3.5 text-sm font-black text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? 'Saving sale...' : 'Confirm sale'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {receipt && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-4">
              <div className="min-w-0"><h2 className="truncate font-black uppercase text-gray-900">{receipt.customerName}</h2><p className="text-xs font-bold text-gray-500">Order #{formatOrderNumber(receipt.orderNumber || receipt.id)}</p></div>
              <button type="button" aria-label="Close receipt and start a new order" onClick={startNewOrder} className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-gray-400 hover:bg-gray-200">×</button>
            </div>
            <div className="overflow-y-auto p-5 font-mono text-xs text-gray-900">
              <div className="center text-center"><p className="text-base font-black">3K KITCHEN</p><p>{receipt.branch}</p><p>SALES RECEIPT</p></div>
              <div className="rule my-3 border-t border-dashed border-gray-600" />
              <p className="bold">Customer: {receipt.customerName}</p><p>Order #: {formatOrderNumber(receipt.orderNumber || receipt.id)}</p><p>Date: {receipt.createdAt}</p><p>Type: {receipt.orderType}</p>
              <div className="rule my-3 border-t border-dashed border-gray-600" />
              {receipt.items.map(item => <div key={item.id} className="row my-1 flex justify-between gap-2"><span>{item.qty}x {item.type ? `${item.type}: ` : ''}{item.name}</span><span>{formatMoney(item.price * item.qty)}</span></div>)}
              <div className="rule my-3 border-t border-dashed border-gray-600" />
              <div className="row flex justify-between"><span>Vatable sales</span><span>{formatMoney(receipt.vatableSales)}</span></div>
              <div className="row flex justify-between"><span>VAT (12%)</span><span>{formatMoney(receipt.vatAmount)}</span></div>
              <div className="row bold flex justify-between text-sm font-black"><span>GRAND TOTAL</span><span>{formatMoney(receipt.subtotal)}</span></div>
              <div className="rule my-3 border-t border-dashed border-gray-600" />
              <p>Payment method: {receipt.paymentMethod}</p><p>Payment status: PAID</p>
              {receipt.paymentMethod === 'Cash' && <><p>Cash tendered: {formatMoney(receipt.cashTendered)}</p><p>Change given: {formatMoney(receipt.change)}</p></>}
              {receipt.paymentMethod === 'GCash' && <><p>GCash reference: {receipt.gcashReference}</p><p>Amount paid: {formatMoney(receipt.amountPaid)}</p></>}
              {receipt.notes && <p className="mt-2 break-words">Special instructions: {receipt.notes}</p>}
              <p className="mt-5 text-center font-bold">Thank you for dining with us!</p>
            </div>
            <div className="border-t border-gray-100 p-4">
              <button type="button" onClick={startNewOrder} className="w-full rounded-xl bg-[#815633] py-3 font-bold text-white hover:bg-[#62432B]">New Order</button>
            </div>
            {receipt.status !== 'Confirmed' && <p className="px-4 pb-3 text-center text-xs font-medium text-amber-700">Sale saved and paid; confirm the order from the queue before sending it to the kitchen.</p>}
          </div>
        </div>
      )}

      {isOrderTypeSelectionOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="order-type-title" className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="border-b border-gray-100 bg-gray-50 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#815633]">New counter order</p>
              <h2 id="order-type-title" className="mt-1 text-xl font-black text-gray-900">Choose order type</h2>
              <p className="mt-1 text-sm text-gray-600">Select Dine-in or Take-out before adding items.</p>
            </header>
            <div className="grid grid-cols-2 gap-3 p-5">
              {['Dine-in', 'Take-out'].map(type => (
                <button key={type} type="button" onClick={() => { setOrderType(type); setIsOrderTypeSelectionOpen(false); }} className="min-h-24 rounded-xl border-2 border-[#C9A77C]/40 bg-[#FBFAF4] px-4 py-5 text-base font-black text-[#815633] shadow-sm transition hover:border-[#815633] hover:bg-[#F5EFE3]">
                  {type}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {isCashierAccessOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={verifyCashierAccess} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#815633]">Employee verification</p>
                <h2 className="mt-1 text-lg font-black text-gray-900">Return to cashier</h2>
                <p className="mt-1 text-sm text-gray-600">Enter the cashier account password to leave the POS.</p>
              </div>
              <button type="button" aria-label="Cancel cashier access" onClick={() => setIsCashierAccessOpen(false)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-gray-400 hover:bg-gray-100">×</button>
            </div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Cashier password
              <input autoFocus type="password" required autoComplete="current-password" value={cashierPassword} onChange={event => setCashierPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-base font-semibold outline-none focus:border-[#815633]" />
            </label>
            <button type="submit" disabled={isVerifyingCashier || !cashierPassword} className="mt-4 w-full rounded-xl bg-[#815633] py-3 font-bold text-white hover:bg-[#62432B] disabled:cursor-not-allowed disabled:opacity-60">{isVerifyingCashier ? 'Checking...' : 'Verify and return'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
