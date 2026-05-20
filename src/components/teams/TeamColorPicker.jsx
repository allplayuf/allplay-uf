import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette, Check } from "lucide-react";
import { updateTeam } from "@/components/supabase/services";
import feedback from "@/components/ui/feedback-toast";

const TEAM_COLORS = [
  { 
    name: 'Grön', 
    primary: '#2BA84A',
    light: '#34C759',
    dark: '#0F2917',
    gradient: 'from-[#2BA84A] to-[#0F2917]',
    circleLightBg: 'bg-[#2BA84A]/40',
    circleDarkBg: 'bg-[#0F2917]/60'
  },
  { 
    name: 'Orange', 
    primary: '#F4743B',
    light: '#FF8A65',
    dark: '#BF360C',
    gradient: 'from-[#F4743B] to-[#BF360C]',
    circleLightBg: 'bg-[#F4743B]/40',
    circleDarkBg: 'bg-[#BF360C]/60'
  },
  { 
    name: 'Blå', 
    primary: '#4169E1',
    light: '#5B8EFF',
    dark: '#0D1B4D',
    gradient: 'from-[#4169E1] to-[#0D1B4D]',
    circleLightBg: 'bg-[#4169E1]/40',
    circleDarkBg: 'bg-[#0D1B4D]/60'
  },
  { 
    name: 'Lila', 
    primary: '#9370DB',
    light: '#B19CD9',
    dark: '#2E1A47',
    gradient: 'from-[#9370DB] to-[#2E1A47]',
    circleLightBg: 'bg-[#9370DB]/40',
    circleDarkBg: 'bg-[#2E1A47]/60'
  },
  { 
    name: 'Guld', 
    primary: '#FFD700',
    light: '#FFED4E',
    dark: '#4D3A00',
    gradient: 'from-[#FFD700] to-[#4D3A00]',
    circleLightBg: 'bg-[#FFD700]/40',
    circleDarkBg: 'bg-[#4D3A00]/60'
  },
  { 
    name: 'Röd', 
    primary: '#DC2626',
    light: '#EF4444',
    dark: '#450A0A',
    gradient: 'from-[#DC2626] to-[#450A0A]',
    circleLightBg: 'bg-[#DC2626]/40',
    circleDarkBg: 'bg-[#450A0A]/60'
  },
  { 
    name: 'Turkos', 
    primary: '#14B8A6',
    light: '#2DD4BF',
    dark: '#042F2E',
    gradient: 'from-[#14B8A6] to-[#042F2E]',
    circleLightBg: 'bg-[#14B8A6]/40',
    circleDarkBg: 'bg-[#042F2E]/60'
  },
  { 
    name: 'Rosa', 
    primary: '#EC4899',
    light: '#F472B6',
    dark: '#4A0E29',
    gradient: 'from-[#EC4899] to-[#4A0E29]',
    circleLightBg: 'bg-[#EC4899]/40',
    circleDarkBg: 'bg-[#4A0E29]/60'
  }
];

export default function TeamColorPicker({ team, onColorChange, isCaptain }) {
  const [selectedColor, setSelectedColor] = useState(
    TEAM_COLORS.find(c => c.primary === team.teamColor) || TEAM_COLORS[0]
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleColorSelect = async (color) => {
    if (!isCaptain) return;

    setSelectedColor(color);
    setIsSaving(true);

    try {
      await updateTeam(team.id, { teamColor: color.primary });
      onColorChange?.(color);
      feedback.success('Lagfärg uppdaterad');
    } catch (error) {
      feedback.error(error.message || 'Kunde inte uppdatera färg');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isCaptain) {
    return null;
  }

  return (
    <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-2xl">
      <CardHeader className="border-b border-[#223029]">
        <CardTitle className="text-lg text-[#F4F7F5] flex items-center gap-2">
          <Palette className="w-5 h-5 text-[#2BA84A]" />
          Lagfärg
        </CardTitle>
        <p className="text-sm text-[#B6C2BC] mt-2">
          Välj en färg som representerar ditt lag
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-4 gap-3">
          {TEAM_COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => handleColorSelect(color)}
              disabled={isSaving}
              className={`relative h-16 rounded-xl transition-all duration-200 ${
                selectedColor.primary === color.primary 
                  ? 'ring-4 ring-[#F4F7F5] ring-offset-2 ring-offset-[#121715] scale-110' 
                  : 'hover:scale-105 hover:ring-2 hover:ring-[#F4F7F5]/50'
              }`}
              style={{
                background: `linear-gradient(135deg, ${color.primary} 0%, ${color.dark} 100%)`
              }}
            >
              {selectedColor.primary === color.primary && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-[#0F1513]" />
                  </div>
                </div>
              )}
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-[#B6C2BC] whitespace-nowrap">
                {color.name}
              </span>
            </button>
          ))}
        </div>
        
        {isSaving && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-[#B6C2BC]">
              <div className="w-4 h-4 border-2 border-[#2BA84A] border-t-transparent rounded-full animate-spin"></div>
              Sparar...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}