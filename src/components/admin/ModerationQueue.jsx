import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Flag, User, Calendar, AlertTriangle, CheckCircle, XCircle, Clock, Ban } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminSectionHeader from "./AdminSectionHeader";

const REASON_TEXT = {
  harassment: 'Trakasserier', threats: 'Hot', sexual_content: 'Sexuellt innehåll',
  hate_speech: 'Hatretorik', spam: 'Spam', cheating: 'Fusk', underage: 'Minderårig',
  impersonation: 'Utger sig för annan', other: 'Annat',
  inappropriate_behavior: 'Olämpligt beteende', no_show: 'Kom inte till match'
};

const TABS = [
  { id: 'pending', label: 'Väntande', color: '#F4743B' },
  { id: 'all', label: 'Alla', color: '#9EAAA4' },
];

const ACTIONS = [
  { id: 'warning', label: 'Varning', icon: AlertTriangle, cls: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/25 hover:bg-[#F59E0B]/20' },
  { id: 'timeout_7_days', label: '7 dagar', icon: Clock, cls: 'bg-[#F4743B]/10 text-[#F4743B] border-[#F4743B]/25 hover:bg-[#F4743B]/20' },
  { id: 'permanent_ban', label: 'Ban', icon: Ban, cls: 'bg-[#DC2626]/10 text-[#F87171] border-[#DC2626]/25 hover:bg-[#DC2626]/20' },
  { id: 'dismiss', label: 'Avfärda', icon: XCircle, cls: 'bg-[#18221E] text-[#B6C2BC] border-[#223029] hover:bg-[#223029]' },
];

export default function ModerationQueue({ reports = [], isLoading, lastUpdated, onAction, onRefresh }) {
  const [selectedId, setSelectedId] = useState(null);
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState('pending');
  const [actingId, setActingId] = useState(null);

  const list = useMemo(() => {
    if (filter === 'pending') return reports.filter(r => r.status === 'pending');
    return reports;
  }, [reports, filter]);

  const pending = reports.filter(r => r.status === 'pending').length;

  const handleAction = async (reportId, action) => {
    setActingId(reportId + ':' + action);
    try {
      await onAction(reportId, action, notes);
      setSelectedId(null);
      setNotes('');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <AdminSectionHeader
        title="Moderering"
        icon={Flag}
        iconColor="#F4743B"
        totalCount={reports.length}
        filteredCount={list.length}
        isLoading={isLoading}
        lastUpdated={lastUpdated}
        onRefresh={onRefresh}
      >
        <div className="flex gap-1.5 p-1 bg-[#121715] border border-[#223029] rounded-xl">
          {TABS.map(t => {
            const active = filter === t.id;
            const count = t.id === 'pending' ? pending : reports.length;
            return (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  active ? 'bg-[#18221E] text-[#F4F7F5] ring-1 ring-[#F4743B]/40' : 'text-[#9EAAA4] hover:text-[#F4F7F5]'
                }`}
              >
                {t.label}
                <span className="text-[10px] tabular-nums opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      </AdminSectionHeader>

      {isLoading ? (
        <Card className="bg-[#121715] border border-[#223029] rounded-[16px]">
          <CardContent className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-[#F4743B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-[#B6C2BC]">Laddar rapporter...</p>
          </CardContent>
        </Card>
      ) : list.length === 0 ? (
        <Card className="bg-[#121715] border border-[#223029] rounded-[16px]">
          <CardContent className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#2BA84A]/10 ring-1 ring-[#2BA84A]/25 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-7 h-7 text-[#2BA84A]" />
            </div>
            <h3 className="font-semibold text-[#F4F7F5] mb-1">
              {filter === 'pending' ? 'Inga väntande rapporter' : 'Inga rapporter'}
            </h3>
            <p className="text-sm text-[#B6C2BC]">
              {filter === 'pending' ? 'Allt är hanterat.' : 'Rapporter kommer visas här.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {list.map(report => {
            const isSelected = selectedId === report.id;
            const isPending = report.status === 'pending';
            const reasonLabel = REASON_TEXT[report.category || report.reason] || report.category || 'Rapport';

            return (
              <motion.div
                key={report.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-[#121715] border rounded-[14px] transition-all ${
                  isSelected ? 'border-[#F4743B]/60 shadow-[0_8px_24px_rgba(244,116,59,0.12)]' : 'border-[#223029] hover:border-[#F4743B]/30'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(isSelected ? null : report.id)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isPending ? 'bg-[#F4743B]/15 ring-1 ring-[#F4743B]/30' : 'bg-[#18221E] ring-1 ring-[#223029]'
                    }`}>
                      <AlertTriangle className={`w-4 h-4 ${isPending ? 'text-[#F4743B]' : 'text-[#9EAAA4]'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-[#F4F7F5] text-sm">{reasonLabel}</span>
                        <Badge className={`text-[10px] ${
                          isPending ? 'bg-[#F4743B]/15 text-[#F4743B]' : 'bg-[#2BA84A]/15 text-[#9FC9AC]'
                        }`}>
                          {isPending ? 'Väntande' : (report.status || 'Hanterad')}
                        </Badge>
                      </div>
                      <div className="text-xs text-[#7B8A83] flex items-center flex-wrap gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />Från: {report.reporter_id?.substring(0, 8) || '—'}</span>
                        {report.reported_user_id && (
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />Om: {report.reported_user_id.substring(0, 8)}</span>
                        )}
                        {report.created_date && (
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(report.created_date).toLocaleDateString('sv-SE')}</span>
                        )}
                      </div>
                      {report.description && (
                        <p className="text-xs text-[#B6C2BC] mt-2 bg-[#0F1513] p-2.5 rounded-lg border border-[#223029] line-clamp-3">
                          {report.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {isSelected && isPending && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-[#223029] p-4 space-y-3">
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Moderatoranteckningar (valfritt)..."
                          rows={2}
                          className="bg-[#0F1513] border-[#223029] text-[#F4F7F5] rounded-xl text-sm resize-none"
                        />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {ACTIONS.map(a => {
                            const busy = actingId === report.id + ':' + a.id;
                            const Icon = a.icon;
                            return (
                              <button
                                key={a.id}
                                disabled={!!actingId}
                                onClick={() => handleAction(report.id, a.id)}
                                className={`p-2.5 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 ${a.cls}`}
                              >
                                {busy ? (
                                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Icon className="w-3.5 h-3.5" />
                                )}
                                {a.label}
                              </button>
                            );
                          })}
                        </div>
                        <Button
                          disabled={!!actingId}
                          onClick={() => handleAction(report.id, 'resolve')}
                          className="w-full h-10 bg-[#2BA84A] hover:bg-[#248232] text-white rounded-xl text-sm font-semibold"
                        >
                          {actingId === report.id + ':resolve' ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <><CheckCircle className="w-4 h-4 mr-1.5" /> Markera som löst</>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}