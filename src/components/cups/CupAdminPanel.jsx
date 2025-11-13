import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, XCircle, Users, Calendar, Bell } from "lucide-react";
import { useCustomDialog } from "../ui/custom-dialog";

export default function CupAdminPanel({ cup, participants, groups, matches }) {
  const { confirm, alert, DialogContainer } = useCustomDialog();
  const queryClient = useQueryClient();

  const pendingParticipants = participants.filter(p => p.status === 'pending');

  // Approve signup mutation
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
      alert('Anmälan godkänd! ✅', 'Deltagaren har godkänts.', { type: 'success' });
    },
    onError: (error) => {
      alert('Fel', error.message || 'Kunde inte godkänna anmälan.', { type: 'alert' });
    }
  });

  // Reject signup mutation
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
      alert('Anmälan nekad', 'Deltagaren har nekats.', { type: 'info' });
    },
    onError: (error) => {
      alert('Fel', error.message || 'Kunde inte neka anmälan.', { type: 'alert' });
    }
  });

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('cups/createSchedule', {
        cup_id: cup.id
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupDetails', cup.id] });
      alert('Schema skapat! 📅', 'Matchschemat har skapats framgångsrikt!', { type: 'success' });
    },
    onError: (error) => {
      alert('Fel', error.message || 'Kunde inte skapa schema.', { type: 'alert' });
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
      
      <div className="space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-[#F4743B]/10 to-[#E5683A]/5 border border-[#F4743B]/30 rounded-[20px] p-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#F4743B]" />
            <div>
              <h2 className="text-xl font-bold text-[#F4F7F5]">Admin Panel</h2>
              <p className="text-sm text-[#B6C2BC]">Hantera turneringen</p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#F4F7F5]">Snabbåtgärder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleCreateSchedule}
              disabled={createScheduleMutation.isPending || groups.length > 0}
              className="w-full bg-[#F4743B] hover:bg-[#E5683A] text-white gap-2"
            >
              <Calendar className="w-4 h-4" />
              {groups.length > 0 ? 'Schema skapat' : 'Skapa matchschema'}
            </Button>

            <Button
              variant="outline"
              className="w-full border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] gap-2"
            >
              <Bell className="w-4 h-4" />
              Skicka meddelande
            </Button>
          </CardContent>
        </Card>

        {/* Pending Signups */}
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#F4F7F5] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#F4743B]" />
              Väntande anmälningar ({pendingParticipants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                    className="flex items-center justify-between p-4 bg-[#18221E] rounded-xl border border-[#223029]"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-[#F4F7F5]">
                          {participant.team?.name || participant.user?.full_name || 'Deltagare'}
                        </span>
                        <Badge className="bg-[#F4743B]/20 text-[#F4743B] border-[#F4743B]/30 text-xs">
                          {participant.signup_type === 'team' ? 'Lag' : 'Solo'}
                        </Badge>
                      </div>
                      {participant.notes && (
                        <p className="text-xs text-[#B6C2BC]">{participant.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(participant.id)}
                        disabled={approveSignupMutation.isPending}
                        className="bg-[#2BA84A] hover:bg-[#248232] text-white"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(participant.id)}
                        disabled={rejectSignupMutation.isPending}
                        className="border-[#223029] text-[#B6C2BC] hover:bg-[#18221E]"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tournament Stats */}
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#F4F7F5]">Statistik</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#18221E] rounded-xl text-center">
                <p className="text-2xl font-bold text-[#F4F7F5]">{participants.length}</p>
                <p className="text-xs text-[#B6C2BC]">Totalt anmälda</p>
              </div>
              
              <div className="p-4 bg-[#18221E] rounded-xl text-center">
                <p className="text-2xl font-bold text-[#2BA84A]">
                  {participants.filter(p => p.status === 'confirmed').length}
                </p>
                <p className="text-xs text-[#B6C2BC]">Bekräftade</p>
              </div>
              
              <div className="p-4 bg-[#18221E] rounded-xl text-center">
                <p className="text-2xl font-bold text-[#F4F7F5]">{groups.length}</p>
                <p className="text-xs text-[#B6C2BC]">Grupper</p>
              </div>
              
              <div className="p-4 bg-[#18221E] rounded-xl text-center">
                <p className="text-2xl font-bold text-[#F4F7F5]">{matches.length}</p>
                <p className="text-xs text-[#B6C2BC]">Matcher</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}