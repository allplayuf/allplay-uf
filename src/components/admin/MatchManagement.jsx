import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, MapPin, Calendar, Users, Trash2, Filter, Zap, Shield } from "lucide-react";
import AdminSectionHeader from "./AdminSectionHeader";

const PAGE_SIZE = 30;

const STATUS_MAP = {
  upcoming: { label: 'Kommande', color: 'bg-[#2BA84A]/20 text-[#CFE8D6]' },
  ongoing: { label: 'Pågår', color: 'bg-[#F59E0B]/20 text-[#FEF3C7]' },
  completed: { label: 'Avslutad', color: 'bg-[#6B7280]/20 text-[#E5E7EB]' },
  finished: { label: 'Avslutad', color: 'bg-[#6B7280]/20 text-[#E5E7EB]' },
  cancelled: { label: 'Inställd', color: 'bg-[#DC2626]/20 text-[#FEE2E2]' },
};

export default function MatchManagement({ matches = [], venues = [], isLoading, lastUpdated, onDelete, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);

  const venueMap = useMemo(() => {
    const m = {};
    venues.forEach(v => { m[v.id] = v.name || 'Okänd'; });
    return m;
  }, [venues]);

  const filtered = useMemo(() => {
    let list = [...matches];

    if (statusFilter !== 'all') {
      list = list.filter(m => m.status === statusFilter);
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(m =>
        (m.title || m.name || '').toLowerCase().includes(q) ||
        (venueMap[m.venue_id || m.pitch_id] || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'newest') {
        const da = a.starts_at || a.date || a.created_at || '';
        const db = b.starts_at || b.date || b.created_at || '';
        return db.localeCompare(da);
      }
      if (sortBy === 'title') return (a.title || a.name || '').localeCompare(b.title || b.name || '');
      return 0;
    });

    return list;
  }, [matches, searchTerm, statusFilter, sortBy, venueMap]);

  const paginated = filtered.slice(0, (page + 1) * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  return (
    <div className="space-y-4">
      <AdminSectionHeader
        title="Matcher"
        icon={Trophy}
        iconColor="#F4743B"
        totalCount={matches.length}
        filteredCount={filtered.length}
        searchTerm={searchTerm}
        onSearchChange={(v) => { setSearchTerm(v); setPage(0); }}
        searchPlaceholder="Sök match eller plan..."
        isLoading={isLoading}
        lastUpdated={lastUpdated}
        onRefresh={onRefresh}
      >
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-36 h-10 bg-[#18221E] border-[#223029] text-[#F4F7F5] rounded-xl text-sm">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#121715] border-[#223029]">
            <SelectItem value="all" className="text-[#F4F7F5]">Alla status</SelectItem>
            <SelectItem value="upcoming" className="text-[#F4F7F5]">Kommande</SelectItem>
            <SelectItem value="ongoing" className="text-[#F4F7F5]">Pågående</SelectItem>
            <SelectItem value="completed" className="text-[#F4F7F5]">Avslutade</SelectItem>
            <SelectItem value="cancelled" className="text-[#F4F7F5]">Inställda</SelectItem>
          </SelectContent>
        </Select>
      </AdminSectionHeader>

      {isLoading ? (
        <Card className="bg-[#121715] border border-[#223029] rounded-[16px]">
          <CardContent className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-[#F4743B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-[#B6C2BC]">Laddar matcher från Supabase...</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="bg-[#121715] border border-[#223029] rounded-[16px]">
          <CardContent className="p-12 text-center">
            <Trophy className="w-12 h-12 text-[#F4743B]/40 mx-auto mb-3" />
            <h3 className="font-semibold text-[#F4F7F5] mb-1">Inga matcher hittade</h3>
            <p className="text-sm text-[#B6C2BC]">
              {searchTerm || statusFilter !== 'all' ? 'Ändra filter.' : 'Inga matcher finns i Supabase.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {paginated.map(match => {
            const title = match.title || match.name || 'Match';
            const status = STATUS_MAP[match.status] || STATUS_MAP.upcoming;
            const venueName = venueMap[match.venue_id || match.pitch_id] || 'Okänd plan';
            const date = match.date || (match.starts_at ? match.starts_at.split('T')[0] : '');
            const time = match.time || (match.starts_at ? match.starts_at.split('T')[1]?.substring(0, 5) : '');
            const players = match.current_players || match.player_count || 0;
            const maxPlayers = match.max_players || match.capacity || '∞';

            return (
              <Card key={match.id} className="bg-[#121715] border border-[#223029] hover:border-[#223029]/80 rounded-[14px] transition-colors">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-[#F4F7F5] text-sm truncate">{title}</span>
                        <Badge className={`text-[10px] ${status.color}`}>{status.label}</Badge>
                        <Badge className="text-[10px] bg-[#18221E] text-[#B6C2BC]">{match.format}</Badge>
                        {match.is_spontaneous && <Badge className="text-[10px] bg-[#F4743B]/15 text-[#F4743B]"><Zap className="w-2.5 h-2.5 mr-0.5" />Spontan</Badge>}
                        {match.is_team_match && <Badge className="text-[10px] bg-[#9370DB]/15 text-[#9370DB]"><Shield className="w-2.5 h-2.5 mr-0.5" />Lag</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#7B8A83]">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{venueName}</span>
                        {date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{date} {time}</span>}
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{players}/{maxPlayers}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(match.id, title)}
                      className="h-8 px-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs rounded-lg flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {hasMore && (
        <div className="text-center">
          <button onClick={() => setPage(p => p + 1)} className="text-sm text-[#F4743B] hover:text-[#E5683A] font-semibold px-6 py-2">
            Visa fler ({filtered.length - paginated.length} kvar)
          </button>
        </div>
      )}
    </div>
  );
}