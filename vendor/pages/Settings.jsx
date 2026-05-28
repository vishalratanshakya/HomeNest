import VendorSidebar from '../components/VendorSidebar';
import VendorHeader from '../components/VendorHeader';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <VendorSidebar />
      <main className="flex-1 lg:ml-72 ml-0 transition-all duration-300">
        <VendorHeader />
        <div className="p-8 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="p-6 bg-gray-100 rounded-full mb-4">
            <SettingsIcon className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
          <p className="text-gray-500 font-medium mt-2">Configuration options are coming soon!</p>
        </div>
      </main>
    </div>
  );
}
