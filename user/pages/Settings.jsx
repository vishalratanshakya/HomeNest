import "./userDashboard.css";
import { User, Lock, Bell, Shield, Trash2 } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();
  const sections = [
    { title: "Account Details", icon: User, desc: "Update your name, phone, and profile picture", path: "/user/profile/edit" },
    { title: "Security", icon: Lock, desc: "Change password and manage two-factor authentication" },
    { title: "Notifications", icon: Bell, desc: "Configure how you receive alerts and updates" },
    { title: "Privacy", icon: Shield, desc: "Control your data and visibility preferences", path: "/user/privacy" }
  ];

  return (
    <>
      <div className="dashboard-card">
        <div className="card-header">
          <div>
            <h2>Account Settings</h2>
            <p className="profile-subtitle">Manage your account security and preferences</p>
          </div>
        </div>
        
        <div className="settings-grid grid gap-6 mt-4">
          {sections.map((section, idx) => (
            <div 
              key={idx} 
              onClick={() => section.path && navigate(section.path)}
              className="flex items-center justify-between p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 hover:border-primary-100 hover:bg-white transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <section.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{section.title}</h3>
                  <p className="text-sm text-gray-400 font-medium">{section.desc}</p>
                </div>
              </div>
              <button className="text-sm font-bold text-blue-600 uppercase tracking-widest px-6 py-2 bg-white rounded-xl shadow-sm border border-gray-50">Manage</button>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100">
          <h3 className="text-rose-500 font-black uppercase tracking-[2px] text-xs mb-6">Danger Zone</h3>
          <button className="flex items-center gap-3 px-8 py-4 bg-rose-50 text-rose-500 rounded-2xl font-black text-sm hover:bg-rose-100 transition-colors border border-rose-100">
            <Trash2 className="w-5 h-5" /> Delete My Account
          </button>
        </div>
      </div>
    </>
  );
};

export default Settings;
