import React, { useEffect, useState } from 'react';
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
  if (!/^https?:\/\//i.test(value)) {
    return value.replace(/^\/+/, '').replace(/^avatars\//, '');
  }

  try {
    const url = new URL(value);
    const marker = '/storage/v1/object/sign/avatars/';
    const markerIndex = url.pathname.indexOf(marker);
    return markerIndex === -1
      ? null
      : decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

export default function TaskMateAvatar({
  name,
  photoUrl,
  size = 'md',
  className = '',
  fallbackClassName = '',
}: TaskMateAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [resolvedPhotoUrl, setResolvedPhotoUrl] = useState<string | null>(null);
  const resolvedSize = typeof size === 'number' ? size : sizeMap[size];
  const dim = typeof size === 'number' ? '' : `w-${resolvedSize} h-${resolvedSize}`;
  const avatarPath = getAvatarPath(photoUrl);

  useEffect(() => {
    let cancelled = false;
    setImageError(false);
    setResolvedPhotoUrl(null);

    if (!photoUrl) return () => { cancelled = true; };
    if (/^https?:\/\//i.test(photoUrl)) {
      setResolvedPhotoUrl(photoUrl);
      return () => { cancelled = true; };
    }
    if (!avatarPath) return () => { cancelled = true; };

    void supabase.storage
      .from('avatars')
      .createSignedUrl(avatarPath, 3600)
      .then(({ data, error }) => {
        if (!cancelled && !error && data?.signedUrl) {
          setResolvedPhotoUrl(data.signedUrl);
        }
      });

    return () => { cancelled = true; };
  }, [avatarPath, photoUrl]);

  const refreshPhoto = () => {
    setImageError(true);
    if (!avatarPath) return;
    void supabase.storage
      .from('avatars')
      .createSignedUrl(avatarPath, 3600)
      .then(({ data, error }) => {
        if (!error && data?.signedUrl) {
          setImageError(false);
          setResolvedPhotoUrl(data.signedUrl);
        }
      });
  };

  const shouldRenderImage = Boolean(resolvedPhotoUrl) && !imageError;

  return (
    <div
      className={`${dim} rounded-full overflow-hidden shrink-0 ${className}`}
      style={typeof size === 'number' ? { width: `${resolvedSize * 4}px`, height: `${resolvedSize * 4}px` } : undefined}
    >
      {shouldRenderImage ? (
        <img
          src={resolvedPhotoUrl ?? undefined}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={refreshPhoto}
        />
      ) : (
        <div className={`w-full h-full rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 ${fallbackClassName}`}>
          {name?.trim()?.charAt(0)?.toUpperCase() ?? 'U'}
        </div>
      )}
    </div>
  );
}
