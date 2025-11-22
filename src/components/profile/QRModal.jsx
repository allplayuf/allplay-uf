import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Scan } from 'lucide-react';
// import { QRCodeSVG } from 'qrcode.react'; // Removed external dependency
import QRScanner from './QRScanner';
import { base44 } from "@/api/base44Client";

export default function QRModal({ user, onClose }) {
  const [copied, setCopied] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScanResult = async (scannedId) => {
    // Handle finding user by ID
    setShowScanner(false);
    // Logic to navigate to user profile or add friend would go here
    // For now, just close and maybe alert (in a real app, navigate to profile)
    window.location.href = `/profile?userId=${scannedId}`;
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[#121715] border border-[#223029] rounded-[24px] w-full max-w-sm p-8 relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-[#B6C2BC] hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center space-y-6">
            <div className="space-y-2">
              <div className="w-16 h-16 bg-[#2BA84A]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                {user.profile_image_url ? (
                  <img src={user.profile_image_url} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-[#2BA84A]">{user.full_name?.[0]}</span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white">{user.full_name}</h2>
              <p className="text-[#B6C2BC] text-sm">Dela din kod för att lägga till vänner</p>
            </div>

            <div className="bg-white p-4 rounded-xl mx-auto w-fit">
               {/* Simple QR Code generation using an image service if library missing, or just styling a placeholder if needed, but using API if possible */}
               <img 
                 src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${user.id}`} 
                 alt="QR Code" 
                 className="w-48 h-48"
               />
            </div>

            <div className="flex items-center gap-2 bg-[#18221E] p-3 rounded-xl border border-[#223029]">
              <code className="flex-1 text-sm text-[#F4F7F5] font-mono truncate">{user.id}</code>
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-[#223029] rounded-lg transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-[#2BA84A]" /> : <Copy className="w-4 h-4 text-[#B6C2BC]" />}
              </button>
            </div>

            <button
              onClick={() => setShowScanner(true)}
              className="w-full py-3 bg-[#2BA84A] hover:bg-[#248232] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Scan className="w-5 h-5" />
              Skanna kod
            </button>
          </div>
        </motion.div>
      </div>

      {showScanner && (
        <QRScanner onScan={handleScanResult} onClose={() => setShowScanner(false)} />
      )}
    </>
  );
}