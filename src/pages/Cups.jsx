import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Trophy, Calendar, MapPin, Users, Plus, 
  Search, Filter, Target, Award, CheckCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/components/utils/helpers";
import { PageLoadingSkeleton } from "../components/ui/loading-skeleton";

const STATUS_CONFIG = {
  upcoming: { 
    label: 'Kommande', 
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', 
    icon: Calendar 
  },
  registration_open: { 
    label: 'Anmälan öppen', 
    color: 'bg-green-500/20 text-green-300 border-green-500/30', 
    icon: CheckCircle 
  },
  registration_closed: { 
    label: 'Anmälan stängd', 
    color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', 
    icon: Trophy 
  },
  ongoing: { 
    label: 'Pågående', 
    color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', 
    icon: Trophy 
  },
  completed: { 
    label: 'Avslutad', 
    color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', 
    icon: Award 
  }
};

export default function CupsPage() {
  const [searchQuery, setSearchQuery] = useState('');
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
    queryKey: ['cups', statusFilter],
    queryFn: async () => {
      const queryParams = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const response = await base44.functions.invoke('cups/getCups', queryParams);
      return response.data;
    },
    staleTime: 60 * 1000,
  });

  const cups = cupsData?.cups || [];

  // Filter cups
  const filteredCups = cups.filter(cup => {
    const matchesSearch = !searchQuery || 
      cup.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cup.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFormat = formatFilter === 'all' || cup.format === formatFilter;
    const matchesSignupType = signupTypeFilter === 'all' || cup.signup_type === signupTypeFilter;
    
    return matchesSearch && matchesFormat && matchesSignupType;
  });

  const isAdmin = user?.role === 'admin';

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
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F4F7F5] mb-1">Turneringar</h1>
            <p className="text-sm text-[#B6C2BC]">Tävla i organiserade cuper och turneringar</p>
          </div>
          
          {isAdmin && (
            <Link to={createPageUrl("CreateCup")}>
              <Button className="bg-[#F4743B] hover:bg-[#E5683A] text-white gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Skapa turnering</span>
              </Button>
            </Link>
          )}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="bg-[#121715] border border-[#223029] rounded-[20px] p-4">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#7B8A83]" />
                <Input
                  placeholder="Sök efter turnering eller plats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#18221E] border-[#223029] text-[#F4F7F5] rounded-[14px] h-12"
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

                <Select value={signupTypeFilter} onValueChange={setSignupTypeFilter}>
                  <SelectTrigger className="bg-[#18221E] border-[#223029] text-[#F4F7F5]">
                    <SelectValue placeholder="Typ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla typer</SelectItem>
                    <SelectItem value="team">Lag</SelectItem>
                    <SelectItem value="solo">Solo</SelectItem>
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
        </motion.div>

        {/* Cups Grid */}
        {filteredCups.length === 0 ? (
          <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
            <CardContent className="p-12 text-center">
              <Trophy className="w-16 h-16 text-[#7B8A83] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#F4F7F5] mb-2">Inga turneringar hittades</h3>
              <p className="text-[#B6C2BC]">
                {searchQuery || statusFilter !== 'all' || formatFilter !== 'all' || signupTypeFilter !== 'all'
                  ? 'Prova att justera dina filter'
                  : 'Inga turneringar tillgängliga just nu'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredCups.map((cup, index) => {
              const statusConfig = STATUS_CONFIG[cup.status] || STATUS_CONFIG.upcoming;
              const StatusIcon = statusConfig.icon;

              return (
                <motion.div
                  key={cup.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link to={`${createPageUrl("CupDetail")}?cup_id=${cup.id}`}>
                    <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.28)] hover:border-[#F4743B]/30 transition-all rounded-[20px] overflow-hidden group h-full">
                      {/* Banner */}
                      {cup.logo_url ? (
                        <div className="h-32 bg-gradient-to-br from-[#2BA84A]/20 to-[#0F2917] relative overflow-hidden">
                          <img 
                            src={cup.logo_url} 
                            alt={cup.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#121715] to-transparent"></div>
                        </div>
                      ) : (
                        <div className="h-32 bg-gradient-to-br from-[#F4743B]/20 to-[#E5683A]/10 flex items-center justify-center relative">
                          <Trophy className="w-16 h-16 text-[#F4743B]/40" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#121715] to-transparent"></div>
                        </div>
                      )}

                      <CardContent className="p-4">
                        {/* Status Badge */}
                        <Badge className={`${statusConfig.color} mb-3 border`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-[#F4F7F5] mb-3 line-clamp-2 group-hover:text-[#F4743B] transition-colors">
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
                            {cup.current_participants}/{cup.max_participants} anmälda
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          <Badge className="bg-[#2BA84A]/20 text-[#9FC9AC] border-[#2BA84A]/30">
                            {cup.format}
                          </Badge>
                          <Badge className="bg-[#18221E] text-[#B6C2BC] border-[#223029]">
                            {cup.signup_type === 'team' ? 'Lag' : 'Solo'}
                          </Badge>
                          {cup.entry_fee > 0 && (
                            <Badge className="bg-[#F4743B]/20 text-[#F4743B] border-[#F4743B]/30">
                              {cup.entry_fee} kr
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Floating Create Button (Admin only) */}
      {isAdmin && (
        <Link to={createPageUrl("CreateCup")}>
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-20 lg:bottom-8 right-4 lg:right-8 w-14 h-14 lg:w-16 lg:h-16 bg-[#F4743B] hover:bg-[#E5683A] text-white rounded-full shadow-[0_8px_24px_rgba(244,116,59,0.4)] flex items-center justify-center z-40 transition-all"
          >
            <Plus className="w-6 h-6 lg:w-7 lg:h-7" strokeWidth={2.5} />
          </motion.button>
        </Link>
      )}
    </div>
  );
}