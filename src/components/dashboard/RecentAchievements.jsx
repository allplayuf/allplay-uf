import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Star, Target, Users } from "lucide-react";

export default function RecentAchievements({ user }) {
  // Mock achievements based on user stats
  const achievements = [
    {
      id: 1,
      name: "Första matchen",
      description: "Spelade din första match!",
      icon: Target,
      earned: user?.matches_played >= 1,
      rarity: "common",
      date: "2024-01-15"
    },
    {
      id: 2,
      name: "MVP-stjärna",
      description: "Blev MVP i en match",
      icon: Star,
      earned: user?.mvp_count >= 1,
      rarity: "rare",
      date: "2024-01-20"
    },
    {
      id: 3,
      name: "Veteran",
      description: "Spelat 10 matcher",
      icon: Award,
      earned: user?.matches_played >= 10,
      rarity: "epic",
      date: null
    },
    {
      id: 4,
      name: "Lagspelare",
      description: "Spelat med 5 olika spelare",
      icon: Users,
      earned: false,
      rarity: "rare",
      date: null
    }
  ];

  const earnedAchievements = achievements.filter(a => a.earned);
  const nextAchievement = achievements.find(a => !a.earned);

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="shadow-allplay border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-primary-green" />
          Utmärkelser
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {earnedAchievements.length === 0 ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600">Inga utmärkelser än</p>
            <p className="text-xs text-gray-500 mt-1">Spela dina första matcher!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Senaste utmärkelser</h4>
            {earnedAchievements.slice(0, 3).map((achievement) => (
              <div key={achievement.id} className="flex items-center gap-3 p-3 bg-green-50/50 rounded-lg border border-green-100">
                <div className="w-10 h-10 bg-primary-green rounded-full flex items-center justify-center">
                  <achievement.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-medium text-gray-900">{achievement.name}</h5>
                    <Badge variant="outline" className={getRarityColor(achievement.rarity)}>
                      {achievement.rarity}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {nextAchievement && (
          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Nästa utmärkelse</h4>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <nextAchievement.icon className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-gray-700">{nextAchievement.name}</h5>
                <p className="text-xs text-gray-600">{nextAchievement.description}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}