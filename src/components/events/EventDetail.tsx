import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, FileText, ClipboardList, CheckCircle2, Image as ImageIcon, History, Cloud, Edit3, Lock, Clock, Printer } from 'lucide-react';
import type { Evento, Vistoria, ItemVistoria, FotoVistoria, HistoricoEvento, TipoDocumentoPdf } from '../../types/vistoria';
import { db, registrarHistorico } from '../../db/database';
import { getCustomInspectionItems } from '../../config/defaultInspectionItems';
import { EventTimeline } from './EventTimeline';
import { InitialInspectionForm } from '../inspection/InitialInspectionForm';
import { FinalInspectionForm } from '../inspection/FinalInspectionForm';
import { PhotoGallery } from '../photos/PhotoGallery';
import { UnlockFinalModal } from '../inspection/UnlockFinalModal';
import { generateTermoVistoriaPdf } from '../../services/pdfGenerator';
import { PdfViewerModal } from '../pdf/PdfViewerModal';
import type { jsPDF } from 'jspdf';
import { syncEventToGoogleDrive } from '../../services/googleDriveService';

interface EventDetailProps {
  eventoId: string;
  onBack: () => void;
  onEditEvent: (evento: Evento) => void;
}

export const EventDetail: React.FC<EventDetailProps> = ({
  eventoId,
  onBack,
  onEditEvent,
}) => {
  const [evento, setEvento] = useState<Evento | null>(null);
  const [vistoriaInicial, setVistoriaInicial] = useState<Vistoria | undefined>(undefined);
  const [vistoriaFinal, setVistoriaFinal] = useState<Vistoria | undefined>(undefined);
  const [itensIniciais, setItensIniciais] = useState<ItemVistoria[]>([]);
  const [itensFinais, setItensFinais] = useState<ItemVistoria[]>([]);
  const [fotos, setFotos] = useState<FotoVistoria[]>([]);
  const [historico, setHistorico] = useState<HistoricoEvento[]>([]);

  const [activeTab, setActiveTab] = useState<'inicial' | 'final' | 'fotos' | 'historico'>('inicial');
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  // PDF Modal
  const [pdfModalDoc, setPdfModalDoc] = useState<jsPDF | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);

  const loadEventData = useCallback(async () => {
    const ev = await db.eventos.get(eventoId);
    if (!ev) return;
    setEvento(ev);

    const vistorias = await db.vistorias.where({ eventoId }).toArray();
    const ini = vistorias.find((v) => v.tipo === 'INICIAL');
    const fin = vistorias.find((v) => v.tipo === 'FINAL');
    setVistoriaInicial(ini);
    setVistoriaFinal(fin);

    const itensIni = await db.itens.where({ eventoId, vistoriaTipo: 'INICIAL' }).sortBy('ordem');
    const itensFin = await db.itens.where({ eventoId, vistoriaTipo: 'FINAL' }).sortBy('ordem');

    if (itensIni.length === 0) {
      const templates = getCustomInspectionItems(ev);
      const novosItensIni: ItemVistoria[] = templates.map((itemPadrao, index) => ({
        id: crypto.randomUUID(),
        eventoId,
        vistoriaTipo: 'INICIAL',
        ambiente: itemPadrao.ambiente,
        descricao: itemPadrao.descricao,
        conferido: true,
        situacao: itemPadrao.situacaoPadrao,
        ordem: index + 1,
      }));

      await db.itens.bulkAdd(novosItensIni);
      setItensIniciais(novosItensIni);
    } else {
      setItensIniciais(itensIni);
    }

    setItensFinais(itensFin);

    const todasFotos = await db.fotos.where({ eventoId }).sortBy('ordem');
    setFotos(todasFotos);

    const todosLogs = await db.historico.where({ eventoId }).reverse().sortBy('dataHora');
    setHistorico(todosLogs);
  }, [eventoId]);

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  if (!evento) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center shadow-sm">
        <p className="text-slate-500 text-sm">Carregando dados da cessão...</p>
      </div>
    );
  }

  const handleUnlockFinalInspection = async (dataHoraRealFim: string) => {
    await db.eventos.update(evento.id, {
      dataHoraRealFim,
      status: 'AGUARDANDO_VISTORIA_FINAL',
      updatedAt: new Date().toISOString(),
    });

    if (itensFinais.length === 0) {
      const novosItensFinais: ItemVistoria[] = itensIniciais.map((itemIni, idx) => ({
        id: crypto.randomUUID(),
        eventoId: evento.id,
        vistoriaTipo: 'FINAL',
        ambiente: itemIni.ambiente,
        descricao: itemIni.descricao,
        conferido: true,
        situacao: itemIni.situacao,
        itemOriginalId: itemIni.id,
        resultadoComparacao: 'SEM_ALTERACAO',
        ordem: idx + 1,
      }));

      await db.itens.bulkAdd(novosItensFinais);
    }

    if (!vistoriaFinal) {
      const novaVistoriaFinal: Vistoria = {
        id: crypto.randomUUID(),
        eventoId: evento.id,
        tipo: 'FINAL',
        status: 'RASCUNHO',
        responsavelSedeNome: vistoriaInicial?.responsavelSedeNome || 'Fiscal SEDE',
        responsavelSedeMatricula: vistoriaInicial?.responsavelSedeMatricula || 'SEDE-4412',
        responsavelNome: vistoriaInicial?.responsavelNome || 'Equipe de Vistoria',
        responsavelCargo: vistoriaInicial?.responsavelCargo || 'Fiscal de Vistoria',
        dataHoraPreenchimento: dataHoraRealFim,
        devolucaoStatus: 'CONFORME',
      };
      await db.vistorias.put(novaVistoriaFinal);
    }

    await registrarHistorico(
      evento.id,
      vistoriaInicial?.responsavelSedeNome || 'Fiscal SEDE',
      'Vistoria Final Liberada Pós-evento',
      `Data/hora de encerramento registrada: ${new Date(dataHoraRealFim).toLocaleString('pt-BR')}`
    );

    await loadEventData();
    setActiveTab('final');
  };

  const handleGeneratePdf = async (tipoDocumento: TipoDocumentoPdf = 'COMPLETO', isDraft = false) => {
    setIsGeneratingPdf(true);
    try {
      // Busca a lista mais atualizada de fotos do banco para garantir que nada fique de fora
      const fotosAtualizadas = await db.fotos.where({ eventoId: evento.id }).sortBy('ordem');

      const doc = await generateTermoVistoriaPdf({
        evento,
        vistoriaInicial,
        vistoriaFinal,
        itensIniciais,
        itensFinais,
        fotos: fotosAtualizadas.length > 0 ? fotosAtualizadas : fotos,
        isDraft,
        tipoDocumento,
      });

      setPdfModalDoc(doc);
      const descDoc = tipoDocumento === 'INICIAL_ENTREGA' ? 'Termo de Entrega (Vistoria Inicial)' : 'Termo de Devolução (Vistoria Final)';
      await registrarHistorico(
        evento.id,
        'Sistema',
        isDraft ? `${descDoc} (Rascunho) Gerado` : `${descDoc} Oficial em PDF Gerado`,
        `Versão emitida com ${fotosAtualizadas.length} fotos anexadas`
      );
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar documento PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDirectSyncDrive = async () => {
    setIsSyncingDrive(true);
    try {
      const res = await syncEventToGoogleDrive(evento.id);
      alert(res.message);
      loadEventData();
    } catch (err: unknown) {
      alert(`Erro: ${(err as Error).message}`);
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const isInicialConcluida = vistoriaInicial?.status === 'CONCLUIDA';
  const isFinalLiberada = Boolean(evento.dataHoraRealFim);
  const isFinalConcluida = vistoriaFinal?.status === 'CONCLUIDA';

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-12">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <button
              onClick={onBack}
              className="p-2 sm:p-2.5 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition active:scale-95 shrink-0 min-h-[38px] min-w-[38px] flex items-center justify-center"
              title="Voltar à lista de cessões"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                  {evento.processoProtocolo || evento.codigo || 'S/N'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium truncate">
                  • {evento.espacoCedido}
                </span>
                {evento.googleDriveSyncedAt && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full" title={`Sincronizado no Google Drive em: ${new Date(evento.googleDriveSyncedAt).toLocaleString('pt-BR')}`}>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Drive OK
                  </span>
                )}
              </div>
              <h1 className="text-base sm:text-xl font-black text-slate-900 leading-tight mt-1 truncate">
                {evento.nome}
              </h1>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2 flex-wrap pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <button
              onClick={() => onEditEvent(evento)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition active:scale-95 min-h-[38px]"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>

            <button
              onClick={handleDirectSyncDrive}
              disabled={isSyncingDrive}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition active:scale-95 disabled:opacity-50 min-h-[38px]"
              title="Salvar PDF e fotos no Google Drive da SEDE"
            >
              <Cloud className={`w-3.5 h-3.5 text-teal-600 ${isSyncingDrive ? 'animate-bounce' : ''}`} />
              <span>{isSyncingDrive ? 'Sincronizando...' : 'Salvar no Drive'}</span>
            </button>

            {/* Botão de Termo de Entrega (Vistoria Inicial) */}
            <button
              onClick={() => handleGeneratePdf('INICIAL_ENTREGA', !isInicialConcluida)}
              disabled={isGeneratingPdf}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-teal-950 bg-teal-100 hover:bg-teal-200 border border-teal-300 shadow-xs active:scale-95 transition min-h-[38px]"
              title="Emitir Termo de Responsabilidade e Vistoria de Entrega com visto do Cessionário"
            >
              <Printer className="w-3.5 h-3.5 text-teal-700" />
              <span>Termo Entrega (Inicial)</span>
            </button>

            {/* Botão de Termo Final (Devolução) */}
            <button
              onClick={() => handleGeneratePdf('COMPLETO', !isFinalConcluida)}
              disabled={isGeneratingPdf}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 shadow-md shadow-teal-400/20 active:scale-95 transition disabled:opacity-50 min-h-[38px]"
            >
              <FileText className="w-4 h-4" />
              <span>{isFinalConcluida ? 'Termo Devolução (PDF)' : 'Laudo Completo PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stepper Timeline */}
      <EventTimeline
        evento={evento}
        vistoriaInicial={vistoriaInicial}
        vistoriaFinal={vistoriaFinal}
      />

      {/* Event Details Compact Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm text-xs text-slate-600">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-0.5 text-[10px]">Cessionário(a)</span>
            <span className="font-semibold text-slate-800 text-xs sm:text-sm">{evento.contratante}</span>
            {evento.docContratante && <span className="block text-slate-500 font-mono text-[11px] mt-0.5">{evento.docContratante}</span>}
          </div>

          <div>
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-0.5 text-[10px]">Representante Legal</span>
            <span className="font-semibold text-slate-800 text-xs sm:text-sm">{evento.representanteLegal || evento.responsavelEvento}</span>
            <span className="block text-slate-500 text-[11px] mt-0.5">{evento.telefoneResponsavel || '-'}</span>
          </div>

          <div>
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-0.5 text-[10px]">Local e Áreas Cedidas</span>
            <span className="font-semibold text-slate-800 text-xs sm:text-sm">{evento.espacoCedido}</span>
            <span className="block text-teal-800 font-medium text-[11px] mt-0.5">{evento.areaEspacoCedido || evento.enderecoLocal}</span>
          </div>

          <div>
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-0.5 text-[10px]">Período de Utilização</span>
            <span className="font-semibold text-slate-800 block text-[11px]">
              {new Date(evento.dataHoraPrevisaoInicio).toLocaleDateString('pt-BR')} até {new Date(evento.dataHoraPrevisaoFim).toLocaleDateString('pt-BR')}
            </span>
            <span className="text-slate-500 block text-[10px] mt-0.5">
              Montagem: {evento.periodoMontagem || 'Padrão'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Mobile scrollable) */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm overflow-x-auto gap-1.5 scrollbar-none">
        <button
          onClick={() => setActiveTab('inicial')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap min-h-[40px] ${
            activeTab === 'inicial'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="w-4 h-4 text-teal-400 shrink-0" />
          <span>1. Vistoria Inicial</span>
          {isInicialConcluida && <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />}
        </button>

        <button
          onClick={() => {
            if (!isInicialConcluida) {
              alert('A vistoria inicial precisa ser concluída antes de acessar a vistoria final.');
              return;
            }
            setActiveTab('final');
          }}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap min-h-[40px] ${
            activeTab === 'final'
              ? 'bg-slate-900 text-white shadow-sm'
              : !isInicialConcluida
              ? 'opacity-40 text-slate-400 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>2. Vistoria Final</span>
          {!isInicialConcluida && <Lock className="w-3 h-3 text-slate-400 shrink-0" />}
          {isFinalConcluida && <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />}
        </button>

        <button
          onClick={() => setActiveTab('fotos')}
          className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap min-h-[40px] ${
            activeTab === 'fotos'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-teal-400 shrink-0" />
          <span>Fotos ({fotos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('historico')}
          className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap min-h-[40px] ${
            activeTab === 'historico'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4 text-teal-400 shrink-0" />
          <span>Histórico</span>
        </button>
      </div>

      {/* TAB CONTENT 1: VISTORIA INICIAL */}
      {activeTab === 'inicial' && (
        <InitialInspectionForm
          evento={evento}
          vistoria={vistoriaInicial}
          itens={itensIniciais}
          fotos={fotos}
          onRefresh={loadEventData}
          onGenerateInitialPdf={() => handleGeneratePdf('INICIAL_ENTREGA', !isInicialConcluida)}
        />
      )}

      {/* TAB CONTENT 2: VISTORIA FINAL & COMPARATIVO */}
      {activeTab === 'final' && (
        <>
          {!isFinalLiberada ? (
            <div className="bg-white rounded-3xl p-6 sm:p-12 border border-slate-200 text-center shadow-sm space-y-4 max-w-2xl mx-auto">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
                <Clock className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Vistoria Final Aguardando Encerramento
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  A Vistoria Inicial já foi homologada. Ao final do evento, libere a vistoria final para confrontar as condições de devolução do espaço.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleGeneratePdf('INICIAL_ENTREGA', false)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition min-h-[44px]"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Imprimir Termo Inicial Assinado</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowUnlockModal(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 shadow-md shadow-teal-400/20 active:scale-95 transition min-h-[44px]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Liberar Vistoria Final (Pós-Evento)</span>
                </button>
              </div>
            </div>
          ) : (
            <FinalInspectionForm
              evento={evento}
              vistoriaInicial={vistoriaInicial}
              vistoriaFinal={vistoriaFinal}
              itensIniciais={itensIniciais}
              itensFinais={itensFinais}
              fotos={fotos}
              onRefresh={loadEventData}
              onGeneratePdf={() => handleGeneratePdf('COMPLETO', false)}
            />
          )}
        </>
      )}

      {/* TAB CONTENT 3: FOTOS */}
      {activeTab === 'fotos' && (
        <PhotoGallery
          eventoId={evento.id}
          fotos={fotos}
          onPhotoAdded={loadEventData}
          onDeletePhoto={async (fotoId) => {
            await db.fotos.delete(fotoId);
            loadEventData();
          }}
        />
      )}

      {/* TAB CONTENT 4: HISTÓRICO & AUDITORIA */}
      {activeTab === 'historico' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
            <History className="w-4 h-4 text-teal-600" />
            Registro de Auditoria e Linha do Tempo
          </h3>

          {historico.length === 0 ? (
            <p className="text-xs text-slate-400">Nenhum evento registrado no histórico.</p>
          ) : (
            <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {historico.map((h) => (
                <div key={h.id} className="relative group">
                  <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-teal-500 ring-4 ring-white" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 text-xs">
                    <span className="font-bold text-slate-900">{h.acao}</span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {new Date(h.dataHora).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Responsável: <strong>{h.responsavel}</strong>
                  </div>
                  {h.detalhes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-1.5">
                      {h.detalhes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Unlock Modal */}
      <UnlockFinalModal
        isOpen={showUnlockModal}
        previsaoFim={evento.dataHoraPrevisaoFim}
        onClose={() => setShowUnlockModal(false)}
        onConfirm={handleUnlockFinalInspection}
      />

      {/* PDF Modal */}
      <PdfViewerModal
        isOpen={Boolean(pdfModalDoc)}
        doc={pdfModalDoc}
        eventoId={evento.id}
        codigoEvento={evento.processoProtocolo || evento.codigo}
        isDraft={!isFinalConcluida}
        onClose={() => setPdfModalDoc(null)}
      />
    </div>
  );
};
