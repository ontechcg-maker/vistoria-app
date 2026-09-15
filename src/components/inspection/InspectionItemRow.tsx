import React, { useState, useEffect } from 'react';
import { Check, AlertCircle, XCircle, MinusCircle, Camera, MessageSquare, Image as ImageIcon, Trash2 } from 'lucide-react';
import type { ItemVistoria, CondicaoItem, FotoVistoria } from '../../types/vistoria';
import { PhotoUploader } from '../photos/PhotoUploader';

interface InspectionItemRowProps {
  item: ItemVistoria;
  fotos?: FotoVistoria[];
  readOnly?: boolean;
  onUpdate: (updated: Partial<ItemVistoria>) => void;
  onDeleteItem?: (itemId: string) => void;
  onViewPhoto?: (foto: FotoVistoria) => void;
  onPhotoAdded?: () => void;
}

export const InspectionItemRow: React.FC<InspectionItemRowProps> = ({
  item,
  fotos = [],
  readOnly = false,
  onUpdate,
  onDeleteItem,
  onViewPhoto,
  onPhotoAdded,
}) => {
  const [showObs, setShowObs] = useState(Boolean(item.observacao));
  const [localObs, setLocalObs] = useState(item.observacao || '');
  const [isObsSaving, setIsObsSaving] = useState(false);
  const [showPhotoUploader, setShowPhotoUploader] = useState(false);

  useEffect(() => {
    setLocalObs(item.observacao || '');
    if (item.observacao) {
      setShowObs(true);
    }
  }, [item.observacao]);

  const handleCommitObs = () => {
    const trimmed = localObs.trim();
    if (trimmed !== (item.observacao || '')) {
      setIsObsSaving(true);
      onUpdate({ observacao: trimmed });
      setTimeout(() => setIsObsSaving(false), 700);
    }
  };

  const statusButtons: { value: CondicaoItem; label: string; icon: React.FC<{ className?: string }>; activeClass: string }[] = [
    {
      value: 'BOM',
      label: 'Bom',
      icon: Check,
      activeClass: 'bg-emerald-600 text-white shadow-sm border-emerald-700 font-bold',
    },
    {
      value: 'REGULAR',
      label: 'Regular',
      icon: AlertCircle,
      activeClass: 'bg-amber-500 text-white shadow-sm border-amber-600 font-bold',
    },
    {
      value: 'RUIM',
      label: 'Ruim',
      icon: XCircle,
      activeClass: 'bg-rose-600 text-white shadow-sm border-rose-700 font-bold',
    },
    {
      value: 'NAO_SE_APLICA',
      label: 'N/A',
      icon: MinusCircle,
      activeClass: 'bg-slate-600 text-white shadow-sm border-slate-700 font-bold',
    },
  ];

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 ${
        item.situacao === 'RUIM'
          ? 'bg-rose-50/60 border-rose-200'
          : item.situacao === 'REGULAR'
          ? 'bg-amber-50/50 border-amber-200'
          : item.situacao === 'NAO_SE_APLICA'
          ? 'bg-slate-50/70 border-slate-200 opacity-70'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex flex-col gap-3">
        {/* Top: Item Checkbox & Title */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <button
              type="button"
              disabled={readOnly}
              onClick={() => onUpdate({ conferido: !item.conferido })}
              className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition active:scale-95 ${
                item.conferido
                  ? 'bg-teal-600 border-teal-600 text-white'
                  : 'border-slate-300 bg-white hover:border-teal-500'
              }`}
              title="Marcar como conferido"
            >
              {item.conferido && <Check className="w-4 h-4 stroke-[3]" />}
            </button>

            <div className="flex-1 min-w-0">
              <span className={`text-sm font-semibold block leading-tight ${item.situacao === 'NAO_SE_APLICA' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                {item.descricao}
              </span>

              {/* Photos Badge and Thumbnails */}
              {fotos.length > 0 && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-[11px] text-teal-800 bg-teal-50 border border-teal-200 flex items-center gap-1 font-bold px-2 py-0.5 rounded-md">
                    <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
                    {fotos.length} {fotos.length === 1 ? 'foto anexada' : 'fotos anexadas'}
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
                    {fotos.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => onViewPhoto && onViewPhoto(f)}
                        className="w-9 h-9 rounded-lg overflow-hidden border-2 border-teal-400 hover:border-teal-600 shrink-0 hover:scale-105 transition shadow-xs cursor-pointer block"
                        title="Ver foto em tamanho ampliado"
                      >
                        <img src={f.dataUrl} alt="Anexo" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions (Obs, Camera, Delete) */}
          {!readOnly && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setShowObs(!showObs)}
                title="Adicionar / Editar observação"
                className={`p-2 rounded-xl border transition min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95 ${
                  item.observacao
                    ? 'bg-amber-50 text-amber-700 border-amber-300'
                    : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowPhotoUploader(!showPhotoUploader)}
                title={fotos.length > 0 ? `${fotos.length} foto(s) anexada(s). Clique para gerenciar ou adicionar mais.` : "Anexar foto deste item"}
                className={`p-2 rounded-xl border transition min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95 relative ${
                  fotos.length > 0
                    ? 'bg-teal-50 text-teal-700 border-teal-300 font-bold hover:bg-teal-100'
                    : 'bg-white text-slate-500 hover:text-teal-700 hover:bg-teal-50 border-slate-200'
                }`}
              >
                <Camera className="w-4 h-4" />
                {fotos.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-teal-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-xs">
                    {fotos.length}
                  </span>
                )}
              </button>

              {onDeleteItem && (
                <button
                  type="button"
                  onClick={() => onDeleteItem(item.id)}
                  title="Remover item da vistoria"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition min-h-[38px] min-w-[38px] flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom: Mobile-Optimized Status Buttons */}
        <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {statusButtons.map((btn) => {
            const Icon = btn.icon;
            const isSelected = item.situacao === btn.value;

            return (
              <button
                key={btn.value}
                type="button"
                disabled={readOnly}
                onClick={() => onUpdate({ situacao: btn.value, conferido: true })}
                className={`py-2 px-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition active:scale-95 min-h-[38px] ${
                  isSelected
                    ? btn.activeClass
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 bg-white/50 sm:bg-transparent'
                } disabled:opacity-80`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] sm:text-xs truncate">{btn.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Observation Field */}
      {(showObs || item.observacao || localObs) && (
        <div className="mt-3 pt-3 border-t border-slate-200/80">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-amber-600" />
              Observação / Ressalva deste item
            </label>
            {isObsSaving ? (
              <span className="text-[10px] text-teal-600 font-bold animate-pulse">Salvando...</span>
            ) : localObs ? (
              <span className="text-[10px] text-slate-400">Salvo no item</span>
            ) : null}
          </div>
          <input
            type="text"
            disabled={readOnly}
            value={localObs}
            onChange={(e) => setLocalObs(e.target.value)}
            onBlur={handleCommitObs}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            placeholder="Descreva aqui avaria, condição específica ou observação deste item..."
            className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white min-h-[40px]"
          />
        </div>
      )}

      {/* Inline Photo Uploader */}
      {showPhotoUploader && !readOnly && (
        <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-teal-600" />
              Anexar foto para: <strong className="text-slate-900">{item.descricao}</strong>
            </span>
            <button
              type="button"
              onClick={() => setShowPhotoUploader(false)}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 px-2 py-0.5 rounded hover:bg-slate-100 transition"
            >
              Fechar
            </button>
          </div>

          <PhotoUploader
            eventoId={item.eventoId}
            vistoriaTipo={item.vistoriaTipo}
            ambiente={item.ambiente}
            itemId={item.id}
            defaultTitulo={item.descricao}
            onPhotoAdded={() => {
              if (onPhotoAdded) onPhotoAdded();
            }}
          />
        </div>
      )}
    </div>
  );
};
