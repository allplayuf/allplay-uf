import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Trophy, Users, Flame, CheckCircle } from "lucide-react";

export default function WeeklyGoals({ user }) {
  const goals = [
    {
      icon: Target,
      title: "Spela 5 matcher",
      current: Math.min(user?.matches_played || 0, 5),
      target: 5,
      color: "text-[#2BA84A]",
      bgColor: "bg-[#2BA84A]/20",
      borderColor: "border-[#2BA84A]"
    },
    {
      icon: Trophy,
      title: "Vinn 1 MVP",
      current: Math.min(user?.mvp_count || 0, 1),
      target: 1,
      color: "text-[#F4743B]",
      bgColor: "bg-[#F4743B]/20",
      borderColor: "border-[#F4743B]"
    },
    {
      icon: Users,
      title: "Spela med 3 nya spelare",
      current: 0,
      target: 3,
      color: "text-[#2BA84A]",
      bgColor: "bg-[#2BA84A]/20",
      borderColor: "border-[#2BA84A]"
    },
    {
      icon: Flame,
      title: "Behåll 7-dagars streak",
      current: Math.min(user?.current_streak || 0, 7),
      target: 7,
      color: "text-[#F4743B]",
      bgColor: "bg-[#F4743B]/20",
      borderColor: "border-[#F4743B]"
    }
  ];

  return (
    <Card className="bg-[#2D3A3A] border-2 border-[#248232] shadow-xl">
      <CardHeader className="border-b border-[#248232]/50 bg-[#248232]/10">
        <CardTitle className="flex items-center gap-2 text-[#FFFFFF]">
          <Target className="w-5 h-5 text-[#2BA84A]" />
          Veckans mål
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid md:grid-cols-2 gap-6">
          {goals.map((goal, index) => {
            const Icon = goal.icon;
            const progress = (goal.current / goal.target) * 100;
            const isCompleted = goal.current >= goal.target;

            return (
              <div key={index} className="space-y-3 p-4 bg-[#040F0F] rounded-xl border border-[#248232]/30 hover:border-[#2BA84A] transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 ${goal.bgColor} rounded-xl flex items-center justify-center border-2 ${goal.borderColor}`}>
                    <Icon className={`w-7 h-7 ${goal.color}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-[#FFFFFF]">{goal.title}</h4>
                    <p className="text-sm text-[#FFFFFF]/70 font-medium">
                      {goal.current}/{goal.target}
                    </p>
                  </div>
                  {isCompleted && (
                    <div className="w-8 h-8 bg-[#2BA84A] rounded-full flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-5 h-5 text-[#FFFFFF]" />
                    </div>
                  )}
                </div>
                <div className="relative">
                  <Progress value={progress} className="h-3 bg-[#2D3A3A] border border-[#248232]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#FFFFFF] drop-shadow-md">
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}