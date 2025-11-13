import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Users, Link as LinkIcon, Check, Search } from "lucide-react";
import { User } from "@/entities/User";
import { Friendship } from "@/entities/Friendship";
import { TeamMember } from "@/entities/Team";
import { motion, AnimatePresence } from "framer-motion";

export default function InviteFriendsToTeamModal({ team, currentUser, onClose }) {
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviting, setInviting] = useState({});
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' or 'link'

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const allFriendships = await Friendship.filter({ status: 'accepted' });
      const myFriendships = allFriendships.filter(
        f => f.requester_id === currentUser.id || f.addressee_id === currentUser.id
      );

      const friendIds = myFriendships.map(f => 
        f.requester_id === currentUser.id ? f.addressee_id : f.requester_id
      );

      const allUsers = await User.list();
      const friendUsers = allUsers.filter(u => friendIds.includes(u.id));

      // Filter out users already in team or with pending invites
      const teamMembers = await TeamMember.filter({ team_id: team.id });
      const memberIds = teamMembers.map(tm => tm.user_id);
      
      const availableFriends = friendUsers.filter(f => !memberIds.includes(f.id));
      setFriends(availableFriends);

    } catch (error) {
      console.error("Error loading friends:", error);
    }
  };

  const handleInviteFriend = async (friendId) => {
    setInviting({ ...inviting, [friendId]: true });
    try {
      await TeamMember.create({
        team_id: team.id,
        user_id: friendId,
        role: 'member',
        status: 'pending'
      });

      setFriends(friends.filter(f => f.id !== friendId));
      alert('Inbjudan skickad!');

    } catch (error) {
      console.error("Error inviting friend:", error);
      alert('Kunde inte skicka inbjudan. Försök igen.');
    } finally {
      setInviting({ ...inviting, [friendId]: false });
    }
  };

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?page=Community&teamId=${team.id}`;
    navigator.clipboard.writeText(inviteUrl);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  };

  const filteredFriends = friends.filter(friend =>
    friend.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl"
        >
          <Card className="bg-[#121715] border border-[#223029] shadow-[0_8px_24px_rgba(0,0,0,0.3)] rounded-2xl">
            <CardHeader className="border-b border-[#223029] pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-[#F4F7F5]">
                  Bjud in till {team.name}
                </CardTitle>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[#18221E] transition-colors"
                >
                  <X className="w-5 h-5 text-[#B6C2BC]" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setActiveTab('friends')}
                  className={`flex-1 h-11 rounded-xl font-medium transition-all ${
                    activeTab === 'friends'
                      ? 'bg-[#2BA84A]/20 text-[#EAF6EE] border-2 border-[#2BA84A]'
                      : 'bg-[#18221E] text-[#B6C2BC] border-2 border-[#223029] hover:border-[#2BA84A]/50'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  Bjud in vänner
                </button>
                <button
                  onClick={() => setActiveTab('link')}
                  className={`flex-1 h-11 rounded-xl font-medium transition-all ${
                    activeTab === 'link'
                      ? 'bg-[#2BA84A]/20 text-[#EAF6EE] border-2 border-[#2BA84A]'
                      : 'bg-[#18221E] text-[#B6C2BC] border-2 border-[#223029] hover:border-[#2BA84A]/50'
                  }`}
                >
                  <LinkIcon className="w-4 h-4 inline mr-2" />
                  Dela länk
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {activeTab === 'friends' ? (
                <>
                  {/* Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7B8A83] w-5 h-5" />
                    <Input
                      placeholder="Sök vänner..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-[#18221E] border border-[#223029] text-[#F4F7F5] rounded-xl h-12"
                    />
                  </div>

                  {/* Friends List */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredFriends.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="w-12 h-12 text-[#7B8A83] mx-auto mb-3" />
                        <p className="text-[#B6C2BC]">
                          {friends.length === 0 
                            ? 'Inga vänner att bjuda in'
                            : 'Inga vänner hittades'}
                        </p>
                      </div>
                    ) : (
                      filteredFriends.map((friend) => (
                        <Card key={friend.id} className="bg-[#18221E] border border-[#223029] rounded-xl hover:border-[#2BA84A]/50 transition-all">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-xl flex items-center justify-center flex-shrink-0">
                                {friend.profile_image_url ? (
                                  <img src={friend.profile_image_url} alt={friend.full_name} className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                  <span className="text-white font-semibold">{friend.full_name?.[0]}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-[#F4F7F5] truncate">{friend.full_name}</h4>
                                <p className="text-sm text-[#B6C2BC] truncate">{friend.city}</p>
                              </div>
                              <Button
                                onClick={() => handleInviteFriend(friend.id)}
                                disabled={inviting[friend.id]}
                                className="bg-[#2BA84A] hover:bg-[#248232] text-white rounded-xl h-10 px-4"
                              >
                                {inviting[friend.id] ? 'Skickar...' : 'Bjud in'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-[#18221E] rounded-xl p-6 border border-[#223029] text-center">
                    <LinkIcon className="w-12 h-12 text-[#2BA84A] mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-[#F4F7F5] mb-2">
                      Dela inbjudningslänk
                    </h3>
                    <p className="text-sm text-[#B6C2BC] mb-4">
                      Dela denna länk med vem som helst för att bjuda in dem till laget
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={`${window.location.origin}${window.location.pathname}?page=Community&teamId=${team.id}`}
                        readOnly
                        className="bg-[#0F1513] border border-[#223029] text-[#F4F7F5] rounded-xl flex-1"
                      />
                      <Button
                        onClick={handleCopyLink}
                        className="bg-[#2BA84A] hover:bg-[#248232] text-white rounded-xl px-6"
                      >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Kopiera
                      </Button>
                    </div>
                  </div>

                  <div className="bg-[#F4743B]/10 rounded-xl p-4 border border-[#F4743B]/30">
                    <p className="text-sm text-[#FDE3D2]">
                      <strong>OBS:</strong> Alla som har länken kan ansöka om att gå med i laget. Du måste godkänna varje ansökan.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Copy Toast */}
      <AnimatePresence>
        {showCopyToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-[60]"
          >
            <div className="bg-[#121715] border border-[#223029] shadow-[0_8px_24px_rgba(0,0,0,0.3)] rounded-2xl px-4 py-3 flex items-center gap-2">
              <div className="w-8 h-8 bg-[#2BA84A]/10 rounded-lg flex items-center justify-center">
                <Check className="w-4 h-4 text-[#2BA84A]" />
              </div>
              <span className="text-sm font-medium text-[#F4F7F5]">Länk kopierad!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}