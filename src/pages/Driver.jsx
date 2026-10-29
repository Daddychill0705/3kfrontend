import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

export default function Driver() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('Available');
  const [chatOrder, setChatOrder] = useState(null);
  const [deliveryModalOrder, setDeliveryModalOrder] = useState(null);
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [socket, setSocket] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!user || (user.role !== 'rider' && user.role !== 'admin')) {
      navigate('/login');
      return;
    }
    const newSocket = io(API_URL);
    setSocket(newSocket);
    
    const fetchOrders = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`${API_URL}/api/admin/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) setOrders(await response.json());
      } catch (error) { console.error('Failed to fetch orders', error); }
    };
    
    fetchOrders();
    newSocket.on('dashboard_refresh', fetchOrders);
    
    newSocket.on('receive_message', (data) => {
      setChatLog(prev => [...prev, data]);
    });
    return () => newSocket.close();
  }, [user, navigate, API_URL]);

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
      }
    } catch (error) { console.error('Error updating status', error); }
  };

  const openChat = async (orderId) => {
    setChatOrder(orderId);
    setChatLog([]);
    if (socket) socket.emit('join_order', orderId);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/orders/${orderId}/chat`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setChatLog(await res.json());
    } catch (err) { console.error(err); }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && socket && chatOrder) {
      const msgData = {
         orderId: chatOrder,
         sender: user.name,
         text: message,
         time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      socket.emit('send_message', msgData);
      setMessage('');
    }
  };

  const availableDeliveries = orders.filter(o => o.status === 'Ready' && o.order_type === 'Delivery');
  const activeDeliveries = orders.filter(o => o.status === 'Out for Delivery' && o.order_type === 'Delivery');
  const historyDeliveries = orders.filter(o => o.status === 'Completed' && o.order_type === 'Delivery');

  const displayList = activeTab === 'Available' ? availableDeliveries : activeTab === 'My deliveries' ? activeDeliveries : historyDeliveries;

  return (
    <div className="bg-[#fffaf7] min-h-screen pb-16 font-sans">
      <div className="bg-white border-b border-gray-200 flex items-center justify-between p-4 sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-black text-gray-900">Driver</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">3K Kitchen</p>
        </div>
        <div className="flex items-center gap-4">
          {user?.role === 'admin' && (
             <Link to="/admin" className="text-sm font-bold text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg mr-2 bg-gray-50">← Back to Admin</Link>
          )}
          <span className="text-sm font-bold text-gray-600 hidden sm:block">{user.email}</span>
          <button onClick={() => { logout(); navigate('/login'); }} className="text-sm font-bold text-red-500 hover:underline cursor-pointer">Sign out</button>
        </div>
      </div>

      <div className="flex justify-center gap-2 py-6">
        <button onClick={() => setActiveTab('Available')} className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'Available' ? 'bg-white shadow-sm border border-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}>Available ({availableDeliveries.length})</button>
        <button onClick={() => setActiveTab('My deliveries')} className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'My deliveries' ? 'bg-white shadow-sm border border-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}>My deliveries</button>
        <button onClick={() => setActiveTab('History')} className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'History' ? 'bg-white shadow-sm border border-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}>History</button>
      </div>

      <div className="max-w-[800px] mx-auto px-4 space-y-6">
        {displayList.length === 0 ? (
          <div className="bg-[#fffaf7] p-16 text-center mt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No active deliveries</h3>
            <p className="text-gray-500 text-sm font-medium">Claim an order from the Available tab.</p>
          </div>
        ) : (
          displayList.map(order => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 mb-1">O-{String(order.id).padStart(4, '0')}</h3>
                  <p className="text-sm font-bold text-gray-600">{order.customerName}</p>
                  <p className="text-xs font-bold text-gray-400 mt-1">{order.date.split(',')[0]}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-gray-900 block mb-2">₱{parseFloat(order.total_amount).toFixed(2)}</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${order.payment_method === 'GCash' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                    {order.payment_method === 'GCash' ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex gap-3 text-sm font-bold text-gray-700">
                  <span className="text-red-500">📍</span>
                  <div>
                    <p>{order.delivery_address}</p>
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.delivery_address)}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">Open in Maps ↗</a>
                  </div>
                </div>
                <div className="flex gap-3 text-sm font-bold text-gray-700">
                  <span className="text-red-500">📞</span>
                  <p>{order.contact_number}</p>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs font-bold text-gray-500 mb-2">Order Items:</p>
                  <p className="text-sm font-bold text-gray-800">{order.items}</p>
                </div>
              </div>

              <div className="flex gap-3">
                {order.status === 'Ready' && (
                  <button onClick={() => { updateStatus(order.id, 'Out for Delivery'); setActiveTab('My deliveries'); }} className="w-full bg-[#E39A7B] text-white py-3.5 rounded-xl font-bold shadow-sm hover:bg-[#DBB06B] transition-colors">Claim this delivery</button>
                )}
                {order.status === 'Out for Delivery' && (
                  <>
                    <button onClick={() => openChat(order.id)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-3.5 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-colors">💬 Chat</button>
                    <button onClick={() => updateStatus(order.id, 'Ready')} className="flex-1 bg-white border border-gray-300 text-gray-700 py-3.5 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-colors">Release</button>
                    <button onClick={() => setDeliveryModalOrder(order)} className="flex-[2] bg-[#E39A7B] text-white py-3.5 rounded-xl font-bold shadow-sm hover:bg-[#DBB06B] transition-colors">Mark delivered</button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {deliveryModalOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setDeliveryModalOrder(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-xl">✕</button>
            <h3 className="text-xl font-black text-gray-900 mb-2">Deliver O-{String(deliveryModalOrder.id).padStart(4, '0')}</h3>
            <p className="text-gray-600 font-medium mb-6 text-sm">
              {deliveryModalOrder.payment_method === 'GCash' 
                 ? 'This order is already paid. Confirm that it was handed over.' 
                 : `This order is unpaid. Collect ₱${parseFloat(deliveryModalOrder.total_amount).toFixed(2)} from the customer before handing it over.`}
            </p>
            <button 
               onClick={() => {
                updateStatus(deliveryModalOrder.id, 'Completed');
                setDeliveryModalOrder(null);
              }} 
               className="w-full bg-[#E39A7B] text-white py-3.5 rounded-xl font-bold shadow-sm hover:bg-[#DBB06B]"
            >
              Confirm delivered
            </button>
          </div>
        </div>
      )}

      {chatOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col h-[500px] overflow-hidden relative">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-gray-900 text-lg">Chat - O-{String(chatOrder).padStart(4, '0')}</h3>
              <button onClick={() => setChatOrder(null)} className="text-gray-400 hover:text-gray-900 font-bold text-xl">✕</button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#fffaf7]">
              {chatLog.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.sender === user.name ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm font-bold shadow-sm ${msg.sender === user.name ? 'bg-[#E39A7B] text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 mt-1">{msg.sender} • {msg.time}</span>
                </div>
              ))}
              {chatLog.length === 0 && <p className="text-center text-gray-400 text-sm font-bold mt-10">Message the customer about the delivery.</p>}
            </div>
            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
              <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message..." className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#E39A7B] text-sm font-medium" />
              <button type="submit" className="bg-[#E39A7B] text-white px-5 rounded-xl font-bold shadow-sm hover:bg-[#DBB06B]">Send</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}