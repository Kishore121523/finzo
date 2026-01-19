'use client';

import Image from 'next/image';
import { User } from 'firebase/auth';
import { useState } from 'react';

interface UserAvatarProps {
  user: User;
  size?: number;
  className?: string;
}

export function UserAvatar({ user, size = 32, className = '' }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Get first letter of name or email
  const getInitial = () => {
    if (user.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // If no photo URL or image failed to load, show initial
  if (!user.photoURL || imageError) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-[#BB86FC] text-black font-semibold ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.5 }}
      >
        {getInitial()}
      </div>
    );
  }

  return (
    <Image
      src={user.photoURL}
      alt={user.displayName || 'User'}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      unoptimized
      onError={() => setImageError(true)}
    />
  );
}
