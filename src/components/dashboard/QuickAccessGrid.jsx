import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin, Plus, Users } from "lucide-react";

export default function QuickAccessGrid({ onOpenCreateMatch }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
      >
        <Link to={createPageUrl('Map')}>
          <div className="relative overflow-hidden bg-gradient-to-br from-[#121715] to-[#18221E] border border-[#223029] shadow-[0_8px_24px_rgba(0,0,0,0.3)] rounded-[20px] p-4 sm:p-5 min-h-[110px] sm:min-h-[120px] flex flex-col items-center justify-center group hover:border-[#2BA84A]/30 transition-all">
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-[#2BA84A]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
            />
            <motion.div
              whileHover={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
              className="relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-2xl flex items-center justify-center mb-3 shadow-[0_4px_16px_rgba(43,168,74,0.4)] group-hover:shadow-[0_6px_24px_rgba(43,168,74,0.6)] transition-all"
            >
              <MapPin className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" strokeWidth={2.5} />
            </motion.div>
            <span className="text-xs sm:text-sm font-bold text-[#F4F7F5] text-center leading-tight px-1">Hitta Planer</span>
          </div>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
      >
        <button onClick={onOpenCreateMatch} className="w-full">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#121715] to-[#18221E] border border-[#223029] shadow-[0_8px_24px_rgba(0,0,0,0.3)] rounded-[20px] p-4 sm:p-5 min-h-[110px] sm:min-h-[120px] flex flex-col items-center justify-center group hover:border-[#F4743B]/30 transition-all">
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-[#F4743B]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
            />
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.3 }}
              className="relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-[#F4743B] to-[#E5683A] rounded-2xl flex items-center justify-center mb-3 shadow-[0_4px_16px_rgba(244,116,59,0.4)] group-hover:shadow-[0_6px_24px_rgba(244,116,59,0.6)] transition-all"
            >
              <Plus className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" strokeWidth={2.5} />
            </motion.div>
            <span className="text-xs sm:text-sm font-bold text-[#F4F7F5] text-center leading-tight px-1">Skapa match</span>
          </div>
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
      >
        <Link to={createPageUrl('Community')}>
          <div className="relative overflow-hidden bg-gradient-to-br from-[#121715] to-[#18221E] border border-[#223029] shadow-[0_8px_24px_rgba(0,0,0,0.3)] rounded-[20px] p-4 sm:p-5 min-h-[110px] sm:min-h-[120px] flex flex-col items-center justify-center group hover:border-[#2BA84A]/30 transition-all">
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-[#2BA84A]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
            />
            <motion.div
              whileHover={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.4, repeat: Infinity }}
              className="relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-2xl flex items-center justify-center mb-3 shadow-[0_4px_16px_rgba(43,168,74,0.4)] group-hover:shadow-[0_6px_24px_rgba(43,168,74,0.6)] transition-all"
            >
              <Users className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" strokeWidth={2.5} />
            </motion.div>
            <span className="text-xs sm:text-sm font-bold text-[#F4F7F5] text-center leading-tight px-1">Vänner & lag</span>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}