import { useState } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  MessageSquare, 
  Flag, 
  User, 
  Home, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearch } from '@core/contexts/SearchContext';

const AdminReports = () => {
  const [reports, setReports] = useState([
    { id: '1', type: 'Property Misleading', reporter: 'Alex Johnson', target: 'Skyline Penthouse', reason: 'Images do not match actual property state.', status: 'pending', priority: 'high', date: 'May 11, 2026' },
    { id: '2', type: 'Owner Behavior', reporter: 'Sarah Lee', target: 'Prime Estates Agency', reason: 'Unprofessional communication during site visit.', status: 'resolved', priority: 'medium', date: 'May 10, 2026' },
    { id: '3', type: 'Spam', reporter: 'System Bot', target: 'User Account #492', reason: 'Multiple repetitive comments in 1 minute.', status: 'pending', priority: 'low', date: 'May 11, 2026' },
  ]);

  const { searchQuery } = useSearch();
  const [selectedPriority, setSelectedPriority] = useState('all');

  const handleStatusChange = (id, status) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.reporter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.target.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = selectedPriority === 'all' || report.priority === selectedPriority;
    
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Platform Reports</h1>
          <p className="text-gray-500 font-medium">Moderate complaints and resolve disputes between parties.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm outline-none appearance-none"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Tickets</p>
            <p className="text-xl font-black text-gray-900">{reports.filter(r => r.status === 'pending').length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resolved Today</p>
            <p className="text-xl font-black text-gray-900">12</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avg. Resolution</p>
            <p className="text-xl font-black text-gray-900">4.2h</p>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type & Reason</th>
                <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Parties</th>
                <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Priority</th>
                <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence mode="popLayout">
                {filteredReports.map((report, idx) => (
                  <motion.tr
                    key={report.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-gray-50/80 transition-all group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex flex-col max-w-[300px]">
                        <span className="text-xs font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
                           <Flag className={`w-3 h-3 ${report.priority === 'high' ? 'text-rose-500' : 'text-indigo-500'}`} />
                           {report.type}
                        </span>
                        <span className="text-[10px] font-medium text-gray-500 mt-2 line-clamp-1">{report.reason}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-2">{report.date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="space-y-2">
                         <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-gray-400 uppercase">From:</span>
                            <span className="text-xs font-bold text-gray-700">{report.reporter}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-gray-400 uppercase">Target:</span>
                            <span className="text-xs font-bold text-indigo-600">{report.target}</span>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        report.priority === 'high' ? 'bg-rose-50 text-rose-600' : 
                        report.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        {report.priority}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${
                        report.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 
                        report.status === 'dismissed' ? 'bg-gray-100 text-gray-400' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-2">
                        {report.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleStatusChange(report.id, 'resolved')}
                              className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleStatusChange(report.id, 'dismissed')}
                              className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-200 transition-all shadow-sm"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Page 1 of 1</p>
           <div className="flex gap-2">
              <button className="p-2 bg-white rounded-xl border border-gray-100 disabled:opacity-50" disabled><ChevronLeft className="w-5 h-5" /></button>
              <button className="p-2 bg-white rounded-xl border border-gray-100 disabled:opacity-50" disabled><ChevronRight className="w-5 h-5" /></button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
