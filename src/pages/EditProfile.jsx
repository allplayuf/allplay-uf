import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  User as UserIcon,
  Trophy,
  Shield,
  Zap,
  Target,
  Sparkles,
  Instagram,
  Check,
  X,
  TrendingUp,
  Crown,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Nybörjare', icon: Target, color: 'from-[#10B981] to-[#059669]', textColor: 'text-[#A7F3D0]' },
  { value: 'intermediate', label: 'Medel', icon: TrendingUp, color: 'from-[#14B8A6] to-[#0D9488]', textColor: 'text-[#99F6E4]' },
  { value: 'advanced', label: 'Avancerad', icon: Shield, color: 'from-[#8B5CF6] to-[#7C3AED]', textColor: 'text-[#DDD6FE]' },
  { value: 'elite', label: 'Elit', icon: Crown, color: 'from-[#F59E0B] to-[#D97706]', textColor: 'text-[#FDE68A]' }
];

const POSITIONS = ['goalkeeper', 'defender', 'midfielder', 'forward'];
const MATCH_TYPES = ['5v5', '7v7', '11v11', 'spontaneous'];
const AVAILABILITY = ['weekdays', 'weekends', 'evenings', 'mornings', 'flexible'];

export default function EditProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [completeness, setCompleteness] = useState(0);
  const [nameError, setNameError] = useState('');

  const calculateCompleteness = useCallback(() => {
    const fields = [
      'full_name', 'bio', 'date_of_birth', 'gender', 'nationality', 'city', 'favorite_club', 'skill_level'
    ];

    const arrayFields = ['favorite_positions', 'preferred_match_types', 'availability'];

    let filled = 0;
    let total = fields.length + arrayFields.length;

    fields.forEach((field) => {
      if (formData[field] && formData[field].toString().trim() !== '') filled++;
    });

    arrayFields.forEach((field) => {
      if (formData[field] && formData[field].length > 0) filled++;
    });

    setCompleteness(Math.round(filled / total * 100));
  }, [formData]);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    calculateCompleteness();
  }, [calculateCompleteness]);

  const loadUserData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setFormData({
        full_name: currentUser.display_name || currentUser.full_name || '',
        bio: currentUser.bio || '',
        date_of_birth: currentUser.date_of_birth || '',
        gender: currentUser.gender || '',
        nationality: currentUser.nationality || '',
        city: currentUser.city || '',
        skill_level: currentUser.skill_level || 'intermediate',
        favorite_club: currentUser.favorite_club || '',
        favorite_positions: currentUser.favorite_positions || [],
        preferred_match_types: currentUser.preferred_match_types || [],
        availability: currentUser.availability || [],
        publicProfile: currentUser.publicProfile ?? true,
        blocked: currentUser.blocked ?? false
      });
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateName = async (name) => {
    if (!name || name.trim().length < 2) {
      return 'Namnet måste vara minst 2 tecken';
    }

    if (name.trim().length > 50) {
      return 'Namnet får inte vara längre än 50 tecken';
    }

    return null;
  };

  const handleNameChange = async (newName) => {
    setFormData(prev => ({ ...prev, full_name: newName }));
    
    // Clear error when typing
    if (nameError) {
      setNameError('');
    }

    // Validate after a short delay (debounce)
    if (newName.trim().length > 0) {
      setTimeout(async () => {
        const error = await validateName(newName);
        setNameError(error || '');
      }, 500);
    }
  };

  const handleSave = async () => {
    // Validate name before saving
    const nameValidationError = await validateName(formData.full_name);
    if (nameValidationError) {
      setNameError(nameValidationError);
      alert(nameValidationError);
      return;
    }

    setIsSaving(true);
    try {
      // Check for profanity in bio
      if (formData.bio) {
        const profanityCheck = await base44.functions.invoke('profanityFilter', { 
          text: formData.bio, 
          field: 'bio' 
        });
        
        if (profanityCheck && profanityCheck.hasProfanity) {
          alert('Din bio innehåller olämpligt språk. Vänligen ändra det innan du sparar.');
          setIsSaving(false);
          return;
        }
      }

      // Update profile data including display_name
      await base44.auth.updateMe({
        full_name: formData.full_name.trim(),
        display_name: formData.full_name.trim(),
        bio: formData.bio,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        nationality: formData.nationality,
        city: formData.city,
        cityNormalized: formData.city ? formData.city.trim().toLowerCase() : undefined,
        skill_level: formData.skill_level,
        favorite_club: formData.favorite_club,
        favorite_positions: formData.favorite_positions,
        preferred_match_types: formData.preferred_match_types,
        availability: formData.availability,
        publicProfile: formData.publicProfile === true || formData.publicProfile === 'true',
        blocked: formData.blocked === true || formData.blocked === 'true'
      });
      
      // Force immediate cache invalidation
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user'] }),
        queryClient.invalidateQueries({ queryKey: ['publicUsers'] }),
        queryClient.invalidateQueries({ queryKey: ['participants'] }),
        queryClient.invalidateQueries({ queryKey: ['allParticipants'] }),
        queryClient.invalidateQueries({ queryKey: ['matches'] }),
        queryClient.invalidateQueries({ queryKey: ['matches-infinite'] }),
        queryClient.invalidateQueries({ queryKey: ['friendships'] })
      ]);
      queryClient.refetchQueries({ queryKey: ['user'] });
      
      alert('Profil uppdaterad!');
      navigate(createPageUrl("Profile"));
    } catch (error) {
      console.error("Error updating profile:", error);
      alert('Kunde inte uppdatera profilen. Försök igen.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleArrayItem = (field, value) => {
    const current = formData[field] || [];
    if (current.includes(value)) {
      setFormData((prev) => ({
        ...prev,
        [field]: current.filter((item) => item !== value)
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: [...current, value]
      }));
    }
  };

  const addCustomItem = (field, value) => {
    if (!value.trim()) return;
    const current = formData[field] || [];
    if (!current.includes(value.trim())) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...current, value.trim()]
      }));
    }
  };

  const removeCustomItem = (field, value) => {
    const current = formData[field] || [];
    setFormData((prev) => ({
      ...prev,
      [field]: current.filter((item) => item !== value)
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F1513] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#2BA84A] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[#F4F7F5] text-sm font-medium">Laddar profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="sticky top-0 z-40 bg-[#0F1513]/95 backdrop-blur-md border-b border-[#223029] p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(createPageUrl("Profile"))}
              className="flex items-center gap-2 text-[#B6C2BC] hover:text-[#F4F7F5] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium text-sm sm:text-base">Tillbaka</span>
            </button>
            <h1 className="text-lg sm:text-xl font-semibold text-[#F4F7F5]">
              Redigera profil
            </h1>
            <button
              onClick={handleSave}
              disabled={isSaving || !!nameError}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#2BA84A] px-4 text-sm font-semibold text-white transition-all hover:bg-[#248232] disabled:opacity-50"
            >
              {isSaving ? 'Sparar...' : 'Spara'}
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          
          {/* Progress Card */}
          <Card className="bg-gradient-to-br from-[#2BA84A]/20 to-[#0F2917]/20 border border-[#2BA84A]/30 rounded-2xl shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-[#F4F7F5]">Profilkomplettering</h3>
                  <p className="text-xs text-[#B6C2BC]">
                    Fyll i mer info för att matcha bättre med spelare
                  </p>
                </div>
                <div className="text-2xl font-bold text-[#2BA84A]">
                  {completeness}%
                </div>
              </div>
              <div className="w-full bg-[#18221E] rounded-full h-2.5 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-[#2BA84A] to-[#248232] h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${completeness}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              {completeness === 100 && (
                <div className="mt-3 flex items-center gap-2 text-xs text-[#2BA84A] font-medium">
                  <Check className="w-4 h-4" />
                  Din profil är komplett! 🎉
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECTION: Personligt */}
          <Card className="bg-[#121715] border border-[#223029] rounded-2xl shadow-lg">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2BA84A]/10 rounded-xl flex items-center justify-center ring-1 ring-[#2BA84A]/20">
                  <UserIcon className="w-5 h-5 text-[#2BA84A]" />
                </div>
                <h2 className="text-lg font-semibold text-[#F4F7F5]">Personligt</h2>
              </div>

              {/* Full Name */}
              <div>
                <Label className="text-[#F4F7F5] font-semibold mb-2 block text-sm">Namn</Label>
                <Input
                  placeholder="Ditt fullständiga namn"
                  value={formData.full_name || ''}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`bg-[#18221E] border ${nameError ? 'border-red-500' : 'border-[#223029]'} text-[#F4F7F5] placeholder:text-[#7B8A83] focus:border-[#2BA84A] rounded-xl h-11 text-sm`}
                  maxLength={50}
                />
                {nameError && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    {nameError}
                  </div>
                )}
                <p className="text-xs text-[#7B8A83] text-right mt-1">
                  {(formData.full_name || '').length}/50
                </p>
              </div>

              {/* Bio */}
              <div>
                <Label className="text-[#F4F7F5] font-semibold mb-2 block text-sm">Bio</Label>
                <Textarea
                  placeholder="Berätta om dig själv..."
                  value={formData.bio || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                  className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] placeholder:text-[#7B8A83] focus:border-[#2BA84A] rounded-xl h-24 resize-none text-sm"
                  maxLength={300}
                />
                <p className="text-xs text-[#7B8A83] text-right mt-1">
                  {(formData.bio || '').length}/300
                </p>
              </div>

              {/* Date of Birth */}
              <div>
                <Label className="text-[#F4F7F5] font-semibold mb-2 block text-sm">Födelsedatum</Label>
                <Input
                  type="date"
                  value={formData.date_of_birth || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                  className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] focus:border-[#2BA84A] rounded-xl h-11 text-sm"
                />
              </div>

              {/* Gender */}
              <div>
                <Label className="text-[#F4F7F5] font-semibold mb-2 block text-sm">Kön</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'male', label: 'Man' },
                    { value: 'female', label: 'Kvinna' },
                    { value: 'non_binary', label: 'Icke-binär' },
                    { value: 'prefer_not_to_say', label: 'Vill ej ange' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFormData((prev) => ({ ...prev, gender: option.value }))}
                      className={`h-11 rounded-xl font-semibold text-xs transition-all ${
                        formData.gender === option.value ?
                        'bg-[#2BA84A]/16 text-[#EAF6EE] ring-1 ring-[#2BA84A]/30' :
                        'bg-[#18221E] text-[#B6C2BC] border border-[#223029] hover:border-[#2BA84A]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nationality & City */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#F4F7F5] font-semibold mb-2 block text-sm">Nationalitet</Label>
                  <Input
                    placeholder="T.ex. Sverige"
                    value={formData.nationality || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nationality: e.target.value }))}
                    className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] placeholder:text-[#7B8A83] focus:border-[#2BA84A] rounded-xl h-11 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-[#F4F7F5] font-semibold mb-2 block text-sm">Stad</Label>
                  <Input
                    placeholder="T.ex. Stockholm"
                    value={formData.city || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                    className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] placeholder:text-[#7B8A83] focus:border-[#2BA84A] rounded-xl h-11 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION: Fotboll */}
          <Card className="bg-[#121715] border border-[#223029] rounded-2xl shadow-lg">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2BA84A]/10 rounded-xl flex items-center justify-center ring-1 ring-[#2BA84A]/20">
                  <Trophy className="w-5 h-5 text-[#2BA84A]" />
                </div>
                <h2 className="text-lg font-semibold text-[#F4F7F5]">Fotboll</h2>
              </div>

              {/* Skill Level */}
              <div>
                <Label className="text-[#F4F7F5] font-semibold mb-3 block text-sm">Spelnivå</Label>
                <div className="grid grid-cols-2 gap-3">
                  {SKILL_LEVELS.map((level) => {
                    const Icon = level.icon;
                    return (
                      <button
                        key={level.value}
                        onClick={() => setFormData((prev) => ({ ...prev, skill_level: level.value }))}
                        className={`p-3 rounded-xl font-semibold text-xs transition-all border flex flex-col items-center gap-2 ${
                          formData.skill_level === level.value ?
                          `bg-gradient-to-br ${level.color} ${level.textColor} border-transparent shadow-lg` :
                          'bg-[#18221E] text-[#B6C2BC] border-[#223029] hover:border-[#2BA84A]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {level.label.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Favorite Club */}
              <div>
                <Label className="text-[#F4F7F5] font-semibold mb-2 block text-sm">Favoritklubb</Label>
                <Input
                  placeholder="T.ex. AIK, Hammarby..."
                  value={formData.favorite_club || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, favorite_club: e.target.value }))}
                  className="bg-[#18221E] border border-[#223029] text-[#F4F7F5] placeholder:text-[#7B8A83] focus:border-[#2BA84A] rounded-xl h-11 text-sm"
                />
              </div>

              {/* Favorite Positions */}
              <div>
                <Label className="text-[#F4F7F5] font-semibold mb-2 block text-sm">Föredragna positioner</Label>
                <div className="flex flex-wrap gap-2">
                  {POSITIONS.map((pos) => (
                    <button
                      key={pos}
                      onClick={() => toggleArrayItem('favorite_positions', pos)}
                      className={`h-9 px-3 rounded-full font-semibold text-xs capitalize transition-all ${
                        (formData.favorite_positions || []).includes(pos) ?
                        'bg-[#2BA84A]/16 text-[#CFE8D6] ring-1 ring-[#2BA84A]/25' :
                        'bg-[#18221E] text-[#B6C2BC] border border-[#223029] hover:border-[#2BA84A]'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION: Preferenser */}
          <Card className="bg-[#121715] border border-[#223029] rounded-2xl shadow-lg">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2BA84A]/10 rounded-xl flex items-center justify-center ring-1 ring-[#2BA84A]/20">
                  <Zap className="w-5 h-5 text-[#2BA84A]" />
                </div>
                <h2 className="text-lg font-semibold text-[#F4F7F5]">Preferenser</h2>
              </div>

              {/* Preferred Match Types */}
              <div>
                <Label className="text-[#F4F7F5] font-semibold mb-2 block text-sm">Föredragna matchtyper</Label>
                <div className="flex flex-wrap gap-2">
                  {MATCH_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleArrayItem('preferred_match_types', type)}
                      className={`h-9 px-3 rounded-full font-semibold text-xs transition-all ${
                        (formData.preferred_match_types || []).includes(type) ?
                        'bg-[#2BA84A]/16 text-[#CFE8D6] ring-1 ring-[#2BA84A]/25' :
                        'bg-[#18221E] text-[#B6C2BC] border border-[#223029] hover:border-[#2BA84A]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div>
                <Label className="text-[#F4F7F5] font-semibold mb-2 block text-sm">Tillgänglighet</Label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABILITY.map((time) => (
                    <button
                      key={time}
                      onClick={() => toggleArrayItem('availability', time)}
                      className={`h-9 px-3 rounded-full font-semibold text-xs capitalize transition-all ${
                        (formData.availability || []).includes(time) ?
                        'bg-[#2BA84A]/16 text-[#CFE8D6] ring-1 ring-[#2BA84A]/25' :
                        'bg-[#18221E] text-[#B6C2BC] border border-[#223029] hover:border-[#2BA84A]'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Sticky Bottom Actions */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0F1513] via-[#0F1513] to-transparent lg:hidden">
            <div className="max-w-4xl mx-auto">
              <button
                onClick={handleSave}
                disabled={isSaving || !!nameError}
                className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2BA84A] text-base font-semibold text-white transition-all hover:bg-[#248232] disabled:opacity-50"
              >
                {isSaving ? 'Sparar...' : 'Spara ändringar'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}