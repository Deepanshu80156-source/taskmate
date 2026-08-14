import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

interface TaskMateAvatarProps {
  name: string;
  photoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | number;
  className?: string;
  fallbackClassName?: string;
}

const sizeMap = {
  sm: 8,
  md: 10,
  lg: 16,
};

function getAvatarPath(value?: string): string | null {
  if (!value) return null;
  // If it's already a full URL, return null (we'll use it directly)
  if (/^https?:\/\//i.test(value)) {
    return null;
  }
  // Extract the path, removing 'avatars/' prefix if present
  return value.replace(/^\/+/, '').replace(/^avatars\//, '');
}

export default function TaskMateAvatar({
  name,
  photoUrl,
  size = 'md',
  className = '',
  fallbackClassName = '',
}: TaskMateAvatarProps) {
  const [resolvedPhotoUrl, setResolvedPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const resolvedSize = typeof size === 'number' ? size : sizeMap[size];
  const dim = typeof size === 'number' ? '' : `w-${resolvedSize} h-${resolvedSize}`;
  
  // Determine if this is a storage path or direct URL
  const isDirectUrl = photoUrl && /^https?:\/\//i.test(photoUrl);
  const avatarPath = useMemo(() => getAvatarPath(photoUrl), [photoUrl]);

  // Load photo URL when photoUrl prop changes
  useEffect(() => {
    let cancelled = false;

    // No photo URL provided
    if (!photoUrl) {
      setResolvedPhotoUrl(null);
      setIsLoading(false);
      return;
    }

    // Direct URL (already signed or public)
    if (isDirectUrl) {
      setResolvedPhotoUrl(photoUrl);
      setIsLoading(false);
      return;
    }

    // Need to get signed URL from storage
    if (!avatarPath) {
      setResolvedPhotoUrl(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    void supabase.storage
      .from('avatars')
      .createSignedUrl(avatarPath, 3600)
      .then(({ data, error }) => {
        if (!cancelled) {
          if (!error && data?.signedUrl) {
            setResolvedPhotoUrl(data.signedUrl);
          } else {
            setResolvedPhotoUrl(null);
          }
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolvedPhotoUrl(null);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [photoUrl, isDirectUrl, avatarPath]);

  // Show image if we have a resolved URL, otherwise show fallback
  const showImage = Boolean(resolvedPhotoUrl) && !isLoading;

  return (
    <div
      className={`${dim} rounded-full overflow-hidden shrink-0 ${className}`}
      style={typeof size === 'number' ? { width: `${resolvedSize * 4}px`, height: `${resolvedSize * 4}px` } : undefined}
      title={name}
    >
      {showImage && resolvedPhotoUrl ? (
        <img
          src={resolvedPhotoUrl}
          alt={name}
          className="w-full h-full object-cover bg-secondary"
          loading="lazy"
          onError={() => setResolvedPhotoUrl(null)}
        />
      ) : (
        <div className={`w-full h-full rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 ${fallbackClassName}`}>
          {name?.trim()?.charAt(0)?.toUpperCase() ?? 'U'}
        </div>
      )}
    </div>
  );
}
