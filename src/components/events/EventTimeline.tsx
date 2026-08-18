import React from 'react';
import { FileText, ClipboardList, Clock, CheckCircle2, FileCheck } from 'lucide-react';
import type { Evento, Vistoria } from '../../types/vistoria';

interface EventTimelineProps {
  evento: Evento;
  vistoriaInicial?: Vistoria;
  vistoriaFinal?: Vistoria;
}

export const EventTimeline: React.FC<EventTimelineProps> = ({
  evento,
  vistoriaInicial,
  vistoriaFinal,
}) => {
  const steps = [
    {
      id: 1,
      name: 'Cadastro',
      fullTitle: 'Cadastro da Cessão',
      desc: 'Dados & Cessionário',
      icon: FileText,
      status: 'completed',
    },
    {
      id: 2,
      name: 'Vistoria Inicial',
      fullTitle: 'Vistoria Inicial (Entrega)',
      desc: 'Condição pré-evento',
      icon: ClipboardList,
      status: vistoriaInicial?.status === 'CONCLUIDA'
        ? 'completed'
        : vistoriaInicial?.status === 'RASCUNHO'
        ? 'current'
        : 'pending',
    },
    {
      id: 3,
      name: 'Encerramento',
      fullTitle: 'Liberação Pós-evento',
      desc: 'Término do evento',
      icon: Clock,
      status: evento.dataHoraRealFim
        ? 'completed'
        : vistoriaInicial?.status === 'CONCLUIDA'
        ? 'current'
        : 'pending',
    },
    {
      id: 4,
      name: 'Vistoria Final',
      fullTitle: 'Vistoria Final (Devolução)',
      desc: 'Comparativo & Danos',
      icon: CheckCircle2,
      status: vistoriaFinal?.status === 'CONCLUIDA'
        ? 'completed'
        : evento.dataHoraRealFim
        ? 'current'
        : 'pending',
    },
    {
      id: 5,
      name: 'Termo PDF',
      fullTitle: 'Termo Oficial em PDF',
      desc: 'Emissão & Assinaturas',
      icon: FileCheck,
      status: vistoriaFinal?.status === 'CONCLUIDA'
        ? 'completed'
        : 'pending',
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Progresso da Cessão de Espaço
        </h3>
        <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
          Etapa {steps.filter(s => s.status === 'completed').length + (steps.some(s => s.status === 'current') ? 1 : 0)} de 5
        </span>
      </div>

      {/* Grid on desktop, horizontal scroll on mobile with snap */}
      <div className="flex sm:grid sm:grid-cols-5 gap-2.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none snap-x snap-mandatory">
        {steps.map((step) => {
          const Icon = step.icon;
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';

          return (
            <div
              key={step.id}
              className={`flex-1 min-w-[170px] sm:min-w-0 snap-start flex flex-col p-3 rounded-xl border transition-all ${
                isCompleted
                  ? 'bg-teal-50/70 border-teal-200 text-teal-950'
                  : isCurrent
                  ? 'bg-amber-50/90 border-amber-300 text-amber-950 ring-2 ring-amber-400/40'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    isCompleted
                      ? 'bg-teal-600 text-white'
                      : isCurrent
                      ? 'bg-amber-500 text-white animate-pulse'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  Etapa 0{step.id}
                </span>

                {isCompleted && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-teal-600" />
                )}
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">
                  {step.name}
                </h4>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
