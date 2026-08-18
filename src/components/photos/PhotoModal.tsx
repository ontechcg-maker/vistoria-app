import React from 'react';
import { X, Trash2, Calendar, MapPin, Tag } from 'lucide-react';
import type { FotoVistoria } from '../../types/vistoria';

interface PhotoModalProps {
  foto: FotoVistoria | null;
  onClose: () => void;
  onDelete?: (fotoId: string) => void;
  readOnly?: boolean;
}

export const PhotoModal: React.FC<PhotoModalProps> = ({
  foto,
  onClose,
  onDelete,
  readOnly = false,
}) => {
  if (!foto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                foto.vistoriaTipo === 'INICIAL'
                  ? 'bg-teal-950 text-teal-300 border border-teal-800'
                  : 'bg-rose-950 text-rose-300 border border-rose-800'
              }`}
            >
              {foto.vistoriaTipo === 'INICIAL' ? 'VISTORIA INICIAL' : 'VISTORIA FINAL'}
            </span>
            <span className="text-sm font-semibold text-slate-300 truncate max-w-xs">
              {foto.ambiente}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Display */}
        <div className="bg-slate-950 flex items-center justify-center max-h-[60vh] p-2">
          <img
            src={foto.dataUrl}
            alt={foto.legenda || foto.ambiente}
            className="max-h-[58vh] max-w-full object-contain rounded-lg shadow-inner"
          />
        </div>

        {/* Footer with Details */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            {foto.legenda && (
              <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-teal-600 shrink-0" />
                {foto.legenda}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {foto.ambiente}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(foto.dataHora).toLocaleString('pt-BR')}
              </span>
            </div>
          </div>

          {!readOnly && onDelete && (
            <button
              onClick={() => onDelete(foto.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors self-end sm:self-center"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir Foto</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
