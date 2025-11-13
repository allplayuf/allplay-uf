import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Award, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function CupStatsCard({ user }) {
  // Fetch user's cup participations
  const { data: cupParticipations = [] } = useQuery({
    queryKey: ['userCupStats', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const participations = await base44.entities.CupParticipant.filter({
        user_id: user.id,
        status: 'confirmed'
      });
      
      return participations;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch cups the user has participated in
  const { data: userCups = [] } = useQuery({
    queryKey: ['userCups', user?.id],
    queryFn: async () => {
      if (cupParticipations.length === 0) return [];
      
      const cupIds = cupParticipations.map(p => p.cup_id);
      const allCups = await base44.entities.Cup.list();
      
      return allCups.filter(c => cupIds.includes(c.id));
    },
    enabled: cupParticipations.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const completedCups = userCups.filter(c => c.status === 'completed');
  const ongoingCups = userCups.filter(c => c.status === 'ongoing');

  if (cupParticipations.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-[#F4743B]" />
            <h3 className="font-bold text-[#F4F7F5]">Turneringsstatistik</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#0F1513] rounded-xl">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#9FC9AC]" />
                <span className="text-sm text-[#B6C2BC]">Totalt</span>
              </div>
              <span className="font-bold text-[#F4F7F5]">{cupParticipations.length}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#0F1513] rounded-xl">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#F4743B]" />
                <span className="text-sm text-[#B6C2BC]">Pågående</span>
              </div>
              <span className="font-bold text-[#F4743B]">{ongoingCups.length}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#0F1513] rounded-xl">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#2BA84A]" />
                <span className="text-sm text-[#B6C2BC]">Avslutade</span>
              </div>
              <span className="font-bold text-[#2BA84A]">{completedCups.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}