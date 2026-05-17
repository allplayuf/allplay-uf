import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, Swords, Calendar, Clock, MapPin, Check, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import feedback from "@/components/ui/feedback-toast";
import {
  getTeamChallenges,
  sendTeamChallenge,
  acceptTeamChallenge,
  declineTeamChallenge,
  cancelTeamChallenge,
  getTeams,
  getVenues,
} from "@/components/supabase/services";

const STATUS_CONFIG = {
  pending:   { label: 'Väntande',   bg: 'bg-[#F4743B]/20', text: 'text-[#FDE3D2]' },
  accepted:  { label: 'Accepterad', bg: 'bg-[#2BA84A]/20', text: 'text-[#CFE8D6]' },
  declined:  { label: 'Nekad',      bg: 'bg-[#DC2626]/20', text: 'text-[#FCA5A5]' },
  cancelled: { label: 'Avbruten',   bg: 'bg-[#7B8A83]/20', text: 'text-[#B6C2BC]' },
};

function ChallengeCard({ challenge, teamId, isCaptainOrVice, onAccept, onDecline, onCancel, accepting, declining }) {
  const isReceived = challenge.challenged_team_id === teamId;
  const isSent = challenge.challenger_team_id === teamId;
  const otherTeam = isReceived ? challenge.challengerTeam : challenge.challengedTeam;
  const isPending = challenge.status === 'pending';
  const status = STATUS_CONFIG[challenge.status] || STATUS_CONFIG.pending;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Card className="bg-[#121715] border border-[#223029] rounded-2xl overflow-hidden">
        <CardContent className="p-4">
          {/* Header row */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${otherTeam?.team_color || '#2BA84A'}33, ${otherTeam?.team_color || '#2BA84A'}11)` }}>
              {otherTeam?.logo_url ? (
                <img src={otherTeam.logo_url} alt={otherTeam.name} className="w-full h-full object-cover" />
              ) : (
                <Shield className="w-5 h-5 text-white/60" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#9EAAA4] mb-0.5">
                {isReceived ? 'Utmaning från' : 'Utmanade'}
              </p>
              <h4 className="text-[15px] font-bold text-[#F4F7F5] truncate">{otherTeam?.name || 'Okänt lag'}</h4>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge className="text-[10px] bg-[#18221E] text-[#B6C2BC] border-[#223029] px-2 py-0.5">{challenge.format}</Badge>
                <Badge className={`text-[10px] px-2 py-0.5 border-0 ${status.bg} ${status.text}`}>{status.label}</Badge>
              </div>
            </div>
            <div className="text-[11px] text-[#7B8A83] whitespace-nowrap">
              {new Date(challenge.created_at).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
            </div>
          </div>

          {/* Details */}
          {(challenge.proposed_date || challenge.proposed_time) && (
            <div className="flex flex-wrap gap-3 mb-3 text-[12px] text-[#B6C2BC]">
              {challenge.proposed_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#9EAAA4]" />
                  {new Date(challenge.proposed_date + 'T12:00:00').toLocaleDateString('sv-SE', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              )}
              {challenge.proposed_time && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#9EAAA4]" />
                  {challenge.proposed_time.slice(0, 5)}
                </span>
              )}
            </div>
          )}

          {challenge.message && (
            <p className="text-[12px] text-[#B6C2BC] mb-3 px-3 py-2 bg-[#18221E] rounded-lg italic">
              "{challenge.message}"
            </p>
          )}

          {/* Actions for received pending challenge */}
          {isReceived && isPending && isCaptainOrVice && (
            <div className="flex gap-2 mt-1">
              <Button
                onClick={() => onDecline(challenge.id)}
                disabled={declining === challenge.id}
                variant="outline"
                size="sm"
                className="flex-1 h-9 border-[#DC2626]/40 text-[#FCA5A5] hover:bg-[#DC2626]/10"
              >
                {declining === challenge.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5 mr-1" />}
                Neka
              </Button>
              <Button
                onClick={() => onAccept(challenge)}
                disabled={accepting === challenge.id}
                size="sm"
                className="flex-1 h-9 bg-[#2BA84A] hover:bg-[#248232] text-white"
              >
                {accepting === challenge.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                Acceptera
              </Button>
            </div>
          )}

          {/* Cancel for sent pending challenge */}
          {isSent && isPending && isCaptainOrVice && (
            <Button
              onClick={() => onCancel(challenge.id)}
              variant="ghost"
              size="sm"
              className="w-full h-8 text-[#9EAAA4] hover:text-[#F4F7F5] text-xs mt-1"
            >
              Avbryt utmaning
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function TeamChallenges({ team, currentUser, isCaptainOrVice }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [accepting, setAccepting] = useState(null);
  const [declining, setDeclining] = useState(null);
  const [form, setForm] = useState({ challenged_team_id: '', format: '5v5', proposed_date: '', proposed_time: '', venue_id: '', message: '' });

  const { data: challenges = [], isLoading: loadingChallenges } = useQuery({
    queryKey: ['team-challenges', team.id],
    queryFn: () => getTeamChallenges(team.id),
    enabled: !!team.id,
    staleTime: 30_000,
  });

  const { data: allTeams = [] } = useQuery({
    queryKey: ['teams-list'],
    queryFn: getTeams,
    staleTime: 120_000,
    enabled: showForm,
  });

  const { data: venues = [] } = useQuery({
    queryKey: ['venues-list'],
    queryFn: getVenues,
    staleTime: 300_000,
    enabled: showForm,
  });

  const otherTeams = allTeams.filter(t => t.id !== team.id && t.is_active !== false);

  const sendMutation = useMutation({
    mutationFn: () => sendTeamChallenge({
      challengerTeamId: team.id,
      challengedTeamId: form.challenged_team_id,
      format: form.format,
      proposedDate: form.proposed_date || null,
      proposedTime: form.proposed_time || null,
      venueId: form.venue_id || null,
      message: form.message,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-challenges', team.id] });
      setForm({ challenged_team_id: '', format: '5v5', proposed_date: '', proposed_time: '', venue_id: '', message: '' });
      setShowForm(false);
      feedback.success('Utmaning skickad!');
    },
    onError: (err) => feedback.error(err.message || 'Kunde inte skicka utmaning'),
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!form.challenged_team_id) { feedback.error('Välj ett lag'); return; }
    sendMutation.mutate();
  };

  const handleAccept = async (challenge) => {
    setAccepting(challenge.id);
    try {
      await acceptTeamChallenge(challenge);
      queryClient.invalidateQueries({ queryKey: ['team-challenges', team.id] });
      queryClient.invalidateQueries({ queryKey: ['team-matches', team.id] });
      feedback.success('Utmaning accepterad! Matchen har skapats.');
    } catch (err) {
      feedback.error(err.message || 'Kunde inte acceptera utmaning');
    } finally {
      setAccepting(null);
    }
  };

  const handleDecline = async (challengeId) => {
    setDeclining(challengeId);
    try {
      await declineTeamChallenge(challengeId);
      queryClient.invalidateQueries({ queryKey: ['team-challenges', team.id] });
      feedback.info('Utmaning nekad');
    } catch (err) {
      feedback.error(err.message);
    } finally {
      setDeclining(null);
    }
  };

  const handleCancel = async (challengeId) => {
    try {
      await cancelTeamChallenge(challengeId);
      queryClient.invalidateQueries({ queryKey: ['team-challenges', team.id] });
      feedback.info('Utmaning avbruten');
    } catch (err) {
      feedback.error(err.message);
    }
  };

  const pending = challenges.filter(c => c.status === 'pending');
  const history = challenges.filter(c => c.status !== 'pending');
  const receivedPending = pending.filter(c => c.challenged_team_id === team.id);

  return (
    <div className="space-y-4">
      {/* New challenge notification banner */}
      {receivedPending.length > 0 && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-[#F4743B]/12 border border-[#F4743B]/30 rounded-xl">
          <Swords className="w-4 h-4 text-[#F4743B] flex-shrink-0" />
          <p className="text-[13px] text-[#FDE3D2] font-medium">
            {receivedPending.length === 1
              ? 'Du har en ny utmaning att svara på'
              : `Du har ${receivedPending.length} nya utmaningar att svara på`}
          </p>
        </div>
      )}

      {/* Send challenge button */}
      {isCaptainOrVice && !showForm && (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full h-11 bg-[#F4743B]/16 hover:bg-[#F4743B]/24 text-[#FDE3D2] ring-1 ring-[#F4743B]/30 font-semibold rounded-xl"
        >
          <Swords className="w-4 h-4 mr-2" />
          Utmana ett lag
        </Button>
      )}

      {/* Send challenge form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-[#121715] border border-[#223029] rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-[#223029] px-5 py-4">
                <CardTitle className="text-[16px] text-[#F4F7F5] font-bold">Skicka utmaning</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <form onSubmit={handleSend} className="space-y-4">
                  {/* Opponent */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-[#9EAAA4] uppercase tracking-wider">Välj lag *</label>
                    <Select value={form.challenged_team_id} onValueChange={v => setForm(f => ({ ...f, challenged_team_id: v }))}>
                      <SelectTrigger className="h-11 bg-[#18221E] border-[#223029] text-[#F4F7F5] rounded-xl">
                        <SelectValue placeholder="Välj motståndare..." />
                      </SelectTrigger>
                      <SelectContent>
                        {otherTeams.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name} — {t.city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Format */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-[#9EAAA4] uppercase tracking-wider">Format</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['5v5', '7v7', '11v11'].map(f => (
                        <button
                          key={f} type="button"
                          onClick={() => setForm(prev => ({ ...prev, format: f }))}
                          className={`h-10 rounded-xl font-bold text-sm transition-all ${
                            form.format === f
                              ? 'bg-[#F4743B] text-white'
                              : 'bg-[#18221E] border border-[#223029] text-[#B6C2BC] hover:border-[#F4743B]/50'
                          }`}
                        >{f}</button>
                      ))}
                    </div>
                  </div>

                  {/* Date / Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-semibold text-[#9EAAA4] uppercase tracking-wider">Datum</label>
                      <Input type="date" value={form.proposed_date} onChange={e => setForm(f => ({ ...f, proposed_date: e.target.value }))}
                        className="h-11 bg-[#18221E] border-[#223029] text-[#F4F7F5] rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-semibold text-[#9EAAA4] uppercase tracking-wider">Tid</label>
                      <Input type="time" value={form.proposed_time} onChange={e => setForm(f => ({ ...f, proposed_time: e.target.value }))}
                        className="h-11 bg-[#18221E] border-[#223029] text-[#F4F7F5] rounded-xl" />
                    </div>
                  </div>

                  {/* Venue */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-[#9EAAA4] uppercase tracking-wider">Plats (valfritt)</label>
                    <Select value={form.venue_id} onValueChange={v => setForm(f => ({ ...f, venue_id: v }))}>
                      <SelectTrigger className="h-11 bg-[#18221E] border-[#223029] text-[#F4F7F5] rounded-xl">
                        <SelectValue placeholder="Välj plats..." />
                      </SelectTrigger>
                      <SelectContent>
                        {venues.slice(0, 30).map(v => (
                          <SelectItem key={v.id} value={v.id}>{v.name} — {v.city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-[#9EAAA4] uppercase tracking-wider">Meddelande (valfritt)</label>
                    <Textarea
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="Valfritt meddelande till motståndarlaget..."
                      maxLength={300}
                      className="bg-[#18221E] border-[#223029] text-[#F4F7F5] rounded-xl h-20 resize-none placeholder:text-[#7B8A83]"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 pt-1">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}
                      className="flex-1 h-10 border-[#223029] text-[#B6C2BC] hover:bg-[#18221E]">
                      Avbryt
                    </Button>
                    <Button type="submit" disabled={sendMutation.isPending}
                      className="flex-1 h-10 bg-[#F4743B] hover:bg-[#E5683A] text-white font-semibold">
                      {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Skicka utmaning'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending challenges */}
      {loadingChallenges ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-7 h-7 text-[#2BA84A] animate-spin" />
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[13px] font-bold text-[#9EAAA4] uppercase tracking-wider px-1">Väntande</h3>
              {pending.map(c => (
                <ChallengeCard
                  key={c.id}
                  challenge={c}
                  teamId={team.id}
                  isCaptainOrVice={isCaptainOrVice}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  onCancel={handleCancel}
                  accepting={accepting}
                  declining={declining}
                />
              ))}
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={() => setShowHistory(h => !h)}
                className="flex items-center gap-2 text-[13px] font-bold text-[#9EAAA4] uppercase tracking-wider px-1 hover:text-[#F4F7F5] transition-colors"
              >
                Historik ({history.length})
                {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    {history.slice(0, 10).map(c => (
                      <div key={c.id} className="opacity-70">
                        <ChallengeCard
                          challenge={c}
                          teamId={team.id}
                          isCaptainOrVice={isCaptainOrVice}
                          onAccept={() => {}}
                          onDecline={() => {}}
                          onCancel={() => {}}
                          accepting={null}
                          declining={null}
                        />
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Empty state */}
          {challenges.length === 0 && !showForm && (
            <Card className="bg-[#121715] border border-[#223029] rounded-2xl">
              <CardContent className="py-12 text-center">
                <Swords className="w-10 h-10 text-[#9EAAA4] mx-auto mb-3" />
                <p className="text-[#B6C2BC] font-medium mb-1">Inga utmaningar än</p>
                <p className="text-[13px] text-[#7B8A83]">
                  {isCaptainOrVice ? 'Utmana ett annat lag för att spela en rankad lagmatch.' : 'Be kaptenen att skicka en utmaning.'}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
