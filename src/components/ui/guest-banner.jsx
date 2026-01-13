import React from "react";
import { motion } from "framer-motion";
import { X, UserPlus, LogIn } from "lucide-react";
import { Button } from "./button";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export function GuestBanner() {
  const [isDismissed, setIsDismissed] = React.useState(() => {
    return localStorage.getItem('guest_banner_dismissed') === 'true';
  });

  const handleDismiss = () => {
    localStorage.setItem('guest_banner_dismissed', 'true');
    setIsDismissed(true);
  };

  const handleSignup = () => {
    base44.auth.redirectToLogin(createPageUrl('Dashboard'));
  };

  if (isDismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="sticky top-0 z-50 bg-gradient-to-r from-[#2BA84A] to-[#248232] border-b border-[#2BA84A]/30 px-4 py-3"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <UserPlus className="w-5 h-5 text-white flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm">
              Du browsear som gäst. Skapa ett konto för att spela matcher!
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={handleSignup}
            className="bg-white text-[#2BA84A] hover:bg-white/90 h-8 px-3 text-xs font-semibold rounded-lg"
          >
            <LogIn className="w-3.5 h-3.5 mr-1.5" />
            Logga in
          </Button>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}