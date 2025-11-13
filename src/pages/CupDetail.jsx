import React, { useState, Suspense, lazy } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, Calendar, MapPin, Users, Target, Info, 
  UserPlus, CheckCircle, Clock, ArrowLeft, Shield,
  Bell, BellOff, Layout, ListChecks, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { PageLoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useCustomDialog } from "../components/ui/custom-dialog";
import { CUPS_QUERY_KEY } from "../components/dashboard/CupsWidget";

const CupSignupModule = lazy(() => import("../components/cups/CupSignupModule"));
const CupGroupStage = lazy(() => import("../components/cups/CupGroupStage"));
const CupBracket = lazy(() => import("../components/cups/CupBracket"));
const CupMatches = lazy(() => import("../components/cups/CupMatches"));
const CupAdminPanel = lazy(() => import("../components/cups/CupAdminPanel"));

// Golden/Yellow theme status config
const STATUS_CONFIG = {
  upcoming: { label: 'Kommande', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: Calendar },
  registration_open: { label: 'Anmälan öppen', color: 'bg-[#F59E0B]/20 text-[#FCD34D] border-[#F59E0B]/30', icon: CheckCircle },
  registration_closed: { label: 'Anmälan stängd', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', icon: Clock },
  ongoing: { label: 'Pågående', color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: Trophy },
  completed: { label: 'Avslutad', color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', icon: Trophy }
};

export default function CupDetailPage() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { confirm, alert, DialogContainer } = useCustomDialog();
  const [activeTab, setActiveTab] = useState('info');
  
  const urlParams = new URLSearchParams(location.search);
  const cupId = urlParams.get('cup_id');

  // Fetch user
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    staleTime: 10 * 60 * 1000,
  });

  // Fetch cup details with shared cache
  const { data: cupData, isLoading } = useQuery({
    queryKey: ['cupDetails', cupId],
    queryFn: async () => {
      const response = await base44.functions.invoke('cups/getCupDetails', { cup_id: cupId });
      return response.data;
    },
    enabled: !!cupId,
    staleTime: 30 * 1000,
  });

  // Toggle notifications
  const toggleNotificationsMutation = useMutation({
    mutationFn: async (enabled) => {
      // Placeholder for future implementation
      return { enabled };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupDetails', cupId] });
      queryClient.invalidateQueries({ queryKey: CUPS_QUERY_KEY });
    }
  });

  const cup = cupData?.cup;
  const participants = cupData?.participants || [];
  const groups = cupData?.groups || [];
  const matches = cupData?.matches || [];
  const brackets = cupData?.brackets || [];
  const stats = cupData?.stats || {};

  const isOrganizer = user && cup?.organizer_id === user.id;
  const isAdmin = user?.role === 'admin';
  const canManage = isOrganizer || isAdmin;

  // Check if user is signed up
  const userParticipant = participants.find(p => 
    (p.user_id === user?.id) || 
    (p.team_id && user?.team_ids?.includes(p.team_id))
  );

  if (isLoading || !cup) {
    return <PageLoadingSkeleton />;
  }

  const statusConfig = STATUS_CONFIG[cup.status] || STATUS_CONFIG.upcoming;
  const StatusIcon = statusConfig.icon;
  const isHot = cup.status === 'registration_open' && (cup.current_participants / cup.max_participants) > 0.7;

  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <DialogContainer />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Back Button */}
        <Link to={createPageUrl("Community") + "?tab=cups"}>
          <Button variant="ghost" className="text-[#B6C2BC] hover:text-[#F4F7F5] gap-2">
            <ArrowLeft className="w-4 h-4" />
            Tillbaka till Community
          </Button>
        </Link>

        {/* Header Card with Enhanced Golden Theme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-[#121715] to-[#0F2917]/20 border border-[#F59E0B]/40 shadow-[0_0_30px_rgba(245,158,11,0.2)] rounded-[20px] overflow-hidden">
            {/* Banner with Golden Gradient */}
            {cup.logo_url ? (
              <div className="h-56 bg-gradient-to-br from-[#F59E0B]/20 to-[#D97706]/10 relative overflow-hidden">
                <img 
                  src={cup.logo_url} 
                  alt={cup.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121715] via-transparent to-transparent"></div>
                
                {/* Hot Badge */}
                {isHot && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white border-0 gap-2 px-4 py-2 text-sm font-bold shadow-xl">
                      <Zap className="w-4 h-4" />
                      Populär turnering
                    </Badge>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-56 bg-gradient-to-br from-[#F59E0B]/20 to-[#D97706]/10 flex items-center justify-center relative overflow-hidden">
                <Trophy className="w-28 h-28 text-[#F59E0B]/50" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121715] via-transparent to-transparent"></div>
                
                {isHot && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white border-0 gap-2 px-4 py-2 text-sm font-bold shadow-xl">
                      <Zap className="w-4 h-4" />
                      Populär turnering
                    </Badge>
                  </div>
                )}
              </div>
            )}

            <CardContent className="p-6 -mt-12 relative z-10">
              {/* Status and Actions */}
              <div className="flex items-start justify-between mb-4">
                <Badge className={`${statusConfig.color} px-4 py-2 text-sm font-bold border shadow-lg`}>
                  <StatusIcon className="w-4 h-4 mr-2" />
                  {statusConfig.label}
                </Badge>

                <div className="flex gap-2">
                  {canManage && (
                    <Button 
                      variant="outline"
                      className="border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B] hover:text-white gap-2"
                      onClick={() => setActiveTab('admin')}
                    >
                      <Shield className="w-4 h-4" />
                      Admin
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline"
                    className="border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] hover:text-[#F4F7F5]"
                    onClick={() => toggleNotificationsMutation.mutate(!cup.notifications_enabled)}
                  >
                    {cup.notifications_enabled ? (
                      <Bell className="w-4 h-4" />
                    ) : (
                      <BellOff className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-[#F4F7F5] mb-6">
                {cup.name}
              </h1>

              {/* Key Info with Golden Icons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-[#B6C2BC]">
                    <MapPin className="w-4 h-4 text-[#F59E0B]" />
                    <span className="font-medium">Plats</span>
                  </div>
                  <p className="text-[#F4F7F5] font-semibold">{cup.location}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-[#B6C2BC]">
                    <Calendar className="w-4 h-4 text-[#F59E0B]" />
                    <span className="font-medium">Datum</span>
                  </div>
                  <p className="text-[#F4F7F5] font-semibold">
                    {new Date(cup.start_date).toLocaleDateString('sv-SE', { 
                      month: 'short', 
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-[#B6C2BC]">
                    <Users className="w-4 h-4 text-[#F59E0B]" />
                    <span className="font-medium">Deltagare</span>
                  </div>
                  <p className="text-[#F4F7F5] font-semibold">
                    {cup.current_participants}/{cup.max_participants}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-[#B6C2BC]">
                    <Target className="w-4 h-4 text-[#F59E0B]" />
                    <span className="font-medium">Format</span>
                  </div>
                  <p className="text-[#F4F7F5] font-semibold">{cup.format}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[#B6C2BC] font-medium">Anmälningsstatus</span>
                  <span className="text-[#F59E0B] font-bold">{Math.round((cup.current_participants / cup.max_participants) * 100)}%</span>
                </div>
                <div className="h-2 bg-[#18221E] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(cup.current_participants / cup.max_participants) * 100}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] rounded-full"
                  />
                </div>
              </div>

              {/* Signup Status */}
              {userParticipant && (
                <div className="mb-4 p-4 bg-gradient-to-r from-[#F59E0B]/15 to-[#D97706]/10 border border-[#F59E0B]/40 rounded-xl shadow-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-[#F59E0B]" />
                    <div>
                      <p className="font-bold text-[#F4F7F5]">Du är anmäld!</p>
                      <p className="text-sm text-[#B6C2BC]">
                        Status: {userParticipant.status === 'confirmed' ? '✓ Bekräftad' : '⏳ Väntar'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs with Golden Theme */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 lg:grid-cols-5 gap-2 bg-transparent border-0 p-0">
            <TabsTrigger 
              value="info" 
              className={`gap-2 h-12 rounded-xl transition-all ${
                activeTab === 'info'
                  ? 'bg-[#0F1513] text-[#F59E0B] ring-1 ring-[#F59E0B]/40'
                  : 'bg-[#121715] text-[#7B8A83] hover:bg-[#18221E] hover:text-[#B6C2BC]'
              }`}
            >
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">Info</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="signup" 
              className={`gap-2 h-12 rounded-xl transition-all ${
                activeTab === 'signup'
                  ? 'bg-[#0F1513] text-[#F59E0B] ring-1 ring-[#F59E0B]/40'
                  : 'bg-[#121715] text-[#7B8A83] hover:bg-[#18221E] hover:text-[#B6C2BC]'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Anmälan</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="schedule" 
              className={`gap-2 h-12 rounded-xl transition-all ${
                activeTab === 'schedule'
                  ? 'bg-[#0F1513] text-[#F59E0B] ring-1 ring-[#F59E0B]/40'
                  : 'bg-[#121715] text-[#7B8A83] hover:bg-[#18221E] hover:text-[#B6C2BC]'
              }`}
            >
              <Layout className="w-4 h-4" />
              <span className="hidden sm:inline">Schema</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="matches" 
              className={`gap-2 h-12 rounded-xl transition-all ${
                activeTab === 'matches'
                  ? 'bg-[#0F1513] text-[#F59E0B] ring-1 ring-[#F59E0B]/40'
                  : 'bg-[#121715] text-[#7B8A83] hover:bg-[#18221E] hover:text-[#B6C2BC]'
              }`}
            >
              <ListChecks className="w-4 h-4" />
              <span className="hidden sm:inline">Matcher</span>
            </TabsTrigger>

            {canManage && (
              <TabsTrigger 
                value="admin" 
                className={`gap-2 h-12 rounded-xl transition-all ${
                  activeTab === 'admin'
                    ? 'bg-[#0F1513] text-[#F59E0B] ring-1 ring-[#F59E0B]/40'
                    : 'bg-[#121715] text-[#7B8A83] hover:bg-[#18221E] hover:text-[#B6C2BC]'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </TabsTrigger>
            )}
          </TabsList>

          <AnimatePresence mode="wait">
            {/* Info Tab */}
            <TabsContent value="info">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
              >
                <Card className="bg-[#121715] border border-[#223029] rounded-[20px] p-6">
                  <h2 className="text-xl font-bold text-[#F4F7F5] mb-4">Om turneringen</h2>
                  
                  {cup.description && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-[#B6C2BC] mb-2">Beskrivning</h3>
                      <p className="text-[#F4F7F5] whitespace-pre-wrap">{cup.description}</p>
                    </div>
                  )}

                  {cup.rules && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-[#B6C2BC] mb-2">Regler</h3>
                      <div className="max-h-96 overflow-y-auto p-4 bg-[#0F1513] rounded-xl border border-[#F59E0B]/20">
                        <p className="text-[#F4F7F5] whitespace-pre-wrap">{cup.rules}</p>
                      </div>
                    </div>
                  )}

                  {cup.prize && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-[#B6C2BC] mb-2">Priser</h3>
                      <div className="p-4 bg-gradient-to-r from-[#FFD700]/15 to-[#FFA500]/10 rounded-xl border border-[#FFD700]/40 shadow-lg">
                        <p className="text-[#F4F7F5] font-bold text-lg">{cup.prize}</p>
                      </div>
                    </div>
                  )}

                  {/* Tournament Details Grid */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-[#0F1513] rounded-xl border border-[#F59E0B]/10">
                      <p className="text-sm text-[#B6C2BC] mb-1">Anmälningstyp</p>
                      <p className="text-lg font-bold text-[#F4F7F5]">
                        {cup.signup_type === 'team' ? '👥 Lag' : '⚽ Solo'}
                      </p>
                    </div>

                    <div className="p-4 bg-[#0F1513] rounded-xl border border-[#F59E0B]/10">
                      <p className="text-sm text-[#B6C2BC] mb-1">Nivå</p>
                      <p className="text-lg font-bold text-[#F4F7F5]">
                        {cup.skill_level === 'mixed' ? 'Blandad' : 
                         cup.skill_level === 'beginner' ? 'Nybörjare' : 
                         cup.skill_level === 'intermediate' ? 'Medel' : 
                         cup.skill_level === 'advanced' ? 'Avancerad' : 'Elite'}
                      </p>
                    </div>

                    {cup.entry_fee > 0 && (
                      <div className="p-4 bg-[#0F1513] rounded-xl border border-[#F59E0B]/10">
                        <p className="text-sm text-[#B6C2BC] mb-1">Anmälningsavgift</p>
                        <p className="text-lg font-bold text-[#F59E0B]">{cup.entry_fee} kr</p>
                      </div>
                    )}

                    {cup.registration_deadline && (
                      <div className="p-4 bg-[#0F1513] rounded-xl border border-[#F59E0B]/10">
                        <p className="text-sm text-[#B6C2BC] mb-1">Sista anmälningsdag</p>
                        <p className="text-lg font-bold text-[#F4F7F5]">
                          {new Date(cup.registration_deadline).toLocaleDateString('sv-SE')}
                        </p>
                      </div>
                    )}

                    {cup.has_group_stage && (
                      <div className="p-4 bg-[#0F1513] rounded-xl border border-[#F59E0B]/10">
                        <p className="text-sm text-[#B6C2BC] mb-1">Antal grupper</p>
                        <p className="text-lg font-bold text-[#F4F7F5]">{cup.number_of_groups}</p>
                      </div>
                    )}

                    {cup.has_playoffs && (
                      <div className="p-4 bg-[#0F1513] rounded-xl border border-[#F59E0B]/10">
                        <p className="text-sm text-[#B6C2BC] mb-1">Slutspel</p>
                        <p className="text-lg font-bold text-[#2BA84A]">✓ Aktiverat</p>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup">
              <Suspense fallback={<PageLoadingSkeleton />}>
                <CupSignupModule 
                  cup={cup}
                  user={user}
                  participants={participants}
                  userParticipant={userParticipant}
                />
              </Suspense>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
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
              </motion.div>
            </TabsContent>

            {/* Matches Tab */}
            <TabsContent value="matches">
              <Suspense fallback={<PageLoadingSkeleton />}>
                <CupMatches 
                  cup={cup}
                  matches={matches}
                  canManage={canManage}
                />
              </Suspense>
            </TabsContent>

            {/* Admin Tab */}
            {canManage && (
              <TabsContent value="admin">
                <Suspense fallback={<PageLoadingSkeleton />}>
                  <CupAdminPanel 
                    cup={cup}
                    participants={participants}
                    groups={groups}
                    matches={matches}
                  />
                </Suspense>
              </TabsContent>
            )}
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
}