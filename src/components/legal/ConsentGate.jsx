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
export default function ConsentGate({ onAccept, onCancel, isSignup = false, isLoading = false, error = null }) {
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const scrollRef = useRef(null);

  const canAccept = checkboxChecked && !isLoading;

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
        className="flex-1 overflow-y-auto px-4 py-6"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="max-w-2xl mx-auto">
          <PolicyRenderer />
        </div>
      </div>

      {/* Bottom action area - safe from nav bar */}
      <div className="flex-shrink-0 border-t border-[#223029] bg-[#121715] px-4 py-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <div className="max-w-2xl mx-auto space-y-2.5">
          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
              <span>{error}</span>
            </div>
          )}

          {/* Checkbox */}
          <button
            onClick={() => setCheckboxChecked(!checkboxChecked)}
            disabled={isLoading}
            className={`flex items-start gap-3 w-full text-left p-2.5 rounded-xl border transition-all min-h-[44px] ${
              checkboxChecked
                ? "border-[#2BA84A]/40 bg-[#2BA84A]/5"
                : "border-[#223029] hover:border-[#2BA84A]/30"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {checkboxChecked ? (
              <CheckSquare className="w-5 h-5 text-[#2BA84A] flex-shrink-0 mt-0.5" />
            ) : (
              <Square className="w-5 h-5 text-[#9EAAA4] flex-shrink-0 mt-0.5" />
            )}
            <span className="text-xs text-[#F4F7F5] leading-snug">
              Jag har läst och accepterar AllPlays Användarvillkor & Integritetspolicy ({CONSENT_VERSION}).
            </span>
          </button>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 h-11 border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] rounded-xl text-sm"
            >
              Stäng
            </Button>
            <Button
              onClick={onAccept}
              disabled={!canAccept}
              className="flex-1 h-11 bg-[#2BA84A] hover:bg-[#248232] text-white font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? "Skapar konto..." : isSignup ? "Acceptera & skapa konto" : "Acceptera & fortsätt"}
            </Button>
          </div>

          {/* Links row */}
          <div className="flex items-center justify-between">
            <a
              href="https://allplayuf.se/legalpolicy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[#2BA84A] hover:text-[#248232] transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Öppna som webbsida
            </a>
            {isSignup && (
              <p className="text-xs text-[#9EAAA4]">
                Godkännande krävs för konto.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}