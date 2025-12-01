import React from "react";
import { motion } from "framer-motion";
import { Trophy, Calendar, MapPin, Users, Target, Shield } from "lucide-react";

export default function CupHeroCard({ cup, statusConfig, confirmedCount, canManage, onAdminClick }) {
  const heroLogo = cup.detail_logo_url || cup.logo_url;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.5)] mb-8 border border-[#F59E0B]/30"
    >
      {canManage && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAdminClick}
          className="absolute top-4 lg:top-6 right-4 lg:right-6 z-50 bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-white/20 text-white p-2.5 lg:p-3 rounded-xl shadow-2xl transition-all group"
          title="Adminpanel"
        >
          <Shield className="w-5 h-5 group-hover:text-[#F59E0B] transition-colors" />
        </motion.button>
      )}

      {/* Dark gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] via-[#0F1513] to-[#0A0D0B]"></div>
      
      {/* Golden animated overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-[#F59E0B]/25 via-[#D97706]/15 to-transparent"
        animate={{
          opacity: [0.4, 0.6, 0.4]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Enhanced Glowing Rings */}
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] lg:w-[700px] lg:h-[700px] rounded-full border-2 border-[#F59E0B]/20"
        animate={{
          scale: [1, 1.15, 1],
          rotate: [0, 90, 0],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] lg:w-[900px] lg:h-[900px] rounded-full border border-[#FFD700]/10"
        animate={{
          scale: [1.1, 1, 1.1],
          rotate: [0, -90, 0],
          opacity: [0.15, 0.3, 0.15]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />

      {/* Ambient Orbs */}
      <motion.div
        className="absolute top-10 lg:top-20 right-10 lg:right-20 w-32 h-32 lg:w-48 lg:h-48 bg-[#F59E0B]/20 rounded-full blur-3xl"
        animate={{
          x: [0, 30, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-10 lg:bottom-20 left-10 lg:left-20 w-40 h-40 lg:w-56 lg:h-56 bg-[#FFD700]/15 rounded-full blur-3xl"
        animate={{
          x: [0, -20, 0],
          y: [0, 20, 0],
          scale: [1, 1.15, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Floating Light Particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 lg:w-2 lg:h-2 bg-[#FFD700]/60 rounded-full"
          style={{
            left: `${15 + i * 12}%`,
            top: `${25 + (i % 4) * 20}%`,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0.2, 0.7, 0.2],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.4,
          }}
        />
      ))}

      <div className="relative z-10 p-6 sm:p-8 lg:p-12">
        {/* Enhanced Logo & Title Section */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-8 mb-8 lg:mb-10">
          
          {/* PREMIUM Hero Logo with 3D Effect */}
          {heroLogo && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotateY: -30 }}
              animate={{ 
                scale: 1,
                opacity: 1,
                rotateY: 0
              }}
              transition={{ 
                duration: 0.8,
                ease: "easeOut"
              }}
              className="relative group perspective-1000"
            >
              {/* Epic Glow */}
              <motion.div 
                className="absolute -inset-6 bg-gradient-to-r from-[#F59E0B]/50 via-[#FFD700]/50 to-[#F59E0B]/50 rounded-full blur-3xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              
              {/* Logo Frame */}
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-3xl overflow-hidden border-4 border-[#FFD700]/60 shadow-[0_25px_80px_rgba(255,215,0,0.4)] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm transform group-hover:rotate-3 transition-transform duration-500">
                <img 
                  src={heroLogo} 
                  alt={cup.name} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              
              {/* Corner Accents */}
              <div className="absolute -top-3 -right-3 w-8 h-8 border-t-4 border-r-4 border-[#FFD700] rounded-tr-2xl"></div>
              <div className="absolute -bottom-3 -left-3 w-8 h-8 border-b-4 border-l-4 border-[#FFD700] rounded-bl-2xl"></div>
              
              {/* Shine Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"
                animate={{
                  x: ['-100%', '200%']
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          )}

          {/* Title Section */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-2 lg:gap-3 mb-4"
            >
              <div className={`inline-flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-2.5 rounded-full ${statusConfig.color} border-0 font-bold text-sm lg:text-base shadow-2xl ring-2 ring-white/30`}>
                <div className={`w-2.5 h-2.5 rounded-full ${statusConfig.dotColor} ${cup.status === 'completed' ? '' : 'animate-pulse'}`}></div>
                {statusConfig.label}
              </div>
              {cup.status === 'completed' && cup.winner_team_name && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="inline-flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-2.5 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white border-0 font-bold text-sm lg:text-base shadow-2xl ring-2 ring-[#FFD700]/50"
                >
                  <Trophy className="w-4 h-4" />
                  Vinnare: {cup.winner_team_name}
                </motion.div>
              )}
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl sm:text-4xl lg:text-6xl font-black text-white tracking-tight mb-3 lg:mb-4 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
            >
              {cup.name}
            </motion.h1>
            
            {cup.description && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-white/95 text-base lg:text-xl font-medium max-w-3xl leading-relaxed mx-auto lg:mx-0"
              >
                {cup.description}
              </motion.p>
            )}
          </div>
        </div>

        {/* Premium Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5"
        >
          <motion.div 
            whileHover={{ y: -6, scale: 1.03 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#F59E0B]/30 to-[#D97706]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl rounded-2xl p-4 lg:p-5 border border-white/40 shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:border-[#F59E0B]/60 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-[#F59E0B]/20 flex items-center justify-center ring-2 ring-[#F59E0B]/30">
                  <MapPin className="w-4 h-4 lg:w-5 lg:h-5 text-[#FFD700]" strokeWidth={2.5} />
                </div>
                <span className="text-white/70 text-[10px] lg:text-xs font-bold uppercase tracking-wider">Plats</span>
              </div>
              <p className="text-white font-black text-lg lg:text-2xl truncate drop-shadow-lg">
                {cup.location}
              </p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -6, scale: 1.03 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#4169E1]/30 to-[#3457D5]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl rounded-2xl p-4 lg:p-5 border border-white/40 shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:border-[#4169E1]/60 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-[#4169E1]/20 flex items-center justify-center ring-2 ring-[#4169E1]/30">
                  <Calendar className="w-4 h-4 lg:w-5 lg:h-5 text-[#93C5FD]" strokeWidth={2.5} />
                </div>
                <span className="text-white/70 text-[10px] lg:text-xs font-bold uppercase tracking-wider">Datum</span>
              </div>
              <p className="text-white font-black text-lg lg:text-2xl drop-shadow-lg">
                {new Date(cup.start_date).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -6, scale: 1.03 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#2BA84A]/30 to-[#248232]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl rounded-2xl p-4 lg:p-5 border border-white/40 shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:border-[#2BA84A]/60 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-[#2BA84A]/20 flex items-center justify-center ring-2 ring-[#2BA84A]/30">
                  <Users className="w-4 h-4 lg:w-5 lg:h-5 text-[#86EFAC]" strokeWidth={2.5} />
                </div>
                <span className="text-white/70 text-[10px] lg:text-xs font-bold uppercase tracking-wider">Anmälda</span>
              </div>
              <p className="text-white font-black text-lg lg:text-2xl drop-shadow-lg">
                {confirmedCount}/{cup.max_participants}
              </p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -6, scale: 1.03 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#9370DB]/30 to-[#7C3AED]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl rounded-2xl p-4 lg:p-5 border border-white/40 shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:border-[#9370DB]/60 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-[#9370DB]/20 flex items-center justify-center ring-2 ring-[#9370DB]/30">
                  <Target className="w-4 h-4 lg:w-5 lg:h-5 text-[#DDD6FE]" strokeWidth={2.5} />
                </div>
                <span className="text-white/70 text-[10px] lg:text-xs font-bold uppercase tracking-wider">Format</span>
              </div>
              <p className="text-white font-black text-lg lg:text-2xl drop-shadow-lg">
                {cup.format}
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}