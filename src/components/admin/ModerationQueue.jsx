import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Flag, User, Calendar, AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react";

const REASON_TEXT = {
  harassment: 'Trakasserier', threats: 'Hot', sexual_content: 'Sexuellt innehåll',
  hate_speech: 'Hatretorik', spam: 'Spam', cheating: 'Fusk', underage: 'Minderårig',
  impersonation: 'Utger sig för annan', other: 'Annat',
  inappropriate_behavior: 'Olämpligt beteende', no_show: 'Kom inte till match'
};

export default function ModerationQueue({ reports = [], isLoading, lastUpdated, onAction, onRefresh }) {
  const [selectedId, setSelectedId] = useState(null);
  const [notes, setNotes] = useState('');

  const pending = reports.filter(r => r.status === 'pending');
  const updatedStr = lastUpdated ? new Date(lastUpdated).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) : null;

  const handleAction = (reportId, action) => {
    onAction(reportId, action, notes);
    setSelectedId(null);
    setNotes('');
  };

  if (isLoading) {
    return (
      <Card className="bg-[#121715] border border-[#223029] rounded-[16px]">
        <CardContent className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-[#F4743B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#B6C2BC]">Laddar rapporter...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#F4F7F5] flex items-center gap-2">
          <Flag className="w-5 h-5 text-[#F4743B]" />
          Rapporter ({pending.length} väntande)
        </h3>
        <div className="flex items-center gap-3">
          {updatedStr && <span className="text-xs text-[#7B8A83]">Uppdaterad {updatedStr}</span>}
          <Button onClick={onRefresh} variant="outline" size="sm" className="h-8 border-[#223029] text-[#F4F7F5] hover:bg-[#18221E] gap-1">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {pending.length === 0 ? (
        <Card className="bg-[#121715] border border-[#223029] rounded-[16px]">
          <CardContent className="p-12 text-center">
            <CheckCircle className="w-12 h-12 text-[#2BA84A]/40 mx-auto mb-3" />
            <h3 className="font-semibold text-[#F4F7F5] mb-1">Inga väntande rapporter</h3>
            <p className="text-sm text-[#B6C2BC]">Alla rapporter har hanterats.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map(report => (
            <Card
              key={report.id}
              className={`bg-[#121715] border rounded-[16px] transition-colors cursor-pointer ${
                selectedId === report.id ? 'border-[#F4743B]' : 'border-[#223029] hover:border-[#F4743B]/30'
              }`}
              onClick={() => setSelectedId(selectedId === report.id ? null : report.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-2">
                  <AlertTriangle className="w-5 h-5 text-[#F4743B] flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-[#F4F7F5] text-sm">{REASON_TEXT[report.category || report.reason] || report.category || 'Rapport'}</span>
                      <Badge className="text-[10px] bg-[#F4743B]/15 text-[#F4743B]">Väntande</Badge>
                    </div>
                    <div className="text-xs text-[#7B8A83] space-y-0.5">
                      <div className="flex items-center gap-1"><User className="w-3 h-3" />Från: {report.reporter_id?.substring(0, 8)}...</div>
                      {report.reported_user_id && <div className="flex items-center gap-1"><User className="w-3 h-3" />Om: {report.reported_user_id?.substring(0, 8)}...</div>}
                      <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(report.created_date).toLocaleDateString('sv-SE')}</div>
                    </div>
                    {report.description && (
                      <p className="text-xs text-[#B6C2BC] mt-2 bg-[#0F1513] p-2 rounded-lg">{report.description}</p>
                    )}
                  </div>
                </div>

                {selectedId === report.id && (
                  <div className="border-t border-[#223029] pt-3 mt-3 space-y-3" onClick={e => e.stopPropagation()}>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Moderatoranteckningar..."
                      rows={2}
                      className="bg-[#18221E] border-[#223029] text-[#F4F7F5] rounded-xl text-sm"
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button onClick={() => handleAction(report.id, 'warning')} className="p-2 text-xs bg-[#F59E0B]/10 text-[#F59E0B] rounded-lg border border-[#F59E0B]/20 hover:bg-[#F59E0B]/20">⚠️ Varning</button>
                      <button onClick={() => handleAction(report.id, 'timeout_7_days')} className="p-2 text-xs bg-[#F4743B]/10 text-[#F4743B] rounded-lg border border-[#F4743B]/20 hover:bg-[#F4743B]/20">⏸️ 7 dagar</button>
                      <button onClick={() => handleAction(report.id, 'permanent_ban')} className="p-2 text-xs bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 hover:bg-red-500/20">🚫 Ban</button>
                      <button onClick={() => handleAction(report.id, 'dismiss')} className="p-2 text-xs bg-[#223029] text-[#B6C2BC] rounded-lg border border-[#223029] hover:bg-[#18221E]">Avfärda</button>
                    </div>
                    <Button onClick={() => handleAction(report.id, 'resolve')} className="w-full h-9 bg-[#2BA84A] hover:bg-[#248232] text-white rounded-xl text-sm">
                      <CheckCircle className="w-4 h-4 mr-1" /> Löst
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}