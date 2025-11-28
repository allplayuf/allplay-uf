import React from "react";
import { motion } from "framer-motion";
import { Trophy, Calendar, MapPin, Users, Target, Shield } from "lucide-react";

export default function CupHeroCard({ cup, statusConfig, confirmedCount, canManage, onAdminClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative overflow-hidden rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.4)] mb-8"
    >
      {canManage && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAdminClick}
          className="absolute top-6 right-6 z-50 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white p-2.5 rounded-xl shadow-lg transition-all group"
          title="Adminpanel"
        >
          <Shield className="w-5 h-5 group-hover:text-[#F59E0B] transition-colors" />
        </motion.button>
      )}

      {/* Animated Background Gradient */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
            'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
          ]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* GOLDEN RINGS */}
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border-2 border-white/10"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border-2 border-white/10"
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Animated Orbs */}
      <motion.div
        className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"
        animate={{
          x: [0, 20, 0],
          y: [0, -20, 0],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-10 left-10 w-40 h-40 bg-[#B45309]/60 rounded-full blur-3xl"
        animate={{
          x: [0, -20, 0],
          y: [0, 20, 0],
          opacity: [0.4, 0.6, 0.4]
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Floating Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white/30 rounded-full"
          style={{
            left: `${20 + i * 15}%`,
            top: `${30 + (i % 3) * 20}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}

      <div className="relative z-10 p-6 sm:p-8 lg:p-10">
        {/* Cup Logo & Title */}
        <div className="flex items-start gap-4 sm:gap-6 mb-6">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="relative flex-shrink-0"
          >
            <div className="absolute inset-0 bg-white/30 rounded-3xl blur-xl"></div>
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center border-2 border-white/40 shadow-2xl overflow-hidden">
              {cup.logo_url ? (
                <img src={cup.logo_url} alt={cup.name} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <Trophy className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-white" strokeWidth={2} />
              )}
            </div>
          </motion.div>

          <div className="flex-1 min-w-0">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl sm:text-3xl lg:text-[36px] lg:leading-[44px] font-bold text-white mb-2 drop-shadow-lg"
            >
              {cup.name}
            </motion.h1>
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${statusConfig.color} border-0 font-semibold text-sm shadow-lg`}>
                <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor} animate-pulse`}></div>
                {statusConfig.label}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-white/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-white/15 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/30 shadow-xl hover:border-white/50 transition-all">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mb-1 drop-shadow-lg truncate">
                {cup.location}
              </div>
              <div className="text-[10px] sm:text-xs font-semibold text-white/80 uppercase tracking-wide">
                Plats
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-white/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-white/15 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/30 shadow-xl hover:border-white/50 transition-all">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mb-1 drop-shadow-lg">
                {new Date(cup.start_date).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
              </div>
              <div className="text-[10px] sm:text-xs font-semibold text-white/80 uppercase tracking-wide">
                Datum
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-white/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-white/15 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/30 shadow-xl hover:border-white/50 transition-all">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mb-1 drop-shadow-lg">
                {confirmedCount}/{cup.max_participants}
              </div>
              <div className="text-[10px] sm:text-xs font-semibold text-white/80 uppercase tracking-wide">
                Anmälda
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-white/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-white/15 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/30 shadow-xl hover:border-white/50 transition-all">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mb-1 drop-shadow-lg">
                {cup.format}
              </div>
              <div className="text-[10px] sm:text-xs font-semibold text-white/80 uppercase tracking-wide">
                Format
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}