import React, { useState } from 'react';
import { Image as ImageIcon, Filter, Eye, Trash2, Edit3, FileText, Tag } from 'lucide-react';
import type { FotoVistoria } from '../../types/vistoria';
import { PhotoModal } from './PhotoModal';
import { PhotoUploader } from './PhotoUploader';
import { formatDateTimeBR } from '../../utils/dateUtils';

interface PhotoGalleryProps {
  eventoId: string;
  fotos: FotoVistoria[];
  onDeletePhoto?: (fotoId: string) => void;
  onPhotoAdded?: () => void;
  readOnly?: boolean;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  eventoId,
  fotos,
  onDeletePhoto,
  onPhotoAdded,
  readOnly = false,
}) => {
  const [selectedStage, setSelectedStage] = useState<'ALL' | 'INICIAL' | 'FINAL'>('ALL');
  const [selectedAmbiente, setSelectedAmbiente] = useState<string>('ALL');
  const [activePhoto, setActivePhoto] = useState<FotoVistoria | null>(null);

  const [uploadStage, setUploadStage] = useState<'INICIAL' | 'FINAL'>('INICIAL');
  const [uploadAmbiente, setUploadAmbiente] = useState<string>('Geral do Evento');

  // Ambientes únicos presentes nas fotos
  const ambientes = Array.from(new Set(fotos.map((f) => f.ambiente)));

  const filteredFotos = fotos.filter((f) => {
    if (selectedStage !== 'ALL' && f.vistoriaTipo !== selectedStage) return false;
    if (selectedAmbiente !== 'ALL' && f.ambiente !== selectedAmbiente) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Upload Box if not read-only */}
      {!readOnly && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-teal-600" />
              Adicionar Registro Fotográfico
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setUploadStage('INICIAL')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    uploadStage === 'INICIAL' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pré-evento
                </button>
                <button
                  type="button"
                  onClick={() => setUploadStage('FINAL')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    uploadStage === 'FINAL' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pós-evento
                </button>
              </div>

              <input
                type="text"
                value={uploadAmbiente}
                onChange={(e) => setUploadAmbiente(e.target.value)}
                placeholder="Ambiente / Local..."
                className="px-3 py-1 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500 outline-none w-44"
              />
            </div>
          </div>

          <PhotoUploader
            eventoId={eventoId}
            vistoriaTipo={uploadStage}
            ambiente={uploadAmbiente || 'Geral do Evento'}
            onPhotoAdded={() => {
              if (onPhotoAdded) onPhotoAdded();
            }}
          />
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Filtros ({filteredFotos.length} de {fotos.length})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Stage filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setSelectedStage('ALL')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                selectedStage === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setSelectedStage('INICIAL')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                selectedStage === 'INICIAL' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pré-evento ({fotos.filter(f => f.vistoriaTipo === 'INICIAL').length})
            </button>
            <button
              onClick={() => setSelectedStage('FINAL')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                selectedStage === 'FINAL' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pós-evento ({fotos.filter(f => f.vistoriaTipo === 'FINAL').length})
            </button>
          </div>

          {/* Environment filter */}
          {ambientes.length > 0 && (
            <select
              value={selectedAmbiente}
              onChange={(e) => setSelectedAmbiente(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-300 bg-white text-slate-700 outline-none"
            >
              <option value="ALL">Todos os Ambientes</option>
              {ambientes.map((amb) => (
                <option key={amb} value={amb}>
                  {amb}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Grid of Photos */}
      {filteredFotos.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-700">Nenhuma fotografia encontrada</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            As fotos tiradas durante as vistorias inicial e final aparecerão automaticamente nesta galeria e no Termo em PDF.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFotos.map((foto) => (
            <div
              key={foto.id}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              {/* Image Thumbnail with Overlay */}
              <div 
                onClick={() => setActivePhoto(foto)}
                className="relative aspect-4/3 bg-slate-950 overflow-hidden cursor-pointer"
              >
                <img
                  src={foto.dataUrl}
                  alt={foto.titulo || foto.legenda || foto.ambiente}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Badge de Etapa */}
                <div className="absolute top-2 left-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-sm ${
                      foto.vistoriaTipo === 'INICIAL'
                        ? 'bg-teal-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {foto.vistoriaTipo === 'INICIAL' ? 'PRÉ-EVENTO' : 'PÓS-EVENTO'}
                  </span>
                </div>

                {/* Hover overlay icon */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <div className="p-2 rounded-xl bg-white/90 text-slate-900 shadow-lg flex items-center gap-1.5 text-xs font-bold">
                    <Eye className="w-4 h-4" />
                    <span>Visualizar</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                <div className="space-y-1">
                  {/* Título ou Ambiente */}
                  <h5 className="text-xs font-bold text-slate-900 line-clamp-1 flex items-center gap-1">
                    {(foto.titulo || foto.legenda) ? (
                      <>
                        <Tag className="w-3 h-3 text-teal-600 shrink-0" />
                        <span>{foto.titulo || foto.legenda}</span>
                      </>
                    ) : (
                      <span>{foto.ambiente}</span>
                    )}
                  </h5>

                  {/* Ambiente secundário caso haja título */}
                  {(foto.titulo || foto.legenda) && (
                    <span className="text-[10px] text-slate-400 block truncate">
                      {foto.ambiente}
                    </span>
                  )}

                  {/* Observações da Foto */}
                  {foto.observacoes ? (
                    <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100 mt-1">
                      <p className="text-[11px] text-slate-600 line-clamp-2 italic leading-relaxed flex items-start gap-1">
                        <FileText className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                        <span>{foto.observacoes}</span>
                      </p>
                    </div>
                  ) : !readOnly && (
                    <button
                      type="button"
                      onClick={() => setActivePhoto(foto)}
                      className="text-[10px] text-teal-600 hover:text-teal-700 flex items-center gap-0.5 mt-0.5"
                    >
                      + Adicionar observação
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                  <span title={formatDateTimeBR(foto.dataHora)}>
                    {formatDateTimeBR(foto.dataHora).split(' às ')[0]}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhoto(foto);
                        }}
                        title="Editar título e observações"
                        className="text-slate-400 hover:text-teal-600 p-1 rounded hover:bg-teal-50 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {!readOnly && onDeletePhoto && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Deseja excluir esta foto?')) {
                            onDeletePhoto(foto.id);
                          }
                        }}
                        title="Excluir foto"
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Photo Modal with Edit capabilities */}
      <PhotoModal
        foto={activePhoto}
        onClose={() => setActivePhoto(null)}
        onDelete={onDeletePhoto}
        onPhotoUpdated={(updatedFoto) => {
          setActivePhoto(updatedFoto);
          if (onPhotoAdded) onPhotoAdded();
        }}
        readOnly={readOnly}
      />
    </div>
  );
};
