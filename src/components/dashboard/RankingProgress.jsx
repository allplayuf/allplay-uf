import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Trophy } from "lucide-react";

export default function RankingProgress({ user }) {
  const elo = user?.elo_rating || 1200;
  
  const skillLevels = [
    { name: "Nybörjare", min: 0, max: 1000, color: "gray" },
    { name: "Fortsättare", min: 1000, max: 1200, color: "blue" },
    { name: "Erfaren", min: 1200, max: 1400, color: "green" },
    { name: "Avancerad", min: 1400, max: 1600, color: "yellow" },
    { name: "Expert", min: 1600, max: 2000, color: "purple" }
  ];

  const currentLevel = skillLevels.find(level => elo >= level.min && elo < level.max) || skillLevels[skillLevels.length - 1];
  const nextLevel = skillLevels[skillLevels.indexOf(currentLevel) + 1];
  
  const progressInLevel = nextLevel 
    ? ((elo - currentLevel.min) / (currentLevel.max - currentLevel.min)) * 100
    : 100;

  const pointsToNext = nextLevel ? nextLevel.min - elo : 0;

  return (
    <Card className="shadow-allplay border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary-green" />
          Din ranking
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">{elo}</div>
          <Badge className={`bg-${currentLevel.color}-100 text-${currentLevel.color}-800 border-${currentLevel.color}-200`}>
            {currentLevel.name}
          </Badge>
        </div>

        {nextLevel && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Framsteg till {nextLevel.name}</span>
              <span className="font-medium text-gray-900">{Math.round(progressInLevel)}%</span>
            </div>
            <Progress value={progressInLevel} className="h-3" />
            <div className="text-center">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-primary-green">{pointsToNext}</span> poäng kvar
              </p>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-100 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Spelade matcher</span>
            <span className="font-medium">{user?.matches_played || 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">MVP-utmärkelser</span>
            <span className="font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-primary-green" />
              {user?.mvp_count || 0}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}