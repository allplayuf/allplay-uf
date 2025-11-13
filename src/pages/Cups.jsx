import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Trophy, 
  Plus, 
  Calendar, 
  MapPin, 
  Users, 
  Target,
  Filter,
  TrendingUp,
  CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { PageLoadingSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";

const STATUS_CONFIG = {
  upcoming: { label: 'Kommande', color: 'bg-blue-500/20 text-blue-300', icon: Calendar },
  registration_open: { label: 'Anmälan öppen', color: 'bg-green-500/20 text-green-300', icon: CheckCircle },
  ongoing: { label: 'Pågående', color: 'bg-orange-500/20 text-orange-300', icon: TrendingUp },
  completed: { label: 'Avslutad', color: 'bg-gray-500/20 text-gray-300', icon: Trophy }
};

export default function CupsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');
  const [signupTypeFilter, setSignupTypeFilter] = useState('all');

  // Fetch user
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    staleTime: 10 * 60 * 1000,
  });

  // Fetch cups
  const { data: cupsData, isLoading } = useQuery({
    queryKey: ['cups', statusFilter, formatFilter, signupTypeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (formatFilter !== 'all') params.append('format', formatFilter);
      if (signupTypeFilter !== 'all') params.append('signup_type', signupTypeFilter);
      
      const response = await base44.functions.invoke('cups/getCups', params.toString());
      return response.data;
    },
    staleTime: 60 * 1000,
  });

  const cups = cupsData?.cups || [];

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-[#F4F7F5] flex items-center gap-3">
                <Trophy className="w-8 h-8 text-[#F4743B]" />
                Turneringar
              </h1>
              <p className="text-sm text-[#B6C2BC] mt-1">
                Tävla i organiserade turneringar
              </p>
            </div>
            
            {user?.role === 'admin' && (
              <Link to={createPageUrl("CreateCup")}>
                <Button className="bg-[#F4743B] hover:bg-[#E5683A] text-white gap-2">
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Skapa turnering</span>
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px] p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-[#9FC9AC]" />
              <span className="font-semibold text-[#F4F7F5]">Filtrera</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-[#B6C2BC] mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla</SelectItem>
                    <SelectItem value="upcoming">Kommande</SelectItem>
                    <SelectItem value="live">Pågående</SelectItem>
                    <SelectItem value="finished">Avslutade</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-[#B6C2BC] mb-2 block">Format</label>
                <Select value={formatFilter} onValueChange={setFormatFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla format</SelectItem>
                    <SelectItem value="5v5">5v5</SelectItem>
                    <SelectItem value="7v7">7v7</SelectItem>
                    <SelectItem value="11v11">11v11</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-[#B6C2BC] mb-2 block">Anmälningstyp</label>
                <Select value={signupTypeFilter} onValueChange={setSignupTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla</SelectItem>
                    <SelectItem value="team">Lag</SelectItem>
                    <SelectItem value="solo">Solo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Tournament List */}
        {cups.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="Inga turneringar hittades"
            description="Det finns inga turneringar som matchar dina filter just nu."
            variant="compact"
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {cups.map((cup, index) => {
                const statusConfig = STATUS_CONFIG[cup.status] || STATUS_CONFIG.upcoming;
                const StatusIcon = statusConfig.icon;
                
                return (
                  <motion.div
                    key={cup.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Link to={`${createPageUrl("CupDetail")}?cup_id=${cup.id}`}>
                      <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.28)] hover:border-[#F4743B]/30 transition-all rounded-[20px] overflow-hidden h-full">
                        {/* Logo/Banner */}
                        {cup.logo_url ? (
                          <div className="h-40 bg-gradient-to-br from-[#2BA84A]/20 to-[#0F2917] relative overflow-hidden">
                            <img 
                              src={cup.logo_url} 
                              alt={cup.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-40 bg-gradient-to-br from-[#F4743B]/20 to-[#E5683A]/10 flex items-center justify-center">
                            <Trophy className="w-16 h-16 text-[#F4743B]/40" />
                          </div>
                        )}

                        <CardContent className="p-6">
                          {/* Status Badge */}
                          <div className="flex items-center justify-between mb-3">
                            <Badge className={`${statusConfig.color} px-3 py-1 text-xs font-semibold`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                            <Badge className="bg-[#2BA84A]/20 text-[#9FC9AC] px-3 py-1 text-xs font-semibold">
                              {cup.format}
                            </Badge>
                          </div>

                          {/* Title */}
                          <h3 className="text-xl font-bold text-[#F4F7F5] mb-2 line-clamp-2">
                            {cup.name}
                          </h3>

                          {/* Info */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-[#B6C2BC]">
                              <MapPin className="w-4 h-4 text-[#9FC9AC]" />
                              {cup.location}
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-[#B6C2BC]">
                              <Calendar className="w-4 h-4 text-[#9FC9AC]" />
                              {new Date(cup.start_date).toLocaleDateString('sv-SE', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>

                            <div className="flex items-center gap-2 text-sm text-[#B6C2BC]">
                              <Users className="w-4 h-4 text-[#9FC9AC]" />
                              {cup.current_participants}/{cup.max_participants} {cup.signup_type === 'team' ? 'lag' : 'spelare'}
                            </div>

                            {cup.skill_level && cup.skill_level !== 'mixed' && (
                              <div className="flex items-center gap-2 text-sm text-[#B6C2BC]">
                                <Target className="w-4 h-4 text-[#9FC9AC]" />
                                {cup.skill_level === 'beginner' ? 'Nybörjare' : 
                                 cup.skill_level === 'intermediate' ? 'Medel' : 
                                 cup.skill_level === 'advanced' ? 'Avancerad' : 'Elite'}
                              </div>
                            )}
                          </div>

                          {/* CTA */}
                          <Button 
                            className="w-full bg-gradient-to-r from-[#F4743B] to-[#FF8652] hover:from-[#E5683A] hover:to-[#F4743B] text-white font-semibold"
                          >
                            Visa detaljer
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}