import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPin, Plus, Users } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function QuickAccessGrid({ setShowCreateMatchModal }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      <QuickAccessCard
        to={createPageUrl('Map')}
        icon={MapPin}
        title="Hitta Planer"
        color="#2BA84A"
        gradientFrom="#2BA84A"
        gradientTo="#248232"
        delay={0.3}
      />
      
      <QuickAccessCard
        onClick={() => setShowCreateMatchModal(true)}
        icon={Plus}
        title="Skapa match"
        color="#F4743B"
        gradientFrom="#F4743B"
        gradientTo="#E5683A"
        delay={0.4}
        rotateIcon={true}
      />
      
      <QuickAccessCard
        to={createPageUrl('Community')}
        icon={Users}
        title="Vänner & lag"
        color="#2BA84A"
        gradientFrom="#2BA84A"
        gradientTo="#248232"
        delay={0.5}
        pulseIcon={true}
      />
    </div>
  );
}

function QuickAccessCard({ to, onClick, icon: Icon, title, color, gradientFrom, gradientTo, delay, rotateIcon, pulseIcon }) {
  const Content = (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#121715] to-[#18221E] border border-[#223029] shadow-[0_8px_24px_rgba(0,0,0,0.3)] rounded-[20px] p-4 sm:p-5 min-h-[110px] sm:min-h-[120px] flex flex-col items-center justify-center group hover:border-opacity-50 transition-all" style={{ borderColor: `${color}4D` }}>
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(135deg, ${color}1A, transparent)` }}
      />
      <motion.div
        whileHover={rotateIcon ? { rotate: 90 } : pulseIcon ? { scale: [1, 1.1, 1] } : { rotate: [0, -10, 10, -10, 0] }}
        transition={pulseIcon ? { duration: 0.4, repeat: Infinity } : { duration: 0.3 }}
        className="relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center mb-3 shadow-lg transition-all group-hover:shadow-xl"
        style={{ 
          background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
          boxShadow: `0 4px 16px ${color}66`
        }}
      >
        <Icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" strokeWidth={2.5} />
      </motion.div>
      <span className="text-xs sm:text-sm font-bold text-[#F4F7F5] text-center leading-tight px-1">{title}</span>
    </div>
  );

  const containerProps = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay },
    whileHover: { scale: 1.05, y: -5 },
    whileTap: { scale: 0.95 }
  };

  if (to) {
    return (
      <motion.div {...containerProps}>
        <Link to={to}>{Content}</Link>
      </motion.div>
    );
  }

  return (
    <motion.div {...containerProps}>
      <button onClick={onClick} className="w-full">{Content}</button>
    </motion.div>
  );
}