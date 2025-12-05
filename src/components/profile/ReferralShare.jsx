import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, Check, QrCode, Users, Trophy, Gift } from "lucide-react";
import QRCode from 'qrcode';

export default function ReferralShare({ user }) {
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQR, setShowQR] = useState(false);

  const referralCode = user?.referral_code || user?.id?.substring(0, 8);
  const referralLink = `${window.location.origin}?ref=${referralCode}`;
  const referralCount = user?.verified_referrals || 0;

  useEffect(() => {
    if (showQR && !qrCodeUrl) {
      QRCode.toDataURL(referralLink, {
        width: 300,
        margin: 2,
        color: {
          dark: '#2BA84A',
          light: '#FFFFFF'
        }
      }).then(url => {
        setQrCodeUrl(url);
      }).catch(err => {
        console.error('QR Code generation failed:', err);
      });
    }
  }, [showQR, referralLink, qrCodeUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Gå med i AllPlay!',
          text: `Hej! Jag använder AllPlay för att hitta fotbollsmatcher. Använd min referral-kod "${referralCode}" när du registrerar dig!`,
          url: referralLink
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      handleCopy();
    }
  };

  const getBadgeLevel = () => {
    if (referralCount >= 10) return { name: 'Matchmaker Elite', icon: Trophy, color: '#9370DB' };
    if (referralCount >= 5) return { name: 'Community Builder', icon: Users, color: '#4169E1' };
    if (referralCount >= 1) return { name: 'AllPlay Recruiter', icon: Gift, color: '#2BA84A' };
    return null;
  };

  const nextMilestone = referralCount < 1 ? 1 : referralCount < 5 ? 5 : referralCount < 10 ? 10 : null;
  const badgeLevel = getBadgeLevel();
  const BadgeIcon = badgeLevel?.icon;

  return (
    <div className="space-y-4">
      {/* Referral Stats Card */}
      <Card className="bg-gradient-to-br from-[#1F5C34] to-[#0A1F11] border border-[#2BA84A]/30 rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.3)] overflow-hidden">
        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-[#2BA84A]/20 rounded-full blur-2xl"></div>
        
        <CardHeader className="relative z-10 border-b border-[#2BA84A]/20 pb-4">
          <CardTitle className="text-[#EAF6EE] text-lg flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#2BA84A]" />
            Bjud in vänner
          </CardTitle>
          <p className="text-sm text-[#CFE8D6] mt-1">
            Tjäna exklusiva badges genom att dela AllPlay med dina vänner!
          </p>
        </CardHeader>

        <CardContent className="relative z-10 p-6 space-y-6">
          {/* Current Stats */}
          <div className="bg-[#FFFFFF]/10 backdrop-blur-sm rounded-xl p-4 border border-[#FFFFFF]/20">
            <div className="text-center mb-4">
              <div className="text-4xl font-black text-[#EAF6EE] mb-1">{referralCount}</div>
              <div className="text-sm text-[#CFE8D6]">Verifierade invites</div>
            </div>

            {badgeLevel && (
              <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-gradient-to-r from-[#2BA84A]/20 to-[#248232]/10 border border-[#2BA84A]/30">
                <BadgeIcon className="w-5 h-5" style={{ color: badgeLevel.color }} />
                <span className="text-sm font-bold text-[#EAF6EE]">{badgeLevel.name}</span>
              </div>
            )}

            {nextMilestone && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs text-[#CFE8D6]">
                  <span>Nästa badge</span>
                  <span className="font-bold">{referralCount}/{nextMilestone}</span>
                </div>
                <div className="w-full bg-[#0F1513]/60 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#2BA84A] to-[#248232] transition-all duration-500"
                    style={{ width: `${(referralCount / nextMilestone) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Referral Link */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#EAF6EE]">Din referral-länk:</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-[#18221E] border border-[#223029] rounded-xl px-4 py-3 text-sm text-[#B6C2BC] font-mono truncate">
                {referralLink}
              </div>
              <Button
                onClick={handleCopy}
                className="bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/15 border border-[#FFFFFF]/20 text-[#EAF6EE] rounded-xl px-4 flex-shrink-0"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Check className="w-5 h-5 text-[#2BA84A]" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="copy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Copy className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleShare}
              className="bg-gradient-to-r from-[#2BA84A] to-[#248232] hover:from-[#248232] hover:to-[#1F6B2A] text-white rounded-xl h-12 font-semibold"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Dela
            </Button>
            <Button
              onClick={() => setShowQR(!showQR)}
              className="bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/15 border border-[#FFFFFF]/20 text-[#EAF6EE] rounded-xl h-12 font-semibold"
            >
              <QrCode className="w-5 h-5 mr-2" />
              QR-kod
            </Button>
          </div>

          {/* QR Code */}
          <AnimatePresence>
            {showQR && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-xl p-6 text-center">
                  {qrCodeUrl ? (
                    <>
                      <img src={qrCodeUrl} alt="QR Code" className="mx-auto mb-3" />
                      <p className="text-xs text-gray-600">
                        Låt vänner scanna för att få din referral-kod
                      </p>
                    </>
                  ) : (
                    <div className="w-full h-64 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-[#2BA84A] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info */}
          <div className="bg-[#18221E]/50 rounded-xl p-4 border border-[#223029]">
            <p className="text-xs text-[#B6C2BC] leading-relaxed">
              <strong className="text-[#EAF6EE]">Hur det fungerar:</strong> När någon registrerar sig med din länk eller QR-kod och verifierar sitt konto, får du en verified referral. Samla referrals för att låsa upp exklusiva badges!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}