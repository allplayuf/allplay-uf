import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * OptimizedImage component with lazy loading, blur placeholder, and WebP support
 * Automatically handles image optimization and progressive loading
 */
export function OptimizedImage({ 
  src, 
  alt, 
  className = '', 
  width,
  height,
  priority = false,
  objectFit = 'cover',
  quality = 75,
  fallbackSrc = '/placeholder-image.png'
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Generate responsive image sources
  const generateSrcSet = (originalSrc) => {
    if (!originalSrc || originalSrc.startsWith('data:')) return null;
    
    // For Supabase images, we can add query params for resizing
    const widths = [320, 640, 960, 1280, 1920];
    
    // Check if it's a Supabase URL
    if (originalSrc.includes('supabase.co')) {
      return widths
        .map(w => `${originalSrc}?width=${w}&quality=${quality} ${w}w`)
        .join(', ');
    }
    
    return null;
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const displaySrc = hasError ? fallbackSrc : src;
  const srcSet = generateSrcSet(src);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Blur placeholder */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#18221E] to-[#0F1513]">
          <div className="w-full h-full bg-gradient-to-br from-[#2BA84A]/10 to-[#248232]/10 animate-pulse" />
        </div>
      )}
      
      {/* Actual image */}
      <motion.img
        src={displaySrc}
        srcSet={srcSet || undefined}
        sizes={width ? `${width}px` : '100vw'}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: isLoading ? 0 : 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{ 
          objectFit,
          width: '100%',
          height: '100%'
        }}
        className="absolute inset-0"
      />
    </div>
  );
}

/**
 * ProfileImage - Optimized for user profile images
 */
export function ProfileImage({ src, alt, size = 'md', className = '' }) {
  const sizes = {
    xs: { width: 32, height: 32 },
    sm: { width: 48, height: 48 },
    md: { width: 64, height: 64 },
    lg: { width: 96, height: 96 },
    xl: { width: 128, height: 128 }
  };

  const { width, height } = sizes[size] || sizes.md;

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`rounded-full ${className}`}
      objectFit="cover"
      quality={85}
    />
  );
}

/**
 * TeamLogo - Optimized for team logos
 */
export function TeamLogo({ src, alt, size = 'md', className = '' }) {
  const sizes = {
    sm: { width: 40, height: 40 },
    md: { width: 64, height: 64 },
    lg: { width: 96, height: 96 }
  };

  const { width, height } = sizes[size] || sizes.md;

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`rounded-xl ${className}`}
      objectFit="contain"
      quality={90}
    />
  );
}