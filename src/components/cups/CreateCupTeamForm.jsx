import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, X, Sparkles, Trophy, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useCustomDialog } from "../ui/custom-dialog";
import { CUPS_QUERY_KEY } from "../dashboard/CupsWidget";

const TEAM_COLORS = [
  { color: '#F59E0B', name: 'Guld' },
  { color: '#2BA84A', name: 'Grön' },
  { color: '#F4743B', name: 'Orange' },
  { color: '#4169E1', name: 'Blå' },
  { color: '#9370DB', name: 'Lila' },
  { color: '#DC2626', name: 'Röd' },
  { color: '#14B8A6', name: 'Turkos' },
  { color: '#EC4899', name: 'Rosa' }
];

export default function CreateCupTeamForm({ cup, onClose, onSuccess }) {
  const { alert, DialogContainer } = useCustomDialog();
  const queryClient = useQueryClient();
  
  const [teamName, setTeamName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#F59E0B');

  const createTeamMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('cups/createCupTeam', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cupDetails', cup.id] });
      queryClient.invalidateQueries({ queryKey: CUPS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['userTeams'] });
      alert('Lag skapat! 🎉', 'Ditt cup-lag har skapats och anmälts till turneringen!', { type: 'success' });
      onSuccess?.(data.team);
    },
    onError: (error) => {
      alert('Ett fel uppstod', error.response?.data?.error || 'Kunde inte skapa laget.', { type: 'alert' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!teamName || teamName.trim().length < 3) {
      alert('Ogiltigt lagnamn', 'Lagnamnet måste vara minst 3 tecken.', { type: 'alert' });
      return;
    }

    createTeamMutation.mutate({
      cup_id: cup.id,
      team_name: teamName.trim(),
      team_color: selectedColor
    });
  };

  return (
    <>
      <DialogContainer />
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-end lg:items-center justify-center z-[60] p-0">
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="bg-[#121715] rounded-t-[20px] lg:rounded-2xl w-full lg:max-w-lg border border-[#223029] shadow-2xl mb-16 lg:mb-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#223029]">
            <div>
              <h2 className="text-xl font-bold text-[#F4F7F5] mb-1">Skapa Cup-Lag</h2>
              <p className="text-sm text-[#B6C2BC]">För {cup.name}</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#18221E] transition-colors text-[#7B8A83] hover:text-[#F4F7F5]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Team Name */}
            <div className="space-y-3">
              <Label className="text-[#F4F7F5] font-semibold text-base">Lagnamn</Label>
              <Input
                placeholder="t.ex. Stormarna, FC Gänget..."
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="h-12 bg-[#18221E] border-[#223029] text-[#F4F7F5] placeholder:text-[#7B8A83] focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/30 text-base"
                required
                autoFocus
                maxLength={50}
              />
            </div>

            {/* Team Color */}
            <div className="space-y-3">
              <Label className="text-[#F4F7F5] font-semibold text-base">Välj lagfärg</Label>
              <div className="grid grid-cols-4 gap-3">
                {TEAM_COLORS.map(({ color, name }) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`h-16 rounded-xl border-3 transition-all ${
                      selectedColor === color
                        ? 'border-[#F4F7F5] scale-105 shadow-[0_6px_20px_rgba(0,0,0,0.4)]'
                        : 'border-[#223029] hover:scale-105 hover:border-[#7B8A83]'
                    }`}
                    style={{ backgroundColor: color }}
                    title={name}
                  >
                    {selectedColor === color && (
                      <CheckCircle className="w-7 h-7 text-white drop-shadow-lg mx-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-[#2BA84A]/10 border border-[#2BA84A]/30 rounded-xl">
              <p className="text-sm text-[#CFE8D6] leading-relaxed">
                <strong className="text-[#EAF6EE]">✓</strong> Du blir lagkapten automatiskt<br/>
                <strong className="text-[#EAF6EE]">✓</strong> Bjud in vänner efter att laget skapats<br/>
                <strong className="text-[#EAF6EE]">✓</strong> Laget anmäls direkt till turneringen
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={createTeamMutation.isPending || !teamName.trim()}
              className="w-full h-14 bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#F59E0B] text-white font-bold text-base rounded-xl shadow-xl gap-2 transition-all hover:scale-[1.02]"
            >
              {createTeamMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Skapar lag...
                </>
              ) : (
                <>
                  <Trophy className="w-5 h-5" />
                  Skapa lag & anmäl
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </>
  );
}