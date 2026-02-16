/**
 * AvatarImage
 * 
 * Renders a user avatar with:
 * - Immediate placeholder (gradient + initial) so there is never a blank space
 * - Image loads in background, fades in over the placeholder when ready
 * - No layout shift: fixed dimensions via className
 */
import React, { useState, useCallback } from 'react';

export default function AvatarImage({ src, name, className = 'w-6 h-6', textClassName = 'text-[9px]' }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleLoad = useCallback(() => setLoaded(true), []);
  const handleError = useCallback(() => setFailed(true), []);

  const initial = (name || '?')[0].toUpperCase();
  const showImage = src && !failed;

  // Allow className to override border-radius (e.g. !rounded-xl)
  const hasCustomRadius = className.includes('rounded-');

  return (
    <div className={`${className} ${hasCustomRadius ? '' : 'rounded-full'} bg-gradient-to-br from-[#2BA84A] to-[#248232] flex items-center justify-center overflow-hidden relative flex-shrink-0`}>
      {/* Placeholder — always rendered, always visible until image covers it */}
      <span className={`${textClassName} font-semibold text-white select-none`}>
        {initial}
      </span>

      {/* Image — loads in background, fades in */}
      {showImage && (
        <img
          src={src}
          alt={name || ''}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
}