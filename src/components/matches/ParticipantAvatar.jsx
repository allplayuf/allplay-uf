/**
 * Participant Avatar Component
 * 
 * Renders user avatar with fallback and cached user data
 */

import React, { useState, useEffect } from 'react';
import { getCachedUser, getUser } from '@/components/supabase/services';

export function ParticipantAvatar({ userId, size = 'md', className = '' }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try cache first
    const cached = getCachedUser(userId);
    if (cached) {
      setUser(cached);
      setIsLoading(false);
      return;
    }

    // Fetch if not in cache
    setIsLoading(true);
    getUser(userId).then(userData => {
      setUser(userData);
      setIsLoading(false);
    });
  }, [userId]);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  const displayName = user?.display_name || user?.full_name || user?.username || 'Spelare';
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  if (isLoading) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-[#18221E] animate-pulse ${className}`} />
    );
  }

  if (user?.avatar_url || user?.profile_image_url) {
    return (
      <img
        src={user.avatar_url || user.profile_image_url}
        alt={displayName}
        className={`${sizeClasses[size]} rounded-full object-cover bg-[#18221E] ${className}`}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
    );
  }

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[#2BA84A] to-[#248232] flex items-center justify-center font-semibold text-white ${className}`}
    >
      {initials}
    </div>
  );
}

export function ParticipantName({ userId, fallback = 'Spelare' }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cached = getCachedUser(userId);
    if (cached) {
      setUser(cached);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getUser(userId).then(userData => {
      setUser(userData);
      setIsLoading(false);
    });
  }, [userId]);

  if (isLoading) {
    return <span className="text-[#7B8A83]">Laddar...</span>;
  }

  return (
    <span>
      {user?.display_name || user?.full_name || user?.username || fallback}
    </span>
  );
}