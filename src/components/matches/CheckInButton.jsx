import React, { useState, useEffect } from "react";
import { MapPin, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

export default function CheckInButton({ match, isParticipant, onCheckInSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [error, setError] = useState(null);
  const [canCheckIn, setCanCheckIn] = useState(false);

  useEffect(() => {
    checkTimeWindow();
    const interval = setInterval(checkTimeWindow, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [match]);

  const checkTimeWindow = () => {
    if (!match) return;
    
    const now = new Date();
    const [year, month, day] = match.date.split('-');
    const [hour, minute] = match.time.split(':');
    const matchStart = new Date(year, month - 1, day, hour, minute);
    
    const oneHourBefore = new Date(matchStart.getTime() - 60 * 60 * 1000);
    const threeHoursAfter = new Date(matchStart.getTime() + 3 * 60 * 60 * 1000);

    setCanCheckIn(now >= oneHourBefore && now <= threeHoursAfter);
  };

  const handleCheckIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Request location permission
      if (!navigator.geolocation) {
        throw new Error('Din enhet stödjer inte platsdelning');
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      // Call check-in function
      const { data: response } = await base44.functions.invoke('checkInToMatch', {
        matchId: match.id,
        userLat,
        userLng
      });

      if (response?.success) {
        setIsCheckedIn(true);
        onCheckInSuccess?.();
      } else if (response?.error) {
        throw new Error(response.error);
      }

    } catch (err) {
      console.error('Check-in error:', err);
      
      if (err.code === 1) { // PERMISSION_DENIED
        setError('Du måste tillåta platsåtkomst för att checka in');
      } else if (err.code === 2) { // POSITION_UNAVAILABLE
        setError('Kunde inte hitta din position. Försök igen.');
      } else if (err.code === 3) { // TIMEOUT
        setError('Timeout - försök igen');
      } else {
        setError(err.message || 'Kunde inte checka in');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isParticipant) return null;
  if (match.status !== 'upcoming' && match.status !== 'ongoing') return null;

  if (isCheckedIn) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2 px-4 py-3 bg-[#2BA84A]/10 border border-[#2BA84A]/30 rounded-xl"
      >
        <Check className="w-5 h-5 text-[#2BA84A]" />
        <span className="text-sm font-semibold text-[#2BA84A]">Du är på plats!</span>
      </motion.div>
    );
  }

  if (!canCheckIn) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-[#18221E] border border-[#223029] rounded-xl opacity-50">
        <MapPin className="w-5 h-5 text-[#7B8A83]" />
        <span className="text-xs text-[#7B8A83]">Check-in öppnar 1h innan match</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleCheckIn}
        disabled={isLoading}
        className="w-full bg-[#2BA84A] hover:bg-[#248232] text-white rounded-xl h-12 gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Verifierar position...
          </>
        ) : (
          <>
            <MapPin className="w-5 h-5" />
            Jag är på plats
          </>
        )}
      </Button>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-start gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs text-[#7B8A83] text-center">
        Du måste vara inom 500m från planen
      </p>
    </div>
  );
}