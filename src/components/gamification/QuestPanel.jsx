import React, { useState, useEffect } from 'react';
import { Quest } from '@/entities/Quest';
import { UserQuest } from '@/entities/UserQuest';
import { UserXP } from '@/entities/UserXP';
import { User } from '@/entities/User';
import QuestCard from './QuestCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Calendar, Trophy } from 'lucide-react';
import { rewardEngine } from '@/components/utils/rewardEngine';

export default function QuestPanel({ user }) {
  const [quests, setQuests] = useState([]);
  const [userQuests, setUserQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuests();
  }, [user?.id]);

  const loadQuests = async () => {
    try {
      const allQuests = await Quest.filter({ is_active: true });
      const userQuestData = await UserQuest.filter({ user_id: user.id });
      
      setQuests(allQuests);
      setUserQuests(userQuestData);
    } catch (error) {
      console.error('Error loading quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimQuest = async (quest, userQuest) => {
    try {
      // Mark as claimed
      await UserQuest.update(userQuest.id, { claimed: true });
      
      // Award XP
      await rewardEngine.awardXP(user.id, 'quest.completed', { xp: quest.xp_reward });
      
      // Update user's total XP
      const userXPData = await UserXP.filter({ user_id: user.id });
      if (userXPData.length > 0) {
        const currentXP = userXPData[0];
        await UserXP.update(currentXP.id, {
          total_xp: currentXP.total_xp + quest.xp_reward,
          current_level_xp: currentXP.current_level_xp + quest.xp_reward
        });
      }
      
      loadQuests();
    } catch (error) {
      console.error('Error claiming quest:', error);
    }
  };

  const getQuestsByType = (type) => {
    return quests
      .filter(q => q.quest_type === type)
      .map(q => ({
        ...q,
        userProgress: userQuests.find(uq => uq.quest_id === q.id)
      }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-[#2BA84A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="bg-[#121715] p-1 border border-[#223029] w-full grid grid-cols-3 rounded-[14px]">
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Dagliga
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Veckovisa
          </TabsTrigger>
          <TabsTrigger value="seasonal" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Säsong
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-3 mt-4">
          {getQuestsByType('daily').length === 0 ? (
            <div className="text-center py-8 text-[#B6C2BC]">
              Inga dagliga quests tillgängliga just nu
            </div>
          ) : (
            getQuestsByType('daily').map(quest => (
              <QuestCard
                key={quest.id}
                quest={quest}
                userProgress={quest.userProgress}
                onClaim={handleClaimQuest}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="weekly" className="space-y-3 mt-4">
          {getQuestsByType('weekly').length === 0 ? (
            <div className="text-center py-8 text-[#B6C2BC]">
              Inga veckovisa quests tillgängliga just nu
            </div>
          ) : (
            getQuestsByType('weekly').map(quest => (
              <QuestCard
                key={quest.id}
                quest={quest}
                userProgress={quest.userProgress}
                onClaim={handleClaimQuest}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="seasonal" className="space-y-3 mt-4">
          {getQuestsByType('seasonal').length === 0 ? (
            <div className="text-center py-8 text-[#B6C2BC]">
              Inga säsongsquests tillgängliga just nu
            </div>
          ) : (
            getQuestsByType('seasonal').map(quest => (
              <QuestCard
                key={quest.id}
                quest={quest}
                userProgress={quest.userProgress}
                onClaim={handleClaimQuest}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}