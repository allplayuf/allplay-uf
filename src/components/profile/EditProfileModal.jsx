import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  User as UserIcon, 
  MapPin, 
  Briefcase, 
  Heart, 
  Trophy, 
  Shield, 
  Globe, 
  Calendar,
  Flag,
  Languages,
  Zap,
  Target,
  Clock,
  Sparkles,
  Music,
  Instagram,
  Check
} from "lucide-react";
import { User } from "@/entities/User";

const PROFILE_SECTIONS = {
  personal: {
    title: "Personligt",
    icon: UserIcon,
    fields: [
      { key: 'bio', label: 'Bio', icon: UserIcon, type: 'textarea', placeholder: 'Berätta om dig själv...' },
      { key: 'date_of_birth', label: 'Födelsedatum', icon: Calendar, type: 'date' },
      { key: 'gender', label: 'Kön', icon: UserIcon, type: 'select', options: [
        { value: 'male', label: 'Man' },
        { value: 'female', label: 'Kvinna' },
        { value: 'non_binary', label: 'Icke-binär' },
        { value: 'prefer_not_to_say', label: 'Vill inte uppge' }
      ]},
      { key: 'nationality', label: 'Nationalitet', icon: Flag, type: 'text', placeholder: 'T.ex. Sverige' },
      { key: 'city', label: 'Stad', icon: MapPin, type: 'text', placeholder: 'T.ex. Stockholm' },
      { key: 'languages', label: 'Språk', icon: Languages, type: 'multi', placeholder: 'Svenska, Engelska...' },
      { key: 'occupation', label: 'Yrke', icon: Briefcase, type: 'text', placeholder: 'Vad jobbar du med?' },
      { key: 'interests', label: 'Intressen', icon: Heart, type: 'multi', placeholder: 'Fotboll, musik, matlagning...' },
    ]
  },
  football: {
    title: "Fotboll",
    icon: Trophy,
    fields: [
      { key: 'experience_level', label: 'Erfarenhetsnivå', icon: Target, type: 'select', options: [
        { value: 'beginner', label: 'Nybörjare' },
        { value: 'intermediate', label: 'Medel' },
        { value: 'advanced', label: 'Avancerad' },
        { value: 'pro', label: 'Professionell' }
      ]},
      { key: 'favorite_positions', label: 'Föredragna positioner', icon: Target, type: 'multi-select', options: [
        { value: 'goalkeeper', label: 'Målvakt' },
        { value: 'defender', label: 'Försvarare' },
        { value: 'midfielder', label: 'Mittfältare' },
        { value: 'forward', label: 'Anfallare' }
      ]},
      { key: 'favorite_club', label: 'Favoritlag', icon: Shield, type: 'text', placeholder: 'T.ex. AIK, Hammarby...' },
      { key: 'favorite_players', label: 'Idoler', icon: Trophy, type: 'multi', placeholder: 'Zlatan, Messi...' },
      { key: 'strengths', label: 'Styrkor', icon: Zap, type: 'multi-select', options: [
        { value: 'shooting', label: 'Skott' },
        { value: 'passing', label: 'Passningar' },
        { value: 'defense', label: 'Försvar' },
        { value: 'speed', label: 'Hastighet' },
        { value: 'stamina', label: 'Uthållighet' },
        { value: 'dribbling', label: 'Dribbling' },
        { value: 'positioning', label: 'Positionering' }
      ]},
      { key: 'favorite_stadium', label: 'Favoritarena', icon: MapPin, type: 'text', placeholder: 'T.ex. Friends Arena' },
    ]
  },
  preferences: {
    title: "Preferenser",
    icon: SlidersHorizontal,
    fields: [
      { key: 'preferred_match_types', label: 'Föredragna matchtyper', icon: Trophy, type: 'multi-select', options: [
        { value: '5v5', label: '5v5' },
        { value: '7v7', label: '7v7' },
        { value: '11v11', label: '11v11' },
        { value: 'spontaneous', label: 'Spontana' }
      ]},
      { key: 'availability', label: 'Tillgänglighet', icon: Clock, type: 'multi-select', options: [
        { value: 'weekdays', label: 'Vardagar' },
        { value: 'weekends', label: 'Helger' },
        { value: 'evenings', label: 'Kvällar' },
        { value: 'mornings', label: 'Morgnar' },
        { value: 'flexible', label: 'Flexibel' }
      ]},
      { key: 'match_languages', label: 'Matchspråk', icon: Globe, type: 'multi', placeholder: 'Svenska, Engelska...' },
    ]
  },
  social: {
    title: "Socialt",
    icon: Sparkles,
    fields: [
      { key: 'fun_fact', label: 'Rolig fakta', icon: Sparkles, type: 'text', placeholder: 'Något kul om dig!' },
      { key: 'pre_match_playlist', label: 'Pre-match playlist', icon: Music, type: 'text', placeholder: 'Spotify-länk eller namn' },
      { key: 'instagram_handle', label: 'Instagram', icon: Instagram, type: 'text', placeholder: '@dittnamn' },
    ]
  }
};

import { SlidersHorizontal } from "lucide-react";

export default function EditProfileModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({});
  const [activeSection, setActiveSection] = useState('personal');
  const [editingField, setEditingField] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user]);

  const calculateProfileCompleteness = () => {
    const allFields = Object.values(PROFILE_SECTIONS).flatMap(section => section.fields);
    const filledFields = allFields.filter(field => {
      const value = formData[field.key];
      if (Array.isArray(value)) return value.length > 0;
      return value && value.toString().trim() !== '';
    });
    return Math.round((filledFields.length / allFields.length) * 100);
  };

  const handleFieldUpdate = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setEditingField(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await User.updateMyUserData(formData);
      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Kunde inte spara profilen. Försök igen.");
    } finally {
      setIsSaving(false);
    }
  };

  const completeness = calculateProfileCompleteness();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto">
      <Card className="bg-[#121715] border border-[#223029] rounded-none sm:rounded-[20px] shadow-[0_6px_18px_rgba(0,0,0,0.22)] w-full h-full sm:h-auto sm:max-w-4xl sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <CardHeader className="border-b border-[#223029] p-4 sm:p-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-[20px] leading-[28px] sm:text-[24px] sm:leading-[32px] font-semibold text-[#F4F7F5]">
              Redigera profil
            </CardTitle>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#18221E] border border-[#223029] text-[#B6C2BC] hover:bg-[#223029] hover:text-[#F4F7F5] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[14px] leading-[20px] text-[#B6C2BC]">Profilkomplettering</span>
              <span className="text-[16px] leading-[24px] font-semibold text-[#2BA84A]">{completeness}%</span>
            </div>
            <div className="h-2 bg-[#18221E] rounded-full overflow-hidden border border-[#223029]">
              <div 
                className="h-full bg-gradient-to-r from-[#2BA84A] to-[#248232] transition-all duration-500 rounded-full"
                style={{ width: `${completeness}%` }}
              />
            </div>
            {completeness < 100 && (
              <p className="text-[13px] leading-[18px] text-[#7B8A83]">
                Fyll i mer för att matcha bättre med spelare och lag
              </p>
            )}
          </div>
        </CardHeader>

        {/* Section Tabs */}
        <div className="border-b border-[#223029] px-4 sm:px-6 flex gap-2 overflow-x-auto flex-shrink-0">
          {Object.entries(PROFILE_SECTIONS).map(([key, section]) => {
            const SectionIcon = section.icon;
            return (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`flex items-center gap-2 px-4 py-3 text-[13px] leading-[18px] font-medium transition-all whitespace-nowrap ${
                  activeSection === key
                    ? 'text-[#EAF6EE] border-b-2 border-[#2BA84A]'
                    : 'text-[#7B8A83] hover:text-[#B6C2BC]'
                }`}
              >
                <SectionIcon className="w-4 h-4" />
                {section.title}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <CardContent className="p-4 sm:p-6 space-y-3 overflow-y-auto flex-1">
          {PROFILE_SECTIONS[activeSection].fields.map(field => {
            const FieldIcon = field.icon;
            const value = formData[field.key];
            const isFilled = Array.isArray(value) ? value.length > 0 : value && value.toString().trim() !== '';

            return (
              <div
                key={field.key}
                onClick={() => setEditingField(field)}
                className="bg-[#18221E] rounded-[14px] p-4 border border-[#223029] hover:border-[#2BA84A] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isFilled ? 'bg-[#2BA84A]/16 ring-1 ring-[#2BA84A]/30' : 'bg-[#121715]'
                    }`}>
                      <FieldIcon className={`w-5 h-5 ${isFilled ? 'text-[#9FC9AC]' : 'text-[#7B8A83]'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[16px] leading-[24px] font-semibold text-[#F4F7F5] mb-0.5">
                        {field.label}
                      </div>
                      {isFilled ? (
                        <div className="text-[14px] leading-[20px] text-[#B6C2BC] truncate">
                          {Array.isArray(value) ? value.join(', ') : value}
                        </div>
                      ) : (
                        <div className="text-[13px] leading-[18px] text-[#7B8A83]">
                          {field.placeholder || 'Inte ifylld'}
                        </div>
                      )}
                    </div>
                  </div>
                  {isFilled && (
                    <div className="flex-shrink-0 w-6 h-6 bg-[#2BA84A]/16 rounded-full flex items-center justify-center ring-1 ring-[#2BA84A]/30">
                      <Check className="w-4 h-4 text-[#2BA84A]" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>

        {/* Footer */}
        <div className="border-t border-[#223029] p-4 sm:p-6 flex-shrink-0 space-y-3 bg-[#121715]">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#2BA84A]/16 px-6 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30 transition-all hover:bg-[#2BA84A]/24 hover:ring-[#2BA84A]/45 hover:scale-[1.02] active:scale-100 font-semibold disabled:opacity-50"
          >
            {isSaving ? 'Sparar...' : 'Spara och uppdatera profil'}
          </button>
          <button
            onClick={onClose}
            className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-[#223029] px-5 text-[#B6C2BC] transition-all hover:bg-[#18221E] font-semibold"
          >
            Hoppa över nu
          </button>
        </div>
      </Card>

      {/* Field Editor Modal */}
      {editingField && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <Card className="bg-[#121715] border border-[#223029] rounded-[16px] shadow-[0_6px_18px_rgba(0,0,0,0.22)] max-w-lg w-full">
            <CardHeader className="border-b border-[#223029] p-4">
              <CardTitle className="text-[18px] leading-[24px] font-semibold text-[#F4F7F5]">
                {editingField.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {editingField.type === 'textarea' && (
                <Textarea
                  value={formData[editingField.key] || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, [editingField.key]: e.target.value }))}
                  placeholder={editingField.placeholder}
                  className="min-h-[120px] bg-[#18221E] border-[#223029] text-[#F4F7F5] focus:border-[#2BA84A] rounded-[14px]"
                />
              )}
              {editingField.type === 'text' && (
                <Input
                  value={formData[editingField.key] || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, [editingField.key]: e.target.value }))}
                  placeholder={editingField.placeholder}
                  className="bg-[#18221E] border-[#223029] text-[#F4F7F5] focus:border-[#2BA84A] rounded-[14px] h-12"
                />
              )}
              {editingField.type === 'date' && (
                <Input
                  type="date"
                  value={formData[editingField.key] || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, [editingField.key]: e.target.value }))}
                  className="bg-[#18221E] border-[#223029] text-[#F4F7F5] focus:border-[#2BA84A] rounded-[14px] h-12"
                />
              )}
              {editingField.type === 'select' && (
                <div className="space-y-2">
                  {editingField.options.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setFormData(prev => ({ ...prev, [editingField.key]: opt.value }))}
                      className={`w-full p-3 rounded-[12px] text-left transition-all ${
                        formData[editingField.key] === opt.value
                          ? 'bg-[#2BA84A]/16 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30'
                          : 'bg-[#18221E] text-[#B6C2BC] hover:bg-[#223029]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
              {editingField.type === 'multi' && (
                <div className="space-y-2">
                  <Input
                    placeholder={editingField.placeholder}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        const current = formData[editingField.key] || [];
                        setFormData(prev => ({
                          ...prev,
                          [editingField.key]: [...current, e.target.value.trim()]
                        }));
                        e.target.value = '';
                      }
                    }}
                    className="bg-[#18221E] border-[#223029] text-[#F4F7F5] focus:border-[#2BA84A] rounded-[14px] h-12"
                  />
                  <div className="flex flex-wrap gap-2">
                    {(formData[editingField.key] || []).map((item, idx) => (
                      <Badge
                        key={idx}
                        className="bg-[#2BA84A]/18 text-[#CFE8D6] ring-1 ring-[#2BA84A]/25 cursor-pointer"
                        onClick={() => {
                          const current = formData[editingField.key] || [];
                          setFormData(prev => ({
                            ...prev,
                            [editingField.key]: current.filter((_, i) => i !== idx)
                          }));
                        }}
                      >
                        {item} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {editingField.type === 'multi-select' && (
                <div className="space-y-2">
                  {editingField.options.map(opt => {
                    const current = formData[editingField.key] || [];
                    const isSelected = current.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          const updated = isSelected
                            ? current.filter(v => v !== opt.value)
                            : [...current, opt.value];
                          setFormData(prev => ({ ...prev, [editingField.key]: updated }));
                        }}
                        className={`w-full p-3 rounded-[12px] text-left transition-all ${
                          isSelected
                            ? 'bg-[#2BA84A]/16 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30'
                            : 'bg-[#18221E] text-[#B6C2BC] hover:bg-[#223029]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          {opt.label}
                          {isSelected && <Check className="w-4 h-4 text-[#2BA84A]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    handleFieldUpdate(editingField.key, formData[editingField.key]);
                  }}
                  className="flex-1 inline-flex h-11 items-center justify-center rounded-[14px] bg-[#2BA84A]/16 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30 transition-all hover:bg-[#2BA84A]/24 font-semibold"
                >
                  Spara
                </button>
                <button
                  onClick={() => setEditingField(null)}
                  className="flex-1 inline-flex h-11 items-center justify-center rounded-[14px] border border-[#223029] text-[#B6C2BC] transition-all hover:bg-[#18221E] font-semibold"
                >
                  Avbryt
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}