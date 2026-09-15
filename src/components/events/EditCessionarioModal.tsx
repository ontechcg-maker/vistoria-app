import React, { useState, useEffect } from 'react';
import { Building, User, CreditCard, Phone, Mail, X, Save, AlertCircle } from 'lucide-react';
import type { Evento } from '../../types/vistoria';
import { db, registrarHistorico } from '../../db/database';

interface EditCessionarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  evento: Evento;
  onSaved: (updatedEvento: Evento) => void;
}

export const EditCessionarioModal: React.FC<EditCessionarioModalProps> = ({
  isOpen,
  onClose,
  evento,
  onSaved,
}) => {
  const [contratante, setContratante] = useState(evento.contratante || '');
  const [docContratante, setDocContratante] = useState(evento.docContratante || '');
  const [representanteLegal, setRepresentanteLegal] = useState(evento.representanteLegal || '');
  const [cpfRepresentanteLegal, setCpfRepresentanteLegal] = useState(evento.cpfRepresentanteLegal || '');
  const [responsavelEvento, setResponsavelEvento] = useState(evento.responsavelEvento || '');
  const [telefoneResponsavel, setTelefoneResponsavel] = useState(evento.telefoneResponsavel || '');
  const [emailResponsavel, setEmailResponsavel] = useState(evento.emailResponsavel || '');
  const [sincronizarVistorias, setSincronizarVistorias] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setContratante(evento.contratante || '');
      setDocContratante(evento.docContratante || '');
      setRepresentanteLegal(evento.representanteLegal || '');
      setCpfRepresentanteLegal(evento.cpfRepresentanteLegal || '');
      setResponsavelEvento(evento.responsavelEvento || '');
      setTelefoneResponsavel(evento.telefoneResponsavel || '');
      setEmailResponsavel(evento.emailResponsavel || '');
      setSincronizarVistorias(true);
      setError(null);
    }
  }, [isOpen, evento]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contratante.trim()) {
      setError('O nome ou razão social do(a) cessionário(a) é obrigatório.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const repFinal = representanteLegal.trim() || responsavelEvento.trim() || contratante.trim();
      const cpfRepFinal = cpfRepresentanteLegal.trim();

      const updatedEvento: Evento = {
        ...evento,
        contratante: contratante.trim(),
        docContratante: docContratante.trim(),
        representanteLegal: representanteLegal.trim(),
        cpfRepresentanteLegal: cpfRepFinal,
        responsavelEvento: responsavelEvento.trim() || repFinal,
        telefoneResponsavel: telefoneResponsavel.trim(),
        emailResponsavel: emailResponsavel.trim(),
        updatedAt: now,
      };

      // 1. Atualiza o evento no banco local (IndexedDB)
      await db.eventos.update(evento.id, {
        contratante: updatedEvento.contratante,
        docContratante: updatedEvento.docContratante,
        representanteLegal: updatedEvento.representanteLegal,
        cpfRepresentanteLegal: updatedEvento.cpfRepresentanteLegal,
        responsavelEvento: updatedEvento.responsavelEvento,
        telefoneResponsavel: updatedEvento.telefoneResponsavel,
        emailResponsavel: updatedEvento.emailResponsavel,
        updatedAt: now,
      });

      // 2. Se habilitado, atualiza também os representantes nas vistorias existentes
      if (sincronizarVistorias) {
        const vistorias = await db.vistorias.where({ eventoId: evento.id }).toArray();
        for (const vistoria of vistorias) {
          await db.vistorias.update(vistoria.id, {
            representanteCessionarioNome: repFinal,
            representanteCessionarioCpf: cpfRepFinal,
            editadaAposConclusaoEm: vistoria.status === 'CONCLUIDA' ? now : undefined,
          });
        }
      }

      // 3. Registra no histórico de auditoria
      await registrarHistorico(
        evento.id,
        'Fiscal / Usuário',
        'Dados do Cessionário Atualizados',
        `Cessionário: ${updatedEvento.contratante}${updatedEvento.docContratante ? ` (${updatedEvento.docContratante})` : ''} • Rep: ${repFinal || 'Não informado'}`
      );

      onSaved(updatedEvento);
      onClose();
    } catch (err: unknown) {
      console.error('Erro ao salvar dados do cessionário:', err);
      setError('Falha ao salvar dados do cessionário. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Editar Dados do Cessionário</h2>
              <p className="text-xs text-slate-400">
                {evento.processoProtocolo || evento.codigo} • {evento.nome}
              </p>
            </div>
          </div>
          <button
            id="btn-close-edit-cessionario"
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-slate-700">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Nome do Cessionário */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-teal-600" />
              Cessionário(a) (Pessoa Física ou Razão Social Jurídica) *
            </label>
            <input
              id="input-cessionario-contratante"
              type="text"
              required
              value={contratante}
              onChange={(e) => setContratante(e.target.value)}
              placeholder="Ex: Associação dos Artesãos da PB ou Nome Completo"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none font-medium min-h-[42px]"
            />
          </div>

          {/* CPF / CNPJ do Cessionário */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              CPF / CNPJ do Cessionário
            </label>
            <input
              id="input-cessionario-doc"
              type="text"
              value={docContratante}
              onChange={(e) => setDocContratante(e.target.value)}
              placeholder="00.000.000/0001-00 ou 000.000.000-00"
              className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none min-h-[42px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Representante Legal */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Representante Legal
              </label>
              <input
                id="input-cessionario-rep-legal"
                type="text"
                value={representanteLegal}
                onChange={(e) => setRepresentanteLegal(e.target.value)}
                placeholder="Ex: Dr. Antônio Marcos"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none min-h-[42px]"
              />
            </div>

            {/* CPF do Representante Legal */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                CPF do Representante
              </label>
              <input
                id="input-cessionario-rep-cpf"
                type="text"
                value={cpfRepresentanteLegal}
                onChange={(e) => setCpfRepresentanteLegal(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none min-h-[42px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Responsável / Contato pelo Evento */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Contato no Local / Evento
              </label>
              <input
                id="input-cessionario-contato"
                type="text"
                value={responsavelEvento}
                onChange={(e) => setResponsavelEvento(e.target.value)}
                placeholder="Ex: Coordenador Operacional"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none min-h-[42px]"
              />
            </div>

            {/* Telefone / WhatsApp */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                Telefone / WhatsApp
              </label>
              <input
                id="input-cessionario-telefone"
                type="tel"
                value={telefoneResponsavel}
                onChange={(e) => setTelefoneResponsavel(e.target.value)}
                placeholder="(83) 99999-9999"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none min-h-[42px]"
              />
            </div>
          </div>

          {/* E-mail de Contato */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              E-mail de Contato
            </label>
            <input
              id="input-cessionario-email"
              type="email"
              value={emailResponsavel}
              onChange={(e) => setEmailResponsavel(e.target.value)}
              placeholder="exemplo@organizacao.com.br"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none min-h-[42px]"
            />
          </div>

          {/* Opção de Sincronizar com Vistorias */}
          <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/80">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                id="checkbox-sincronizar-vistorias"
                type="checkbox"
                checked={sincronizarVistorias}
                onChange={(e) => setSincronizarVistorias(e.target.checked)}
                className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
              />
              <div className="text-xs">
                <span className="font-bold text-teal-900 block">
                  Atualizar representante nas vistorias vinculadas
                </span>
                <span className="text-teal-700 text-[11px] block mt-0.5">
                  Atualiza automaticamente o nome e CPF do representante nas vistorias inicial e final deste processo.
                </span>
              </div>
            </label>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              id="btn-cancel-edit-cessionario"
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition min-h-[40px]"
            >
              Cancelar
            </button>
            <button
              id="btn-submit-edit-cessionario"
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition active:scale-95 shadow-sm disabled:opacity-50 min-h-[40px]"
            >
              {isSaving ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Dados do Cessionário</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
