import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  X, 
  Search, 
  UserPlus, 
  Check, 
  Users,
  Send,
  MapPin,
  Target,
  TrendingUp,
  Shield,
  Crown
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getUsersByIds } from '@/components/supabase/services/usersService';
import { motion, AnimatePresence } from 'framer-motion';

const SKILL_LEVEL_CONFIG = {
  beginner: { label: 'Nybörjare', icon: Target, color: 'from-[#10B981] to-[#059669]', textColor: 'text-[#A7F3D0]' },
  intermediate: { label: 'Medel', icon: TrendingUp, color: 'from-[#14B8A6] to-[#0D9488]', textColor: 'text-[#99F6E4]' },
  advanced: { label: 'Avancerad', icon: Shield, color: 'from-[#8B5CF6] to-[#7C3AED]', textColor: 'text-[#DDD6FE]' },
  elite: { label: 'Elit', icon: Crown, color: 'from-[#F59E0B] to-[#D97706]', textColor: 'text-[#FDE68A]' }
};

export default function InviteFriendsModal({ match, currentUser, onClose, onInvitesSent }) {
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [existingInvitations, setExistingInvitations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      // Get all friendships via Base44 (Friendship entity not yet migrated)
      const [sent, received] = await Promise.all([
        base44.entities.Friendship.filter({ requester_id: currentUser.id }),
        base44.entities.Friendship.filter({ addressee_id: currentUser.id })
      ]);
      const allFriendships = [...sent, ...received];
      const myFriendships = allFriendships.filter(f => f.status === 'accepted');

      // Get friend IDs
      const friendIds = myFriendships.map(f => 
        f.requester_id === currentUser.id ? f.addressee_id : f.requester_id
      );

      // Get friend user data from Supabase
      const friendUsers = friendIds.length > 0 ? await getUsersByIds(friendIds) : [];

      // Get existing invitations for this match
      const invitations = await base44.entities.MatchInvitation.filter({ match_id: match.id });
      setExistingInvitations(invitations);

      // Filter out friends who already have invitations
      const availableFriends = friendUsers.filter(friend => {
        const hasInvitation = invitations.some(inv => inv.invited_user_id === friend.id);
        return !hasInvitation;
      });

      setFriends(availableFriends);
    } catch (error) {
      console.error('Error loading friends:', error);
      alert('Kunde inte ladda vänner. Försök igen.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFriend = (friendId) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSendInvitations = async () => {
    if (selectedFriends.length === 0) {
      alert('Välj minst en vän att bjuda in!');
      return;
    }

    setIsSending(true);
    try {
      // Create invitations for each selected friend
      const invitationPromises = selectedFriends.map(friendId =>
        base44.entities.MatchInvitation.create({
          match_id: match.id,
          invited_user_id: friendId,
          inviter_id: currentUser.id,
          invited_at: new Date().toISOString()
        })
      );

      await Promise.all(invitationPromises);

      alert(`${selectedFriends.length} inbjudningar skickade!`);
      if (onInvitesSent) onInvitesSent();
      onClose();
    } catch (error) {
      console.error('Error sending invitations:', error);
      alert('Kunde inte skicka inbjudningar. Försök igen.');
    } finally {
      setIsSending(false);
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_20px_rgba(0,0,0,0.25)] rounded-[20px]">
          <CardHeader className="border-b border-[#223029] p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[20px] leading-[28px] font-semibold text-[#F4F7F5] flex items-center gap-3">
                <UserPlus className="w-6 h-6 text-[#2BA84A]" />
                Bjud in vänner
              </CardTitle>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#18221E] hover:bg-[#223029] transition-colors"
              >
                <X className="w-5 h-5 text-[#B6C2BC]" />
              </button>
            </div>
            <p className="text-sm text-[#B6C2BC] mt-2">
              {match.title} • {match.date} {match.time}
            </p>
          </CardHeader>

          <CardContent className="p-6">
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B6C2BC] w-5 h-5" />
              <Input
                placeholder="Sök efter vänner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-[#18221E] border border-[#223029] text-[#F4F7F5] placeholder:text-[#B6C2BC] focus:border-[#2BA84A] rounded-[14px]"
              />
            </div>

            {/* Selected Count */}
            {selectedFriends.length > 0 && (
              <div className="mb-4 p-3 bg-[#2BA84A]/10 rounded-xl border border-[#2BA84A]/30">
                <p className="text-sm text-[#2BA84A] font-medium flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {selectedFriends.length} vän{selectedFriends.length === 1 ? '' : 'ner'} vald{selectedFriends.length === 1 ? '' : 'a'}
                </p>
              </div>
            )}

            {/* Friends List */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="w-10 h-10 border-4 border-[#2BA84A] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-[#B6C2BC]">Laddar vänner...</p>
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-[#248232] mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-[#B6C2BC]">
                    {searchQuery ? 'Inga vänner hittades' : 'Du har inga vänner att bjuda in än'}
                  </p>
                </div>
              ) : (
                filteredFriends.map((friend) => {
                  const isSelected = selectedFriends.includes(friend.id);
                  const skillLevel = SKILL_LEVEL_CONFIG[friend.skill_level || 'intermediate'];
                  const SkillIcon = skillLevel.icon;

                  return (
                    <motion.div
                      key={friend.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <button
                        onClick={() => toggleFriend(friend.id)}
                        className={`w-full p-4 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-[#2BA84A]/10 border-[#2BA84A] ring-1 ring-[#2BA84A]/30'
                            : 'bg-[#18221E] border-[#223029] hover:border-[#2BA84A]/50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <div className="w-12 h-12 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-xl flex items-center justify-center flex-shrink-0">
                            {friend.avatar_url ? (
                              <img src={friend.avatar_url} alt={friend.full_name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <span className="text-white font-semibold text-lg">{friend.full_name?.[0] || 'U'}</span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 text-left min-w-0">
                            <h4 className="font-semibold text-[#F4F7F5] text-sm truncate">{friend.full_name}</h4>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <div className="flex items-center gap-1 text-xs text-[#B6C2BC]">
                                <MapPin className="w-3 h-3" />
                                {friend.city}
                              </div>
                              <Badge className={`h-5 px-2 bg-gradient-to-r ${skillLevel.color} ${skillLevel.textColor} text-[10px]`}>
                                <SkillIcon className="w-3 h-3 mr-1" />
                                {skillLevel.label}
                              </Badge>
                            </div>
                          </div>

                          {/* Checkbox */}
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-[#2BA84A] border-[#2BA84A]'
                              : 'border-[#223029]'
                          }`}>
                            {isSelected && <Check className="w-4 h-4 text-white" />}
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-[#223029]">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 h-12 border-[#223029] hover:bg-[#223029] text-[#F4F7F5] rounded-[14px]"
              >
                Avbryt
              </Button>
              <Button
                onClick={handleSendInvitations}
                disabled={selectedFriends.length === 0 || isSending}
                className="flex-1 h-12 bg-[#2BA84A] hover:bg-[#248232] text-white rounded-[14px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Skickar...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Skicka inbjudningar ({selectedFriends.length})
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}