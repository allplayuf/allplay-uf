import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Users, Calendar, MapPin, TrendingUp, Activity, Trophy, Target, Zap, Trash2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge"; 
import { Button } from "@/components/ui/button"; 
import { base44 } from "@/api/base44Client";


export default function Analytics({ users, matches, venues, reports, onDeleteMatch, onDeleteTeam }) {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const allTeams = await base44.entities.Team.list();
      setTeams(allTeams);
    } catch (error) {
      console.error("Error loading teams:", error);
    }
  };

  const activeUsers = users.filter(u => u.status === 'active').length;
  const totalMatches = matches.length;
  const completedMatches = matches.filter(m => m.status === 'completed').length;
  const pendingReports = reports.filter(r => r.status === 'pending').length;

  const getGrowthData = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = users.filter(u => 
      new Date(u.created_date) > thirtyDaysAgo
    ).length;
    
    const recentMatches = matches.filter(m => 
      new Date(m.created_date) > thirtyDaysAgo
    ).length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const weeklyUsers = users.filter(u => 
      new Date(u.created_date) > sevenDaysAgo
    ).length;

    return { recentUsers, recentMatches, weeklyUsers };
  };

  const { recentUsers, recentMatches, weeklyUsers } = getGrowthData();

  const getEngagementMetrics = () => {
    const usersWithMatches = users.filter(u => (u.matches_played || 0) > 0).length;
    const engagementRate = users.length > 0 ? ((usersWithMatches / users.length) * 100).toFixed(1) : 0;
    
    const completionRate = totalMatches > 0 ? ((completedMatches / totalMatches) * 100).toFixed(1) : 0;
    
    const avgMatchesPerUser = users.length > 0 
      ? (users.reduce((sum, u) => sum + (u.matches_played || 0), 0) / users.length).toFixed(1) 
      : 0;

    return { engagementRate, completionRate, avgMatchesPerUser };
  };

  const { engagementRate, completionRate, avgMatchesPerUser } = getEngagementMetrics();

  const getCityStats = () => {
    const cityStats = {};
    users.forEach(user => {
      if (user.city) {
        cityStats[user.city] = (cityStats[user.city] || 0) + 1;
      }
    });
    return Object.entries(cityStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  const topCities = getCityStats();

  const getSkillDistribution = () => {
    return {
      'Nybörjare': users.filter(u => u.skill_level === 'beginner').length,
      'Medel': users.filter(u => u.skill_level === 'intermediate').length,
      'Avancerad': users.filter(u => u.skill_level === 'advanced').length,
      'Elite': users.filter(u => u.skill_level === 'elite').length,
    };
  };

  const skillDistribution = getSkillDistribution();

  const getMatchFormatStats = () => {
    return {
      '5v5': matches.filter(m => m.format === '5v5').length,
      '7v7': matches.filter(m => m.format === '7v7').length,
      '11v11': matches.filter(m => m.format === '11v11').length,
    };
  };

  const formatStats = getMatchFormatStats();

  return (
    <div className="space-y-6">
      {/* Key Metrics - Redesigned */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#2BA84A]/20 rounded-xl flex items-center justify-center ring-1 ring-[#2BA84A]/30">
                <Users className="w-6 h-6 text-[#2BA84A]" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#F4F7F5]">{activeUsers}</div>
                <div className="text-sm text-[#B6C2BC] font-medium">Aktiva användare</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-[#2BA84A]" />
              <span className="text-[#2BA84A] font-semibold">+{recentUsers}</span>
              <span className="text-[#B6C2BC]">senaste 30d</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#F4743B]/20 rounded-xl flex items-center justify-center ring-1 ring-[#F4743B]/30">
                <Calendar className="w-6 h-6 text-[#F4743B]" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#F4F7F5]">{totalMatches}</div>
                <div className="text-sm text-[#B6C2BC] font-medium">Totala matcher</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-[#F4743B]" />
              <span className="text-[#F4743B] font-semibold">+{recentMatches}</span>
              <span className="text-[#B6C2BC]">senaste 30d</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#9370DB]/20 rounded-xl flex items-center justify-center ring-1 ring-[#9370DB]/30">
                <MapPin className="w-6 h-6 text-[#9370DB]" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#F4F7F5]">{venues.length}</div>
                <div className="text-sm text-[#B6C2BC] font-medium">Fotbollsplaner</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-[#9370DB]" />
              <span className="text-[#B6C2BC]">Över hela Sverige</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#10B981]/20 rounded-xl flex items-center justify-center ring-1 ring-[#10B981]/30">
                <Zap className="w-6 h-6 text-[#10B981]" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#F4F7F5]">{engagementRate}%</div>
                <div className="text-sm text-[#B6C2BC] font-medium">Engagement</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="w-4 h-4 text-[#10B981]" />
              <span className="text-[#B6C2BC]">{avgMatchesPerUser} matcher/user</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NEW: Match Management */}
      <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
        <CardHeader>
          <CardTitle className="text-[#F4F7F5] flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#2BA84A]" />
            Matchhantering
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {matches.slice(0, 20).map((match) => (
              <div key={match.id} className="flex items-center justify-between p-3 bg-[#18221E] rounded-xl border border-[#223029]">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-[#F4F7F5] text-sm truncate">{match.title}</h4>
                  <p className="text-xs text-[#B6C2BC]">{match.date} • {match.format}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge className={`text-xs ${
                      match.status === 'upcoming' ? 'bg-[#2BA84A]/20 text-[#2BA84A]' :
                      match.status === 'completed' ? 'bg-[#6B7280]/20 text-[#9CA3AF]' :
                      'bg-[#F4743B]/20 text-[#F4743B]'
                    }`}>
                      {match.status}
                    </Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDeleteMatch(match.id, match.title)}
                  className="ml-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* NEW: Team Management */}
      <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
        <CardHeader>
          <CardTitle className="text-[#F4F7F5] flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#9B59B6]" />
            Laghantering
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {teams.slice(0, 20).map((team) => (
              <div key={team.id} className="flex items-center justify-between p-3 bg-[#18221E] rounded-xl border border-[#223029]">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {team.logo_url ? (
                    <img src={team.logo_url} alt={team.name} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-[#9B59B6]/20 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-[#9B59B6]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-[#F4F7F5] text-sm truncate">{team.name}</h4>
                    <p className="text-xs text-[#B6C2BC]">{team.city} • {team.current_members} medlemmar</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDeleteTeam(team.id, team.name)}
                  className="ml-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Match Completion Rate */}
        <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-2xl">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-lg text-[#F4F7F5] flex items-center gap-2">
              <Target className="w-5 h-5 text-[#2BA84A]" />
              Match Completion
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <div className="text-5xl font-bold text-[#2BA84A] mb-2">{completionRate}%</div>
              <p className="text-sm text-[#B6C2BC]">{completedMatches} av {totalMatches} matcher genomförda</p>
            </div>
            <div className="h-2 bg-[#18221E] rounded-full overflow-hidden border border-[#223029]">
              <div className="h-full bg-[#2BA84A] rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }}></div>
            </div>
          </CardContent>
        </Card>

        {/* Top Cities */}
        <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-2xl">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-lg text-[#F4F7F5] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#2BA84A]" />
              Top 5 Städer
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {topCities.map(([city, count], index) => (
                <div key={city} className="flex items-center justify-between p-3 bg-[#0F1513] rounded-xl border border-[#223029]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#2BA84A]/20 rounded-lg flex items-center justify-center text-sm font-bold text-[#2BA84A]">
                      {index + 1}
                    </div>
                    <span className="font-medium text-[#F4F7F5]">{city}</span>
                  </div>
                  <span className="text-[#B6C2BC] font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Skill Distribution */}
        <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-2xl">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-lg text-[#F4F7F5] flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#2BA84A]" />
              Färdighetsnivåer
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Object.entries(skillDistribution).map(([skill, count]) => {
                const total = Object.values(skillDistribution).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? (count / total * 100).toFixed(0) : 0;
                return (
                  <div key={skill}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-[#F4F7F5]">{skill}</span>
                      <span className="text-[#B6C2BC]">{count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-[#18221E] rounded-full overflow-hidden border border-[#223029]">
                      <div className="h-full bg-[#2BA84A] rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Match Formats */}
        <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-2xl">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-lg text-[#F4F7F5] flex items-center gap-2">
              <BarChart className="w-5 h-5 text-[#2BA84A]" />
              Match Format
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Object.entries(formatStats).map(([format, count]) => {
                const percentage = totalMatches > 0 ? (count / totalMatches * 100).toFixed(0) : 0;
                return (
                  <div key={format}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-[#F4F7F5]">{format}</span>
                      <span className="text-[#B6C2BC]">{count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-[#18221E] rounded-full overflow-hidden border border-[#223029]">
                      <div className="h-full bg-[#F4743B] rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Growth Trend */}
        <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-2xl">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-lg text-[#F4F7F5] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#2BA84A]" />
              Tillväxt
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center p-3 bg-[#0F1513] rounded-xl">
              <span className="text-sm text-[#B6C2BC]">Nya användare (7d)</span>
              <span className="text-2xl font-bold text-[#2BA84A]">+{weeklyUsers}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#0F1513] rounded-xl">
              <span className="text-sm text-[#B6C2BC]">Nya användare (30d)</span>
              <span className="text-2xl font-bold text-[#2BA84A]">+{recentUsers}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#0F1513] rounded-xl">
              <span className="text-sm text-[#B6C2BC]">Nya matcher (30d)</span>
              <span className="text-2xl font-bold text-[#F4743B]">+{recentMatches}</span>
            </div>
          </CardContent>
        </Card>

        {/* Reports Status */}
        <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-2xl">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-lg text-[#F4F7F5] flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#2BA84A]" />
              Rapporter
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center p-3 bg-[#0F1513] rounded-xl">
              <span className="text-sm text-[#B6C2BC]">Väntande</span>
              <span className="text-2xl font-bold text-[#F4743B]">{pendingReports}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#0F1513] rounded-xl">
              <span className="text-sm text-[#B6C2BC]">Lösta</span>
              <span className="text-2xl font-bold text-[#2BA84A]">{reports.filter(r => r.status === 'resolved').length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#0F1513] rounded-xl">
              <span className="text-sm text-[#B6C2BC]">Totalt</span>
              <span className="text-2xl font-bold text-[#F4F7F5]">{reports.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}