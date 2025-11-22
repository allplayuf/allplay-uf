import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Check, AlertCircle } from 'lucide-react';
import { base44 } from "@/api/base44Client";

export default function QRScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const [stream, setStream] = useState(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Kunde inte starta kameran. Kontrollera behörigheter.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      <div className="absolute top-4 right-4 z-10">
        <button 
          onClick={onClose}
          className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-md"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-center p-6 text-white">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p>{error}</p>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 border-[50px] border-black/50 pointer-events-none">
              <div className="w-full h-full border-2 border-[#2BA84A] relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#2BA84A]"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[#2BA84A]"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[#2BA84A]"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#2BA84A]"></div>
                <motion.div 
                  className="absolute left-0 right-0 h-0.5 bg-[#2BA84A] shadow-[0_0_10px_#2BA84A]"
                  animate={{ top: ["10%", "90%", "10%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-[#121715] p-6 rounded-t-3xl border-t border-[#223029]">
        <p className="text-center text-white/70 mb-4 text-sm">Skanna QR-kod eller ange ID manuellt</p>
        <form onSubmit={handleManualSubmit} className="flex gap-3">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Ange användar-ID..."
            className="flex-1 bg-[#18221E] border border-[#223029] rounded-xl px-4 text-white placeholder:text-white/30 focus:border-[#2BA84A] outline-none"
          />
          <button 
            type="submit"
            className="bg-[#2BA84A] text-white px-6 rounded-xl font-bold hover:bg-[#248232] transition-colors"
          >
            OK
          </button>
        </form>
      </div>
    </div>
  );
}