import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function ActivityFeed({ activities }) {
  return (
    <Card className="bg-[#2D3A3A] border-2 border-[#248232] shadow-xl">
      <CardHeader className="border-b border-[#248232]/50 bg-[#248232]/10">
        <CardTitle className="flex items-center gap-2 text-lg text-[#FFFFFF]">
          <Bell className="w-5 h-5 text-[#2BA84A]" />
          Aktivitet
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-[#248232] mx-auto mb-3 opacity-50" />
            <p className="text-sm text-[#FFFFFF]/60">Ingen aktivitet än</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-start gap-3 p-4 bg-[#040F0F] rounded-xl hover:bg-[#248232]/20 transition-all border border-[#248232]/30 hover:border-[#2BA84A] cursor-pointer">
                  <div className="w-10 h-10 bg-[#2BA84A]/20 rounded-full flex items-center justify-center flex-shrink-0 border border-[#2BA84A]">
                    <Icon className="w-5 h-5 text-[#2BA84A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#FFFFFF] font-medium">{activity.text}</p>
                    <p className="text-xs text-[#FFFFFF]/50 mt-1 font-medium">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}