import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Search, Trash2, MapPin, Calendar, Users, Filter, Shield, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MatchManagement({ matches, venues, onDelete, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const getVenueName = (venueId) => {
    const venue = venues.find(v => v.id === venueId);
    return venue ? venue.name : 'Okänd plan';
  };

  const filteredMatches = matches.filter(match => {
    // Search filter
    const matchesSearch = 
      match.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getVenueName(match.venue_id).toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || match.status === statusFilter;
    
    // Type filter
    let matchesType = true;
    if (typeFilter === 'team') {
      matchesType = match.is_team_match === true;
    } else if (typeFilter === 'casual') {
      matchesType = match.is_team_match !== true;
    } else if (typeFilter === 'spontaneous') {
      matchesType = match.is_spontaneous === true;
    }
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      upcoming: { label: 'Kommande', color: 'bg-[#2BA84A]/20 text-[#CFE8D6] ring-1 ring-[#2BA84A]/30' },
      ongoing: { label: 'Pågående', color: 'bg-[#FFD700]/20 text-[#FEF3C7] ring-1 ring-[#FFD700]/30' },
      completed: { label: 'Avslutad', color: 'bg-[#6B7280]/20 text-[#E5E7EB] ring-1 ring-[#6B7280]/30' },
      cancelled: { label: 'Raderad', color: 'bg-[#DC2626]/20 text-[#FEE2E2] ring-1 ring-[#DC2626]/30' }
    };
    return statusConfig[status] || statusConfig.upcoming;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
        <CardHeader>
          <CardTitle className="text-[#F4F7F5] flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#2BA84A]" />
            Matchhantering
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B6C2BC] w-5 h-5" />
            <Input
              placeholder="Sök matcher eller planer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#18221E] border border-[#223029] text-[#F4F7F5] h-11 rounded-xl"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] h-11 rounded-xl">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla status</SelectItem>
                <SelectItem value="upcoming">Kommande</SelectItem>
                <SelectItem value="ongoing">Pågående</SelectItem>
                <SelectItem value="completed">Avslutade</SelectItem>
                <SelectItem value="cancelled">Raderade</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] h-11 rounded-xl">
                <Trophy className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Typ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla typer</SelectItem>
                <SelectItem value="team">Lagmatcher</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="spontaneous">Spontana</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={onRefresh}
              variant="outline"
              className="h-11 rounded-xl border-[#223029] hover:bg-[#18221E] text-[#F4F7F5]"
            >
              Uppdatera
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#B6C2BC]">
              Visar <span className="font-semibold text-[#F4F7F5]">{filteredMatches.length}</span> av {matches.length} matcher
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Match List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredMatches.length === 0 ? (
            <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
              <CardContent className="p-12 text-center">
                <Trophy className="w-16 h-16 text-[#248232] mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-[#F4F7F5] mb-2">Inga matcher hittades</h3>
                <p className="text-sm text-[#B6C2BC]">Prova att ändra dina sökfilter</p>
              </CardContent>
            </Card>
          ) : (
            filteredMatches.map((match, index) => {
              const statusBadge = getStatusBadge(match.status);
              
              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                >
                  <Card className="bg-[#121715] border border-[#223029] hover:border-[#2BA84A]/30 transition-all rounded-[16px]">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-xl flex items-center justify-center flex-shrink-0">
                              <Trophy className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-[#F4F7F5] text-base truncate mb-1">
                                {match.title}
                              </h4>
                              <div className="flex flex-wrap gap-2 mb-2">
                                <Badge className={`text-xs ${statusBadge.color}`}>
                                  {statusBadge.label}
                                </Badge>
                                <Badge className="text-xs bg-[#2BA84A]/20 text-[#CFE8D6] ring-1 ring-[#2BA84A]/30">
                                  {match.format}
                                </Badge>
                                {match.is_team_match && (
                                  <Badge className="text-xs bg-[#9B59B6]/20 text-[#DDA5E8] ring-1 ring-[#9B59B6]/30">
                                    <Shield className="w-3 h-3 mr-1" />
                                    Lagmatch
                                  </Badge>
                                )}
                                {match.is_spontaneous && (
                                  <Badge className="text-xs bg-[#F4743B]/20 text-[#FDE3D2] ring-1 ring-[#F4743B]/30">
                                    <Zap className="w-3 h-3 mr-1" />
                                    Spontan
                                  </Badge>
                                )}
                              </div>
                              <div className="space-y-1 text-xs text-[#B6C2BC]">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span className="truncate">{getVenueName(match.venue_id)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>{match.date} • {match.time}</span>
                                </div>
                                {!match.is_spontaneous && (
                                  <div className="flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5" />
                                    <span>{match.current_players || 0} / {match.max_players} spelare</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onDelete(match.id, match.title)}
                          className="bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl h-10 px-4 flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Radera
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}