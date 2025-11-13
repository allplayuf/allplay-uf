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
  Target, TrendingUp, Plus
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Yellow accent theme for cups
const STATUS_CONFIG = {
  upcoming: { 
    label: 'Kommande', 
    color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', 
    icon: Calendar 
  },
  registration_open: { 
    label: 'Anmälan öppen', 
    color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', 
    icon: CheckCircle 
  },
  registration_closed: { 
    label: 'Anmälan stängd', 
    color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', 
    icon: Clock 
  },
  ongoing: { 
    label: 'Pågående', 
    color: 'bg-red-500/20 text-red-300 border-red-500/30', 
    icon: Flame 
  },
  completed: { 
    label: 'Avslutad', 
    color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', 
    icon: Award 
  }
};

export default function CupsOverview({ user }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');

  // Fetch cups
  const { data: cupsData, isLoading } = useQuery({
    queryKey: ['cups', statusFilter],
    queryFn: async () => {
      const queryParams = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const response = await base44.functions.invoke('cups/getCups', queryParams);
      return response.data;
    },
    staleTime: 60 * 1000,
  });

  const allCups = cupsData?.cups || [];

  // Categorize cups
  const upcomingCups = allCups.filter(c => 
    c.status === 'upcoming' || c.status === 'registration_open'
  );
  const liveCups = allCups.filter(c => c.status === 'ongoing');
  const completedCups = allCups.filter(c => c.status === 'completed');

  // Get unique cities
  const cities = ['all', ...new Set(allCups.map(c => c.location).filter(Boolean))];

  // Filter cups
  const filteredCups = allCups.filter(cup => {
    const matchesSearch = !searchQuery || 
      cup.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cup.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFormat = formatFilter === 'all' || cup.format === formatFilter;
    const matchesCity = cityFilter === 'all' || cup.location === cityFilter;
    const matchesStatus = statusFilter === 'all' || cup.status === statusFilter;
    
    return matchesSearch && matchesFormat && matchesCity && matchesStatus;
  });

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Hero Section with Stats */}
      <Card className="bg-gradient-to-br from-[#F4743B]/10 to-[#E5683A]/5 border border-[#F4743B]/30 rounded-[20px] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-[#F4F7F5] mb-1">Turneringar & Cuper</h2>
            <p className="text-sm text-[#B6C2BC]">Tävla och utvecklas i organiserade turneringar</p>
          </div>
          <Trophy className="w-12 h-12 text-[#F4743B]/40" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 bg-[#121715]/50 rounded-xl text-center border border-[#F4743B]/10">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Calendar className="w-4 h-4 text-[#F4743B]" />
              <p className="text-2xl font-bold text-[#F4F7F5]">{upcomingCups.length}</p>
            </div>
            <p className="text-xs text-[#B6C2BC]">Kommande</p>
          </div>
          
          <div className="p-4 bg-[#121715]/50 rounded-xl text-center border border-[#F4743B]/10">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="w-4 h-4 text-[#FF6B35]" />
              <p className="text-2xl font-bold text-[#FF6B35]">{liveCups.length}</p>
            </div>
            <p className="text-xs text-[#B6C2BC]">Live</p>
          </div>
          
          <div className="p-4 bg-[#121715]/50 rounded-xl text-center border border-[#F4743B]/10">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Award className="w-4 h-4 text-[#F4743B]" />
              <p className="text-2xl font-bold text-[#F4F7F5]">{completedCups.length}</p>
            </div>
            <p className="text-xs text-[#B6C2BC]">Avslutade</p>
          </div>
        </div>

        {isAdmin && (
          <Link to={createPageUrl("CreateCup")} className="mt-4 block">
            <Button className="w-full bg-[#F4743B] hover:bg-[#E5683A] text-white gap-2">
              <Plus className="w-4 h-4" />
              Skapa ny turnering
            </Button>
          </Link>
        )}
      </Card>

      {/* Filters */}
      <Card className="bg-[#121715] border border-[#223029] rounded-[20px] p-4">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#7B8A83]" />
            <Input
              placeholder="Sök turnering eller plats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#18221E] border-[#223029] text-[#F4F7F5] rounded-[14px] h-11"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-[#18221E] border-[#223029] text-[#F4F7F5]">
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
              <SelectTrigger className="bg-[#18221E] border-[#223029] text-[#F4F7F5]">
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
              <SelectTrigger className="bg-[#18221E] border-[#223029] text-[#F4F7F5]">
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
              <span className="text-sm text-[#B6C2BC] font-medium">
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
              <Flame className="w-5 h-5 text-[#FF6B35]" />
              <h3 className="text-lg font-bold text-[#F4F7F5]">Pågående nu</h3>
            </div>
            <Link to={createPageUrl("Cups")} className="text-sm text-[#F4743B] hover:text-[#E5683A] flex items-center gap-1">
              Se alla
              <ArrowRight className="w-4 h-4" />
            </Link>
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
              <Calendar className="w-5 h-5 text-[#F4743B]" />
              <h3 className="text-lg font-bold text-[#F4F7F5]">Kommande turneringar</h3>
            </div>
            <Link to={createPageUrl("Cups")} className="text-sm text-[#F4743B] hover:text-[#E5683A] flex items-center gap-1">
              Se alla
              <ArrowRight className="w-4 h-4" />
            </Link>
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
          <Trophy className="w-16 h-16 text-[#F4743B]/40 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#F4F7F5] mb-2">Inga turneringar än</h3>
          <p className="text-[#B6C2BC] mb-6">
            {isAdmin 
              ? 'Skapa den första turneringen och starta tävlingen!' 
              : 'Det finns inga turneringar tillgängliga just nu.'}
          </p>
          {isAdmin && (
            <Link to={createPageUrl("CreateCup")}>
              <Button className="bg-[#F4743B] hover:bg-[#E5683A] text-white gap-2">
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

// Cup Card Component with Yellow Theme
function CupCard({ cup, index }) {
  const statusConfig = STATUS_CONFIG[cup.status] || STATUS_CONFIG.upcoming;
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link to={`${createPageUrl("CupDetail")}?cup_id=${cup.id}`}>
        <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.28)] hover:border-[#F4743B]/30 transition-all rounded-[20px] overflow-hidden group h-full">
          {/* Banner with Yellow Gradient */}
          {cup.logo_url ? (
            <div className="h-28 bg-gradient-to-br from-[#F4743B]/20 to-[#E5683A]/10 relative overflow-hidden">
              <img 
                src={cup.logo_url} 
                alt={cup.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121715] to-transparent"></div>
            </div>
          ) : (
            <div className="h-28 bg-gradient-to-br from-[#F4743B]/20 to-[#E5683A]/10 flex items-center justify-center relative">
              <Trophy className="w-12 h-12 text-[#F4743B]/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121715] to-transparent"></div>
            </div>
          )}

          <CardContent className="p-4">
            {/* Status Badge - Yellow Theme */}
            <Badge className={`${statusConfig.color} mb-3 border`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </Badge>

            {/* Title */}
            <h3 className="text-base font-bold text-[#F4F7F5] mb-3 line-clamp-2 group-hover:text-[#F4743B] transition-colors">
              {cup.name}
            </h3>

            {/* Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-[#B6C2BC]">
                <MapPin className="w-3.5 h-3.5 text-[#F4743B]" />
                {cup.location}
              </div>

              <div className="flex items-center gap-2 text-sm text-[#B6C2BC]">
                <Calendar className="w-3.5 h-3.5 text-[#F4743B]" />
                {new Date(cup.start_date).toLocaleDateString('sv-SE', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>

              <div className="flex items-center gap-2 text-sm text-[#B6C2BC]">
                <Users className="w-3.5 h-3.5 text-[#F4743B]" />
                {cup.current_participants}/{cup.max_participants} anmälda
              </div>
            </div>

            {/* Tags - Yellow Theme */}
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-[#F4743B]/20 text-[#F4743B] border-[#F4743B]/30">
                {cup.format}
              </Badge>
              <Badge className="bg-[#18221E] text-[#B6C2BC] border-[#223029]">
                {cup.signup_type === 'team' ? 'Lag' : 'Solo'}
              </Badge>
              {cup.entry_fee > 0 && (
                <Badge className="bg-[#FFA500]/20 text-[#FFA500] border-[#FFA500]/30">
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