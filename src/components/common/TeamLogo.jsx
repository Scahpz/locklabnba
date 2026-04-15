import React, { useState } from 'react';
import { getTeamLogoUrl } from '@/lib/teamLogos';

export default function TeamLogo({ team, className = "w-10 h-10", bgClass = "bg-secondary" }) {
  const [error, setError] = useState(false);
  const url = getTeamLogoUrl(team);

  if (!url || error) {
    return (
      <div className={`${bgClass} rounded-full flex items-center justify-center flex-shrink-0 ${className}`}>
        <span className="text-[10px] font-bold text-muted-foreground">{team}</span>
      </div>
    );
  }

  return (
    <div className={`${bgClass} rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${className}`}>
      <img
        src={url}
        alt={team}
        className="w-[75%] h-[75%] object-contain"
        onError={() => setError(true)}
      />
    </div>
  );
}