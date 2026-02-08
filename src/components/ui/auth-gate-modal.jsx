/**
 * Auth Gate Modal
 * 
 * Shows when guest users try to access features requiring authentication
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AuthGateModal({ isOpen, onClose, onLogin, feature = 'denna funktionen' }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            className="relative w-full max-w-md bg-[#121715] border border-[#223029] rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-[#18221E] hover:bg-[#223029] text-[#B6C2BC] transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header with gradient */}
            <div className="relative p-8 bg-gradient-to-br from-[#2BA84A]/20 to-[#0F2917]/20 border-b border-[#223029]">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />
              
              <div className="relative flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2BA84A] to-[#248232] flex items-center justify-center mb-4 shadow-xl ring-4 ring-[#2BA84A]/20"
                >
                  <Zap className="w-8 h-8 text-white" strokeWidth={2.5} />
                </motion.div>

                <h2 className="text-2xl font-black text-[#F4F7F5] mb-2">
                  Logga in eller skapa konto
                </h2>
                <p className="text-[#B6C2BC] text-sm leading-relaxed">
                  För att använda {feature} behöver du ett AllPlay-konto. Det tar bara en minut!
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Benefits list */}
              <div className="bg-[#18221E]/50 rounded-xl p-4 space-y-3 border border-[#223029]">
                <p className="text-xs font-semibold text-[#2BA84A] uppercase tracking-wide flex items-center gap-2">
                  <Zap className="w-3 h-3" />
                  Med ett konto kan du:
                </p>
                <ul className="space-y-2 text-sm text-[#B6C2BC]">
                  <li className="flex items-start gap-2">
                    <span className="text-[#2BA84A] mt-0.5">•</span>
                    <span>Anmäla dig till matcher och cuper</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2BA84A] mt-0.5">•</span>
                    <span>Skapa egna matcher och lag</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2BA84A] mt-0.5">•</span>
                    <span>Samla MVP-röster och badges</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2BA84A] mt-0.5">•</span>
                    <span>Bygga ditt nätverk och hitta vänner</span>
                  </li>
                </ul>
              </div>

              {/* Action buttons */}
              <div className="space-y-3 pt-2">
                <Button
                  onClick={() => {
                    onClose();
                    onLogin?.();
                  }}
                  className="w-full h-12 bg-[#2BA84A] hover:bg-[#248232] text-white font-bold rounded-xl shadow-lg hover:shadow-[#2BA84A]/30 transition-all"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Logga in / Skapa konto
                </Button>

                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full h-12 border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] rounded-xl"
                >
                  Fortsätt som gäst
                </Button>
              </div>

              <p className="text-center text-xs text-[#7B8A83] pt-2">
                Som gäst kan du bläddra bland matcher men inte delta
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}