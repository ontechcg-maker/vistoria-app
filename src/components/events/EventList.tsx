import React, { useState } from 'react';
import { Search, Calendar, MapPin, Building, ChevronRight, Copy, Trash2, Edit3, FileText, CheckCircle2, Clock } from 'lucide-react';
import type { Evento, EventStatus } from '../../types/vistoria';
import { ConfirmationModal } from '../layout/ConfirmationModal';

interface EventListProps {
  eventos: Evento[];
  onSelectEvent: (eventoId: string) => void;
  onEditEvent: (evento: Evento) => void;
  onDuplicateEvent: (evento: Evento) => void;
  onDeleteEvent: (eventoId: string) => void;
  onNewEvent: () => void;
}

export const EventList: React.FC<EventListProps> = ({
  eventos,
  onSelectEvent,
  onEditEvent,
  onDuplicateEvent,
  onDeleteEvent,
  onNewEvent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [eventToDelete, setEventToDelete] = useState<Evento | null>(null);

  const filteredEventos = eventos.filter((e) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = e.nome.toLowerCase().includes(q);
      const matchCode = (e.processoProtocolo || e.codigo || '').toLowerCase().includes(q);
      const matchContractor = e.contratante.toLowerCase().includes(q);
      const matchSpace = e.espacoCedido.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchContractor && !matchSpace) return false;
    }

    if (statusFilter !== 'ALL') {
      if (statusFilter === 'INICIAL_PENDENTE' && e.status !== 'VISTORIA_INICIAL_PENDENTE' && e.status !== 'RASCUNHO') return false;
      if (statusFilter === 'INICIAL_CONCLUIDA' && e.status !== 'VISTORIA_INICIAL_CONCLUIDA') return false;
      if (statusFilter === 'AGUARDANDO_FINAL' && e.status !== 'AGUARDANDO_VISTORIA_FINAL' && e.status !== 'EVENTO_EM_ANDAMENTO') return false;
      if (statusFilter === 'CONCLUIDO' && e.status !== 'VISTORIA_FINAL_CONCLUIDA' && e.status !== 'CONCLUIDO') return false;
    }

    return true;
  });

  const getStatusBadge = (status: EventStatus) => {
    switch (status) {
      case 'VISTORIA_FINAL_CONCLUIDA':
      case 'CONCLUIDO':
        return {
          label: 'Vistoria Final Concluída (PDF Pronto)',
          className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: CheckCircle2,
        };
      case 'AGUARDANDO_VISTORIA_FINAL':
      case 'EVENTO_EM_ANDAMENTO':
        return {
          label: 'Aguardando Vistoria Final',
          className: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: Clock,
        };
      case 'VISTORIA_INICIAL_CONCLUIDA':
        return {
          label: 'Vistoria Inicial Concluída',
          className: 'bg-teal-100 text-teal-800 border-teal-300',
          icon: CheckCircle2,
        };
      case 'VISTORIA_INICIAL_PENDENTE':
      case 'RASCUNHO':
      default:
        return {
          label: 'Vistoria Inicial Pendente',
          className: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: FileText,
        };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por processo, evento, local ou cessionário..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none transition min-h-[42px]"
          />
        </div>

        {/* Filter Chips with smooth mobile scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition shrink-0 min-h-[34px] ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({eventos.length})
          </button>

          <button
            onClick={() => setStatusFilter('INICIAL_PENDENTE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition shrink-0 min-h-[34px] ${
              statusFilter === 'INICIAL_PENDENTE'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Inicial Pendente
          </button>

          <button
            onClick={() => setStatusFilter('AGUARDANDO_FINAL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition shrink-0 min-h-[34px] ${
              statusFilter === 'AGUARDANDO_FINAL'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Aguardando Final
          </button>

          <button
            onClick={() => setStatusFilter('CONCLUIDO')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition shrink-0 min-h-[34px] ${
              statusFilter === 'CONCLUIDO'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
            }`}
          >
            Concluídos (PDF)
          </button>
        </div>
      </div>

      {/* Grid of Events */}
      {filteredEventos.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center shadow-sm space-y-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border border-teal-100">
            <Building className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Nenhuma cessão encontrada'
                : 'Nenhuma cessão cadastrada ainda'}
            </h3>
            <p className="text-xs text-slate-500">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Tente ajustar sua busca ou limpar os filtros de status.'
                : 'Cadastre uma nova cessão de espaço para iniciar o fluxo de vistoria pré e pós-evento.'}
            </p>
          </div>

          <div className="flex items-center justify-center pt-2">
            <button
              onClick={onNewEvent}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 shadow-md shadow-teal-400/20 active:scale-95 transition min-h-[42px]"
            >
              <Building className="w-4 h-4" />
              <span>Cadastrar Nova Cessão de Espaço</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {filteredEventos.map((evento) => {
            const badge = getStatusBadge(evento.status);
            const Icon = badge.icon;

            return (
              <div
                key={evento.id}
                onClick={() => onSelectEvent(evento.id)}
                className="group bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-teal-300 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 active:bg-slate-50"
              >
                {/* Event Core Info */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {evento.processoProtocolo || evento.codigo || 'S/N'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border ${badge.className}`}
                    >
                      <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span className="truncate">{badge.label}</span>
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors leading-snug">
                    {evento.nome}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 text-xs text-slate-600 pt-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate"><strong>Cessionário:</strong> {evento.contratante}</span>
                    </div>

                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate"><strong>Local:</strong> {evento.espacoCedido}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {new Date(evento.dataInicio).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom on mobile, Right on desktop */}
                <div className="flex items-center justify-between md:justify-end gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditEvent(evento);
                      }}
                      title="Editar dados cadastrais"
                      className="p-2 sm:p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition min-h-[38px] min-w-[38px] flex items-center justify-center"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateEvent(evento);
                      }}
                      title="Duplicar este evento"
                      className="p-2 sm:p-2.5 rounded-xl text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition min-h-[38px] min-w-[38px] flex items-center justify-center"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEventToDelete(evento);
                      }}
                      title="Excluir evento"
                      className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition min-h-[38px] min-w-[38px] flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-teal-800 bg-teal-50 group-hover:bg-teal-600 group-hover:text-white transition-all shadow-xs min-h-[38px]">
                    <span>Abrir Vistoria</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmationModal
        isOpen={Boolean(eventToDelete)}
        title="Excluir Cessão de Espaço"
        message={`Deseja realmente excluir a cessão "${eventToDelete?.nome}" e todos os registros de vistorias e fotos?\n\nEsta ação não poderá ser desfeita.`}
        confirmLabel="Excluir Definitivamente"
        isDanger={true}
        onConfirm={() => {
          if (eventToDelete) {
            onDeleteEvent(eventToDelete.id);
            setEventToDelete(null);
          }
        }}
        onCancel={() => setEventToDelete(null)}
      />
    </div>
  );
};
