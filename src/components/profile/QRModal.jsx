import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, QrCode, Share2, Copy, Check } from "lucide-react";

export default function QRModal({ user, onClose }) {
  const [copied, setCopied] = useState(false);
  
  // Generate unique profile URL with user ID
  const profileUrl = `${window.location.origin}${window.location.pathname}#/profile?userId=${user.id}`;
  
  // Use QR Server API to generate QR code
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user.full_name} på AllPlay`,
          text: 'Lägg till mig som vän på AllPlay!',
          url: profileUrl
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card 
        className="bg-[#121715] border border-[#223029] rounded-[20px] shadow-[0_16px_32px_rgba(0,0,0,0.5)] max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="border-b border-[#223029] p-6">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-[24px] leading-[32px] font-bold text-[#F4F7F5] mb-2">
                Min QR-kod
              </CardTitle>
              <p className="text-[14px] leading-[20px] text-[#B6C2BC]">
                Låt andra spelare skanna för att lägga till dig
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#18221E] text-[#B6C2BC] hover:bg-[#223029] hover:text-[#F4F7F5] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* QR Code */}
          <div className="bg-white p-6 rounded-[16px] flex items-center justify-center">
            <img 
              src={qrCodeUrl}
              alt="QR Code"
              className="w-[200px] h-[200px]"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="14"%3EQR Code%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>

          {/* User Info */}
          <div className="text-center">
            <h3 className="text-[20px] leading-[28px] font-bold text-[#F4F7F5] mb-1">
              {user.full_name}
            </h3>
            <p className="text-[14px] leading-[20px] text-[#B6C2BC]">
              @{user.full_name?.toLowerCase().replace(/\s+/g, '')}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleShare}
              className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[#2BA84A] px-6 text-[15px] leading-[20px] font-semibold text-[#FFFFFF] transition-all hover:bg-[#248232] hover:scale-[1.02]"
            >
              <Share2 className="w-5 h-5" />
              Dela profil
            </button>

            <button
              onClick={handleCopy}
              className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[#18221E] px-6 text-[15px] leading-[20px] font-semibold text-[#F4F7F5] transition-all hover:bg-[#223029]"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-[#2BA84A]" />
                  Kopierad!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Kopiera länk
                </>
              )}
            </button>
          </div>

          {/* Info */}
          <div className="bg-[#18221E] border border-[#223029] rounded-xl p-4 text-center">
            <p className="text-xs text-[#B6C2BC]">
              💡 När någon skannar din QR-kod kommer de till din profil och kan lägga till dig som vän
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}