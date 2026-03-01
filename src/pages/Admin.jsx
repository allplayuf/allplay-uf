import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Flag, MapPin, Trophy, AlertTriangle, RefreshCw, Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCustomDialog } from "../components/ui/custom-dialog";
import { checkIsAdmin } from "../components/supabase/services/adminService";
import { useSupabaseAuth } from "../components/supabase/AuthProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CACHE_STRATEGIES } from "../components/providers/QueryProvider";
import { getVenues, deleteVenues } from "../components/supabase/services/venuesService";
import { getPublicMatches, deleteMatchRest } from "../components/supabase/services/matchesService";
import { getTeams, deleteTeamRest } from "../components/supabase/services/teamsService";
import { searchPlayers } from "../components/supabase/services/playersService";
import { PageLoadingSkeleton } from "../components/ui/loading-skeleton";
import { getReports, handleReport } from "../components/supabase/services/reportsService";

import ModerationQueue from "../components/admin/ModerationQueue";
import UserManagement from "../components/admin/UserManagement";
import VenueManagement from "../components/admin/VenueManagement";
import MatchManagement from "../components/admin/MatchManagement";
import TeamManagement from "../components/admin/TeamManagement";
import NotificationManagement from "../components/admin/NotificationManagement";

export default function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirm, alert, DialogContainer } = useCustomDialog();
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useSupabaseAuth();

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
        console.warn('[Admin] getReports failed, edge function may not exist:', e.message);
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
        await alert('Delvis klart', `${deletedCount} raderade, ${errorCount} misslyckades (kolla RLS-behörighet).`, { type: 'warning' });
      } else if (errorCount > 0) {
        await alert('Fel', `Ingen plan raderades. RLS kanske blockerar DELETE för din användare. Kolla Supabase-policys.`, { type: 'alert' });
      } else {
        await alert('Klart', `${deletedCount} dubbletter raderade.`, { type: 'success' });
      }
      // Force refetch venues
      await queryClient.refetchQueries({ queryKey: ['admin-venues'] });
    } catch (error) {
      await alert('Fel', error.message || 'Kunde inte radera dubbletter.', { type: 'alert' });
      // Still refetch to show current state
      await queryClient.refetchQueries({ queryKey: ['admin-venues'] });
    }
  };

  // Loading states
  if (authLoading || adminLoading) return <PageLoadingSkeleton />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0F1513] flex items-center justify-center p-4">
        <DialogContainer />
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px] max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-[#DC2626] mx-auto mb-4" />
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

  const pendingReports = reports.filter(r => r.status === 'pending').length;
  const dataLoading = usersLoading || venuesLoading || matchesLoading || teamsLoading || reportsLoading;

  return (
    <div className="min-h-screen bg-[#0F1513] p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
      <DialogContainer />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-[#2BA84A]" />
              <h1 className="text-3xl font-bold text-[#F4F7F5]">Admin Panel</h1>
            </div>
            <p className="text-[#B6C2BC]">Alla data kommer direkt från Supabase</p>
          </div>
          <Button onClick={refreshAll} variant="outline" className="border-[#223029] text-[#F4F7F5] hover:bg-[#18221E] gap-2">
            <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
            Uppdatera allt
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Användare', count: users.length, color: '#2BA84A', loading: usersLoading },
            { label: 'Planer', count: venues.length, color: '#9370DB', loading: venuesLoading },
            { label: 'Matcher', count: matches.length, color: '#F4743B', loading: matchesLoading },
            { label: 'Lag', count: teams.length, color: '#4169E1', loading: teamsLoading },
            { label: 'Rapporter', count: pendingReports, color: '#DC2626', loading: reportsLoading },
          ].map(s => (
            <Card key={s.label} className="bg-[#121715] border border-[#223029] rounded-[16px]">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold mb-1" style={{ color: s.color }}>
                  {s.loading ? '…' : s.count}
                </div>
                <div className="text-xs text-[#B6C2BC]">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Alert */}
        {pendingReports > 0 && (
          <div className="p-4 bg-[#F4743B]/15 border border-[#F4743B]/40 rounded-[16px] flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#F4743B] flex-shrink-0" />
            <p className="text-sm text-[#F4F7F5]">{pendingReports} väntande rapporter kräver åtgärd.</p>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-[#121715] p-1 border border-[#223029] rounded-[16px] flex-wrap h-auto gap-1">
            {[
              { value: 'users', icon: Users, label: 'Användare' },
              { value: 'matches', icon: Trophy, label: 'Matcher' },
              { value: 'teams', icon: Shield, label: 'Lag' },
              { value: 'venues', icon: MapPin, label: 'Planer' },
              { value: 'reports', icon: Flag, label: `Rapporter (${pendingReports})` },
              { value: 'notifications', icon: Bell, label: 'Notiser' },
            ].map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2 data-[state=active]:bg-[#2BA84A] data-[state=active]:text-white text-[#B6C2BC]">
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="users">
            <UserManagement
              users={users}
              isLoading={usersLoading}
              lastUpdated={usersUpdatedAt}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['admin-users'] })}
            />
          </TabsContent>
          <TabsContent value="matches">
            <MatchManagement
              matches={matches}
              venues={venues}
              isLoading={matchesLoading}
              lastUpdated={matchesUpdatedAt}
              onDelete={handleDeleteMatch}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['admin-matches'] })}
            />
          </TabsContent>
          <TabsContent value="teams">
            <TeamManagement
              teams={teams}
              isLoading={teamsLoading}
              lastUpdated={teamsUpdatedAt}
              onDelete={handleDeleteTeam}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['admin-teams'] })}
            />
          </TabsContent>
          <TabsContent value="venues">
            <VenueManagement
              venues={venues}
              isLoading={venuesLoading}
              lastUpdated={venuesUpdatedAt}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['admin-venues'] })}
              onDeleteDuplicates={handleDeleteDuplicateVenues}
            />
          </TabsContent>
          <TabsContent value="reports">
            <ModerationQueue
              reports={reports}
              isLoading={reportsLoading}
              lastUpdated={reportsUpdatedAt}
              onAction={handleReportAction}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['admin-reports'] })}
            />
          </TabsContent>
          <TabsContent value="notifications">
            <NotificationManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}