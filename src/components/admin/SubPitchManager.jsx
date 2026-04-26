import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Trash2, LayoutGrid, Loader2, Link as LinkIcon } from "lucide-react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSubPitches, setParentVenue } from "@/components/supabase/services/subPitchesService";
import { createVenue, deleteVenue } from "@/components/supabase/services/venuesService";

const FORMATS = ['5v5', '7v7', '11v11'];

export default function SubPitchManager({ parentVenue, allVenues = [], onClose, onChanged }) {
  const qc = useQueryClient();
  const [newName, setNewName] = useState('');
  const [newFormats, setNewFormats] = useState(['5v5']);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [linkingId, setLinkingId] = useState(null);
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');

  const { data: subPitches = [], isLoading, refetch } = useQuery({
    queryKey: ['sub-pitches', parentVenue.id],
    queryFn: () => getSubPitches(parentVenue.id),
    staleTime: 0,
  });

  // Venues that aren't already a sub of this parent and aren't this parent itself
  const linkable = useMemo(() => {
    const subIds = new Set(subPitches.map(s => s.id));
    return allVenues.filter(v =>
      v.id !== parentVenue.id &&
      !v.parent_venue_id &&  // only standalone venues can be re-parented
      !subIds.has(v.id) &&
      (linkSearch === '' || (v.name || '').toLowerCase().includes(linkSearch.toLowerCase()))
    ).slice(0, 30);
  }, [allVenues, subPitches, parentVenue.id, linkSearch]);

  const refresh = () => {
    refetch();
    qc.invalidateQueries({ queryKey: ['sub-pitches'] });
    qc.invalidateQueries({ queryKey: ['admin-venues'] });
    onChanged?.();
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      // Create with parent_venue_id directly — atomic insert.
      // If parent_venue_id column is missing, createVenue will retry without it
      // and we then patch with setParentVenue as a fallback.
      const created = await createVenue({
        name: newName.trim(),
        address: parentVenue.address || '',
        city: parentVenue.city || '',
        latitude: parentVenue.latitude,
        longitude: parentVenue.longitude,
        formats_supported: newFormats,
        facilities: parentVenue.facilities || ['artificial_grass'],
        is_allplay: parentVenue.is_allplay || false,
        is_verified: true,
        parent_venue_id: parentVenue.id,
      });

      // Verify the parent link was actually persisted.
      // If the DB column was stripped due to missing column, we'd see no link.
      if (created?.id && !created?.parent_venue_id) {
        try {
          await setParentVenue(created.id, parentVenue.id);
        } catch (linkErr) {
          // Most likely cause: parent_venue_id column doesn't exist in DB.
          window.alert(
            'Underplanen skapades men kunde inte länkas till huvudplanen.\n\n' +
            'Kör denna SQL i Supabase SQL Editor:\n\n' +
            'ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS parent_venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE;\n' +
            'CREATE INDEX IF NOT EXISTS idx_venues_parent ON public.venues(parent_venue_id);\n' +
            'NOTIFY pgrst, \'reload schema\';'
          );
        }
      }

      setNewName('');
      setNewFormats(['5v5']);
      refresh();
    } catch (e) {
      window.alert('Kunde inte skapa underplan: ' + (e.message || 'okänt fel'));
    } finally {
      setAdding(false);
    }
  };

  const handleUnlink = async (subId) => {
    if (!confirm('Lossa denna underplan från huvudplanen? Den blir då en fristående plan i listan.')) return;
    setDeletingId(subId);
    try {
      await setParentVenue(subId, null);
      refresh();
    } catch (e) {
      window.alert('Kunde inte lossa: ' + (e.message || 'okänt fel'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDelete = async (subId) => {
    if (!confirm('Radera underplanen permanent?')) return;
    setDeletingId(subId);
    try {
      await deleteVenue(subId);
      refresh();
    } catch (e) {
      window.alert('Kunde inte radera: ' + (e.message || 'okänt fel'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleLink = async (venue) => {
    setLinkingId(venue.id);
    try {
      await setParentVenue(venue.id, parentVenue.id);
      setShowLinkPicker(false);
      setLinkSearch('');
      refresh();
    } catch (e) {
      window.alert('Kunde inte länka: ' + (e.message || 'okänt fel'));
    } finally {
      setLinkingId(null);
    }
  };

  const toggleFormat = (f) => {
    setNewFormats(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-3 sm:p-4">
      <Card className="bg-[#121715] border-2 border-[#9370DB]/40 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#223029]">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-[#9370DB]/15 ring-1 ring-[#9370DB]/30 flex items-center justify-center flex-shrink-0">
              <LayoutGrid className="w-5 h-5 text-[#C4B5FD]" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-bold text-[#F4F7F5] truncate">Underplaner</h3>
              <p className="text-xs text-[#9EAAA4] truncate">{parentVenue.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#18221E] hover:bg-[#223029] flex items-center justify-center text-[#B6C2BC] flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Existing sub-pitches */}
          <section>
            <h4 className="text-xs font-bold text-[#9EAAA4] uppercase tracking-wider mb-2">
              Aktuella underplaner ({subPitches.length})
            </h4>
            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-[#9EAAA4] gap-2 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Laddar...
              </div>
            ) : subPitches.length === 0 ? (
              <div className="text-sm text-[#9EAAA4] py-4 px-3 bg-[#18221E] border border-[#223029] rounded-xl">
                Inga underplaner ännu. Lägg till nedan eller länka en befintlig.
              </div>
            ) : (
              <div className="space-y-2">
                {subPitches.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#18221E] border border-[#223029]">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-[#F4F7F5] truncate">{sub.name}</div>
                      {sub.formats_supported?.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {sub.formats_supported.map(f => (
                            <span key={f} className="inline-flex h-[18px] items-center rounded-md px-1.5 text-[10px] font-bold bg-[#0F1513] text-[#B6C2BC] ring-1 ring-[#223029]">
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button
                        size="sm" variant="outline"
                        onClick={() => handleUnlink(sub.id)}
                        disabled={deletingId === sub.id}
                        className="h-8 px-2 text-[10px] border-[#223029] text-[#9EAAA4] hover:text-[#F4F7F5] rounded-lg"
                        title="Lossa från denna huvudplan (raderar inte)"
                      >
                        Lossa
                      </Button>
                      <Button
                        size="sm" variant="destructive"
                        onClick={() => handleDelete(sub.id)}
                        disabled={deletingId === sub.id}
                        className="h-8 px-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-lg"
                      >
                        {deletingId === sub.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Add new */}
          <section className="p-4 bg-[#0F1513] border border-[#2BA84A]/25 rounded-xl">
            <h4 className="text-xs font-bold text-[#86EFAC] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> Skapa ny underplan
            </h4>
            <div className="space-y-3">
              <div>
                <Label className="text-[#F4F7F5] text-xs mb-1 block">Namn *</Label>
                <Input
                  placeholder={`t.ex. ${parentVenue.name} – Konstgräs 5v5 plan 1`}
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="bg-[#18221E] border-[#223029] text-[#F4F7F5] h-9"
                />
              </div>
              <div>
                <Label className="text-[#F4F7F5] text-xs mb-1 block">Format</Label>
                <div className="flex gap-2">
                  {FORMATS.map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggleFormat(f)}
                      className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all border ${
                        newFormats.includes(f)
                          ? 'bg-[#2BA84A]/15 border-[#2BA84A]/40 text-[#86EFAC]'
                          : 'bg-[#18221E] border-[#223029] text-[#9EAAA4]'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleAdd}
                disabled={!newName.trim() || newFormats.length === 0 || adding}
                className="w-full bg-[#2BA84A] hover:bg-[#248232] text-white rounded-xl h-10 font-bold"
              >
                {adding ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Skapar...</> : 'Lägg till underplan'}
              </Button>
            </div>
          </section>

          {/* Link existing standalone venue */}
          <section>
            <button
              onClick={() => setShowLinkPicker(s => !s)}
              className="w-full text-xs font-bold text-[#9EAAA4] hover:text-[#F4F7F5] flex items-center gap-2 py-2"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              {showLinkPicker ? 'Dölj' : 'Länka befintlig fristående plan som underplan'}
            </button>
            {showLinkPicker && (
              <div className="mt-2 p-3 bg-[#18221E] border border-[#223029] rounded-xl space-y-2">
                <Input
                  placeholder="Sök befintlig plan..."
                  value={linkSearch}
                  onChange={e => setLinkSearch(e.target.value)}
                  className="bg-[#0F1513] border-[#223029] text-[#F4F7F5] h-9 text-sm"
                />
                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {linkable.length === 0 ? (
                    <div className="text-xs text-[#7B8A83] py-3 text-center">Inga matchande planer</div>
                  ) : linkable.map(v => (
                    <button
                      key={v.id}
                      onClick={() => handleLink(v)}
                      disabled={linkingId === v.id}
                      className="w-full flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-[#0F1513] text-left text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[#F4F7F5] font-semibold truncate">{v.name}</div>
                        <div className="text-[#7B8A83] text-[10px] truncate">{v.city || v.address}</div>
                      </div>
                      {linkingId === v.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9EAAA4]" />
                      ) : (
                        <span className="text-[10px] font-bold text-[#86EFAC]">Länka →</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </Card>
    </div>
  );
}