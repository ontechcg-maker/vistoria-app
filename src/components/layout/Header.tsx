import React, { useState, useEffect } from 'react';
import { Plus, Cloud, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { subscribeSyncStatus, pullFromGoogleSheets, type SyncStatus } from '../../services/googleSheetsSyncService';

interface HeaderProps {
  onNewEvent: () => void;
  onOpenDriveConfig: () => void;
  onGoHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNewEvent,
  onOpenDriveConfig,
  onGoHome,
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncedAt: null,
    error: null,
    successMessage: null,
  });

  useEffect(() => {
    return subscribeSyncStatus((st) => setSyncStatus(st));
  }, []);

  const handleManualSync = async () => {
    if (syncStatus.isSyncing) return;
    await pullFromGoogleSheets(true);
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Logo & Title */}
          <div 
            onClick={onGoHome}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none min-w-0"
          >
            <div className="h-9 sm:h-12 flex items-center bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
              <img
                src="/logo-sede.png"
                alt="SEDE Campina Grande"
                className="h-7 sm:h-10 w-auto object-contain"
              />
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs sm:text-base tracking-tight text-white truncate">
                  SEDE Vistorias
                </span>
                <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800">
                  Campina Grande
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate hidden xs:block">
                Cessão de Espaço Público
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Sync Now Button with Google Sheets */}
            <button
              onClick={handleManualSync}
              disabled={syncStatus.isSyncing}
              title={syncStatus.error ? `Erro: ${syncStatus.error}. Clique para tentar sincronizar.` : 'Sincronizar com Google Sheets'}
              className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold rounded-xl border transition-all active:scale-95 min-h-[38px] sm:min-h-[42px] ${
                syncStatus.error
                  ? 'bg-rose-950/40 text-rose-300 border-rose-800/80 hover:bg-rose-900/50'
                  : syncStatus.isSyncing
                  ? 'bg-teal-950/50 text-teal-300 border-teal-800 animate-pulse'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncStatus.isSyncing ? 'animate-spin text-teal-400' : ''}`} />
              <span className="hidden md:inline">
                {syncStatus.isSyncing ? 'Sincronizando...' : 'Sincronizar'}
              </span>
              {syncStatus.error ? (
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              ) : syncStatus.lastSyncedAt ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400 hidden sm:inline" />
              ) : null}
            </button>

            {/* Google Drive / Sheets Modal */}
            <button
              onClick={onOpenDriveConfig}
              title="Configurar Google Sheets, Google Drive e Backup"
              className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold rounded-xl text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all active:scale-95 min-h-[38px] sm:min-h-[42px]"
            >
              <Cloud className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="hidden lg:inline">Google Drive & Sheets</span>
            </button>

            {/* New Event Button */}
            <button
              onClick={onNewEvent}
              className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 shadow-md shadow-teal-500/20 active:scale-95 transition-all min-h-[38px] sm:min-h-[42px]"
            >
              <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
              <span className="hidden sm:inline">Nova Cessão</span>
              <span className="sm:hidden font-bold">Novo</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
