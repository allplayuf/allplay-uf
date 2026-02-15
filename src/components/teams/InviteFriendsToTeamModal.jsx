import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Users, Link as LinkIcon, Check, Search, Mail, Loader2, UserPlus, AtSign } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getUsersByIds } from "../supabase/services/usersService";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function InviteFriendsToTeamModal({ team, currentUser, onClose }) {
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviting, setInviting] = useState({});
  const [activeTab, setActiveTab] = useState('friends');
  const [isLoading, setIsLoading] = useState(true);

  // Search by username/email
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [existingMemberIds, setExistingMemberIds] = useState(new Set());

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const [sentFriendships, receivedFriendships, teamMembers] = await Promise.all([
        base44.entities.Friendship.filter({ requester_id: currentUser.id, status: 'accepted' }),
        base44.entities.Friendship.filter({ addressee_id: currentUser.id, status: 'accepted' }),
        base44.entities.TeamMember.filter({ team_id: team.id })
      ]);

      const allFriendships = [...sentFriendships, ...receivedFriendships];
      const uniqueMap = new Map();
      allFriendships.forEach(f => uniqueMap.set(f.id, f));
      const friendships = Array.from(uniqueMap.values());

      const friendIds = friendships.map(f => 
        f.requester_id === currentUser.id ? f.addressee_id : f.requester_id
      );

      const memberIds = new Set(teamMembers.map(tm => tm.user_id));
      setExistingMemberIds(memberIds);

      if (friendIds.length > 0) {
        const friendUsers = await getUsersByIds(friendIds);
        setFriends(friendUsers.filter(f => !memberIds.has(f.id)));
      }
    } catch (error) {
      console.error("Error loading friends:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchUsers = async () => {
    const q = userSearchQuery.trim();
    if (q.length < 2) return;
    
    setIsSearching(true);
    try {
      // Search all users (limited by Base44 list) and filter locally
      const allUsers = await base44.entities.User.list('full_name', 200);
      const lowerQ = q.toLowerCase();
      const results = allUsers.filter(u => 
        u.id !== currentUser.id &&
        !existingMemberIds.has(u.id) &&
        (
          u.full_name?.toLowerCase().includes(lowerQ) ||
          u.email?.toLowerCase().includes(lowerQ)
        )
      ).slice(0, 10);
      
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearchQuery.trim().length >= 2) {
        handleSearchUsers();
      } else {
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  const handleInvite = async (userId) => {
    setInviting(prev => ({ ...prev, [userId]: true }));
    try {
      // Check for existing membership/invite
      const existing = await base44.entities.TeamMember.filter({ team_id: team.id, user_id: userId });
      if (existing.length > 0) {
        toast.info('Denna spelare har redan en inbjudan eller är redan med i laget');
        return;
      }

      await base44.entities.TeamMember.create({
        team_id: team.id,
        user_id: userId,
        role: 'member',
        status: 'pending'
      });

      toast.success('Inbjudan skickad!');
      setFriends(prev => prev.filter(f => f.id !== userId));
      setSearchResults(prev => prev.filter(u => u.id !== userId));
      setExistingMemberIds(prev => new Set([...prev, userId]));
    } catch (error) {
      console.error("Error inviting:", error);
      toast.error('Kunde inte skicka inbjudan');
    } finally {
      setInviting(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?page=TeamOverview&id=${team.id}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Länk kopierad!');
  };

  const filteredFriends = friends.filter(friend =>
    (friend.full_name || friend.display_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const UserRow = ({ user, isInviting }) => (
    <div className="flex items-center gap-3 p-3 bg-[#18221E] rounded-xl border border-[#223029] hover:border-[#2BA84A]/30 transition-colors">
      <div className="w-10 h-10 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
        {(user.profile_image_url || user.avatar_url) ? (
          <img src={user.profile_image_url || user.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-white font-semibold text-sm">{(user.display_name || user.full_name)?.[0] || 'U'}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-[#F4F7F5] text-sm truncate">{user.display_name || user.full_name}</h4>
        <p className="text-xs text-[#9EAAA4] truncate">{user.city || user.email || ''}</p>
      </div>
      <Button
        onClick={() => handleInvite(user.id)}
        disabled={isInviting}
        size="sm"
        className="bg-[#2BA84A] hover:bg-[#248232] text-white rounded-xl h-8 px-3 text-xs font-semibold"
      >
        {isInviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><UserPlus className="w-3.5 h-3.5 mr-1" /> Bjud in</>}
      </Button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
      />
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-lg sm:mx-4"
      >
        <Card className="bg-[#121715] border border-[#223029] shadow-[0_8px_24px_rgba(0,0,0,0.3)] rounded-t-[20px] sm:rounded-[20px] max-h-[85vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b border-[#223029] p-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-[#F4F7F5]">
                Bjud in till {team.name}
              </h2>
              <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#18221E] text-[#9EAAA4]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              {[
                { id: 'friends', label: 'Vänner', icon: Users },
                { id: 'search', label: 'Sök spelare', icon: AtSign },
                { id: 'link', label: 'Dela länk', icon: LinkIcon },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#2BA84A]/15 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30'
                      : 'bg-[#18221E] text-[#9EAAA4] hover:text-[#F4F7F5]'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'friends' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9EAAA4] w-4 h-4" />
                  <Input
                    placeholder="Filtrera vänner..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-[#18221E] border-[#223029] text-[#F4F7F5] rounded-xl h-10 text-sm"
                  />
                </div>

                {isLoading ? (
                  <div className="py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#2BA84A]" />
                  </div>
                ) : filteredFriends.length === 0 ? (
                  <div className="py-8 text-center">
                    <Users className="w-10 h-10 text-[#9EAAA4] mx-auto mb-2" />
                    <p className="text-sm text-[#9EAAA4]">
                      {friends.length === 0 ? 'Inga vänner att bjuda in' : 'Inga matchande vänner'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFriends.map(friend => (
                      <UserRow key={friend.id} user={friend} isInviting={inviting[friend.id]} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'search' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9EAAA4] w-4 h-4" />
                  <Input
                    placeholder="Sök på namn eller e-post..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-9 bg-[#18221E] border-[#223029] text-[#F4F7F5] rounded-xl h-10 text-sm"
                  />
                  {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#2BA84A]" />}
                </div>

                {userSearchQuery.trim().length < 2 ? (
                  <div className="py-8 text-center">
                    <AtSign className="w-10 h-10 text-[#9EAAA4] mx-auto mb-2" />
                    <p className="text-sm text-[#9EAAA4]">Skriv minst 2 tecken för att söka</p>
                  </div>
                ) : searchResults.length === 0 && !isSearching ? (
                  <div className="py-8 text-center">
                    <Users className="w-10 h-10 text-[#9EAAA4] mx-auto mb-2" />
                    <p className="text-sm text-[#9EAAA4]">Inga spelare hittades</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {searchResults.map(user => (
                      <UserRow key={user.id} user={user} isInviting={inviting[user.id]} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'link' && (
              <div className="space-y-4">
                <div className="bg-[#18221E] rounded-xl p-5 border border-[#223029] text-center">
                  <LinkIcon className="w-10 h-10 text-[#2BA84A] mx-auto mb-3" />
                  <h3 className="text-base font-bold text-[#F4F7F5] mb-1">Dela inbjudningslänk</h3>
                  <p className="text-xs text-[#9EAAA4] mb-4">
                    Dela länken med vem som helst – de kan ansöka om att gå med
                  </p>
                  <Button
                    onClick={handleCopyLink}
                    className="w-full bg-[#2BA84A] hover:bg-[#248232] text-white rounded-xl h-10 font-semibold"
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Kopiera länk
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}