import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

export default function Cashier() {
  const [activeBranch, setActiveBranch] = useState('');
  const [branches, setBranches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('Active');
  const [socket, setSocket] = useState(null);

  // Chat States
  const [chatLogs, setChatLogs] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentChatOrderId, setCurrentChatOrderId] = useState(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
          if (user.role === 'cashier') {
            setActiveBranch(user.branch || (activeBranches.length > 0 ? activeBranches[0].name : ''));
          } else if (activeBranches.length > 0) {
            setActiveBranch(activeBranches[0].name);
          }
        }
      } catch (error) {
        console.error('Failed to load branches', error);
      }
    };
    fetchInitialData();
  }, [user, navigate, API_URL]);

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
          setOrders(allOrders.filter(o => o.branch === activeBranch));
        }
      } catch (error) { console.error('Failed to fetch orders', error); }
    };
    
    fetchOrders();
    newSocket.on('dashboard_refresh', fetchOrders);
    
    newSocket.on('receive_message', (data) => {
      // ONLY append the message if the chat modal is open FOR THIS SPECIFIC ORDER
      setCurrentChatOrderId(currentId => {
          if (currentId === data.orderId) {
              setChatLogs(prev => [...prev, data]);
          }
          return currentId;
      });
    });
    
    return () => newSocket.close();
  }, [activeBranch, API_URL]);

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
        setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
        setSelectedOrder(prev => prev && prev.id === id ? { ...prev, status } : prev);
      }
    } catch (error) { console.error('Error updating status', error); }
  };

  const openChat = async () => {
    if (!selectedOrder) return alert("Select an order first.");
    setIsChatOpen(true);
    setCurrentChatOrderId(selectedOrder.id);
    setChatLogs([]); // Clear previous chat context
    if (socket) socket.emit('join_order', selectedOrder.id);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/orders/${selectedOrder.id}/chat`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setChatLogs(await res.json());
    } catch (err) { console.error(err); }
  };

  const sendChatMessage = (e) => {
    e.preventDefault();
    if (chatMessage.trim() && socket && selectedOrder) {
      const msgData = {
         orderId: selectedOrder.id, sender: `Cashier (${activeBranch})`,
         text: chatMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
       };
      socket.emit('send_message', msgData);
      setChatMessage('');
    }
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'Active') return !['Completed', 'Cancelled'].includes(o.status);
    if (activeTab === 'Done') return o.status === 'Completed';
    if (activeTab === 'Cancelled') return o.status === 'Cancelled';
    return true;
  });

  return (
    <div className="flex h-screen bg-[#fffaf7] font-sans">
      <div className="w-[380px] bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10 shrink-0">
         <div className="p-5 border-b border-gray-100 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <span className="text-2xl opacity-80">🍔</span>
             <div>
               <h1 className="text-lg font-black text-gray-900 leading-tight">Cashier</h1>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">3K Kitchen - {activeBranch || 'Loading...'}</p>
             </div>
           </div>
         </div>
         <div className="p-4 flex gap-3 border-b border-gray-100 overflow-x-auto hide-scrollbar bg-gray-50/50">
           {['Active', 'Done', 'Cancelled', 'All'].map(tab => (
             <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-800'}`}>
               {tab}
             </button>
           ))}
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-3">
           {filteredOrders.length === 0 ? (
             <div className="text-center py-10 text-gray-400 font-bold text-sm">Nothing here<br/><span className="text-xs font-medium">New orders appear instantly.</span></div>
           ) : (
             filteredOrders.map(order => (
               <div key={order.id} onClick={() => setSelectedOrder(order)} className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 ${selectedOrder?.id === order.id ? 'bg-[#FFD3AC]/10 border-[#E39A7B] shadow-sm' : 'bg-white border-gray-200 hover:border-[#FFB5AB]'}`}>
                 <div className="flex justify-between items-start">
                   <h3 className="font-black text-gray-900 text-lg">O-{String(order.id).padStart(4, '0')}</h3>
                   <span className="font-black text-gray-900">₱{parseFloat(order.total_amount).toFixed(2)}</span>
                 </div>
                 <p className="text-xs text-gray-600 font-bold truncate">{order.customerName}</p>
                 <div className="flex gap-2 mt-1">
                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>{order.status}</span>
                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${order.payment_method === 'GCash' && order.status !== 'Pending' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                     {order.payment_method === 'GCash' && order.status !== 'Pending' ? 'Paid' : 'Unpaid'}
                   </span>
                 </div>
               </div>
             ))
           )}
         </div>
      </div>
      <div className="flex-1 bg-[#fffaf7] flex flex-col">
        <header className="flex justify-end items-center p-4 border-b border-gray-200 bg-white shadow-sm shrink-0 gap-4">
          
          <div className="flex items-center gap-3 mr-auto">
             {user?.role === 'admin' && (
               <Link to="/admin" className="text-sm font-bold text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg bg-gray-50">← Back to Admin</Link>
             )}
             
             <select value={activeBranch} onChange={(e) => setActiveBranch(e.target.value)} className="text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none cursor-pointer">
               <option value="">Select branch...</option>
               {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
             </select>
          </div>

          <Link to="/kiosk" className="text-sm font-black text-[#E39A7B] hover:text-[#DBB06B] border border-[#E39A7B] px-3 py-1.5 rounded-lg bg-[#FFD3AC]/10">🍔 Kiosk UI</Link>
          <button onClick={openChat} className="text-sm font-bold text-gray-600 hover:text-gray-900">💬 Messages</button>
          <div className="h-4 w-px bg-gray-300"></div>
          <button onClick={() => { logout(); navigate('/login'); }} className="text-sm font-bold text-red-500 hover:underline flex items-center gap-1 cursor-pointer">🚪 Sign out</button>
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
                   <p className="text-base font-bold text-gray-800">{selectedOrder.customerName}</p>
                   <p className="text-xs font-bold text-gray-500 mt-1">{selectedOrder.order_type} • {selectedOrder.payment_method}</p>
                 </div>
                 <div className="text-right flex flex-col items-end gap-2">
                   <span className="inline-block bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border border-blue-200">{selectedOrder.status}</span>
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
                 {selectedOrder.status === 'Pending' && selectedOrder.payment_method !== 'GCash' && (
                   <button onClick={() => updateStatus(selectedOrder.id, 'Confirmed')} className="bg-[#E39A7B] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-[#DBB06B]">Confirm</button>
                 )}
                 {selectedOrder.status === 'Confirmed' && (
                   <button onClick={() => updateStatus(selectedOrder.id, 'Preparing')} className="bg-[#E39A7B] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-[#DBB06B]">Send to kitchen</button>
                 )}
                 {selectedOrder.status === 'Preparing' && (
                   <button onClick={() => updateStatus(selectedOrder.id, 'Ready')} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-green-700">Mark as Ready</button>
                 )}
                 {selectedOrder.status === 'Ready' && selectedOrder.order_type === 'Pick-up' && (
                   <button onClick={() => updateStatus(selectedOrder.id, 'Completed')} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-green-700">Complete Order</button>
                 )}
                 <button onClick={() => updateStatus(selectedOrder.id, 'Cancelled')} className="bg-white border border-red-200 text-red-500 px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors ml-auto">Void</button>
               </div>
            </div>
          )}
        </div>
      </div>

      {isChatOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col h-[500px] overflow-hidden relative">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-gray-900 text-lg">Dispatch Chat - O-{String(selectedOrder.id).padStart(4, '0')}</h3>
              <button onClick={() => { setIsChatOpen(false); setCurrentChatOrderId(null); }} className="text-gray-400 hover:text-gray-900 font-bold text-xl">✕</button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#fffaf7]">
              {chatLogs.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.sender.includes('Cashier') ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm font-bold shadow-sm ${msg.sender.includes('Cashier') ? 'bg-gray-800 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 mt-1">{msg.sender} • {msg.time}</span>
                </div>
              ))}
              {chatLogs.length === 0 && <p className="text-center text-gray-400 text-sm font-bold mt-10">No messages yet.</p>}
            </div>
            <form onSubmit={sendChatMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
              <input type="text" value={chatMessage} onChange={e => setChatMessage(e.target.value)} placeholder="Type a message..." className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-800 text-sm font-medium" />
              <button type="submit" className="bg-gray-800 text-white px-5 rounded-xl font-bold shadow-sm hover:bg-black">Send</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}