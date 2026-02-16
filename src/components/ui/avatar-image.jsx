/**
 * AvatarImage
 * 
 * Renders a user avatar with:
 * - Immediate placeholder (gradient + initial) so there is never a blank space
 * - Image loads in background, fades in over the placeholder when ready
 * - No layout shift: fixed dimensions via className
 */
import React, { useState, useCallback } from 'react';

export default function AvatarImage({ src, name, className = 'w-6 h-6', textClassName = 'text-[9px]', eager = false }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleLoad = useCallback(() => setLoaded(true), []);
  const handleError = useCallback(() => setFailed(true), []);

  const initial = (name || '?')[0].toUpperCase();
  const showImage = src && !failed;

  return (
    <div className={`${className} rounded-full bg-gradient-to-br from-[#2BA84A] to-[#248232] flex items-center justify-center overflow-hidden relative flex-shrink-0`}>
      {/* Placeholder — always rendered, always visible until image covers it */}
      <span className={`${textClassName} font-semibold text-white select-none`}>
        {initial}
      </span>

      {/* Image — loads in background, fades in */}
      {showImage && (
        <img
          src={src}
          alt={name || ''}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          fetchpriority={eager ? 'high' : undefined}
          onLoad={handleLoad}
          onError={handleError}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
}

/**
 * Preload a list of image URLs and resolve when all are loaded (or failed).
 * Use this for "page ready" gating to prevent avatar pop-in.
 * 
 * @param {string[]} urls - Array of image URLs to preload
 * @param {number} timeoutMs - Max time to wait (default 3000ms)
 * @returns {Promise<void>}
 */
export function preloadImages(urls, timeoutMs = 3000) {
  if (!urls || urls.length === 0) return Promise.resolve();

  const uniqueUrls = [...new Set(urls.filter(Boolean))];
  if (uniqueUrls.length === 0) return Promise.resolve();

  return new Promise((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    let remaining = uniqueUrls.length;

    const done = () => {
      remaining--;
      if (remaining <= 0) {
        clearTimeout(timer);
        resolve();
      }
    };

    uniqueUrls.forEach(url => {
      const img = new Image();
      img.onload = done;
      img.onerror = done;
      img.src = url;
    });
  });
}