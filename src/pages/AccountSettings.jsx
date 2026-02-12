import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Trash2,
  Bell,
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
  Check,
  Loader2,
  Lock,
  Mail,
  FileText,
  ShieldCheck,
  ExternalLink
} from "lucide-react";
import { useCustomDialog } from "../components/ui/custom-dialog";
import { CONSENT_VERSION } from "../components/legal/consentConstants";
import { useSupabaseAuth } from "../components/supabase/AuthProvider";
import { getMyProfile } from "../components/supabase/services/usersService";
import { callEdgeFunction } from "../components/supabase/callEdgeFunction";

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirm, alert, DialogContainer } = useCustomDialog();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [settings, setSettings] = useState({
    marketing_opt_in: false,
    publicProfile: true,
    hide_exact_location: false
  });

  const { user: authUser, isAuthenticated, logout } = useSupabaseAuth();

  // Use Supabase profile for settings data
  const { data: user, isLoading } = useQuery({
    queryKey: ['supabase-userProfile', authUser?.id],
    queryFn: async () => {
      const profile = await getMyProfile();
      // Merge auth user with profile for complete data
      return profile ? { ...authUser, ...profile } : authUser;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    retry: false,
    enabled: isAuthenticated && !!authUser?.id,
  });

  useEffect(() => {
    if (user) {
      setSettings({
        marketing_opt_in: user.marketing_opt_in || false,
        publicProfile: user.publicProfile !== false,
        hide_exact_location: user.hide_exact_location || user.is_minor || false
      });
    }
  }, [user]);

  const handleSettingChange = async (key, value) => {
    // Minors cannot disable location hiding
    if (key === 'hide_exact_location' && user?.is_minor && !value) {
      await alert(
        'Skydd för minderåriga', 
        'Som minderårig användare kan du inte visa din exakta position för andra användare.',
        { type: 'info' }
      );
      return;
    }

    setSettings(prev => ({ ...prev, [key]: value }));
    
    try {
      await callEdgeFunction('update_profile', { [key]: value });
      queryClient.invalidateQueries({ queryKey: ['supabase-userProfile'] });
    } catch (error) {
      console.error("Error updating setting:", error);
      // Revert on error
      setSettings(prev => ({ ...prev, [key]: !value }));
      await alert('Fel', 'Kunde inte uppdatera inställning. Försök igen.', { type: 'alert' });
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmEmail !== user?.email) {
      await alert('Fel e-post', 'E-postadressen matchar inte ditt konto.', { type: 'alert' });
      return;
    }

    const shouldDelete = await confirm(
      '⚠️ Radera konto permanent',
      'Detta går INTE att ångra. Ditt konto kommer att raderas efter 30 dagar. Under den tiden kan du återaktivera kontot genom att logga in igen.',
      {
        type: 'warning',
        confirmText: 'Ja, radera mitt konto',
        cancelText: 'Avbryt'
      }
    );

    if (!shouldDelete) return;

    setIsDeleting(true);
    try {
      const { data: response } = await base44.functions.invoke('deleteAccount', {
        confirmEmail: deleteConfirmEmail
      });

      if (response?.success) {
        await alert(
          'Konto markerat för radering',
          `Ditt konto kommer att raderas ${new Date(response.deletion_scheduled).toLocaleDateString('sv-SE')}. Du kommer nu att loggas ut.`,
          { type: 'success' }
        );
        
        // Logout user
        logout();
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      await alert('Fel', 'Kunde inte radera konto. Försök igen.', { type: 'alert' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F1513] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#2BA84A] animate-spin mx-auto" />
          <p className="text-[#F4F7F5]">Laddar inställningar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <DialogContainer />
      
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-[#0F1513]/95 backdrop-blur-md border-b border-[#223029] p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(createPageUrl("Profile"))}
              className="flex items-center gap-2 text-[#B6C2BC] hover:text-[#F4F7F5] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-[#F4F7F5]">Kontoinställningar</h1>
          </div>
        </div>

        <div className="p-4 space-y-6">
          
          {/* Privacy Settings */}
          <Card className="bg-[#121715] border border-[#223029] rounded-2xl">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#2BA84A]/10 rounded-xl flex items-center justify-center ring-1 ring-[#2BA84A]/20">
                  <Shield className="w-5 h-5 text-[#2BA84A]" />
                </div>
                <h2 className="text-lg font-semibold text-[#F4F7F5]">Integritet</h2>
              </div>

              {/* Public Profile */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-[#F4F7F5] font-semibold">Offentlig profil</Label>
                  <p className="text-sm text-[#7B8A83]">
                    Låt andra spelare se din profil och statistik
                  </p>
                </div>
                <Switch
                  checked={settings.publicProfile}
                  onCheckedChange={(checked) => handleSettingChange('publicProfile', checked)}
                />
              </div>

              {/* Hide Exact Location */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-[#F4F7F5] font-semibold">Dölj exakt position</Label>
                  <p className="text-sm text-[#7B8A83]">
                    Visa endast ungefärlig position (obligatoriskt för minderåriga)
                  </p>
                  {user?.is_minor && (
                    <p className="text-xs text-[#F4743B] mt-1 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Aktivt för din säkerhet
                    </p>
                  )}
                </div>
                <Switch
                  checked={settings.hide_exact_location}
                  onCheckedChange={(checked) => handleSettingChange('hide_exact_location', checked)}
                  disabled={user?.is_minor}
                />
              </div>
            </CardContent>
          </Card>

          {/* Communication Settings */}
          <Card className="bg-[#121715] border border-[#223029] rounded-2xl">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#F4743B]/10 rounded-xl flex items-center justify-center ring-1 ring-[#F4743B]/20">
                  <Bell className="w-5 h-5 text-[#F4743B]" />
                </div>
                <h2 className="text-lg font-semibold text-[#F4F7F5]">Kommunikation</h2>
              </div>

              {/* Marketing Opt-in */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-[#F4F7F5] font-semibold">Produktnyheter & erbjudanden</Label>
                  <p className="text-sm text-[#7B8A83]">
                    Få tips, nyheter och erbjudanden via e-post
                  </p>
                </div>
                <Switch
                  checked={settings.marketing_opt_in}
                  onCheckedChange={(checked) => handleSettingChange('marketing_opt_in', checked)}
                />
              </div>

              <div className="pt-2 border-t border-[#223029]">
                <p className="text-xs text-[#7B8A83]">
                  Servicerelaterade notiser (matchpåminnelser, laghändelser) skickas alltid.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Legal / ToS */}
          <Card className="bg-[#121715] border border-[#223029] rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#2BA84A]/10 rounded-xl flex items-center justify-center ring-1 ring-[#2BA84A]/20">
                  <ShieldCheck className="w-5 h-5 text-[#2BA84A]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#F4F7F5]">Användarvillkor & Integritetspolicy</h2>
                  <p className="text-sm text-[#7B8A83]">Läs våra villkor och policy</p>
                </div>
              </div>

              {user?.tos_version_accepted && (
                <div className="bg-[#2BA84A]/5 border border-[#2BA84A]/20 rounded-xl p-3 mb-4">
                  <p className="text-sm text-[#B6C2BC]">
                    <span className="text-[#2BA84A] font-medium">Senast godkänd:</span>{' '}
                    {user.tos_version_accepted}
                    {user.tos_accepted_at && (
                      <span className="text-[#7B8A83]">
                        {' '}({new Date(user.tos_accepted_at).toLocaleDateString('sv-SE')})
                      </span>
                    )}
                  </p>
                </div>
              )}

              <Button
                onClick={() => navigate(createPageUrl("LegalPolicy"))}
                variant="outline"
                className="w-full border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] rounded-xl h-11 gap-2"
              >
                <FileText className="w-4 h-4" />
                Visa fullständiga villkor
                <ExternalLink className="w-3 h-3 ml-auto" />
              </Button>
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card className="bg-[#121715] border border-red-500/30 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center ring-1 ring-red-500/20">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#F4F7F5]">Ta bort konto</h2>
                  <p className="text-sm text-[#7B8A83]">Permanent radera ditt konto och all data</p>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-200">
                    <p className="font-semibold mb-1">Varning!</p>
                    <ul className="list-disc list-inside space-y-1 text-red-300">
                      <li>Ditt konto raderas permanent efter 30 dagars väntetid</li>
                      <li>All data förutom anonymiserad matchhistorik raderas</li>
                      <li>Du förlorar alla badges, ELO och statistik</li>
                      <li>Du tas bort från alla lag</li>
                    </ul>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {!showDeleteConfirm ? (
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="outline"
                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl h-11"
                  >
                    Ta bort mitt konto
                  </Button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <Label className="text-[#F4F7F5] font-semibold mb-2 block">
                        Bekräfta med din e-postadress
                      </Label>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#7B8A83]" />
                        <span className="text-sm text-[#7B8A83]">{user?.email}</span>
                      </div>
                      <Input
                        type="email"
                        placeholder="Skriv din e-postadress"
                        value={deleteConfirmEmail}
                        onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                        className="mt-2 bg-[#18221E] border-red-500/30 text-[#F4F7F5] placeholder:text-[#7B8A83] focus:border-red-500 rounded-xl h-11"
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmEmail('');
                        }}
                        variant="outline"
                        className="flex-1 border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] rounded-xl h-11"
                      >
                        Avbryt
                      </Button>
                      <Button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting || deleteConfirmEmail !== user?.email}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl h-11 disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Raderar...
                          </>
                        ) : (
                          'Radera permanent'
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}