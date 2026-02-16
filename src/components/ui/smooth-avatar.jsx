/**
 * SmoothAvatar
 * 
 * Zero-CLS avatar with placeholder -> fade-in pattern.
 * - Reserves exact space with explicit width/height.
 * - Shows initials fallback until image loads.
 * - 150ms opacity fade when image arrives.
 * - If no src, shows stable initials forever.
 */

import React, { useState, useCallback } from 'react';

export default function SmoothAvatar({ 
  src, 
  alt = '', 
  fallbackText = '?', 
  size = 40, 
  className = '',
  rounded = 'rounded-xl',
  fallbackBg = 'bg-gradient-to-br from-[#2BA84A] to-[#248232]',
  fallbackTextClass = 'text-white font-semibold',
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const handleLoad = useCallback(() => setLoaded(true), []);
  const handleError = useCallback(() => { setErrored(true); setLoaded(false); }, []);

  const showImage = src && !errored;
  const initial = (fallbackText || '?')[0]?.toUpperCase();

  // Font size scales with container
  const fontSize = size < 28 ? 'text-[9px]' : size < 44 ? 'text-xs' : size < 64 ? 'text-base' : 'text-xl';

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center flex-shrink-0 ${rounded} ${fallbackBg} ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      {/* Initials fallback -- always rendered to prevent layout shift */}
      <span className={`${fallbackTextClass} ${fontSize} select-none`}>
        {initial}
      </span>

      {/* Image layer -- absolutely positioned on top */}
      {showImage && (
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-150 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}