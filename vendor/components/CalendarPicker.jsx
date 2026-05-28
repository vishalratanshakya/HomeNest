import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isWithinInterval, 
  startOfDay,
  getDay
} from 'date-fns';

export default function CalendarPicker({ onApply, onCancel, initialRange }) {
  const [activeTab, setActiveTab] = useState('Month');
  const [currentMonth, setCurrentMonth] = useState(new Date(2022, 5, 1)); // June 2022 as per image
  const [startDate, setStartDate] = useState(new Date(2022, 4, 31)); // May 31
  const [endDate, setEndDate] = useState(new Date(2022, 5, 29));   // June 29
  
  const tabs = ['Day', 'Week', 'Month', 'Year'];
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const nextMonth = addMonths(currentMonth, 1);

  const handleDayClick = (day) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(day);
      setEndDate(null);
    } else if (day < startDate) {
      setStartDate(day);
    } else {
      setEndDate(day);
    }
  };

  const renderMonth = (month) => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });
    const emptyDays = Array(getDay(start)).fill(null);

    return (
      <div className="flex-1">
        <div className="grid grid-cols-7 gap-y-0.5">
          {dayNames.map(d => (
            <div key={d} className="text-center text-[8px] font-bold text-gray-400 uppercase tracking-widest py-1">
              {d}
            </div>
          ))}
          {emptyDays.map((_, i) => <div key={`empty-${i}`} className="h-8" />)}
          {days.map((day) => {
            const isStart = startDate && isSameDay(day, startDate);
            const isEnd = endDate && isSameDay(day, endDate);
            const inRange = startDate && endDate && isWithinInterval(day, { start: startDate, end: endDate });

            return (
              <div key={day.toString()} className="relative flex items-center justify-center py-0.5">
                {inRange && !isStart && !isEnd && (
                  <div className="absolute inset-0 bg-gray-50 mx-0" />
                )}
                {isStart && endDate && (
                  <div className="absolute inset-y-0 right-0 left-1/2 bg-gray-50 z-0" />
                )}
                {isEnd && startDate && (
                  <div className="absolute inset-y-0 left-0 right-1/2 bg-gray-50 z-0" />
                )}
                <button
                  onClick={() => handleDayClick(day)}
                  className={`
                    relative w-8 h-8 rounded-full text-[11px] font-bold transition-all z-10
                    ${isStart || isEnd ? 'bg-gray-900 text-white shadow-lg' : ''}
                    ${inRange && !isStart && !isEnd ? 'text-gray-600' : ''}
                    ${!isStart && !isEnd && !inRange ? 'text-gray-900 hover:bg-gray-50' : ''}
                  `}
                >
                  {format(day, 'd')}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const rangeText = startDate && endDate 
    ? `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`
    : startDate 
      ? `${format(startDate, 'MMM d, yyyy')} - ...`
      : 'Select range';

  return (
    <div className="w-[640px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-slate-900">
      {/* Header Tabs */}
      <div className="p-5 flex justify-between items-center bg-[#F8FAFC]">
        <h2 className="text-lg font-bold tracking-tight">Calendar</h2>
        <div className="flex gap-1 p-1 bg-white rounded-lg shadow-sm border border-gray-50">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${
                activeTab === tab 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Range Display */}
      <div className="px-6 py-3 border-b border-gray-50 bg-white">
        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-0.5">Custom</p>
        <p className="text-md font-bold tracking-tight">{rangeText}</p>
      </div>

      {/* Calendar Grid */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-gray-50 rounded-full">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="text-xs font-bold tracking-tight w-24 text-center">{format(currentMonth, 'MMMM yyyy')}</h3>
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold tracking-tight w-24 text-center">{format(nextMonth, 'MMMM yyyy')}</h3>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-gray-50 rounded-full">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {renderMonth(currentMonth)}
          {renderMonth(nextMonth)}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
        <button 
          onClick={onCancel}
          className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-[9px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button 
          onClick={() => onApply(rangeText)}
          className="px-7 py-2.5 bg-gray-900 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-gray-800 shadow-lg"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
