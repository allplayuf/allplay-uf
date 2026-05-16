import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, Trash2, Bell, Shield, Mail,
  FileText, ShieldCheck, ExternalLink, AlertTriangle,
  Loader2, ChevronRight, Globe, LogOut, PlayCircle
} from "lucide-react";
import { ONBOARDING_STORAGE_KEY, ONBOARDING_EVENT } from "@/components/ui/onboarding-modal";
import { triggerHaptic } from "@/components/utils/motionTokens";
import { useCustomDialog } from "../components/ui/custom-dialog";
import { useSupabaseAuth } from "../components/supabase/AuthProvider";
import { getMyProfile } from "../components/supabase/services/usersService";
import { callEdgeFunction } from "../components/supabase/callEdgeFunction";
import NotificationToggle from "../components/profile/NotificationToggle";
import { isPushSupported } from "@/lib/pushNotifications";
import { useT } from "@/i18n/LanguageProvider";
import { Languages } from "lucide-react";

/**
 * Account Settings v2 — premium, tighter, football-first.
 *
 *   • Sectioned cards with colored icon tiles (matches rest of app)
 *   • Premium toggle rows (clickable full-width, not just the switch)
 *   • Collapsible destructive action with email confirmation
 *   • Mobile-first spacing, consistent with Profile/Community
 */

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirm, alert, DialogContainer } = useCustomDialog();
  const { t, lang, setLang } = useT();

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [settings, setSettings] = useState({
    is_public: true,
  });

  const { user: authUser, isAuthenticated, logout } = useSupabaseAuth();

  const { data: user, isLoading } = useQuery({
    queryKey: ['supabase-userProfile', authUser?.id],
    queryFn: async () => {
      const profile = await getMyProfile();
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
        is_public: user.is_public !== false,
      });
    }
  }, [user]);

  const handleSettingChange = async (key, value) => {
    const prevSettings = { ...settings };
    setSettings(prev => ({ ...prev, [key]: value }));

    try {
      await callEdgeFunction('update_profile', { [key]: value });
      queryClient.invalidateQueries({ queryKey: ['supabase-userProfile'] });
    } catch (error) {
      console.error("Error updating setting:", error);
      setSettings(prevSettings);
      await alert('Fel', 'Det gick inte att uppdatera profilinställningen. Försök igen.', { type: 'alert' });
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmEmail !== user?.email) {
      await alert('Fel e-post', 'E-postadressen matchar inte ditt konto.', { type: 'alert' });
      return;
    }

    const shouldDelete = await confirm(
      'Radera konto permanent',
      'Detta går INTE att ångra. All din data raderas permanent. Är du helt säker?',
      { type: 'warning', confirmText: 'Ja, radera mitt konto', cancelText: 'Avbryt' }
    );
    if (!shouldDelete) return;

    setIsDeleting(true);
    try {
      await callEdgeFunction('delete_account', {});
      await alert('Ditt konto är raderat', 'Kontot har raderats. Du loggas nu ut.', { type: 'success' });
      logout();
    } catch (error) {
      console.error("Error deleting account:", error);
      let msg;
      if (error.status === 401) msg = 'Du måste vara inloggad.';
      else if (error.status === 500 && (error.data?.message || '').toLowerCase().includes('misconfigured'))
        msg = 'Det gick inte att radera kontot just nu. Försök igen senare.';
      else msg = error.message || 'Det gick inte att radera kontot. Försök igen.';
      await alert('Kunde inte radera konto', msg, { type: 'alert' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F1513] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-[#2BA84A] animate-spin mx-auto" />
          <p className="text-[#B6C2BC] text-sm">Laddar inställningar…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <DialogContainer />

      <div className="max-w-2xl mx-auto">
        {/* ── Header ───────────────────────────── */}
        <div className="sticky top-0 z-40 bg-[#0F1513]/92 backdrop-blur-md border-b border-[#1E2724]">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => navigate(createPageUrl("Profile"))}
              className="w-9 h-9 rounded-xl bg-[#18221E] ring-1 ring-[#243029] hover:bg-[#223029] flex items-center justify-center text-[#C2CEC8] hover:text-white transition-colors"
              aria-label="Tillbaka"
            >
              <ArrowLeft className="w-[18px] h-[18px]" strokeWidth={2.4} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-[17px] font-black text-[#F4F7F5] leading-tight tracking-[-0.01em]">
                {t('settings.title')}
              </h1>
              <p className="text-[11.5px] text-[#9EAAA4] leading-none mt-0.5 truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* ── Body ─────────────────────────────── */}
        <div className="p-4 space-y-4">

          {/* ─── Integritet / Privacy ──────────────── */}
          <SettingsCard
            title={t('settings.privacy.title')}
            desc={t('settings.privacy.desc')}
            icon={Shield}
            iconAccent="#34C257"
          >
            <ToggleRow
              icon={Globe}
              accent="#86EFAC"
              label={t('settings.privacy.public_profile')}
              desc={t('settings.privacy.public_profile_desc')}
              checked={settings.is_public}
              onChange={(c) => handleSettingChange('is_public', c)}
              warn={!settings.is_public ? t('settings.privacy.public_profile_warn') : null}
            />
          </SettingsCard>

          {/* ─── Notiser / Notifications ─────────────── */}
          <SettingsCard
            title={t('settings.notifications.title')}
            desc={t('settings.notifications.desc')}
            icon={Bell}
            iconAccent="#FDBA74"
          >
            {isPushSupported() && (
              <div className="mb-3">
                <NotificationToggle />
              </div>
            )}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#0F1513] ring-1 ring-[#1E2724]">
              <Bell className="w-3.5 h-3.5 text-[#6B7A73] flex-shrink-0 mt-0.5" strokeWidth={2.4} />
              <p className="text-[12px] text-[#7B8A83] leading-relaxed">
                {t('settings.notifications.info')}
              </p>
            </div>
          </SettingsCard>

          {/* ─── Språk / Language ─────────── */}
          <SettingsCard
            title={t('settings.language.title')}
            desc={t('settings.language.desc')}
            icon={Languages}
            iconAccent="#60A5FA"
          >
            <div
              role="radiogroup"
              aria-label={t('settings.language.title')}
              className="grid grid-cols-2 gap-2"
            >
              {[
                { code: 'sv', label: t('settings.language.sv'), flag: '🇸🇪' },
                { code: 'en', label: t('settings.language.en'), flag: '🇬🇧' },
              ].map((opt) => {
                const active = lang === opt.code;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setLang(opt.code)}
                    className={`h-12 rounded-xl flex items-center justify-center gap-2 text-[13.5px] font-bold transition-colors ${
                      active
                        ? 'bg-[#2BA84A]/16 text-[#EAF6EE] ring-1 ring-[#2BA84A]/40'
                        : 'bg-[#0F1513] text-[#9EAAA4] ring-1 ring-[#1E2724] hover:bg-[#121715] hover:ring-[#243029]'
                    }`}
                  >
                    <span className="text-[17px] leading-none">{opt.flag}</span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </SettingsCard>

          {/* ─── Juridiskt / Legal ─────────────────── */}
          <SettingsCard
            title={t('settings.legal.title')}
            desc={t('settings.legal.desc')}
            icon={ShieldCheck}
            iconAccent="#C4B5FD"
          >
            {user?.tos_version_accepted && (
              <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#2BA84A]/8 ring-1 ring-[#2BA84A]/20">
                <div className="w-1.5 h-1.5 rounded-full bg-[#34C257] flex-shrink-0" />
                <p className="text-[12px] text-[#B6C2BC] leading-tight">
                  <span className="font-bold text-[#86EFAC]">{t('settings.legal.accepted')}</span>{' '}
                  v{user.tos_version_accepted}
                  {user.tos_accepted_at && (
                    <span className="text-[#7B8A83]">
                      {' '}· {new Date(user.tos_accepted_at).toLocaleDateString(lang === 'en' ? 'en-GB' : 'sv-SE')}
                    </span>
                  )}
                </p>
              </div>
            )}

            <ActionRow
              label={t('settings.legal.show_full')}
              icon={FileText}
              onClick={() => navigate(createPageUrl("LegalPolicy"))}
              trailingIcon={ExternalLink}
            />
          </SettingsCard>

          {/* ─── Konto / Account ──────────────────── */}
          <SettingsCard
            title={t('settings.account.title')}
            desc={t('settings.account.desc')}
            icon={LogOut}
            iconAccent="#F87171"
          >
            <ActionRow
              label={t('settings.account.replay_onboarding')}
              icon={PlayCircle}
              onClick={() => {
                triggerHaptic('light');
                localStorage.removeItem(ONBOARDING_STORAGE_KEY);
                window.dispatchEvent(new CustomEvent(ONBOARDING_EVENT));
              }}
            />
            <Divider />
            <button
              onClick={async () => {
                const ok = await confirm(t('settings.account.logout_title'), t('settings.account.logout_confirm'), {
                  type: 'warning',
                  confirmText: t('settings.account.logout_title'),
                  cancelText: t('common.cancel'),
                });
                if (ok) logout();
              }}
              className="w-full h-12 flex items-center gap-3 px-3.5 rounded-xl bg-[#0F1513] ring-1 ring-[#DC2626]/20 hover:bg-[#DC2626]/8 hover:ring-[#DC2626]/30 text-[#F87171] transition-all text-left"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={2.3} />
              <span className="text-[13.5px] font-bold">{t('settings.account.logout_title')}</span>
            </button>
          </SettingsCard>

          {/* ─── Danger zone ───────────────── */}
          <SettingsCard
            title={t('settings.delete.title')}
            desc={t('settings.delete.desc')}
            icon={Trash2}
            iconAccent="#F87171"
            destructive
          >
            <div className="mb-3 flex items-start gap-2.5 p-3 rounded-xl bg-red-500/8 ring-1 ring-red-500/20">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" strokeWidth={2.4} />
              <div className="text-[12px] leading-relaxed">
                <p className="font-bold text-red-300 mb-1">{t('settings.delete.warning_title')}</p>
                <ul className="space-y-0.5 text-red-200/80">
                  <li>• {t('settings.delete.warning_1')}</li>
                  <li>• {t('settings.delete.warning_2')}</li>
                  <li>• {t('settings.delete.warning_3')}</li>
                  <li>• {t('settings.delete.warning_4')}</li>
                </ul>
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {!showDeleteConfirm ? (
                <motion.button
                  key="trigger"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full h-11 rounded-xl ring-1 ring-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-[13px] font-bold transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={2.4} />
                  {t('settings.delete.trigger')}
                </motion.button>
              ) : (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9EAAA4] mb-2 block">
                      {t('settings.delete.confirm_email_label')}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7B8A83]" />
                      <Input
                        type="email"
                        placeholder={user?.email}
                        value={deleteConfirmEmail}
                        onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                        className="pl-9 bg-[#0F1513] border-red-500/25 text-[#F4F7F5] placeholder:text-[#6B7A73] focus-visible:border-red-500/60 focus-visible:ring-2 focus-visible:ring-red-500/20 h-11 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmEmail('');
                      }}
                      className="flex-1 h-11 rounded-xl bg-[#18221E] hover:bg-[#223029] ring-1 ring-[#243029] text-[#F4F7F5] text-[13px] font-bold transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || deleteConfirmEmail !== user?.email}
                      className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[13px] font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
                    >
                      {isDeleting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> {t('settings.delete.deleting')}</>
                      ) : (
                        <>{t('settings.delete.confirm_button')}</>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </SettingsCard>
        </div>
      </div>
    </div>
  );
}

// ─── Primitives ──────────────────────────────────────────
function SettingsCard({ title, desc, icon: Icon, iconAccent, destructive, children }) {
  return (
    <section
      className="rounded-[20px] border bg-gradient-to-b from-[#161C19] to-[#121715] p-4 sm:p-5"
      style={{
        borderColor: destructive ? 'rgba(239,68,68,0.25)' : '#1E2724',
        boxShadow: '0 8px 20px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <header className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `${iconAccent}18`,
            boxShadow: `inset 0 0 0 1px ${iconAccent}38`,
          }}
        >
          <Icon className="w-5 h-5" style={{ color: iconAccent }} strokeWidth={2.4} />
        </div>
        <div className="min-w-0">
          <h2 className="text-[15px] font-black text-[#F4F7F5] leading-tight tracking-[-0.01em]">
            {title}
          </h2>
          {desc && (
            <p className="text-[12px] text-[#7B8A83] leading-tight mt-0.5">{desc}</p>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}

function ToggleRow({ icon: Icon, accent, label, desc, checked, onChange, disabled, warn, badge }) {
  const Badge = badge?.icon;
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`w-full flex items-start gap-3 p-3 rounded-xl bg-[#0F1513] ring-1 text-left transition-colors ${
        disabled ? 'ring-[#1E2724] opacity-70 cursor-not-allowed' : 'ring-[#1E2724] hover:bg-[#121715] hover:ring-[#243029]'
      }`}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: `${accent}16`,
          boxShadow: `inset 0 0 0 1px ${accent}30`,
        }}
      >
        <Icon className="w-[17px] h-[17px]" style={{ color: accent }} strokeWidth={2.4} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-bold text-[#F4F7F5] leading-tight">{label}</div>
        {desc && (
          <div className="text-[11.5px] text-[#9EAAA4] leading-snug mt-0.5">{desc}</div>
        )}
        {warn && (
          <div className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-bold text-[#FDBA74]">
            <EyeOff className="w-3 h-3" strokeWidth={2.6} />
            {warn}
          </div>
        )}
        {badge && Badge && (
          <div
            className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-bold"
            style={{ color: badge.accent }}
          >
            <Badge className="w-3 h-3" strokeWidth={2.6} />
            {badge.text}
          </div>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={(c) => !disabled && onChange(c)}
        disabled={disabled}
        className="data-[state=checked]:bg-[#2BA84A] flex-shrink-0 pointer-events-none"
      />
    </button>
  );
}

function ActionRow({ label, icon: Icon, onClick, trailingIcon: TrailingIcon = ChevronRight }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 h-11 px-3 rounded-xl bg-[#0F1513] ring-1 ring-[#1E2724] hover:bg-[#121715] hover:ring-[#243029] text-left transition-colors group"
    >
      {Icon && (
        <Icon className="w-4 h-4 text-[#9EAAA4] group-hover:text-[#F4F7F5] flex-shrink-0" strokeWidth={2.4} />
      )}
      <span className="flex-1 text-[13px] font-semibold text-[#F4F7F5]">{label}</span>
      <TrailingIcon className="w-4 h-4 text-[#6B7A73] group-hover:text-[#9EAAA4] flex-shrink-0" strokeWidth={2.4} />
    </button>
  );
}

function Divider() {
  return <div className="h-px bg-[#1E2724] my-2" />;
}