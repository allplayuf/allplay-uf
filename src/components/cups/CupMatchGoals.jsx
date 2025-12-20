import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, Target, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import AddGoalsModal from './AddGoalsModal';

export default function CupMatchGoals({ matchId, cupMatch, isAdmin }) {
  const [showAddGoals, setShowAddGoals] = useState(false);
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['cupMatchGoals', matchId],
    queryFn: async () => {
      const cupMatchData = await base44.entities.CupMatch.filter({ match_id: matchId });
      if (cupMatchData.length === 0) return [];
      
      const cupGoals = await base44.entities.CupGoal.filter({ cup_match_id: cupMatchData[0].id });
      
      // Fetch player data for each goal
      const goalsWithPlayers = await Promise.all(
        cupGoals.map(async (goal) => {
          const player = await base44.entities.CupPlayer.get(goal.player_id).catch(() => null);
          const team = await base44.entities.Team.get(goal.team_id).catch(() => null);
          return {
            ...goal,
            player_name: player?.name || 'Okänd spelare',
            team_name: team?.name || 'Okänt lag'
          };
        })
      );
      
      return goalsWithPlayers.sort((a, b) => a.minute - b.minute);
    },
    enabled: !!matchId
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  const matchHasResult = cupMatch && cupMatch.team_a_score !== null && cupMatch.team_a_score !== undefined;

  if (goals.length === 0) {
    return (
      <div>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-[#7B8A83]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-[#7B8A83]" />
          </div>
          <h3 className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5] mb-2">Inga mål registrerade</h3>
          <p className="text-[14px] leading-[20px] text-[#B6C2BC]">Mål visas här när matchen rapporteras</p>
        </div>

        {isAdmin && matchHasResult && (
          <div className="flex justify-center mt-4">
            <Button
              onClick={() => setShowAddGoals(true)}
              className="bg-[#2BA84A] hover:bg-[#248232] text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Lägg till målöversikt
            </Button>
          </div>
        )}

        {showAddGoals && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl"
            >
              <AddGoalsModal
                match={cupMatch}
                onClose={() => setShowAddGoals(false)}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ['cupMatchGoals', matchId] });
                  setShowAddGoals(false);
                }}
              />
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3 mb-4">
        {goals.map((goal, index) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="flex items-center gap-4 p-4 bg-[#0F1513] rounded-xl border border-[#223029] hover:border-[#F59E0B]/30 transition-all"
          >
            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-xl flex items-center justify-center shadow-lg">
              <div className="text-center">
                <div className="text-white font-black text-lg leading-none">{goal.minute}'</div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
                <span className="font-bold text-[#F4F7F5] text-[15px] truncate">{goal.player_name}</span>
              </div>
              <div className="text-[13px] text-[#B6C2BC] truncate">{goal.team_name}</div>
            </div>

            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-[#2BA84A]/20 rounded-full flex items-center justify-center ring-2 ring-[#2BA84A]/30">
                <span className="text-xl">⚽</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {isAdmin && matchHasResult && (
        <>
          <div className="flex justify-center">
            <Button
              onClick={() => setShowAddGoals(true)}
              variant="outline"
              className="border-[#223029] text-[#2BA84A] hover:bg-[#2BA84A]/10 gap-2"
            >
              <Plus className="w-4 h-4" />
              Lägg till fler mål
            </Button>
          </div>

          {showAddGoals && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl"
              >
                <AddGoalsModal
                  match={cupMatch}
                  onClose={() => setShowAddGoals(false)}
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['cupMatchGoals', matchId] });
                    setShowAddGoals(false);
                  }}
                />
              </motion.div>
            </div>
          )}
        </>
      )}
    </div>
  );
}