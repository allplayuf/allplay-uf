import React, { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Square, ExternalLink, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONSENT_VERSION, CONSENT_DOC } from "./consentConstants";
import PolicyRenderer from "./PolicyRenderer";
import { createPageUrl } from "@/utils";

/**
 * ConsentGate - blocks user until they scroll + check + accept ToS
 * 
 * Props:
 * - onAccept: () => Promise<void> - called when user accepts
 * - onCancel: () => void - called when user cancels
 * - isSignup: boolean - if true, CTA says "Acceptera och skapa konto", else "Acceptera och fortsätt"
 * - isLoading: boolean - shows spinner on CTA
 * - error: string|null - shows error message
 */
export default function ConsentGate({ onAccept, onCancel, isSignup = false }) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const scrollRef = useRef(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollPercent = (el.scrollTop + el.clientHeight) / el.scrollHeight;
    if (scrollPercent >= 0.95) {
      setHasScrolledToBottom(true);
    }
  }, []);

  const canAccept = hasScrolledToBottom && checkboxChecked;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0F1513] flex flex-col" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#223029] bg-[#121715]"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2BA84A]/10 rounded-xl flex items-center justify-center ring-1 ring-[#2BA84A]/20">
            <ShieldCheck className="w-5 h-5 text-[#2BA84A]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#F4F7F5]">Läs igenom och godkänn</h1>
            <p className="text-xs text-[#9EAAA4]">
              {isSignup
                ? "För att skapa konto måste du läsa och godkänna."
                : "Godkänn villkoren för att fortsätta använda AllPlay."}
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable policy */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="max-w-2xl mx-auto">
          <PolicyRenderer />
          
          {/* Scroll indicator at bottom */}
          <div className="mt-8 py-4 text-center">
            {hasScrolledToBottom ? (
              <p className="text-sm text-[#2BA84A] font-medium">✓ Du har läst hela dokumentet</p>
            ) : (
              <p className="text-sm text-[#9EAAA4] animate-pulse">↓ Scrolla ner för att läsa hela dokumentet</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom action area */}
      <div className="flex-shrink-0 border-t border-[#223029] bg-[#121715] px-4 py-4"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Checkbox */}
          <button
            onClick={() => hasScrolledToBottom && setCheckboxChecked(!checkboxChecked)}
            disabled={!hasScrolledToBottom}
            className={`flex items-start gap-3 w-full text-left p-3 rounded-xl border transition-all ${
              hasScrolledToBottom
                ? checkboxChecked
                  ? "border-[#2BA84A]/40 bg-[#2BA84A]/5"
                  : "border-[#223029] hover:border-[#2BA84A]/30"
                : "border-[#223029] opacity-50 cursor-not-allowed"
            }`}
          >
            {checkboxChecked ? (
              <CheckSquare className="w-5 h-5 text-[#2BA84A] flex-shrink-0 mt-0.5" />
            ) : (
              <Square className="w-5 h-5 text-[#9EAAA4] flex-shrink-0 mt-0.5" />
            )}
            <span className="text-sm text-[#F4F7F5] leading-snug">
              Jag har läst och accepterar AllPlays Användarvillkor & Integritetspolicy ({CONSENT_VERSION}).
            </span>
          </button>

          {/* Open as webpage link */}
          <a
            href="https://allplayuf.se/legalpolicy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#2BA84A] hover:text-[#248232] transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Öppna som webbsida
          </a>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 h-12 border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] rounded-xl"
            >
              Stäng
            </Button>
            <Button
              onClick={onAccept}
              disabled={!canAccept}
              className="flex-1 h-12 bg-[#2BA84A] hover:bg-[#248232] text-white font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSignup ? "Acceptera och skapa konto" : "Acceptera och fortsätt"}
            </Button>
          </div>

          {/* Disclaimer */}
          {isSignup && (
            <p className="text-center text-xs text-[#9EAAA4]">
              Du kan inte skapa konto utan att godkänna.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}