import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { X, Search, Copy, Check, Link2, Share2, UserPlus, MessageCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSupabaseAuth } from "@/components/supabase/AuthProvider";
import { base44 } from "@/api/base44Client";
import AvatarImage from "@/components/ui/avatar-image";
import { getUsersByIds } from "@/components/supabase/services";

/**
 * Premium share modal.
 *  - WebShare API when available (native iOS/Android share sheet)
 *  - Always-on "Kopiera länk" with success state
 *  - Invite accepted friends via MatchInvitation entity
 *  - Graceful empty/loading states
 */
export default function ShareMatchModal({ match, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [sentTo, setSentTo] = useState(new Set());

  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();

  const matchUrl = `${window.location.origin}/MatchDetail?id=${match?.id}`;
  const shareText = `Vill du spela ${match?.title || 'fotboll'} med mig? ⚽`;

  // Load friendships & friend user records
  const { data: friendships = [] } = useQuery({
    queryKey: ['share-friendships', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const [sent, received] = await Promise.all([
        base44.entities.Friendship.filter({ requester_id: user.id, status: 'accepted' }),
        base44.entities.Friendship.filter({ addressee_id: user.id, status: 'accepted' }),
      ]);
      return [...sent, ...received];
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });

  const friendIds = useMemo(() => {
    if (!user?.id) return [];
    return friendships.map(f =>
      f.requester_id === user.id ? f.addressee_id : f.requester_id
    ).filter(Boolean);
  }, [friendships, user?.id]);

  const { data: friends = [], isLoading: friendsLoading } = useQuery({
    queryKey: ['share-friends', friendIds],
    queryFn: () => getUsersByIds(friendIds),
    enabled: friendIds.length > 0,
    staleTime: 60 * 1000,
  });

  const filteredFriends = friends.filter(f => {
    const name = (f.display_name || f.full_name || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: match?.title, text: shareText, url: matchUrl });
        return;
      } catch (err) {
        if (err?.name !== 'AbortError') handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(matchUrl);
      setCopied(true);
      toast.success('Länk kopierad!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Kunde inte kopiera länken');
    }
  };

  const inviteMutation = useMutation({
    mutationFn: async (friendId) => {
      return base44.entities.MatchInvitation.create({
        match_id: match.id,
        invited_user_id: friendId,
        inviter_id: user.id,
        status: 'pending',
      });
    },
    onSuccess: (_, friendId) => {
      setSentTo(prev => new Set([...prev, friendId]));
      toast.success('Inbjudan skickad');
    },
    onError: () => toast.error('Kunde inte skicka inbjudan'),
  });

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end lg:items-center justify-center z-[100] p-0 lg:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#121715] rounded-t-[24px] lg:rounded-[24px] w-full lg:max-w-md border-t lg:border border-[#223029] shadow-[0_-8px_32px_rgba(0,0,0,0.5)] lg:shadow-[0_20px_60px_rgba(0,0,0,0.5)] max-h-[88vh] lg:max-h-[80vh] flex flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Drag handle (mobile) */}
        <div className="lg:hidden pt-2 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-white/15" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-4 border-b border-[#223029]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2BA84A]/15 ring-1 ring-[#2BA84A]/25 flex items-center justify-center">
              <Share2 className="w-4 h-4 text-[#34C257]" strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#F4F7F5] leading-tight">Dela match</h3>
              <p className="text-[11px] text-[#8FA097] truncate max-w-[200px]">{match?.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#18221E] hover:bg-[#223029] flex items-center justify-center transition-colors"
            aria-label="Stäng"
          >
            <X className="w-4 h-4 text-[#B6C2BC]" />
          </button>
        </div>

        {/* Quick actions */}
        <div className="p-5 space-y-2.5 border-b border-[#223029]/60">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleShare}
            className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-[14px] transition-all"
            style={{
              background: 'linear-gradient(180deg, #34C257 0%, #2BA84A 55%, #248232 100%)',
              boxShadow: '0 8px 20px rgba(43,168,74,0.32), inset 0 1px 0 rgba(255,255,255,0.18)',
            }}
          >
            <Share2 className="w-4 h-4" strokeWidth={2.5} />
            Dela via…
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleCopy}
            className={`w-full h-11 rounded-xl flex items-center justify-center gap-2 font-semibold text-[13px] transition-all ring-1 ${
              copied
                ? 'bg-[#2BA84A]/12 ring-[#2BA84A]/35 text-[#86EFAC]'
                : 'bg-white/[0.05] ring-white/10 text-[#F4F7F5] hover:bg-white/[0.09]'
            }`}
          >
            {copied ? <Check className="w-4 h-4" strokeWidth={2.6} /> : <Link2 className="w-4 h-4" strokeWidth={2.4} />}
            {copied ? 'Länk kopierad' : 'Kopiera länk'}
          </motion.button>
        </div>

        {/* Friends list */}
        <div className="flex-1 overflow-y-auto p-5">
          <h4 className="text-[11px] font-bold text-[#8FA097] uppercase tracking-wider mb-3">Bjud in vänner</h4>

          {friendIds.length > 0 && (
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7B8A83]" />
              <input
                type="text"
                placeholder="Sök vänner…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-[#18221E] border border-[#223029] rounded-xl text-[13px] text-[#F4F7F5] placeholder:text-[#7B8A83] focus:outline-none focus:ring-2 focus:ring-[#2BA84A]/40 focus:border-[#2BA84A]/40"
              />
            </div>
          )}

          {friendsLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-[#18221E] animate-pulse" />
              ))}
            </div>
          ) : filteredFriends.length > 0 ? (
            <div className="space-y-2">
              {filteredFriends.map((friend) => {
                const isSent = sentTo.has(friend.id);
                return (
                  <div
                    key={friend.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-[#18221E] border border-[#223029] hover:border-[#2BA84A]/25 transition-colors"
                  >
                    <AvatarImage
                      src={friend.avatar_url || friend.profile_image_url}
                      name={friend.display_name || friend.full_name || 'S'}
                      className="w-10 h-10 flex-shrink-0"
                      textClassName="text-sm font-semibold"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#F4F7F5] truncate">
                        {friend.display_name || friend.full_name}
                      </p>
                      {friend.city && (
                        <p className="text-[11px] text-[#8FA097] truncate">{friend.city}</p>
                      )}
                    </div>
                    <button
                      onClick={() => inviteMutation.mutate(friend.id)}
                      disabled={isSent || inviteMutation.isPending}
                      className={`h-9 px-3.5 rounded-lg text-[12px] font-bold transition-all flex-shrink-0 ${
                        isSent
                          ? 'bg-[#2BA84A]/12 text-[#86EFAC] ring-1 ring-[#2BA84A]/30'
                          : 'bg-[#2BA84A] hover:bg-[#248232] text-white'
                      }`}
                    >
                      {isSent ? (
                        <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" />Skickad</span>
                      ) : (
                        'Bjud in'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#18221E] ring-1 ring-[#223029] flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-[#7B8A83]" />
              </div>
              <p className="text-[13px] font-semibold text-[#B6C2BC] mb-1">
                {searchQuery ? 'Inga träffar' : 'Inga vänner än'}
              </p>
              <p className="text-[11px] text-[#8FA097]">
                {searchQuery ? 'Prova ett annat namn' : 'Kopiera länken istället och dela direkt'}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}