import React, { useState, useEffect, useRef } from 'react';
import { X, HardDrive, Download, Upload, CheckCircle2, AlertCircle, Save, ExternalLink, FolderOpen, Cloud, ShieldCheck } from 'lucide-react';
import type { GoogleDriveConfig } from '../../types/vistoria';
import { getGoogleDriveConfig, saveGoogleDriveConfig } from '../../db/database';
import { exportFullDatabaseBackup, importFullDatabaseBackup } from '../../services/googleDriveService';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored?: () => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'drive'>('backup');
  const [config, setConfig] = useState<GoogleDriveConfig>({
    folderName: 'Vistorias SEDE — Parque do Povo',
    folderId: '14oQVraHMiuWGYb1EuYl17S32-41oKGVQ',
    autoSync: true,
  });

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      getGoogleDriveConfig().then((cfg) => setConfig(cfg));
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveGoogleDriveConfig(config);
      setStatusMessage({ type: 'success', text: 'Configurações da pasta do Google Drive salvas com sucesso!' });
    } catch {
      setStatusMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      await exportFullDatabaseBackup();
      setStatusMessage({ type: 'success', text: 'Arquivo de backup completo exportado com sucesso!' });
    } catch {
      setStatusMessage({ type: 'error', text: 'Erro ao exportar backup.' });
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const res = await importFullDatabaseBackup(files[0]);
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
        if (onDataRestored) onDataRestored();
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    }
    e.target.value = '';
  };

  const folderUrl = `https://drive.google.com/drive/u/0/folders/${config.folderId || '14oQVraHMiuWGYb1EuYl17S32-41oKGVQ'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Backup do Sistema & Google Drive</h2>
              <p className="text-xs text-slate-400">
                Segurança dos dados de vistoria, arquivos JSON e pasta na nuvem
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'backup'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Backup e Restauração (JSON)</span>
          </button>

          <button
            onClick={() => setActiveTab('drive')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'drive'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Pasta Google Drive</span>
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`mx-6 mt-4 p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="flex-1">{statusMessage.text}</span>
          </div>
        )}

        {/* Tab 1: Backup e Restauração */}
        {activeTab === 'backup' && (
          <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
            <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/80 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
              <div className="text-xs text-teal-950 space-y-1">
                <p className="font-bold">Armazenamento Seguro e Offline-First</p>
                <p className="text-teal-800 leading-relaxed">
                  Todos os dados de eventos, vistorias, laudos fotográficos e históricos ficam gravados com segurança na memória do seu dispositivo (IndexedDB) e sincronizados em tempo real com a nuvem Firebase Firestore.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card Exportar */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-teal-100 text-teal-700 w-fit">
                    <Download className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Exportar Banco de Dados</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Baixe um arquivo JSON contendo todos os eventos, vistorias, checklists e fotos registradas neste aparelho para manter cópias de segurança.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition active:scale-95 min-h-[40px]"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Backup Completo</span>
                </button>
              </div>

              {/* Card Importar */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 w-fit">
                    <Upload className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Restaurar de um Arquivo</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Importe um arquivo de backup previamente exportado para recuperar dados off-line ou migrar de dispositivo.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 shadow-sm transition active:scale-95 min-h-[40px]"
                >
                  <Upload className="w-4 h-4 text-slate-600" />
                  <span>Selecionar Arquivo JSON</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Pasta Google Drive */}
        {activeTab === 'drive' && (
          <form onSubmit={handleSaveConfig} className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
            {/* Pasta do Google Drive Vinculada */}
            <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200 text-xs text-teal-950 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-teal-900 text-sm">
                  <FolderOpen className="w-4 h-4 text-teal-700" />
                  Pasta Oficial no Google Drive:
                </span>
                <a
                  href={folderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition"
                >
                  <span>Abrir Pasta</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-[11px] text-teal-900 font-mono bg-white/80 p-2.5 rounded-lg border border-teal-200 break-all select-all">
                {folderUrl}
              </p>
              <p className="text-xs text-teal-800 leading-relaxed">
                Esta é a pasta no Google Drive oficial da SEDE Campina Grande destinada ao arquivamento dos <strong>Termos Oficiais de Vistoria em PDF</strong>.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome da Pasta de Destino
                </label>
                <input
                  type="text"
                  value={config.folderName}
                  onChange={(e) => setConfig({ ...config, folderName: e.target.value })}
                  placeholder="Ex: Vistorias SEDE — Parque do Povo"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ID da Pasta do Google Drive
                </label>
                <input
                  type="text"
                  value={config.folderId || ''}
                  onChange={(e) => setConfig({ ...config, folderId: e.target.value })}
                  placeholder="14oQVraHMiuWGYb1EuYl17S32-41oKGVQ"
                  className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  O ID pode ser obtido no link da pasta no navegador (após <code>/folders/</code>).
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 shadow-md shadow-teal-400/20 transition active:scale-95 disabled:opacity-50 min-h-[40px]"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Configurações</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
