import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  UserCheck, UserX, Calendar, Trophy, 
  MessageSquare, Users, Layout
} from "lucide-react";
import { motion } from "framer-motion";
import { useCustomDialog } from "../ui/custom-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function CupAdminPanel({ cup, participants, groups, matches }) {
  const [activeAdminTab, setActiveAdminTab] = useState('signups');
  const { confirm, alert, DialogContainer } = useCustomDialog();
  const queryClient = useQueryClient();

  const updateParticipantMutation = useMutation({
    mutationFn: async ({ participantId, status }) => {
      await base44.entities.CupParticipant.update(participantId, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupDetails', cup.id] });
    }
  });

  const handleApproveParticipant = async (participant) => {
    const shouldApprove = await confirm(
      'Godkänn anmälan',
      `Vill du godkänna anmälan för ${participant.team?.name || participant.user?.full_name}?`,
      { type: 'confirm', confirmText: 'Godkänn', cancelText: 'Avbryt' }
    );

    if (!shouldApprove) return;

    updateParticipantMutation.mutate({ 
      participantId: participant.id, 
      status: 'confirmed' 
    });

    alert('Godkänd! ✅', 'Anmälan har godkänts.', { type: 'success' });
  };

  const handleRejectParticipant = async (participant) => {
    const shouldReject = await confirm(
      'Neka anmälan',
      `Är du säker på att du vill neka anmälan för ${participant.team?.name || participant.user?.full_name}?`,
      { type: 'warning', confirmText: 'Neka', cancelText: 'Avbryt' }
    );

    if (!shouldReject) return;

    updateParticipantMutation.mutate({ 
      participantId: participant.id, 
      status: 'rejected' 
    });

    alert('Nekad', 'Anmälan har nekats.', { type: 'info' });
  };

  const pendingParticipants = participants.filter(p => p.status === 'pending');
  const confirmedParticipants = participants.filter(p => p.status === 'confirmed');

  return (
    <>
      <DialogContainer />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Card className="bg-[#121715] border border-[#F4743B]/30 rounded-[20px] p-6">
          <h2 className="text-xl font-bold text-[#F4F7F5] mb-6 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#F4743B]" />
            Admin Panel
          </h2>

          <Tabs value={activeAdminTab} onValueChange={setActiveAdminTab}>
            <TabsList className="grid grid-cols-4 gap-2 bg-[#18221E] p-2 rounded-xl mb-6">
              <TabsTrigger value="signups" className="gap-2">
                <UserCheck className="w-4 h-4" />
                Anmälningar
              </TabsTrigger>
              <TabsTrigger value="groups" className="gap-2">
                <Layout className="w-4 h-4" />
                Grupper
              </TabsTrigger>
              <TabsTrigger value="schedule" className="gap-2">
                <Calendar className="w-4 h-4" />
                Schema
              </TabsTrigger>
              <TabsTrigger value="announce" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Meddelanden
              </TabsTrigger>
            </TabsList>

            {/* Signups Management */}
            <TabsContent value="signups">
              <div className="space-y-6">
                {/* Pending signups */}
                {pendingParticipants.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-[#F4F7F5] mb-4">
                      Väntande anmälningar ({pendingParticipants.length})
                    </h3>
                    <div className="space-y-3">
                      {pendingParticipants.map(participant => (
                        <Card key={participant.id} className="bg-[#18221E] border border-[#223029]">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-[#9FC9AC]" />
                                <div>
                                  <p className="font-semibold text-[#F4F7F5]">
                                    {participant.team?.name || participant.user?.full_name}
                                  </p>
                                  <p className="text-xs text-[#B6C2BC]">
                                    {participant.signup_type === 'team' ? 'Lag' : 'Solo spelare'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-[#2BA84A] hover:bg-[#248232] text-white gap-2"
                                  onClick={() => handleApproveParticipant(participant)}
                                >
                                  <UserCheck className="w-4 h-4" />
                                  Godkänn
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 gap-2"
                                  onClick={() => handleRejectParticipant(participant)}
                                >
                                  <UserX className="w-4 h-4" />
                                  Neka
                                </Button>
                              </div>
                            </div>
                            {participant.notes && (
                              <div className="mt-3 p-2 bg-[#0F1513] rounded-lg">
                                <p className="text-xs text-[#7B8A83] mb-1">Anteckningar:</p>
                                <p className="text-sm text-[#B6C2BC]">{participant.notes}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirmed signups */}
                <div>
                  <h3 className="text-lg font-bold text-[#F4F7F5] mb-4">
                    Godkända anmälningar ({confirmedParticipants.length})
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {confirmedParticipants.map(participant => (
                      <Card key={participant.id} className="bg-[#18221E] border border-[#223029]">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-[#2BA84A]" />
                            <div className="flex-1">
                              <p className="font-semibold text-[#F4F7F5] text-sm">
                                {participant.team?.name || participant.user?.full_name}
                              </p>
                              <p className="text-xs text-[#B6C2BC]">
                                {participant.group_id ? `Grupp: ${participant.group_name}` : 'Inte tilldelad grupp'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Groups Management */}
            <TabsContent value="groups">
              <div className="p-6 bg-[#18221E] border border-[#223029] rounded-xl text-center">
                <Layout className="w-12 h-12 text-[#7B8A83] mx-auto mb-3" />
                <p className="font-semibold text-[#F4F7F5] mb-2">Grupphantering</p>
                <p className="text-sm text-[#B6C2BC]">
                  Dra och släpp-funktionalitet för att organisera lag i grupper kommer snart
                </p>
              </div>
            </TabsContent>

            {/* Schedule Management */}
            <TabsContent value="schedule">
              <div className="p-6 bg-[#18221E] border border-[#223029] rounded-xl text-center">
                <Calendar className="w-12 h-12 text-[#7B8A83] mx-auto mb-3" />
                <p className="font-semibold text-[#F4F7F5] mb-2">Schemaläggning</p>
                <p className="text-sm text-[#B6C2BC]">
                  Automatisk schemaläggning och manuell redigering av matchtider
                </p>
              </div>
            </TabsContent>

            {/* Announcements */}
            <TabsContent value="announce">
              <div className="p-6 bg-[#18221E] border border-[#223029] rounded-xl text-center">
                <MessageSquare className="w-12 h-12 text-[#7B8A83] mx-auto mb-3" />
                <p className="font-semibold text-[#F4F7F5] mb-2">Skicka meddelanden</p>
                <p className="text-sm text-[#B6C2BC]">
                  Skicka push-notiser och meddelanden till alla deltagare
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </motion.div>
    </>
  );
}