import React from "react";
import { useSEO } from "@/components/hooks/useSEO";
import { ShieldCheck } from "lucide-react";
import PolicyRenderer from "../components/legal/PolicyRenderer";
import { CONSENT_VERSION } from "../components/legal/consentConstants";

export default function LegalPolicyPage() {
  useSEO({ title: 'Integritetspolicy', description: 'Läs om hur AllPlay UF hanterar dina personuppgifter och skyddar din integritet enligt GDPR.', canonicalPath: '/legalpolicy' });
  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      {/* Sticky topbar */}
      <div className="sticky top-0 z-40 bg-[#121715]/95 backdrop-blur-md border-b border-[#223029] px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#2BA84A]" />
            <h1 className="font-semibold text-[#F4F7F5]">Användarvillkor & Integritetspolicy</h1>
          </div>
          <span className="text-xs text-[#7B8A83]">v{CONSENT_VERSION}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <PolicyRenderer />
      </div>
    </div>
  );
}