import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, registrarHistorico } from './db/database';
import type { Evento } from './types/vistoria';
import { Header } from './components/layout/Header';
import { EventList } from './components/events/EventList';
import { EventDetail } from './components/events/EventDetail';
import { EventFormModal } from './components/events/EventFormModal';
import { GoogleDriveModal } from './components/drive/GoogleDriveModal';
import { getCustomInspectionItems } from './config/defaultInspectionItems';
import { pullFromGoogleSheets, pushEventToGoogleSheets, deleteEventFromGoogleSheets } from './services/googleSheetsSyncService';

export const App: React.FC = () => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Evento | null>(null);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  // Live Query reativa ao IndexedDB
  const eventos = useLiveQuery(() => db.eventos.reverse().sortBy('createdAt'), []) || [];

  // Auto-sincronização na inicialização e quando a aba ganha foco
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
        observacoesGerais: eventData.observacoesGerais || '',
        status: 'VISTORIA_INICIAL_PENDENTE',
        createdAt: now,
        updatedAt: now,
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

      await db.transaction('rw', [db.eventos, db.itens, db.historico], async () => {
        await db.eventos.add(novoEvento);
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
    <div className="min-h-screen flex flex-col bg-slate-100/60 selection:bg-teal-500 selection:text-white">
      {/* Top Header */}
      <Header
        onNewEvent={() => {
          setEventToEdit(null);
          setIsEventModalOpen(true);
        }}
        onOpenDriveConfig={() => setIsDriveModalOpen(true)}
        onGoHome={() => setSelectedEventId(null)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong>Vistoria de Cessão de Espaço</strong> • Sistema de Controle Pré e Pós-Evento
          </span>
          <span className="text-slate-400">
            Base Centralizada (Google Sheets & Drive) com Cache Local Resiliente (IndexedDB)
          </span>
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
    </div>
  );
};

export default App;
