import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Database, AlertCircle, CheckCircle, RefreshCw, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function SystemHealth() {
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const { data: healthData } = await base44.functions.invoke('health');
      setHealth(healthData);
    } catch (error) {
      console.error("Error checking health:", error);
      setHealth({ status: 'error', error: 'Failed to check health' });
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStats = async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('admin/systemStats');
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const runOrphanedRecordsCleanup = async (dryRun = true) => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('cleanup/orphanedRecords', { dryRun });
      
      const message = dryRun 
        ? `Hittade: ${data.results.matchParticipants.orphaned} deltagare, ${data.results.teamMembers.orphaned} lagmedlemmar, ${data.results.cupParticipants.orphaned} cup-deltagare`
        : `Raderade: ${data.results.matchParticipants.deleted} deltagare, ${data.results.teamMembers.deleted} lagmedlemmar`;
        
      alert(dryRun ? 'Dry run klar' : 'Cleanup klar', message);
      
      if (!dryRun) {
        fetchSystemStats();
      }
    } catch (error) {
      console.error("Error running cleanup:", error);
      alert('Ett fel uppstod vid cleanup');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    checkHealth();
    fetchSystemStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Health Status Card */}
      <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
        <CardHeader>
          <CardTitle className="text-[#F4F7F5] flex items-center gap-2">
            <Activity className="w-6 h-6 text-[#2BA84A]" />
            Systemhälsa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {health && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-[#18221E] rounded-xl">
                <div className="flex items-center gap-3">
                  {health.status === 'healthy' ? (
                    <CheckCircle className="w-6 h-6 text-[#2BA84A]" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-[#DC2626]" />
                  )}
                  <div>
                    <p className="font-semibold text-[#F4F7F5]">Status</p>
                    <p className="text-sm text-[#B6C2BC]">{health.status}</p>
                  </div>
                </div>
                <Badge className={health.status === 'healthy' ? 'bg-[#2BA84A]/20 text-[#CFE8D6]' : 'bg-[#DC2626]/20 text-[#FCA5A5]'}>
                  {health.status === 'healthy' ? 'Online' : 'Offline'}
                </Badge>
              </div>

              {health.checks?.database && (
                <div className="flex items-center justify-between p-4 bg-[#18221E] rounded-xl">
                  <div className="flex items-center gap-3">
                    <Database className="w-6 h-6 text-[#4169E1]" />
                    <div>
                      <p className="font-semibold text-[#F4F7F5]">Databas</p>
                      <p className="text-sm text-[#B6C2BC]">{health.checks.database.latencyMs}ms latens</p>
                    </div>
                  </div>
                  <Badge className={health.checks.database.status === 'up' ? 'bg-[#2BA84A]/20 text-[#CFE8D6]' : 'bg-[#DC2626]/20 text-[#FCA5A5]'}>
                    {health.checks.database.status}
                  </Badge>
                </div>
              )}

              {health.uptime && (
                <div className="p-4 bg-[#18221E] rounded-xl">
                  <p className="text-sm text-[#B6C2BC] mb-1">Uptime</p>
                  <p className="font-mono font-semibold text-[#F4F7F5]">{health.uptime.formatted}</p>
                </div>
              )}

              {health.metrics && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-[#18221E] rounded-xl text-center">
                    <p className="text-xs text-[#B6C2BC] mb-1">Requests</p>
                    <p className="font-mono font-bold text-[#F4F7F5]">{health.metrics.requestCount}</p>
                  </div>
                  <div className="p-3 bg-[#18221E] rounded-xl text-center">
                    <p className="text-xs text-[#B6C2BC] mb-1">Errors</p>
                    <p className="font-mono font-bold text-[#DC2626]">{health.metrics.errorCount}</p>
                  </div>
                  <div className="p-3 bg-[#18221E] rounded-xl text-center">
                    <p className="text-xs text-[#B6C2BC] mb-1">Error Rate</p>
                    <p className="font-mono font-bold text-[#F4F7F5]">{health.metrics.errorRate}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={checkHealth}
            disabled={loading}
            className="w-full h-11 rounded-xl bg-[#2BA84A] hover:bg-[#248232] text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Kontrollera hälsa
          </Button>
        </CardContent>
      </Card>

      {/* System Stats */}
      {stats && (
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardHeader>
            <CardTitle className="text-[#F4F7F5] flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-[#F4743B]" />
              Systemstatistik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-[#18221E] rounded-xl">
                <p className="text-sm text-[#B6C2BC] mb-2">Användare</p>
                <p className="text-2xl font-bold text-[#F4F7F5]">{stats.users.total}</p>
                <p className="text-xs text-[#2BA84A] mt-1">{stats.users.active} aktiva</p>
              </div>
              
              <div className="p-4 bg-[#18221E] rounded-xl">
                <p className="text-sm text-[#B6C2BC] mb-2">Matcher</p>
                <p className="text-2xl font-bold text-[#F4F7F5]">{stats.matches.total}</p>
                <p className="text-xs text-[#2BA84A] mt-1">{stats.matches.upcoming} kommande</p>
              </div>
              
              <div className="p-4 bg-[#18221E] rounded-xl">
                <p className="text-sm text-[#B6C2BC] mb-2">Lag</p>
                <p className="text-2xl font-bold text-[#F4F7F5]">{stats.teams.total}</p>
                <p className="text-xs text-[#2BA84A] mt-1">Ø {stats.teams.averageMembers} medlemmar</p>
              </div>
              
              <div className="p-4 bg-[#18221E] rounded-xl">
                <p className="text-sm text-[#B6C2BC] mb-2">Planer</p>
                <p className="text-2xl font-bold text-[#F4F7F5]">{stats.venues.total}</p>
                <p className="text-xs text-[#2BA84A] mt-1">{stats.venues.verified} verifierade</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cleanup Tools */}
      <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
        <CardHeader>
          <CardTitle className="text-[#F4F7F5] flex items-center gap-2">
            <Database className="w-6 h-6 text-[#F59E0B]" />
            Databasunderhåll
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-[#B6C2BC]">
            Hitta och radera föråldrade poster som refererar till raderade objekt.
          </p>
          
          <div className="flex gap-3">
            <Button
              onClick={() => runOrphanedRecordsCleanup(true)}
              disabled={loading}
              variant="outline"
              className="flex-1 h-11 rounded-xl border-[#223029] hover:bg-[#18221E] text-[#F4F7F5]"
            >
              Dry Run (visa bara)
            </Button>
            <Button
              onClick={() => runOrphanedRecordsCleanup(false)}
              disabled={loading}
              className="flex-1 h-11 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white"
            >
              Radera föråldrade poster
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}