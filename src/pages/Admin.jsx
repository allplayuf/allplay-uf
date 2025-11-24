import React, { useState, useEffect } from "react";
import { User, Report, Venue, Match, Team } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Flag, MapPin, BarChart, AlertTriangle, RefreshCw, Trophy, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/components/utils/helpers";
import { useCustomDialog } from "../components/ui/custom-dialog";

import ModerationQueue from "../components/admin/ModerationQueue";
import UserManagement from "../components/admin/UserManagement";
import VenueManagement from "../components/admin/VenueManagement";
import Analytics from "../components/admin/Analytics";
import MatchManagement from "../components/admin/MatchManagement";
import TeamManagement from "../components/admin/TeamManagement";

export default function AdminPage() {
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [venues, setVenues] = useState([]);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isRemovingDuplicates, setIsRemovingDuplicates] = useState(false);

  const { confirm, alert, DialogContainer } = useCustomDialog();

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const user = await User.me();
      
      if (user.role !== 'admin') {
        await alert('Behörighet saknas', 'Du har inte behörighet att se denna sida.', { type: 'alert' });
        window.location.href = createPageUrl('Dashboard');
        return;
      }

      const [reportsData, usersData, venuesData, matchesData, teamsData] = await Promise.all([
        Report.list('-created_date'),
        User.list('-created_date'),
        Venue.list(),
        Match.list('-created_date'),
        Team.list('-created_date')
      ]);

      setReports(reportsData);
      setUsers(usersData);
      setVenues(venuesData);
      setMatches(matchesData);
      setTeams(teamsData);
      setCurrentUser(user);

    } catch (error) {
      console.error("Error loading admin data:", error);
      await alert('Fel vid laddning', 'Kunde inte ladda admin-data. Kontrollera dina behörigheter.', { type: 'alert' });
      window.location.href = createPageUrl('Dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportAction = async (reportId, action, notes) => {
    try {
      await Report.update(reportId, {
        status: action === 'resolve' ? 'resolved' : 'dismissed',
        moderator_notes: notes,
        resolved_date: new Date().toISOString(),
        action_taken: action
      });
      
      loadAdminData();
    } catch (error) {
      console.error("Error updating report:", error);
      await alert('Ett fel uppstod', 'Kunde inte uppdatera rapport. Försök igen.', { type: 'alert' });
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      let status = 'active';
      let blocked = false;
      
      if (action === 'suspend') {
        status = 'suspended';
        blocked = false;
      }
      if (action === 'ban') {
        status = 'banned';
        blocked = true;
      }
      if (action === 'activate') {
        status = 'active';
        blocked = false;
      }

      await User.update(userId, { status, blocked });
      loadAdminData();
      await alert('Uppdaterat!', 'Användarstatus uppdaterad!', { type: 'success' });
    } catch (error) {
      console.error("Error updating user:", error);
      await alert('Ett fel uppstod', 'Kunde inte uppdatera användare. Försök igen.', { type: 'alert' });
    }
  };

  const handleDeleteMatch = async (matchId, matchTitle) => {
    const shouldDelete = await confirm(
      'Radera match',
      `Är du säker på att du vill radera matchen "${matchTitle}"? Detta går inte att ångra.`,
      {
        type: 'warning',
        confirmText: 'Ja, radera',
        cancelText: 'Avbryt'
      }
    );

    if (!shouldDelete) return;

    try {
      await Match.update(matchId, {
        status: 'cancelled',
        deleted_at: new Date().toISOString(),
        deleted_by: currentUser.id
      });

      console.log('AUDIT LOG:', {
        action: 'DELETE_MATCH',
        admin_id: currentUser.id,
        admin_email: currentUser.email,
        match_id: matchId,
        match_title: matchTitle,
        timestamp: new Date().toISOString(),
        previous_state: { status: 'active' },
        new_state: { status: 'deleted' }
      });

      await alert('Match raderad!', 'Matchen har tagits bort från systemet.', { type: 'success' });
      loadAdminData();
    } catch (error) {
      console.error("Error deleting match:", error);
      await alert('Ett fel uppstod', 'Kunde inte radera match. Försök igen.', { type: 'alert' });
    }
  };

  const handleDeleteTeam = async (teamId, teamName) => {
    const shouldDelete = await confirm(
      'Radera lag',
      `Är du säker på att du vill radera laget "${teamName}"? Detta går inte att ångra.`,
      {
        type: 'warning',
        confirmText: 'Ja, radera',
        cancelText: 'Avbryt'
      }
    );

    if (!shouldDelete) return;

    try {
      await Team.update(teamId, {
        is_active: false,
        deleted_at: new Date().toISOString(),
        deleted_by: currentUser.id
      });

      console.log('AUDIT LOG:', {
        action: 'DELETE_TEAM',
        admin_id: currentUser.id,
        admin_email: currentUser.email,
        team_id: teamId,
        team_name: teamName,
        timestamp: new Date().toISOString(),
        previous_state: { is_active: true },
        new_state: { is_active: false }
      });

      await alert('Lag raderat!', 'Laget har tagits bort från systemet.', { type: 'success' });
      loadAdminData();
    } catch (error) {
      console.error("Error deleting team:", error);
      await alert('Ett fel uppstod', 'Kunde inte radera lag. Försök igen.', { type: 'alert' });
    }
  };

  const handleCleanupPendingRequests = async () => {
    const shouldCleanup = await confirm(
      'Rensa väntande förfrågningar',
      'Detta kommer att ta bort alla väntande vänförfrågningar och lag-ansökningar. Fortsätt?',
      {
        type: 'warning',
        confirmText: 'Ja, rensa',
        cancelText: 'Avbryt'
      }
    );

    if (!shouldCleanup) return;

    setIsCleaningUp(true);
    try {
      const { base44 } = await import("@/api/base44Client");
      const response = await base44.functions.invoke('cleanupPendingRequests', {});
      
      await alert(
        'Cleanup klart!',
        `Raderade vänförfrågningar: ${response.data.stats.deletedFriendships}\nRaderade lag-ansökningar: ${response.data.stats.deletedTeamMembers}\n\nBehöll accepterade vänskap och aktiva medlemmar.`,
        { type: 'success' }
      );
      
    } catch (error) {
      console.error("Error cleaning up:", error);
      await alert('Ett fel uppstod', 'Kunde inte köra cleanup. Försök igen.', { type: 'alert' });
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleRemoveDuplicateVenues = async () => {
    const shouldRemove = await confirm(
      'Ta bort dubblett-planer',
      'Detta kommer att ta bort alla dubblett-planer (planer med samma namn och stad). Fortsätt?',
      {
        type: 'warning',
        confirmText: 'Ja, ta bort',
        cancelText: 'Avbryt'
      }
    );

    if (!shouldRemove) return;

    setIsRemovingDuplicates(true);
    try {
      const { base44 } = await import("@/api/base44Client");
      const response = await base44.functions.invoke('removeDuplicateVenues', {});
      
      await alert(
        'Cleanup klart!',
        `${response.data.message}\n\nTotalt: ${response.data.stats.totalVenues}\nDubbletter borttagna: ${response.data.stats.duplicatesRemoved}\nKvar: ${response.data.stats.remainingVenues}`,
        { type: 'success' }
      );
      
      loadAdminData();
      
    } catch (error) {
      console.error("Error removing duplicates:", error);
      await alert('Ett fel uppstod', 'Kunde inte ta bort dubbletter. Försök igen.', { type: 'alert' });
    } finally {
      setIsRemovingDuplicates(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F1513] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#2BA84A] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[#FFFFFF]">Laddar admin-panel...</p>
        </div>
      </div>
    );
  }

  const pendingReports = reports.filter(r => r.status === 'pending').length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  // const suspendedUsers = users.filter(u => u.status === 'suspended').length; // This variable was declared but not used.

  return (
    <div className="min-h-screen bg-[#0F1513] p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
      <DialogContainer />
      
      {/* Header */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-[#2BA84A]" />
            <h1 className="text-3xl lg:text-4xl font-bold text-[#FFFFFF]">Admin Panel</h1>
          </div>
          <p className="text-[#FFFFFF]/70 text-lg">Hantera användare, rapporter och systemöversikt</p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px]">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-[#F4743B]">{pendingReports}</div>
                <div className="text-sm text-[#FFFFFF]/70">Väntande rapporter</div>
              </CardContent>
            </Card>
            <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px]">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-[#2BA84A]">{activeUsers}</div>
                <div className="text-sm text-[#FFFFFF]/70">Aktiva användare</div>
              </CardContent>
            </Card>
            <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px]">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-[#F4743B]">{matches.length}</div>
                <div className="text-sm text-[#FFFFFF]/70">Totalt matcher</div>
              </CardContent>
            </Card>
            <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px]">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-[#9B59B6]">{teams.length}</div>
                <div className="text-sm text-[#FFFFFF]/70">Totalt lag</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Alert for pending reports */}
        {pendingReports > 0 && (
          <div className="mb-6 p-4 bg-[#F4743B]/20 border border-[#F4743B] rounded-[16px] flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#F4743B]" />
            <div>
              <h4 className="font-semibold text-[#FFFFFF]">Åtgärd krävs</h4>
              <p className="text-[#FFFFFF]/80">Du har {pendingReports} väntande rapporter som behöver granskas.</p>
            </div>
          </div>
        )}

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-[#121715] border border-[#223029] hover:border-[#F4743B] transition-all shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#F4743B]/20 rounded-xl flex items-center justify-center ring-1 ring-[#F4743B]/30">
                  <RefreshCw className="w-6 h-6 text-[#F4743B]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#F4F7F5]">Rensa väntande</h3>
                  <p className="text-xs text-[#B6C2BC]">Ta bort alla pending-inbjudningar</p>
                </div>
              </div>
              <Button
                onClick={handleCleanupPendingRequests}
                disabled={isCleaningUp}
                className="w-full bg-[#F4743B] hover:bg-[#E5683A] text-white rounded-xl h-11"
              >
                {isCleaningUp ? 'Rensar...' : 'Kör cleanup'}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#121715] border border-[#223029] hover:border-[#9370DB] transition-all shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#9370DB]/20 rounded-xl flex items-center justify-center ring-1 ring-[#9370DB]/30">
                  <MapPin className="w-6 h-6 text-[#9370DB]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#F4F7F5]">Ta bort dubbletter</h3>
                  <p className="text-xs text-[#B6C2BC]">Rensa dubblett-planer</p>
                </div>
              </div>
              <Button
                onClick={handleRemoveDuplicateVenues}
                disabled={isRemovingDuplicates}
                className="w-full bg-[#9370DB] hover:bg-[#8B008B] text-white rounded-xl h-11"
              >
                {isRemovingDuplicates ? 'Rensar...' : 'Kör cleanup'}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#121715] border border-[#223029] hover:border-[#F59E0B] transition-all shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#F59E0B]/20 rounded-xl flex items-center justify-center ring-1 ring-[#F59E0B]/30">
                  <Trophy className="w-6 h-6 text-[#F59E0B]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#F4F7F5]">Rensa cuper</h3>
                  <p className="text-xs text-[#B6C2BC]">Hantera och rensa cuper</p>
                </div>
              </div>
              <Link to={createPageUrl("AdminCleanup")}>
                <Button className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-xl h-11 gap-2">
                  <Sparkles className="w-4 h-4" />
                  Öppna cleanup
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="bg-[#121715] shadow-[0_6px_18px_rgba(0,0,0,0.22)] p-1 border border-[#223029] rounded-[16px] flex-wrap h-auto">
            <TabsTrigger value="reports" className="flex items-center gap-2 data-[state=active]:bg-[#2BA84A] data-[state=active]:text-[#FFFFFF] text-[#FFFFFF]/70">
              <Flag className="w-4 h-4" />
              Rapporter ({pendingReports})
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-[#2BA84A] data-[state=active]:text-[#FFFFFF] text-[#FFFFFF]/70">
              <Users className="w-4 h-4" />
              Användare
            </TabsTrigger>
            <TabsTrigger value="matches" className="flex items-center gap-2 data-[state=active]:bg-[#2BA84A] data-[state=active]:text-[#FFFFFF] text-[#FFFFFF]/70">
              <Trophy className="w-4 h-4" />
              Matcher
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-2 data-[state=active]:bg-[#2BA84A] data-[state=active]:text-[#FFFFFF] text-[#FFFFFF]/70">
              <Shield className="w-4 h-4" />
              Lag
            </TabsTrigger>
            <TabsTrigger value="venues" className="flex items-center gap-2 data-[state=active]:bg-[#2BA84A] data-[state=active]:text-[#FFFFFF] text-[#FFFFFF]/70">
              <MapPin className="w-4 h-4" />
              Planer
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-[#2BA84A] data-[state=active]:text-[#FFFFFF] text-[#FFFFFF]/70">
              <BarChart className="w-4 h-4" />
              Statistik
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            <ModerationQueue 
              reports={reports}
              onAction={handleReportAction}
            />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement 
              users={users}
              onAction={handleUserAction}
            />
          </TabsContent>

          <TabsContent value="matches">
            <MatchManagement 
              matches={matches}
              venues={venues}
              onDelete={handleDeleteMatch}
              onRefresh={loadAdminData}
            />
          </TabsContent>

          <TabsContent value="teams">
            <TeamManagement 
              teams={teams}
              onDelete={handleDeleteTeam}
              onRefresh={loadAdminData}
            />
          </TabsContent>

          <TabsContent value="venues">
            <VenueManagement 
              venues={venues}
              onRefresh={loadAdminData}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <Analytics 
              users={users}
              matches={matches}
              venues={venues}
              reports={reports}
              onDeleteMatch={handleDeleteMatch}
              onDeleteTeam={handleDeleteTeam}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}