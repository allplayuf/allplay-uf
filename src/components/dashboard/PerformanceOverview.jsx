import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Star, Flame, Clock, Award, Target } from "lucide-react";

export default function PerformanceOverview({ weeklyStats, recentActivity, user }) {
  const { matchesPlayed, mvps, goal } = weeklyStats;

  // Simple week data for sparkline
  const weekData = [
    { day: 'Mån', matches: Math.floor(Math.random() * 3) },
    { day: 'Tis', matches: Math.floor(Math.random() * 3) },
    { day: 'Ons', matches: Math.floor(Math.random() * 3) },
    { day: 'Tor', matches: Math.floor(Math.random() * 3) },
    { day: 'Fre', matches: Math.floor(Math.random() * 3) },
    { day: 'Lör', matches: matchesPlayed > 0 ? 1 : 0 },
    { day: 'Sön', matches: 0 }
  ];

  const maxMatches = Math.max(...weekData.map(d => d.matches), 1);

  return (
    <Card className="bg-gradient-to-br from-[#121715] to-[#0F2917]/30 rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-[#2BA84A]/20 overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2BA84A]/10 to-[#248232]/10 p-5 border-b border-[#2BA84A]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2BA84A]/20 rounded-xl flex items-center justify-center ring-2 ring-[#2BA84A]/30">
              <Target className="w-5 h-5 text-[#2BA84A]" strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-bold text-[#F4F7F5]">Din Prestanda</h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Matcher */}
            <div className="bg-[#18221E] rounded-xl p-3 border border-[#223029]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-[#2BA84A]/15 rounded-lg flex items-center justify-center">
                  <Trophy className="w-3.5 h-3.5 text-[#2BA84A]" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#2BA84A] mb-1">{matchesPlayed}</div>
              <div className="text-[10px] text-[#B6C2BC] font-medium">Matcher</div>
            </div>

            {/* MVPs */}
            <div className="bg-[#18221E] rounded-xl p-3 border border-[#223029]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-[#F4743B]/15 rounded-lg flex items-center justify-center">
                  <Star className="w-3.5 h-3.5 text-[#F4743B]" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#F4743B] mb-1">{mvps}</div>
              <div className="text-[10px] text-[#B6C2BC] font-medium">MVPs</div>
            </div>

            {/* Streak */}
            <div className="bg-gradient-to-br from-[#F59E0B]/10 to-[#D97706]/5 rounded-xl p-3 border border-[#F59E0B]/30">
              <div className="flex items-center gap-2 mb-2">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-7 h-7 bg-[#F59E0B]/20 rounded-lg flex items-center justify-center"
                >
                  <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
                </motion.div>
              </div>
              <div className="text-2xl font-black text-[#F59E0B] mb-1">{user?.current_streak || 0}</div>
              <div className="text-[10px] text-[#B6C2BC] font-medium">Streak</div>
            </div>
          </div>

          {/* Week Progress */}
          <div className="bg-[#18221E] rounded-xl p-4 border border-[#223029]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[#F4F7F5]">Veckomål</span>
              <span className="text-sm font-black text-[#2BA84A]">{matchesPlayed}/{goal}</span>
            </div>
            <div className="relative h-2 bg-[#0F1513] rounded-full overflow-hidden mb-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(matchesPlayed / goal) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#2BA84A] to-[#248232] rounded-full"
              />
            </div>

            {/* Mini Week Chart */}
            <div className="flex items-end justify-between gap-1 h-12">
              {weekData.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.matches / maxMatches) * 100}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="w-full bg-gradient-to-t from-[#2BA84A] to-[#248232] rounded-t"
                    style={{ minHeight: day.matches > 0 ? '4px' : '0' }}
                  />
                  <span className="text-[8px] text-[#7B8A83] font-medium">{day.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-[#F4F7F5] mb-3">Senaste</h4>
              <div className="space-y-2">
                {recentActivity.slice(0, 3).map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-[#18221E] rounded-xl border border-[#223029]"
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        activity.type === 'mvp' 
                          ? 'bg-gradient-to-br from-[#F4743B]/20 to-[#E5683A]/10 ring-1 ring-[#F4743B]/30' 
                          : 'bg-[#2BA84A]/15 ring-1 ring-[#2BA84A]/20'
                      }`}>
                        <Icon className={`w-4 h-4 ${
                          activity.type === 'mvp' ? 'text-[#F4743B]' : 'text-[#2BA84A]'
                        }`} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#F4F7F5] leading-snug truncate">{activity.text}</p>
                        <p className="text-[10px] text-[#7B8A83] flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {activity.time}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}