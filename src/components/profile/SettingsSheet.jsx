import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabaseClient } from "@/components/supabase/client";
import { clearAdminCache } from "@/components/supabase/services/adminService";
import { Edit, QrCode, X, FileText } from "lucide-react";
import NotificationToggle from "@/components/profile/NotificationToggle";

export default function SettingsSheet({ onClose, onShowQR }) {
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

            <NotificationToggle />

            <a
              href="https://allplayuf.se/aboutallplay/anvandarpolicy"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <button className="w-full h-14 px-4 flex items-center justify-between text-[#F4F7F5] bg-[#18221E] rounded-xl border border-[#223029] hover:border-[#2BA84A] transition-all duration-150">
                <span className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#2BA84A]/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#2BA84A]" />
                  </div>
                  <span className="font-semibold text-sm">Användarpolicy</span>
                </span>
                <svg className="w-5 h-5 text-[#B6C2BC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </a>

            <button 
              onClick={() => {
                if (confirm('Vill du logga ut?')) {
                  clearAdminCache();
                  supabaseClient.logout();
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