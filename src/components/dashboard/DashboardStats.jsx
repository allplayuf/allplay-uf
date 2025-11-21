import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Target, Flame } from "lucide-react";

export default function DashboardStats({ weeklyStats, currentStreak }) {
  return (
    <Card className="bg-gradient-to-br from-[#121715] to-[#18221E] rounded-[20px] shadow-lg border border-[#223029]">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-[#2BA84A]/10 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-[#2BA84A]" strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font-bold text-[#F4F7F5]">Denna vecka</h3>
        </div>
        <div className="space-y-5">
          <StatBar 
            label="Matcher spelade" 
            current={weeklyStats.matchesPlayed} 
            total={weeklyStats.goal} 
            color="from-[#2BA84A] to-[#248232]" 
          />
          <StatBar 
            label="MVPs" 
            current={weeklyStats.mvps} 
            total={3} 
            color="from-[#F4743B] to-[#E5683A]" 
            delay={0.2}
          />
          
          <div className="pt-2 border-t border-[#223029]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#B6C2BC]">Streak</span>
              <span className="text-base font-bold text-[#F4F7F5] flex items-center gap-1">
                <Flame className="w-4 h-4 text-[#F4743B]" />
                {currentStreak || 0} dagar
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatBar({ label, current, total, color, delay = 0 }) {
  const percentage = Math.min((current / total) * 100, 100);
  
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-[#B6C2BC]">{label}</span>
        <span className="text-base font-bold text-[#F4F7F5]">{current}/{total}</span>
      </div>
      <div className="h-2.5 bg-[#0F1513] rounded-full overflow-hidden border border-[#223029]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut", delay }}
          className={`h-full bg-gradient-to-r ${color} rounded-full`}
        />
      </div>
    </div>
  );
}