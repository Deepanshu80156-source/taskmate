import React, { useState } from 'react';

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

export default function TaskMateAvatar({
  name,
  photoUrl,
  size = 'md',
  className = '',
  fallbackClassName = '',
}: TaskMateAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const resolvedSize = typeof size === 'number' ? size : sizeMap[size];
  const dim = `w-${resolvedSize} h-${resolvedSize}`;

  const shouldRenderImage = Boolean(photoUrl) && !imageError;

  return (
    <div className={`${dim} rounded-full overflow-hidden shrink-0 ${className}`}>
      {shouldRenderImage ? (
        <img
          src={photoUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className={`w-full h-full rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 ${fallbackClassName}`}>
          {name?.trim()?.charAt(0)?.toUpperCase() ?? 'U'}
        </div>
      )}
    </div>
  );
}
