import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Trash2, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useCustomDialog } from "../components/ui/custom-dialog";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/components/utils/helpers";

export default function AdminCleanupPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const { confirm, alert, DialogContainer } = useCustomDialog();
  const navigate = useNavigate();

  const handleCleanup = async (dryRun = false) => {
    const shouldProceed = await confirm(
      dryRun ? 'Förhandsvisning' : 'TA BORT ALLA CUPER',
      dryRun 
        ? 'Detta visar vad som skulle tas bort utan att faktiskt radera något.'
        : '⚠️ VARNING: Detta tar bort ALLA cuper och relaterad data. Detta går inte att ångra!',
      { 
        type: dryRun ? 'info' : 'warning',
        confirmText: dryRun ? 'Visa' : 'Ja, ta bort allt',
        cancelText: 'Avbryt'
      }
    );

    if (!shouldProceed) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await base44.functions.invoke('cups/cleanupOldCups', { dryRun });
      setResults(response.data);
      
      if (!dryRun) {
        await alert('Cleanup genomförd! 🗑️', 'Alla cuper och relaterad data har tagits bort.', { type: 'success' });
      }
    } catch (err) {
      console.error('Cleanup error:', err);
      setError(err.message || 'Ett fel uppstod');
      await alert('Ett fel uppstod', err.message || 'Kunde inte genomföra cleanup.', { type: 'alert' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1513] p-4 lg:p-8">
      <DialogContainer />
      
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#F4F7F5] mb-1">Cup Cleanup Tool</h1>
            <p className="text-sm text-[#B6C2BC]">Admin-verktyg för att rensa gamla cuper</p>
          </div>
          <Link to={createPageUrl("Admin")}>
            <Button variant="outline" className="border-[#223029] text-[#B6C2BC]">
              Tillbaka till Admin
            </Button>
          </Link>
        </div>

        {/* Warning Card */}
        <Card className="bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-[#DC2626] flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-[#FCA5A5] mb-2">Varning: Permanent borttagning</h3>
                <p className="text-sm text-[#FCA5A5] leading-relaxed">
                  Detta verktyg tar bort ALLA cuper i systemet tillsammans med:
                </p>
                <ul className="text-sm text-[#FCA5A5] mt-2 space-y-1 list-disc list-inside">
                  <li>Alla cup-deltagare (CupParticipant)</li>
                  <li>Alla grupper (CupGroup)</li>
                  <li>Alla cup-matcher (CupMatch + Match)</li>
                  <li>Alla bracket-data (CupBracket)</li>
                  <li>Cup-specifika lag (teams med is_cup_team = true)</li>
                </ul>
                <p className="text-sm text-[#FCA5A5] mt-3 font-semibold">
                  Detta går INTE att ångra. Använd förhandsvisning först!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Button
            onClick={() => handleCleanup(true)}
            disabled={loading}
            className="h-14 bg-[#4169E1] hover:bg-[#3457D5] text-white gap-2 font-semibold shadow-lg"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Analyserar...' : 'Förhandsvisning (Dry Run)'}
          </Button>
          
          <Button
            onClick={() => handleCleanup(false)}
            disabled={loading}
            className="h-14 bg-[#DC2626] hover:bg-[#B91C1C] text-white gap-2 font-semibold shadow-lg"
          >
            <Trash2 className="w-5 h-5" />
            {loading ? 'Tar bort...' : '🗑️ Ta bort allt (FARLIGT)'}
          </Button>
        </div>

        {/* Results Display */}
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="bg-[#121715] border border-[#223029] rounded-2xl shadow-xl">
              <CardHeader className="border-b border-[#223029]">
                <CardTitle className="text-lg font-bold text-[#F4F7F5] flex items-center gap-2">
                  {results.message === 'Dry run complete - no data was deleted' ? (
                    <>
                      <RefreshCw className="w-5 h-5 text-[#4169E1]" />
                      Förhandsvisning
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 text-[#2BA84A]" />
                      Cleanup Genomförd
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#18221E] rounded-xl border border-[#223029]">
                    <div className="text-2xl font-bold text-[#DC2626] mb-1">
                      {results.results?.cups_removed || results.preview?.cups_found || 0}
                    </div>
                    <div className="text-xs text-[#B6C2BC]">Cuper borttagna</div>
                  </div>
                  
                  <div className="p-4 bg-[#18221E] rounded-xl border border-[#223029]">
                    <div className="text-2xl font-bold text-[#F59E0B] mb-1">
                      {results.results?.participants_removed || 0}
                    </div>
                    <div className="text-xs text-[#B6C2BC]">Deltagare</div>
                  </div>
                  
                  <div className="p-4 bg-[#18221E] rounded-xl border border-[#223029]">
                    <div className="text-2xl font-bold text-[#9370DB] mb-1">
                      {results.results?.groups_removed || 0}
                    </div>
                    <div className="text-xs text-[#B6C2BC]">Grupper</div>
                  </div>
                  
                  <div className="p-4 bg-[#18221E] rounded-xl border border-[#223029]">
                    <div className="text-2xl font-bold text-[#2BA84A] mb-1">
                      {results.results?.matches_removed || 0}
                    </div>
                    <div className="text-xs text-[#B6C2BC]">Matcher</div>
                  </div>
                  
                  <div className="p-4 bg-[#18221E] rounded-xl border border-[#223029]">
                    <div className="text-2xl font-bold text-[#14B8A6] mb-1">
                      {results.results?.cup_matches_removed || 0}
                    </div>
                    <div className="text-xs text-[#B6C2BC]">Cup Matches</div>
                  </div>
                  
                  <div className="p-4 bg-[#18221E] rounded-xl border border-[#223029]">
                    <div className="text-2xl font-bold text-[#F4743B] mb-1">
                      {results.results?.teams_cleaned || 0}
                    </div>
                    <div className="text-xs text-[#B6C2BC]">Cup-lag</div>
                  </div>
                </div>

                {/* Cups to Delete (Dry Run) */}
                {results.cups_to_delete && results.cups_to_delete.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-[#F4F7F5]">Cuper som skulle tas bort:</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {results.cups_to_delete.map((cup, index) => (
                        <div key={cup.id} className="flex items-center justify-between p-3 bg-[#18221E] rounded-lg border border-[#223029]">
                          <div>
                            <div className="font-semibold text-[#F4F7F5] text-sm">{cup.name}</div>
                            <div className="text-xs text-[#B6C2BC]">ID: {cup.id}</div>
                          </div>
                          <Badge className={`${
                            cup.status === 'completed' ? 'bg-[#6B7280]/20 text-[#9CA3AF]' :
                            cup.status === 'ongoing' ? 'bg-[#EF4444]/20 text-[#EF4444]' :
                            'bg-[#F59E0B]/20 text-[#FCD34D]'
                          } border-0`}>
                            {cup.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Errors */}
                {results.results?.errors && results.results.errors.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-[#DC2626]">Fel ({results.results.errors.length}):</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {results.results.errors.map((err, index) => (
                        <div key={index} className="p-3 bg-[#DC2626]/10 rounded-lg border border-[#DC2626]/30">
                          <div className="text-sm text-[#FCA5A5] font-mono">{err.error}</div>
                          {err.cup_name && (
                            <div className="text-xs text-[#FCA5A5] mt-1">Cup: {err.cup_name}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {results.success && !results.message?.includes('Dry run') && (
                  <div className="p-4 bg-[#2BA84A]/10 border border-[#2BA84A]/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-[#2BA84A]" />
                      <div>
                        <p className="font-semibold text-[#F4F7F5]">Cleanup slutförd!</p>
                        <p className="text-sm text-[#B6C2BC]">Alla cuper och relaterad data har tagits bort från systemet.</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <Card className="bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <XCircle className="w-6 h-6 text-[#DC2626] flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-[#FCA5A5] mb-1">Ett fel uppstod</h4>
                  <p className="text-sm text-[#FCA5A5]">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-[#121715] border border-[#223029] rounded-2xl">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-lg font-bold text-[#F4F7F5]">Instruktioner</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 text-sm text-[#B6C2BC]">
            <div>
              <h4 className="font-semibold text-[#F4F7F5] mb-2">1. Kör förhandsvisning (Dry Run)</h4>
              <p>Se vilka cuper som skulle tas bort utan att faktiskt radera något. Rekommenderas att köra först.</p>
            </div>
            <div>
              <h4 className="font-semibold text-[#F4F7F5] mb-2">2. Granska resultatet</h4>
              <p>Kontrollera listan över cuper som skulle påverkas. Notera antal deltagare, matcher, etc.</p>
            </div>
            <div>
              <h4 className="font-semibold text-[#F4F7F5] mb-2">3. Genomför cleanup</h4>
              <p>När du är säker, klicka på "Ta bort allt" för att permanent radera all cup-data.</p>
            </div>
            <div className="p-4 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl mt-4">
              <p className="font-semibold text-[#FCD34D]">
                💡 Tips: Vanliga match-flöden (hitta matcher, gå med, rapportera resultat) påverkas INTE av denna cleanup.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}