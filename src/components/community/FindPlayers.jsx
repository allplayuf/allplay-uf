import React, { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "lodash";
import { motion } from "framer-motion";
import { Search, AlertCircle, Users, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { searchPlayers } from "@/components/supabase/services/playersService";
import { applyPrivacy } from "@/components/utils/privacyMask";
import PlayerCard from "./PlayerCard";

/**
 * FindPlayers v3
 *
 *   • Uniform card heights (grid-rows, items stretch, PlayerCard is h-full)
 *   • Clean search with clear-button + live count
 *   • "Visa fler" button (no count)
 *   • No skill filter — data doesn't contain skill_level yet
 */

export default function FindPlayers({ friendships = [], currentUser, onAddFriend }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [displayLimit, setDisplayLimit] = useState(12);

  const debouncedSetQuery = useCallback(
    debounce((q) => setDebouncedQuery(q), 300),
    []
  );

  const handleSearchChange = (e) => {
    const v = e.target.value;
    setSearchQuery(v);
    debouncedSetQuery(v);
    setDisplayLimit(12);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setDisplayLimit(12);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['supabase-searchPlayers', debouncedQuery],
    queryFn: () => searchPlayers({ search: debouncedQuery, limit: 200 }),
    enabled: !!currentUser,
    staleTime: 30 * 1000,
    retry: (count, err) => err?.status !== 401 && count < 2,
  });

  const safeFriendships = Array.isArray(friendships) ? friendships : [];

  const players = useMemo(() => {
    const raw = data?.players || [];
    return raw
      .filter(p => p.id !== currentUser?.id)
      .map(p => applyPrivacy(p, currentUser?.id))
      .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
  }, [data, currentUser?.id]);

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

  if (error?.status === 401) {
    return <ErrorState title="Du måste vara inloggad" desc="Logga in för att söka efter spelare." />;
  }
  if (error && error.status !== 401) {
    return <ErrorState title="Något gick fel" desc={error.message || 'Kunde inte hämta spelare. Försök igen.'} />;
  }

  return (
    <div className="space-y-4">
      {/* ── Search bar ─────────────────────────────── */}
      <div className="relative">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#7B8A83] pointer-events-none"
          strokeWidth={2.4}
        />
        <Input
          placeholder="Sök på namn eller @användarnamn"
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-11 pr-20 bg-[#121715] border border-[#243029] text-[#F4F7F5] focus:border-[#2BA84A]/45 focus:ring-2 focus:ring-[#2BA84A]/20 placeholder:text-[#6B7A73] rounded-[14px] h-12 text-[14px]"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {!isLoading && debouncedQuery && (
            <span className="hidden sm:inline-flex h-7 items-center px-2 rounded-md bg-[#18221E] ring-1 ring-[#243029] text-[11px] font-bold tabular-nums text-[#9EAAA4]">
              {totalCount}
            </span>
          )}
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="w-7 h-7 rounded-md bg-[#18221E] hover:bg-[#223029] ring-1 ring-[#243029] flex items-center justify-center text-[#9EAAA4] hover:text-white transition-colors"
              aria-label="Rensa"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.6} />
            </button>
          )}
        </div>
      </div>

      {/* ── Result state ───────────────────────────── */}
      {isLoading ? (
        <SkeletonGrid />
      ) : displayedPlayers.length > 0 ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-fr"
          >
            {displayedPlayers.map((player, i) => (
              <PlayerCard
                key={player.id}
                player={player}
                friendshipStatus={getFriendshipStatus(player.id)}
                onAddFriend={onAddFriend}
                index={i}
              />
            ))}
          </motion.div>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setDisplayLimit((p) => p + 12)}
                className="h-11 px-6 bg-[#121715] hover:bg-[#18221E] text-[#F4F7F5] font-bold text-[13px] rounded-xl border border-[#243029] transition-colors"
              >
                Visa fler
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState query={debouncedQuery} />
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-fr">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[192px] rounded-[18px] border border-[#243029] bg-[#121715] overflow-hidden relative"
        >
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage: 'linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.04) 50%, transparent 80%)',
              backgroundSize: '200% 100%',
              animation: 'skeleton-sweep 1.6s ease-in-out infinite',
            }}
          />
        </div>
      ))}
      <style>{`
        @keyframes skeleton-sweep {
          0% { background-position: 200% 0; }
          100% { background-position: -100% 0; }
        }
      `}</style>
    </div>
  );
}

function EmptyState({ query }) {
  return (
    <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
      <CardContent className="p-10 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#2BA84A]/12 ring-1 ring-[#2BA84A]/25 flex items-center justify-center">
          <Users className="w-7 h-7 text-[#86EFAC]" strokeWidth={2.3} />
        </div>
        <h3 className="text-[16px] font-bold text-[#F4F7F5] mb-1.5">
          {query ? 'Inga spelare hittades' : 'Inga spelare ännu'}
        </h3>
        <p className="text-[13px] text-[#9EAAA4] leading-relaxed max-w-[32ch] mx-auto">
          {query ? 'Prova att söka efter något annat.' : 'Bjud in dina vänner så hittar du dem här.'}
        </p>
      </CardContent>
    </Card>
  );
}

function ErrorState({ title, desc }) {
  return (
    <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
      <CardContent className="p-10 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#F4743B]/14 ring-1 ring-[#F4743B]/30 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-[#FDBA74]" strokeWidth={2.3} />
        </div>
        <h3 className="text-[16px] font-bold text-[#F4F7F5] mb-1.5">{title}</h3>
        <p className="text-[13px] text-[#9EAAA4]">{desc}</p>
      </CardContent>
    </Card>
  );
}