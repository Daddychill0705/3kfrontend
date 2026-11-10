import React, { useEffect, useMemo, useRef, useState } from 'react';

const money = amount => `₱${Number(amount || 0).toFixed(2)}`;

export default function CashierPOS({ branch, onBack }) {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState('');
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('Dine-in');
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [cashTendered, setCashTendered] = useState('');
  const [gcashRef, setGcashRef] = useState('');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const printRef = useRef(null);

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

  const categories = useMemo(() => ['All', ...new Set(menuItems.map(item => item.category).filter(Boolean))], [menuItems]);
  const visibleItems = useMemo(() => menuItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = String(item.name || '').toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchesCategory && matchesSearch;
  }), [menuItems, activeCategory, searchQuery]);
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);
  const vatableSales = subtotal / 1.12;
  const vatAmount = subtotal - vatableSales;
  const changeDue = Math.max(0, Number(cashTendered || 0) - subtotal);

  const addToCart = item => {
    if (Number(item.is_sold_out) === 1 || item.is_sold_out === true) return;
    const normalizedItem = { id: item.id, name: item.name, price: Number(item.price), image: item.image_url };
    setCart(previous => {
      const found = previous.some(cartItem => String(cartItem.id) === String(item.id));
      return found
        ? previous.map(cartItem => String(cartItem.id) === String(item.id) ? { ...cartItem, qty: cartItem.qty + 1 } : cartItem)
        : [...previous, { ...normalizedItem, qty: 1 }];
    });
  };

  const updateQuantity = (id, change) => {
    setCart(previous => previous
      .map(item => String(item.id) === String(id) ? { ...item, qty: item.qty + change } : item)
      .filter(item => item.qty > 0));
  };

  const openPayment = () => {
    if (!cart.length) return;
    setError('');
    setCashTendered(subtotal.toFixed(2));
    setIsPaymentOpen(true);
  };

  const completeSale = async event => {
    event.preventDefault();
    if (isSubmitting || cart.length === 0) return;
    if (paymentMethod === 'Cash' && Number(cashTendered) < subtotal) {
      setError('Cash tendered must cover the total amount.');
      return;
    }
    if (paymentMethod === 'GCash' && !gcashRef.trim()) {
      setError('Enter the GCash reference number after verifying payment.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    const token = localStorage.getItem('token');
    const tendered = paymentMethod === 'Cash' ? Number(cashTendered) : subtotal;
    const referenceNote = paymentMethod === 'GCash' ? `GCash reference: ${gcashRef.trim()}` : '';
    const notes = [orderNotes.trim(), referenceNote].filter(Boolean).join(' | ');

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
          address: `Kiosk Customer: ${customerName.trim() || 'Walk-in Customer'}`,
          phone: null,
          paymentMethod,
          notes,
          receipt_url: null
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
        branch,
        customerName: customerName.trim() || 'Walk-in Customer',
        orderType,
        items: cart.map(item => ({ ...item })),
        subtotal,
        paymentMethod,
        cashTendered: tendered,
        change: paymentMethod === 'Cash' ? tendered - subtotal : 0,
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

  const printReceipt = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank', 'width=420,height=680');
    if (!printWindow) {
      setError('Allow pop-ups to print the receipt.');
      return;
    }
    printWindow.document.write(`<!doctype html><html><head><title>3K Kitchen Receipt</title><style>
      body{font:12px/1.45 monospace;color:#111;padding:18px;max-width:360px;margin:auto}.center{text-align:center}.row{display:flex;justify-content:space-between;gap:12px;margin:5px 0}.rule{border-top:1px dashed #222;margin:10px 0}.bold{font-weight:bold}
      </style></head><body>${printRef.current.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const formatMoney = money;

  return (
    <div className="fixed inset-0 z-[60] flex min-h-0 flex-col bg-[#F5EFE3] font-sans text-gray-800">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#C9A77C]/30 bg-white px-4 py-3 shadow-sm sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#E6D4B8] to-[#C9A77C] font-black text-[#815633] shadow-sm">3K</div>
          <div>
            <h1 className="text-base font-black tracking-tight text-gray-900 sm:text-lg">3K Kitchen POS</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{branch || 'Cashier register'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-700 sm:inline-flex">Counter sale</span>
          <button type="button" onClick={onBack} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50">Back to orders</button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_420px] lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden">
        <section className="flex min-h-[55vh] min-w-0 flex-col p-4 sm:p-6 lg:min-h-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search menu</span>
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
              <input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search dishes..." className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-[#815633] focus:ring-2 focus:ring-[#815633]/15" />
            </label>
            <div className="flex items-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-600"><span className="mr-2 text-[#815633]">⌖</span>{branch || 'Select branch'}</div>
          </div>

          <div className="mb-4 flex shrink-0 gap-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <button key={category} type="button" onClick={() => setActiveCategory(category)} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${activeCategory === category ? 'border-[#815633] bg-[#815633] text-white shadow-sm' : 'border-[#C9A77C]/40 bg-white text-gray-700 hover:border-[#815633]'}`}>
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
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {visibleItems.map(item => {
                  const soldOut = Number(item.is_sold_out) === 1 || item.is_sold_out === true;
                  return (
                    <button key={item.id} type="button" disabled={soldOut} onClick={() => addToCart(item)} className={`group overflow-hidden rounded-2xl border bg-white p-2.5 text-left shadow-sm transition ${soldOut ? 'cursor-not-allowed opacity-55 grayscale' : 'border-gray-200 hover:-translate-y-0.5 hover:border-[#C9A77C] hover:shadow-md active:scale-[0.99]'}`}>
                      <div className="relative mb-2 h-28 overflow-hidden rounded-xl bg-[#F5EFE3] sm:h-32">
                        {item.image_url && <img src={item.image_url} alt={item.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />}
                        {item.category && <span className="absolute left-2 top-2 max-w-[90%] truncate rounded-full border border-white/70 bg-white/90 px-2 py-1 text-[9px] font-black text-gray-700 shadow-sm">{item.category}</span>}
                        {soldOut && <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-black tracking-widest text-white">SOLD OUT</span>}
                      </div>
                      <span className="line-clamp-2 block min-h-10 text-xs font-bold leading-snug text-gray-900">{item.name}</span>
                      <span className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
                        <span className="text-sm font-black text-[#815633]">{formatMoney(item.price)}</span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#815633] text-lg font-bold text-white">+</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="flex min-h-[480px] min-w-0 flex-col border-t border-gray-200 bg-white shadow-xl lg:min-h-0 lg:border-l lg:border-t-0">
          <div className="space-y-3 border-b border-gray-100 bg-gray-50/70 p-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-600"><span className="text-lg text-[#815633]">▣</span> Current order summary</h2>
              <button type="button" onClick={() => setCart([])} disabled={!cart.length} className="text-xs font-bold text-red-500 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40">Clear all</button>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
              {['Dine-in', 'Take-out'].map(type => <button key={type} type="button" onClick={() => setOrderType(type)} className={`rounded-lg py-2 text-sm font-bold transition ${orderType === type ? 'bg-[#815633] text-white shadow-sm' : 'text-gray-600 hover:bg-white'}`}>{type}</button>)}
            </div>
            <label className="block">
              <span className="sr-only">Customer name or table number</span>
              <input value={customerName} onChange={event => setCustomerName(event.target.value)} placeholder="Customer name / Table #" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-[#815633]" />
            </label>
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

          <div className="border-t border-gray-100 px-4 py-3">
            <label className="block">
              <span className="sr-only">Kitchen notes</span>
              <input value={orderNotes} onChange={event => setOrderNotes(event.target.value)} placeholder="Kitchen notes (optional)" className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-medium outline-none focus:border-[#815633]" />
            </label>
          </div>

          <div className="space-y-2 border-t border-gray-200 bg-gray-50 p-4">
            <div className="flex justify-between text-xs font-bold text-gray-600"><span>Vatable sales</span><span>{formatMoney(vatableSales)}</span></div>
            <div className="flex justify-between text-xs font-bold text-gray-600"><span>VAT (12%)</span><span>{formatMoney(vatAmount)}</span></div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-black text-gray-900"><span>Grand total</span><span className="text-xl text-[#815633]">{formatMoney(subtotal)}</span></div>
            <button type="button" onClick={openPayment} disabled={!cart.length || isSubmitting} className="mt-2 w-full rounded-xl bg-[#815633] py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-md transition hover:bg-[#62432B] disabled:cursor-not-allowed disabled:bg-gray-300">
              Process payment
            </button>
          </div>
        </aside>
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
                    <p className="text-sm font-black text-blue-900">GCash merchant</p>
                    <p className="mt-1 text-sm font-bold text-blue-800">Ruchell Quesada</p>
                    <p className="text-xs font-semibold text-blue-700">0997 131 2386</p>
                    <p className="mt-2 text-sm font-black text-blue-900">Collect {formatMoney(subtotal)}</p>
                  </div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">GCash reference number
                    <input type="text" required value={gcashRef} onChange={event => setGcashRef(event.target.value)} placeholder="Enter reference after verifying payment" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#815633]" />
                    <span className="mt-2 block text-xs font-medium normal-case tracking-normal text-gray-500">Verify that the payment was received before completing this sale.</span>
                  </label>
                </div>
              )}
              {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
              <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-green-600 py-3.5 text-sm font-black text-white shadow-sm hover:bg-green-700 disabled:cursor-wait disabled:opacity-60">{isSubmitting ? 'Saving sale...' : 'Confirm sale & print receipt'}</button>
            </form>
          </div>
        </div>
      )}

      {receipt && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-4">
              <h2 className="font-black text-gray-900">Sale saved · O-{String(receipt.id).padStart(4, '0')}</h2>
              <button type="button" aria-label="Close receipt" onClick={() => setReceipt(null)} className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-gray-400 hover:bg-gray-200">×</button>
            </div>
            <div ref={printRef} className="overflow-y-auto p-5 font-mono text-xs text-gray-900">
              <div className="center text-center"><p className="text-base font-black">3K KITCHEN</p><p>{receipt.branch}</p><p>SALES RECEIPT</p></div>
              <div className="rule my-3 border-t border-dashed border-gray-600" />
              <p>Order #: O-{String(receipt.id).padStart(4, '0')}</p><p>Date: {receipt.createdAt}</p><p>Type: {receipt.orderType}</p><p>Customer: {receipt.customerName}</p>
              <div className="rule my-3 border-t border-dashed border-gray-600" />
              {receipt.items.map(item => <div key={item.id} className="row my-1 flex justify-between gap-2"><span>{item.qty}x {item.name}</span><span>{formatMoney(item.price * item.qty)}</span></div>)}
              <div className="rule my-3 border-t border-dashed border-gray-600" />
              <div className="row bold flex justify-between text-sm font-black"><span>TOTAL</span><span>{formatMoney(receipt.subtotal)}</span></div>
              <div className="rule my-3 border-t border-dashed border-gray-600" />
              <p>Payment: {receipt.paymentMethod}</p>
              {receipt.paymentMethod === 'Cash' && <><p>Cash tendered: {formatMoney(receipt.cashTendered)}</p><p>Change: {formatMoney(receipt.change)}</p></>}
              {receipt.notes && <p className="mt-2 break-words">Notes: {receipt.notes}</p>}
              <p className="mt-5 text-center font-bold">Thank you for dining with us!</p>
            </div>
            <div className="flex gap-3 border-t border-gray-100 p-4">
              <button type="button" onClick={printReceipt} className="flex-1 rounded-xl bg-[#815633] py-3 font-bold text-white hover:bg-[#62432B]">Print receipt</button>
              <button type="button" onClick={() => setReceipt(null)} className="flex-1 rounded-xl border border-gray-200 py-3 font-bold text-gray-700 hover:bg-gray-50">New sale</button>
            </div>
            {receipt.status !== 'Confirmed' && <p className="px-4 pb-3 text-center text-xs font-medium text-amber-700">Sale saved and paid; confirm the order from the queue before sending it to the kitchen.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
