import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Flag, User, Calendar, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useState } from 'react';

export default function ModerationQueue({ reports, onAction }) {
  const [selectedReport, setSelectedReport] = useState(null);
  const [notes, setNotes] = useState('');

  const handleAction = (reportId, action) => {
    onAction(reportId, action, notes);
    setSelectedReport(null);
    setNotes('');
  };

  const getReasonText = (reason) => {
    const reasons = {
      inappropriate_behavior: 'Olämpligt beteende',
      harassment: 'Trakasserier',
      cheating: 'Fusk/manipulation',
      no_show: 'Kom inte till match',
      spam: 'Spam eller reklam',
      other: 'Annat'
    };
    return reasons[reason] || reason;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-[#F4743B]/20 text-[#FDE3D2] ring-1 ring-[#F4743B]/30';
      case 'investigating': return 'bg-[#4169E1]/20 text-[#B0C4DE] ring-1 ring-[#4169E1]/30';
      case 'resolved': return 'bg-[#2BA84A]/20 text-[#CFE8D6] ring-1 ring-[#2BA84A]/30';
      case 'dismissed': return 'bg-[#18221E] text-[#B6C2BC] ring-1 ring-[#223029]';
      default: return 'bg-[#18221E] text-[#B6C2BC] ring-1 ring-[#223029]';
    }
  };

  const pendingReports = reports.filter(r => r.status === 'pending');

  if (pendingReports.length === 0) {
    return (
      <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-2xl">
        <CardContent className="p-12 text-center">
          <div className="w-20 h-20 bg-[#2BA84A]/20 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-[#2BA84A]/30">
            <CheckCircle className="w-10 h-10 text-[#2BA84A]" />
          </div>
          <h3 className="text-xl font-semibold text-[#F4F7F5] mb-2">Inga väntande rapporter</h3>
          <p className="text-[#B6C2BC]">Bra jobbat! Alla rapporter har hanterats.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-2xl">
        <CardHeader className="border-b border-[#223029]">
          <CardTitle className="text-lg text-[#F4F7F5] flex items-center gap-2">
            <Flag className="w-5 h-5 text-[#F4743B]" />
            Modereringskö ({pendingReports.length} väntande)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {pendingReports.map((report) => (
              <div
                key={report.id}
                className={`p-4 border-2 rounded-xl transition-all cursor-pointer ${
                  selectedReport?.id === report.id 
                    ? 'border-[#F4743B] bg-[#F4743B]/10' 
                    : 'border-[#223029] bg-[#18221E] hover:border-[#2BA84A]/50'
                }`}
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <div className="w-10 h-10 bg-[#F4743B]/20 rounded-xl flex items-center justify-center ring-1 ring-[#F4743B]/30">
                        <AlertTriangle className="w-5 h-5 text-[#F4743B]" />
                      </div>
                      <h3 className="font-semibold text-[#F4F7F5] flex-1">
                        {getReasonText(report.reason)}
                      </h3>
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-[#B6C2BC] space-y-2 ml-13">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[#9FC9AC]" />
                        <span>Rapporterat av: {report.reporter_id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[#9FC9AC]" />
                        <span>Rapporterad användare: {report.reported_user_id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#9FC9AC]" />
                        <span>{new Date(report.created_date).toLocaleDateString('sv-SE')}</span>
                      </div>
                      {report.match_id && (
                        <div className="text-[#4169E1]">
                          Match-ID: {report.match_id}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-[#0F1513] p-4 rounded-xl mb-3 ring-1 ring-[#223029]">
                  <h4 className="font-medium text-[#F4F7F5] mb-2 text-sm">Beskrivning:</h4>
                  <p className="text-sm text-[#B6C2BC]">{report.description}</p>
                </div>

                {selectedReport?.id === report.id && (
                  <div className="border-t border-[#223029] pt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#F4F7F5] mb-2">
                        Moderatoranteckningar
                      </label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Lägg till dina anteckningar om denna rapport..."
                        rows={3}
                        className="bg-[#18221E] border-[#223029] text-[#F4F7F5] rounded-xl"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleAction(report.id, 'resolve')}
                        className="flex-1 bg-[#2BA84A] hover:bg-[#248232] text-white h-11 rounded-xl"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Löst
                      </Button>
                      <Button
                        onClick={() => handleAction(report.id, 'dismiss')}
                        variant="outline"
                        className="flex-1 border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] h-11 rounded-xl"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Avfärda
                      </Button>
                      <Button
                        onClick={() => setSelectedReport(null)}
                        variant="outline"
                        className="border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] h-11 rounded-xl"
                      >
                        Avbryt
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}