import React from 'react';

interface AppIconProps {
  className?: string;
  size?: number | string;
  showGlow?: boolean;
}

export const AppIcon: React.FC<AppIconProps> = ({
  className = 'w-9 h-9',
  showGlow = true,
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {showGlow && (
        <div className="absolute inset-0 rounded-2xl bg-teal-500/20 blur-sm -z-10 group-hover:bg-teal-400/30 transition-all" />
      )}
      <img
        src="/app-icon.svg"
        alt="Ícone SEDE Vistorias - Parque do Povo"
        className="w-full h-full object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  );
};
