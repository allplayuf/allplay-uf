import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Trash2, MapPin, Users, Trophy, Filter } from "lucide-react";
import AdminSectionHeader from "./AdminSectionHeader";

const PAGE_SIZE = 30;

export default function TeamManagement({ teams = [], isLoading, lastUpdated, onDelete, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);
  const [deletingId, setDeletingId] = useState(null);

  const filtered = useMemo(() => {
    let list = teams.filter(t => t.is_active !== false);

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(t =>
        (t.name || '').toLowerCase().includes(q) ||
        (t.city || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'newest') return (b.created_at || b.created_date || '').localeCompare(a.created_at || a.created_date || '');
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'elo') return (b.elo_rating || 1000) - (a.elo_rating || 1000);
      if (sortBy === 'members') return (b.current_members || 0) - (a.current_members || 0);
      return 0;
    });

    return list;
  }, [teams, searchTerm, sortBy]);

  const activeCount = teams.filter(t => t.is_active !== false).length;
  const paginated = filtered.slice(0, (page + 1) * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  return (
    <div className="space-y-4">
      <AdminSectionHeader
        title="Lag"
        icon={Shield}
        iconColor="#4169E1"
        totalCount={activeCount}
        filteredCount={filtered.length}
        searchTerm={searchTerm}
        onSearchChange={(v) => { setSearchTerm(v); setPage(0); }}
        searchPlaceholder="Sök lag eller stad..."
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
            <SelectItem value="elo" className="text-[#F4F7F5]">ELO</SelectItem>
            <SelectItem value="members" className="text-[#F4F7F5]">Medlemmar</SelectItem>
          </SelectContent>
        </Select>
      </AdminSectionHeader>

      {isLoading ? (
        <Card className="bg-[#121715] border border-[#223029] rounded-[16px]">
          <CardContent className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-[#4169E1] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-[#B6C2BC]">Laddar lag från Supabase...</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="bg-[#121715] border border-[#223029] rounded-[16px]">
          <CardContent className="p-12 text-center">
            <Shield className="w-12 h-12 text-[#4169E1]/40 mx-auto mb-3" />
            <h3 className="font-semibold text-[#F4F7F5] mb-1">Inga lag hittade</h3>
            <p className="text-sm text-[#B6C2BC]">
              {searchTerm ? 'Prova att ändra din sökning.' : 'Inga lag finns i Supabase.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {paginated.map(team => (
            <Card key={team.id} className="bg-[#121715] border border-[#223029] hover:border-[#4169E1]/20 rounded-[14px] transition-colors">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                      style={{ backgroundColor: team.teamColor || '#4169E1' }}
                    >
                      {team.logo_url ? (
                        <img src={team.logo_url} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; e.target.nextSibling && (e.target.nextSibling.style.display='block'); }} />
                      ) : null}
                      <Shield className="w-5 h-5 text-white" style={{ display: team.logo_url ? 'none' : 'block' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-[#F4F7F5] text-sm truncate block">{team.name}</span>
                      <div className="flex items-center gap-3 text-xs text-[#7B8A83] mt-0.5">
                        {team.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{team.city}</span>}
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{team.current_members || 0}</span>
                        <span className="flex items-center gap-1"><Trophy className="w-3 h-3" />{team.elo_rating || 1000} ELO</span>
                        <span>{team.wins || 0}V-{team.draws || 0}O-{team.losses || 0}F</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={deletingId === team.id}
                    onClick={async () => {
                      setDeletingId(team.id);
                      await onDelete(team.id, team.name);
                      setDeletingId(null);
                    }}
                    className="h-8 px-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs rounded-lg flex-shrink-0"
                  >
                    {deletingId === team.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="text-center">
          <button onClick={() => setPage(p => p + 1)} className="text-sm text-[#4169E1] hover:text-[#3158C8] font-semibold px-6 py-2">
            Visa fler ({filtered.length - paginated.length} kvar)
          </button>
        </div>
      )}
    </div>
  );
}