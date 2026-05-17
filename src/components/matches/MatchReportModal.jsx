import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { AlertTriangle } from 'lucide-react';
import { useT } from "@/i18n/LanguageProvider";

export default function MatchReportModal({ match, currentUser, onClose }) {
  const { t } = useT();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason || !description) return;
    setIsSubmitting(true);
    try {
        await base44.functions.invoke('reportMatch', {
            match_id: match.id,
            reason,
            description,
            reported_user_id: null // General match report
        });
        onClose();
        // Show success toast ideally
    } catch (error) {
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-[#121715] border border-[#223029] rounded-[20px] w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4 text-[#F4743B]">
            <AlertTriangle className="w-6 h-6" />
            <h2 className="text-xl font-bold">{t('report_modal.title')}</h2>
        </div>

        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm text-[#B6C2BC]">{t('report_modal.reason_label')}</label>
                <Select onValueChange={setReason}>
                    <SelectTrigger className="bg-[#18221E] border-[#223029] text-white">
                        <SelectValue placeholder={t('report_modal.reason_placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="no_show">{t('report_modal.reason_no_show')}</SelectItem>
                        <SelectItem value="harassment">{t('report_modal.reason_harassment')}</SelectItem>
                        <SelectItem value="facility_issue">{t('report_modal.reason_facility')}</SelectItem>
                        <SelectItem value="other">{t('report_modal.reason_other')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <label className="text-sm text-[#B6C2BC]">{t('report_modal.desc_label')}</label>
                <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('report_modal.desc_placeholder')}
                    className="bg-[#18221E] border-[#223029] text-white min-h-[100px]"
                />
            </div>
        </div>

        <div className="flex gap-3 mt-6">
            <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] hover:text-white"
            >
                {t('common.cancel')}
            </Button>
            <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !reason || !description}
                className="flex-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white"
            >
                {isSubmitting ? t('report_modal.sending') : t('report_modal.submit')}
            </Button>
        </div>
      </div>
    </div>
  );
}