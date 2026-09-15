import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MinusCircle,
  Camera,
  Save,
  FileCheck,
  Check,
  UserCheck,
  Lock,
  Unlock,
  ClipboardList,
  Printer,
  Building,
  Edit3,
} from 'lucide-react';
import type { Evento, Vistoria, ItemVistoria, FotoVistoria, CondicaoItem, SpaceReturnStatus } from '../../types/vistoria';
import { db, registrarHistorico, getGoogleDriveConfig } from '../../db/database';
import { syncEventToGoogleDrive } from '../../services/googleDriveService';
import { calculateComparisonResult, generateComparisonSummary, getComparisonLabel, getItemStatusLabel } from '../../services/comparisonService';
import { ConfirmationModal } from '../layout/ConfirmationModal';
import { PhotoModal } from '../photos/PhotoModal';
import { PhotoUploader } from '../photos/PhotoUploader';
import { toInputDateTimeLocal, formatDateTimeBR } from '../../utils/dateUtils';

interface FinalInspectionFormProps {
  evento: Evento;
  vistoriaInicial?: Vistoria;
  vistoriaFinal?: Vistoria;
  itensIniciais: ItemVistoria[];
  itensFinais: ItemVistoria[];
  fotos: FotoVistoria[];
  onRefresh: () => void;
  onGeneratePdf: () => void;
  onEditCessionario?: () => void;
}

export const FinalInspectionForm: React.FC<FinalInspectionFormProps> = ({
  evento,
  vistoriaInicial,
  vistoriaFinal,
  itensIniciais,
  itensFinais,
  fotos,
  onRefresh,
  onGeneratePdf,
  onEditCessionario,
}) => {
  const isConcluida = vistoriaFinal?.status === 'CONCLUIDA';
  const [isEditingLocked, setIsEditingLocked] = useState(isConcluida);

  // Campos oficiais da SEDE Campina Grande
  const [responsavelSedeNome, setResponsavelSedeNome] = useState(
    vistoriaFinal?.responsavelSedeNome || evento.responsavelSedeNome || vistoriaInicial?.responsavelSedeNome || vistoriaInicial?.responsavelNome || 'Fiscal de Vistoria da SEDE'
  );
  const [responsavelSedeMatricula, setResponsavelSedeMatricula] = useState(
    vistoriaFinal?.responsavelSedeMatricula || evento.responsavelSedeMatricula || vistoriaInicial?.responsavelSedeMatricula || 'SEDE-4412'
  );
  const [representanteCessionarioNome, setRepresentanteCessionarioNome] = useState(
    vistoriaFinal?.representanteCessionarioNome || vistoriaInicial?.representanteCessionarioNome || evento.representanteLegal || evento.responsavelEvento || ''
  );
  const [representanteCessionarioCpf, setRepresentanteCessionarioCpf] = useState(
    vistoriaFinal?.representanteCessionarioCpf || vistoriaInicial?.representanteCessionarioCpf || evento.cpfRepresentanteLegal || ''
  );

  const [dataHora, setDataHora] = useState(() =>
    toInputDateTimeLocal(vistoriaFinal?.dataHoraPreenchimento)
  );
  const [observacoesGerais, setObservacoesGerais] = useState(
    vistoriaFinal?.observacoesGerais || ''
  );
  const [devolucaoStatus, setDevolucaoStatus] = useState<SpaceReturnStatus>(
    vistoriaFinal?.devolucaoStatus || 'CONFORME'
  );
  const [providencias, setProvidencias] = useState(
    vistoriaFinal?.providenciasPendencias || ''
  );

  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincroniza estados quando vistoriaFinal ou evento mudam
  useEffect(() => {
    if (vistoriaFinal) {
      if (vistoriaFinal.responsavelSedeNome) setResponsavelSedeNome(vistoriaFinal.responsavelSedeNome);
      else if (evento.responsavelSedeNome) setResponsavelSedeNome(evento.responsavelSedeNome);
      else if (vistoriaInicial?.responsavelSedeNome) setResponsavelSedeNome(vistoriaInicial.responsavelSedeNome);

      if (vistoriaFinal.responsavelSedeMatricula) setResponsavelSedeMatricula(vistoriaFinal.responsavelSedeMatricula);
      else if (evento.responsavelSedeMatricula) setResponsavelSedeMatricula(evento.responsavelSedeMatricula);
      else if (vistoriaInicial?.responsavelSedeMatricula) setResponsavelSedeMatricula(vistoriaInicial.responsavelSedeMatricula);

      if (vistoriaFinal.representanteCessionarioNome) setRepresentanteCessionarioNome(vistoriaFinal.representanteCessionarioNome);
      else if (evento.representanteLegal) setRepresentanteCessionarioNome(evento.representanteLegal);

      if (vistoriaFinal.representanteCessionarioCpf) setRepresentanteCessionarioCpf(vistoriaFinal.representanteCessionarioCpf);
      else if (evento.cpfRepresentanteLegal) setRepresentanteCessionarioCpf(evento.cpfRepresentanteLegal);

      if (vistoriaFinal.dataHoraPreenchimento) setDataHora(toInputDateTimeLocal(vistoriaFinal.dataHoraPreenchimento));
      if (vistoriaFinal.observacoesGerais !== undefined) setObservacoesGerais(vistoriaFinal.observacoesGerais);
      if (vistoriaFinal.devolucaoStatus) setDevolucaoStatus(vistoriaFinal.devolucaoStatus);
      if (vistoriaFinal.providenciasPendencias !== undefined) setProvidencias(vistoriaFinal.providenciasPendencias);
      setIsEditingLocked(vistoriaFinal.status === 'CONCLUIDA');
    }
  }, [vistoriaFinal, evento, vistoriaInicial]);

  const persistFinalFields = async (overrides?: Partial<Vistoria>) => {
    try {
      setAutoSaveStatus('saving');
      const vistoriaId = vistoriaFinal?.id || crypto.randomUUID();
      const currentNome = overrides?.responsavelSedeNome ?? responsavelSedeNome;
      const currentMatricula = overrides?.responsavelSedeMatricula ?? responsavelSedeMatricula;
      const currentRepNome = overrides?.representanteCessionarioNome ?? representanteCessionarioNome;
      const currentRepCpf = overrides?.representanteCessionarioCpf ?? representanteCessionarioCpf;
      const currentObs = overrides?.observacoesGerais ?? observacoesGerais;
      const currentProv = overrides?.providenciasPendencias ?? providencias;
      const currentDev = (overrides?.devolucaoStatus ?? devolucaoStatus) as SpaceReturnStatus;
      const currentData = overrides?.dataHoraPreenchimento ?? dataHora;

      const vistoriaData: Vistoria = {
        id: vistoriaId,
        eventoId: evento.id,
        tipo: 'FINAL',
        status: vistoriaFinal?.status || 'RASCUNHO',
        responsavelSedeNome: currentNome,
        responsavelSedeMatricula: currentMatricula,
        representanteCessionarioNome: currentRepNome,
        representanteCessionarioCpf: currentRepCpf,
        responsavelNome: currentNome,
        responsavelCargo: `Fiscal SEDE (${currentMatricula || 'SEDE-4412'})`,
        dataHoraPreenchimento: currentData,
        observacoesGerais: currentObs,
        devolucaoStatus: currentDev,
        providenciasPendencias: currentProv,
        concluidaEm: vistoriaFinal?.concluidaEm,
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
      console.warn('Erro no autosave da vistoria final:', err);
      setAutoSaveStatus('idle');
    }
  };

  const [activePhoto, setActivePhoto] = useState<FotoVistoria | null>(null);
  const [activeItemPhotoUploader, setActiveItemPhotoUploader] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

  // Mapear itens da vistoria inicial
  const mapIniciais = new Map<string, ItemVistoria>();
  itensIniciais.forEach((i) => {
    mapIniciais.set(i.id, i);
    mapIniciais.set(`${i.ambiente}:::${i.descricao}`, i);
    mapIniciais.set(i.descricao.toLowerCase().trim(), i);
  });

  const summary = generateComparisonSummary(itensFinais, itensIniciais);
  const ambientes = Array.from(new Set(itensFinais.map((i) => i.ambiente)));

  const handleUpdateItemFinal = async (
    itemFinal: ItemVistoria,
    patch: Partial<ItemVistoria>
  ) => {
    const itemIni = itemFinal.itemOriginalId
      ? mapIniciais.get(itemFinal.itemOriginalId)
      : mapIniciais.get(`${itemFinal.ambiente}:::${itemFinal.descricao}`) || mapIniciais.get(itemFinal.descricao.toLowerCase().trim());

    const novaSituacao = patch.situacao !== undefined ? patch.situacao : itemFinal.situacao;
    const novaObs = patch.observacao !== undefined ? patch.observacao : (itemFinal.observacao || '');
    const sitIni = itemIni?.situacao || 'BOM';

    const resultadoComparacao = patch.resultadoComparacao !== undefined
      ? patch.resultadoComparacao
      : calculateComparisonResult(sitIni, novaSituacao, novaObs);

    const houveDanoCalculado =
      novaSituacao === 'RUIM' ||
      (sitIni === 'BOM' && novaSituacao === 'REGULAR') ||
      resultadoComparacao === 'DANO_IDENTIFICADO' ||
      resultadoComparacao === 'ALTERACAO_IDENTIFICADA' ||
      resultadoComparacao === 'ITEM_AUSENTE';

    const updatedPatch: Partial<ItemVistoria> = {
      ...patch,
      houveAlteracaoDano: patch.houveAlteracaoDano !== undefined ? patch.houveAlteracaoDano : houveDanoCalculado,
      resultadoComparacao,
    };

    await db.itens.update(itemFinal.id, updatedPatch);
    onRefresh();
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const vistoriaId = vistoriaFinal?.id || crypto.randomUUID();
      const vistoriaData: Vistoria = {
        id: vistoriaId,
        eventoId: evento.id,
        tipo: 'FINAL',
        status: 'RASCUNHO',
        responsavelSedeNome,
        responsavelSedeMatricula,
        representanteCessionarioNome,
        representanteCessionarioCpf,
        responsavelNome: responsavelSedeNome,
        responsavelCargo: `Fiscal SEDE (Mat. ${responsavelSedeMatricula})`,
        dataHoraPreenchimento: dataHora,
        observacoesGerais,
        devolucaoStatus,
        providenciasPendencias: providencias,
      };

      await db.vistorias.put(vistoriaData);
      await db.eventos.update(evento.id, {
        responsavelSedeNome,
        responsavelSedeMatricula,
        status: 'AGUARDANDO_VISTORIA_FINAL',
        updatedAt: new Date().toISOString(),
      });

      await registrarHistorico(evento.id, responsavelSedeNome, 'Rascunho da Vistoria Final Salvo');
      onRefresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnlockForEditing = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Desbloquear Vistoria Final para Edição',
      message:
        'A vistoria final já havia sido homologada. Deseja reabrir a edição para ajustar itens, fotos pós-evento, parecer ou status de devolução? As alterações serão registradas no histórico de auditoria.',
      confirmLabel: 'Desbloquear e Editar',
      isDanger: true,
      onConfirm: async () => {
        setIsEditingLocked(false);
        await registrarHistorico(
          evento.id,
          responsavelSedeNome,
          'Vistoria Final Reaberta para Edição',
          'Fiscal solicitou reabertura da vistoria final para edição'
        );
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleConcludeFinalInspection = async () => {
    setErrorMessage('');

    if (!responsavelSedeNome.trim()) {
      setErrorMessage('Informe o nome do responsável pela vistoria da SEDE.');
      return;
    }

    const itemComDivergenciaSemJustificativa = itensFinais.find((item) => {
      const comp = item.resultadoComparacao;
      const isDivergente =
        comp === 'DANO_IDENTIFICADO' ||
        comp === 'ALTERACAO_IDENTIFICADA' ||
        comp === 'ITEM_AUSENTE';
      return isDivergente && !item.justificativaDivergencia?.trim() && !item.observacao?.trim() && !item.providenciaNecessaria?.trim();
    });

    if (itemComDivergenciaSemJustificativa) {
      setErrorMessage(
        `O item "${itemComDivergenciaSemJustificativa.descricao}" possui alteração/dano mas está sem justificativa ou providência registrada.`
      );
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Concluir Vistoria Final e Emitir Termo Oficial',
      message:
        'A vistoria final será homologada e o Termo de Responsabilidade e Vistoria da SEDE Campina Grande estará pronto para emissão em PDF e assinaturas. Deseja homologar?',
      confirmLabel: 'Homologar Vistoria Final',
      isDanger: false,
      onConfirm: async () => {
        setIsSaving(true);
        try {
          const vistoriaId = vistoriaFinal?.id || crypto.randomUUID();
          const now = new Date().toISOString();
          const vistoriaData: Vistoria = {
            id: vistoriaId,
            eventoId: evento.id,
            tipo: 'FINAL',
            status: 'CONCLUIDA',
            responsavelSedeNome,
            responsavelSedeMatricula,
            representanteCessionarioNome,
            representanteCessionarioCpf,
            responsavelNome: responsavelSedeNome,
            responsavelCargo: `Fiscal SEDE (Mat. ${responsavelSedeMatricula})`,
            dataHoraPreenchimento: dataHora || now,
            observacoesGerais,
            devolucaoStatus,
            providenciasPendencias: providencias,
            concluidaEm: now,
          };

          await db.vistorias.put(vistoriaData);
          await db.eventos.update(evento.id, {
            responsavelSedeNome,
            responsavelSedeMatricula,
            representanteLegal: representanteCessionarioNome || evento.representanteLegal,
            cpfRepresentanteLegal: representanteCessionarioCpf || evento.cpfRepresentanteLegal,
            status: 'VISTORIA_FINAL_CONCLUIDA',
            updatedAt: now,
          });

          await registrarHistorico(
            evento.id,
            responsavelSedeNome,
            'Vistoria Final Concluída e Homologada',
            `Status de Devolução: ${devolucaoStatus} • ${summary.danos} danos • ${summary.alteracoes} alterações`
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
        } finally {
          setIsSaving(false);
        }
      },
    });
  };

  const condicoesButtons: { value: CondicaoItem; label: string; icon: React.FC<{ className?: string }> }[] = [
    { value: 'BOM', label: 'Bom', icon: Check },
    { value: 'REGULAR', label: 'Regular', icon: AlertTriangle },
    { value: 'RUIM', label: 'Ruim', icon: XCircle },
    { value: 'NAO_SE_APLICA', label: 'N/A', icon: MinusCircle },
  ];

  return (
    <div className="space-y-6">
      {/* Banner de Status da Vistoria Final */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
          isConcluida && isEditingLocked
            ? 'bg-teal-50/80 border-teal-200'
            : 'bg-amber-50/80 border-amber-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isConcluida && isEditingLocked ? 'bg-teal-600 text-white' : 'bg-amber-500 text-white'
            }`}
          >
            {isConcluida && isEditingLocked ? <Lock className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {isConcluida
                  ? isEditingLocked
                    ? 'Vistoria Final Homologada e Preservada'
                    : 'Vistoria Final em Modo de Edição (Reaberta)'
                  : 'Vistoria Final de Devolução — Em Preenchimento'}
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  isConcluida && isEditingLocked
                    ? 'bg-teal-100 text-teal-800 border border-teal-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {isConcluida && isEditingLocked ? 'HOMOLOGADA' : 'EM EDIÇÃO'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {isConcluida && isEditingLocked
                ? `Homologada em ${formatDateTimeBR(vistoriaFinal?.concluidaEm || vistoriaFinal?.dataHoraPreenchimento)} por ${vistoriaFinal?.responsavelSedeNome || vistoriaFinal?.responsavelNome || 'Fiscal SEDE'}. Clique em "Editar Vistoria Final" para alterar itens, parecer ou status.`
                : 'Você pode alterar a condição dos itens, observações, fotos pós-evento, providências e a declaração de devolução.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
          <button
            type="button"
            onClick={onGeneratePdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 shadow-sm transition active:scale-95 min-h-[38px]"
            title="Visualizar e imprimir Termo de Vistoria de Uso em PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Termo (PDF)</span>
          </button>

          {isEditingLocked && (
            <button
              type="button"
              onClick={handleUnlockForEditing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 shadow-sm transition active:scale-95 min-h-[38px]"
              title="Reabrir vistoria final para edição"
            >
              <Unlock className="w-3.5 h-3.5 text-amber-600" />
              <span>Editar Vistoria Final</span>
            </button>
          )}
        </div>
      </div>
      {/* Resumo do Comparativo Automático */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold text-base">
            {summary.semAlteracao}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">Sem Alteração</div>
            <div className="text-[11px] text-slate-500">Mantidos no estado original</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-base">
            {summary.alteracoes}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">Alterações</div>
            <div className="text-[11px] text-slate-500">Mudanças de estado</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-extrabold text-base">
            {summary.danos}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">Danos / Avarias</div>
            <div className="text-[11px] text-slate-500">Exigem reparo/ressarcimento</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-extrabold text-base">
            {summary.totalItens}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">Total de Itens</div>
            <div className="text-[11px] text-slate-500">Avaliados na cessão</div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Itens com Comparação Lado a Lado */}
      <div className="space-y-6">
        {ambientes.map((amb) => {
          const itensAmb = itensFinais.filter((i) => i.ambiente === amb);

          return (
            <div
              key={amb}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Header do Ambiente */}
              <div className="bg-slate-900 px-5 py-3.5 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <h4 className="text-sm font-bold tracking-wide">{amb}</h4>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-teal-300 border border-slate-700 font-medium">
                    {itensAmb.length} itens comparados
                  </span>
                </div>
              </div>

              {/* Lista Comparativa */}
              <div className="divide-y divide-slate-100">
                {itensAmb.map((itemFinal) => {
                  const itemIni = itemFinal.itemOriginalId
                    ? mapIniciais.get(itemFinal.itemOriginalId)
                    : mapIniciais.get(`${itemFinal.ambiente}:::${itemFinal.descricao}`) || mapIniciais.get(itemFinal.descricao.toLowerCase().trim());

                  const fotosItemIni = fotos.filter(
                    (f) => f.itemId === itemIni?.id && f.vistoriaTipo === 'INICIAL'
                  );
                  const fotosItemFin = fotos.filter(
                    (f) => f.itemId === itemFinal.id && f.vistoriaTipo === 'FINAL'
                  );

                  const compMeta = getComparisonLabel(itemFinal.resultadoComparacao);
                  const isDivergente =
                    itemFinal.resultadoComparacao === 'DANO_IDENTIFICADO' ||
                    itemFinal.resultadoComparacao === 'ALTERACAO_IDENTIFICADA' ||
                    itemFinal.resultadoComparacao === 'ITEM_AUSENTE';

                  return (
                    <div
                      key={itemFinal.id}
                      className={`p-4 sm:p-5 transition-colors ${
                        itemFinal.resultadoComparacao === 'DANO_IDENTIFICADO'
                          ? 'bg-rose-50/40'
                          : itemFinal.resultadoComparacao === 'ALTERACAO_IDENTIFICADA'
                          ? 'bg-amber-50/30'
                          : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="font-bold text-sm text-slate-900">
                              {itemFinal.descricao}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${compMeta.badgeClass}`}
                            >
                              {compMeta.label}
                            </span>
                          </div>

                          {/* Comparativo Inicial x Final */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs">
                            {/* Card Vistoria Inicial */}
                            <div className="p-2.5 rounded-xl bg-slate-100/80 border border-slate-200">
                              <div className="flex items-center justify-between font-semibold text-slate-500 mb-1">
                                <span>Condição na Entrega (Inicial)</span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${getItemStatusLabel(itemIni?.situacao || 'BOM').badgeClass}`}>
                                  {getItemStatusLabel(itemIni?.situacao || 'BOM').label}
                                </span>
                              </div>
                              <p className="text-slate-700 italic">
                                {itemIni?.observacao ? `"${itemIni.observacao}"` : 'Sem ressalvas no pré-evento'}
                              </p>

                              {fotosItemIni.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                  <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                                    {fotosItemIni.length} {fotosItemIni.length === 1 ? 'foto pré-evento' : 'fotos pré-evento'}:
                                  </span>
                                  {fotosItemIni.map((f) => (
                                    <button
                                      key={f.id}
                                      type="button"
                                      onClick={() => setActivePhoto(f)}
                                      className="w-8 h-8 rounded-lg overflow-hidden border-2 border-teal-400 hover:border-teal-600 hover:scale-105 transition cursor-pointer"
                                      title="Visualizar foto inicial"
                                    >
                                      <img src={f.dataUrl} alt="Foto Inicial" className="w-full h-full object-cover" />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Card Vistoria Final */}
                            <div className="p-2.5 rounded-xl bg-white border border-slate-300 shadow-xs">
                              <div className="flex items-center justify-between font-semibold text-slate-700 mb-1">
                                <span>Condição na Devolução (Final)</span>
                                {!isEditingLocked ? (
                                  <div className="flex items-center gap-1">
                                    {condicoesButtons.map((opt) => (
                                      <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() =>
                                          handleUpdateItemFinal(itemFinal, {
                                            situacao: opt.value,
                                            conferido: true,
                                          })
                                        }
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                          itemFinal.situacao === opt.value
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                        }`}
                                      >
                                        {opt.label}
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${getItemStatusLabel(itemFinal.situacao).badgeClass}`}>
                                    {getItemStatusLabel(itemFinal.situacao).label}
                                  </span>
                                )}
                              </div>

                              {!isEditingLocked ? (
                                <input
                                  type="text"
                                  value={itemFinal.observacao || ''}
                                  onChange={(e) =>
                                    handleUpdateItemFinal(itemFinal, { observacao: e.target.value })
                                  }
                                  placeholder="Observação da condição pós-evento..."
                                  className="w-full mt-1.5 px-2 py-1 text-xs rounded border border-slate-200 outline-none"
                                />
                              ) : (
                                <p className="text-slate-700 italic">
                                  {itemFinal.observacao ? `"${itemFinal.observacao}"` : 'Sem ressalvas'}
                                </p>
                              )}

                              {fotosItemFin.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                  <span className="text-[10px] text-rose-800 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                    {fotosItemFin.length} {fotosItemFin.length === 1 ? 'foto pós-evento' : 'fotos pós-evento'}:
                                  </span>
                                  {fotosItemFin.map((f) => (
                                    <button
                                      key={f.id}
                                      type="button"
                                      onClick={() => setActivePhoto(f)}
                                      className="w-8 h-8 rounded-lg overflow-hidden border-2 border-rose-400 hover:border-rose-600 hover:scale-105 transition cursor-pointer"
                                      title="Visualizar foto pós-evento"
                                    >
                                      <img src={f.dataUrl} alt="Foto Final" className="w-full h-full object-cover" />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Campo Obrigatório de Justificativa e Providência se houver Divergência */}
                          {isDivergente && (
                            <div className="mt-3 p-3 rounded-xl bg-rose-50/80 border border-rose-200 text-xs space-y-2">
                              <div>
                                <label className="block font-bold text-rose-900 mb-1 flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                  Houve alteração / dano: Justificativa da ocorrência:
                                </label>
                                <input
                                  type="text"
                                  disabled={isEditingLocked}
                                  value={itemFinal.justificativaDivergencia || ''}
                                  onChange={(e) =>
                                    handleUpdateItemFinal(itemFinal, {
                                      justificativaDivergencia: e.target.value,
                                    })
                                  }
                                  placeholder="Descreva o que ocorreu (ex: piso danificado durante desmontagem do palco)..."
                                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-rose-300 bg-white focus:ring-2 focus:ring-rose-500 outline-none disabled:bg-slate-50"
                                />
                              </div>

                              <div>
                                <label className="block font-bold text-rose-900 mb-1">
                                  Providência Necessária a Cargo do Cessionário:
                                </label>
                                <input
                                  type="text"
                                  disabled={isEditingLocked}
                                  value={itemFinal.providenciaNecessaria || ''}
                                  onChange={(e) =>
                                    handleUpdateItemFinal(itemFinal, {
                                      providenciaNecessaria: e.target.value,
                                    })
                                  }
                                  placeholder="Ex: Cessionário providenciará a limpeza e reparo em 48h..."
                                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-rose-300 bg-white focus:ring-2 focus:ring-rose-500 outline-none disabled:bg-slate-50"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Botão de Anexo de Foto Pós-evento */}
                        {!isEditingLocked && (
                          <div className="shrink-0 flex items-center gap-2 self-start lg:self-center">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveItemPhotoUploader(
                                  activeItemPhotoUploader === itemFinal.id ? null : itemFinal.id
                                )
                              }
                              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition active:scale-95 border ${
                                fotosItemFin.length > 0
                                  ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                                  : 'text-teal-700 bg-teal-50 hover:bg-teal-100 border-teal-200'
                              }`}
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>
                                {fotosItemFin.length > 0
                                  ? `Fotos Pós-evento (${fotosItemFin.length})`
                                  : 'Foto Pós-evento'}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Uploader Inline */}
                      {activeItemPhotoUploader === itemFinal.id && !isEditingLocked && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <PhotoUploader
                            eventoId={itemFinal.eventoId}
                            vistoriaTipo="FINAL"
                            ambiente={itemFinal.ambiente}
                            itemId={itemFinal.id}
                            onPhotoAdded={onRefresh}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Encerramento da Vistoria Final — Declaração Oficial de Entrega */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-6">
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-teal-600" />
          7. Declaração Oficial de Entrega e Devolução (SEDE)
        </h4>

        {/* 4 Opções Oficiais */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Resultado da Devolução do Espaço Público *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              disabled={isEditingLocked}
              onClick={() => setDevolucaoStatus('CONFORME')}
              className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition ${
                devolucaoStatus === 'CONFORME'
                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold">Devolvido em Condições Satisfatórias</div>
                <div className="text-[11px] font-normal text-slate-500">Sem pendências identificadas</div>
              </div>
            </button>

            <button
              type="button"
              disabled={isEditingLocked}
              onClick={() => setDevolucaoStatus('COM_RESSALVAS')}
              className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition ${
                devolucaoStatus === 'COM_RESSALVAS'
                  ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold">Devolvido com Pendências</div>
                <div className="text-[11px] font-normal text-slate-500">Conforme registros da vistoria</div>
              </div>
            </button>

            <button
              type="button"
              disabled={isEditingLocked}
              onClick={() => setDevolucaoStatus('COM_DANOS')}
              className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition ${
                devolucaoStatus === 'COM_DANOS'
                  ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 text-rose-950 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold">Devolvido com Danos</div>
                <div className="text-[11px] font-normal text-slate-500">Necessária adoção de providências/reparos</div>
              </div>
            </button>

            <button
              type="button"
              disabled={isEditingLocked}
              onClick={() => setDevolucaoStatus('AGUARDA_REGULARIZACAO')}
              className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition ${
                devolucaoStatus === 'AGUARDA_REGULARIZACAO'
                  ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/20 text-purple-950 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MinusCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold">Aguarda Regularização das Pendências</div>
                <div className="text-[11px] font-normal text-slate-500">Cientificado para regularizar no prazo</div>
              </div>
            </button>
          </div>
        </div>

        {/* Providências e Pendências */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Descrição Geral das Ocorrências e Providências
          </label>
          <textarea
            rows={2}
            disabled={isEditingLocked}
            value={providencias}
            onChange={(e) => setProvidencias(e.target.value)}
            placeholder="Ex: Cessionário notificado para substituição do material avariado no prazo regulamentar..."
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none resize-none disabled:bg-slate-50"
          />
        </div>

        {/* Responsáveis Oficiais pela Vistoria Final */}
        <div className="space-y-4 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-teal-600" />
              Identificação dos Responsáveis pela Vistoria Final
            </h5>
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
                </div>
              </div>
            </div>

            {onEditCessionario && (
              <button
                type="button"
                id="btn-edit-cessionario-vistoria-final"
                onClick={onEditCessionario}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-teal-800 bg-white hover:bg-teal-50 border border-teal-300 shadow-xs transition active:scale-95 shrink-0 self-start sm:self-center"
                title="Editar dados cadastrais, razão social, documento ou representantes do cessionário"
              >
                <Edit3 className="w-3.5 h-3.5 text-teal-600" />
                <span>Editar Dados do Cessionário</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                onBlur={() => persistFinalFields({ responsavelSedeNome })}
                placeholder="Nome do fiscal SEDE"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-slate-50"
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
                onBlur={() => persistFinalFields({ responsavelSedeMatricula })}
                placeholder="Ex: 12345-6 ou SEDE-4412"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-slate-50"
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
                onBlur={() => persistFinalFields({ representanteCessionarioNome })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-slate-50"
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
                onBlur={() => persistFinalFields({ representanteCessionarioCpf })}
                placeholder="000.000.000-00"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Data e Horário da Vistoria
              </label>
              <input
                type="datetime-local"
                id="dataHoraFinal"
                disabled={isEditingLocked}
                value={toInputDateTimeLocal(dataHora)}
                onChange={(e) => {
                  const val = e.target.value;
                  setDataHora(val);
                  persistFinalFields({ dataHoraPreenchimento: val });
                }}
                onBlur={() => persistFinalFields({ dataHoraPreenchimento: dataHora })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observações Finais Complementares
            </label>
            <input
              type="text"
              disabled={isEditingLocked}
              value={observacoesGerais}
              onChange={(e) => setObservacoesGerais(e.target.value)}
              onBlur={() => persistFinalFields({ observacoesGerais })}
              placeholder="Ex: Vistoria acompanhada pelo coordenador geral..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-slate-50"
            />
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200">
          {!isEditingLocked ? (
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              {isConcluida && (
                <button
                  type="button"
                  onClick={() => setIsEditingLocked(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition active:scale-95"
                >
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span>Cancelar Edição</span>
                </button>
              )}

              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveDraft}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 shadow-sm transition active:scale-95"
              >
                <Save className="w-4 h-4 text-slate-500" />
                <span>Salvar Rascunho</span>
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleConcludeFinalInspection}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 transition active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isConcluida ? 'Salvar e Concluir Alterações' : 'Concluir e Homologar Vistoria Final'}</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleUnlockForEditing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 shadow-sm transition active:scale-95"
                title="Desbloquear para alterar itens, fotos pós-evento ou status"
              >
                <Unlock className="w-4 h-4 text-amber-600" />
                <span>Editar Vistoria Final</span>
              </button>

              <button
                type="button"
                onClick={onGeneratePdf}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 shadow-md shadow-teal-400/20 transition active:scale-95"
              >
                <FileCheck className="w-4 h-4" />
                <span>Visualizar e Baixar Termo em PDF</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        isDanger={confirmModal.isDanger}
      />

      {/* Photo Modal Viewer & Editor */}
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
