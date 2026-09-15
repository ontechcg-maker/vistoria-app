import React, { useState, useEffect } from 'react';
import { X, Trash2, Calendar, MapPin, Tag, Save, Check, FileText, Edit3 } from 'lucide-react';
import type { FotoVistoria } from '../../types/vistoria';
import { db } from '../../db/database';
import { formatDateTimeBR } from '../../utils/dateUtils';

interface PhotoModalProps {
  foto: FotoVistoria | null;
  onClose: () => void;
  onDelete?: (fotoId: string) => void;
  onPhotoUpdated?: (foto: FotoVistoria) => void;
  readOnly?: boolean;
}

export const PhotoModal: React.FC<PhotoModalProps> = ({
  foto,
  onClose,
  onDelete,
  onPhotoUpdated,
  readOnly = false,
}) => {
  const [titulo, setTitulo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [ambiente, setAmbiente] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (foto) {
      setTitulo(foto.titulo || foto.legenda || '');
      setObservacoes(foto.observacoes || '');
      setAmbiente(foto.ambiente || '');
      setIsSaving(false);
      setSaveStatus('idle');
      // Se não tiver legenda/título nem observação e não for read-only, já abre pronto para editar
      if (!readOnly && (!foto.titulo && !foto.legenda && !foto.observacoes)) {
        setIsEditing(true);
      } else {
        setIsEditing(false);
      }
    }
  }, [foto, readOnly]);

  if (!foto) return null;

  const handleSave = async () => {
    if (!foto) return;
    setIsSaving(true);
    try {
      const updatedFields: Partial<FotoVistoria> = {
        titulo: titulo.trim(),
        legenda: titulo.trim(), // Mantém legenda sincronizada com o título
        observacoes: observacoes.trim(),
        ambiente: ambiente.trim() || foto.ambiente,
      };

      await db.fotos.update(foto.id, updatedFields);
      
      const fotoAtualizada: FotoVistoria = {
        ...foto,
        ...updatedFields,
      };

      if (onPhotoUpdated) {
        onPhotoUpdated(fotoAtualizada);
      }

      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
        setIsEditing(false);
      }, 1200);
    } catch (err) {
      console.error('Erro ao salvar observações da foto:', err);
      alert('Erro ao salvar as informações da foto.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-scale-in">
        {/* Header */}
        <div className="bg-slate-900 px-4 sm:px-5 py-3.5 flex items-center justify-between text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold shrink-0 ${
                foto.vistoriaTipo === 'INICIAL'
                  ? 'bg-teal-950 text-teal-300 border border-teal-800'
                  : 'bg-rose-950 text-rose-300 border border-rose-800'
              }`}
            >
              {foto.vistoriaTipo === 'INICIAL' ? 'VISTORIA INICIAL' : 'VISTORIA FINAL'}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-300 truncate">
              {foto.ambiente}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!readOnly && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-400 hover:text-teal-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                title="Editar título e observações"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Editar Detalhes</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="bg-slate-950 flex items-center justify-center p-2 min-h-[180px] max-h-[42vh] shrink-0 overflow-hidden">
          <img
            src={foto.dataUrl}
            alt={foto.titulo || foto.legenda || foto.ambiente}
            className="max-h-[40vh] max-w-full object-contain rounded-lg shadow-inner"
          />
        </div>

        {/* Content Body: View vs Edit Mode */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 overflow-y-auto flex-1 space-y-3">
          {isEditing && !readOnly ? (
            <div className="space-y-3 bg-white p-3.5 rounded-xl border border-teal-200 shadow-xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-teal-600" />
                  Editar Identificação e Observações da Foto
                </span>
                {saveStatus === 'saved' && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <Check className="w-3.5 h-3.5" /> Salvo!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Título / Legenda da Foto
                  </label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: Trinca na alvenaria, Quadro geral de disjuntores..."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Ambiente / Local
                  </label>
                  <input
                    type="text"
                    value={ambiente}
                    onChange={(e) => setAmbiente(e.target.value)}
                    placeholder="Ex: Salão Principal, Banheiros..."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Observações Técnicas da Foto
                </label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Descreva detalhes, anomalias, avarias ou justificativas verificadas nesta imagem..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    setTitulo(foto.titulo || foto.legenda || '');
                    setObservacoes(foto.observacoes || '');
                    setAmbiente(foto.ambiente || '');
                    setIsEditing(false);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Salvar Informações</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Título / Legenda */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-teal-600 shrink-0" />
                    {foto.titulo || foto.legenda || 'Registro Fotográfico sem título'}
                  </h4>
                </div>

                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 shrink-0"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                )}
              </div>

              {/* Observações da Foto */}
              {foto.observacoes ? (
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700">
                  <span className="font-bold text-slate-900 block mb-0.5 flex items-center gap-1 text-[11px] uppercase tracking-wider text-slate-500">
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    Observação Registrada:
                  </span>
                  <p className="whitespace-pre-wrap leading-relaxed">{foto.observacoes}</p>
                </div>
              ) : !readOnly ? (
                <div 
                  onClick={() => setIsEditing(true)}
                  className="p-2.5 bg-white/70 border border-dashed border-slate-300 rounded-xl text-center cursor-pointer hover:bg-white hover:border-teal-400 transition"
                >
                  <span className="text-xs text-slate-500 flex items-center justify-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Nenhuma observação informada. <strong className="text-teal-600 underline">Clique para adicionar</strong>
                  </span>
                </div>
              ) : null}

              {/* Metadados: Local e Data/Hora com fuso horário corrigido */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <strong>Local:</strong> {foto.ambiente}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <strong>Registrado em:</strong> {formatDateTimeBR(foto.dataHora)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-4 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            As fotos e observações são anexadas ao Termo e Laudo em PDF.
          </span>

          <div className="flex items-center gap-2">
            {!readOnly && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Tem certeza que deseja remover esta fotografia?')) {
                    onDelete(foto.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Foto</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
