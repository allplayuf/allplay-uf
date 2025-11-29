import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MapPin, UserPlus, CheckCircle, Clock, Target, TrendingUp, Shield, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

const SKILL_LEVEL_CONFIG = {
  beginner: { label: 'Nybörjare', icon: Target, color: 'bg-[#10B981]/20 text-[#A7F3D0]' },
  intermediate: { label: 'Medel', icon: TrendingUp, color: 'bg-[#14B8A6]/20 text-[#99F6E4]' },
  advanced: { label: 'Avancerad', icon: Shield, color: 'bg-[#8B5CF6]/20 text-[#DDD6FE]' },
  elite: { label: 'Elite', icon: Crown, color: 'bg-[#F59E0B]/20 text-[#FDE68A]' }
};

export default function FindPlayers({ 
  allUsers = [], 
  friendships = [], 
  currentUser, 
  onAddFriend,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
}) {
  const [searchQuery, setSearchQuery] = useState("");

  // Ensure all arrays are defined before filtering
  const safeUsers = Array.isArray(allUsers) ? allUsers : [];
  const safeFriendships = Array.isArray(friendships) ? friendships : [];

  // Filter users based on search
  const filteredUsers = safeUsers.filter(u => {
    if (!u || !currentUser) return false;
    if (u.id === currentUser?.id) return false; // Don't show current user
    
    const matchesSearch = !searchQuery || 
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.city?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  // Get friendship status for a user
  const getFriendshipStatus = (userId) => {
    if (!currentUser) return 'none';
    
    const friendship = safeFriendships.find(f =>
      (f.requester_id === currentUser?.id && f.addressee_id === userId) ||
      (f.requester_id === userId && f.addressee_id === currentUser?.id)
    );

    if (!friendship) return 'none';
    if (friendship.status === 'accepted') return 'accepted';
    if (friendship.status === 'pending') {
      return friendship.requester_id === currentUser?.id ? 'pending_outgoing' : 'pending_incoming';
    }
    return 'none';
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#7B8A83]" />
        <Input
          placeholder="Sök efter spelare (namn, stad)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#18221E] border border-[#223029] text-[#F4F7F5] focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A]/30 placeholder:text-[#7B8A83] rounded-[14px] h-12"
        />
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#B6C2BC]">
          {filteredUsers.length} {filteredUsers.length === 1 ? 'spelare' : 'spelare'} hittade
        </p>
      </div>

      {/* Player List */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((player, index) => {
          if (!player) return null;
          
          const friendshipStatus = getFriendshipStatus(player.id);
          const skillConfig = SKILL_LEVEL_CONFIG[player.skill_level || 'intermediate'];
          const SkillIcon = skillConfig?.icon || Target;

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
            >
              <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.28)] hover:border-[#2BA84A]/30 transition-all rounded-[16px]">
                <CardContent className="p-4">
                  <Link to={`${createPageUrl("Profile")}?userId=${player.id}`} className="block mb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-xl flex items-center justify-center flex-shrink-0">
                        {player.profile_image_url ? (
                          <img 
                            src={player.profile_image_url} 
                            alt={player.full_name} 
                            className="w-full h-full object-cover rounded-xl" 
                            loading="lazy" 
                          />
                        ) : (
                          <span className="text-[#FFFFFF] font-semibold text-lg">
                            {player.full_name?.[0] || 'U'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[#F4F7F5] text-sm truncate">
                          {player.full_name || 'Okänd spelare'}
                        </h4>
                        <div className="flex items-center gap-1 text-xs text-[#B6C2BC]">
                          <MapPin className="w-3 h-3" />
                          {player.city || 'Okänd stad'}
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Skill Badge */}
                  {skillConfig && (
                    <div className="mb-3">
                      <Badge className={`w-full justify-center py-1.5 ${skillConfig.color} rounded-lg text-xs font-semibold`}>
                        <SkillIcon className="w-3 h-3 mr-1" />
                        {skillConfig.label}
                      </Badge>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center justify-between p-2 bg-[#0F1513] rounded-xl">
                      <span className="text-xs text-[#B6C2BC] font-medium">Matcher</span>
                      <span className="font-mono font-semibold text-[#F4F7F5] text-sm">
                        {player.matches_played || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-[#0F1513] rounded-xl">
                      <span className="text-xs text-[#B6C2BC] font-medium">MVPs</span>
                      <span className="font-mono font-semibold text-[#F4743B] text-sm">
                        {player.mvp_count || 0}
                      </span>
                    </div>
                  </div>

                  {/* Friend Button */}
                  {friendshipStatus === 'none' && (
                    <motion.button
                      onClick={() => onAddFriend?.(player.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 1.05, transition: { duration: 0.1 } }}
                      className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-[14px] bg-[#2BA84A] text-[#FFFFFF] text-sm font-semibold hover:bg-[#248232] transition-all"
                    >
                      <UserPlus className="w-4 h-4" />
                      Lägg till vän
                    </motion.button>
                  )}

                  {friendshipStatus === 'accepted' && (
                    <button
                      disabled
                      className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-[14px] bg-[#2BA84A]/20 text-[#2BA84A] text-sm font-semibold cursor-not-allowed"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Vänner
                    </button>
                  )}

                  {friendshipStatus === 'pending_outgoing' && (
                    <button
                      disabled
                      className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-[14px] bg-[#18221E] text-[#B6C2BC] text-sm font-semibold cursor-not-allowed"
                    >
                      <Clock className="w-4 h-4" />
                      Förfrågan skickad
                    </button>
                  )}

                  {friendshipStatus === 'pending_incoming' && (
                    <motion.button
                      onClick={() => onAddFriend?.(player.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 1.05, transition: { duration: 0.1 } }}
                      className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-[14px] bg-[#F4743B] text-[#FFFFFF] text-sm font-semibold hover:bg-[#E5683A] transition-all"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Acceptera förfrågan
                    </motion.button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[20px]">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-[#2BA84A]/30">
              <Search className="w-8 h-8 text-[#9FC9AC]" />
            </div>
            <h3 className="text-[20px] leading-[28px] font-semibold text-[#F4F7F5] mb-2">
              Inga spelare hittades
            </h3>
            <p className="text-[14px] leading-[20px] text-[#B6C2BC]">
              Prova att söka efter något annat.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Load More Button */}
      {hasNextPage && (
        <div className="flex justify-center pt-4 pb-8">
          <Button 
            variant="outline" 
            onClick={() => fetchNextPage()} 
            disabled={isFetchingNextPage}
            className="border-[#2BA84A] text-[#2BA84A] hover:bg-[#2BA84A]/10"
          >
            {isFetchingNextPage ? 'Laddar...' : 'Visa fler'}
          </Button>
        </div>
      )}
    </div>
  );
}