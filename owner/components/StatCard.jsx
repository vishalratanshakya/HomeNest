import { motion, useMotionValue, useSpring, useMotionValueEvent } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

function AnimatedNumber({ value }) {
  const isCurrency = value.toString().includes('₹');
  const numericValue = parseFloat(value.toString().replace(/[^\d.]/g, ''));
  const suffix = value.toString().replace(/[\d.₹]/g, '');
  
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 50, damping: 15 });
  const spanRef = useRef(null);

  useEffect(() => {
    motionValue.set(numericValue);
  }, [numericValue, motionValue]);

  useMotionValueEvent(springValue, "change", (latest) => {
    if (spanRef.current) {
      spanRef.current.textContent = latest.toFixed(suffix ? 2 : 0);
    }
  });

  return (
    <span className="inline-flex items-center">
      {isCurrency && '₹'}
      <span ref={spanRef}>0</span>
      {suffix}
    </span>
  );
}

const defaultChartData = [
  { v: 10 }, { v: 25 }, { v: 15 }, { v: 35 }, { v: 20 }, { v: 45 }, { v: 30 }
];

export default function StatCard({ title, value, growth, icon: Icon, color, isLoading }) {
  const isPositive = growth >= 0;

  if (isLoading) {
    return (
      <div className="h-full min-h-[180px] rounded-[2rem] animate-pulse bg-gray-100" />
    );
  }

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className={`relative p-5 lg:p-8 rounded-[1.5rem] lg:rounded-[2rem] bg-gradient-to-br ${color.gradient} text-white shadow-lg shadow-indigo-100 overflow-hidden group transition-all duration-300 h-full min-h-[140px] lg:min-h-[180px] flex flex-col justify-between w-full`}
    >
      <div className="flex justify-between items-start relative z-10 w-full gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] lg:text-sm font-bold text-white/80 mb-0.5 lg:mb-2 uppercase tracking-wider leading-tight">{title}</p>
          <h2 className="text-2xl lg:text-4xl font-black text-white tracking-tight mb-1 lg:mb-2">
            <AnimatedNumber value={value} />
          </h2>
        </div>

        <div className={`w-10 h-10 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-white/20 flex items-center justify-center shadow-inner backdrop-blur-sm group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 shrink-0`}>
          <Icon className="w-5 h-5 lg:w-8 lg:h-8 text-white" />
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full bg-white/20 text-white`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositive ? '+' : ''}{growth}%
          </div>
          <span className="text-[11px] font-bold text-white/60">vs last month</span>
        </div>
      </div>

      {/* Glassmorphism Decorative Elements */}
      <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-black/5 rounded-full blur-3xl" />
    </motion.div>
  );
}
