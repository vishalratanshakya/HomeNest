import { motion } from 'framer-motion';

const PlaceholderPage = ({ title }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
            {title}
          </h1>
          <p className="text-gray-500 font-medium">Manage your portal's {title.toLowerCase()} here.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-3xl p-12 flex flex-col items-center justify-center text-center border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Coming Soon</h3>
          <p className="text-gray-500 max-w-sm">
            We are currently building the premium {title} management module. 
            Stay tuned for a modern, feature-rich experience.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;
