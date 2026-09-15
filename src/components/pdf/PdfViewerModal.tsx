import React, { useState, useEffect } from 'react';
import { X, Download, Printer, Cloud, CheckCircle, Loader2, FileText, AlertCircle } from 'lucide-react';
import type { jsPDF } from 'jspdf';
import { syncEventToGoogleDrive } from '../../services/googleDriveService';

interface PdfViewerModalProps {
  isOpen: boolean;
  doc: jsPDF | null;
  eventoId: string;
  codigoEvento: string;
  isDraft?: boolean;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  doc,
  eventoId,
  codigoEvento,
  isDraft = false,
  onClose,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  useEffect(() => {
    if (doc) {
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setSyncStatus(null);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPdfUrl(null);
    }
  }, [doc]);

  if (!isOpen || !doc) return null;

  const handleDownload = () => {
    const filename = `Termo_Vistoria_${codigoEvento || 'Evento'}_${isDraft ? 'RASCUNHO' : 'OFICIAL'}.pdf`;
    doc.save(filename);
  };

  const handlePrint = () => {
    try {
      const iframe = document.querySelector('iframe[title="Termo de Vistoria PDF"]') as HTMLIFrameElement | null;
      if (iframe?.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        return;
      }
    } catch {
      // Fallback if cross-origin or blocked
    }
    doc.autoPrint();
    const blob = doc.output('bloburl');
    window.open(blob, '_blank');
  };

  const handleSyncDrive = async () => {
    setIsSyncingDrive(true);
    setSyncStatus(null);
    try {
      const res = await syncEventToGoogleDrive(eventoId);
      setSyncStatus({ success: res.success, message: res.message });
    } catch (err: unknown) {
      setSyncStatus({ success: false, message: (err as Error).message || 'Erro ao sincronizar com Google Drive' });
    } finally {
      setIsSyncingDrive(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[94vh] sm:h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-scale-in">
        {/* Header Toolbar */}
        <div className="bg-slate-900 px-3.5 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-base font-bold truncate">
                    Termo de Vistoria Oficial
                  </h3>
                  {isDraft && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                      RASCUNHO
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                  Processo: {codigoEvento}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition sm:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 justify-end">
            <button
              onClick={handleSyncDrive}
              disabled={isSyncingDrive}
              title="Salvar cópia na pasta do Google Drive"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 transition active:scale-95 disabled:opacity-50 min-h-[38px]"
            >
              {isSyncingDrive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Google Drive</span>
              <span className="sm:hidden text-[11px]">Drive</span>
            </button>

            <button
              onClick={handlePrint}
              title="Imprimir documento"
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95 min-h-[38px] min-w-[38px] flex items-center justify-center"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 shadow-md shadow-teal-400/20 transition active:scale-95 min-h-[38px]"
            >
              <Download className="w-4 h-4" />
              <span>Baixar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition hidden sm:block"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sync Status Alert */}
        {syncStatus && (
          <div
            className={`px-4 py-2 text-xs font-medium flex items-center gap-2 border-b shrink-0 ${
              syncStatus.success
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {syncStatus.success ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{syncStatus.message}</span>
          </div>
        )}

        {/* PDF Embedded View */}
        <div className="flex-1 bg-slate-100 p-1 sm:p-2 overflow-hidden flex items-center justify-center">
          {pdfUrl ? (
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0`}
              title="Termo de Vistoria em PDF"
              className="w-full h-full rounded-xl border border-slate-300 shadow-inner bg-white"
            />
          ) : (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Carregando documento...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
