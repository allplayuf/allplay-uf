import React from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Star, Sparkles, Flame, Zap, PlayCircle, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function DashboardHeader({ user }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      className="relative overflow-hidden rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.4)] group"
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

      {/* Decorative Elements */}
      <div className="absolute top-[-30px] right-[-30px] w-28 h-28 bg-[#2BA84A]/40 rounded-full opacity-50 blur-xl"></div>
      <div className="absolute bottom-[-40px] left-[-40px] w-32 h-32 bg-[#0F2917]/60 rounded-full opacity-50 blur-xl"></div>

      {/* Floating Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-white/20 rounded-full"
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-white/30 rounded-3xl blur-xl"></div>
            <div className="relative w-20 h-20 lg:w-24 lg:h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center border-2 border-white/40 shadow-2xl overflow-hidden">
              {user?.profile_image_url ? (
                <img src={user.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
                  {user?.full_name?.[0] || 'U'}
                </span>
              )}
            </div>
            {/* Online Pulse */}
            <motion.div
              className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#10B981] rounded-full border-[3px] border-white shadow-lg"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>

          <div className="flex-1 min-w-0">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl lg:text-4xl font-bold text-white mb-2 drop-shadow-lg flex items-center gap-2 flex-wrap"
            >
              Hej, {user?.full_name?.split(' ')[0]}!
              <motion.span
                animate={{ rotate: [0, 20, -20, 20, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
              >
                👋
              </motion.span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white/90 text-base lg:text-lg font-medium drop-shadow"
            >
              Redo för dagens utmaningar? ⚽
            </motion.p>
          </div>
        </div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-3 sm:gap-4 mb-8"
        >
          <StatCard 
            icon={Trophy} 
            secondaryIcon={TrendingUp} 
            value={user?.matches_played || 0} 
            label="Matcher" 
            delay={0} 
          />
          <StatCard 
            icon={Star} 
            secondaryIcon={Sparkles} 
            value={user?.mvp_count || 0} 
            label="MVPs" 
            delay={0.1} 
            color="#F4743B" 
          />
          <StatCard 
            icon={Flame} 
            secondaryIcon={Zap} 
            value={user?.current_streak || 0} 
            label="Streak" 
            delay={0.2} 
            color="#F4743B"
            isStreak={true}
          />
        </motion.div>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link to={createPageUrl("Matches")}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative w-full h-16 rounded-2xl overflow-hidden group shadow-lg hover:shadow-2xl transition-all"
            >
              <div className="absolute inset-0 bg-white/20 backdrop-blur-sm group-hover:bg-white/25 transition-colors"></div>
              <div className="relative h-full flex items-center justify-center gap-3 px-6">
                <PlayCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
                <span className="text-lg font-bold text-white">
                  Hitta match nu
                </span>
                <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
              </div>
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon: Icon, secondaryIcon: SecondaryIcon, value, label, delay, color = "white", isStreak = false }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ delay }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className={`relative bg-white/15 backdrop-blur-md rounded-2xl p-4 lg:p-5 border border-white/30 shadow-xl hover:border-white/50 transition-all`}>
        <div className="flex items-center justify-between mb-2">
          <Icon className="w-5 h-5 lg:w-6 lg:h-6" style={{ color }} strokeWidth={2.5} />
          <SecondaryIcon className="w-3 h-3 lg:w-4 lg:h-4" style={{ color: color === 'white' ? 'rgba(255,255,255,0.6)' : 'rgba(244,116,59,0.8)' }} />
        </div>
        <div className="text-2xl lg:text-4xl font-bold text-white mb-1 drop-shadow-lg flex items-center gap-2">
          {value}
          {isStreak && value > 0 && (
            <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }} className="text-xl lg:text-2xl">
              🔥
            </motion.span>
          )}
        </div>
        <div className="text-xs lg:text-sm font-semibold text-white/80 uppercase tracking-wide">
          {label}
        </div>
      </div>
    </motion.div>
  );
}