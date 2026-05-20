/**
 * Premium toast helpers — wraps sonner with app-specific styling and icons.
 */
import React from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Info, Loader2 } from "lucide-react";
import { triggerHaptic } from "@/components/utils/motionTokens";

const DEDUP_MS = 5000;
const lastFired = new Map();
function isDuplicate(key) {
  const now = Date.now();
  if (lastFired.has(key) && now - lastFired.get(key) < DEDUP_MS) return true;
  lastFired.set(key, now);
  return false;
}

const base = {
  background: "rgba(13,20,16,0.97)",
  color: "#F4F7F5",
  borderRadius: "18px",
  padding: "14px 18px",
  boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)",
  fontSize: "15px",
  fontWeight: 600,
  maxWidth: "320px",
  minWidth: "260px",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  letterSpacing: "-0.01em",
};

export const feedback = {
  success(message, opts = {}) {
    if (isDuplicate(`success:${message}`)) return;
    triggerHaptic("success");
    return toast.success(message, {
      duration: 2500,
      description: opts.description,
      icon: React.createElement(CheckCircle2, {
        style: { width: 20, height: 20, color: "#2BA84A", flexShrink: 0 }
      }),
      style: {
        ...base,
        border: "1px solid rgba(43,168,74,0.3)",
      },
      ...opts,
    });
  },

  error(message, opts = {}) {
    if (isDuplicate(`error:${message}`)) return;
    triggerHaptic("error");
    return toast.error(message, {
      duration: 3500,
      description: opts.description,
      icon: React.createElement(XCircle, {
        style: { width: 20, height: 20, color: "#EF4444", flexShrink: 0 }
      }),
      style: {
        ...base,
        border: "1px solid rgba(220,38,38,0.3)",
      },
      ...opts,
    });
  },

  info(message, opts = {}) {
    if (isDuplicate(`info:${message}`)) return;
    triggerHaptic("light");
    return toast(message, {
      duration: 2500,
      description: opts.description,
      icon: React.createElement(Info, {
        style: { width: 20, height: 20, color: "#60A5FA", flexShrink: 0 }
      }),
      style: {
        ...base,
        border: "1px solid rgba(96,165,250,0.25)",
      },
      ...opts,
    });
  },

  loading(message, opts = {}) {
    return toast.loading(message, {
      icon: React.createElement(Loader2, {
        style: { width: 20, height: 20, color: "#9EAAA4", flexShrink: 0, animation: "spin 1s linear infinite" }
      }),
      style: {
        ...base,
        border: "1px solid rgba(62,100,80,0.4)",
      },
      ...opts,
    });
  },

  promise(promise, { loading, success, error } = {}) {
    return toast.promise(promise, {
      loading: loading || "Laddar...",
      success: (data) => {
        triggerHaptic("success");
        return typeof success === "function" ? success(data) : success || "Klart!";
      },
      error: (err) => {
        triggerHaptic("error");
        return typeof error === "function" ? error(err) : error || err?.message || "Något gick fel";
      },
      style: {
        ...base,
        border: "1px solid rgba(62,100,80,0.4)",
      },
    });
  },

  dismiss: toast.dismiss,
};

export default feedback;
