import React from 'react';
import { Home, Plus, Cloud, HelpCircle, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface MobileBottomBarProps {
  onGoHome: () => void;
  onNewEvent: () => void;
  onOpenDriveConfig: () => void;
  onOpenHelp: () => void;
  isHome: boolean;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  onGoHome,
  onNewEvent,
  onOpenDriveConfig,
  onOpenHelp,
  isHome,
}) => {
  const { isInstalled, isInstallable, install } = usePWAInstall();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Início / Lista */}
        <button
          id="btn-mobile-nav-home"
          onClick={onGoHome}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-w-[56px] ${
            isHome
              ? 'text-teal-400 font-bold bg-white/5'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Cessões</span>
        </button>

        {/* Nuvem & Backup */}
        <button
          id="btn-mobile-nav-cloud"
          onClick={onOpenDriveConfig}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-400 hover:text-slate-200 transition-all min-w-[56px]"
        >
          <Cloud className="w-5 h-5 mb-0.5 text-teal-400" />
          <span className="text-[10px] tracking-tight">Nuvem</span>
        </button>

        {/* Central Prominent Nova Cessão Button */}
        <button
          id="btn-mobile-nav-new"
          onClick={onNewEvent}
          className="flex flex-col items-center justify-center -mt-5"
          title="Nova Cessão de Espaço"
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 flex items-center justify-center shadow-lg shadow-teal-500/40 border-2 border-slate-900 active:scale-95 transition-transform">
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-teal-300 mt-1">Nova</span>
        </button>

        {/* Ajuda / Manual */}
        <button
          id="btn-mobile-nav-help"
          onClick={onOpenHelp}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-400 hover:text-slate-200 transition-all min-w-[56px]"
        >
          <HelpCircle className="w-5 h-5 mb-0.5 text-teal-400" />
          <span className="text-[10px] tracking-tight">Manual</span>
        </button>

        {/* Instalar App (se não estiver instalado) */}
        {!isInstalled && (
          <button
            id="btn-mobile-nav-install"
            onClick={async () => {
              if (isInstallable) {
                await install();
              } else {
                onOpenHelp(); // ou guia
              }
            }}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-teal-300 hover:text-teal-200 transition-all min-w-[56px]"
            title="Instalar como Aplicativo"
          >
            <Smartphone className="w-5 h-5 mb-0.5 animate-bounce" />
            <span className="text-[10px] font-bold tracking-tight">App</span>
          </button>
        )}
      </div>
    </div>
  );
};
