import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

export default function Order() {
  const tabs = ['All', 'Pending', 'Preparing', 'Out for Delivery', 'Completed'];
  const [activeTab, setActiveTab] = useState('All');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  
  // Chat States
  const [chatLogs, setChatLogs] = useState({});
  const [messages, setMessages] = useState({});

  const { user } = useAuth();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const newSocket = io(API_URL);
    setSocket(newSocket);
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setOrders(data);
          data.forEach(order => {
            if (['Preparing', 'Out for Delivery'].includes(order.status)) {
              newSocket.emit('join_order', order.id);
            }
          });
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
    newSocket.on('status_updated', (data) => {
      setOrders(prev => prev.map(o => o.id === data.orderId ? { ...o, status: data.status } : o));
    });
    newSocket.on('receive_message', (data) => {
      setChatLogs(prev => ({
        ...prev,
        [data.orderId]: [...(prev[data.orderId] || []), data]
      }));
    });
    return () => newSocket.close();
  }, [user, navigate, API_URL]);

  const sendMessage = (e, orderId) => {
    e.preventDefault();
    const text = messages[orderId];
    if (text && text.trim() && socket) {
      const msgData = { 
        orderId, 
        sender: user.name, 
        text, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };
      socket.emit('send_message', msgData);
      setMessages(prev => ({ ...prev, [orderId]: '' }));
    }
  };

  const filteredOrders = activeTab === 'All' 
    ? orders 
    : orders.filter(order => order.status === activeTab);

  if (loading) return <div className="text-center py-20 text-gray-500 font-bold">Loading your orders...</div>;

  return (
    <div className="bg-3k-bg min-h-screen pb-16 font-sans">
      <div className="bg-white sticky top-[72px] z-40 shadow-sm border-b border-[#FFB5AB]/50">
        <div className="max-w-[1000px] mx-auto flex overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[100px] py-4 text-sm md:text-base font-bold text-center whitespace-nowrap transition-all duration-300 border-b-2
                ${activeTab === tab ? 'text-[#E39A7B] border-[#E39A7B]' : 'text-gray-500 border-transparent hover:text-[#FFB5AB]'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      <div className="max-w-[800px] mx-auto pt-8 px-4 md:px-0">
        <div className="space-y-6">
          {filteredOrders.length > 0 ? (
            filteredOrders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-[#FFB5AB]/30 overflow-hidden">
                <div className="flex flex-col p-6 md:p-8 bg-[#fffaf7]">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-black text-gray-900">O-{String(order.id).padStart(4, '0')}</h3>
                      <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">{order.date} • {order.branch}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-wider border shadow-sm
                        ${order.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' : 
                          order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 
                          'bg-blue-100 text-blue-700 border-blue-200'}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Status Progress Bar */}
                  <div className="relative flex justify-between items-center mb-8 px-2">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-500 transition-all duration-1000 -z-10"
                      style={{
                        width: order.status === 'Pending' ? '0%' : 
                               order.status === 'Confirmed' ? '25%' : 
                               order.status === 'Preparing' ? '50%' : 
                               order.status === 'Out for Delivery' ? '75%' : '100%'
                      }}
                    ></div>
                    
                    {['Received', 'Confirmed', 'Preparing', 'Ready', 'On the way', 'Done'].map((step, idx) => {
                      const isActive = 
                        (order.status === 'Pending' && idx === 0) ||
                        (order.status === 'Confirmed' && idx <= 1) ||
                        (order.status === 'Preparing' && idx <= 2) ||
                        (order.status === 'Ready' && idx <= 3) ||
                        (order.status === 'Out for Delivery' && idx <= 4) ||
                        (order.status === 'Completed' && idx <= 5);
                        
                      return (
                        <div key={step} className="flex flex-col items-center gap-2 bg-[#fffaf7] px-1">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-colors ${isActive ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                            {isActive ? '✓' : idx + 1}
                          </div>
                          <span className={`text-[10px] font-bold hidden sm:block ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{step}</span>
                        </div>
                      )
                    })}
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm mb-6">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Delivering to</p>
                    <p className="text-sm font-bold text-gray-800">{order.delivery_address || 'Pick-up at Branch'}</p>
                    {order.delivery_address && (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#E39A7B] hover:underline mt-1 inline-block">View pinned location ↗</a>
                    )}
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    {order.items && order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="font-bold text-gray-700"><span className="text-gray-400 mr-2">{item.qty}×</span> {item.name}</span>
                        <span className="font-bold text-gray-900">₱{parseFloat(item.price * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-end pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total</p>
                      {order.notes && <p className="text-xs text-gray-500 font-medium italic">Note: "{order.notes}"</p>}
                    </div>
                    <span className="text-2xl font-black text-[#E39A7B]">₱{parseFloat(order.total_amount).toFixed(2)}</span>
                  </div>
                </div>

                {/* Real-time Rider Chat Module */}
                {order.status === 'Out for Delivery' && (
                  <div className="border-t border-[#FFB5AB]/30 bg-white p-6 md:p-8">
                    <h3 className="text-lg font-black text-gray-900 mb-1">Chat with your rider</h3>
                    <p className="text-xs font-bold text-gray-500 mb-4">Chatting with rider • order O-{String(order.id).padStart(4, '0')}</p>
                    
                    <div className="bg-gray-50 rounded-xl border border-gray-200 h-64 flex flex-col overflow-hidden mb-4">
                      <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        {(chatLogs[order.id] || []).map((msg, i) => (
                          <div key={i} className={`flex flex-col ${msg.sender === user.name ? 'items-end' : 'items-start'}`}>
                            <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm font-bold shadow-sm ${msg.sender === user.name ? 'bg-gray-200 text-gray-900 rounded-br-none' : 'bg-[#E39A7B] text-white rounded-bl-none'}`}>
                              {msg.text}
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 mt-1">{msg.sender} • {msg.time}</span>
                          </div>
                        ))}
                        {(!chatLogs[order.id] || chatLogs[order.id].length === 0) && (
                          <div className="h-full flex items-center justify-center text-xs font-bold text-gray-400">
                            Say hi to your rider — tell them where to find you.
                          </div>
                        )}
                      </div>
                      <form onSubmit={(e) => sendMessage(e, order.id)} className="bg-white border-t border-gray-200 p-3 flex gap-2">
                        <input 
                          type="text" 
                          value={messages[order.id] || ''} 
                          onChange={e => setMessages(prev => ({...prev, [order.id]: e.target.value}))} 
                          placeholder="Type a message..." 
                          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#E39A7B] text-sm font-medium text-gray-800"
                        />
                        <button type="submit" className="bg-[#E39A7B] text-white px-5 rounded-xl font-black shadow-sm hover:bg-[#DBB06B] transition-colors">↗</button>
                      </form>
                    </div>
                  </div>
                )}
                
                {order.status === 'Completed' && (
                   <div className="border-t border-[#FFB5AB]/30 bg-gray-50 p-6 text-center">
                     <p className="text-sm font-bold text-gray-600">This delivery is finished, so the chat is closed.</p>
                   </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-[#FFB5AB]/30 p-16 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-500 mb-6 font-medium">You don't have any orders under this status.</p>
              <Link to="/menu" className="inline-block px-8 py-3 bg-[#E39A7B] text-white rounded-sm text-sm font-bold hover:bg-[#DBB06B] transition-colors shadow-sm">Browse Menu</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}