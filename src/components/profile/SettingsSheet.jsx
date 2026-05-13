import React from 'react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabaseClient } from "@/components/supabase/client";
import { clearAdminCache } from "@/components/supabase/services/adminService";
import { Edit, QrCode, X, Settings, LogOut, ChevronRight, FileText } from "lucide-react";
import { useCustomDialog } from "@/components/ui/custom-dialog";

export default function SettingsSheet({ onClose, onShowQR }) {
  const { confirm, DialogContainer } = useCustomDialog();

  const handleLogout = async () => {
    const ok = await confirm('Logga ut', 'Är du säker på att du vill logga ut?', {
      type: 'warning', confirmText: 'Logga ut', cancelText: 'Avbryt'
    });
    if (!ok) return;
    clearAdminCache();
    supabaseClient.logout();
    window.location.reload();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <DialogContainer />
      <div
        className="w-full max-w-sm overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #161C19 0%, #121715 100%)',
          border: '1px solid #1E2724',
          borderRadius: '22px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#1E2724]">
          <h2 className="text-[16px] font-black text-[#F4F7F5] tracking-[-0.01em]">Inställningar</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#18221E] text-[#B6C2BC] hover:bg-[#223029] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2.4} />
          </button>
        </div>

        <div className="p-3 space-y-1.5">
          <SheetRow
            icon={Edit}
            label="Redigera profil"
            accent="#34C257"
            asLink
            to={createPageUrl("EditProfile")}
            onClick={onClose}
          />
          <SheetRow
            icon={QrCode}
            label="Min QR-kod"
            accent="#34C257"
            onClick={onShowQR}
          />
          <SheetRow
            icon={Settings}
            label="Kontoinställningar"
            accent="#C4B5FD"
            asLink
            to={createPageUrl("AccountSettings")}
            onClick={onClose}
          />
          <SheetRow
            icon={FileText}
            label="Användarpolicy"
            accent="#94A3B8"
            href="https://allplayuf.se/aboutallplay/anvandarpolicy"
          />

          <div className="h-px bg-[#1E2724] my-1" />

          <button
            onClick={handleLogout}
            className="w-full h-12 px-3.5 flex items-center gap-3 rounded-xl ring-1 ring-[#DC2626]/20 bg-[#0F1513] hover:bg-[#DC2626]/8 hover:ring-[#DC2626]/30 transition-all"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(220,38,38,0.12)', boxShadow: 'inset 0 0 0 1px rgba(220,38,38,0.2)' }}
            >
              <LogOut className="w-4 h-4 text-[#F87171]" strokeWidth={2.3} />
            </div>
            <span className="flex-1 text-[13.5px] font-bold text-[#F87171] text-left">Logga ut</span>
          </button>
        </div>

        <div className="pb-3" />
      </div>
    </div>
  );
}

function SheetRow({ icon: Icon, label, accent, asLink, to, href, onClick }) {
  const inner = (
    <div className="w-full h-12 px-3.5 flex items-center gap-3 rounded-xl ring-1 ring-[#1E2724] bg-[#0F1513] hover:ring-[#2E3D34] hover:bg-[#121715] transition-all group">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${accent}18`, boxShadow: `inset 0 0 0 1px ${accent}32` }}
      >
        <Icon className="w-4 h-4" style={{ color: accent }} strokeWidth={2.3} />
      </div>
      <span className="flex-1 text-[13.5px] font-semibold text-[#F4F7F5] text-left">{label}</span>
      <ChevronRight className="w-4 h-4 text-[#6B7A73] group-hover:text-[#9EAAA4] flex-shrink-0" strokeWidth={2.3} />
    </div>
  );

  if (asLink && to) {
    return <Link to={to} onClick={onClick}>{inner}</Link>;
  }
  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer">{inner}</a>;
  }
  return <button type="button" onClick={onClick}>{inner}</button>;
}
