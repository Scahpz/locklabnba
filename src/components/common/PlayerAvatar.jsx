import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export default function PlayerAvatar({ playerName, photoUrl, className = "w-10 h-10" }) {
  const [error, setError] = useState(false);

  // Get initials from player name
  const initials = playerName
    ?.split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  if (!photoUrl || error) {
    return (
      <div className={cn("rounded-full flex items-center justify-center flex-shrink-0 bg-primary/20 text-primary font-semibold text-xs", className)}>
        {initials}
      </div>
    );
  }

  return (
    <div className={cn("rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-secondary", className)}>
      <img
        src={photoUrl}
        alt={playerName}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
}