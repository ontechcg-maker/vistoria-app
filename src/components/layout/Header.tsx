import React, { useState, useEffect } from 'react';
import { Plus, Cloud, RefreshCw, CheckCircle2, AlertCircle, Database, HelpCircle } from 'lucide-react';
import { AppIcon } from '../common/AppIcon';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { subscribeSyncStatus, pullFromGoogleSheets, type SyncStatus } from '../../services/googleSheetsSyncService';
import { subscribeFirebaseSync, migrateLocalDataToFirestore, type FirebaseSyncState } from '../../services/firestoreSyncService';

interface HeaderProps {
  onNewEvent: () => void;
  onOpenDriveConfig: () => void;
  onOpenHelp: () => void;
  onGoHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNewEvent,
  onOpenDriveConfig,
  onOpenHelp,
  onGoHome,
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncedAt: null,
    error: null,
    successMessage: null,
  });

  const [firebaseSync, setFirebaseSync] = useState<FirebaseSyncState>({
    isConnected: true,
    isSyncing: false,
    lastSyncTime: null,
    cloudEventsCount: 0,
    error: null,
  });

  useEffect(() => {
    const unsubSheets = subscribeSyncStatus((st) => setSyncStatus(st));
    const unsubFirebase = subscribeFirebaseSync((fb) => setFirebaseSync(fb));
    return () => {
      unsubSheets();
      unsubFirebase();
    };
  }, []);

  const handleManualSync = async () => {
    if (syncStatus.isSyncing) return;
    await pullFromGoogleSheets(true);
  };

  const handleFirebaseSync = async () => {
    if (firebaseSync.isSyncing) return;
    await migrateLocalDataToFirestore();
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Logo & Title */}
          <div 
            id="btn-header-home"
            onClick={onGoHome}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none min-w-0"
          >
            {/* Custom System Icon */}
            <AppIcon className="w-8 h-8 sm:w-10 sm:h-10" />

            <div className="h-7 sm:h-9 flex items-center bg-white/5 p-1 rounded-xl border border-white/10 shrink-0 hidden xs:flex">
              <img
                src="/logo-sede.png"
                alt="SEDE Campina Grande"
                className="h-5 sm:h-7 w-auto object-contain"
              />
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs sm:text-base tracking-tight text-white truncate group-hover:text-teal-300 transition-colors">
                  SEDE Vistorias
                </span>
                <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800">
                  Campina Grande
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate hidden xs:block">
                Parque do Povo • Cessão de Espaço
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Firebase Cloud Status & Sync */}
            <button
              id="btn-header-firebase-sync"
              onClick={handleFirebaseSync}
              disabled={firebaseSync.isSyncing}
              title={
                firebaseSync.isSyncing
                  ? 'Sincronizando com Firestore...'
                  : firebaseSync.isConnected
                  ? `Firebase Cloud Conectado (${firebaseSync.cloudEventsCount} eventos na nuvem). Clique para forçar sincronização.`
                  : 'Modo Offline: dados salvos localmente e sincronizados assim que a conexão retornar.'
              }
              className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold rounded-xl border transition-all active:scale-95 min-h-[38px] sm:min-h-[42px] ${
                firebaseSync.isSyncing
                  ? 'bg-amber-950/40 text-amber-300 border-amber-800 animate-pulse'
                  : firebaseSync.isConnected
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800 hover:bg-emerald-900/50'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <Database className={`w-3.5 h-3.5 ${firebaseSync.isSyncing ? 'animate-spin text-amber-400' : 'text-emerald-400'}`} />
              <span className="hidden xl:inline">
                {firebaseSync.isSyncing ? 'Nuvem: Enviando...' : 'Nuvem: Conectada'}
              </span>
              <span className={`w-2 h-2 rounded-full ${firebaseSync.isConnected ? 'bg-emerald-400' : 'bg-slate-400'}`} />
            </button>

            {/* Sync Now Button with Google Sheets */}
            <button
              id="btn-header-sheets-sync"
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

            {/* Install Mobile PWA Button */}
            <PWAInstallButton variant="header" />

            {/* Google Drive / Sheets Modal */}
            <button
              id="btn-header-drive-config"
              onClick={onOpenDriveConfig}
              title="Configurar Google Sheets, Google Drive e Backup"
              className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold rounded-xl text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all active:scale-95 min-h-[38px] sm:min-h-[42px]"
            >
              <Cloud className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="hidden lg:inline">Google Drive & Sheets</span>
            </button>

            {/* Help / Manual Modal */}
            <button
              id="btn-header-help"
              onClick={onOpenHelp}
              title="Manual de Ajuda com Prints das Telas e Passo a Passo"
              className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold rounded-xl text-teal-300 bg-teal-950/60 hover:bg-teal-900/60 border border-teal-800/80 transition-all active:scale-95 min-h-[38px] sm:min-h-[42px]"
            >
              <HelpCircle className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="hidden md:inline">Ajuda</span>
            </button>

            {/* New Event Button */}
            <button
              id="btn-header-new-event"
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
