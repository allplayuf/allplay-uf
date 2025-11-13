import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Search, Trash2, MapPin, Users, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TeamManagement({ teams, onDelete, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTeams = teams.filter(team => {
    const matchesSearch = 
      team.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.city?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Only show active teams (not deleted)
    return matchesSearch && team.is_active !== false;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
        <CardHeader>
          <CardTitle className="text-[#F4F7F5] flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#9B59B6]" />
            Laghantering
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B6C2BC] w-5 h-5" />
            <Input
              placeholder="Sök lag efter namn eller stad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#18221E] border border-[#223029] text-[#F4F7F5] h-11 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-[#B6C2BC]">
              Visar <span className="font-semibold text-[#F4F7F5]">{filteredTeams.length}</span> av {teams.filter(t => t.is_active !== false).length} lag
            </span>
            <Button
              onClick={onRefresh}
              variant="outline"
              className="h-11 rounded-xl border-[#223029] hover:bg-[#18221E] text-[#F4F7F5]"
            >
              Uppdatera
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredTeams.length === 0 ? (
            <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
              <CardContent className="p-12 text-center">
                <Shield className="w-16 h-16 text-[#9B59B6] mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-[#F4F7F5] mb-2">Inga lag hittades</h3>
                <p className="text-sm text-[#B6C2BC]">Prova att ändra din sökning</p>
              </CardContent>
            </Card>
          ) : (
            filteredTeams.map((team, index) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
              >
                <Card className="bg-[#121715] border border-[#223029] hover:border-[#9B59B6]/30 transition-all rounded-[16px]">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Team Logo */}
                        <div className="w-14 h-14 bg-gradient-to-br from-[#9B59B6] to-[#8E44AD] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {team.logo_url ? (
                            <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                          ) : (
                            <Shield className="w-7 h-7 text-white" />
                          )}
                        </div>

                        {/* Team Info */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div>
                            <h4 className="font-semibold text-[#F4F7F5] text-base truncate mb-1">
                              {team.name}
                            </h4>
                            {team.description && (
                              <p className="text-xs text-[#B6C2BC] line-clamp-1">
                                {team.description}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge className="text-xs bg-[#9B59B6]/20 text-[#DDA5E8] ring-1 ring-[#9B59B6]/30">
                              <Users className="w-3 h-3 mr-1" />
                              {team.current_members} medlemmar
                            </Badge>
                            <Badge className="text-xs bg-[#2BA84A]/20 text-[#CFE8D6] ring-1 ring-[#2BA84A]/30">
                              <Trophy className="w-3 h-3 mr-1" />
                              {team.elo_rating || 1000} ELO
                            </Badge>
                          </div>

                          <div className="space-y-1 text-xs text-[#B6C2BC]">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{team.city}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Trophy className="w-3.5 h-3.5" />
                              <span>{team.wins || 0}V - {team.draws || 0}O - {team.losses || 0}F ({team.matches_played || 0} matcher)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDelete(team.id, team.name)}
                        className="bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl h-10 px-4 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Radera
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}