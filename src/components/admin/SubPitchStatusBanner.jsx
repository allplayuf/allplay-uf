import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, Copy, Loader2, RefreshCw, LayoutGrid } from "lucide-react";
import { callEdgeFunction } from '@/components/supabase/callEdgeFunction';

/**
 * Shows the current state of sub-pitch infrastructure:
 *  - Is the parent_venue_id column installed?
 *  - How many sub-pitches exist?
 *  - How many parent venues have sub-pitches?
 * Provides a Copy SQL button if the column is missing.
 */
export default function SubPitchStatusBanner() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const check = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await callEdgeFunction('adminCheckSubPitchSetup', {});
      setStatus(res);
    } catch (e) {
      setError(e.message || 'Kunde inte kontrollera setup');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { check(); }, []);

  const sqlText = status?.sql_to_run?.join('\n') || '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sqlText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // Loading
  if (loading && !status) {
    return (
      <Card className="bg-[#121715] border border-[#223029] rounded-[16px]">
        <CardContent className="p-3 flex items-center gap-2 text-xs text-[#9EAAA4]">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Kontrollerar underplan-uppsättning...
        </CardContent>
      </Card>
    );
  }

  // Error
  if (error) {
    return (
      <Card className="bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-[16px]">
        <CardContent className="p-3 flex items-center justify-between gap-2 text-xs">
          <span className="text-[#FCA5A5]">⚠ Kunde inte kontrollera: {error}</span>
          <Button size="sm" variant="outline" onClick={check} className="h-7 text-[10px] border-[#DC2626]/30">
            <RefreshCw className="w-3 h-3 mr-1" /> Försök igen
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Column missing — show SQL to run
  if (status && !status.columnExists) {
    return (
      <Card className="bg-[#F4743B]/10 border-2 border-[#F4743B]/40 rounded-[16px]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#F4743B]/20 ring-1 ring-[#F4743B]/40 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-[#F4743B]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[#F4F7F5] text-sm mb-1">
                Underplan-systemet är inte installerat ännu
              </h3>
              <p className="text-xs text-[#B6C2BC] mb-2">
                Databasen saknar kolumnen <code className="bg-[#0F1513] px-1 py-0.5 rounded text-[#FDE3D2]">parent_venue_id</code>.
                Utan den kan underplaner inte länkas till en huvudplan, och de syns istället som egna pins på kartan.
              </p>
              <p className="text-xs text-[#9EAAA4] mb-3">
                <strong className="text-[#F4F7F5]">Så här fixar du det:</strong> Öppna Supabase Dashboard → SQL Editor → klistra in SQL:en nedan → kör.
              </p>
            </div>
          </div>

          <div className="bg-[#0F1513] border border-[#223029] rounded-xl p-3 mb-3">
            <pre className="text-[11px] text-[#86EFAC] font-mono whitespace-pre-wrap break-all leading-relaxed">{sqlText}</pre>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={handleCopy}
              className="bg-[#2BA84A] hover:bg-[#248232] text-white rounded-lg h-9"
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              {copied ? 'Kopierad!' : 'Kopiera SQL'}
            </Button>
            <Button
              size="sm"
              asChild
              variant="outline"
              className="border-[#223029] text-[#F4F7F5] hover:bg-[#18221E] rounded-lg h-9"
            >
              <a
                href="https://supabase.com/dashboard/project/_/sql/new"
                target="_blank"
                rel="noreferrer"
              >
                Öppna Supabase SQL Editor →
              </a>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={check}
              className="border-[#223029] text-[#9EAAA4] hover:text-[#F4F7F5] rounded-lg h-9"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Kontrollera igen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Column exists — show summary
  return (
    <Card className="bg-[#2BA84A]/8 border border-[#2BA84A]/30 rounded-[16px]">
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-[#2BA84A]/15 ring-1 ring-[#2BA84A]/30 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-[#2BA84A]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#F4F7F5]">Underplan-system aktivt</div>
              <div className="text-[11px] text-[#9EAAA4] flex items-center gap-2 mt-0.5">
                <LayoutGrid className="w-3 h-3" />
                <span><strong className="text-[#86EFAC] tabular-nums">{status.subPitchCount}</strong> underplaner länkade till <strong className="text-[#86EFAC] tabular-nums">{status.parentCount}</strong> huvudplaner</span>
              </div>
            </div>
          </div>
          <Button
            size="sm" variant="ghost"
            onClick={check}
            className="h-7 text-[10px] text-[#9EAAA4] hover:text-[#F4F7F5]"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}