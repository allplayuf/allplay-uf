import React, { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, AlertCircle } from "lucide-react";
import { debounce } from "lodash";
import { searchPlayers } from "@/components/supabase/services/playersService";
import { base44 } from "@/api/base44Client";
import { applyPrivacy } from "@/components/utils/privacyMask";
import PlayerCard from "./PlayerCard";

export default function FindPlayers({ friendships = [], currentUser, onAddFriend }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [displayLimit, setDisplayLimit] = useState(12);

  const debouncedSetQuery = useCallback(
    debounce((q) => setDebouncedQuery(q), 300),
    []
  );

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    debouncedSetQuery(e.target.value);
    setDisplayLimit(12);
  };

  // Fetch players from Supabase REST
  const { data, isLoading, error } = useQuery({
    queryKey: ['supabase-searchPlayers', debouncedQuery],
    queryFn: () => searchPlayers({ search: debouncedQuery, limit: 200 }),
    enabled: !!currentUser,
    staleTime: 30 * 1000,
    retry: (count, err) => err?.status !== 401 && count < 2,
  });

  // Also fetch Base44 users to include legacy/migrated users
  const { data: base44Users } = useQuery({
    queryKey: ['base44-users'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
    enabled: !!currentUser,
    staleTime: 60 * 1000,
  });

  const safeFriendships = Array.isArray(friendships) ? friendships : [];

  // Merge Supabase + Base44 users, deduplicate by id, apply privacy & exclude self
  const players = useMemo(() => {
    const supabasePlayers = data?.players || [];
    const b44Players = (base44Users || []).map(u => ({
      id: u.id,
      full_name: u.full_name || u.display_name || u.email?.split('@')[0] || 'Ny spelare',
      display_name: u.display_name || u.full_name || u.email?.split('@')[0] || 'Ny spelare',
      username: u.username || null,
      avatar_url: u.avatar_url || u.profile_image_url || null,
      profile_image_url: u.profile_image_url || u.avatar_url || null,
      bio: u.bio || null,
      city: u.city || null,
      skill_level: u.skill_level || null,
      elo_rating: u.elo_rating || null,
      matches_played: u.matches_played || 0,
      mvp_count: u.mvp_count || 0,
      is_public: true,
    }));

    // Merge: Supabase first, then Base44 users not already in Supabase set
    const seen = new Set(supabasePlayers.map(p => p.id));
    const merged = [...supabasePlayers];
    for (const p of b44Players) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        merged.push(p);
      }
    }

    // Filter by search query for Base44 users (Supabase already filtered server-side)
    const q = debouncedQuery?.trim()?.toLowerCase();
    return merged
      .filter(p => p.id !== currentUser?.id)
      .filter(p => {
        if (!q) return true;
        // Supabase players already matched, only filter b44 additions
        if (supabasePlayers.some(sp => sp.id === p.id)) return true;
        return (p.full_name || '').toLowerCase().includes(q) ||
               (p.username || '').toLowerCase().includes(q) ||
               (p.city || '').toLowerCase().includes(q);
      })
      .map(p => applyPrivacy(p, currentUser?.id))
      .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
  }, [data, base44Users, currentUser?.id, debouncedQuery]);

  const totalCount = players.length;
  const displayedPlayers = players.slice(0, displayLimit);
  const hasMore = players.length > displayLimit;

  const getFriendshipStatus = (userId) => {
    if (!currentUser) return 'none';
    const f = safeFriendships.find(fr =>
      (fr.requester_id === currentUser.id && fr.addressee_id === userId) ||
      (fr.requester_id === userId && fr.addressee_id === currentUser.id)
    );
    if (!f) return 'none';
    if (f.status === 'accepted') return 'accepted';
    if (f.status === 'pending') {
      return f.requester_id === currentUser.id ? 'pending_outgoing' : 'pending_incoming';
    }
    return 'none';
  };

  // Error states
  if (error?.status === 401) {
    return (
      <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
        <CardContent className="p-12 text-center">
          <AlertCircle className="w-10 h-10 text-[#F4743B] mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[#F4F7F5] mb-2">Du måste vara inloggad</h3>
          <p className="text-sm text-[#B6C2BC]">Logga in för att söka efter spelare.</p>
        </CardContent>
      </Card>
    );
  }

  if (error && error.status !== 401) {
    return (
      <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
        <CardContent className="p-12 text-center">
          <AlertCircle className="w-10 h-10 text-[#F4743B] mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[#F4F7F5] mb-2">Något gick fel</h3>
          <p className="text-sm text-[#B6C2BC]">{error.message || 'Kunde inte hämta spelare. Försök igen.'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7B8A83]" />
        <Input
          placeholder="Sök spelare (namn, användarnamn)..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-10 bg-[#18221E] border border-[#223029] text-[#F4F7F5] focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A]/30 placeholder:text-[#7B8A83] rounded-[14px] h-12"
        />
      </div>

      {/* Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#B6C2BC]">
          {isLoading ? 'Söker...' : `${totalCount} spelare hittade`}
        </p>
        {displayedPlayers.length < totalCount && (
          <p className="text-sm text-[#7B8A83]">Visar {displayedPlayers.length} av {totalCount}</p>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-[#2BA84A] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Grid */}
      {!isLoading && displayedPlayers.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedPlayers.map((player, i) => (
            <PlayerCard
              key={player.id}
              player={player}
              friendshipStatus={getFriendshipStatus(player.id)}
              onAddFriend={onAddFriend}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && displayedPlayers.length === 0 && (
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-[#2BA84A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-[#2BA84A]/30">
              <Search className="w-8 h-8 text-[#9FC9AC]" />
            </div>
            <h3 className="text-lg font-semibold text-[#F4F7F5] mb-2">Inga spelare hittades</h3>
            <p className="text-sm text-[#B6C2BC]">Prova att söka efter något annat.</p>
          </CardContent>
        </Card>
      )}

      {/* Show more */}
      {hasMore && !isLoading && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setDisplayLimit(prev => prev + 12)}
            className="px-8 py-3 bg-[#18221E] hover:bg-[#223029] text-[#F4F7F5] font-medium rounded-xl border border-[#223029] transition-colors flex items-center gap-2"
          >
            Visa fler spelare ({players.length - displayLimit} kvar)
          </button>
        </div>
      )}
    </div>
  );
}