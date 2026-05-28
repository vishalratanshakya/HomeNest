import React, { useState, useEffect, useRef } from 'react';
import VendorSidebar from '../components/VendorSidebar';
import VendorHeader from '../components/VendorHeader';
import { 
  Search, 
  MoreVertical, 
  Send, 
  Trash2, 
  CheckCircle, 
  Clock, 
  User,
  MessageSquare,
  Home,
  ChevronRight,
  Plus,
  Building2,
  ShieldCheck,
  Zap,
  Sparkles,
  Bot,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { authService, firestoreService } from '../../src/core/services/firebaseService';

const suggestions = [
  "Is this property still available?",
  "Can I schedule a visit?",
  "What is the final price?",
  "Can you send more photos?",
  "Yes, I can show you the property tomorrow."
];

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({}); // { [id]: 'draft message' }
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All'); // All | Unread
  const [isAILoading, setIsAILoading] = useState(false);
  const [isAutoPilot, setIsAutoPilot] = useState(false);
  const chatEndRef = useRef(null);
  const [userProfiles, setUserProfiles] = useState({}); // { [userId]: { name, avatar } }
  const [showMobileList, setShowMobileList] = useState(true);

  const user = authService.getCurrentUser();

  useEffect(() => {
    const uniqueUserIds = [...new Set(conversations.map(c => c.userId).filter(Boolean))];
    uniqueUserIds.forEach(userId => {
      if (!userProfiles[userId]) {
        firestoreService.getUserDocument(userId).then(doc => {
          if (doc) {
            setUserProfiles(prev => ({
              ...prev,
              [userId]: {
                name: doc.fullName || doc.name || doc.displayName,
                avatar: doc.profileImage || doc.photoURL
              }
            }));
          }
        }).catch(err => console.error("Error fetching user profile:", err));
      }
    });
  }, [conversations]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = firestoreService.subscribeToConversations(
      { vendorId: user.uid },
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

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeId, isAILoading]);

  useEffect(() => {
    if (activeId) {
      firestoreService.markAsRead(activeId, 'vendor');
      window.dispatchEvent(new CustomEvent('notifications-read'));
    }
  }, [activeId]);

  useEffect(() => {
    if (activeId && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender !== 'vendor') {
        firestoreService.markAsRead(activeId, 'vendor');
      }
    }
  }, [messages, activeId]);

  const activeChat = conversations.find(c => c.id === activeId);

  const handleGenerateAIReply = (autoSend = isAutoPilot) => {
    if (isAILoading || !activeChat) return;
    setIsAILoading(true);
    
    setTimeout(() => {
      const lastMsg = activeChat?.lastMessage?.toLowerCase() || "";
      let suggestion = `Hello ${activeChat.name || 'there'}, thank you for your inquiry about the property. I'd be happy to provide more details or arrange a call to discuss your requirements.`;
      
      if (lastMsg.includes('available')) {
        suggestion = `Hi ${activeChat.name}, yes the property is still available and open for viewing. Would you like to schedule a visit?`;
      } else if (lastMsg.includes('price')) {
        suggestion = `The current listing price is mentioned in the details. We are open to reasonable offers after a site visit.`;
      }

      if (autoSend) {
        handleSendMessage(suggestion);
        toast.success('AI Auto-Replied!', { icon: '🚀' });
      } else {
        setDrafts(prev => ({ ...prev, [activeId]: suggestion }));
        toast.success('Magic Reply Generated!', { icon: '✨' });
      }

      setIsAILoading(false);
    }, 1500);
  };

  const handleSendMessage = async (text = drafts[activeId] || '') => {
    if (!text.trim() || !activeId || !activeChat) return;
    
    try {
      const msgData = {
        text: text.trim(),
        sender: 'vendor', // Identifying vendor as the sender
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // We need to pass the conversation info for sendMessage to handle existing conversations correctly
      const convoData = {
        vendorId: user.uid,
        userId: activeChat.userId,
        propertyId: activeChat.propertyId,
        propertyName: activeChat.property,
        propertyPrice: activeChat.price,
        userName: activeChat.name,
        userAvatar: activeChat.avatar
      };

      await firestoreService.sendMessage(convoData, msgData);
      setDrafts(prev => ({ ...prev, [activeId]: '' }));
    } catch (err) {
      console.error("Send error:", err);
      toast.error("Failed to send message");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await Promise.all(conversations.map((chat) => firestoreService.markAsRead(chat.id, 'vendor')));
      setConversations(prev => prev.map(chat => ({
        ...chat,
        unreadForVendor: 0,
        unread: 0
      })));
      toast.success('All messages marked as read');
    } catch (error) {
      console.error('Error marking all read:', error);
      toast.error('Could not mark all as read');
    }
  };

  const handleDeleteConversation = (id) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeId === id) setActiveId(null);
    toast.success('Conversation deleted');
  };

  const filteredConversations = conversations.filter(c => {
    const name = c.name || "Guest";
    const property = c.property || "Property";
    const unreadCount = c.unreadForVendor ?? 0;
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'All' || (filterType === 'Unread' && unreadCount > 0);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans overflow-hidden">
      <VendorSidebar />
      <main className="flex-1 lg:ml-72 ml-0 flex flex-col h-screen overflow-hidden transition-all duration-300">
        <VendorHeader />
        
        <div className="flex flex-1 overflow-hidden p-4 md:p-8 gap-6">
          {/* Chat Sidebar */}
          <div className={`w-full md:w-96 flex flex-col bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden ${showMobileList ? 'flex' : 'hidden md:flex'}`}>
            <div className="p-6 border-b border-gray-50">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight">Messages</h1>
                  <div className="flex gap-4 mt-2">
                    <button 
                      onClick={() => setFilterType('All')}
                      className={`text-[10px] font-black uppercase tracking-widest transition-colors ${filterType === 'All' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setFilterType('Unread')}
                      className={`text-[10px] font-black uppercase tracking-widest transition-colors ${filterType === 'Unread' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      Unread ({conversations.filter(c => (c.unreadForVendor ?? c.unread ?? 0) > 0).length})
                    </button>
                  </div>
                </div>
                <button 
                  onClick={handleMarkAllRead}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest"
                >
                  Mark All Read
                </button>
              </div>
              
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search chat or property..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="wallet-input pl-11 font-bold text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredConversations.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-200" />
                  </div>
                  <p className="font-bold">No conversations found</p>
                </div>
              ) : (
                filteredConversations.map((chat) => {
                  const uProfile = userProfiles[chat.userId];
                  const displayUserName = uProfile?.name || chat.name || "Guest User";
                  const displayUserAvatar = uProfile?.avatar || chat.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.userId}`;
                  
                  return (
                    <button
                      key={chat.id}
                      onClick={() => {
                        setActiveId(chat.id);
                        setShowMobileList(false);
                      }}
                      className={`w-full p-6 flex items-start gap-4 hover:bg-gray-50 transition-all border-l-4 ${
                        activeId === chat.id ? 'bg-indigo-50/50 border-indigo-600' : 'border-transparent'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img 
                          src={displayUserAvatar} 
                          className="w-14 h-14 rounded-2xl object-cover shadow-sm"
                          alt={displayUserName}
                        />
                        {chat.status === 'online' && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="text-sm font-black text-gray-900 truncate">{displayUserName}</h3>
                          <span className="text-[10px] font-bold text-gray-400">{chat.time}</span>
                        </div>
                        <p className="text-xs font-bold text-indigo-600 mb-1 truncate flex items-center gap-1">
                          <Home className="w-3 h-3" /> {chat.property}
                        </p>
                      <p className={`text-xs truncate ${
                          (chat.unreadForVendor > 0) ? 'font-black text-gray-900' : 'text-gray-400 font-medium'
                        }`}>
                        {chat.lastMessage}
                      </p>
                    </div>
                    {(chat.unreadForVendor > 0) && (
                      <div className="ml-2 w-5 h-5 bg-indigo-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg shadow-indigo-200">
                        {chat.unreadForVendor}
                      </div>
                    )}
                  </button>
                );
              })
            )}
            </div>
          </div>

          {/* Chat Window */}
          <div className={`flex-1 flex flex-col bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden relative ${!showMobileList ? 'flex fixed inset-0 z-50 md:static md:z-auto' : 'hidden md:flex'}`}>
            <AnimatePresence mode='wait'>
              {activeChat ? (
                <motion.div 
                  key={activeId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col h-full"
                >
                  {/* Chat Header */}
                  <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md z-10 shadow-sm shadow-gray-100/50">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setShowMobileList(true)}
                        className="md:hidden p-2 hover:bg-gray-100 rounded-xl text-gray-400 active:scale-95 transition-transform"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div className="relative">
                        <img 
                          src={userProfiles[activeChat.userId]?.avatar || activeChat.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChat.userId}`} 
                          className="w-12 h-12 rounded-2xl object-cover"
                          alt={userProfiles[activeChat.userId]?.name || activeChat.name || "Guest User"}
                        />
                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${activeChat.status === 'online' ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-gray-900 leading-tight flex items-center gap-2">
                          {userProfiles[activeChat.userId]?.name || activeChat.name || "Guest User"}
                          {activeChat.status === 'online' && <ShieldCheck className="w-4 h-4 text-indigo-500" />}
                        </h2>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {activeChat.status === 'online' ? 'Online Now' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* AI Auto-Pilot Toggle */}
                      <button 
                        onClick={() => setIsAutoPilot(!isAutoPilot)}
                        className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 group ${
                          isAutoPilot 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                          : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-100 hover:text-indigo-600'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${isAutoPilot ? 'bg-white animate-pulse' : 'bg-gray-300'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {isAutoPilot ? 'AI Auto-Pilot On' : 'AI Auto-Pilot Off'}
                        </span>
                      </button>

                      <div className="hidden lg:flex flex-col items-end px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-indigo-100 transition-all cursor-default">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> Property Context
                        </span>
                        <span className="text-xs font-black text-indigo-600">{activeChat.property} • <span className="text-gray-900">{activeChat.price}</span></span>
                      </div>
                      <div className="h-10 w-px bg-gray-100 mx-2" />
                      <button 
                        onClick={() => handleDeleteConversation(activeId)}
                        className="p-3 text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all rounded-2xl"
                        title="Delete Chat"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                    {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-50/20">
                    <div className="flex justify-center mb-8">
                      <div className="px-4 py-1.5 bg-white rounded-full border border-gray-100 shadow-sm text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3 h-3" /> Chat started on {activeChat.time}
                      </div>
                    </div>

                    {messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`flex mb-6 ${msg.sender === 'vendor' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] group`}>
                          <div className={`
                            px-6 py-4 rounded-[2rem] text-sm font-medium shadow-sm relative transition-all group-hover:shadow-md
                            ${msg.sender === 'vendor' 
                              ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none' 
                              : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}
                          `}>
                            {msg.text}
                          </div>
                          <div className={`mt-2 flex items-center gap-1.5 ${msg.sender === 'vendor' ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{msg.time}</span>
                            {msg.sender === 'vendor' && <CheckCircle className="w-3 h-3 text-indigo-300" />}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* AI Typing Indicator */}
                    <AnimatePresence>
                      {isAILoading && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex justify-start mb-6"
                        >
                          <div className="bg-white px-6 py-4 rounded-[2rem] rounded-tl-none border border-indigo-100 shadow-sm flex items-center gap-3">
                            <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center animate-pulse">
                              <Bot className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="flex gap-1">
                              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-2">Magic Reply Generating...</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div ref={chatEndRef} />
                  </div>

                  {/* Suggestion Chips */}
                  <div className="px-8 py-4 bg-white border-t border-gray-50 overflow-x-auto no-scrollbar">
                    <div className="flex gap-2 min-w-max items-center">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                        <Zap className="w-4 h-4" />
                      </div>
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(s)}
                          className="px-4 py-2 bg-gray-50 hover:bg-indigo-600 hover:text-white text-gray-600 rounded-full text-xs font-bold transition-all border border-gray-100 whitespace-nowrap"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                    <div className="p-8 bg-white border-t border-gray-50">
                      <div className="relative group">
                        <input 
                          type="text" 
                          value={drafts[activeId] || ''}
                          onChange={(e) => setDrafts(prev => ({ ...prev, [activeId]: e.target.value }))}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Type your message here..."
                          className="w-full pl-6 pr-44 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-200 transition-all shadow-inner"
                        />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                        <button 
                          onClick={() => handleGenerateAIReply()}
                          disabled={isAILoading}
                          className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:scale-105 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 group/ai"
                        >
                          <Sparkles className={`w-5 h-5 ${isAILoading ? 'animate-spin' : 'group-hover:rotate-12'}`} />
                          <span className="text-[10px] font-black uppercase tracking-widest hidden xl:inline">
                            {isAutoPilot ? 'Magic Auto-Send' : 'Magic Reply'}
                          </span>
                        </button>
                        <button className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all">
                          <Plus className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleSendMessage()}
                          disabled={!(drafts[activeId] || '').trim() || isAILoading}
                          className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-gray-50/30">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-32 h-32 bg-indigo-100/50 rounded-[2.5rem] flex items-center justify-center mb-8 relative"
                  >
                    <MessageSquare className="w-16 h-16 text-indigo-400" />
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center text-indigo-600">
                      <Plus className="w-6 h-6" />
                    </div>
                  </motion.div>
                  <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Your Conversations Hub</h2>
                  <p className="text-gray-400 text-sm max-w-sm font-medium leading-relaxed">
                    Select an inquiry from the left to start chatting with potential buyers. Your responses build trust and close deals faster.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
