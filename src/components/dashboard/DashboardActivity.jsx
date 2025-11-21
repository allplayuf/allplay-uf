import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Award } from "lucide-react";

export default function DashboardActivity({ activities }) {
  return (
    <Card className="bg-gradient-to-br from-[#121715] to-[#18221E] rounded-[20px] shadow-lg border border-[#223029]">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-[#F4743B]/10 rounded-xl flex items-center justify-center">
            <Award className="w-5 h-5 text-[#F4743B]" strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font-bold text-[#F4F7F5]">Senaste aktivitet</h3>
        </div>
        
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.slice(0, 3).map((activity, index) => {
              const Icon = activity.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-3 p-3 bg-[#0F1513] rounded-xl border border-[#223029] hover:border-[#2BA84A]/30 transition-all"
                >
                  <div className="w-10 h-10 bg-[#2BA84A]/15 rounded-lg flex items-center justify-center flex-shrink-0 ring-1 ring-[#2BA84A]/25">
                    <Icon className="w-5 h-5 text-[#2BA84A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#F4F7F5] line-clamp-1">{activity.text}</p>
                    <p className="text-xs text-[#B6C2BC] mt-1">{activity.time}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-[#B6C2BC]">Ingen aktivitet än</p>
            <p className="text-xs text-[#7B8A83] mt-1">Spela din första match för att se den här!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}