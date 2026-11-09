import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { isOrderChatOpen, useOrderChatClock } from '../hooks/useOrderChatExpiry';

export default function Cashier() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Automatically initialize activeBranch from storage or user profile
  const [activeBranch, setActiveBranch] = useState(() => {
    return localStorage.getItem('cashier_active_branch') || user?.branch || '';
  });
  
  const [branches, setBranches] = useState([]);
  const [orders, setOrders] = useState([]);
  const chatNow = useOrderChatClock(orders);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [completingOrderIds, setCompletingOrderIds] = useState(() => new Set());
  const [isCompleteConfirmOpen, setIsCompleteConfirmOpen] = useState(false);
  const [isCompletingOrder, setIsCompletingOrder] = useState(false);
  
  // Filter States
  const [activeTab, setActiveTab] = useState('Active');
  const [orderTypeFilter, setOrderTypeFilter] = useState('All'); // 'All', 'Dine-in', 'Take-out', 'Online'

  const [socket, setSocket] = useState(null);
  const [chatLogs, setChatLogs] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const currentChatOrderIdRef = useRef(null);
  const [unreadChatOrders, setUnreadChatOrders] = useState({});

  // Payment States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [cashTendered, setCashTendered] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // 1. Fetch available branches
  useEffect(() => {
    if (!user || (user.role !== 'cashier' && user.role !== 'admin')) {
      navigate('/login');
      return;
    }
    const fetchInitialData = async () => {
      try {
        const branchRes = await fetch(`${API_URL}/api/branches`);
        if (branchRes.ok) {
          const data = await branchRes.json();
          const activeBranches = data.filter(b => b.is_active);
          setBranches(activeBranches);
          
          let target = localStorage.getItem('cashier_active_branch');
          if (user.role === 'cashier' && user.branch) {
            target = user.branch; // Lock Cashiers strictly to their assigned branch
          } else if (!target && activeBranches.length > 0) {
            target = activeBranches[0].name; // Default fallback for Admins
          }
          
          if (target) {
            setActiveBranch(target);
            localStorage.setItem('cashier_active_branch', target);
          }
        }
      } catch (error) {
        console.error('Failed to load branches', error);
      }
    };
    fetchInitialData();
  }, [user, navigate, API_URL]);

  // 2. Fetch orders as soon as the active branch is known
  useEffect(() => {
    if (!activeBranch) return;
    
    const newSocket = io(API_URL);
    setSocket(newSocket);
    
    const fetchOrders = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`${API_URL}/api/admin/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const allOrders = await response.json();
          // FILTER: Only show orders matching this cashier's branch
          const filtered = allOrders.filter(o => o.branch === activeBranch);
          setOrders(filtered);
          filtered.forEach(order => {
            if (['Delivery', 'Pick-up'].includes(order.order_type) && isOrderChatOpen(order)) {
              newSocket.emit('join_order', order.id);
            }
          });
          
          // Keep selected order synced if it updates in the background
          setSelectedOrder(prev => {
              if (!prev) return null;
              return filtered.find(o => o.id === prev.id) || prev;
          });
        }
      } catch (error) { console.error('Failed to fetch orders', error); }
    };
    
    fetchOrders();
    newSocket.on('dashboard_refresh', fetchOrders);

    newSocket.on('receive_message', (data) => {
      if (String(currentChatOrderIdRef.current) === String(data.orderId)) {
        setChatLogs(prev => [...prev, data]);
      } else if (!data.sender.startsWith('Cashier')) {
        setUnreadChatOrders(prev => ({ ...prev, [data.orderId]: true }));
      }
    });

    newSocket.on('chat_closed', ({ orderId }) => {
      if (String(currentChatOrderIdRef.current) === String(orderId)) {
        setIsChatOpen(false);
        currentChatOrderIdRef.current = null;
      }
    });
    
    return () => newSocket.close();
  }, [activeBranch, API_URL]);

  useEffect(() => {
    if (isChatOpen && selectedOrder && !isOrderChatOpen(selectedOrder, chatNow)) {
      setIsChatOpen(false);
      currentChatOrderIdRef.current = null;
    }
  }, [isChatOpen, selectedOrder, chatNow]);

  const updateStatus = async (id, status) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        if (socket) socket.emit('status_change', { orderId: id, status });
        setOrders(prevOrders => prevOrders.map(o => o.id === id ? { ...o, status } : o));
        setSelectedOrder(prev => prev && prev.id === id ? { ...prev, status } : prev);
        return true;
      }
    } catch (error) { console.error('Error updating status', error); }
    return false;
  };

  const confirmCompleteOrder = async () => {
    if (!selectedOrder || isCompletingOrder) return;
    const orderId = selectedOrder.id;
    setIsCompletingOrder(true);
    setIsCompleteConfirmOpen(false);
    setCompletingOrderIds(prev => new Set(prev).add(orderId));

    const completed = await updateStatus(orderId, 'Completed');
    setIsCompletingOrder(false);
    if (!completed) {
      setCompletingOrderIds(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      alert('Could not complete this order. Please try again.');
      return;
    }

    setTimeout(() => {
      setCompletingOrderIds(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      setActiveTab('Done');
    }, 550);
  };
  
  const updatePaymentStatus = async (id, paymentMethod) => {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/api/admin/orders/${id}/payment`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ paymentMethod })
        });
        if (res.ok) {
          setOrders(prevOrders => prevOrders.map(o => o.id === id ? { ...o, payment_method: paymentMethod } : o));
          setSelectedOrder(prev => prev && prev.id === id ? { ...prev, payment_method: paymentMethod } : prev);
        }
    } catch (error) { console.error('Error updating payment', error); }
  };

  const handlePaymentSubmit = async (e) => {
      e.preventDefault();
      if (!selectedOrder || isSubmittingPayment) return;
      
      const total = parseFloat(selectedOrder.total_amount);
      const tendered = parseFloat(cashTendered);
      
      if (tendered < total) {
          alert('Cash tendered must be equal to or greater than the total amount.');
          return;
      }
      
      const newPaymentMethod = 'Cash';
      const newStatus = selectedOrder.status === 'Pending' ? 'Confirmed' : selectedOrder.status;
      const updatedOrder = { ...selectedOrder, payment_method: newPaymentMethod, status: newStatus };
      const token = localStorage.getItem('token');

      setIsSubmittingPayment(true);
      try {
        const paymentResponse = await fetch(`${API_URL}/api/admin/orders/${selectedOrder.id}/payment`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ paymentMethod: newPaymentMethod })
        });

        if (!paymentResponse.ok) {
          throw new Error('Payment could not be saved. Please try again.');
        }

        if (selectedOrder.status === 'Pending') {
          const statusResponse = await fetch(`${API_URL}/api/admin/orders/${selectedOrder.id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: newStatus })
          });

          if (!statusResponse.ok) {
            throw new Error('Payment was saved, but the order status could not be updated.');
          }
        }

        setOrders(prevOrders => prevOrders.map(o => o.id === selectedOrder.id ? updatedOrder : o));
        setSelectedOrder(updatedOrder);
        setIsPaymentModalOpen(false);
        setCashTendered('');

        // Notify the customer tracking screen after the payment has been saved.
        if (socket) socket.emit('status_change', { orderId: selectedOrder.id, status: newStatus });
      } catch (error) {
        console.error('Error confirming payment', error);
        alert(error.message || 'Payment could not be saved. Please try again.');
      } finally {
        setIsSubmittingPayment(false);
      }
  };

  const openRiderChat = async () => {
    if (!selectedOrder) return;

    setIsChatOpen(true);
    currentChatOrderIdRef.current = selectedOrder.id;
    setUnreadChatOrders(prev => ({ ...prev, [selectedOrder.id]: false }));
    setChatLogs([]);
    if (socket) socket.emit('join_order', selectedOrder.id);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/orders/${selectedOrder.id}/chat`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setChatLogs(await response.json());
    } catch (error) {
      console.error('Failed to load order chat', error);
    }
  };

  const sendChatMessage = (event) => {
    event.preventDefault();
    if (!chatMessage.trim() || !socket || !selectedOrder) return;

    socket.emit('send_message', {
      orderId: selectedOrder.id,
      sender: `Cashier (${activeBranch})`,
      text: chatMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    setChatMessage('');
  };

  // Dual Filtering: Status & Order Type
  const filteredOrders = orders.filter(o => {
    // 1. Status Filter
    let statusMatch = true;
    if (activeTab === 'Active') statusMatch = !['Completed', 'Cancelled'].includes(o.status) || completingOrderIds.has(o.id);
    if (activeTab === 'Done') statusMatch = o.status === 'Completed' && !completingOrderIds.has(o.id);
    if (activeTab === 'Cancelled') statusMatch = o.status === 'Cancelled';

    // 2. Order Type Filter
    let typeMatch = true;
    if (orderTypeFilter === 'Dine-in') typeMatch = o.order_type === 'Dine-in';
    if (orderTypeFilter === 'Take-out') typeMatch = o.order_type === 'Take-out';
    if (orderTypeFilter === 'Online') typeMatch = ['Delivery', 'Pick-up'].includes(o.order_type);

    return statusMatch && typeMatch;
  });

  // VAT Calculation Helpers
  // Extract customer name specifically for Kiosk Orders
  const getCustomerName = (order) => {
      const isKiosk = ['Dine-in', 'Take-out'].includes(order.order_type);
      return (isKiosk && order.delivery_address?.startsWith('Kiosk Customer: ')) 
          ? order.delivery_address.replace('Kiosk Customer: ', '') 
          : order.customerName;
  };

  // Main cashier dashboard
  return (
    <div className="flex h-screen bg-[#fffaf7] font-sans">
      <div className="w-[420px] bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10 shrink-0">
         
         <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
           <div className="flex items-center gap-3">
             <span className="text-2xl opacity-80">🍔</span>
             <div>
               <h1 className="text-lg font-black text-gray-900 leading-tight">Cashier</h1>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">3K Kitchen - {activeBranch || 'Loading...'}</p>
             </div>
           </div>
         </div>
         
         {/* STATUS TABS */}
         <div className="p-4 flex gap-3 border-b border-gray-100 overflow-x-auto hide-scrollbar">
           {['Active', 'Done', 'Cancelled', 'All'].map(tab => (
             <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-gray-800 text-white shadow-sm border border-gray-800' : 'text-gray-500 border border-gray-200 hover:text-gray-800 hover:bg-gray-50'}`}>
               {tab}
             </button>
           ))}
         </div>

         {/* EXPLICIT ORDER TYPE BUTTONS (Dine-in, Take-out, Online) */}
         <div className="p-3 flex gap-2 border-b border-gray-100 overflow-x-auto hide-scrollbar bg-white">
            {['All', 'Dine-in', 'Take-out', 'Online'].map(type => (
              <button 
                key={type} 
                onClick={() => setOrderTypeFilter(type)} 
                className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${orderTypeFilter === type ? 'bg-[#E39A7B] text-white border-[#E39A7B] shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
              >
                {type === 'All' ? 'All Types' : type}
              </button>
            ))}
         </div>
         
         <div className="flex-1 overflow-y-auto p-4 space-y-3">
           {filteredOrders.length === 0 ? (
             <div className="text-center py-10 text-gray-400 font-bold text-sm">Nothing here<br/><span className="text-xs font-medium">New orders appear instantly.</span></div>
           ) : (
             filteredOrders.map(order => {
               const displayName = getCustomerName(order);
               const isPaid = ['GCash', 'Cash'].includes(order.payment_method);
               
               return (
               <div key={order.id} onClick={() => setSelectedOrder(order)} className={`p-4 rounded-xl border cursor-pointer transition-all duration-500 ease-in-out flex flex-col gap-2 ${completingOrderIds.has(order.id) ? 'opacity-0 -translate-x-3 scale-95 max-h-0 py-0 my-0 overflow-hidden pointer-events-none' : 'opacity-100 max-h-48'} ${selectedOrder?.id === order.id ? 'bg-[#FFD3AC]/10 border-[#E39A7B] shadow-sm' : 'bg-white border-gray-200 hover:border-[#FFB5AB]'}`}>
                 <div className="flex justify-between items-start">
                   <h3 className="font-black text-gray-900 text-lg">
                     O-{String(order.id).padStart(4, '0')}
                   </h3>
                   <span className="font-black text-gray-900">₱{parseFloat(order.total_amount).toFixed(2)}</span>
                 </div>
                 
                 <p className="text-xs text-gray-600 font-bold truncate flex-1">{displayName}</p>

                 <div className="flex gap-2 mt-1">
                   {/* Order Type Badge */}
                   <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${['Dine-in', 'Take-out'].includes(order.order_type) ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                     {order.order_type}
                   </span>
                   {/* Status Badge */}
                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>{order.status}</span>
                   {/* Payment Badge - Correctly tied to isPaid variable */}
                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isPaid ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                     {isPaid ? 'Paid' : 'Unpaid'}
                   </span>
                 </div>
               </div>
             )})
           )}
         </div>
      </div>
      <div className="flex-1 bg-[#fffaf7] flex flex-col">
        <header className="flex justify-end items-center p-4 border-b border-gray-200 bg-white shadow-sm shrink-0 gap-4">
          
          <div className="flex items-center gap-3 mr-auto">
             {user?.role === 'admin' ? (
               <select 
                 value={activeBranch} 
                 onChange={(e) => {
                   setActiveBranch(e.target.value);
                   localStorage.setItem('cashier_active_branch', e.target.value);
                 }} 
                 className="text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none cursor-pointer"
               >
                 <option value="">Select branch...</option>
                 {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
               </select>
             ) : (
               <span className="text-sm font-bold text-gray-700 px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200">
                 📍 {activeBranch || 'Loading Branch...'}
               </span>
             )}
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="text-sm font-bold text-red-500 hover:text-red-700 hover:underline"
          >
            Log out
          </button>
        </header>

        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {!selectedOrder ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <h2 className="text-3xl font-black text-gray-900 mb-2">Select an order</h2>
              <p className="text-gray-500 font-medium text-sm">Pick one from the queue to work on it.</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
               <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                 <div>
                   <h2 className="text-4xl font-black text-gray-900 mb-2">O-{String(selectedOrder.id).padStart(4, '0')}</h2>
                   <p className="text-base font-bold text-gray-800">{getCustomerName(selectedOrder)}</p>
                   <p className="text-xs font-bold text-gray-500 mt-1">{selectedOrder.order_type}</p>
                 </div>
                 <div className="text-right flex flex-col items-end gap-2">
                   <div className="flex gap-2">
                     <span className="inline-block bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border border-blue-200">{selectedOrder.status}</span>
                     
                     {/* ADDED PAYMENT STATUS BADGE HERE FOR VISIBILITY */}
                     <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${['GCash', 'Cash'].includes(selectedOrder.payment_method) ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                       {['GCash', 'Cash'].includes(selectedOrder.payment_method) ? 'Paid' : 'Unpaid'}
                     </span>
                   </div>
                 </div>
               </div>
               <div className="p-6 md:p-8 space-y-8">
                 <div className="border-t border-gray-100 pt-6">
                   <div className="space-y-4">
                     {selectedOrder.itemsData?.map((item, idx) => (
                       <div key={idx} className="flex justify-between items-center text-sm">
                         <span className="font-bold text-gray-800"><span className="text-gray-400 mr-2">{item.qty}x</span> {item.name}</span>
                         <span className="font-bold text-gray-600">₱{parseFloat(item.price * item.qty).toFixed(2)}</span>
                       </div>
                     ))}
                   </div>
                 </div>
                 <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                   <span className="text-base font-black text-gray-900">Total</span>
                   <span className="text-2xl font-black text-[#E39A7B]">₱{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
                 </div>
               </div>
               <div className="p-6 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center gap-3">
                 
                 {/* Explicit Kiosk / Counter Payment Handling - Only show if Unpaid */}
                 {['GCash', 'Cash'].includes(selectedOrder.payment_method) ? (
                    <button disabled className="bg-gray-100 text-green-700 border border-green-300 px-8 py-3 rounded-xl font-bold text-sm shadow-sm cursor-not-allowed flex items-center gap-2">
                        Paid ✓
                    </button>
                 ) : (
                    (
                      ['Take-out', 'Dine-in', 'Pick-up'].includes(selectedOrder.order_type) ||
                      (selectedOrder.order_type === 'Delivery' && selectedOrder.payment_method === 'Cash on delivery')
                    ) && (
                        <button onClick={() => setIsPaymentModalOpen(true)} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-green-700">
                            {selectedOrder.order_type === 'Delivery' && selectedOrder.payment_method === 'Cash on delivery' ? 'Confirm Payment' : 'Take Payment'}
                        </button>
                    )
                 )}

                 {/* Standard Workflow Buttons */}
                 {selectedOrder.status === 'Pending' && (
                   ['GCash', 'Cash'].includes(selectedOrder.payment_method) ||
                   (selectedOrder.order_type === 'Delivery' && selectedOrder.payment_method === 'Cash on delivery')
                 ) && (
                   <button onClick={() => updateStatus(selectedOrder.id, 'Confirmed')} className="bg-[#E39A7B] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-[#DBB06B]">
                     {selectedOrder.order_type === 'Delivery' && selectedOrder.payment_method === 'Cash on delivery' ? 'Confirm Order' : 'Confirm'}
                   </button>
                 )}
                 {selectedOrder.status === 'Confirmed' && (
                   <button onClick={() => updateStatus(selectedOrder.id, 'Preparing')} className="bg-[#E39A7B] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-[#DBB06B]">Send to kitchen</button>
                 )}
                 {selectedOrder.status === 'Preparing' && (
                   <button onClick={() => updateStatus(selectedOrder.id, 'Ready')} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-green-700">Mark as Ready</button>
                 )}
                 {selectedOrder.status === 'Ready' && ['Pick-up', 'Take-out', 'Dine-in'].includes(selectedOrder.order_type) && (
                   <button onClick={() => setIsCompleteConfirmOpen(true)} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-black">Complete Order</button>
                 )}
                 {['Delivery', 'Pick-up'].includes(selectedOrder.order_type) && isOrderChatOpen(selectedOrder, chatNow) && (
                   <button onClick={openRiderChat} className="bg-white border border-blue-200 text-blue-700 px-6 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-blue-50 transition-colors inline-flex items-center gap-2">
                     Chat with Rider
                     {unreadChatOrders[selectedOrder.id] && <span className="w-2.5 h-2.5 rounded-full bg-red-600" aria-label="Unread messages" />}
                   </button>
                 )}

                 <button onClick={() => updateStatus(selectedOrder.id, 'Cancelled')} className="bg-white border border-red-200 text-red-500 px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors">Void</button>
               </div>
            </div>
          )}
        </div>
      </div>

      {isCompleteConfirmOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-black text-gray-900 mb-2">Complete this order?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to complete order O-{String(selectedOrder.id).padStart(4, '0')}? It will move to Done.
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setIsCompleteConfirmOpen(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50">
                Cancel
              </button>
              <button type="button" onClick={confirmCompleteOrder} disabled={isCompletingOrder} className="px-5 py-2.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-black disabled:opacity-60">
                {isCompletingOrder ? 'Completing...' : 'Yes, complete order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Calculator Modal */}
      {isPaymentModalOpen && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden relative">
              <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <h3 className="font-black text-gray-900 text-lg">
                    {selectedOrder.order_type === 'Delivery' && selectedOrder.payment_method === 'Cash on delivery' ? 'Confirm COD Payment' : 'Process Payment'}
                  </h3>
                  <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-900 font-bold text-xl">✕</button>
              </div>
              <form onSubmit={handlePaymentSubmit} className="p-6 space-y-6">
                  {selectedOrder.order_type === 'Delivery' && selectedOrder.payment_method === 'Cash on delivery' && (
                    <p className="text-sm text-gray-600">Confirm only after receiving the customer’s cash.</p>
                  )}
                  <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-600">Total Due</span>
                      <span className="text-2xl font-black text-[#E39A7B]">₱{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Cash Tendered</label>
                      <input 
                          type="number" 
                          required
                          min={selectedOrder.total_amount}
                          step="0.01"
                          value={cashTendered} 
                          onChange={(e) => setCashTendered(e.target.value)} 
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#E39A7B] text-xl font-black text-gray-900" 
                      />
                  </div>
                  {cashTendered && parseFloat(cashTendered) >= parseFloat(selectedOrder.total_amount) && (
                      <div className="p-4 bg-green-50 rounded-xl border border-green-200 flex justify-between items-center">
                          <span className="font-bold text-green-700 text-sm">Change</span>
                          <span className="text-xl font-black text-green-700">₱{(parseFloat(cashTendered) - parseFloat(selectedOrder.total_amount)).toFixed(2)}</span>
                      </div>
                  )}
                  <button type="submit" disabled={isSubmittingPayment} className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold shadow-sm hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed">
                    {isSubmittingPayment ? 'Saving Payment...' : selectedOrder.order_type === 'Delivery' && selectedOrder.payment_method === 'Cash on delivery' ? 'Confirm Payment' : 'Complete Payment'}
                  </button>
              </form>
            </div>
          </div>
      )}

      {isChatOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col h-[500px] overflow-hidden relative">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-gray-900 text-lg">Delivery Chat - O-{String(selectedOrder.id).padStart(4, '0')}</h3>
              <button onClick={() => { setIsChatOpen(false); currentChatOrderIdRef.current = null; }} className="text-gray-400 hover:text-gray-900 font-bold text-xl">×</button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#fffaf7]">
              {chatLogs.map((message, index) => (
                <div key={`${message.time}-${index}`} className={`flex flex-col ${message.sender.startsWith('Cashier') ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm font-bold shadow-sm ${message.sender.startsWith('Cashier') ? 'bg-gray-800 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                    {message.text}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 mt-1">{message.sender} • {message.time}</span>
                </div>
              ))}
              {chatLogs.length === 0 && <p className="text-center text-gray-400 text-sm font-bold mt-10">No messages yet. Start the delivery coordination here.</p>}
            </div>

            <form onSubmit={sendChatMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
              <input type="text" value={chatMessage} onChange={event => setChatMessage(event.target.value)} placeholder="Message the rider and customer..." className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium" />
              <button type="submit" disabled={!chatMessage.trim()} className="bg-gray-800 text-white px-5 rounded-xl font-bold shadow-sm hover:bg-black disabled:opacity-50">Send</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
