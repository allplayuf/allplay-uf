import React, { useState, Suspense, lazy } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabaseAuth } from "@/components/supabase/AuthProvider";
import { callEdgeFunction } from "@/components/supabase/callEdgeFunction";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Trophy, Calendar, MapPin, Users, Target, 
  ArrowLeft, Shield, Trash2, MoreVertical,
  CheckCircle, Clock, ListChecks, Layout, UserPlus, ChevronDown, ChevronUp, X, Crown
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
const TournamentMvpModal = lazy(() => import("../components/cups/TournamentMvpModal"));
const CupPlayersModal = lazy(() => import("../components/cups/CupPlayersModal"));

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

  // Supabase auth is the source of truth for the current user
  const { user: authUser, isAuthenticated } = useSupabaseAuth();
  const user = isAuthenticated ? authUser : null;

  const { data: cupData, isLoading } = useQuery({
    queryKey: ['cupDetails', cupId],
    queryFn: async () => {
      return await callEdgeFunction('get_cup_details', { cup_id: cupId });
    },
    enabled: !!cupId,
    staleTime: 30 * 1000,
  });

  const deleteCupMutation = useMutation({
    mutationFn: async () => {
      return await callEdgeFunction('cups_delete_cup', { cup_id: cupId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUPS_QUERY_KEY });
      alert('Turnering borttagen! 🗑️', 'Turneringen har tagits bort.', { type: 'success' });
      navigate(createPageUrl("Community") + "?tab=cups");
    },
    onError: (error) => {
      alert('Ett fel uppstod', error?.data?.error || 'Kunde inte ta bort turneringen.', { type: 'alert' });
    }
  });

  // Expandable state for team cards
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [showMvpModal, setShowMvpModal] = useState(false);
  const [showPlayersModal, setShowPlayersModal] = useState(false);

  const approveSignupMutation = useMutation({
    mutationFn: async (participantId) => {
      return await callEdgeFunction('cups_manage_signup', {
        participant_id: participantId,
        action: 'approve'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupDetails', cupId] });
      alert('Anmälan godkänd! ✅', 'Laget har godkänts för cupen.', { type: 'success' });
    },
    onError: (error) => {
      alert('Fel', error?.data?.error || 'Kunde inte godkänna anmälan.', { type: 'alert' });
    }
  });

  const handleApproveTeam = async (participantId, teamName) => {
      approveSignupMutation.mutate(participantId);
  };

  const declineSignupMutation = useMutation({
    mutationFn: async (participantId) => {
      return await callEdgeFunction('cups_manage_signup', {
        participant_id: participantId,
        action: 'reject'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupDetails', cupId] });
      alert('Anmälan nekad', 'Laget har nekats plats i cupen.', { type: 'info' });
    },
    onError: (error) => {
      alert('Fel', error?.data?.error || 'Kunde inte neka anmälan.', { type: 'alert' });
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
      return await callEdgeFunction('cups_join_cup_team', { cup_id, team_id });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cupDetails', cupId] });
      if (data?.needs_approval) {
        alert('Förfrågan skickad! ⏳', 'Lagkaptenen måste godkänna din förfrågan innan du kan delta.', { type: 'info' });
      } else {
        alert('Gick med i laget! 🎉', 'Du har lagts till i laget.', { type: 'success' });
      }
    },
    onError: (error) => {
      alert('Ett fel uppstod', error?.data?.error || 'Kunde inte gå med i laget.', { type: 'alert' });
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
  const isFinalCompleted = cup && cup.status === 'completed';
  const hasMvp = cup && cup.tournament_mvp_user_id;

  const userParticipant = participants.find(p => 
    (p.user_id === user?.id) || 
    (p.team_id && user?.team_ids?.includes(p.team_id))
  );

  if (isLoading || !cup) {
    return <PageLoadingSkeleton />;
  }

  const statusConfig = STATUS_CONFIG[cup.status] || STATUS_CONFIG.upcoming;
  const confirmedParticipants = participants.filter(p => p.status === 'confirmed');
  const isCupFull = confirmedParticipants.length >= cup.max_participants;
  
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
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <DialogContainer />
      
      {/* Mobile Sticky Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-[#0F1513] border-b border-[#223029] safe-area-top">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link to={createPageUrl("Community") + "?tab=cups"}>
            <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#18221E] text-[#F4F7F5] hover:bg-[#223029] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-[#F4F7F5] truncate">{cup?.name || 'Cup'}</h1>
          </div>
          {canDelete && cup?.status !== 'ongoing' && cup?.status !== 'completed' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#18221E] text-[#7B8A83] hover:text-[#F4F7F5] hover:bg-[#223029] transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
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
      </div>
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Desktop Header Section */}
        <div className="hidden lg:flex items-center justify-between mb-6">
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

        {/* Hero Header - Responsive with detail_logo_url */}
        <Suspense fallback={<PageLoadingSkeleton />}>
          <CupHeroCard 
            cup={cup}
            statusConfig={statusConfig}
            confirmedCount={confirmedParticipants.length}
            canManage={canManage}
            onAdminClick={() => setActiveTab('admin')}
            onPlayersClick={() => setShowPlayersModal(true)}
          />
        </Suspense>

        {/* User Signup Status - Mobile Optimized */}
        {userParticipant && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-r from-[#2BA84A]/20 to-[#248232]/10 border-[#2BA84A]/40 rounded-2xl shadow-lg mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#2BA84A]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 text-[#2BA84A]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[#F4F7F5] text-sm lg:text-base">Du deltar i turneringen!</p>
                    <p className="text-xs lg:text-sm text-[#B6C2BC]">
                      Status: {userParticipant.status === 'confirmed' ? '✅ Bekräftad' : '⏳ Väntar på godkännande'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Navigation Tabs - Enhanced Mobile */}
        <div className="sticky top-0 z-30 bg-[#0F1513]/95 backdrop-blur-xl -mx-4 px-4 sm:mx-0 sm:px-0 py-2 sm:py-0 mb-6 lg:mb-8">
          <div className="bg-[#121715] border border-[#223029] rounded-xl lg:rounded-2xl p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
            <div className="grid grid-cols-4 gap-1 lg:gap-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`h-12 lg:h-12 px-2 lg:px-4 rounded-xl font-bold text-[11px] lg:text-sm transition-all flex flex-col lg:flex-row items-center justify-center gap-1 ${
                  activeTab === 'overview'
                    ? 'bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white shadow-lg scale-105'
                    : 'bg-transparent text-[#7B8A83] hover:text-[#F4F7F5] hover:bg-[#18221E]'
                }`}
              >
                <Trophy className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="hidden sm:inline">Översikt</span>
              </button>

              <button
                onClick={() => {
                  if (isCupFull && !userParticipant) {
                    alert('Fullbokad! 🚫', 'Tyvärr är denna turnering fullbokad. Alla platser är upptagna.', { type: 'info' });
                  } else {
                    setActiveTab('signup');
                  }
                }}
                className={`h-12 lg:h-12 px-2 lg:px-4 rounded-xl font-bold text-[11px] lg:text-sm transition-all flex flex-col lg:flex-row items-center justify-center gap-1 relative ${
                  activeTab === 'signup'
                    ? 'bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white shadow-lg scale-105'
                    : isCupFull && !userParticipant
                    ? 'bg-transparent text-[#7B8A83] opacity-50 cursor-not-allowed'
                    : 'bg-transparent text-[#7B8A83] hover:text-[#F4F7F5] hover:bg-[#18221E]'
                }`}
                disabled={isCupFull && !userParticipant && activeTab !== 'signup'}
              >
                <Users className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="hidden sm:inline">Anmälan</span>
                {isCupFull && !userParticipant && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('schedule')}
                className={`h-12 lg:h-12 px-2 lg:px-4 rounded-xl font-bold text-[11px] lg:text-sm transition-all flex flex-col lg:flex-row items-center justify-center gap-1 ${
                  activeTab === 'schedule'
                    ? 'bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white shadow-lg scale-105'
                    : 'bg-transparent text-[#7B8A83] hover:text-[#F4F7F5] hover:bg-[#18221E]'
                }`}
              >
                <Layout className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="hidden sm:inline">Schema</span>
              </button>

              <button
                onClick={() => setActiveTab('matches')}
                className={`h-12 lg:h-12 px-2 lg:px-4 rounded-xl font-bold text-[11px] lg:text-sm transition-all flex flex-col lg:flex-row items-center justify-center gap-1 ${
                  activeTab === 'matches'
                    ? 'bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white shadow-lg scale-105'
                    : 'bg-transparent text-[#7B8A83] hover:text-[#F4F7F5] hover:bg-[#18221E]'
                }`}
              >
                <ListChecks className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="hidden sm:inline">Matcher</span>
              </button>
            </div>
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

              {/* Quick Stats - Enhanced Mobile */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
                <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card className="bg-gradient-to-br from-[#121715] to-[#0F1513] border-[#223029] rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:border-[#F59E0B]/40 transition-all">
                    <CardContent className="p-4 lg:p-6 text-center">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#F59E0B]/20 rounded-xl flex items-center justify-center mx-auto mb-3 ring-2 ring-[#F59E0B]/30">
                        <Users className="w-5 h-5 lg:w-6 lg:h-6 text-[#F59E0B]" />
                      </div>
                      <div className="text-2xl lg:text-3xl font-black text-[#F4F7F5] mb-1">{stats.confirmed_participants || 0}</div>
                      <div className="text-[10px] lg:text-xs text-[#B6C2BC] font-bold uppercase tracking-wider">Bekräftade</div>
                    </CardContent>
                  </Card>
                </motion.div>
                
                <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card className="bg-gradient-to-br from-[#121715] to-[#0F1513] border-[#223029] rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:border-[#4169E1]/40 transition-all">
                    <CardContent className="p-4 lg:p-6 text-center">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#4169E1]/20 rounded-xl flex items-center justify-center mx-auto mb-3 ring-2 ring-[#4169E1]/30">
                        <ListChecks className="w-5 h-5 lg:w-6 lg:h-6 text-[#4169E1]" />
                      </div>
                      <div className="text-2xl lg:text-3xl font-black text-[#F4F7F5] mb-1">{stats.total_matches || 0}</div>
                      <div className="text-[10px] lg:text-xs text-[#B6C2BC] font-bold uppercase tracking-wider">Matcher</div>
                    </CardContent>
                  </Card>
                </motion.div>
                
                <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card className="bg-gradient-to-br from-[#121715] to-[#0F1513] border-[#223029] rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:border-[#2BA84A]/40 transition-all">
                    <CardContent className="p-4 lg:p-6 text-center">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#2BA84A]/20 rounded-xl flex items-center justify-center mx-auto mb-3 ring-2 ring-[#2BA84A]/30">
                        <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 text-[#2BA84A]" />
                      </div>
                      <div className="text-2xl lg:text-3xl font-black text-[#F4F7F5] mb-1">{stats.completed_matches || 0}</div>
                      <div className="text-[10px] lg:text-xs text-[#B6C2BC] font-bold uppercase tracking-wider">Spelade</div>
                    </CardContent>
                  </Card>
                </motion.div>
                
                <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card className="bg-gradient-to-br from-[#121715] to-[#0F1513] border-[#223029] rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:border-[#9370DB]/40 transition-all">
                    <CardContent className="p-4 lg:p-6 text-center">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#9370DB]/20 rounded-xl flex items-center justify-center mx-auto mb-3 ring-2 ring-[#9370DB]/30">
                        <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-[#9370DB]" />
                      </div>
                      <div className="text-2xl lg:text-3xl font-black text-[#F4F7F5] mb-1">
                        {(stats.total_matches || 0) - (stats.completed_matches || 0)}
                      </div>
                      <div className="text-[10px] lg:text-xs text-[#B6C2BC] font-bold uppercase tracking-wider">Kommande</div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* About Section - Mobile Enhanced */}
              {(cup.description || cup.prize || cup.rules) && (
                <Card className="bg-[#121715] border-[#223029] rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
                  <CardContent className="p-4 lg:p-6 space-y-5 lg:space-y-6">
                    
                    {cup.description && (
                      <div>
                        <h3 className="text-xs lg:text-sm font-bold text-[#7B8A83] uppercase tracking-wider mb-3">Beskrivning</h3>
                        <p className="text-sm lg:text-base text-[#F4F7F5] leading-relaxed">{cup.description}</p>
                      </div>
                    )}

                    {cup.prize && (
                      <div>
                        <h3 className="text-xs lg:text-sm font-bold text-[#7B8A83] uppercase tracking-wider mb-3">Priser</h3>
                        <div className="p-4 lg:p-5 bg-gradient-to-r from-[#FFD700]/15 to-[#FFA500]/10 rounded-xl border-2 border-[#FFD700]/40 shadow-lg">
                          <Trophy className="w-6 h-6 text-[#FFD700] mb-2" />
                          <p className="text-[#F4F7F5] font-black text-base lg:text-xl">{cup.prize}</p>
                        </div>
                      </div>
                    )}

                    {/* Tournament Details Grid - Mobile Enhanced */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                      {cup.entry_fee > 0 && (
                        <div className="p-4 bg-gradient-to-br from-[#0F1513] to-[#121715] rounded-xl border border-[#223029] hover:border-[#F59E0B]/30 transition-all">
                          <p className="text-[10px] lg:text-xs text-[#7B8A83] font-bold uppercase tracking-wider mb-2">Avgift</p>
                          <p className="text-xl lg:text-2xl font-black text-[#FCD34D]">{cup.entry_fee} kr</p>
                        </div>
                      )}

                      {cup.has_group_stage && (
                        <div className="p-4 bg-gradient-to-br from-[#0F1513] to-[#121715] rounded-xl border border-[#223029] hover:border-[#2BA84A]/30 transition-all">
                          <p className="text-[10px] lg:text-xs text-[#7B8A83] font-bold uppercase tracking-wider mb-2">Gruppspel</p>
                          <p className="text-xl lg:text-2xl font-black text-[#2BA84A]">✓ {cup.number_of_groups} grupper</p>
                        </div>
                      )}

                      {cup.has_playoffs && (
                        <div className="p-4 bg-gradient-to-br from-[#0F1513] to-[#121715] rounded-xl border border-[#223029] hover:border-[#FFD700]/30 transition-all">
                          <p className="text-[10px] lg:text-xs text-[#7B8A83] font-bold uppercase tracking-wider mb-2">Slutspel</p>
                          <p className="text-xl lg:text-2xl font-black text-[#FFD700]">✓ Aktiverat</p>
                        </div>
                      )}
                    </div>

                    {cup.rules && (
                      <div>
                        <h3 className="text-xs lg:text-sm font-bold text-[#7B8A83] uppercase tracking-wider mb-3">Regler</h3>
                        <div className="max-h-64 overflow-y-auto p-4 lg:p-5 bg-[#0F1513] rounded-xl border border-[#223029]">
                          <p className="text-sm lg:text-base text-[#F4F7F5] whitespace-pre-wrap leading-relaxed">{cup.rules}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Upcoming Matches Preview - Mobile Enhanced */}
              {matches.length > 0 && (
                <Card className="bg-[#121715] border-[#223029] rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-base lg:text-lg font-black text-[#F4F7F5] flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[#F59E0B]" />
                        Kommande Matcher
                      </h3>
                      {matches.filter(m => !m.team_a_score && m.team_a_score !== 0).length > 5 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab('matches')}
                          className="text-[#F59E0B] hover:bg-[#F59E0B]/10 text-xs lg:text-sm font-bold"
                        >
                          Alla →
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {matches
                        .filter(m => !m.team_a_score && m.team_a_score !== 0)
                        .sort((a, b) => {
                          const dateCompare = (a.date || '').localeCompare(b.date || '');
                          if (dateCompare !== 0) return dateCompare;
                          return (a.time || '').localeCompare(b.time || '');
                        })
                        .slice(0, 5)
                        .map((match, index) => (
                          <motion.div
                            key={match.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Link to={match.match_id ? `${createPageUrl("MatchDetail")}?id=${match.match_id}` : '#'}>
                              <div className="p-4 bg-gradient-to-br from-[#18221E] to-[#121715] rounded-xl border border-[#223029] hover:border-[#F59E0B]/50 hover:shadow-lg active:scale-98 transition-all group">
                                <div className="flex items-center gap-2 mb-3">
                                  <Badge className="bg-[#F59E0B]/20 text-[#FCD34D] border-0 text-[10px] lg:text-xs font-bold px-2 py-1">
                                    {match.stage === 'group' ? 'Grupp' : 
                                     match.stage === 'quarterfinal' ? 'Kvart' : 
                                     match.stage === 'semifinal' ? 'Semi' : 
                                     match.stage === 'final' ? 'FINAL' : match.stage}
                                  </Badge>
                                  {match.group_id && (
                                    <Badge className="bg-[#4169E1]/20 text-[#93C5FD] border-0 text-[10px] font-bold px-2 py-1">
                                      Gruppspel
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm lg:text-base font-bold text-[#F4F7F5] mb-2 group-hover:text-[#F59E0B] transition-colors">
                                  {match.team_a_name} <span className="text-[#7B8A83] font-normal">vs</span> {match.team_b_name}
                                </div>
                                {match.date && (
                                  <div className="flex flex-wrap items-center gap-3 text-[10px] lg:text-xs text-[#B6C2BC]">
                                    <span className="flex items-center gap-1.5 font-medium">
                                      <Calendar className="w-3.5 h-3.5" />
                                      {new Date(match.date).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
                                    </span>
                                    {match.time && (
                                      <span className="flex items-center gap-1.5 font-medium">
                                        <Clock className="w-3.5 h-3.5" />
                                        {match.time}
                                      </span>
                                    )}
                                    {match.venue_name && (
                                      <span className="flex items-center gap-1.5 font-medium truncate">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {match.venue_name}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </Link>
                          </motion.div>
                        ))}
                    </div>

                    {matches.filter(m => !m.team_a_score && m.team_a_score !== 0).length > 5 && (
                      <Button
                        variant="outline"
                        className="w-full mt-4 h-11 border-[#F59E0B]/30 text-[#F59E0B] hover:bg-[#F59E0B]/10 font-bold rounded-xl"
                        onClick={() => setActiveTab('matches')}
                      >
                        Se alla matcher ({matches.length}) →
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Participating Teams/Players - Mobile Enhanced */}
              <Card className="bg-[#121715] border-[#223029] rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
                <CardContent className="p-4 lg:p-6">
                  <h3 className="text-base lg:text-lg font-black text-[#F4F7F5] mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#F59E0B]" />
                    Anmälda {cup.signup_type === 'team' ? 'Lag' : 'Spelare'} ({displayedParticipants.length})
                  </h3>
                  
                  {displayedParticipants.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-[#18221E] rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-[#7B8A83]" />
                      </div>
                      <p className="text-sm text-[#B6C2BC]">Inga deltagare än</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                      {displayedParticipants.map((participant, index) => (
                        <motion.div
                          key={participant.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <div 
                            className={`bg-gradient-to-br from-[#18221E] to-[#121715] rounded-xl border border-[#223029] transition-all overflow-hidden ${expandedTeamId === participant.id ? 'ring-2 ring-[#F59E0B]/40 shadow-lg' : 'hover:border-[#F59E0B]/40 hover:shadow-md'}`}
                          >
                            <div 
                                className="flex items-center gap-3 p-4 cursor-pointer active:scale-98 transition-transform"
                                onClick={() => setExpandedTeamId(expandedTeamId === participant.id ? null : participant.id)}
                            >
                                {cup.signup_type === 'team' && participant.team ? (
                                  <>
                                    {participant.team.logo_url ? (
                                      <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-[#223029]">
                                        <img src={participant.team.logo_url} alt={participant.team.name} className="w-full h-full object-cover" />
                                      </div>
                                    ) : (
                                      <div className="w-12 h-12 lg:w-14 lg:h-14 bg-[#F59E0B]/20 rounded-xl flex items-center justify-center flex-shrink-0 ring-2 ring-[#F59E0B]/30">
                                        <Users className="w-6 h-6 text-[#F59E0B]" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-bold text-[#F4F7F5] truncate text-sm lg:text-base">{participant.team.name}</p>
                                            {participant.status === 'pending' && (
                                                <Badge className="h-5 bg-[#EAB308]/20 text-[#FDE047] border-0 px-2 text-[10px] font-bold">Väntar</Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-[#B6C2BC] flex items-center gap-1">
                                          <MapPin className="w-3 h-3" />
                                          {participant.team.city}
                                        </p>
                                    </div>
                                    {expandedTeamId === participant.id ? 
                                      <ChevronUp className="w-5 h-5 text-[#F59E0B]" /> : 
                                      <ChevronDown className="w-5 h-5 text-[#7B8A83]" />
                                    }
                                  </>
                                ) : (
                                  <>
                                    <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-[#2BA84A]/30 shadow-lg">
                                      <span className="text-white font-bold text-base lg:text-lg">
                                        {participant.user?.full_name?.[0] || 'U'}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="font-bold text-[#F4F7F5] truncate text-sm lg:text-base">{participant.user?.full_name || 'Spelare'}</p>
                                        {participant.status === 'pending' && (
                                            <Badge className="h-5 bg-[#EAB308]/20 text-[#FDE047] border-0 px-2 text-[10px] font-bold">Väntar</Badge>
                                        )}
                                      </div>
                                      {participant.preferred_position && participant.preferred_position !== 'any' && (
                                        <p className="text-xs text-[#B6C2BC] capitalize font-medium">{participant.preferred_position}</p>
                                      )}
                                    </div>
                                  </>
                                )}
                            </div>

                            {/* Expanded Content - Mobile Enhanced */}
                            <AnimatePresence>
                                {expandedTeamId === participant.id && cup.signup_type === 'team' && participant.team && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-[#223029] bg-[#0F1513] px-4 py-4"
                                    >
                                        {/* Member List - Enhanced */}
                                        <div className="space-y-2.5 mb-4">
                                            <p className="text-[10px] lg:text-xs font-bold text-[#7B8A83] uppercase tracking-wider flex items-center gap-2">
                                              <Users className="w-3 h-3" />
                                              Spelare ({participant.team_members?.length || 0})
                                            </p>
                                            {participant.team_members?.map(member => (
                                                <div key={member.user_id} className="flex items-center gap-2.5 p-2 bg-[#18221E] rounded-lg">
                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2BA84A] to-[#248232] flex items-center justify-center text-xs font-bold text-white">
                                                        {member.user?.full_name?.[0] || 'U'}
                                                    </div>
                                                    <span className="text-xs lg:text-sm font-medium text-[#F4F7F5] flex-1">{member.user?.full_name || 'Okänd'}</span>
                                                    {member.role === 'captain' && (
                                                      <Badge className="h-5 text-[10px] bg-[#F59E0B]/20 text-[#FCD34D] border-0 px-2 font-bold">Kapten</Badge>
                                                    )}
                                                </div>
                                            ))}
                                            {(!participant.team_members || participant.team_members.length === 0) && (
                                                <p className="text-xs text-[#7B8A83] italic p-2">Inga spelare listade</p>
                                            )}
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-2">
                                            {!userParticipant && cup.status !== 'completed' && (
                                                <Button 
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleJoinTeam(participant.team.id, participant.team.name);
                                                    }}
                                                    className="flex-1 h-11 bg-gradient-to-r from-[#2BA84A] to-[#248232] hover:from-[#248232] hover:to-[#1D6B28] text-white text-sm font-bold gap-2 shadow-lg"
                                                    disabled={joinTeamMutation.isPending}
                                                >
                                                    <UserPlus className="w-4 h-4" />
                                                    {joinTeamMutation.isPending ? 'Går med...' : 'Gå med i laget'}
                                                </Button>
                                            )}

                                            {canManage && participant.status === 'pending' && (
                                                <>
                                                    <Button 
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleApproveTeam(participant.id, participant.team?.name || participant.user?.full_name);
                                                        }}
                                                        className="flex-1 h-11 bg-gradient-to-r from-[#2BA84A] to-[#248232] hover:from-[#248232] hover:to-[#1D6B28] text-white text-sm font-bold gap-2 shadow-lg"
                                                        disabled={approveSignupMutation.isPending}
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        {approveSignupMutation.isPending ? 'Godkänner...' : 'Godkänn'}
                                                    </Button>
                                                    <Button 
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleDeclineTeam(participant.id, participant.team?.name || participant.user?.full_name);
                                                        }}
                                                        className="flex-1 h-11 bg-gradient-to-r from-[#EF4444] to-[#DC2626] hover:from-[#DC2626] hover:to-[#B91C1C] text-white text-sm font-bold gap-2 shadow-lg"
                                                        disabled={declineSignupMutation.isPending}
                                                    >
                                                        <X className="w-4 h-4" />
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

        {/* Tournament MVP Section - Mobile Enhanced */}
        {isFinalCompleted && canManage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-gradient-to-br from-[#FFD700]/15 to-[#FFA500]/5 border-2 border-[#FFD700]/40 rounded-2xl mt-6 shadow-[0_12px_40px_rgba(255,215,0,0.3)]">
              <CardContent className="p-5 lg:p-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center shadow-xl ring-4 ring-[#FFD700]/30">
                    <Crown className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-lg lg:text-2xl font-black text-white mb-1">Turnerings-MVP</h3>
                    {hasMvp ? (
                      <p className="text-xs lg:text-sm text-[#B6C2BC] font-medium">MVP har valts för denna turnering</p>
                    ) : (
                      <p className="text-xs lg:text-sm text-[#B6C2BC] font-medium">Välj den bästa spelaren i turneringen</p>
                    )}
                  </div>
                  <Button
                    onClick={() => setShowMvpModal(true)}
                    className="w-full sm:w-auto bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFA500] hover:to-[#FF8C00] text-black font-black text-sm lg:text-base h-12 px-6 shadow-xl rounded-xl"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    {hasMvp ? 'Ändra MVP' : 'Välj MVP'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Tournament MVP Modal */}
      {showMvpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Suspense fallback={<PageLoadingSkeleton />}>
            <TournamentMvpModal
              cup={cup}
              participants={participants}
              onClose={() => setShowMvpModal(false)}
              onSuccess={() => {
                queryClient.invalidateQueries(['cupDetails', cupId]);
              }}
            />
          </Suspense>
        </div>
      )}

      {/* Cup Players Modal */}
      {showPlayersModal && canManage && (
        <Suspense fallback={<PageLoadingSkeleton />}>
          <CupPlayersModal
            cup={cup}
            onClose={() => setShowPlayersModal(false)}
          />
        </Suspense>
      )}
    </div>
  );
}