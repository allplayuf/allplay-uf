import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, Flag, MapPin, Trophy, AlertTriangle, RefreshCw, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useCustomDialog } from "../components/ui/custom-dialog";
import { checkIsAdmin } from "../components/supabase/services/adminService";
import { useSupabaseAuth } from "../components/supabase/AuthProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getVenues, deleteVenues } from "../components/supabase/services/venuesService";
import { getPublicMatches, deleteMatchRest } from "../components/supabase/services/matchesService";
import { getTeams, deleteTeamRest } from "../components/supabase/services/teamsService";
import { searchPlayers } from "../components/supabase/services/playersService";
import { PageLoadingSkeleton } from "../components/ui/loading-skeleton";
import { getReports, handleReport } from "../components/supabase/services/reportsService";

import ModerationQueue from "../components/admin/ModerationQueue";
import AdminAnalytics from "../components/admin/AdminAnalytics";
import UserManagement from "../components/admin/UserManagement";
import VenueManagement from "../components/admin/VenueManagement";
import MatchManagement from "../components/admin/MatchManagement";
import TeamManagement from "../components/admin/TeamManagement";
import AdminStatCard from "../components/admin/AdminStatCard";
import AdminTabBar from "../components/admin/AdminTabBar";

export default function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirm, alert, DialogContainer } = useCustomDialog();
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState('users');

  // Admin check
  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ['admin-check', authUser?.id],
    queryFn: () => checkIsAdmin({ forceRefresh: true }),
    enabled: isAuthenticated && !!authUser?.id,
    staleTime: 60000,
  });

  // Supabase data fetching
  const { data: users = [], isLoading: usersLoading, dataUpdatedAt: usersUpdatedAt } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const result = await searchPlayers({ limit: 500, offset: 0 });
      return result.players || [];
    },
    enabled: !!isAdmin,
    staleTime: 30000,
  });

  const { data: venues = [], isLoading: venuesLoading, dataUpdatedAt: venuesUpdatedAt } = useQuery({
    queryKey: ['admin-venues'],
    queryFn: () => getVenues(),
    enabled: !!isAdmin,
    staleTime: 30000,
  });

  const { data: matches = [], isLoading: matchesLoading, dataUpdatedAt: matchesUpdatedAt } = useQuery({
    queryKey: ['admin-matches'],
    queryFn: () => getPublicMatches(),
    enabled: !!isAdmin,
    staleTime: 30000,
  });

  const { data: teams = [], isLoading: teamsLoading, dataUpdatedAt: teamsUpdatedAt } = useQuery({
    queryKey: ['admin-teams'],
    queryFn: () => getTeams(),
    enabled: !!isAdmin,
    staleTime: 30000,
  });

  const { data: reports = [], isLoading: reportsLoading, dataUpdatedAt: reportsUpdatedAt } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      try {
        const result = await getReports();
        return Array.isArray(result) ? result : (result?.reports || []);
      } catch (e) {
        console.warn('[Admin] getReports failed:', e.message);
        return [];
      }
    },
    enabled: !!isAdmin,
    staleTime: 30000,
  });

  const refreshAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['admin-venues'] });
    queryClient.invalidateQueries({ queryKey: ['admin-matches'] });
    queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
    queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
  }, [queryClient]);

  const handleReportAction = async (reportId, action, notes) => {
    try {
      await handleReport(reportId, action, notes);
      await alert('Rapport uppdaterad', `Åtgärd: ${action}`, { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    } catch (error) {
      console.error('[Admin] handleReportAction failed:', error);
      await alert('Fel', error.message || 'Kunde inte uppdatera rapport.', { type: 'alert' });
    }
  };

  const handleDeleteMatch = async (matchId, matchTitle) => {
    const shouldDelete = await confirm('Radera match', `Radera "${matchTitle}"? Kan inte ångras.`, {
      type: 'warning', confirmText: 'Ja, radera', cancelText: 'Avbryt'
    });
    if (!shouldDelete) return;
    try {
      await deleteMatchRest(matchId);
      await alert('Raderad', 'Matchen har raderats.', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['admin-matches'] });
    } catch (error) {
      await alert('Fel', error.message || 'Kunde inte radera matchen.', { type: 'alert' });
    }
  };

  const handleDeleteTeam = async (teamId, teamName) => {
    const shouldDelete = await confirm('Radera lag', `Radera "${teamName}"? Kan inte ångras.`, {
      type: 'warning', confirmText: 'Ja, radera', cancelText: 'Avbryt'
    });
    if (!shouldDelete) return;
    try {
      await deleteTeamRest(teamId);
      await alert('Raderat', 'Laget har raderats.', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
    } catch (error) {
      await alert('Fel', error.message || 'Kunde inte radera laget.', { type: 'alert' });
    }
  };

  const handleDeleteDuplicateVenues = async (duplicateIds) => {
    const shouldDelete = await confirm(
      'Radera dubbletter',
      `Radera ${duplicateIds.length} dubblett-planer? Behåller den första av varje.`,
      { type: 'warning', confirmText: 'Ja, radera', cancelText: 'Avbryt' }
    );
    if (!shouldDelete) return;
    try {
      const result = await deleteVenues(duplicateIds);
      const deletedCount = result.deleted || 0;
      const errorCount = result.errors?.length || 0;

      if (errorCount > 0 && deletedCount > 0) {
        await alert('Delvis klart', `${deletedCount} raderade, ${errorCount} misslyckades.`, { type: 'warning' });
      } else if (errorCount > 0) {
        await alert('Fel', `Ingen plan raderades. Kolla RLS-policys.`, { type: 'alert' });
      } else {
        await alert('Klart', `${deletedCount} dubbletter raderade.`, { type: 'success' });
      }
      await queryClient.refetchQueries({ queryKey: ['admin-venues'] });
    } catch (error) {
      await alert('Fel', error.message || 'Kunde inte radera dubbletter.', { type: 'alert' });
      await queryClient.refetchQueries({ queryKey: ['admin-venues'] });
    }
  };

  const pendingReports = useMemo(() => reports.filter(r => r.status === 'pending').length, [reports]);
  const dataLoading = usersLoading || venuesLoading || matchesLoading || teamsLoading || reportsLoading;

  const statCards = useMemo(() => ([
    { label: 'Användare', tab: 'users', count: users.length, color: '#2BA84A', icon: Users, loading: usersLoading },
    { label: 'Matcher', tab: 'matches', count: matches.length, color: '#F4743B', icon: Trophy, loading: matchesLoading },
    { label: 'Lag', tab: 'teams', count: teams.length, color: '#4169E1', icon: Shield, loading: teamsLoading },
    { label: 'Planer', tab: 'venues', count: venues.length, color: '#9370DB', icon: MapPin, loading: venuesLoading },
    { label: 'Rapporter', tab: 'reports', count: pendingReports, color: '#DC2626', icon: Flag, loading: reportsLoading },
  ]), [users.length, matches.length, teams.length, venues.length, pendingReports, usersLoading, matchesLoading, teamsLoading, venuesLoading, reportsLoading]);

  const tabs = useMemo(() => ([
    { value: 'analytics', label: 'Analys', icon: BarChart3, color: '#28A34A' },
    { value: 'users', label: 'Användare', icon: Users, color: '#2BA84A' },
    { value: 'matches', label: 'Matcher', icon: Trophy, color: '#F4743B' },
    { value: 'teams', label: 'Lag', icon: Shield, color: '#4169E1' },
    { value: 'venues', label: 'Planer', icon: MapPin, color: '#9370DB' },
    { value: 'reports', label: 'Rapporter', icon: Flag, color: '#DC2626', badge: pendingReports },
  ]), [pendingReports]);

  // Loading states
  if (authLoading || adminLoading) return <PageLoadingSkeleton />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0F1513] flex items-center justify-center p-4">
        <DialogContainer />
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px] max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#DC2626]/15 ring-1 ring-[#DC2626]/30 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-[#DC2626]" />
            </div>
            <h2 className="text-xl font-bold text-[#F4F7F5] mb-2">Åtkomst nekad</h2>
            <p className="text-[#B6C2BC] mb-6">Du har inte behörighet att se denna sida.</p>
            <Button onClick={() => navigate(createPageUrl('Dashboard'))} className="bg-[#2BA84A] hover:bg-[#248232] text-white">
              Tillbaka till Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <DialogContainer />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Premium Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-[24px] border border-[#223029] bg-gradient-to-br from-[#141917] via-[#121715] to-[#0F1513] p-5 sm:p-6"
        >
          <div aria-hidden className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#2BA84A]/12 blur-3xl pointer-events-none" />
          <div aria-hidden className="absolute -bottom-32 -left-24 w-64 h-64 rounded-full bg-[#F4743B]/08 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#2BA84A]/15 ring-1 ring-[#2BA84A]/30 flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#2BA84A]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-[28px] font-black text-[#F4F7F5] leading-tight tracking-tight">Admin Panel</h1>
                <p className="text-[13px] text-[#9EAAA4] mt-0.5">Hantera plattformen i realtid från Supabase</p>
              </div>
            </div>
            <Button
              onClick={refreshAll}
              variant="outline"
              disabled={dataLoading}
              className="border-[#223029] bg-[#0F1513]/60 text-[#F4F7F5] hover:bg-[#18221E] rounded-xl h-10 gap-2 flex-shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-semibold">Uppdatera</span>
            </Button>
          </div>
        </motion.div>

        {/* Pending reports alert — prominent + actionable */}
        <AnimatePresence>
          {pendingReports > 0 && (
            <motion.button
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              onClick={() => setActiveTab('reports')}
              className="w-full text-left p-4 bg-gradient-to-r from-[#F4743B]/18 to-[#F4743B]/08 border border-[#F4743B]/40 rounded-[16px] flex items-center gap-3 hover:border-[#F4743B]/60 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F4743B]/20 ring-1 ring-[#F4743B]/40 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#F4743B]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[#F4F7F5] text-sm">{pendingReports} väntande rapporter</div>
                <div className="text-xs text-[#CFB39B]">Tryck för att granska och åtgärda</div>
              </div>
              <div className="text-[#F4743B] text-sm font-bold flex-shrink-0">→</div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Quick-jump stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {statCards.map((s, i) => (
            <AdminStatCard
              key={s.label}
              index={i}
              label={s.label}
              count={s.count}
              color={s.color}
              icon={s.icon}
              loading={s.loading}
              active={activeTab === s.tab}
              onClick={() => setActiveTab(s.tab)}
            />
          ))}
        </div>

        {/* Sticky tab bar */}
        <AdminTabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab content with animated transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
          >
            {activeTab === 'analytics' && <AdminAnalytics />}
            {activeTab === 'users' && (
              <UserManagement
                users={users}
                isLoading={usersLoading}
                lastUpdated={usersUpdatedAt}
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ['admin-users'] })}
              />
            )}
            {activeTab === 'matches' && (
              <MatchManagement
                matches={matches}
                venues={venues}
                isLoading={matchesLoading}
                lastUpdated={matchesUpdatedAt}
                onDelete={handleDeleteMatch}
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ['admin-matches'] })}
              />
            )}
            {activeTab === 'teams' && (
              <TeamManagement
                teams={teams}
                isLoading={teamsLoading}
                lastUpdated={teamsUpdatedAt}
                onDelete={handleDeleteTeam}
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ['admin-teams'] })}
              />
            )}
            {activeTab === 'venues' && (
              <VenueManagement
                venues={venues}
                isLoading={venuesLoading}
                lastUpdated={venuesUpdatedAt}
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ['admin-venues'] })}
                onDeleteDuplicates={handleDeleteDuplicateVenues}
              />
            )}
            {activeTab === 'reports' && (
              <ModerationQueue
                reports={reports}
                isLoading={reportsLoading}
                lastUpdated={reportsUpdatedAt}
                onAction={handleReportAction}
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ['admin-reports'] })}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}