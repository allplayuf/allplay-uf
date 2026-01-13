import React from "react";
import { motion } from "framer-motion";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

/**
 * Component that blocks guest users from performing actions
 * Shows a modal prompting them to log in
 */
export function GuestBlocker({ isOpen, onClose, actionName = "göra detta" }) {
  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#121715] rounded-2xl border border-[#223029] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 text-center border-b border-[#223029]">
          <div className="w-16 h-16 bg-[#2BA84A]/10 rounded-full flex items-center justify-center mx-auto mb-4 ring-1 ring-[#2BA84A]/20">
            <LogIn className="w-8 h-8 text-[#2BA84A]" />
          </div>
          <h2 className="text-xl font-bold text-[#F4F7F5] mb-2">Logga in för att fortsätta</h2>
          <p className="text-sm text-[#B6C2BC]">
            Du behöver ett konto för att {actionName}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          <Button
            onClick={handleLogin}
            className="w-full bg-[#2BA84A] hover:bg-[#248232] text-white rounded-xl h-12 gap-2"
          >
            <LogIn className="w-5 h-5" />
            Logga in
          </Button>
          
          <Button
            onClick={handleLogin}
            variant="outline"
            className="w-full border-[#223029] text-[#F4F7F5] hover:bg-[#18221E] rounded-xl h-12 gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Skapa konto
          </Button>

          <button
            onClick={onClose}
            className="w-full text-sm text-[#7B8A83] hover:text-[#F4F7F5] transition-colors py-2"
          >
            Fortsätt utforska
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Hook to use guest blocker
 */
export function useGuestBlocker() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [actionName, setActionName] = React.useState("göra detta");

  const blockGuestAction = (action) => {
    setActionName(action);
    setIsOpen(true);
  };

  const GuestBlockerComponent = () => (
    <GuestBlocker 
      isOpen={isOpen} 
      onClose={() => setIsOpen(false)} 
      actionName={actionName}
    />
  );

  return {
    blockGuestAction,
    GuestBlockerComponent
  };
}