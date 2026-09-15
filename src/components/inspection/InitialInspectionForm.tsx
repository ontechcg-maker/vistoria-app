import React, { useState, useEffect, useRef } from 'react';
import { ClipboardList, Plus, CheckCircle2, Lock, Unlock, Save, UserCheck, Printer, FileText, Check, Building, Edit3 } from 'lucide-react';
import type { Evento, Vistoria, ItemVistoria, FotoVistoria } from '../../types/vistoria';
import { InspectionItemRow } from './InspectionItemRow';
import { db, registrarHistorico, getGoogleDriveConfig } from '../../db/database';
import { syncEventToGoogleDrive } from '../../services/googleDriveService';
import { ConfirmationModal } from '../layout/ConfirmationModal';
import { PhotoModal } from '../photos/PhotoModal';
import { toInputDateTimeLocal, formatDateTimeBR } from '../../utils/dateUtils';

interface InitialInspectionFormProps {
  evento: Evento;
  vistoria?: Vistoria;
  itens: ItemVistoria[];
  fotos: FotoVistoria[];
  onRefresh: () => void;
  onGenerateInitialPdf?: () => void;
  onEditCessionario?: () => void;
}

export const InitialInspectionForm: React.FC<InitialInspectionFormProps> = ({
  evento,
  vistoria,
  itens,
  fotos,
  onRefresh,
  onGenerateInitialPdf,
  onEditCessionario,
}) => {
  const isConcluida = vistoria?.status === 'CONCLUIDA';
  const [isEditingLocked, setIsEditingLocked] = useState(isConcluida);

  // Estados dos campos oficiais da SEDE Campina Grande
  const [responsavelSedeNome, setResponsavelSedeNome] = useState(
    vistoria?.responsavelSedeNome || evento.responsavelSedeNome || vistoria?.responsavelNome || 'Fiscal de Vistoria da SEDE'
  );
  const [responsavelSedeMatricula, setResponsavelSedeMatricula] = useState(
    vistoria?.responsavelSedeMatricula || evento.responsavelSedeMatricula || 'SEDE-4412'
  );
  const [representanteCessionarioNome, setRepresentanteCessionarioNome] = useState(
    vistoria?.representanteCessionarioNome || evento.representanteLegal || evento.responsavelEvento || ''
  );
  const [representanteCessionarioCpf, setRepresentanteCessionarioCpf] = useState(
    vistoria?.representanteCessionarioCpf || evento.cpfRepresentanteLegal || ''
  );

  const [dataHora, setDataHora] = useState(() =>
    toInputDateTimeLocal(vistoria?.dataHoraPreenchimento)
  );
  const [observacoesGerais, setObservacoesGerais] = useState(
    vistoria?.observacoesGerais || ''
  );

  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincroniza estados caso a vistoria seja carregada ou atualizada externamente
  useEffect(() => {
    if (vistoria) {
      if (vistoria.responsavelSedeNome || vistoria.responsavelNome) {
        setResponsavelSedeNome(vistoria.responsavelSedeNome || vistoria.responsavelNome || 'Fiscal de Vistoria da SEDE');
      } else if (evento.responsavelSedeNome) {
        setResponsavelSedeNome(evento.responsavelSedeNome);
      }

      if (vistoria.responsavelSedeMatricula) {
        setResponsavelSedeMatricula(vistoria.responsavelSedeMatricula);
      } else if (evento.responsavelSedeMatricula) {
        setResponsavelSedeMatricula(evento.responsavelSedeMatricula);
      }

      if (vistoria.representanteCessionarioNome) {
        setRepresentanteCessionarioNome(vistoria.representanteCessionarioNome);
      } else if (evento.representanteLegal || evento.responsavelEvento) {
        setRepresentanteCessionarioNome(evento.representanteLegal || evento.responsavelEvento || '');
      }

      if (vistoria.representanteCessionarioCpf) {
        setRepresentanteCessionarioCpf(vistoria.representanteCessionarioCpf);
      } else if (evento.cpfRepresentanteLegal) {
        setRepresentanteCessionarioCpf(evento.cpfRepresentanteLegal);
      }

      if (vistoria.dataHoraPreenchimento) {
        setDataHora(toInputDateTimeLocal(vistoria.dataHoraPreenchimento));
      }

      if (vistoria.observacoesGerais !== undefined) {
        setObservacoesGerais(vistoria.observacoesGerais);
      }

      setIsEditingLocked(vistoria.status === 'CONCLUIDA');
    } else if (evento) {
      if (evento.responsavelSedeNome) {
        setResponsavelSedeNome(evento.responsavelSedeNome);
      }
      if (evento.responsavelSedeMatricula) {
        setResponsavelSedeMatricula(evento.responsavelSedeMatricula);
      }
      if (evento.representanteLegal || evento.responsavelEvento) {
        setRepresentanteCessionarioNome(evento.representanteLegal || evento.responsavelEvento || '');
      }
      if (evento.cpfRepresentanteLegal) {
        setRepresentanteCessionarioCpf(evento.cpfRepresentanteLegal);
      }
    }
  }, [vistoria, evento]);

  // Função para salvar automaticamente qualquer alteração nos campos cadastrais e observações
  const persistFields = async (overrides?: Partial<Vistoria>) => {
    try {
      setAutoSaveStatus('saving');
      const vistoriaId = vistoria?.id || crypto.randomUUID();
      const currentNome = overrides?.responsavelSedeNome ?? responsavelSedeNome;
      const currentMatricula = overrides?.responsavelSedeMatricula ?? responsavelSedeMatricula;
      const currentRepNome = overrides?.representanteCessionarioNome ?? representanteCessionarioNome;
      const currentRepCpf = overrides?.representanteCessionarioCpf ?? representanteCessionarioCpf;
      const currentObs = overrides?.observacoesGerais ?? observacoesGerais;
      const currentData = overrides?.dataHoraPreenchimento ?? dataHora;

      const vistoriaData: Vistoria = {
        id: vistoriaId,
        eventoId: evento.id,
        tipo: 'INICIAL',
        status: vistoria?.status || 'RASCUNHO',
        responsavelSedeNome: currentNome,
        responsavelSedeMatricula: currentMatricula,
        representanteCessionarioNome: currentRepNome,
        representanteCessionarioCpf: currentRepCpf,
        responsavelNome: currentNome,
        responsavelCargo: `Fiscal SEDE (${currentMatricula || 'SEDE-4412'})`,
        dataHoraPreenchimento: currentData,
        observacoesGerais: currentObs,
        concluidaEm: vistoria?.concluidaEm,
      };

      await db.vistorias.put(vistoriaData);
      await db.eventos.update(evento.id, {
        responsavelSedeNome: currentNome,
        responsavelSedeMatricula: currentMatricula,
        representanteLegal: currentRepNome || evento.representanteLegal,
        cpfRepresentanteLegal: currentRepCpf || evento.cpfRepresentanteLegal,
        updatedAt: new Date().toISOString(),
      });

      setAutoSaveStatus('saved');
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => setAutoSaveStatus('idle'), 2500);
    } catch (err) {
      console.warn('Erro no autosave da vistoria inicial:', err);
      setAutoSaveStatus('idle');
    }
  };

  // Estados para modal de adicionar item/ambiente
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemAmbiente, setNewItemAmbiente] = useState('');
  const [newItemDescricao, setNewItemDescricao] = useState('');

  // Modal de confirmação
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [activePhoto, setActivePhoto] = useState<FotoVistoria | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Agrupamento dos itens por ambiente / grupo
  const ambientes = Array.from(new Set(itens.map((i) => i.ambiente)));

  const handleUpdateItem = async (itemId: string, patch: Partial<ItemVistoria>) => {
    await db.itens.update(itemId, patch);
    onRefresh();
  };

  const handleDeleteItem = async (itemId: string) => {
    await db.itens.delete(itemId);
    onRefresh();
  };

  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemAmbiente.trim() || !newItemDescricao.trim()) return;

    const maxOrdem = itens.reduce((max, i) => Math.max(max, i.ordem), 0);
    const novoItem: ItemVistoria = {
      id: crypto.randomUUID(),
      eventoId: evento.id,
      vistoriaTipo: 'INICIAL',
      ambiente: newItemAmbiente.trim(),
      descricao: newItemDescricao.trim(),
      conferido: true,
      situacao: 'BOM',
      ordem: maxOrdem + 1,
    };

    await db.itens.add(novoItem);
    setShowAddItemModal(false);
    setNewItemDescricao('');
    onRefresh();
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const vistoriaId = vistoria?.id || crypto.randomUUID();
      const vistoriaData: Vistoria = {
        id: vistoriaId,
        eventoId: evento.id,
        tipo: 'INICIAL',
        status: 'RASCUNHO',
        responsavelSedeNome,
        responsavelSedeMatricula,
        representanteCessionarioNome,
        representanteCessionarioCpf,
        responsavelNome: responsavelSedeNome,
        responsavelCargo: `Fiscal SEDE (Mat. ${responsavelSedeMatricula})`,
        dataHoraPreenchimento: dataHora,
        observacoesGerais,
      };

      await db.vistorias.put(vistoriaData);
      await db.eventos.update(evento.id, {
        responsavelSedeNome,
        responsavelSedeMatricula,
        status: 'VISTORIA_INICIAL_PENDENTE',
        updatedAt: new Date().toISOString(),
      });

      await registrarHistorico(evento.id, responsavelSedeNome, 'Rascunho da Vistoria Inicial Salvo');
      onRefresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleConcludeInspection = async () => {
    if (!responsavelSedeNome.trim()) {
      alert('Informe o nome do responsável pela vistoria da SEDE.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Concluir Vistoria Inicial e Emitir Termo de Entrega',
      message:
        'Ao concluir a Vistoria Inicial, as condições de entrega do espaço serão homologadas. O Termo de Responsabilidade e Vistoria de Entrega estará pronto para impressão e assinatura do Cessionário (ciência e responsabilidade). Deseja homologar?',
      confirmLabel: 'Homologar e Gerar Termo de Entrega',
      isDanger: false,
      onConfirm: async () => {
        setIsSaving(true);
        try {
          const vistoriaId = vistoria?.id || crypto.randomUUID();
          const now = new Date().toISOString();
          const vistoriaData: Vistoria = {
            id: vistoriaId,
            eventoId: evento.id,
            tipo: 'INICIAL',
            status: 'CONCLUIDA',
            responsavelSedeNome,
            responsavelSedeMatricula,
            representanteCessionarioNome,
            representanteCessionarioCpf,
            responsavelNome: responsavelSedeNome,
            responsavelCargo: `Fiscal SEDE (Mat. ${responsavelSedeMatricula})`,
            dataHoraPreenchimento: dataHora || now,
            observacoesGerais,
            concluidaEm: now,
          };

          await db.vistorias.put(vistoriaData);
          await db.eventos.update(evento.id, {
            responsavelSedeNome,
            responsavelSedeMatricula,
            representanteLegal: representanteCessionarioNome || evento.representanteLegal,
            cpfRepresentanteLegal: representanteCessionarioCpf || evento.cpfRepresentanteLegal,
            status: 'VISTORIA_INICIAL_CONCLUIDA',
            updatedAt: now,
          });

          await registrarHistorico(
            evento.id,
            responsavelSedeNome,
            'Vistoria Inicial Concluída e Homologada',
            `Registrados ${itens.length} itens oficiais da SEDE e ${fotos.filter(f => f.vistoriaTipo === 'INICIAL').length} fotos de entrega`
          );

          setIsEditingLocked(true);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          onRefresh();

          // Sincronização automática com Google Drive se configurado
          try {
            const driveConfig = await getGoogleDriveConfig();
            if (driveConfig.webhookUrl && (driveConfig.autoSync ?? true)) {
              syncEventToGoogleDrive(evento.id).then(() => onRefresh());
            }
          } catch (syncErr) {
            console.warn('Erro ao disparar sincronização automática do Drive:', syncErr);
          }

          // Abre o PDF da Vistoria Inicial automaticamente se o callback existir
          if (onGenerateInitialPdf) {
            onGenerateInitialPdf();
          }
        } finally {
          setIsSaving(false);
        }
      },
    });
  };

  const handleUnlockForEditing = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Desbloquear Vistoria Inicial para Edição',
      message:
        'A vistoria inicial já havia sido homologada. Qualquer alteração posterior será registrada no histórico de auditoria. Deseja desbloquear?',
      confirmLabel: 'Desbloquear e Editar',
      isDanger: true,
      onConfirm: async () => {
        setIsEditingLocked(false);
        await registrarHistorico(
          evento.id,
          responsavelSedeNome,
          'Vistoria Inicial Reaberta para Edição',
          'Usuário confirmou reabertura da vistoria'
        );
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Banner de Status com Ação de Emissão do Termo */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
          isConcluida
            ? 'bg-teal-50/80 border-teal-200'
            : 'bg-amber-50/80 border-amber-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isConcluida ? 'bg-teal-600 text-white' : 'bg-amber-500 text-white'
            }`}
          >
            {isConcluida ? <Lock className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {isConcluida ? 'Vistoria Inicial Homologada e Preservada' : 'Vistoria Inicial — Condições de Entrega'}
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  isConcluida
                    ? 'bg-teal-100 text-teal-800 border border-teal-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {isConcluida ? 'HOMOLOGADA' : 'RASCUNHO'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {isConcluida
                ? `Homologada em ${formatDateTimeBR(vistoria?.concluidaEm)} por ${vistoria?.responsavelSedeNome || vistoria?.responsavelNome}.`
                : 'Registrar a situação encontrada antes da montagem ou utilização. Anexar fotos quando necessário.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
          {onGenerateInitialPdf && (
            <button
              type="button"
              onClick={onGenerateInitialPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 shadow-sm transition active:scale-95 min-h-[38px]"
              title="Gerar e imprimir Termo de Responsabilidade e Vistoria de Entrega com visto do Cessionário"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Termo de Entrega (PDF)</span>
            </button>
          )}

          {isConcluida && isEditingLocked && (
            <button
              type="button"
              onClick={handleUnlockForEditing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 shadow-sm transition active:scale-95 min-h-[38px]"
            >
              <Unlock className="w-3.5 h-3.5 text-amber-600" />
              <span>Editar</span>
            </button>
          )}
        </div>
      </div>

      {/* Itens Agrupados por Ambiente */}
      <div className="space-y-4 sm:space-y-6">
        {ambientes.map((amb) => {
          const itensAmbiente = itens.filter((i) => i.ambiente === amb);
          const totalAmb = itensAmbiente.length;
          const conferidosAmb = itensAmbiente.filter((i) => i.conferido).length;
          const fotosAmb = fotos.filter((f) => f.ambiente === amb && f.vistoriaTipo === 'INICIAL');

          return (
            <div
              key={amb}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Header do Ambiente */}
              <div className="bg-slate-900 px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between text-white">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold tracking-wide truncate">{amb}</h4>
                  <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-teal-300 border border-slate-700 font-medium shrink-0">
                    {conferidosAmb}/{totalAmb}
                  </span>
                  {fotosAmb.length > 0 && (
                    <span className="text-[11px] text-slate-400 hidden md:inline shrink-0">
                      • {fotosAmb.length} fotos
                    </span>
                  )}
                </div>

                {!isEditingLocked && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewItemAmbiente(amb);
                      setShowAddItemModal(true);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 transition shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Adicionar Item</span>
                  </button>
                )}
              </div>

              {/* Lista de Itens */}
              <div className="p-3 sm:p-4 space-y-2.5 bg-slate-50/50">
                {itensAmbiente.map((item) => {
                  const fotosItem = fotos.filter((f) => f.itemId === item.id);
                  return (
                    <InspectionItemRow
                      key={item.id}
                      item={item}
                      fotos={fotosItem}
                      readOnly={isEditingLocked}
                      onUpdate={(patch) => handleUpdateItem(item.id, patch)}
                      onDeleteItem={isEditingLocked ? undefined : handleDeleteItem}
                      onViewPhoto={(foto) => setActivePhoto(foto)}
                      onPhotoAdded={onRefresh}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Botão Adicionar Item */}
      {!isEditingLocked && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              setNewItemAmbiente(ambientes[0] || 'Instalações Gerais e Estrutura');
              setShowAddItemModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition active:scale-95 min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Outro Item / Condição Relevante</span>
          </button>
        </div>
      )}

      {/* Responsáveis e Encerramento da Vistoria Inicial */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-teal-600" />
            Identificação da Vistoria Inicial — SEDE e Cessionário
          </h4>
          {autoSaveStatus === 'saving' && (
            <span className="text-[11px] text-teal-600 font-semibold flex items-center gap-1 animate-pulse">
              Salvando alterações...
            </span>
          )}
          {autoSaveStatus === 'saved' && (
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Check className="w-3 h-3 text-emerald-600" /> Salvo no sistema
            </span>
          )}
        </div>

        {/* Card do Cessionário Oficial com Ação de Edição */}
        <div className="bg-slate-50/90 p-3.5 sm:p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-teal-100 text-teal-800 shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cessionário Oficial</span>
                {evento.docContratante && (
                  <span className="text-[11px] font-mono font-medium text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                    {evento.docContratante}
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-slate-900 leading-snug">
                {evento.contratante}
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                {evento.representanteLegal && (
                  <span>Rep. Legal: <strong className="text-slate-700">{evento.representanteLegal}</strong></span>
                )}
                {evento.telefoneResponsavel && (
                  <span>• Contato: <strong className="text-slate-700">{evento.telefoneResponsavel}</strong></span>
                )}
                {evento.emailResponsavel && (
                  <span>• E-mail: <strong className="text-slate-700">{evento.emailResponsavel}</strong></span>
                )}
              </div>
            </div>
          </div>

          {onEditCessionario && (
            <button
              type="button"
              id="btn-edit-cessionario-vistoria-inicial"
              onClick={onEditCessionario}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-teal-800 bg-white hover:bg-teal-50 border border-teal-300 shadow-xs transition active:scale-95 shrink-0 self-start sm:self-center"
              title="Editar dados cadastrais, razão social, documento ou representantes do cessionário"
            >
              <Edit3 className="w-3.5 h-3.5 text-teal-600" />
              <span>Editar Dados do Cessionário</span>
            </button>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Observações Gerais das Condições de Entrega
          </label>
          <textarea
            rows={2}
            disabled={isEditingLocked}
            value={observacoesGerais}
            onChange={(e) => setObservacoesGerais(e.target.value)}
            onBlur={() => persistFields({ observacoesGerais })}
            placeholder="Ex: Espaço entregue limpo e em condições regulares para montagem..."
            className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none resize-none disabled:bg-slate-50 min-h-[42px]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Responsável SEDE *
            </label>
            <input
              type="text"
              required
              disabled={isEditingLocked}
              value={responsavelSedeNome}
              onChange={(e) => setResponsavelSedeNome(e.target.value)}
              onBlur={() => persistFields({ responsavelSedeNome })}
              placeholder="Nome do fiscal SEDE"
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-slate-50 min-h-[42px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Matrícula SEDE
            </label>
            <input
              type="text"
              disabled={isEditingLocked}
              value={responsavelSedeMatricula}
              onChange={(e) => setResponsavelSedeMatricula(e.target.value)}
              onBlur={() => persistFields({ responsavelSedeMatricula })}
              placeholder="Ex: 12345-6 ou SEDE-4412"
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-slate-50 min-h-[42px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Representante Cessionário
            </label>
            <input
              type="text"
              disabled={isEditingLocked}
              value={representanteCessionarioNome}
              onChange={(e) => setRepresentanteCessionarioNome(e.target.value)}
              onBlur={() => persistFields({ representanteCessionarioNome })}
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-slate-50 min-h-[42px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              CPF Representante
            </label>
            <input
              type="text"
              disabled={isEditingLocked}
              value={representanteCessionarioCpf}
              onChange={(e) => setRepresentanteCessionarioCpf(e.target.value)}
              onBlur={() => persistFields({ representanteCessionarioCpf })}
              placeholder="000.000.000-00"
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-slate-50 min-h-[42px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Data e Horário
            </label>
            <input
              type="datetime-local"
              id="dataHora"
              disabled={isEditingLocked}
              value={toInputDateTimeLocal(dataHora)}
              onChange={(e) => {
                const val = e.target.value;
                setDataHora(val);
                persistFields({ dataHoraPreenchimento: val });
              }}
              onBlur={() => persistFields({ dataHoraPreenchimento: dataHora })}
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-slate-50 min-h-[42px]"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
          {!isEditingLocked ? (
            <>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveDraft}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 shadow-sm transition active:scale-95 min-h-[42px]"
              >
                <Save className="w-4 h-4 text-slate-500" />
                <span>Salvar Rascunho</span>
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleConcludeInspection}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 transition active:scale-95 min-h-[42px]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Concluir Vistoria e Emitir Termo de Entrega</span>
              </button>
            </>
          ) : (
            onGenerateInitialPdf && (
              <button
                type="button"
                onClick={onGenerateInitialPdf}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 shadow-md shadow-teal-400/20 transition active:scale-95 min-h-[42px]"
              >
                <FileText className="w-4 h-4" />
                <span>Visualizar / Baixar Termo de Entrega (PDF)</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Modal Adicionar Item */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Adicionar Condição / Item Relevante
            </h3>

            <form onSubmit={handleAddNewItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ambiente / Grupo *
                </label>
                <input
                  type="text"
                  required
                  value={newItemAmbiente}
                  onChange={(e) => setNewItemAmbiente(e.target.value)}
                  placeholder="Ex: Parque do Povo — Parte Superior..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descrição do Item *
                </label>
                <input
                  type="text"
                  required
                  value={newItemDescricao}
                  onChange={(e) => setNewItemDescricao(e.target.value)}
                  placeholder="Ex: Púlpito de Acrílico, Gerador..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 shadow-sm"
                >
                  Adicionar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        isDanger={confirmModal.isDanger}
      />

      {/* Photo Fullscreen Viewer & Editor */}
      <PhotoModal
        foto={activePhoto}
        onClose={() => setActivePhoto(null)}
        onDelete={async (fotoId) => {
          await db.fotos.delete(fotoId);
          setActivePhoto(null);
          onRefresh();
        }}
        onPhotoUpdated={(updatedFoto) => {
          setActivePhoto(updatedFoto);
          onRefresh();
        }}
        readOnly={isEditingLocked}
      />
    </div>
  );
};
