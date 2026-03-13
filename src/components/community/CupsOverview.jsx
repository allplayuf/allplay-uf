import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Trophy, Calendar, MapPin, Users, Search, 
  CheckCircle, Clock, Flame, Award, ArrowRight,
  Target, TrendingUp, Plus, Star, Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CUPS_QUERY_KEY } from "../dashboard/CupsWidget";

// Golden/Yellow accent theme for cups - matching elite level
const STATUS_CONFIG = {
  upcoming: { 
    label: 'Kommande', 
    color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', 
    icon: Calendar,
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]'
  },
  registration_open: { 
    label: 'Anmälan öppen', 
    color: 'bg-[#F59E0B]/20 text-[#FCD34D] border-[#F59E0B]/30', 
    icon: CheckCircle,
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]'
  },
  registration_closed: { 
    label: 'Anmälan stängd', 
    color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', 
    icon: Clock,
    glow: 'shadow-[0_0_20px_rgba(249,115,22,0.15)]'
  },
  ongoing: { 
    label: 'Pågående', 
    color: 'bg-red-500/20 text-red-300 border-red-500/30', 
    icon: Flame,
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]'
  },
  completed: { 
    label: 'Avslutad', 
    color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', 
    icon: Award,
    glow: ''
  }
};

export default function CupsOverview({ user }) {
  // Use separate query key so CupsOverview and CupsWidget don't share cached data
  const { data: allCups = [], isLoading } = useQuery({
    queryKey: ['cups-overview-list'],
    queryFn: async () => {
      const cups = await base44.entities.Cup.list('-created_date');
      return cups.filter(c => c.is_public !== false);
    },
    staleTime: 60 * 1000,
    cacheTime: 5 * 60 * 1000,
  });

  // Strict categorization — completed cups NEVER appear in upcoming/live
  const upcomingCups = allCups.filter(c => 
    c.status === 'upcoming' || c.status === 'registration_open' || c.status === 'registration_closed'
  );
  const liveCups = allCups.filter(c => c.status === 'ongoing');
  const completedCups = allCups.filter(c => c.status === 'completed');

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Hero Section with Stats - Enhanced Golden Theme */}
      <Card className="bg-gradient-to-br from-[#F59E0B]/12 to-[#D97706]/8 border border-[#F59E0B]/40 rounded-[20px] p-6 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#F4F7F5] mb-2 flex items-center gap-2">
              <Trophy className="w-7 h-7 text-[#F59E0B]" />
              Turneringar & Cuper
            </h2>
            <p className="text-sm text-[#B6C2BC]">Tävla och utvecklas i organiserade turneringar</p>
          </div>
          <div className="hidden sm:block">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#F59E0B]/20 to-[#D97706]/10 flex items-center justify-center border border-[#F59E0B]/30">
              <Trophy className="w-10 h-10 text-[#F59E0B]" />
            </div>
          </div>
        </div>

        {/* Stats with improved design */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-4 bg-[#121715]/60 backdrop-blur-sm rounded-xl text-center border border-[#F59E0B]/20 hover:border-[#F59E0B]/40 transition-all"
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Calendar className="w-4 h-4 text-[#F59E0B]" />
              <p className="text-2xl font-bold text-[#F4F7F5]">{upcomingCups.length}</p>
            </div>
            <p className="text-xs text-[#B6C2BC] font-medium">Kommande</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-4 bg-[#121715]/60 backdrop-blur-sm rounded-xl text-center border border-[#FF6B35]/20 hover:border-[#FF6B35]/40 transition-all"
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Flame className="w-4 h-4 text-[#FF6B35]" />
              <p className="text-2xl font-bold text-[#FF6B35]">{liveCups.length}</p>
            </div>
            <p className="text-xs text-[#B6C2BC] font-medium">Live nu</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-4 bg-[#121715]/60 backdrop-blur-sm rounded-xl text-center border border-[#F59E0B]/20 hover:border-[#F59E0B]/40 transition-all"
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Award className="w-4 h-4 text-[#F59E0B]" />
              <p className="text-2xl font-bold text-[#F4F7F5]">{completedCups.length}</p>
            </div>
            <p className="text-xs text-[#B6C2BC] font-medium">Avslutade</p>
          </motion.div>
        </div>

        {isAdmin && (
          <Link to={createPageUrl("CreateCup")} className="mt-5 block">
            <Button className="w-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white gap-2 h-11 font-semibold shadow-lg shadow-[#F59E0B]/20">
              <Plus className="w-5 h-5" />
              Skapa ny turnering
            </Button>
          </Link>
        )}
      </Card>

      {/* Filters - Enhanced Design */}
      <Card className="bg-[#121715] border border-[#223029] rounded-[20px] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
        <div className="space-y-4">
          {/* Search with icon */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#7B8A83]" />
            <Input
              placeholder="Sök turnering eller plats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#18221E] border-[#223029] text-[#F4F7F5] rounded-[14px] h-11 focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-[#18221E] border-[#223029] text-[#F4F7F5] h-11">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla</SelectItem>
                <SelectItem value="registration_open">Anmälan öppen</SelectItem>
                <SelectItem value="ongoing">Pågående</SelectItem>
                <SelectItem value="upcoming">Kommande</SelectItem>
                <SelectItem value="completed">Avslutade</SelectItem>
              </SelectContent>
            </Select>

            <Select value={formatFilter} onValueChange={setFormatFilter}>
              <SelectTrigger className="bg-[#18221E] border-[#223029] text-[#F4F7F5] h-11">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla format</SelectItem>
                <SelectItem value="5v5">5v5</SelectItem>
                <SelectItem value="7v7">7v7</SelectItem>
                <SelectItem value="11v11">11v11</SelectItem>
              </SelectContent>
            </Select>

            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="bg-[#18221E] border-[#223029] text-[#F4F7F5] h-11">
                <SelectValue placeholder="Stad" />
              </SelectTrigger>
              <SelectContent>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>
                    {city === 'all' ? 'Alla städer' : city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center justify-center p-3 bg-[#18221E] rounded-xl border border-[#223029]">
              <span className="text-sm text-[#B6C2BC] font-semibold">
                {filteredCups.length} turneringar
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Live Cups Section */}
      {liveCups.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#DC2626]/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-[#FF6B35]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#F4F7F5]">Pågående nu</h3>
                <p className="text-xs text-[#B6C2BC]">Live turneringar</p>
              </div>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {liveCups.slice(0, 4).map((cup, index) => (
              <CupCard key={cup.id} cup={cup} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Cups Section */}
      {upcomingCups.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F59E0B]/20 to-[#D97706]/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#F4F7F5]">Kommande turneringar</h3>
                <p className="text-xs text-[#B6C2BC]">Anmäl dig nu</p>
              </div>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingCups.slice(0, 6).map((cup, index) => (
              <CupCard key={cup.id} cup={cup} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Filtered Results */}
      {(searchQuery || statusFilter !== 'all' || formatFilter !== 'all' || cityFilter !== 'all') && (
        <div>
          <h3 className="text-lg font-bold text-[#F4F7F5] mb-4">Sökresultat</h3>
          
          {filteredCups.length === 0 ? (
            <Card className="bg-[#121715] border border-[#223029] rounded-[20px] p-12 text-center">
              <Trophy className="w-16 h-16 text-[#7B8A83] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#F4F7F5] mb-2">Inga turneringar hittades</h3>
              <p className="text-[#B6C2BC]">Prova att justera dina sökkriterier</p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCups.map((cup, index) => (
                <CupCard key={cup.id} cup={cup} index={index} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && allCups.length === 0 && (
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px] p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#F59E0B]/20 to-[#D97706]/10 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-[#F59E0B]/60" />
          </div>
          <h3 className="text-xl font-bold text-[#F4F7F5] mb-2">Inga turneringar än</h3>
          <p className="text-[#B6C2BC] mb-6">
            {isAdmin 
              ? 'Skapa den första turneringen och starta tävlingen!' 
              : 'Det finns inga turneringar tillgängliga just nu.'}
          </p>
          {isAdmin && (
            <Link to={createPageUrl("CreateCup")}>
              <Button className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white gap-2">
                <Plus className="w-4 h-4" />
                Skapa turnering
              </Button>
            </Link>
          )}
        </Card>
      )}
    </div>
  );
}

// Cup Card Component with Enhanced Golden Theme
function CupCard({ cup, index }) {
  const statusConfig = STATUS_CONFIG[cup.status] || STATUS_CONFIG.upcoming;
  const StatusIcon = statusConfig.icon;
  const isHot = cup.status === 'registration_open' && (cup.current_participants / cup.max_participants) > 0.7;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link to={`${createPageUrl("CupDetail")}?cup_id=${cup.id}`}>
        <Card className={`bg-[#121715] border border-[#223029] hover:border-[#F59E0B]/50 transition-all duration-300 rounded-[20px] overflow-hidden group h-full ${statusConfig.glow}`}>
          {/* Banner with Golden Gradient */}
          {cup.logo_url ? (
            <div className="h-32 bg-gradient-to-br from-[#F59E0B]/20 to-[#D97706]/10 relative overflow-hidden">
              <img 
                src={cup.logo_url} 
                alt={cup.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121715] via-transparent to-transparent"></div>
              
              {/* Hot badge */}
              {isHot && (
                <div className="absolute top-3 right-3">
                  <Badge className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white border-0 gap-1 shadow-lg">
                    <Zap className="w-3 h-3" />
                    Populär
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <div className="h-32 bg-gradient-to-br from-[#F59E0B]/20 to-[#D97706]/10 flex items-center justify-center relative overflow-hidden">
              <Trophy className="w-14 h-14 text-[#F59E0B]/50 group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121715] via-transparent to-transparent"></div>
              
              {isHot && (
                <div className="absolute top-3 right-3">
                  <Badge className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white border-0 gap-1 shadow-lg">
                    <Zap className="w-3 h-3" />
                    Populär
                  </Badge>
                </div>
              )}
            </div>
          )}

          <CardContent className="p-4">
            {/* Status Badge - Golden Theme */}
            <Badge className={`${statusConfig.color} mb-3 border font-semibold`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </Badge>

            {/* Title */}
            <h3 className="text-base font-bold text-[#F4F7F5] mb-3 line-clamp-2 group-hover:text-[#F59E0B] transition-colors">
              {cup.name}
            </h3>

            {/* Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-[#B6C2BC]">
                <MapPin className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span className="truncate">{cup.location}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-[#B6C2BC]">
                <Calendar className="w-3.5 h-3.5 text-[#F59E0B]" />
                {new Date(cup.start_date).toLocaleDateString('sv-SE', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>

              <div className="flex items-center gap-2 text-sm text-[#B6C2BC]">
                <Users className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span className="font-semibold text-[#F4F7F5]">{cup.current_participants}</span>/{cup.max_participants} anmälda
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="h-1.5 bg-[#18221E] rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(cup.current_participants / cup.max_participants) * 100}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="h-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] rounded-full"
                />
              </div>
            </div>

            {/* Tags - Golden Theme */}
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-[#F59E0B]/20 text-[#FCD34D] border-[#F59E0B]/30 font-semibold">
                {cup.format}
              </Badge>
              <Badge className="bg-[#18221E] text-[#B6C2BC] border-[#223029]">
                {cup.signup_type === 'team' ? '👥 Lag' : '⚽ Solo'}
              </Badge>
              {cup.entry_fee > 0 && (
                <Badge className="bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20 text-[#FFD700] border-[#FFD700]/30 font-semibold">
                  {cup.entry_fee} kr
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}