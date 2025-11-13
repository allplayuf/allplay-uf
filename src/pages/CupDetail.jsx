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
  CheckCircle, Clock, ListChecks, Layout
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

        {/* Hero Header */}
        <Card className="bg-[#121715] border-[#223029] rounded-2xl overflow-hidden mb-8 shadow-xl">
          {/* Banner */}
          <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden">
            {cup.logo_url ? (
              <>
                <img 
                  src={cup.logo_url} 
                  alt={cup.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121715] via-[#121715]/50 to-transparent"></div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-[#F59E0B]/20 via-[#121715] to-[#121715]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Trophy className="w-24 h-24 text-[#F59E0B]/30" strokeWidth={1.5} />
                </div>
              </>
            )}
          </div>

          <CardContent className="p-6 sm:p-8">
            {/* Title and Status Row */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#F4F7F5] mb-3">
                  {cup.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={`h-7 px-3 ${statusConfig.color} border-0 font-semibold text-sm flex items-center gap-1.5`}>
                    <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor} animate-pulse`}></div>
                    {statusConfig.label}
                  </Badge>
                  <Badge className="h-7 px-3 bg-[#18221E] text-[#B6C2BC] border-0 font-semibold text-sm">
                    {cup.format}
                  </Badge>
                  <Badge className="h-7 px-3 bg-[#18221E] text-[#B6C2BC] border-0 font-semibold text-sm">
                    {cup.signup_type === 'team' ? '👥 Lag' : '⚽ Solo'}
                  </Badge>
                </div>
              </div>

              {canManage && (
                <Button
                  onClick={() => setActiveTab('admin')}
                  className="h-12 px-5 bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#F59E0B] text-white gap-2.5 flex-shrink-0 font-bold shadow-lg rounded-xl ring-2 ring-[#F59E0B]/20 hover:ring-[#F59E0B]/40 transition-all"
                >
                  <Shield className="w-5 h-5" strokeWidth={2.5} />
                  Admin
                </Button>
              )}
            </div>

            {/* Key Info Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-[#0F1513] rounded-xl border border-[#223029]">
                <MapPin className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-[#7B8A83] mb-0.5">Plats</p>
                  <p className="text-sm font-semibold text-[#F4F7F5] truncate">{cup.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#0F1513] rounded-xl border border-[#223029]">
                <Calendar className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-[#7B8A83] mb-0.5">Datum</p>
                  <p className="text-sm font-semibold text-[#F4F7F5] truncate">
                    {new Date(cup.start_date).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#0F1513] rounded-xl border border-[#223029]">
                <Users className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-[#7B8A83] mb-0.5">Deltagare</p>
                  <p className="text-sm font-semibold text-[#F4F7F5]">
                    {cup.current_participants}/{cup.max_participants}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#0F1513] rounded-xl border border-[#223029]">
                <Target className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-[#7B8A83] mb-0.5">Nivå</p>
                  <p className="text-sm font-semibold text-[#F4F7F5] truncate">
                    {cup.skill_level === 'mixed' ? 'Blandad' : 
                     cup.skill_level === 'beginner' ? 'Nybörjare' : 
                     cup.skill_level === 'intermediate' ? 'Medel' : 
                     cup.skill_level === 'advanced' ? 'Avancerad' : 'Elite'}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#B6C2BC] font-medium">Anmälningsstatus</span>
                <span className="text-[#FCD34D] font-bold">
                  {Math.round((cup.current_participants / cup.max_participants) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-[#0F1513] rounded-full overflow-hidden border border-[#223029]">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(cup.current_participants / cup.max_participants) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-[#F59E0B] to-[#EAB308] rounded-full"
                  style={{
                    boxShadow: '0 0 8px rgba(245, 158, 11, 0.4)'
                  }}
                />
              </div>
            </div>

            {/* User Signup Status */}
            {userParticipant && (
              <div className="mt-4 p-4 bg-[#2BA84A]/10 border border-[#2BA84A]/30 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#2BA84A] flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#F4F7F5] text-sm">Du är anmäld!</p>
                  <p className="text-xs text-[#B6C2BC]">
                    Status: {userParticipant.status === 'confirmed' ? '✓ Bekräftad' : '⏳ Väntar'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Tabs - UTAN ADMIN TAB */}
        <div className="bg-[#121715] border border-[#223029] rounded-2xl p-2 mb-8 shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`h-11 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'overview'
                  ? 'bg-[#F59E0B]/16 text-[#FCD34D] ring-1 ring-[#F59E0B]/30'
                  : 'bg-transparent text-[#7B8A83] hover:text-[#F4F7F5] hover:bg-[#18221E]'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Översikt</span>
            </button>
            
            <button
              onClick={() => setActiveTab('signup')}
              className={`h-11 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'signup'
                  ? 'bg-[#F59E0B]/16 text-[#FCD34D] ring-1 ring-[#F59E0B]/30'
                  : 'bg-transparent text-[#7B8A83] hover:text-[#F4F7F5] hover:bg-[#18221E]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Anmälan</span>
            </button>
            
            <button
              onClick={() => setActiveTab('schedule')}
              className={`h-11 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'schedule'
                  ? 'bg-[#F59E0B]/16 text-[#FCD34D] ring-1 ring-[#F59E0B]/30'
                  : 'bg-transparent text-[#7B8A83] hover:text-[#F4F7F5] hover:bg-[#18221E]'
              }`}
            >
              <Layout className="w-4 h-4" />
              <span className="hidden sm:inline">Schema</span>
            </button>
            
            <button
              onClick={() => setActiveTab('matches')}
              className={`h-11 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'matches'
                  ? 'bg-[#F59E0B]/16 text-[#FCD34D] ring-1 ring-[#F59E0B]/30'
                  : 'bg-transparent text-[#7B8A83] hover:text-[#F4F7F5] hover:bg-[#18221E]'
              }`}
            >
              <ListChecks className="w-4 h-4" />
              <span className="hidden sm:inline">Matcher</span>
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
                    Anmälda {cup.signup_type === 'team' ? 'Lag' : 'Spelare'} ({confirmedParticipants.length})
                  </h3>
                  
                  {confirmedParticipants.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-[#7B8A83] mx-auto mb-3" />
                      <p className="text-[#B6C2BC]">Inga bekräftade deltagare än</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {confirmedParticipants.map((participant, index) => (
                        <motion.div
                          key={participant.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <div className="flex items-center gap-3 p-3 bg-[#18221E] rounded-xl border border-[#223029] hover:border-[#F59E0B]/30 transition-all">
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
                                  <Link to={`${createPageUrl("TeamOverview")}?id=${participant.team.id}`} className="hover:underline">
                                    <p className="font-semibold text-[#F4F7F5] truncate text-sm">{participant.team.name}</p>
                                    <p className="text-xs text-[#B6C2BC]">{participant.team.city}</p>
                                  </Link>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="w-10 h-10 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-semibold text-sm">
                                    {participant.user?.full_name?.[0] || 'U'}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-[#F4F7F5] truncate text-sm">{participant.user?.full_name || 'Spelare'}</p>
                                  {participant.preferred_position && participant.preferred_position !== 'any' && (
                                    <p className="text-xs text-[#B6C2BC] capitalize">{participant.preferred_position}</p>
                                  )}
                                </div>
                              </>
                            )}
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