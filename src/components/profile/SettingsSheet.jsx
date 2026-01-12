import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Edit, QrCode, X } from "lucide-react";

export default function SettingsSheet({ onClose, onShowQR, user }) {
  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card 
        className="bg-[#121715] border border-[#223029] rounded-2xl shadow-xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#F4F7F5]">Inställningar</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#18221E] text-[#B6C2BC] hover:bg-[#223029] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            <Link to={createPageUrl("EditProfile")} onClick={onClose}>
              <button className="w-full h-14 px-4 flex items-center justify-between text-[#F4F7F5] bg-[#18221E] rounded-xl border border-[#223029] hover:border-[#2BA84A] transition-all duration-150">
                <span className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#2BA84A]/10 rounded-lg flex items-center justify-center">
                    <Edit className="w-4 h-4 text-[#2BA84A]" />
                  </div>
                  <span className="font-semibold text-sm">Redigera profil</span>
                </span>
                <svg className="w-5 h-5 text-[#B6C2BC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>

            <button 
              onClick={onShowQR}
              className="w-full h-14 px-4 flex items-center justify-between text-[#F4F7F5] bg-[#18221E] rounded-xl border border-[#223029] hover:border-[#2BA84A] transition-all duration-150"
            >
              <span className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#2BA84A]/10 rounded-lg flex items-center justify-center">
                  <QrCode className="w-4 h-4 text-[#2BA84A]" />
                </div>
                <span className="font-semibold text-sm">Min QR-kod</span>
              </span>
              <svg className="w-5 h-5 text-[#B6C2BC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button 
              onClick={async () => {
                if (confirm('Är du säker på att du vill radera ditt konto? All din data kommer att tas bort permanent. Denna åtgärd kan inte ångras.')) {
                  try {
                    await base44.entities.User.delete(user.id);
                    await base44.auth.logout();
                    window.location.reload();
                  } catch (error) {
                    console.error('Error deleting account:', error);
                    alert('Kunde inte radera kontot. Kontakta support@allplay.se för hjälp.');
                  }
                }
              }}
              className="w-full h-14 px-4 flex items-center justify-between text-[#DC2626] bg-[#18221E] rounded-xl border border-[#223029] hover:border-[#DC2626] transition-all duration-150"
            >
              <span className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#DC2626]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <span className="font-semibold text-sm">Ta bort konto</span>
              </span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button 
              onClick={async () => {
                if (confirm('Vill du logga ut?')) {
                  await base44.auth.logout();
                  window.location.reload();
                }
              }}
              className="w-full h-14 px-4 flex items-center justify-between text-[#F4743B] bg-[#18221E] rounded-xl border border-[#223029] hover:border-[#F4743B] transition-all duration-150"
            >
              <span className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#F4743B]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <span className="font-semibold text-sm">Logga ut</span>
              </span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}