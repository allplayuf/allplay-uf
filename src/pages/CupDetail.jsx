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
  Bell, BellOff, Layout, ListChecks
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { PageLoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useCustomDialog } from "../components/ui/custom-dialog";

const CupSignupModule = lazy(() => import("../components/cups/CupSignupModule"));
const CupGroupStage = lazy(() => import("../components/cups/CupGroupStage"));
const CupBracket = lazy(() => import("../components/cups/CupBracket"));
const CupMatches = lazy(() => import("../components/cups/CupMatches"));
const CupAdminPanel = lazy(() => import("../components/cups/CupAdminPanel"));

const STATUS_CONFIG = {
  upcoming: { label: 'Kommande', color: 'bg-blue-500/20 text-blue-300', icon: Calendar },
  registration_open: { label: 'Anmälan öppen', color: 'bg-green-500/20 text-green-300', icon: CheckCircle },
  registration_closed: { label: 'Anmälan stängd', color: 'bg-yellow-500/20 text-yellow-300', icon: Clock },
  ongoing: { label: 'Pågående', color: 'bg-orange-500/20 text-orange-300', icon: Trophy },
  completed: { label: 'Avslutad', color: 'bg-gray-500/20 text-gray-300', icon: Trophy }
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

  // Fetch cup details
  const { data: cupData, isLoading } = useQuery({
    queryKey: ['cupDetails', cupId],
    queryFn: async () => {
      const response = await base44.functions.invoke('cups/getCupDetails', `?cup_id=${cupId}`);
      return response.data;
    },
    enabled: !!cupId,
    staleTime: 30 * 1000,
  });

  // Toggle notifications
  const toggleNotificationsMutation = useMutation({
    mutationFn: async (enabled) => {
      // This would be stored in user preferences
      // For now, just a placeholder
      return { enabled };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupDetails', cupId] });
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
    (p.team && user?.teams?.some(t => t.id === p.team_id))
  );

  if (isLoading || !cup) {
    return <PageLoadingSkeleton />;
  }

  const statusConfig = STATUS_CONFIG[cup.status] || STATUS_CONFIG.upcoming;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <DialogContainer />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Back Button */}
        <Link to={createPageUrl("Cups")}>
          <Button variant="ghost" className="text-[#B6C2BC] hover:text-[#F4F7F5] gap-2">
            <ArrowLeft className="w-4 h-4" />
            Tillbaka till turneringar
          </Button>
        </Link>

        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-[#121715] to-[#0F2917]/20 border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[20px] overflow-hidden">
            {/* Banner */}
            {cup.logo_url ? (
              <div className="h-48 bg-gradient-to-br from-[#2BA84A]/20 to-[#0F2917] relative">
                <img 
                  src={cup.logo_url} 
                  alt={cup.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121715] to-transparent"></div>
              </div>
            ) : (
              <div className="h-48 bg-gradient-to-br from-[#F4743B]/20 to-[#E5683A]/10 flex items-center justify-center relative">
                <Trophy className="w-24 h-24 text-[#F4743B]/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121715] to-transparent"></div>
              </div>
            )}

            <CardContent className="p-6 -mt-12 relative z-10">
              {/* Status and Actions */}
              <div className="flex items-start justify-between mb-4">
                <Badge className={`${statusConfig.color} px-4 py-2 text-sm font-bold`}>
                  <StatusIcon className="w-4 h-4 mr-2" />
                  {statusConfig.label}
                </Badge>

                <div className="flex gap-2">
                  {canManage && (
                    <Button 
                      variant="outline"
                      className="border-[#F4743B] text-[#F4743B] hover:bg-[#F4743B] hover:text-white gap-2"
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
              <h1 className="text-3xl font-bold text-[#F4F7F5] mb-4">
                {cup.name}
              </h1>

              {/* Key Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-[#B6C2BC]">
                    <MapPin className="w-4 h-4 text-[#9FC9AC]" />
                    <span className="font-medium">Plats</span>
                  </div>
                  <p className="text-[#F4F7F5] font-semibold">{cup.location}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-[#B6C2BC]">
                    <Calendar className="w-4 h-4 text-[#9FC9AC]" />
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
                    <Users className="w-4 h-4 text-[#9FC9AC]" />
                    <span className="font-medium">Deltagare</span>
                  </div>
                  <p className="text-[#F4F7F5] font-semibold">
                    {cup.current_participants}/{cup.max_participants}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-[#B6C2BC]">
                    <Target className="w-4 h-4 text-[#9FC9AC]" />
                    <span className="font-medium">Format</span>
                  </div>
                  <p className="text-[#F4F7F5] font-semibold">{cup.format}</p>
                </div>
              </div>

              {/* Signup Status */}
              {userParticipant && (
                <div className="mb-4 p-4 bg-[#2BA84A]/10 border border-[#2BA84A]/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[#2BA84A]" />
                    <div>
                      <p className="font-semibold text-[#F4F7F5]">Du är anmäld!</p>
                      <p className="text-sm text-[#B6C2BC]">
                        Status: {userParticipant.status === 'confirmed' ? 'Bekräftad' : 'Väntar'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 lg:grid-cols-5 gap-2 bg-[#121715] p-2 rounded-xl">
            <TabsTrigger value="info" className="gap-2">
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">Info</span>
            </TabsTrigger>
            
            <TabsTrigger value="signup" className="gap-2">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Anmälan</span>
            </TabsTrigger>
            
            <TabsTrigger value="schedule" className="gap-2">
              <Layout className="w-4 h-4" />
              <span className="hidden sm:inline">Schema</span>
            </TabsTrigger>
            
            <TabsTrigger value="matches" className="gap-2">
              <ListChecks className="w-4 h-4" />
              <span className="hidden sm:inline">Matcher</span>
            </TabsTrigger>

            {canManage && (
              <TabsTrigger value="admin" className="gap-2 border-[#F4743B]/30">
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
                      <div className="max-h-96 overflow-y-auto p-4 bg-[#0F1513] rounded-xl">
                        <p className="text-[#F4F7F5] whitespace-pre-wrap">{cup.rules}</p>
                      </div>
                    </div>
                  )}

                  {cup.prize && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-[#B6C2BC] mb-2">Priser</h3>
                      <p className="text-[#F4F7F5]">{cup.prize}</p>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-[#0F1513] rounded-xl">
                      <p className="text-sm text-[#B6C2BC] mb-1">Anmälningstyp</p>
                      <p className="text-lg font-bold text-[#F4F7F5]">
                        {cup.signup_type === 'team' ? 'Lag' : 'Solo'}
                      </p>
                    </div>

                    <div className="p-4 bg-[#0F1513] rounded-xl">
                      <p className="text-sm text-[#B6C2BC] mb-1">Nivå</p>
                      <p className="text-lg font-bold text-[#F4F7F5]">
                        {cup.skill_level === 'mixed' ? 'Blandad' : 
                         cup.skill_level === 'beginner' ? 'Nybörjare' : 
                         cup.skill_level === 'intermediate' ? 'Medel' : 
                         cup.skill_level === 'advanced' ? 'Avancerad' : 'Elite'}
                      </p>
                    </div>

                    {cup.entry_fee > 0 && (
                      <div className="p-4 bg-[#0F1513] rounded-xl">
                        <p className="text-sm text-[#B6C2BC] mb-1">Anmälningsavgift</p>
                        <p className="text-lg font-bold text-[#F4F7F5]">{cup.entry_fee} kr</p>
                      </div>
                    )}

                    {cup.registration_deadline && (
                      <div className="p-4 bg-[#0F1513] rounded-xl">
                        <p className="text-sm text-[#B6C2BC] mb-1">Sista anmälningsdag</p>
                        <p className="text-lg font-bold text-[#F4F7F5]">
                          {new Date(cup.registration_deadline).toLocaleDateString('sv-SE')}
                        </p>
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