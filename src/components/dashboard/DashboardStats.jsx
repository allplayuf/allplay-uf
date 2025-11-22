import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Flame } from "lucide-react";

export default function DashboardStats({ weeklyStats, user }) {
  return (
    <Card className="bg-gradient-to-br from-[#121715] to-[#18221E] rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-[#223029]">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-[#2BA84A]/20 to-[#2BA84A]/10 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-[#2BA84A]" strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font-bold text-[#F4F7F5]">Denna vecka</h3>
        </div>
        <div className="space-y-4">
          <ProgressBar 
            label="Matcher spelade" 
            current={weeklyStats.matchesPlayed} 
            target={weeklyStats.goal} 
            colorFrom="#2BA84A" 
            colorTo="#248232" 
          />
          
          <ProgressBar 
            label="MVPs" 
            current={weeklyStats.mvps} 
            target={3} // Assuming 3 is a good target for MVP
            colorFrom="#F4743B" 
            colorTo="#E5683A" 
            delay={0.2}
          />

          <div className="pt-2 border-t border-[#223029]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#B6C2BC]">Streak</span>
              <span className="text-base font-bold text-[#F4F7F5] flex items-center gap-1">
                <Flame className="w-4 h-4 text-[#F4743B]" />
                {user?.current_streak || 0} dagar
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressBar({ label, current, target, colorFrom, colorTo, delay = 0 }) {
  const percentage = Math.min((current / target) * 100, 100);
  
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-[#B6C2BC]">{label}</span>
        <span className="text-base font-bold text-[#F4F7F5]">{current}/{target}</span>
      </div>
      <div className="h-2 bg-[#18221E] rounded-full overflow-hidden border border-[#223029]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut", delay }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})` }}
        />
      </div>
    </div>
  );
}