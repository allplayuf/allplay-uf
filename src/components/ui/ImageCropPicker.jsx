import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ZoomIn, ZoomOut, RotateCcw, Loader2, Move } from 'lucide-react';

const CONTAINER = 300;

export default function ImageCropPicker({ file, shape = 'circle', onCrop, onCancel }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [nat, setNat] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const touchRef = useRef(null);

  const CROP_SIZE = Math.round(CONTAINER * 0.8);  // 240
  const CROP_MARGIN = (CONTAINER - CROP_SIZE) / 2; // 30

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Prevent passive scroll/wheel inside container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const stop = (e) => e.preventDefault();
    el.addEventListener('touchmove', stop, { passive: false });
    el.addEventListener('wheel', stop, { passive: false });
    return () => {
      el.removeEventListener('touchmove', stop);
      el.removeEventListener('wheel', stop);
    };
  }, []);

  const clampOffset = useCallback((ox, oy, s, nw, nh) => {
    const iw = nw * s;
    const ih = nh * s;
    return {
      x: Math.max(CROP_MARGIN + CROP_SIZE - iw, Math.min(CROP_MARGIN, ox)),
      y: Math.max(CROP_MARGIN + CROP_SIZE - ih, Math.min(CROP_MARGIN, oy)),
    };
  }, [CROP_MARGIN, CROP_SIZE]);

  const getMinScale = useCallback((nw, nh) => {
    return CROP_SIZE / Math.min(nw, nh);
  }, [CROP_SIZE]);

  const handleImageLoad = useCallback((e) => {
    const { naturalWidth: nw, naturalHeight: nh } = e.target;
    setNat({ w: nw, h: nh });
    const s = getMinScale(nw, nh);
    setScale(s);
    const iw = nw * s;
    const ih = nh * s;
    setOffset(clampOffset((CONTAINER - iw) / 2, (CONTAINER - ih) / 2, s, nw, nh));
  }, [getMinScale, clampOffset]);

  // ── Mouse drag ──
  const onMouseDown = (e) => {
    e.preventDefault();
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y };
    setIsDragging(true);
  };

  const onMouseMove = useCallback((e) => {
    if (!dragRef.current || !nat.w) return;
    const dx = e.clientX - dragRef.current.sx;
    const dy = e.clientY - dragRef.current.sy;
    setOffset(clampOffset(dragRef.current.ox + dx, dragRef.current.oy + dy, scale, nat.w, nat.h));
  }, [scale, nat, clampOffset]);

  const onMouseUp = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  // ── Touch drag ──
  const onTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touchRef.current = { sx: t.clientX, sy: t.clientY, ox: offset.x, oy: offset.y };
  };

  const onTouchMove = useCallback((e) => {
    if (!touchRef.current || e.touches.length !== 1 || !nat.w) return;
    const t = e.touches[0];
    setOffset(clampOffset(
      touchRef.current.ox + (t.clientX - touchRef.current.sx),
      touchRef.current.oy + (t.clientY - touchRef.current.sy),
      scale, nat.w, nat.h
    ));
  }, [scale, nat, clampOffset]);

  // ── Wheel zoom ──
  const onWheel = useCallback((e) => {
    if (!nat.w) return;
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const minS = getMinScale(nat.w, nat.h);
    const newS = Math.min(Math.max(scale * factor, minS), minS * 4);
    setScale(newS);
    setOffset(prev => clampOffset(prev.x, prev.y, newS, nat.w, nat.h));
  }, [scale, nat, getMinScale, clampOffset]);

  const applyScale = (newS) => {
    if (!nat.w) return;
    const minS = getMinScale(nat.w, nat.h);
    const s = Math.min(Math.max(newS, minS), minS * 4);
    setScale(s);
    setOffset(prev => clampOffset(prev.x, prev.y, s, nat.w, nat.h));
  };

  const handleReset = () => {
    if (!nat.w) return;
    const s = getMinScale(nat.w, nat.h);
    setScale(s);
    const iw = nat.w * s;
    const ih = nat.h * s;
    setOffset(clampOffset((CONTAINER - iw) / 2, (CONTAINER - ih) / 2, s, nat.w, nat.h));
  };

  // ── Crop & export ──
  const handleConfirm = async () => {
    if (!imgRef.current || !nat.w || isProcessing) return;
    setIsProcessing(true);
    try {
      const OUTPUT = 512;
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT;
      canvas.height = OUTPUT;
      const ctx = canvas.getContext('2d');

      const srcX = (CROP_MARGIN - offset.x) / scale;
      const srcY = (CROP_MARGIN - offset.y) / scale;
      const srcSize = CROP_SIZE / scale;

      ctx.drawImage(imgRef.current, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT, OUTPUT);
      canvas.toBlob(
        (blob) => { onCrop(blob); setIsProcessing(false); },
        'image/jpeg',
        0.92
      );
    } catch {
      setIsProcessing(false);
    }
  };

  const isCircle = shape === 'circle';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="w-full sm:max-w-[380px] bg-[#0F1513] rounded-t-[28px] sm:rounded-[24px] overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-[#7B8A83] hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="font-semibold text-[#F4F7F5] text-sm">Välj bildutsnitt</p>
            <p className="text-[11px] text-[#5A6A62] mt-0.5">Dra för att flytta · scrolla för att zooma</p>
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!imgSrc || isProcessing}
            className="px-3.5 py-1.5 bg-[#2BA84A] rounded-xl text-white text-sm font-semibold disabled:opacity-40 hover:bg-[#248232] active:scale-95 transition-all flex items-center gap-1.5"
          >
            {isProcessing
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><Check className="w-3.5 h-3.5" /><span>Klar</span></>}
          </button>
        </div>

        {/* Crop viewport */}
        <div className="px-5 pb-1">
          <div
            ref={containerRef}
            style={{
              width: CONTAINER,
              height: CONTAINER,
              margin: '0 auto',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 16,
              background: '#141A17',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none',
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={() => { touchRef.current = null; }}
            onWheel={onWheel}
          >
            {imgSrc && (
              <img
                ref={imgRef}
                src={imgSrc}
                alt=""
                draggable={false}
                onLoad={handleImageLoad}
                style={{
                  position: 'absolute',
                  left: offset.x,
                  top: offset.y,
                  width: nat.w * scale,
                  height: nat.h * scale,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              />
            )}

            {/* Darkened overlay with crop hole */}
            <svg
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}
              width={CONTAINER}
              height={CONTAINER}
            >
              <defs>
                <mask id="ap-crop-mask">
                  <rect width={CONTAINER} height={CONTAINER} fill="white" />
                  {isCircle ? (
                    <circle cx={CONTAINER / 2} cy={CONTAINER / 2} r={CROP_SIZE / 2} fill="black" />
                  ) : (
                    <rect x={CROP_MARGIN} y={CROP_MARGIN} width={CROP_SIZE} height={CROP_SIZE} rx={14} fill="black" />
                  )}
                </mask>
              </defs>
              <rect width={CONTAINER} height={CONTAINER} fill="rgba(0,0,0,0.58)" mask="url(#ap-crop-mask)" />
              {/* Crop border */}
              {isCircle ? (
                <circle
                  cx={CONTAINER / 2}
                  cy={CONTAINER / 2}
                  r={CROP_SIZE / 2}
                  fill="none"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth={1.5}
                />
              ) : (
                <rect
                  x={CROP_MARGIN}
                  y={CROP_MARGIN}
                  width={CROP_SIZE}
                  height={CROP_SIZE}
                  rx={14}
                  fill="none"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth={1.5}
                />
              )}
              {/* Rule-of-thirds guides */}
              <line
                x1={CROP_MARGIN + CROP_SIZE / 3} y1={CROP_MARGIN}
                x2={CROP_MARGIN + CROP_SIZE / 3} y2={CROP_MARGIN + CROP_SIZE}
                stroke="rgba(255,255,255,0.12)" strokeWidth={0.8}
              />
              <line
                x1={CROP_MARGIN + (CROP_SIZE * 2) / 3} y1={CROP_MARGIN}
                x2={CROP_MARGIN + (CROP_SIZE * 2) / 3} y2={CROP_MARGIN + CROP_SIZE}
                stroke="rgba(255,255,255,0.12)" strokeWidth={0.8}
              />
              <line
                x1={CROP_MARGIN} y1={CROP_MARGIN + CROP_SIZE / 3}
                x2={CROP_MARGIN + CROP_SIZE} y2={CROP_MARGIN + CROP_SIZE / 3}
                stroke="rgba(255,255,255,0.12)" strokeWidth={0.8}
              />
              <line
                x1={CROP_MARGIN} y1={CROP_MARGIN + (CROP_SIZE * 2) / 3}
                x2={CROP_MARGIN + CROP_SIZE} y2={CROP_MARGIN + (CROP_SIZE * 2) / 3}
                stroke="rgba(255,255,255,0.12)" strokeWidth={0.8}
              />
            </svg>

            {/* Loading indicator */}
            {!imgSrc && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#2BA84A] animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center justify-center gap-2 px-5 pt-3 pb-6">
          <button
            type="button"
            onClick={() => applyScale(scale / 1.3)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1C2520] text-[#9EAAA4] hover:text-white hover:bg-[#223029] active:scale-95 transition-all"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1C2520] text-[#9EAAA4] hover:text-white hover:bg-[#223029] active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyScale(scale * 1.3)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1C2520] text-[#9EAAA4] hover:text-white hover:bg-[#223029] active:scale-95 transition-all"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
