/**
 * Subtle, premium toast helpers — wraps sonner with app-specific styling.
 * Use these for quick success/info/error feedback instead of full-screen modals.
 * Modals (via useCustomDialog) should only be used for confirmations or critical errors.
 */
import { toast } from "sonner";
import { triggerHaptic } from "@/components/utils/motionTokens";

const baseStyle = {
  background: "#121715",
  color: "#F4F7F5",
  border: "1px solid #223029",
  borderRadius: "14px",
  padding: "12px 14px",
  boxShadow: "0 16px 40px rgba(0, 0, 0, 0.48), 0 4px 12px rgba(0, 0, 0, 0.26)",
  fontSize: "14px",
  fontWeight: 500,
};

export const feedback = {
  success(message, opts = {}) {
    triggerHaptic("success");
    return toast.success(message, {
      duration: 2800,
      description: opts.description,
      style: {
        ...baseStyle,
        borderColor: "rgba(43, 168, 74, 0.35)",
        boxShadow: "0 0 0 1px rgba(43, 168, 74, 0.18), 0 12px 32px rgba(0, 0, 0, 0.45)",
      },
      ...opts,
    });
  },

  error(message, opts = {}) {
    triggerHaptic("error");
    return toast.error(message, {
      duration: 4000,
      description: opts.description,
      style: {
        ...baseStyle,
        borderColor: "rgba(220, 38, 38, 0.4)",
        boxShadow: "0 0 0 1px rgba(220, 38, 38, 0.2), 0 12px 32px rgba(0, 0, 0, 0.45)",
      },
      ...opts,
    });
  },

  info(message, opts = {}) {
    triggerHaptic("light");
    return toast(message, {
      duration: 2800,
      description: opts.description,
      style: baseStyle,
      ...opts,
    });
  },

  loading(message, opts = {}) {
    return toast.loading(message, {
      style: baseStyle,
      ...opts,
    });
  },

  /** Promise helper — shows loading, then success/error automatically */
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
      style: baseStyle,
    });
  },

  dismiss: toast.dismiss,
};

export default feedback;