import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { base44 } from "@/api/base44Client";

export default function QRScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Scan loop
  useEffect(() => {
    if (!scanning || error) return;

    const interval = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === 4 && !isProcessing) {
        await scanFrame();
      }
    }, 1000); // Scan every 1s to save resources/bandwidth

    return () => clearInterval(interval);
  }, [scanning, error, isProcessing]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Kunde inte starta kameran. Kontrollera att du har gett tillåtelse.");
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const scanFrame = async () => {
    if (!canvasRef.current || !videoRef.current) return;
    
    setIsProcessing(true);

    // 1. Try native BarcodeDetector (Chrome/Android)
    if ('BarcodeDetector' in window) {
      try {
        const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await barcodeDetector.detect(videoRef.current);
        if (barcodes.length > 0) {
          onScan(barcodes[0].rawValue);
          setScanning(false);
          return;
        }
      } catch (e) {
        // Fallback to backend if native fails
      }
    }

    // 2. Fallback: Send frame to backend
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64 (low quality to save bandwidth)
      const imageData = canvas.toDataURL('image/jpeg', 0.5);
      
      const response = await base44.functions.invoke('utils/scanQR', { image: imageData });
      
      if (response.data && response.data.text) {
        onScan(response.data.text);
        setScanning(false);
      }
    } catch (e) {
      console.error("Backend scan error:", e);
    } finally {
      setIsProcessing(false);
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
      {/* Header / Close */}
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={onClose}
          className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-md"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-center p-6 text-white z-10">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p>{error}</p>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Hidden canvas for snapshots */}
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Scanner Overlay - Responsive Square */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Dimmed background with hole using heavy borders approach for reliability */}
                <div className="relative w-64 h-64 sm:w-80 sm:h-80">
                    {/* The clear scanning area */}
                    <div className="absolute inset-0 border-2 border-[#2BA84A] bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] z-10">
                        {/* Corner markers */}
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#2BA84A] -mt-1 -ml-1"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#2BA84A] -mt-1 -mr-1"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#2BA84A] -mb-1 -ml-1"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#2BA84A] -mb-1 -mr-1"></div>
                        
                        {/* Scanning beam animation */}
                        <motion.div 
                          className="absolute left-2 right-2 h-0.5 bg-[#2BA84A] shadow-[0_0_15px_#2BA84A]"
                          animate={{ top: ["5%", "95%", "5%"] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                        />
                    </div>
                    {isProcessing && (
                        <div className="absolute top-full mt-4 w-full text-center z-20">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-xs font-medium text-[#2BA84A]">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Analyserar...
                            </div>
                        </div>
                    )}
                </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-[#121715] p-6 rounded-t-3xl border-t border-[#223029] z-20">
        <p className="text-center text-white/70 mb-4 text-sm">Skanna QR-kod eller ange ID manuellt</p>
        <form onSubmit={handleManualSubmit} className="flex gap-3">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Ange användar-ID..."
            className="flex-1 bg-[#18221E] border border-[#223029] rounded-xl px-4 h-12 text-white placeholder:text-white/30 focus:border-[#2BA84A] outline-none transition-colors"
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