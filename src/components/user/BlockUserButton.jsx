import React, { useState } from "react";
import { Ban, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { feedback } from "@/components/ui/feedback-toast";

export default function BlockUserButton({ 
  targetUserId, 
  isBlocked = false,
  onBlockChange,
  variant = "outline",
  size = "sm",
  className = ""
}) {
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(isBlocked);

  const handleToggleBlock = async () => {
    setLoading(true);
    try {
      const { data: response } = await base44.functions.invoke('blockUser', {
        targetUserId,
        action: blocked ? 'unblock' : 'block'
      });

      if (response?.success) {
        setBlocked(!blocked);
        onBlockChange?.(!blocked);
      }
    } catch (error) {
      console.error("Error toggling block:", error);
      feedback.error('Kunde inte utföra åtgärden. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleToggleBlock}
      disabled={loading}
      variant={variant}
      size={size}
      className={`${className} ${
        blocked 
          ? 'border-[#2BA84A]/30 text-[#2BA84A] hover:bg-[#2BA84A]/10' 
          : 'border-red-500/30 text-red-400 hover:bg-red-500/10'
      }`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <Ban className="w-4 h-4 mr-1" />
          {blocked ? 'Avblockera' : 'Blockera'}
        </>
      )}
    </Button>
  );
}