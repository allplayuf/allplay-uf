
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Users, MapPin, Trophy, Search, ChevronRight, Lock, Plus, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import RankBadge, { getRankFromElo } from "./RankBadge"; // Updated import path for RankBadge

export default function TeamDiscovery({ teams, currentUser, onJoinRequest }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('members'); // Updated initial state for sortBy

  // Label mappings
  const sortByLabels = {
    members: 'Medlemmar',
    name: 'Namn',
    elo: 'Ranking'
  };

  // console.log('TeamDiscovery - All teams:', teams?.length, teams); // Kept for debugging if needed
  // console.log('TeamDiscovery - Current user:', currentUser); // Kept for debugging if needed

  // console.log('TeamDiscovery - Data received:', { // Kept for debugging if needed
  //   currentUserId: currentUser?.id,
  //   currentUserRole: currentUser?.role,
  //   totalTeams: teams?.length,
  //   sampleTeams: teams?.slice(0, 3).map(t => ({
  //     id: t.id,
  //     name: t.name,
  //     is_public: t.is_public
  //   }))
  // });

  const getSortedAndFilteredTeams = () => {
    let filtered = [...teams];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // City filter
    if (cityFilter !== 'all') {
      filtered = filtered.filter(t => t.city === cityFilter);
    }
    
    // Sorting
    if (sortBy === 'elo') {
      filtered.sort((a, b) => (b.elo_rating || 1200) - (a.elo_rating || 1200));
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'members') {
      filtered.sort((a, b) => (b.current_members || 0) - (a.current_members || 0));
    }
    
    return filtered;
  };

  const filteredTeams = getSortedAndFilteredTeams();
  
  // Get unique cities for the city filter dropdown
  const cities = [...new Set(teams.map(t => t.city).filter(Boolean))].sort();

  // console.log('TeamDiscovery - Filtered teams:', filteredTeams?.length, filteredTeams); // Kept for debugging if needed

  return (
    <div className="space-y-6"> {/* Updated spacing */}
      {/* Search & Filters */}
      <div className="space-y-3">
        {/* Search */}
        <Input
          placeholder="Sök lag efter namn eller stad..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-11 bg-[#18221E] border border-[#223029] text-[#F4F7F5] placeholder:text-[#B6C2BC] rounded-[14px]"
        />
        
        {/* Filters - HORISONTELLT PÅ MOBIL */}
        <div className="flex flex-row gap-2"> {/* Using flex-row for horizontal layout */}
          {/* City Filter */}
          <div className="flex-1">
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="h-10 w-full bg-[#18221E] border border-[#223029] text-[#F4F7F5] rounded-[12px] text-sm">
                <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                <SelectValue>
                  {cityFilter === 'all' ? 'Alla städer' : cityFilter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#121715] border border-[#223029] rounded-[14px]">
                <SelectItem value="all">Alla städer</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div className="flex-1">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-10 w-full bg-[#18221E] border border-[#223029] text-[#F4F7F5] rounded-[12px] text-sm">
                <SlidersHorizontal className="w-4 h-4 mr-2 flex-shrink-0" />
                <SelectValue>
                  {sortByLabels[sortBy]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#121715] border border-[#223029] rounded-[14px]">
                <SelectItem value="members">Medlemmar</SelectItem>
                <SelectItem value="name">Namn</SelectItem>
                <SelectItem value="elo">Ranking</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* My City Button */}
          {currentUser?.city && (
            <button
              onClick={() => setCityFilter(currentUser.city)}
              className="h-10 px-4 bg-[#2BA84A]/16 hover:bg-[#2BA84A]/24 text-[#CFE8D6] ring-1 ring-[#2BA84A]/30 rounded-[12px] text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0"
            >
              Min stad
            </button>
          )}
        </div>
        
        {/* Teams Count Display */}
        <div className="text-sm text-[#B6C2BC]">
          Visar {filteredTeams.length} lag
        </div>
      </div>

      {/* Teams Grid or No Teams Found message */}
      {filteredTeams.length === 0 ? (
        <Card className="relative overflow-hidden bg-gradient-to-br from-[#2BA84A] to-[#0F2917] rounded-[14px] sm:rounded-[16px] lg:rounded-[20px] p-5 sm:p-8 lg:p-12 xl:p-16 shadow-[0_6px_18px_rgba(0,0,0,0.22)] border border-[#223029]">
          <div className="absolute top-[-30px] right-[-30px] w-28 h-28 bg-[#2BA84A]/40 rounded-full"></div>
          <div className="absolute bottom-[-40px] left-[-40px] w-32 h-32 bg-[#0F2917]/60 rounded-full"></div>
          
          <div className="relative z-10 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 bg-[#FFFFFF]/15 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-[#FFFFFF]/25">
              <Shield className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 text-[#EAF6EE]" />
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl xl:text-[28px] xl:leading-[34px] font-semibold text-[#EAF6EE] mb-2 sm:mb-3">Inga lag hittade</h3>
            <p className="text-xs sm:text-sm lg:text-base xl:text-[14px] xl:leading-[20px] text-[#CFE8D6] mb-6 sm:mb-8 max-w-md mx-auto">
              Prova att söka efter något annat eller skapa ditt eget lag!
            </p>
            <button className="inline-flex h-10 sm:h-11 lg:h-12 items-center justify-center gap-2 rounded-[12px] sm:rounded-[14px] lg:rounded-[16px] bg-[#FFFFFF]/16 px-5 sm:px-6 text-[13px] leading-[18px] sm:text-[14px] sm:leading-[20px] text-[#EAF6EE] ring-1 ring-[#FFFFFF]/30 transition-all hover:bg-[#FFFFFF]/24 hover:ring-[#FFFFFF]/45 hover:scale-[1.02] active:scale-[0.98] font-semibold">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Skapa ditt lag
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {filteredTeams.map((team) => (
            <Card key={team.id} className="bg-[#121715] border border-[#223029] hover:border-[#2BA84A] transition-all shadow-[0_6px_18px_rgba(0,0,0,0.22)] hover:scale-[1.02] rounded-[16px]">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-2xl flex items-center justify-center overflow-hidden">
                      {team.logo_url ? (
                        <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                      ) : (
                        <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-[#EAF6EE]" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[16px] leading-[24px] text-[#F4F7F5]">{team.name}</h3>
                      <p className="text-[13px] leading-[18px] text-[#B6C2BC] flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-[#9FC9AC]" />
                        {team.city}
                      </p>
                    </div>
                  </div>
                  {!team.is_public && (
                    <Lock className="w-5 h-5 text-[#F4743B]" />
                  )}
                </div>

                {/* Rank Badge with Progress */}
                <div className="mb-4">
                  <RankBadge 
                    elo={team.elo_rating} 
                    showProgress={true} 
                    showTrend={true} 
                    rankHistory={team.rank_history}
                    size="md"
                  />
                </div>

                {team.description && (
                  <p className="text-[13px] leading-[18px] text-[#B6C2BC] mb-4 line-clamp-2">
                    {team.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="text-center p-3 bg-[#18221E] rounded-xl border border-[#223029]">
                    <div className="text-lg font-semibold text-[#2BA84A]">{team.current_members}/{team.max_members}</div>
                    <div className="text-[13px] leading-[18px] text-[#B6C2BC]">Medlemmar</div>
                  </div>
                  <div className="text-center p-3 bg-[#18221E] rounded-xl border border-[#223029]">
                    <div className="text-lg font-semibold text-[#2BA84A]">{team.matches_played || 0}</div>
                    <div className="text-[13px] leading-[18px] text-[#B6C2BC]">Matcher</div>
                  </div>
                </div>

                <Link to={`${createPageUrl("TeamOverview")}?id=${team.id}`} className="block">
                  <button className="w-full inline-flex h-10 sm:h-12 items-center justify-center gap-2 rounded-[16px] bg-[#2BA84A]/16 px-6 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30 transition-all hover:bg-[#2BA84A]/24 hover:ring-[#2BA84A]/45 hover:scale-[1.02] font-semibold">
                    <Shield className="w-5 h-5" />
                    Visa lag
                    <ChevronRight className="w-5 h-5 ml-auto" />
                  </button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
