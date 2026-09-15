import React from 'react';
import { WifiOff, Database } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-16 right-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600/95 text-white px-3 py-2 text-xs font-semibold shadow-xl border border-amber-400/50 backdrop-blur-sm animate-pulse">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Modo Offline Ativo • Gravando no Cache Local</span>
      <Database className="w-3.5 h-3.5 opacity-80" />
    </div>
  );
};
