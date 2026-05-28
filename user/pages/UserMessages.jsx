import React, { useState, useEffect, useRef } from 'react';
import { authService, firestoreService } from '../../src/core/services/firebaseService';
import { 
  MessageSquare, 
  Send, 
  Home, 
  Clock, 
  CheckCircle, 
  Search, 
  Building2, 
  Phone, 
  Mail,
  MoreVertical,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import "./userDashboard.css";

const UserMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const chatEndRef = useRef(null);
  const [showMobileList, setShowMobileList] = useState(true);
  const [vendorProfiles, setVendorProfiles] = useState({}); // { [vendorId]: { name, avatar } }

  const user = authService.getCurrentUser();

  useEffect(() => {
    const uniqueVendorIds = [...new Set(conversations.map(c => c.vendorId).filter(Boolean))];
    uniqueVendorIds.forEach(vendorId => {
      if (!vendorProfiles[vendorId]) {
        firestoreService.getUserDocument(vendorId).then(doc => {
          if (doc) {
            setVendorProfiles(prev => ({
              ...prev,
              [vendorId]: {
                name: doc.fullName || doc.name || doc.displayName,
                avatar: doc.profileImage || doc.photoURL
              }
            }));
          }
        }).catch(err => console.error("Error fetching vendor profile:", err));
      }
    });
  }, [conversations]);

  useEffect(() => {
    if (!user || !user.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = firestoreService.subscribeToUserConversations(
      user.uid,
      (data) => {
        setConversations(data);
        setLoading(false);
        if (data.length > 0 && !activeId) {
          setActiveId(data[0].id);
        }
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!activeId) return;

    const unsubscribe = firestoreService.subscribeToMessages(
      activeId,
      (data) => {
        setMessages(data);
      }
    );

    return () => unsubscribe();
  }, [activeId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (activeId && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender !== 'user') {
        firestoreService.markAsRead(activeId, 'user');
      }
    }
  }, [messages, activeId]);

  const handleSendMessage = async (customMessage) => {
    const textToSend = typeof customMessage === 'string' ? customMessage : inputMessage;
    if (!textToSend.trim() || !activeId || !activeChat) return;

    try {
      const msgData = {
        text: textToSend.trim(),
        sender: 'user',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const convoData = {
        vendorId: activeChat.vendorId,
        vendorName: activeChat.vendorName,
        vendorAvatar: activeChat.vendorAvatar,
        vendorPhone: activeChat.vendorPhone || '',
        vendorEmail: activeChat.vendorEmail || '',
        userId: user.uid,
        propertyId: activeChat.propertyId,
        propertyName: activeChat.property,
        propertyPrice: activeChat.price,
        userName: user.displayName || 'User',
        userAvatar: user.photoURL
      };

      await firestoreService.sendMessage(convoData, msgData);
      if (typeof customMessage !== 'string') {
        setInputMessage('');
      }
      firestoreService.markAsRead(activeId, 'user');
    } catch (err) {
      console.error("Send error:", err);
      toast.error("Failed to send message");
    }
  };

  const handleConversationClick = (id) => {
    setActiveId(id);
    setShowMobileList(false);
    firestoreService.markAsRead(id, 'user');
  };

  const handleDeleteConversation = async () => {
    if (!activeId || !window.confirm("Are you sure you want to delete this conversation?")) return;
    try {
      await firestoreService.deleteConversation(activeId);
      setActiveId(null);
      toast.success("Conversation deleted");
    } catch (err) {
      toast.error("Failed to delete conversation");
    }
  };

  const handleCall = () => {
    if (activeChat?.vendorPhone) {
      window.location.href = `tel:${activeChat.vendorPhone}`;
    } else {
      toast.error("Phone number not available");
    }
  };

  const handleEmail = () => {
    if (activeChat?.vendorEmail) {
      window.location.href = `mailto:${activeChat.vendorEmail}`;
    } else {
      toast.error("Email address not available");
    }
  };

  const activeChat = conversations.find(c => c.id === activeId);

  const filteredConversations = conversations.filter(c => {
    const vName = c.vendorName || "Vendor";
    const property = c.property || "Property";
    return vName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           property.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="dashboard-page flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full h-[calc(100vh-88px)] md:h-[calc(100vh-100px)] flex flex-col overflow-hidden -mb-6 md:mb-0">
      <div className="dashboard-card flex p-0 h-full overflow-hidden border-x-0 border-b-0 border-slate-100 rounded-none md:rounded-[2.5rem] shadow-2xl shadow-blue-900/5 bg-white relative">
              
              {/* LEFT: CONVERSATIONS LIST */}
              <div className={`chat-sidebar border-r border-slate-100 flex flex-col bg-white transition-all duration-300 z-20 ${
                showMobileList ? 'w-full md:w-80 lg:w-96 flex' : 'hidden md:flex md:w-80 lg:w-96'
              }`}>
                <div className="p-8 border-b border-slate-50 shrink-0">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Messages</h2>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1">Inquiries & Chats</p>
                    </div>
                    <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Search vendor or property..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                    />
                  </div>
                </div>
                
                <div className="chat-list flex-1 overflow-y-auto no-scrollbar">
                  {filteredConversations.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <Search className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No messages found</p>
                    </div>
                  ) : (
                    filteredConversations.map((chat) => {
                      const vProfile = vendorProfiles[chat.vendorId];
                      const displayVendorName = vProfile?.name || chat.vendorName || "Agent";
                      const displayVendorAvatar = vProfile?.avatar || chat.vendorAvatar || `https://i.pravatar.cc/150?u=${chat.vendorId}`;
                      
                      return (
                        <button
                          key={chat.id}
                          onClick={() => handleConversationClick(chat.id)}
                          className={`w-full p-6 flex items-start gap-4 hover:bg-slate-50 transition-all border-l-4 group ${
                            activeId === chat.id ? 'bg-blue-50/50 border-blue-600' : 'border-transparent'
                          }`}
                        >
                          <div className="relative shrink-0">
                            <img 
                              src={displayVendorAvatar} 
                              alt="" 
                              className="w-14 h-14 rounded-2xl object-cover shadow-md border-2 border-white group-hover:border-blue-600 transition-all" 
                            />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-white rounded-full shadow-sm"></div>
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex justify-between items-center mb-1">
                              <h3 className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">
                                {displayVendorName}
                              </h3>
                            <span className="text-[9px] font-black text-slate-400 uppercase">
                              {chat.updatedAt?.seconds 
                                ? new Date(chat.updatedAt.seconds * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' })
                                : 'Recent'}
                            </span>
                          </div>
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-0.5 truncate flex items-center gap-1.5">
                            <Building2 className="w-3 h-3" /> {chat.property}
                          </p>
                          <p className={`text-[11px] truncate mt-1.5 font-bold ${
                            (chat.unreadForUser > 0) ? 'text-slate-900' : 'text-slate-400'
                          }`}>
                          {chat.lastMessage}
                        </p>
                      </div>
                    {(chat.unreadForUser > 0) && (
                      <div className="w-5 h-5 bg-blue-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg shadow-blue-200">
                        {chat.unreadForUser}
                      </div>
                    )}
                  </button>
                );
              })
            )}
                </div>
              </div>

              {/* RIGHT: CHAT INTERFACE */}
              <div className={`chat-window flex-1 flex-col bg-white transition-all duration-300 md:relative md:inset-auto md:z-auto md:h-full md:overflow-hidden ${
                !showMobileList ? 'flex fixed inset-0 z-[100] h-[100dvh] w-full' : 'hidden md:flex'
              }`}>
                {/* STABLE HEADER (Always visible if chat view is active on mobile or if a chat is selected) */}
                {(!showMobileList || activeChat) && (
                  <div className="p-4 md:p-6 border-b border-slate-50 flex justify-between items-center bg-white z-20 shadow-sm">
                    <div className="flex items-center gap-4">
                      {/* Back button for mobile */}
                      <button 
                        onClick={() => {
                          setShowMobileList(true);
                          // We don't necessarily clear activeId, but we show the list
                        }}
                        className="md:hidden p-2 hover:bg-slate-50 rounded-xl text-slate-400 active:scale-95 transition-transform"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>

                      {activeChat ? (
                        <>
                          <img 
                            src={vendorProfiles[activeChat.vendorId]?.avatar || activeChat.vendorAvatar || `https://i.pravatar.cc/150?u=${activeChat.vendorId}`} 
                            alt="" 
                            className="w-10 h-10 md:w-12 md:h-12 rounded-2xl object-cover shadow-lg border border-slate-100" 
                          />
                          <div>
                            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight leading-tight">
                              {vendorProfiles[activeChat.vendorId]?.name || activeChat.vendorName || "Property Agent"}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[8px] font-black uppercase tracking-widest">Online</span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[150px] md:max-w-none">
                                {activeChat.property}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-slate-50 animate-pulse" />
                          <div className="space-y-1">
                            <div className="w-32 h-4 bg-slate-50 rounded animate-pulse" />
                            <div className="w-20 h-2 bg-slate-50 rounded animate-pulse" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {activeChat && (
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <button 
                          onClick={handleCall}
                          className="p-2 md:p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all border border-slate-100"
                        >
                          <Phone className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                        <button 
                          onClick={handleEmail}
                          className="p-2 md:p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all border border-slate-100"
                        >
                          <Mail className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                        <button 
                          onClick={handleDeleteConversation}
                          className="p-2 md:p-3 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 rounded-2xl transition-all border border-slate-100"
                        >
                          <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex-1 flex flex-col overflow-hidden relative">
                  <AnimatePresence mode='wait'>
                    {activeChat ? (
                      <motion.div 
                        key={activeId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col h-full overflow-hidden"
                      >
                        {/* MESSAGES */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-slate-50/30 no-scrollbar pb-6">
                        <div className="flex justify-center mb-10">
                          <div className="px-5 py-2 bg-white rounded-full shadow-sm border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" /> Security Verified Chat
                          </div>
                        </div>

                        {messages.map((msg) => (
                          <div 
                            key={msg.id} 
                            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                          >
                            <div className={`
                              max-w-[75%] p-5 rounded-[2rem] shadow-sm text-sm font-bold leading-relaxed
                              ${msg.sender === 'user' 
                                ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-100' 
                                : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}
                            `}>
                              {msg.text}
                            </div>
                            <div className={`mt-2 flex items-center gap-1.5 px-1 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                                {msg.createdAt?.seconds 
                                  ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : msg.time || 'Sending...'}
                              </span>
                              {msg.sender === 'user' && <CheckCircle className="w-3 h-3 text-blue-400" />}
                            </div>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>

                      {/* QUICK MESSAGES */}
                      <div className="px-4 py-3 bg-white border-t border-slate-50 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
                        {[
                          "Is this property available?",
                          "What is the best price?",
                          "Can I schedule a visit?"
                        ].map((text, i) => (
                          <button
                            key={i}
                            onClick={() => handleSendMessage(text)}
                            className="shrink-0 px-4 py-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-100 hover:border-blue-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            {text}
                          </button>
                        ))}
                      </div>

                      {/* INPUT */}
                      <div className="p-4 md:p-8 bg-white border-t border-slate-50 shrink-0 mb-safe">
                        <div className="relative flex gap-2 md:gap-4">
                          <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 px-4 md:px-8 py-4 md:py-5 bg-slate-50 border-none rounded-3xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all shadow-inner"
                          />
                          <button 
                            onClick={handleSendMessage}
                            disabled={!inputMessage.trim()}
                            className="px-6 md:px-10 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                          >
                            <Send className="w-4 h-4 md:w-4 md:h-4" />
                            <span className="hidden md:inline">Send</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
                      <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                        <MessageSquare className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Select a conversation</h3>
                      <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Choose a vendor to start chatting about properties</p>
                      
                      {!showMobileList && (
                        <button 
                          onClick={() => setShowMobileList(true)}
                          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-200 md:hidden"
                        >
                          Back to Messages
                        </button>
                      )}
                    </div>
                  )}
                </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserMessages;

