import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import jsQR from 'jsqr';

export default function QRScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(true);
  const scanningRef = useRef(true); // mutable ref so the loop can check current value
  const animFrameRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => {
      scanningRef.current = false;
      stopCamera();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          requestScanLoop();
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Kunde inte starta kameran. Kontrollera att du har gett kameratillstånd.');
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
  };

  // Continuous scan loop using requestAnimationFrame — faster than setInterval,
  // no backend round-trips, works on all platforms (iOS Safari included).
  const requestScanLoop = () => {
    if (!scanningRef.current) return;
    animFrameRef.current = requestAnimationFrame(async () => {
      if (!scanningRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === 4) {
        const result = scanFrameSync(video, canvas);
        if (result) {
          scanningRef.current = false;
          setScanning(false);
          onScan(result);
          return;
        }
      }
      requestScanLoop();
    });
  };

  // Pure synchronous decode using jsQR — no network needed, works everywhere
  const scanFrameSync = (video, canvas) => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    if (!canvas.width || !canvas.height) return null;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });
    return code?.data || null;
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const val = manualCode.trim();
    if (val) {
      scanningRef.current = false;
      setScanning(false);
      onScan(val);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col">
      {/* Close */}
      <div className="absolute top-4 right-4 z-20" style={{ top: 'calc(env(safe-area-inset-top) + 1rem)' }}>
        <button
          onClick={onClose}
          className="w-11 h-11 bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-md ring-1 ring-white/20"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Camera area */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-center p-8 text-white z-10 space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-red-400" />
            <p className="text-sm text-white/80 max-w-xs mx-auto">{error}</p>
            <p className="text-xs text-white/50">Ange ID manuellt nedan istället.</p>
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
            <canvas ref={canvasRef} className="hidden" />

            {/* Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-white/70 text-sm mb-6 font-medium tracking-wide">
                Rikta kameran mot en QR-kod
              </p>

              {/* Scanner frame */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72">
                {/* Dark vignette */}
                <div className="absolute inset-0 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />

                {/* Green border */}
                <div className="absolute inset-0 border-2 border-[#2BA84A]/80" />

                {/* Corner markers */}
                {[
                  'top-0 left-0 border-t-[3px] border-l-[3px] -mt-px -ml-px',
                  'top-0 right-0 border-t-[3px] border-r-[3px] -mt-px -mr-px',
                  'bottom-0 left-0 border-b-[3px] border-l-[3px] -mb-px -ml-px',
                  'bottom-0 right-0 border-b-[3px] border-r-[3px] -mb-px -mr-px',
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-7 h-7 border-[#2BA84A] ${cls}`} />
                ))}

                {/* Scanning beam */}
                <motion.div
                  className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-[#2BA84A] to-transparent shadow-[0_0_10px_#2BA84A]"
                  animate={{ top: ['4%', '96%', '4%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                />
              </div>

              {scanning && (
                <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-[11px] font-medium text-[#2BA84A]">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Skannar...
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Manual entry */}
      <div
        className="bg-[#121715] px-5 py-5 rounded-t-3xl border-t border-[#223029] z-20 space-y-3"
        style={{ paddingBottom: 'max(1.25rem, calc(1rem + env(safe-area-inset-bottom)))' }}
      >
        <p className="text-center text-white/60 text-sm">Eller ange användar-ID manuellt</p>
        <form onSubmit={handleManualSubmit} className="flex gap-3">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Klistra in användar-ID..."
            className="flex-1 bg-[#18221E] border border-[#223029] rounded-[12px] px-4 h-12 text-white placeholder:text-white/30 focus:border-[#2BA84A] outline-none transition-colors text-sm"
          />
          <button
            type="submit"
            disabled={!manualCode.trim()}
            className="bg-[#2BA84A] text-white px-5 rounded-[12px] font-bold hover:bg-[#248232] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            OK
          </button>
        </form>
      </div>
    </div>
  );
}
