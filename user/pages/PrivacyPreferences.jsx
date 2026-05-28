import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Shield, 
  Eye, 
  Lock, 
  Trash2, 
  Download, 
  Bell, 
  CheckCircle,
  AlertTriangle,
  Info,
  Globe,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PrivacyPreferences() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [settings, setSettings] = useState({
    profileVisibility: 'public',
    dataCollection: true,
    personalizedAds: false,
    emailMarketing: true,
    searchIndexing: true
  });

  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Privacy settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      {
        loading: 'Preparing your data export...',
        success: 'Data export link sent to your email!',
        error: 'Export failed',
      }
    );
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm('Are you sure you want to delete your account? This action is permanent.');
    if (confirmed) {
      toast.error('Account deletion requested. Please contact support.');
    }
  };

  return (
    <>
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 bg-gradient-to-r from-primary-50/50 to-transparent">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Manage your data and privacy settings</h2>
          <p className="text-gray-500 mt-2 font-medium">Control how your information is used and who can see your profile.</p>
        </div>

          <div className="p-8 space-y-10">
            {/* Profile Visibility */}
            <section className="space-y-4">
              <div className="flex items-center space-x-2 text-primary-600">
                <Eye className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-widest">Profile Visibility</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setSettings({ ...settings, profileVisibility: 'public' })}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-start space-x-4 ${settings.profileVisibility === 'public' ? 'border-primary-500 bg-primary-50/50' : 'border-gray-50 bg-gray-50 hover:border-gray-200'}`}
                >
                  <div className={`mt-1 p-2 rounded-xl ${settings.profileVisibility === 'public' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-800">Public</p>
                    <p className="text-xs text-gray-500 font-medium">Anyone can see your profile and listings.</p>
                  </div>
                </button>
                <button
                  onClick={() => setSettings({ ...settings, profileVisibility: 'private' })}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-start space-x-4 ${settings.profileVisibility === 'private' ? 'border-primary-500 bg-primary-50/50' : 'border-gray-50 bg-gray-50 hover:border-gray-200'}`}
                >
                  <div className={`mt-1 p-2 rounded-xl ${settings.profileVisibility === 'private' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-800">Private</p>
                    <p className="text-xs text-gray-500 font-medium">Only people you approve can see your profile.</p>
                  </div>
                </button>
              </div>
            </section>

            {/* Privacy Toggles */}
            <section className="space-y-6">
              <div className="flex items-center space-x-2 text-primary-600">
                <Settings className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-widest">General Settings</h3>
              </div>
              <div className="space-y-4">
                {[
                  { id: 'dataCollection', label: 'Data Collection', desc: 'Allow us to collect usage data to improve your experience.', icon: Info },
                  { id: 'personalizedAds', label: 'Personalized Ads', desc: 'Receive property recommendations based on your browsing history.', icon: Bell },
                  { id: 'searchIndexing', label: 'Search Indexing', desc: 'Allow search engines like Google to index your public profile.', icon: Globe },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all duration-300">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-white rounded-xl shadow-sm text-primary-600">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-500 font-medium">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle(item.id)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ring-2 ring-transparent ring-offset-2 ${settings[item.id] ? 'bg-primary-600' : 'bg-gray-300'}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings[item.id] ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Data Management */}
            <section className="space-y-4">
              <div className="flex items-center space-x-2 text-primary-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-widest">Account & Data Management</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleExportData}
                  className="flex items-center space-x-3 p-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-primary-500 hover:bg-primary-50 transition-all group shadow-sm"
                >
                  <div className="p-2 bg-primary-100 rounded-xl text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all">
                    <Download className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-800 text-sm">Download My Data</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Request a copy</p>
                  </div>
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex items-center space-x-3 p-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-red-500 hover:bg-red-50 transition-all group shadow-sm"
                >
                  <div className="p-2 bg-red-100 rounded-xl text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-800 text-sm">Delete Account</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold text-red-400">Permanent action</p>
                  </div>
                </button>
              </div>
            </section>
          </div>

          <div className="p-8 bg-gray-50/50 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-gray-100">
            <div className="flex items-center text-yellow-600 bg-yellow-50 px-4 py-2 rounded-xl text-sm font-bold">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Changes may take up to 24 hours to reflect.
            </div>
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full md:w-auto px-10 py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-xl shadow-primary-200 hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Saving Settings...' : 'Save Privacy Settings'}
            </button>
          </div>
        </div>
      </>
    );
}
