import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, AlertTriangle, CheckCircle, Loader2, Eye, Merge } from "lucide-react";

/**
 * Groups venues into duplicate clusters.
 * Primary key: external_id (if present).
 * Fallback: normalized name + lat/lng within 0.001 degree tolerance (~100m).
 */
function findDuplicateGroups(venues) {
  const groups = new Map(); // key -> [venues]

  venues.forEach(v => {
    let key = null;

    // 1. external_id based grouping (strongest signal)
    if (v.external_id && v.external_id.trim() !== '') {
      key = `ext:${v.external_id.trim()}`;
    } else {
      // 2. name + approx location
      const normName = (v.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const latBucket = v.latitude ? Math.round(v.latitude * 1000) : 'nolat';
      const lngBucket = v.longitude ? Math.round(v.longitude * 1000) : 'nolng';
      key = `name:${normName}|${latBucket}|${lngBucket}`;
    }

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(v);
  });

  // Only return groups with >1 venue (actual duplicates)
  return Array.from(groups.values()).filter(g => g.length > 1);
}

/**
 * Pick the canonical venue from a group:
 * - Prefer the one with external_id
 * - Then oldest created_at
 */
function pickCanonical(group) {
  return group.slice().sort((a, b) => {
    const aHasExt = a.external_id && a.external_id.trim() !== '';
    const bHasExt = b.external_id && b.external_id.trim() !== '';
    if (aHasExt && !bHasExt) return -1;
    if (!aHasExt && bHasExt) return 1;
    return (a.created_at || '').localeCompare(b.created_at || '');
  })[0];
}

export default function VenueDeduplicator({ venues = [], matches = [], onRefresh }) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const duplicateGroups = useMemo(() => findDuplicateGroups(venues), [venues]);
  const totalDuplicates = duplicateGroups.reduce((sum, g) => sum + g.length - 1, 0);

  // Build a preview showing what will happen
  const preview = useMemo(() => {
    return duplicateGroups.map(group => {
      const canonical = pickCanonical(group);
      const dupes = group.filter(v => v.id !== canonical.id);
      const affectedMatches = matches.filter(m => dupes.some(d => d.id === m.venue_id));
      return { canonical, dupes, affectedMatches: affectedMatches.length };
    });
  }, [duplicateGroups, matches]);

  const handleDedupe = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      // Import Supabase client dynamically
      const { getSupabaseConfig, SUPABASE_URL } = await import('../supabase/config');
      const { sessionStore, waitForAuth } = await import('../supabase/client');
      await waitForAuth();
      const config = await getSupabaseConfig();

      const headers = { 'Content-Type': 'application/json', 'Prefer': 'return=minimal' };
      if (config.anonKey) headers['apikey'] = config.anonKey;
      if (sessionStore.accessToken) headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;

      let merged = 0;
      let deleted = 0;
      let errors = [];

      for (const group of preview) {
        const canonicalId = group.canonical.id;

        for (const dupe of group.dupes) {
          // 1. Update matches pointing to the dupe
          const updateRes = await fetch(
            `${SUPABASE_URL}/rest/v1/matches?venue_id=eq.${dupe.id}`,
            {
              method: 'PATCH',
              headers: { ...headers, 'Prefer': 'return=representation' },
              body: JSON.stringify({ venue_id: canonicalId })
            }
          );

          if (updateRes.ok) {
            const updated = await updateRes.json();
            merged += updated.length;
          } else {
            const errText = await updateRes.text().catch(() => '');
            errors.push(`Flytta matcher från ${dupe.name}: ${errText}`);
            continue; // Skip delete if update failed
          }

          // 2. Delete the duplicate venue
          const delRes = await fetch(
            `${SUPABASE_URL}/rest/v1/venues?id=eq.${dupe.id}`,
            { method: 'DELETE', headers }
          );

          if (delRes.ok) {
            deleted++;
          } else {
            const errText = await delRes.text().catch(() => '');
            errors.push(`Radera ${dupe.name}: ${errText}`);
          }
        }
      }

      setResult({
        success: errors.length === 0,
        merged,
        deleted,
        groups: preview.length,
        errors
      });

      if (onRefresh) onRefresh();
    } catch (error) {
      setResult({ success: false, errors: [error.message] });
    } finally {
      setIsRunning(false);
    }
  };

  if (duplicateGroups.length === 0) {
    return (
      <Card className="bg-[#121715] border border-[#223029] rounded-[16px]">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-10 h-10 text-[#2BA84A] mx-auto mb-3" />
          <h3 className="font-semibold text-[#F4F7F5] mb-1">Inga dubbletter</h3>
          <p className="text-sm text-[#B6C2BC]">Alla planer är unika. Inget att rensa.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="bg-[#121715] border border-[#F59E0B]/30 rounded-[16px]">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[#F59E0B]/10 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-[#F59E0B]/20">
              <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-[#F4F7F5] mb-1">Dubbletter hittade</h3>
              <p className="text-sm text-[#B6C2BC] mb-3">
                {duplicateGroups.length} grupp{duplicateGroups.length > 1 ? 'er' : ''} med dubbletter.
                Totalt <strong className="text-[#F59E0B]">{totalDuplicates}</strong> planer kan tas bort.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                  className="border-[#223029] text-[#F4F7F5] hover:bg-[#18221E] gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {showPreview ? 'Dölj förhandsgranskning' : 'Förhandsgranska'}
                </Button>
                <Button
                  size="sm"
                  onClick={handleDedupe}
                  disabled={isRunning}
                  className="bg-[#F59E0B] hover:bg-[#D97706] text-white gap-1"
                >
                  {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Merge className="w-3.5 h-3.5" />}
                  {isRunning ? 'Kör...' : 'Rensa dubbletter'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {showPreview && (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {preview.map((group, i) => (
            <Card key={i} className="bg-[#121715] border border-[#223029] rounded-[14px]">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-[#2BA84A]/15 text-[#2BA84A] text-[10px]">Behåll</Badge>
                  <span className="text-sm font-semibold text-[#F4F7F5] truncate">{group.canonical.name}</span>
                  <span className="text-[10px] text-[#7B8A83]">{group.canonical.city}</span>
                </div>
                {group.dupes.map(d => (
                  <div key={d.id} className="flex items-center gap-2 pl-4 py-1">
                    <Badge className="bg-[#DC2626]/15 text-[#FCA5A5] text-[10px]">Ta bort</Badge>
                    <span className="text-xs text-[#9EAAA4] truncate">{d.name}</span>
                  </div>
                ))}
                {group.affectedMatches > 0 && (
                  <p className="text-[10px] text-[#F59E0B] mt-1 pl-4">{group.affectedMatches} matcher flyttas</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Result */}
      {result && (
        <Card className={`border rounded-[16px] ${result.success ? 'bg-[#2BA84A]/10 border-[#2BA84A]/30' : 'bg-[#DC2626]/10 border-[#DC2626]/30'}`}>
          <CardContent className="p-5">
            {result.success ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-[#2BA84A]" />
                  <h3 className="font-bold text-[#F4F7F5]">Rensning klar</h3>
                </div>
                <p className="text-sm text-[#B6C2BC]">
                  {result.deleted} dubblettvenue{result.deleted !== 1 ? 's' : ''} raderade.
                  {result.merged > 0 && ` ${result.merged} matcher omdirigerade.`}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
                  <h3 className="font-bold text-[#F4F7F5]">Delvis misslyckades</h3>
                </div>
                {result.errors?.map((err, i) => (
                  <p key={i} className="text-xs text-[#FCA5A5]">{err}</p>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}