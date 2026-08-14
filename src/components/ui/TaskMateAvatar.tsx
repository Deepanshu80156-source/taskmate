import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { normalizeAvatarStoragePath } from '@/lib/fileUpload';

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
  return normalizeAvatarStoragePath(value);
}

function isLikelyExternalImage(value?: string): boolean {
  if (!value) return false;
  return /^https?:\/\//i.test(value.trim());
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
  const retryRef = useRef(false);
  const signedUrlCacheRef = useRef<Map<string, { url: string; expiresAt: number }>>(new Map());

  const resolvedSize = typeof size === 'number' ? size : sizeMap[size];
  const dim = typeof size === 'number' ? '' : `w-${resolvedSize} h-${resolvedSize}`;
  const avatarPath = useMemo(() => getAvatarPath(photoUrl), [photoUrl]);
  const directExternalUrl = useMemo(() => {
    if (!photoUrl) return null;
    const trimmed = photoUrl.trim();
    if (!isLikelyExternalImage(trimmed)) return null;
    return normalizeAvatarStoragePath(trimmed) ? null : trimmed;
  }, [photoUrl]);

  useEffect(() => {
    let cancelled = false;

    const fetchSignedUrl = async () => {
      if (!avatarPath) {
        if (!cancelled) {
          setResolvedPhotoUrl(directExternalUrl ?? null);
          setIsLoading(false);
          retryRef.current = false;
        }
        return;
      }

      const cached = signedUrlCacheRef.current.get(avatarPath);
      const now = Date.now();
      if (cached && cached.expiresAt > now + 60_000) {
        if (!cancelled) {
          setResolvedPhotoUrl(cached.url);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase.storage
        .from('avatars')
        .createSignedUrl(avatarPath, 3600);

      if (cancelled) return;

      if (!error && data?.signedUrl) {
        signedUrlCacheRef.current.set(avatarPath, {
          url: data.signedUrl,
          expiresAt: Date.now() + 3_500_000,
        });
        setResolvedPhotoUrl(data.signedUrl);
      } else {
        setResolvedPhotoUrl(null);
      }
      setIsLoading(false);
      retryRef.current = false;
    };

    void fetchSignedUrl();

    return () => {
      cancelled = true;
    };
  }, [avatarPath, directExternalUrl]);

  const handleImageError = async () => {
    if (!avatarPath) {
      setResolvedPhotoUrl(directExternalUrl ?? null);
      return;
    }

    if (retryRef.current) {
      setResolvedPhotoUrl(null);
      return;
    }

    retryRef.current = true;
    const cached = signedUrlCacheRef.current.get(avatarPath);
    if (cached) {
      signedUrlCacheRef.current.delete(avatarPath);
    }

    const { data, error } = await supabase.storage
      .from('avatars')
      .createSignedUrl(avatarPath, 3600);

    if (!error && data?.signedUrl) {
      signedUrlCacheRef.current.set(avatarPath, {
        url: data.signedUrl,
        expiresAt: Date.now() + 3_500_000,
      });
      setResolvedPhotoUrl(data.signedUrl);
      return;
    }

    setResolvedPhotoUrl(null);
  };

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
          onError={handleImageError}
        />
      ) : (
        <div className={`w-full h-full rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 ${fallbackClassName}`}>
          {name?.trim()?.charAt(0)?.toUpperCase() ?? 'U'}
        </div>
      )}
    </div>
  );
}
