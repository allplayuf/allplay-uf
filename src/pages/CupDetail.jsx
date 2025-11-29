import React, { useState, Suspense, lazy } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Trophy, Calendar, MapPin, Users, Target, 
  ArrowLeft, Shield, Trash2, MoreVertical,
  CheckCircle, Clock, ListChecks, Layout, UserPlus, ChevronDown, ChevronUp, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { PageLoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useCustomDialog } from "../components/ui/custom-dialog";
import { CUPS_QUERY_KEY } from "../components/dashboard/CupsWidget";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CupSignupModule = lazy(() => import("../components/cups/CupSignupModule"));
const CupGroupStage = lazy(() => import("../components/cups/CupGroupStage"));
const CupBracket = lazy(() => import("../components/cups/CupBracket"));
const CupMatches = lazy(() => import("../components/cups/CupMatches"));
const CupAdminPanel = lazy(() => import("../components/cups/CupAdminPanel"));
const CupHeroCard = lazy(() => import("../components/cups/CupHeroCard"));

const STATUS_CONFIG = {
  upcoming: { label: 'Kommande', color: 'bg-[#F59E0B]/20 text-[#FCD34D]', dotColor: 'bg-[#F59E0B]' },
  registration_open: { label: 'Anmälan öppen', color: 'bg-[#10B981]/20 text-[#10B981]', dotColor: 'bg-[#10B981]' },
  registration_closed: { label: 'Anmälan stängd', color: 'bg-[#EAB308]/20 text-[#FDE047]', dotColor: 'bg-[#EAB308]' },
  ongoing: { label: 'Pågående', color: 'bg-[#EF4444]/20 text-[#EF4444]', dotColor: 'bg-[#EF4444]' },
  completed: { label: 'Avslutad', color: 'bg-[#6B7280]/20 text-[#9CA3AF]', dotColor: 'bg-[#6B7280]' }
};

export default function CupDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirm, alert, DialogContainer } = useCustomDialog();
  const [activeTab, setActiveTab] = useState('overview');
  
  const urlParams = new URLSearchParams(location.search);
  const cupId = urlParams.get('cup_id');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: cupData, isLoading } = useQuery({
    queryKey: ['cupDetails', cupId],
    queryFn: async () => {
      const response = await base44.functions.invoke('cups/getCupDetails', { cup_id: cupId });
      return response.data;
    },
    enabled: !!cupId,
    staleTime: 30 * 1000,
  });

  const deleteCupMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('cups/deleteCup', { cup_id: cupId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUPS_QUERY_KEY });
      alert('Turnering borttagen! 🗑️', 'Turneringen har tagits bort.', { type: 'success' });
      navigate(createPageUrl("Community") + "?tab=cups");
    },
    onError: (error) => {
      alert('Ett fel uppstod', error.response?.data?.error || 'Kunde inte ta bort turneringen.', { type: 'alert' });
    }
  });

  // Expandable state for team cards
  const [expandedTeamId, setExpandedTeamId] = useState(null);

  const approveSignupMutation = useMutation({
    mutationFn: async (participantId) => {
      const response = await base44.functions.invoke('cups/manageSignup', {
        participant_id: participantId,
        action: 'approve'
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupDetails', cupId] });
      alert('Anmälan godkänd! ✅', 'Laget har godkänts för cupen.', { type: 'success' });
    },
    onError: (error) => {
      alert('Fel', error.response?.data?.error || 'Kunde inte godkänna anmälan.', { type: 'alert' });
    }
  });

  const handleApproveTeam = async (participantId, teamName) => {
      approveSignupMutation.mutate(participantId);
  };

  const declineSignupMutation = useMutation({
    mutationFn: async (participantId) => {
      const response = await base44.functions.invoke('cups/manageSignup', {
        participant_id: participantId,
        action: 'reject'
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupDetails', cupId] });
      alert('Anmälan nekad', 'Laget har nekats plats i cupen.', { type: 'info' });
    },
    onError: (error) => {
      alert('Fel', error.response?.data?.error || 'Kunde inte neka anmälan.', { type: 'alert' });
    }
  });

  const handleDeclineTeam = async (participantId, teamName) => {
      const shouldDecline = await confirm(
        'Neka anmälan?',
        `Är du säker på att du vill neka ${teamName}?`,
        { type: 'warning', confirmText: 'Neka', cancelText: 'Avbryt' }
      );
      if (shouldDecline) {
          declineSignupMutation.mutate(participantId);
      }
  };

  const joinTeamMutation = useMutation({
    mutationFn: async ({ cup_id, team_id }) => {
      const response = await base44.functions.invoke('cups/joinCupTeam', { cup_id, team_id });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupDetails', cupId] });
      alert('Gick med i laget! 🎉', 'Du har lagts till i laget.', { type: 'success' });
    },
    onError: (error) => {
      alert('Ett fel uppstod', error.response?.data?.error || 'Kunde inte gå med i laget.', { type: 'alert' });
    }
  });

  const handleDeleteCup = async () => {
    const shouldDelete = await confirm(
      'Ta bort turnering',
      'Är du säker på att du vill ta bort denna turnering? Detta går inte att ångra.',
      { type: 'warning', confirmText: 'Ta bort', cancelText: 'Avbryt' }
    );

    if (shouldDelete) {
      deleteCupMutation.mutate();
    }
  };

  const cup = cupData?.cup;
  const participants = cupData?.participants || [];
  const groups = cupData?.groups || [];
  const matches = cupData?.matches || [];
  const brackets = cupData?.brackets || [];
  const stats = cupData?.stats || {};

  const isOrganizer = user && cup?.organizer_id === user.id;
  const isAdmin = user?.role === 'admin';
  const canManage = isOrganizer || isAdmin;
  const canDelete = isOrganizer || isAdmin;

  const userParticipant = participants.find(p => 
    (p.user_id === user?.id) || 
    (p.team_id && user?.team_ids?.includes(p.team_id))
  );

  if (isLoading || !cup) {
    return <PageLoadingSkeleton />;
  }

  const statusConfig = STATUS_CONFIG[cup.status] || STATUS_CONFIG.upcoming;
  const confirmedParticipants = participants.filter(p => p.status === 'confirmed');
  
  // Show both confirmed and pending participants
  // Pending ones are marked visually
  const displayedParticipants = participants.filter(p => 
      p.status === 'confirmed' || p.status === 'pending'
  ).sort((a, b) => {
      // Sort confirmed first, then pending
      if (a.status === b.status) return 0;
      return a.status === 'confirmed' ? -1 : 1;
  });

  const handleJoinTeam = async (teamId, teamName) => {
    if (userParticipant) {
        await alert('Redan anmäld', 'Du deltar redan i denna cup.', { type: 'info' });
        return;
    }
    
    const shouldJoin = await confirm(
      `Gå med i ${teamName}?`, 
      `Vill du gå med i ${teamName} direkt?`, 
      { type: 'confirm', confirmText: 'Gå med', cancelText: 'Avbryt' }
    );

    if (shouldJoin) {
        joinTeamMutation.mutate({ cup_id: cupId, team_id: teamId });
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1513]">
      <DialogContainer />
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <Link to={createPageUrl("Community") + "?tab=cups"}>
            <Button 
              variant="ghost" 
              className="h-10 gap-2 text-[#7B8A83] hover:text-[#F4F7F5] hover:bg-[#18221E] px-3 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Tillbaka</span>
            </Button>
          </Link>

          {canDelete && cup.status !== 'ongoing' && cup.status !== 'completed' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 text-[#7B8A83] hover:text-[#F4F7F5] hover:bg-[#18221E]"
                >
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#121715] border-[#223029]">
                <DropdownMenuItem 
                  onClick={handleDeleteCup}
                  className="text-[#DC2626] hover:text-[#DC2626] hover:bg-[#DC2626]/10 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Ta bort turnering
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Hero Header with Rings */}
        <Suspense fallback={<PageLoadingSkeleton />}>
          <CupHeroCard 
            cup={cup}
            statusConfig={statusConfig}
            confirmedCount={confirmedParticipants.length}
            canManage={canManage}
            onAdminClick={() => setActiveTab('admin')}
          />
        </Suspense>

        {/* User Signup Status Below Hero */}
        {userParticipant && (
          <Card className="bg-[#121715] border-[#223029] rounded-2xl shadow-xl mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#2BA84A] flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#F4F7F5] text-sm">Du är anmäld till denna turnering!</p>
                  <p className="text-xs text-[#B6C2BC]">
                    Status: {userParticipant.status === 'confirmed' ? '✓ Bekräftad' : '⏳ Väntar på godkännande'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Tabs - UTAN ADMIN TAB */}
        <div className="bg-[#121715] border border-[#223029] rounded-2xl p-2 mb-8 shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`h-11 px-2 sm:px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'overview'
                  ? 'bg-[#F59E0B]/16 text-[#FCD34D] ring-1 ring-[#F59E0B]/30'
                  : 'bg-transparent text-[#7B8A83] hover:text-[#F4F7F5] hover:bg-[#18221E]'
              }`}
            >
              <Trophy className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Översikt</span>
            </button>

            <button
              onClick={() => setActiveTab('signup')}
              className={`h-11 px-2 sm:px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'signup'
                  ? 'bg-[#F59E0B]/16 text-[#FCD34D] ring-1 ring-[#F59E0B]/30'
                  : 'bg-transparent text-[#7B8A83] hover:text-[#F4F7F5] hover:bg-[#18221E]'
              }`}
            >
              <Users className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Anmälan</span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`h-11 px-2 sm:px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'schedule'
                  ? 'bg-[#F59E0B]/16 text-[#FCD34D] ring-1 ring-[#F59E0B]/30'
                  : 'bg-transparent text-[#7B8A83] hover:text-[#F4F7F5] hover:bg-[#18221E]'
              }`}
            >
              <Layout className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Schema</span>
            </button>

            <button
              onClick={() => setActiveTab('matches')}
              className={`h-11 px-2 sm:px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'matches'
                  ? 'bg-[#F59E0B]/16 text-[#FCD34D] ring-1 ring-[#F59E0B]/30'
                  : 'bg-transparent text-[#7B8A83] hover:text-[#F4F7F5] hover:bg-[#18221E]'
              }`}
            >
              <ListChecks className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Matcher</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {cup.status === 'completed' && (
                <Card className="bg-gradient-to-br from-[#F59E0B]/20 to-[#D97706]/10 border border-[#F59E0B]/30 rounded-2xl shadow-[0_6px_18px_rgba(245,158,11,0.15)] overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#F59E0B]/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                  <CardContent className="p-8 text-center relative z-10">
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                      className="w-24 h-24 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg ring-4 ring-[#F59E0B]/20"
                    >
                      <Trophy className="w-12 h-12 text-white" />
                    </motion.div>
                    <h2 className="text-3xl font-black text-[#F4F7F5] mb-2 uppercase tracking-tight">Turnering Avslutad</h2>
                    <p className="text-[#B6C2BC] text-lg mb-6">Grattis till vinnarna!</p>
                    
                    {cup.winner_team_name && (
                      <div className="inline-block px-8 py-4 bg-[#18221E]/80 backdrop-blur-sm rounded-2xl border border-[#F59E0B]/30 shadow-xl">
                        <div className="text-xs text-[#F59E0B] font-bold uppercase tracking-widest mb-1">Mästare</div>
                        <div className="text-4xl font-black text-white tracking-tight">{cup.winner_team_name}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-[#121715] border-[#223029] rounded-xl shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
                  <CardContent className="p-5 text-center">
                    <Users className="w-6 h-6 text-[#F59E0B] mx-auto mb-2" />
                    <div className="text-2xl font-bold text-[#F4F7F5] mb-1">{stats.confirmed_participants || 0}</div>
                    <div className="text-xs text-[#B6C2BC] font-medium">Bekräftade</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#121715] border-[#223029] rounded-xl shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
                  <CardContent className="p-5 text-center">
                    <ListChecks className="w-6 h-6 text-[#F59E0B] mx-auto mb-2" />
                    <div className="text-2xl font-bold text-[#F4F7F5] mb-1">{stats.total_matches || 0}</div>
                    <div className="text-xs text-[#B6C2BC] font-medium">Matcher</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#121715] border-[#223029] rounded-xl shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
                  <CardContent className="p-5 text-center">
                    <CheckCircle className="w-6 h-6 text-[#2BA84A] mx-auto mb-2" />
                    <div className="text-2xl font-bold text-[#F4F7F5] mb-1">{stats.completed_matches || 0}</div>
                    <div className="text-xs text-[#B6C2BC] font-medium">Spelade</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#121715] border-[#223029] rounded-xl shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
                  <CardContent className="p-5 text-center">
                    <Clock className="w-6 h-6 text-[#F59E0B] mx-auto mb-2" />
                    <div className="text-2xl font-bold text-[#F4F7F5] mb-1">
                      {(stats.total_matches || 0) - (stats.completed_matches || 0)}
                    </div>
                    <div className="text-xs text-[#B6C2BC] font-medium">Kommande</div>
                  </CardContent>
                </Card>
              </div>

              {/* About Section */}
              {(cup.description || cup.prize || cup.rules) && (
                <Card className="bg-[#121715] border-[#223029] rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
                  <CardContent className="p-6 space-y-6">
                    
                    {cup.description && (
                      <div>
                        <h3 className="text-sm font-semibold text-[#7B8A83] uppercase tracking-wide mb-3">Beskrivning</h3>
                        <p className="text-[#F4F7F5] leading-relaxed">{cup.description}</p>
                      </div>
                    )}

                    {cup.prize && (
                      <div>
                        <h3 className="text-sm font-semibold text-[#7B8A83] uppercase tracking-wide mb-3">Priser</h3>
                        <div className="p-4 bg-gradient-to-r from-[#FFD700]/10 to-[#FFA500]/10 rounded-xl border border-[#FFD700]/30">
                          <p className="text-[#F4F7F5] font-bold text-lg">{cup.prize}</p>
                        </div>
                      </div>
                    )}

                    {/* Tournament Details Grid */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      {cup.entry_fee > 0 && (
                        <div className="p-4 bg-[#0F1513] rounded-xl border border-[#223029]">
                          <p className="text-xs text-[#7B8A83] mb-1">Anmälningsavgift</p>
                          <p className="text-lg font-bold text-[#FCD34D]">{cup.entry_fee} kr</p>
                        </div>
                      )}

                      {cup.has_group_stage && (
                        <div className="p-4 bg-[#0F1513] rounded-xl border border-[#223029]">
                          <p className="text-xs text-[#7B8A83] mb-1">Gruppspel</p>
                          <p className="text-lg font-bold text-[#2BA84A]">✓ {cup.number_of_groups} grupper</p>
                        </div>
                      )}

                      {cup.has_playoffs && (
                        <div className="p-4 bg-[#0F1513] rounded-xl border border-[#223029]">
                          <p className="text-xs text-[#7B8A83] mb-1">Slutspel</p>
                          <p className="text-lg font-bold text-[#2BA84A]">✓ Aktiverat</p>
                        </div>
                      )}
                    </div>

                    {cup.rules && (
                      <div>
                        <h3 className="text-sm font-semibold text-[#7B8A83] uppercase tracking-wide mb-3">Regler</h3>
                        <div className="max-h-64 overflow-y-auto p-4 bg-[#0F1513] rounded-xl border border-[#223029]">
                          <p className="text-[#F4F7F5] whitespace-pre-wrap leading-relaxed">{cup.rules}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Participating Teams/Players */}
              <Card className="bg-[#121715] border-[#223029] rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-[#F4F7F5] mb-4">
                    Anmälda {cup.signup_type === 'team' ? 'Lag' : 'Spelare'} ({displayedParticipants.length})
                  </h3>
                  
                  {displayedParticipants.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-[#7B8A83] mx-auto mb-3" />
                      <p className="text-[#B6C2BC]">Inga deltagare än</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {displayedParticipants.map((participant, index) => (
                        <motion.div
                          key={participant.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <div 
                            className={`bg-[#18221E] rounded-xl border border-[#223029] transition-all overflow-hidden ${expandedTeamId === participant.id ? 'ring-1 ring-[#F59E0B]/30' : 'hover:border-[#F59E0B]/30'}`}
                          >
                            <div 
                                className="flex items-center gap-3 p-3 cursor-pointer"
                                onClick={() => setExpandedTeamId(expandedTeamId === participant.id ? null : participant.id)}
                            >
                                {cup.signup_type === 'team' && participant.team ? (
                                  <>
                                    {participant.team.logo_url ? (
                                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                                        <img src={participant.team.logo_url} alt={participant.team.name} className="w-full h-full object-cover" />
                                      </div>
                                    ) : (
                                      <div className="w-10 h-10 bg-[#F59E0B]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Users className="w-5 h-5 text-[#F59E0B]" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-[#F4F7F5] truncate text-sm">{participant.team.name}</p>
                                            {participant.status === 'pending' && (
                                                <Badge className="h-5 bg-[#EAB308]/20 text-[#FDE047] border-0 px-1.5 text-[10px]">Väntar</Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-[#B6C2BC]">{participant.team.city}</p>
                                    </div>
                                    {expandedTeamId === participant.id ? <ChevronUp className="w-4 h-4 text-[#7B8A83]" /> : <ChevronDown className="w-4 h-4 text-[#7B8A83]" />}
                                  </>
                                ) : (
                                  <>
                                    <div className="w-10 h-10 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-white font-semibold text-sm">
                                        {participant.user?.full_name?.[0] || 'U'}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="font-semibold text-[#F4F7F5] truncate text-sm">{participant.user?.full_name || 'Spelare'}</p>
                                        {participant.status === 'pending' && (
                                            <Badge className="h-5 bg-[#EAB308]/20 text-[#FDE047] border-0 px-1.5 text-[10px]">Väntar</Badge>
                                        )}
                                      </div>
                                      {participant.preferred_position && participant.preferred_position !== 'any' && (
                                        <p className="text-xs text-[#B6C2BC] capitalize">{participant.preferred_position}</p>
                                      )}
                                    </div>
                                  </>
                                )}
                            </div>

                            {/* Expanded Content: Team Members & Join Button */}
                            <AnimatePresence>
                                {expandedTeamId === participant.id && cup.signup_type === 'team' && participant.team && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-[#223029] bg-[#121715]/50 px-3 py-3"
                                    >
                                        {/* Member List */}
                                        <div className="space-y-2 mb-3">
                                            <p className="text-xs font-semibold text-[#7B8A83] uppercase tracking-wider">Spelare ({participant.team_members?.length || 0})</p>
                                            {participant.team_members?.map(member => (
                                                <div key={member.user_id} className="flex items-center gap-2 text-sm text-[#F4F7F5]">
                                                    <div className="w-6 h-6 rounded-full bg-[#223029] flex items-center justify-center text-xs">
                                                        {member.user?.full_name?.[0] || 'U'}
                                                    </div>
                                                    <span>{member.user?.full_name || 'Okänd spelare'}</span>
                                                    {member.role === 'captain' && <Badge className="h-4 text-[10px] bg-[#F59E0B]/20 text-[#FCD34D] border-0 px-1">K</Badge>}
                                                </div>
                                            ))}
                                            {(!participant.team_members || participant.team_members.length === 0) && (
                                                <p className="text-xs text-[#B6C2BC] italic">Inga spelare listade.</p>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            {/* Join Button - Only if not already signed up */}
                                            {!userParticipant && cup.status !== 'completed' && (
                                                <Button 
                                                    onClick={() => handleJoinTeam(participant.team.id, participant.team.name)}
                                                    className="flex-1 h-9 bg-[#2BA84A] hover:bg-[#248232] text-white text-xs font-semibold gap-2"
                                                    disabled={joinTeamMutation.isPending}
                                                >
                                                    <UserPlus className="w-3 h-3" />
                                                    {joinTeamMutation.isPending ? 'Går med...' : 'Gå med i laget'}
                                                </Button>
                                            )}

                                            {/* Admin Approve/Decline Buttons */}
                                            {canManage && participant.status === 'pending' && (
                                                <>
                                                    <Button 
                                                        onClick={() => handleApproveTeam(participant.id, participant.team?.name || participant.user?.full_name)}
                                                        className="flex-1 h-9 bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs font-semibold gap-2"
                                                        disabled={approveSignupMutation.isPending}
                                                    >
                                                        <CheckCircle className="w-3 h-3" />
                                                        {approveSignupMutation.isPending ? 'Godkänner...' : 'Godkänn'}
                                                    </Button>
                                                    <Button 
                                                        onClick={() => handleDeclineTeam(participant.id, participant.team?.name || participant.user?.full_name)}
                                                        className="flex-1 h-9 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold gap-2"
                                                        disabled={declineSignupMutation.isPending}
                                                    >
                                                        <X className="w-3 h-3" />
                                                        {declineSignupMutation.isPending ? 'Nekar...' : 'Neka'}
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Matches Preview */}
              {matches.length > 0 && (
                <Card className="bg-[#121715] border-[#223029] rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-[#F4F7F5]">Kommande Matcher</h3>
                      {matches.filter(m => !m.team_a_score && m.team_a_score !== 0).length > 5 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab('matches')}
                          className="text-[#F59E0B] hover:bg-[#F59E0B]/10"
                        >
                          Se alla
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {matches.filter(m => !m.team_a_score && m.team_a_score !== 0).slice(0, 5).map((match, index) => (
                        <Link key={match.id} to={match.match_id ? `${createPageUrl("MatchDetail")}?id=${match.match_id}` : '#'}>
                          <div className="flex items-center justify-between p-4 bg-[#18221E] rounded-xl border border-[#223029] hover:border-[#F59E0B]/30 transition-all group">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-[#F59E0B]/20 text-[#FCD34D] border-0 text-xs font-semibold">
                                  {match.stage === 'group' ? 'Grupp' : 
                                   match.stage === 'quarterfinal' ? 'Kvartsfinal' : 
                                   match.stage === 'semifinal' ? 'Semifinal' : 
                                   match.stage === 'final' ? 'Final' : match.stage}
                                </Badge>
                              </div>
                              <div className="text-sm font-semibold text-[#F4F7F5] mb-1">
                                {match.team_a_name} vs {match.team_b_name}
                              </div>
                              {match.date && (
                                <div className="flex items-center gap-3 text-xs text-[#B6C2BC]">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(match.date).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
                                  </span>
                                  {match.time && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {match.time}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {matches.filter(m => !m.team_a_score && m.team_a_score !== 0).length > 5 && (
                      <Button
                        variant="outline"
                        className="w-full mt-4 border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] hover:text-[#F4F7F5]"
                        onClick={() => setActiveTab('matches')}
                      >
                        Se alla matcher ({matches.length})
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {activeTab === 'signup' && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<PageLoadingSkeleton />}>
                <CupSignupModule 
                  cup={cup}
                  user={user}
                  participants={participants}
                  userParticipant={userParticipant}
                />
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'schedule' && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {cup.has_group_stage && (
                <Suspense fallback={<PageLoadingSkeleton />}>
                  <CupGroupStage 
                    cup={cup}
                    groups={groups}
                    matches={matches}
                  />
                </Suspense>
              )}

              {cup.has_playoffs && (
                <Suspense fallback={<PageLoadingSkeleton />}>
                  <CupBracket 
                    cup={cup}
                    brackets={brackets}
                    matches={matches}
                  />
                </Suspense>
              )}

              {!cup.has_group_stage && !cup.has_playoffs && (
                <Card className="bg-[#121715] border-[#223029] rounded-2xl p-12 text-center shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
                  <Layout className="w-16 h-16 text-[#7B8A83] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-[#F4F7F5] mb-2">Schema ej skapat</h3>
                  <p className="text-[#B6C2BC]">Organisatören har inte skapat ett schema än.</p>
                </Card>
              )}
            </motion.div>
          )}

          {activeTab === 'matches' && (
            <motion.div
              key="matches"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<PageLoadingSkeleton />}>
                <CupMatches 
                  cup={cup}
                  matches={matches}
                  canManage={canManage}
                />
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'admin' && canManage && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<PageLoadingSkeleton />}>
                <CupAdminPanel 
                  cup={cup}
                  participants={participants}
                  groups={groups}
                  matches={matches}
                />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}