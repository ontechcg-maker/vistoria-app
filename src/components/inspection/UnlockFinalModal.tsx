import React, { useState } from 'react';
import { Clock, CheckCircle, X } from 'lucide-react';

interface UnlockFinalModalProps {
  isOpen: boolean;
  previsaoFim?: string;
  onClose: () => void;
  onConfirm: (dataHoraRealFim: string) => Promise<void>;
}

export const UnlockFinalModal: React.FC<UnlockFinalModalProps> = ({
  isOpen,
  previsaoFim,
  onClose,
  onConfirm,
}) => {
  const [dataHoraReal, setDataHoraReal] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataHoraReal) return;

    try {
      setIsSubmitting(true);
      await onConfirm(dataHoraReal);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Liberar Vistoria Final</h3>
              <p className="text-xs text-slate-400">
                Confirmação do encerramento do evento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
            A vistoria final deverá ser realizada <strong>após o término real do evento</strong>, permitindo confrontar os itens com a condição registrada na vistoria inicial.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Data e Hora Reais de Encerramento do Evento *
            </label>
            <input
              type="datetime-local"
              required
              value={dataHoraReal}
              onChange={(e) => setDataHoraReal(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none"
            />
            {previsaoFim && (
              <p className="text-[11px] text-slate-400 mt-1">
                Previsão inicial de término: {new Date(previsaoFim).toLocaleString('pt-BR')}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 shadow-md shadow-teal-400/20 active:scale-95 transition disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Liberando...' : 'Confirmar e Abrir Vistoria Final'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
