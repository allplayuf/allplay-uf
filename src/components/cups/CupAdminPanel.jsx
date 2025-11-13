import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, XCircle, Users, Calendar, Bell, Edit, Trophy } from "lucide-react";
import { useCustomDialog } from "../ui/custom-dialog";
import { CUPS_QUERY_KEY } from "../dashboard/CupsWidget";
import EditCupModal from "./EditCupModal";
import { AnimatePresence, motion } from "framer-motion";

export default function CupAdminPanel({ cup, participants, groups, matches }) {
  const { confirm, alert, DialogContainer } = useCustomDialog();
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);

  const pendingParticipants = participants.filter(p => p.status === 'pending');
  const confirmedParticipants = participants.filter(p => p.status === 'confirmed');

  // FIX: Kolla om MATCHER finns, inte bara grupper
  const scheduleExists = matches.length > 0;

  const approveSignupMutation = useMutation({
    mutationFn: async (participantId) => {
      const response = await base44.functions.invoke('cups/manageSignup', {
        participant_id: participantId,
        action: 'approve'
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupDetails', cup.id] });
      queryClient.invalidateQueries({ queryKey: CUPS_QUERY_KEY });
      alert('Anmälan godkänd! ✅', 'Deltagaren har godkänts.', { type: 'success' });
    },
    onError: (error) => {
      alert('Fel', error.response?.data?.error || 'Kunde inte godkänna anmälan.', { type: 'alert' });
    }
  });

  const rejectSignupMutation = useMutation({
    mutationFn: async (participantId) => {
      const response = await base44.functions.invoke('cups/manageSignup', {
        participant_id: participantId,
        action: 'reject'
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupDetails', cup.id] });
      queryClient.invalidateQueries({ queryKey: CUPS_QUERY_KEY });
      alert('Anmälan nekad', 'Deltagaren har nekats.', { type: 'info' });
    },
    onError: (error) => {
      alert('Fel', error.response?.data?.error || 'Kunde inte neka anmälan.', { type: 'alert' });
    }
  });

  const createScheduleMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('cups/createSchedule', {
        cup_id: cup.id
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupDetails', cup.id] });
      queryClient.invalidateQueries({ queryKey: CUPS_QUERY_KEY });
      alert('Schema skapat! 📅', 'Matchschemat har skapats framgångsrikt!', { type: 'success' });
    },
    onError: (error) => {
      alert('Fel', error.response?.data?.error || 'Kunde inte skapa schema.', { type: 'alert' });
    }
  });

  const handleApprove = async (participantId) => {
    const shouldApprove = await confirm(
      'Godkänn anmälan',
      'Är du säker på att du vill godkänna denna anmälan?',
      { type: 'confirm', confirmText: 'Godkänn', cancelText: 'Avbryt' }
    );

    if (!shouldApprove) return;
    approveSignupMutation.mutate(participantId);
  };

  const handleReject = async (participantId) => {
    const shouldReject = await confirm(
      'Neka anmälan',
      'Är du säker på att du vill neka denna anmälan?',
      { type: 'warning', confirmText: 'Neka', cancelText: 'Avbryt' }
    );

    if (!shouldReject) return;
    rejectSignupMutation.mutate(participantId);
  };

  const handleCreateSchedule = async () => {
    if (confirmedParticipants.length < 4) {
      alert('För få deltagare', 'Du behöver minst 4 bekräftade deltagare för att skapa ett schema.', { type: 'alert' });
      return;
    }

    const shouldCreate = await confirm(
      'Skapa matchschema',
      'Detta kommer att skapa grupper och matcher för turneringen. Är du säker?',
      { type: 'confirm', confirmText: 'Skapa', cancelText: 'Avbryt' }
    );

    if (!shouldCreate) return;
    createScheduleMutation.mutate();
  };

  return (
    <>
      <DialogContainer />
      
      <AnimatePresence>
        {showEditModal && (
          <EditCupModal
            cup={cup}
            onClose={() => setShowEditModal(false)}
          />
        )}
      </AnimatePresence>
      
      <div className="space-y-6">
        
        {/* Header - KONSISTENT DESIGN */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-[#F59E0B] via-[#F59E0B] to-[#D97706] border-0 rounded-2xl shadow-[0_8px_24px_rgba(245,158,11,0.3)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-2 ring-white/30">
                    <Shield className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                      Admin Panel
                      <Trophy className="w-5 h-5" />
                    </h2>
                    <p className="text-sm text-white/90 font-medium">Hantera {cup.name}</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowEditModal(true)}
                  className="h-11 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-2 border-white/30 gap-2 font-semibold shadow-lg"
                >
                  <Edit className="w-4 h-4" />
                  <span className="hidden sm:inline">Redigera</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats - NY SEKTION */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-[#121715] border-[#223029] rounded-xl shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
              <CardContent className="p-5 text-center">
                <Users className="w-6 h-6 text-[#F59E0B] mx-auto mb-2" />
                <div className="text-2xl font-bold text-[#F4F7F5] mb-1">{participants.length}</div>
                <div className="text-xs text-[#B6C2BC] font-medium">Totalt anmälda</div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#121715] border-[#223029] rounded-xl shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
              <CardContent className="p-5 text-center">
                <CheckCircle className="w-6 h-6 text-[#2BA84A] mx-auto mb-2" />
                <div className="text-2xl font-bold text-[#2BA84A] mb-1">{confirmedParticipants.length}</div>
                <div className="text-xs text-[#B6C2BC] font-medium">Bekräftade</div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#121715] border-[#223029] rounded-xl shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
              <CardContent className="p-5 text-center">
                <Trophy className="w-6 h-6 text-[#F59E0B] mx-auto mb-2" />
                <div className="text-2xl font-bold text-[#F4F7F5] mb-1">{groups.length}</div>
                <div className="text-xs text-[#B6C2BC] font-medium">Grupper</div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#121715] border-[#223029] rounded-xl shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
              <CardContent className="p-5 text-center">
                <Calendar className="w-6 h-6 text-[#F59E0B] mx-auto mb-2" />
                <div className="text-2xl font-bold text-[#F4F7F5] mb-1">{matches.length}</div>
                <div className="text-xs text-[#B6C2BC] font-medium">Matcher</div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Quick Actions - UPPDATERAD DESIGN MED FIX */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="bg-[#121715] border-[#223029] rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
            <CardHeader className="border-b border-[#223029]">
              <CardTitle className="text-lg font-bold text-[#F4F7F5] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#F59E0B]" />
                Snabbåtgärder
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Button
                onClick={handleCreateSchedule}
                disabled={createScheduleMutation.isPending || scheduleExists || confirmedParticipants.length < 4}
                className="w-full h-12 bg-[#F59E0B] hover:bg-[#D97706] text-[#FFFFFF] gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                <Calendar className="w-5 h-5" />
                {scheduleExists ? '✓ Schema skapat' : 
                 confirmedParticipants.length < 4 ? `Behöver ${4 - confirmedParticipants.length} fler deltagare` : 
                 'Skapa matchschema'}
              </Button>

              <Button
                variant="outline"
                className="w-full h-12 border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] hover:text-[#F4F7F5] gap-2 font-semibold"
              >
                <Bell className="w-5 h-5" />
                Skicka meddelande till alla
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Signups - UPPDATERAD DESIGN */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="bg-[#121715] border-[#223029] rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
            <CardHeader className="border-b border-[#223029]">
              <CardTitle className="text-lg font-bold text-[#F4F7F5] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#F59E0B]" />
                Väntande anmälningar
                {pendingParticipants.length > 0 && (
                  <Badge className="bg-[#F59E0B] text-white h-6 px-2 font-bold">
                    {pendingParticipants.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {pendingParticipants.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-[#2BA84A]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-[#2BA84A]" />
                  </div>
                  <p className="text-sm font-semibold text-[#F4F7F5] mb-1">Alla anmälningar hanterade!</p>
                  <p className="text-xs text-[#B6C2BC]">Inga väntande anmälningar just nu</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingParticipants.map((participant, index) => (
                    <motion.div
                      key={participant.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-[#0F1513] rounded-xl border border-[#223029] hover:border-[#F59E0B]/30 transition-all"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Avatar/Logo */}
                        <div className="w-12 h-12 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-xl flex items-center justify-center flex-shrink-0">
                          {participant.team?.logo_url ? (
                            <img src={participant.team.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : participant.signup_type === 'team' ? (
                            <Users className="w-6 h-6 text-white" />
                          ) : (
                            <span className="text-white font-bold text-lg">
                              {(participant.user?.full_name?.[0] || 'U').toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-bold text-[#F4F7F5] truncate">
                              {participant.team?.name || participant.user?.full_name || 'Deltagare'}
                            </span>
                            <Badge className="bg-[#F59E0B]/20 text-[#FCD34D] border-0 text-xs flex-shrink-0 h-5 px-2 font-semibold">
                              {participant.signup_type === 'team' ? '👥 Lag' : '⚽ Solo'}
                            </Badge>
                          </div>
                          {participant.notes && (
                            <p className="text-xs text-[#B6C2BC] line-clamp-2">{participant.notes}</p>
                          )}
                          {participant.preferred_position && participant.preferred_position !== 'any' && (
                            <p className="text-xs text-[#B6C2BC] capitalize mt-1">
                              Position: {participant.preferred_position}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(participant.id)}
                          disabled={approveSignupMutation.isPending}
                          className="h-10 px-4 bg-[#2BA84A] hover:bg-[#248232] text-[#FFFFFF] font-semibold flex-1 sm:flex-initial shadow-lg"
                        >
                          <CheckCircle className="w-4 h-4 sm:mr-2" />
                          <span className="hidden sm:inline">Godkänn</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(participant.id)}
                          disabled={rejectSignupMutation.isPending}
                          className="h-10 px-4 border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/10 font-semibold flex-1 sm:flex-initial"
                        >
                          <XCircle className="w-4 h-4 sm:mr-2" />
                          <span className="hidden sm:inline">Neka</span>
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </>
  );
}