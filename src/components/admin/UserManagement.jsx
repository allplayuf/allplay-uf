import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, MapPin, Trophy, TrendingUp, Filter } from "lucide-react";
import AdminSectionHeader from "./AdminSectionHeader";

const PAGE_SIZE = 30;

export default function UserManagement({ users = [], isLoading, lastUpdated, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let list = [...users];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(u =>
        u.full_name?.toLowerCase().includes(q) ||
        u.display_name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.city?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'newest') return (b.id || '').localeCompare(a.id || '');
      if (sortBy === 'name') return (a.full_name || '').localeCompare(b.full_name || '');
      if (sortBy === 'city') return (a.city || '').localeCompare(b.city || '');
      if (sortBy === 'elo') return (b.elo_rating || 0) - (a.elo_rating || 0);
      return 0;
    });

    return list;
  }, [users, searchTerm, sortBy]);

  const paginated = filtered.slice(0, (page + 1) * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  return (
    <div className="space-y-4">
      <AdminSectionHeader
        title="Användare"
        icon={Users}
        iconColor="#2BA84A"
        totalCount={users.length}
        filteredCount={filtered.length}
        searchTerm={searchTerm}
        onSearchChange={(v) => { setSearchTerm(v); setPage(0); }}
        searchPlaceholder="Sök namn, användarnamn, stad..."
        isLoading={isLoading}
        lastUpdated={lastUpdated}
        onRefresh={onRefresh}
      >
        <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(0); }}>
          <SelectTrigger className="w-36 h-10 bg-[#18221E] border-[#223029] text-[#F4F7F5] rounded-xl text-sm">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#121715] border-[#223029]">
            <SelectItem value="newest" className="text-[#F4F7F5]">Nyast</SelectItem>
            <SelectItem value="name" className="text-[#F4F7F5]">Namn</SelectItem>
            <SelectItem value="city" className="text-[#F4F7F5]">Stad</SelectItem>
            <SelectItem value="elo" className="text-[#F4F7F5]">ELO</SelectItem>
          </SelectContent>
        </Select>
      </AdminSectionHeader>

      {isLoading ? (
        <Card className="bg-[#121715] border border-[#223029] rounded-[16px]">
          <CardContent className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-[#2BA84A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-[#B6C2BC]">Laddar användare från Supabase...</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="bg-[#121715] border border-[#223029] rounded-[16px]">
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-[#2BA84A]/40 mx-auto mb-3" />
            <h3 className="font-semibold text-[#F4F7F5] mb-1">Inga användare hittade</h3>
            <p className="text-sm text-[#B6C2BC]">
              {searchTerm ? 'Prova att ändra din sökning.' : 'Inga användare finns i Supabase ännu.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-[#121715] border border-[#223029] rounded-[16px]">
          <CardContent className="p-0 divide-y divide-[#223029]">
            {paginated.map(user => (
              <div key={user.id} className="p-4 hover:bg-[#18221E] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {user.avatar_url || user.profile_image_url ? (
                      <img src={user.avatar_url || user.profile_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-semibold text-sm">{(user.display_name || user.full_name || '?')[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#F4F7F5] text-sm truncate">{user.display_name || user.full_name}</span>
                      {user.username && <span className="text-xs text-[#7B8A83]">@{user.username}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#7B8A83] mt-0.5">
                      {user.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{user.city}</span>}
                      <span className="flex items-center gap-1"><Trophy className="w-3 h-3" />{user.matches_played || 0} matcher</span>
                      {user.elo_rating && <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{user.elo_rating} ELO</span>}
                    </div>
                  </div>
                  {user.skill_level && (
                    <Badge className="text-[10px] bg-[#2BA84A]/15 text-[#9FC9AC] ring-1 ring-[#2BA84A]/20">
                      {user.skill_level}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {hasMore && (
        <div className="text-center">
          <button
            onClick={() => setPage(p => p + 1)}
            className="text-sm text-[#2BA84A] hover:text-[#248232] font-semibold px-6 py-2"
          >
            Visa fler ({filtered.length - paginated.length} kvar)
          </button>
        </div>
      )}
    </div>
  );
}