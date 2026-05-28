import { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Globe, 
  Shield, 
  Bell, 
  Database, 
  CreditCard, 
  Search, 
  Image as ImageIcon,
  Save,
  RefreshCcw,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion } from 'framer-motion';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [showPassword, setShowPassword] = useState(false);

  const tabs = [
    { id: 'general', name: 'General', icon: Globe },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'firebase', name: 'Firebase', icon: Database },
    { id: 'payment', name: 'Payments', icon: CreditCard },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Settings</h1>
          <p className="text-gray-500 font-medium">Configure your platform's core parameters and branding.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
            <RefreshCcw className="w-5 h-5" />
            <span>Reset Changes</span>
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            <Save className="w-5 h-5" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
                activeTab === tab.id 
                ? 'bg-white text-indigo-600 shadow-sm border border-gray-50' 
                : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400'}`} />
              <span className="text-sm uppercase tracking-widest">{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-sm border border-gray-50"
          >
            {activeTab === 'general' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6">Website Identity</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Platform Name</label>
                      <input 
                        type="text" 
                        defaultValue="HomeNest Premium"
                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Support Email</label>
                      <input 
                        type="email" 
                        defaultValue="admin@homenest.com"
                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6">Visual Branding</h3>
                  <div className="flex flex-col sm:flex-row items-center gap-8 p-8 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <div className="w-32 h-32 bg-white rounded-[2rem] shadow-sm flex items-center justify-center border border-gray-100 group relative overflow-hidden">
                       <Building2 className="w-12 h-12 text-indigo-600" />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                          <ImageIcon className="text-white w-6 h-6" />
                       </div>
                    </div>
                    <div className="flex-1 space-y-2 text-center sm:text-left">
                       <p className="text-sm font-black text-gray-900">Logo Upload</p>
                       <p className="text-xs text-gray-500 font-medium">Recommended size: 512x512px. SVG, PNG or WEBP formats supported.</p>
                       <div className="flex gap-4 pt-2 justify-center sm:justify-start">
                          <button className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Change Logo</button>
                          <button className="text-xs font-black text-rose-500 uppercase tracking-widest hover:underline">Remove</button>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6">Security & Access</h3>
                <div className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">New Password</label>
                        <div className="relative">
                           <input 
                            type={showPassword ? 'text' : 'password'}
                            className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500/20"
                           />
                           <button 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600"
                           >
                             {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                           </button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Two-Factor Auth</label>
                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                           <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                              <Shield className="w-5 h-5 text-indigo-600" />
                           </div>
                           <div className="flex-1">
                              <p className="text-xs font-black text-gray-900">Enable 2FA</p>
                              <p className="text-[10px] text-gray-500 font-bold uppercase">Disabled</p>
                           </div>
                           <button className="bg-white px-4 py-2 rounded-xl text-[10px] font-black text-indigo-600 border border-gray-100 shadow-sm uppercase tracking-widest">Enable</button>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* Placeholder for other tabs */}
            {activeTab !== 'general' && activeTab !== 'security' && (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                 <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
                    <RefreshCcw className="w-10 h-10 text-gray-300 animate-spin-slow" />
                 </div>
                 <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">{activeTab} Settings</h3>
                 <p className="text-gray-500 font-medium max-w-xs">This configuration module is being optimized for the new design system.</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const Building2 = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
);

export default AdminSettings;
