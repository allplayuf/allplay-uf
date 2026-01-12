import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flag, AlertTriangle, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";

const REPORT_CATEGORIES = [
  { value: 'harassment', label: 'Trakasserier', icon: '🚫' },
  { value: 'threats', label: 'Hot', icon: '⚠️' },
  { value: 'sexual_content', label: 'Sexuellt innehåll', icon: '🔞' },
  { value: 'hate_speech', label: 'Hatretorik', icon: '❌' },
  { value: 'spam', label: 'Spam', icon: '📧' },
  { value: 'cheating', label: 'Fusk', icon: '🎮' },
  { value: 'underage', label: 'Misstänkt minderårig', icon: '👶' },
  { value: 'impersonation', label: 'Utger sig för annan', icon: '🎭' },
  { value: 'other', label: 'Annat', icon: '❓' }
];

export default function ReportModal({ 
  isOpen, 
  onClose, 
  reportedUserId,
  reportedItemType = 'user',
  reportedItemId,
  itemTitle
}) {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!category) return;

    setIsSubmitting(true);
    try {
      const response = await base44.functions.invoke('submitReport', {
        reported_user_id: reportedUserId,
        reported_item_type: reportedItemType,
        reported_item_id: reportedItemId,
        category,
        description
      });

      if (response.data?.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
          setCategory('');
          setDescription('');
        }, 2000);
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      alert('Kunde inte skicka rapport. Försök igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-[#121715] rounded-2xl border border-[#223029] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#223029]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                <Flag className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="font-semibold text-[#F4F7F5]">Rapportera</h2>
                {itemTitle && (
                  <p className="text-xs text-[#7B8A83] truncate max-w-[200px]">{itemTitle}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#18221E] flex items-center justify-center text-[#7B8A83] hover:text-[#F4F7F5] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {isSuccess ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-8 text-center"
              >
                <div className="w-16 h-16 bg-[#2BA84A]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    <Flag className="w-8 h-8 text-[#2BA84A]" />
                  </motion.div>
                </div>
                <h3 className="text-lg font-semibold text-[#F4F7F5] mb-2">Tack för din rapport!</h3>
                <p className="text-sm text-[#7B8A83]">
                  Vi granskar alla rapporter och vidtar åtgärder vid behov.
                </p>
              </motion.div>
            ) : (
              <>
                {/* Category Selection */}
                <div>
                  <Label className="text-[#F4F7F5] font-semibold mb-3 block">
                    Vad vill du rapportera?
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {REPORT_CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        className={`p-3 rounded-xl text-center transition-all ${
                          category === cat.value
                            ? 'bg-red-500/20 border-red-500/50 text-red-300 ring-1 ring-red-500/30'
                            : 'bg-[#18221E] border-[#223029] text-[#B6C2BC] hover:border-[#2BA84A]/50'
                        } border`}
                      >
                        <span className="text-xl mb-1 block">{cat.icon}</span>
                        <span className="text-[10px] font-medium">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label className="text-[#F4F7F5] font-semibold mb-2 block">
                    Beskriv problemet (valfritt)
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ge mer detaljer om vad som hänt..."
                    className="bg-[#18221E] border-[#223029] text-[#F4F7F5] placeholder:text-[#7B8A83] focus:border-[#2BA84A] rounded-xl h-24 resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-[#7B8A83] text-right mt-1">
                    {description.length}/500
                  </p>
                </div>

                {/* Warning */}
                <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-[#F59E0B]/80">
                      Falska rapporter kan leda till varning eller avstängning av ditt konto.
                    </p>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  onClick={handleSubmit}
                  disabled={!category || isSubmitting}
                  className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl h-11 gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Skickar...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Skicka rapport
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}