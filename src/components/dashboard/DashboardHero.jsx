import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Trophy,
  TrendingUp,
  Star,
  Sparkles,
  Flame,
  Zap,
  PlayCircle,
  ChevronRight
} from "lucide-react";

export default function DashboardHero({ user }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      className="relative overflow-hidden rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
    >
      {/* Animated Background Gradient */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'linear-gradient(135deg, #2BA84A 0%, #0F2917 100%)',
            'linear-gradient(135deg, #248232 0%, #1A5C2E 100%)',
            'linear-gradient(135deg, #2BA84A 0%, #0F2917 100%)',
          ]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* GREEN RINGS */}
      <div className="absolute top-[-30px] right-[-30px] w-28 h-28 bg-[#2BA84A]/40 rounded-full opacity-50"></div>
      <div className="absolute bottom-[-40px] left-[-40px] w-32 h-32 bg-[#0F2917]/60 rounded-full opacity-50"></div>

      {/* Animated Orbs */}
      <motion.div
        className="absolute top-[-100px] right-[-100px] w-64 h-64 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(43,168,74,0.4) 0%, transparent 70%)' }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-80px] left-[-80px] w-48 h-48 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(15,41,23,0.6) 0%, transparent 70%)' }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Floating Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white/20 rounded-full"
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
        {/* Profile Section */}
        <div className="flex items-start gap-4 mb-6">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-white/30 rounded-3xl blur-xl"></div>
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center border-2 border-white/40 shadow-2xl overflow-hidden">
              {user?.profile_image_url ? (
                <img src={user.profile_image_url} alt="Profile" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
                  {user?.full_name?.[0] || 'U'}
                </span>
              )}
            </div>
            {/* Online Pulse */}
            <motion.div
              className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-[#10B981] rounded-full border-3 border-white shadow-lg"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>

          <div className="flex-1 min-w-0">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl sm:text-3xl lg:text-[36px] lg:leading-[44px] font-bold text-white mb-2 drop-shadow-lg flex items-center gap-2 flex-wrap"
            >
              Välkommen tillbaka, {user?.full_name?.split(' ')[0]}!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white/90 text-sm sm:text-base lg:text-lg font-medium drop-shadow"
            >
              Dags att dominera planen idag! 🔥
            </motion.p>
          </div>
        </div>

        {/* Stats Grid - ENHANCED */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-3 sm:gap-4 mb-6"
        >
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-white/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/30 shadow-xl hover:border-white/50 transition-all">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white/80" strokeWidth={2.5} />
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-white/60" />
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-white mb-1 drop-shadow-lg">
                {user?.matches_played || 0}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-white/80 uppercase tracking-wide">
                Matcher
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ delay: 0.1 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#F4743B]/30 to-[#F4743B]/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/30 shadow-xl hover:border-[#F4743B]/50 transition-all">
              <div className="flex items-center justify-between mb-2">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-[#F4743B]" strokeWidth={2.5} fill="#F4743B" />
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[#F4743B]/80" />
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-white mb-1 drop-shadow-lg">
                {user?.mvp_count || 0}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-white/80 uppercase tracking-wide">
                MVPs
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ delay: 0.2 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#F4743B]/30 to-[#F4743B]/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/30 shadow-xl hover:border-[#F4743B]/50 transition-all">
              <div className="flex items-center justify-between mb-2">
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-[#F4743B]" strokeWidth={2.5} />
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-[#F4743B]/80" />
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-white mb-1 drop-shadow-lg flex items-center gap-2">
                {user?.current_streak || 0}
                {(user?.current_streak || 0) > 0 && (
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-2xl"
                  >
                    🔥
                  </motion.span>
                )}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-white/80 uppercase tracking-wide">
                Streak
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Primary CTA - ENHANCED */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link to={createPageUrl("Matches")}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={{
                boxShadow: [
                  '0 8px 24px rgba(255, 255, 255, 0.15)',
                  '0 12px 32px rgba(255, 255, 255, 0.25)',
                  '0 8px 24px rgba(255, 255, 255, 0.15)'
                ]
              }}
              transition={{
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
              className="relative w-full h-14 sm:h-16 rounded-2xl overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <motion.div
                className="absolute inset-0 bg-white/10"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                }}
              />
              <div className="relative h-full flex items-center justify-center gap-3 px-6">
                <PlayCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
                <span className="text-base sm:text-lg font-bold text-white">
                  Hitta spontana matcher nu
                </span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ChevronRight className="w-6 h-6 text-white" strokeWidth={2.5} />
                </motion.div>
              </div>
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}