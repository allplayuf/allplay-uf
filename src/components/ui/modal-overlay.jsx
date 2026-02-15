/**
 * ModalOverlay
 * 
 * Standardized modal wrapper with consistent slide-up + dim animation.
 * Use this instead of ad-hoc modal implementations.
 * 
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - children: ReactNode
 *  - className: extra classes for the content panel
 *  - closeOnBackdrop: boolean (default true)
 *  - position: 'bottom' | 'center' (default 'bottom' on mobile, 'center' on desktop)
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MODAL_VARIANTS,
  TRANSITIONS,
  safeTransition,
  prefersReducedMotion,
} from '../utils/motionTokens';

export function ModalOverlay({
  isOpen,
  onClose,
  children,
  className = '',
  closeOnBackdrop = true,
}) {
  const contentRef = useRef(null);
  const transition = safeTransition(TRANSITIONS.modal);
  const reduced = prefersReducedMotion();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Block double-tap
  const closingRef = useRef(false);
  const handleBackdropClick = useCallback(() => {
    if (!closeOnBackdrop || closingRef.current) return;
    closingRef.current = true;
    onClose?.();
    setTimeout(() => { closingRef.current = false; }, 400);
  }, [closeOnBackdrop, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={reduced ? { opacity: 1 } : MODAL_VARIANTS.overlay.initial}
            animate={MODAL_VARIANTS.overlay.animate}
            exit={MODAL_VARIANTS.overlay.exit}
            transition={transition}
            onClick={handleBackdropClick}
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
          />

          {/* Content */}
          <motion.div
            ref={contentRef}
            initial={reduced ? { opacity: 0 } : MODAL_VARIANTS.content.initial}
            animate={MODAL_VARIANTS.content.animate}
            exit={MODAL_VARIANTS.content.exit}
            transition={transition}
            className={`relative z-10 w-full lg:max-w-2xl ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ModalOverlay;