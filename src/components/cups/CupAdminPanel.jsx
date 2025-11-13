import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, XCircle, Users, Calendar, Bell, Edit } from "lucide-react";
import { useCustomDialog } from "../ui/custom-dialog";
import { CUPS_QUERY_KEY } from "../dashboard/CupsWidget";
import EditCupModal from "./EditCupModal";
import { AnimatePresence } from "framer-motion";

export default function CupAdminPanel({ cup, participants, groups, matches }) {
  const { confirm, alert, DialogContainer } = useCustomDialog();
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);

  const pendingParticipants = participants.filter(p => p.status === 'pending');

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
        
        {/* Header */}
        <Card className="bg-gradient-to-r from-[#F59E0B]/10 to-[#D97706]/5 border-[#F59E0B]/30 rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#F59E0B]/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-[#F59E0B]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#F4F7F5]">Admin Panel</h2>
                  <p className="text-sm text-[#B6C2BC]">Hantera turneringen</p>
                </div>
              </div>
              <Button
                onClick={() => setShowEditModal(true)}
                className="h-11 bg-[#F59E0B] hover:bg-[#D97706] text-[#FFFFFF] gap-2 font-semibold"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Redigera</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-[#121715] border-[#223029] rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-lg font-bold text-[#F4F7F5]">Snabbåtgärder</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <Button
              onClick={handleCreateSchedule}
              disabled={createScheduleMutation.isPending || groups.length > 0}
              className="w-full h-12 bg-[#F59E0B] hover:bg-[#D97706] text-[#FFFFFF] gap-2 font-semibold"
            >
              <Calendar className="w-5 h-5" />
              {groups.length > 0 ? 'Schema skapat ✓' : 'Skapa matchschema'}
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] hover:text-[#F4F7F5] gap-2 font-semibold"
            >
              <Bell className="w-5 h-5" />
              Skicka meddelande
            </Button>
          </CardContent>
        </Card>

        {/* Pending Signups */}
        <Card className="bg-[#121715] border-[#223029] rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-lg font-bold text-[#F4F7F5] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#F59E0B]" />
              Väntande anmälningar ({pendingParticipants.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {pendingParticipants.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-[#2BA84A] mx-auto mb-3" />
                <p className="text-sm text-[#B6C2BC]">Inga väntande anmälningar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingParticipants.map((participant) => (
                  <div 
                    key={participant.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-[#18221E] rounded-xl border border-[#223029]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-[#F4F7F5] truncate">
                          {participant.team?.name || participant.user?.full_name || 'Deltagare'}
                        </span>
                        <Badge className="bg-[#F59E0B]/20 text-[#FCD34D] border-0 text-xs flex-shrink-0 h-5 px-2">
                          {participant.signup_type === 'team' ? 'Lag' : 'Solo'}
                        </Badge>
                      </div>
                      {participant.notes && (
                        <p className="text-xs text-[#B6C2BC] line-clamp-2">{participant.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(participant.id)}
                        disabled={approveSignupMutation.isPending}
                        className="h-10 bg-[#2BA84A] hover:bg-[#248232] text-[#FFFFFF] font-semibold flex-1 sm:flex-initial"
                      >
                        <CheckCircle className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Godkänn</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(participant.id)}
                        disabled={rejectSignupMutation.isPending}
                        className="h-10 border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/10 font-semibold flex-1 sm:flex-initial"
                      >
                        <XCircle className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Neka</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tournament Stats */}
        <Card className="bg-[#121715] border-[#223029] rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-lg font-bold text-[#F4F7F5]">Statistik</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#18221E] rounded-xl text-center border border-[#223029]">
                <p className="text-2xl font-bold text-[#F4F7F5] mb-1">{participants.length}</p>
                <p className="text-xs text-[#B6C2BC] font-medium">Totalt anmälda</p>
              </div>
              
              <div className="p-4 bg-[#18221E] rounded-xl text-center border border-[#223029]">
                <p className="text-2xl font-bold text-[#2BA84A] mb-1">
                  {participants.filter(p => p.status === 'confirmed').length}
                </p>
                <p className="text-xs text-[#B6C2BC] font-medium">Bekräftade</p>
              </div>
              
              <div className="p-4 bg-[#18221E] rounded-xl text-center border border-[#223029]">
                <p className="text-2xl font-bold text-[#F4F7F5] mb-1">{groups.length}</p>
                <p className="text-xs text-[#B6C2BC] font-medium">Grupper</p>
              </div>
              
              <div className="p-4 bg-[#18221E] rounded-xl text-center border border-[#223029]">
                <p className="text-2xl font-bold text-[#F4F7F5] mb-1">{matches.length}</p>
                <p className="text-xs text-[#B6C2BC] font-medium">Matcher</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}