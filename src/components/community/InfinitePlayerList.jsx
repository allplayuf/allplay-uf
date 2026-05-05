import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Users, MapPin, Trophy } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, UserX, Clock } from "lucide-react";

export default function InfinitePlayerList({ 
  data, 
  fetchNextPage, 
  hasNextPage, 
  isFetchingNextPage,
  isLoading,
  currentUser,
  friendships,
  onAddFriend
}) {
  const loadMoreRef = useRef(null);

  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-[#121715] border border-[#223029] rounded-[16px] p-4 h-48 animate-pulse" />
        ))}
      </div>
    );
  }

  const allUsers = data?.pages.flatMap(page => page.users) || [];

  const getFriendshipStatus = (userId) => {
    const friendship = friendships.find(f =>
      (f.requester_id === currentUser.id && f.addressee_id === userId) ||
      (f.requester_id === userId && f.addressee_id === currentUser.id)
    );
    
    if (!friendship) return 'none';
    if (friendship.status === 'accepted') return 'accepted';
    if (friendship.requester_id === currentUser.id) return 'pending_outgoing';
    return 'pending_incoming';
  };

  const getSkillBracketColor = (bracket) => {
    const colors = {
      beginner: 'bg-[#10B981]/20 text-[#A7F3D0]',
      intermediate: 'bg-[#14B8A6]/20 text-[#99F6E4]',
      advanced: 'bg-[#8B5CF6]/20 text-[#DDD6FE]',
      elite: 'bg-[#F59E0B]/20 text-[#FDE68A]'
    };
    return colors[bracket] || 'bg-[#18221E] text-[#CFE8D6]';
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {allUsers.map((player, index) => {
          const friendshipStatus = getFriendshipStatus(player.id);

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="bg-[#121715] border border-[#223029] hover:border-[#2BA84A]/30 transition-all shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px] overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2BA84A] to-[#248232] flex items-center justify-center text-white font-semibold shadow-md flex-shrink-0">
                      {player.avatar_url ? (
                        <img
                          src={player.avatar_url}
                          alt={player.full_name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        player.full_name?.[0] || 'U'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#F4F7F5] text-[15px] leading-[20px] truncate">
                        {player.full_name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3 h-3 text-[#9FC9AC]" />
                        <span className="text-[12px] leading-[16px] text-[#B6C2BC] truncate">
                          {player.city}
                        </span>
                      </div>
                    </div>
                  </div>

                  {player.bio && (
                    <p className="text-[13px] leading-[18px] text-[#B6C2BC] mb-3 line-clamp-2">
                      {player.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {player.skill_level && (
                      <Badge className={`text-[11px] leading-[16px] ${getSkillBracketColor(player.skill_level)}`}>
                        {player.skill_level}
                      </Badge>
                    )}
                    {player.matches_played > 0 && (
                      <Badge className="bg-[#F4743B]/20 text-[#FDE3D2] text-[11px] leading-[16px]">
                        <Trophy className="w-3 h-3 mr-1" />
                        {player.matches_played} matcher
                      </Badge>
                    )}
                  </div>

                  {friendshipStatus === 'accepted' ? (
                    <Button disabled className="w-full h-10 bg-[#2BA84A]/20 text-[#CFE8D6] rounded-[12px] text-[13px] font-semibold">
                      <UserCheck className="w-4 h-4 mr-2" />
                      Vänner
                    </Button>
                  ) : friendshipStatus === 'pending_outgoing' ? (
                    <Button disabled className="w-full h-10 bg-[#F59E0B]/20 text-[#FDE68A] rounded-[12px] text-[13px] font-semibold">
                      <Clock className="w-4 h-4 mr-2" />
                      Inväntar svar
                    </Button>
                  ) : friendshipStatus === 'pending_incoming' ? (
                    <Button 
                      onClick={() => onAddFriend(player.id)}
                      className="w-full h-10 bg-gradient-to-r from-[#2BA84A] to-[#248232] hover:from-[#3BC95E] hover:to-[#2BA84A] text-white rounded-[12px] text-[13px] font-semibold transition-all"
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Acceptera förfrågan
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => onAddFriend(player.id)}
                      className="w-full h-10 bg-gradient-to-r from-[#2BA84A] to-[#248232] hover:from-[#3BC95E] hover:to-[#2BA84A] text-white rounded-[12px] text-[13px] font-semibold transition-all"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Lägg till vän
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="py-8 flex justify-center">
        {isFetchingNextPage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-[#2BA84A]"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Laddar fler spelare...</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}