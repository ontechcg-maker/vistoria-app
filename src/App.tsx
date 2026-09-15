import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, registrarHistorico } from './db/database';
import type { Evento, Vistoria } from './types/vistoria';
import { Header } from './components/layout/Header';
import { EventList } from './components/events/EventList';
import { EventDetail } from './components/events/EventDetail';
import { EventFormModal } from './components/events/EventFormModal';
import { GoogleDriveModal } from './components/drive/GoogleDriveModal';
import { HelpModal } from './components/help/HelpModal';
import { MobileBottomBar } from './components/layout/MobileBottomBar';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { PWAInstallButton } from './components/pwa/PWAInstallButton';
import { getCustomInspectionItems } from './config/defaultInspectionItems';
import { pullFromGoogleSheets, pushEventToGoogleSheets, deleteEventFromGoogleSheets } from './services/googleSheetsSyncService';
import { initFirestoreRealtimeSync } from './services/firestoreSyncService';

export const App: React.FC = () => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Evento | null>(null);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Live Query reativa ao IndexedDB (automaticamente atualizado pelo Firestore em tempo real)
  const eventos = useLiveQuery(() => db.eventos.reverse().sortBy('createdAt'), []) || [];

  // Inicialização do ouvinte em tempo real do Firebase Firestore
  useEffect(() => {
    const unsubFirestore = initFirestoreRealtimeSync();
    return () => {
      unsubFirestore();
    };
  }, []);

  // Auto-sincronização na inicialização e quando a aba ganha foco (Google Sheets)
  useEffect(() => {
    // Sincroniza ao abrir a página
    pullFromGoogleSheets().catch((err) => console.warn('Auto-sync inicial:', err));

    // Sincroniza ao focar na janela/aba (ex: usuário alternou entre celular e PC)
    const handleFocus = () => {
      pullFromGoogleSheets().catch(() => {});
    };
    window.addEventListener('focus', handleFocus);

    // Sincronização periódica a cada 2 minutos
    const interval = setInterval(() => {
      pullFromGoogleSheets().catch(() => {});
    }, 120000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  // Criar ou Editar Evento
  const handleSaveEvent = async (eventData: Partial<Evento>) => {
    const now = new Date().toISOString();

    if (eventToEdit) {
      // Edição
      await db.eventos.update(eventToEdit.id, {
        ...eventData,
        updatedAt: now,
      });
      await registrarHistorico(eventToEdit.id, 'Usuário', 'Dados Cadastrais do Evento Atualizados');
      // Sincroniza com Google Sheets em background
      pushEventToGoogleSheets(eventToEdit.id).catch((err) => console.warn('Erro ao sincronizar edição:', err));
      setEventToEdit(null);
    } else {
      // Novo Evento
      const newId = crypto.randomUUID();
      const novoEvento: Evento = {
        id: newId,
        codigo: eventData.codigo || eventData.processoProtocolo || `PA-${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}-SEDE`,
        processoProtocolo: eventData.processoProtocolo || eventData.codigo || `PA-${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}-SEDE`,
        nome: eventData.nome || 'Evento de Cessão de Espaço',
        tipo: eventData.tipo || 'Cessão de Espaço Público',
        contratante: eventData.contratante || '',
        docContratante: eventData.docContratante || '',
        representanteLegal: eventData.representanteLegal || '',
        cpfRepresentanteLegal: eventData.cpfRepresentanteLegal || '',
        responsavelEvento: eventData.representanteLegal || eventData.responsavelEvento || '',
        telefoneResponsavel: eventData.telefoneResponsavel || '',
        emailResponsavel: eventData.emailResponsavel || '',
        espacoCedido: eventData.espacoCedido || 'Parque do Povo',
        areaEspacoCedido: eventData.areaEspacoCedido || 'Pirâmide',
        areasParqueDoPovo: eventData.areasParqueDoPovo || ['PIRAMIDE'],
        banheirosDisponibilizados: eventData.banheirosDisponibilizados || ['BANHEIRO_PIRAMIDE'],
        enderecoLocal: eventData.enderecoLocal || 'Rua Sebastião Donato, Centro - Campina Grande/PB',
        dataInicio: eventData.dataInicio || now.slice(0, 10),
        dataHoraPrevisaoInicio: eventData.dataHoraPrevisaoInicio || `${now.slice(0, 10)}T08:00`,
        dataHoraPrevisaoFim: eventData.dataHoraPrevisaoFim || `${now.slice(0, 10)}T22:00`,
        periodoMontagem: eventData.periodoMontagem || '',
        periodoDesmontagem: eventData.periodoDesmontagem || '',
        responsavelSedeNome: eventData.responsavelSedeNome || 'Fiscal de Vistoria da SEDE',
        responsavelSedeMatricula: eventData.responsavelSedeMatricula || 'SEDE-4412',
        observacoesGerais: eventData.observacoesGerais || '',
        status: 'VISTORIA_INICIAL_PENDENTE',
        createdAt: now,
        updatedAt: now,
      };

      // Criação da vistoria inicial vinculada imediatamente
      const vistoriaInicialPadrao: Vistoria = {
        id: crypto.randomUUID(),
        eventoId: newId,
        tipo: 'INICIAL',
        status: 'RASCUNHO',
        responsavelSedeNome: eventData.responsavelSedeNome || 'Fiscal de Vistoria da SEDE',
        responsavelSedeMatricula: eventData.responsavelSedeMatricula || 'SEDE-4412',
        representanteCessionarioNome: eventData.representanteLegal || eventData.responsavelEvento || '',
        representanteCessionarioCpf: eventData.cpfRepresentanteLegal || '',
        responsavelNome: eventData.responsavelSedeNome || 'Fiscal de Vistoria da SEDE',
        responsavelCargo: `Fiscal SEDE (${eventData.responsavelSedeMatricula || 'SEDE-4412'})`,
        dataHoraPreenchimento: now,
        observacoesGerais: '',
      };

      // Inicializa itens oficiais personalizados para a vistoria inicial
      const templates = getCustomInspectionItems(novoEvento);
      const itensIniciais = templates.map((itemPadrao, index) => ({
        id: crypto.randomUUID(),
        eventoId: newId,
        vistoriaTipo: 'INICIAL' as const,
        ambiente: itemPadrao.ambiente,
        descricao: itemPadrao.descricao,
        conferido: true,
        situacao: itemPadrao.situacaoPadrao,
        ordem: index + 1,
      }));

      await db.transaction('rw', [db.eventos, db.vistorias, db.itens, db.historico], async () => {
        await db.eventos.add(novoEvento);
        await db.vistorias.add(vistoriaInicialPadrao);
        await db.itens.bulkAdd(itensIniciais);
      });

      await registrarHistorico(newId, 'Usuário', 'Evento Criado no Sistema', `Checklist com ${itensIniciais.length} itens oficiais gerado`);
      // Sincroniza criação com Google Sheets em background
      pushEventToGoogleSheets(newId).catch((err) => console.warn('Erro ao sincronizar novo evento:', err));
      setSelectedEventId(newId);
    }
  };

  // Duplicar Evento
  const handleDuplicateEvent = async (evento: Evento) => {
    const now = new Date().toISOString();
    const newId = crypto.randomUUID();
    const novoEvento: Evento = {
      ...evento,
      id: newId,
      codigo: `${evento.codigo || 'EVT'}-COPIA`,
      nome: `${evento.nome} (Cópia)`,
      status: 'VISTORIA_INICIAL_PENDENTE',
      dataHoraRealFim: undefined,
      createdAt: now,
      updatedAt: now,
    };

    // Copiar checklist da vistoria inicial
    const itensOriginais = await db.itens.where({ eventoId: evento.id, vistoriaTipo: 'INICIAL' }).toArray();
    const novosItens = itensOriginais.map((i) => ({
      ...i,
      id: crypto.randomUUID(),
      eventoId: newId,
      observacao: undefined,
      situacao: 'BOM' as const,
    }));

    await db.transaction('rw', [db.eventos, db.itens, db.historico], async () => {
      await db.eventos.add(novoEvento);
      if (novosItens.length > 0) {
        await db.itens.bulkAdd(novosItens);
      }
    });

    await registrarHistorico(newId, 'Usuário', `Evento Duplicado a partir de ${evento.codigo}`);
    pushEventToGoogleSheets(newId).catch((err) => console.warn('Erro ao sincronizar duplicação:', err));
    setSelectedEventId(newId);
  };

  // Excluir Evento e registros vinculados
  const handleDeleteEvent = async (eventoId: string) => {
    await db.transaction('rw', [db.eventos, db.vistorias, db.itens, db.fotos, db.historico], async () => {
      await db.eventos.delete(eventoId);
      await db.vistorias.where({ eventoId }).delete();
      await db.itens.where({ eventoId }).delete();
      await db.fotos.where({ eventoId }).delete();
      await db.historico.where({ eventoId }).delete();
    });

    deleteEventFromGoogleSheets(eventoId).catch((err) => console.warn('Erro ao excluir no Google Sheets:', err));

    if (selectedEventId === eventoId) {
      setSelectedEventId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/60 selection:bg-teal-500 selection:text-white pb-[max(0rem,env(safe-area-inset-bottom))]">
      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Top Header */}
      <Header
        onNewEvent={() => {
          setEventToEdit(null);
          setIsEventModalOpen(true);
        }}
        onOpenDriveConfig={() => setIsDriveModalOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onGoHome={() => setSelectedEventId(null)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-28 md:pb-8">
        {!selectedEventId && (
          <div className="md:hidden">
            <PWAInstallButton variant="banner" />
          </div>
        )}

        {selectedEventId ? (
          <EventDetail
            eventoId={selectedEventId}
            onBack={() => setSelectedEventId(null)}
            onEditEvent={(ev) => {
              setEventToEdit(ev);
              setIsEventModalOpen(true);
            }}
          />
        ) : (
          <EventList
            eventos={eventos}
            onSelectEvent={(id) => setSelectedEventId(id)}
            onEditEvent={(ev) => {
              setEventToEdit(ev);
              setIsEventModalOpen(true);
            }}
            onDuplicateEvent={handleDuplicateEvent}
            onDeleteEvent={handleDeleteEvent}
            onNewEvent={() => {
              setEventToEdit(null);
              setIsEventModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 mb-14 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-slate-600">
            <span>
              <strong>Vistoria de Cessão de Espaço</strong> • SEDE Campina Grande
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <button
              id="btn-footer-open-help"
              onClick={() => setIsHelpModalOpen(true)}
              className="text-teal-700 hover:text-teal-900 font-semibold hover:underline"
            >
              Manual & Ajuda do Fiscal
            </button>
          </div>

          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <span>Desenvolvido por <strong>Herverton S. Moreira</strong></span>
            <span className="text-slate-300">•</span>
            <a
              href="tel:+5583996067600"
              className="text-teal-700 hover:text-teal-800 font-semibold hover:underline"
              title="Ligar ou enviar mensagem para Herverton S. Moreira"
            >
              (83)99606.7600
            </a>
          </div>
        </div>
      </footer>

      {/* Event Form Modal */}
      <EventFormModal
        isOpen={isEventModalOpen}
        eventToEdit={eventToEdit}
        onClose={() => {
          setIsEventModalOpen(false);
          setEventToEdit(null);
        }}
        onSave={handleSaveEvent}
      />

      {/* Google Sheets / Drive & Backup Modal */}
      <GoogleDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        onDataRestored={() => setSelectedEventId(null)}
      />

      {/* Help & System Manual Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onOpenNewEvent={() => {
          setEventToEdit(null);
          setIsEventModalOpen(true);
        }}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomBar
        onGoHome={() => setSelectedEventId(null)}
        onNewEvent={() => {
          setEventToEdit(null);
          setIsEventModalOpen(true);
        }}
        onOpenDriveConfig={() => setIsDriveModalOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        isHome={!selectedEventId}
      />
    </div>
  );
};

export default App;
