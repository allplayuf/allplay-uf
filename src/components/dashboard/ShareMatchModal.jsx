import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, UserPlus, Copy, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function ShareMatchModal({ match, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [sentTo, setSentTo] = useState(new Set());

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => await base44.auth.me(),
  });

  const { data: friendships = [] } = useQuery({
    queryKey: ['friendships'],
    queryFn: async () => await base44.entities.Friendship.list(),
    enabled: !!user,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => await base44.entities.User.list(),
    enabled: !!user,
  });

  const friends = allUsers.filter(u => {
    const friendship = friendships.find(f =>
      (f.requester_id === user?.id && f.addressee_id === u.id) ||
      (f.addressee_id === user?.id && f.requester_id === u.id)
    );
    return friendship && friendship.status === 'accepted';
  });

  const filteredFriends = friends.filter(friend =>
    friend.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyLink = () => {
    const matchUrl = `${window.location.origin}/MatchDetail?id=${match.id}`;
    navigator.clipboard.writeText(matchUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleInviteFriend = async (friendId) => {
    try {
      await base44.entities.MatchInvitation.create({
        match_id: match.id,
        invited_user_id: friendId,
        inviter_id: user.id,
        status: 'pending'
      });
      setSentTo(new Set([...sentTo, friendId]));
    } catch (error) {
      console.error('Error inviting friend:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end lg:items-center justify-center z-50 p-0 lg:p-4">
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="bg-[#121715] rounded-t-[24px] lg:rounded-[24px] w-full lg:max-w-md border border-[#223029] shadow-[0_8px_24px_rgba(0,0,0,0.3)] max-h-[85vh] lg:max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#223029]">
          <h3 className="text-lg font-bold text-[#F4F7F5]">Dela Match</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#18221E] hover:bg-[#223029] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-[#B6C2BC]" />
          </button>
        </div>

        {/* Copy Link */}
        <div className="p-5 border-b border-[#223029]">
          <button
            onClick={handleCopyLink}
            className="w-full h-12 bg-gradient-to-r from-[#2BA84A] to-[#248232] hover:from-[#248232] hover:to-[#2BA84A] rounded-xl flex items-center justify-center gap-2 text-white font-semibold transition-all"
          >
            {copiedLink ? (
              <>
                <Check className="w-5 h-5" />
                <span>Länk Kopierad!</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span>Kopiera Länk</span>
              </>
            )}
          </button>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto p-5">
          <h4 className="text-sm font-semibold text-[#F4F7F5] mb-3">Bjud in vänner</h4>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7B8A83]" />
            <input
              type="text"
              placeholder="Sök vänner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-[#18221E] border border-[#223029] rounded-xl text-sm text-[#F4F7F5] placeholder:text-[#7B8A83] focus:outline-none focus:ring-2 focus:ring-[#2BA84A]/50"
            />
          </div>

          {/* Friends */}
          {filteredFriends.length > 0 ? (
            <div className="space-y-2">
              {filteredFriends.map((friend) => {
                const isSent = sentTo.has(friend.id);
                return (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-3 bg-[#18221E] rounded-xl border border-[#223029]"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-xl flex items-center justify-center flex-shrink-0">
                        {friend.profile_image_url ? (
                          <img src={friend.profile_image_url} alt={friend.full_name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <span className="text-white font-semibold text-sm">{friend.full_name?.[0] || 'U'}</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-[#F4F7F5] truncate">{friend.display_name || friend.full_name}</p>
                    </div>
                    <button
                      onClick={() => handleInviteFriend(friend.id)}
                      disabled={isSent}
                      className={`px-4 h-9 rounded-lg font-semibold text-sm transition-colors ${
                        isSent
                          ? 'bg-[#223029] text-[#7B8A83] cursor-not-allowed'
                          : 'bg-[#2BA84A] hover:bg-[#248232] text-white'
                      }`}
                    >
                      {isSent ? 'Skickad' : 'Bjud in'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[#18221E] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <UserPlus className="w-8 h-8 text-[#7B8A83]" />
              </div>
              <p className="text-sm text-[#B6C2BC]">
                {searchQuery ? 'Inga vänner hittades' : 'Lägg till vänner för att bjuda in'}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}