import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Users, Star, TrendingUp, Award } from "lucide-react";

export default function StatsOverview({ user, recentMatches }) {
  const winRate = user?.matches_played > 0 
    ? Math.round((recentMatches.filter(m => m.status === 'completed').length / user.matches_played) * 100)
    : 0;

  const getSkillLevelText = (elo) => {
    if (elo < 1000) return "Nybörjare";
    if (elo < 1200) return "Fortsättare"; 
    if (elo < 1400) return "Erfaren";
    if (elo < 1600) return "Avancerad";
    return "Expert";
  };

  const getSkillProgress = (elo) => {
    const ranges = [
      { min: 0, max: 1000, name: "Nybörjare" },
      { min: 1000, max: 1200, name: "Fortsättare" },
      { min: 1200, max: 1400, name: "Erfaren" },
      { min: 1400, max: 1600, name: "Avancerad" },
      { min: 1600, max: 2000, name: "Expert" }
    ];

    const currentRange = ranges.find(r => elo >= r.min && elo < r.max) || ranges[ranges.length - 1];
    return ((elo - currentRange.min) / (currentRange.max - currentRange.min)) * 100;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* ELO Rating */}
      <Card className="shadow-allplay hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">Din ranking</CardTitle>
            <Trophy className="w-5 h-5 text-primary-green" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-3xl font-bold text-gray-900">
              {user?.elo_rating || 1200}
            </div>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              {getSkillLevelText(user?.elo_rating || 1200)}
            </Badge>
            <Progress value={getSkillProgress(user?.elo_rating || 1200)} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Matches Played */}
      <Card className="shadow-allplay hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">Spelade matcher</CardTitle>
            <Target className="w-5 h-5 text-blue-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-3xl font-bold text-gray-900">
              {user?.matches_played || 0}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-gray-600">
                {winRate}% framgångsrate
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MVP Awards */}
      <Card className="shadow-allplay hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">MVP-utmärkelser</CardTitle>
            <Star className="w-5 h-5 text-yellow-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-3xl font-bold text-gray-900">
              {user?.mvp_count || 0}
            </div>
            <div className="text-sm text-gray-600">
              {user?.matches_played > 0 
                ? `${Math.round((user?.mvp_count || 0) / user.matches_played * 100)}% av matcher`
                : 'Inga matcher än'
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Streak */}
      <Card className="shadow-allplay hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">Nuvarande streak</CardTitle>
            <Award className="w-5 h-5 text-orange-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-3xl font-bold text-gray-900">
              {user?.current_streak || 0}
            </div>
            <div className="text-sm text-gray-600">
              Längsta: {user?.longest_streak || 0} dagar
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}