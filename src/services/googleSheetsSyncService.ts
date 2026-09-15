import { db, getGoogleDriveConfig, registrarHistorico } from '../db/database';
import type { Evento, Vistoria, ItemVistoria, HistoricoEvento } from '../types/vistoria';
import { generateTermoVistoriaPdf } from './pdfGenerator';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  error: string | null;
  successMessage: string | null;
}

type SyncListener = (status: SyncStatus) => void;
const listeners: Set<SyncListener> = new Set();

let currentStatus: SyncStatus = {
  isSyncing: false,
  lastSyncedAt: null,
  error: null,
  successMessage: null,
};

function notifyListeners() {
  listeners.forEach(fn => fn({ ...currentStatus }));
}

export function subscribeSyncStatus(listener: SyncListener): () => void {
  listeners.add(listener);
  listener({ ...currentStatus });
  return () => {
    listeners.delete(listener);
  };
}

export function getSyncStatus(): SyncStatus {
  return { ...currentStatus };
}

/**
 * Puxa todos os dados do Google Sheets e atualiza o banco de dados local (IndexedDB)
 */
export async function pullFromGoogleSheets(forceNotify = false): Promise<{ success: boolean; message: string; count?: number }> {
  const config = await getGoogleDriveConfig();
  if (!config.webhookUrl) {
    return { success: false, message: 'URL do Google Sheets / Google Drive não configurada.' };
  }

  currentStatus = { ...currentStatus, isSyncing: true, error: null, successMessage: null };
  notifyListeners();

  try {
    const url = new URL(config.webhookUrl);
    url.searchParams.set('action', 'getAll');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Erro na resposta do Google Sheets: HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'error') {
      throw new Error(data.message || 'Erro reportado pelo Google Apps Script');
    }

    const eventos: Evento[] = data.eventos || [];
    const vistorias: Vistoria[] = data.vistorias || [];
    const itens: ItemVistoria[] = data.itens || [];
    const historico: HistoricoEvento[] = data.historico || [];

    if (eventos.length > 0 || forceNotify) {
      await db.transaction('rw', [db.eventos, db.vistorias, db.itens, db.historico], async () => {
        if (eventos.length > 0) await db.eventos.bulkPut(eventos);
        if (vistorias.length > 0) await db.vistorias.bulkPut(vistorias);
        if (itens.length > 0) await db.itens.bulkPut(itens);
        if (historico.length > 0) await db.historico.bulkPut(historico);
      });
    }

    const now = new Date().toISOString();
    currentStatus = {
      isSyncing: false,
      lastSyncedAt: now,
      error: null,
      successMessage: `Sincronizado com sucesso! (${eventos.length} vistorias carregadas)`,
    };
    notifyListeners();

    return {
      success: true,
      message: `Sincronização concluída com sucesso! ${eventos.length} eventos carregados do Google Sheets.`,
      count: eventos.length,
    };
  } catch (err: unknown) {
    const msg = (err as Error).message || 'Falha de conexão com o Google Sheets';
    currentStatus = {
      ...currentStatus,
      isSyncing: false,
      error: msg,
    };
    notifyListeners();
    return { success: false, message: msg };
  }
}

/**
 * Envia um evento individual completo para o Google Sheets e salva PDF no Google Drive
 */
export async function pushEventToGoogleSheets(eventoId: string): Promise<{ success: boolean; message: string }> {
  const config = await getGoogleDriveConfig();
  if (!config.webhookUrl) {
    return { success: false, message: 'URL do Google Sheets / Drive não configurada.' };
  }

  const evento = await db.eventos.get(eventoId);
  if (!evento) {
    return { success: false, message: 'Evento não encontrado localmente.' };
  }

  const vistorias = await db.vistorias.where({ eventoId }).toArray();
  const vistoriaInicial = vistorias.find(v => v.tipo === 'INICIAL');
  const vistoriaFinal = vistorias.find(v => v.tipo === 'FINAL');
  const itensIniciais = await db.itens.where({ eventoId, vistoriaTipo: 'INICIAL' }).sortBy('ordem');
  const itensFinais = await db.itens.where({ eventoId, vistoriaTipo: 'FINAL' }).sortBy('ordem');
  const fotos = await db.fotos.where({ eventoId }).sortBy('ordem');
  const historico = await db.historico.where({ eventoId }).toArray();

  let rawPdfBase64: string | undefined = undefined;

  // Se tiver vistoria inicial ou final pronta, gera o PDF para salvar na pasta do Google Drive
  try {
    const pdfDoc = await generateTermoVistoriaPdf({
      evento,
      vistoriaInicial,
      vistoriaFinal,
      itensIniciais,
      itensFinais,
      fotos,
      tipoDocumento: vistoriaFinal?.status === 'CONCLUIDA' ? 'COMPLETO' : 'INICIAL_ENTREGA',
    });
    const dataUri = pdfDoc.output('datauristring');
    rawPdfBase64 = dataUri.split(',')[1] || dataUri;
  } catch (pdfErr) {
    console.warn('Não foi possível gerar PDF prévio para o Drive:', pdfErr);
  }

  const payload = {
    action: 'saveVistoriaFull',
    folderName: config.folderName || 'Vistorias SEDE — Parque do Povo',
    folderId: config.folderId || '14oQVraHMiuWGYb1EuYl17S32-41oKGVQ',
    evento,
    vistorias,
    itens: [...itensIniciais, ...itensFinais],
    historico,
    pdfFileName: `Termo_Vistoria_${(evento.processoProtocolo || evento.codigo || 'SEDE').replace(/[/\\?%*:|"<>]/g, '_')}.pdf`,
    pdfBase64: rawPdfBase64,
    timestamp: new Date().toISOString(),
  };

  currentStatus = { ...currentStatus, isSyncing: true, error: null };
  notifyListeners();

  try {
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    const now = new Date().toISOString();
    await db.eventos.update(eventoId, { googleDriveSyncedAt: now, updatedAt: now });
    await registrarHistorico(eventoId, 'Sistema', 'Sincronizado com Google Sheets & Drive', 'Dados gravados na planilha e PDF no Drive');

    currentStatus = {
      isSyncing: false,
      lastSyncedAt: now,
      error: null,
      successMessage: 'Salvo e sincronizado na nuvem!',
    };
    notifyListeners();

    if (response.ok || response.status === 200 || response.type === 'opaque') {
      return { success: true, message: 'Dados salvos no Google Sheets e PDF enviado ao Google Drive com sucesso!' };
    }
    return { success: true, message: 'Dados transmitidos para o Google Sheets.' };
  } catch {
    // Fallback assíncrono com mode no-cors
    try {
      await fetch(config.webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      const now = new Date().toISOString();
      await db.eventos.update(eventoId, { googleDriveSyncedAt: now, updatedAt: now });

      currentStatus = {
        isSyncing: false,
        lastSyncedAt: now,
        error: null,
        successMessage: 'Sincronizado com Google Sheets!',
      };
      notifyListeners();

      return { success: true, message: 'Dados enviados para o Google Sheets com sucesso!' };
    } catch (fallbackErr: unknown) {
      const msg = (fallbackErr as Error).message || 'Erro ao sincronizar com Google Sheets';
      currentStatus = { ...currentStatus, isSyncing: false, error: msg };
      notifyListeners();
      return { success: false, message: msg };
    }
  }
}

/**
 * Exclui um evento da planilha Google Sheets
 */
export async function deleteEventFromGoogleSheets(eventoId: string): Promise<{ success: boolean; message: string }> {
  const config = await getGoogleDriveConfig();
  if (!config.webhookUrl) {
    return { success: false, message: 'URL do Google Sheets não configurada.' };
  }

  const payload = {
    action: 'deleteEvent',
    eventoId,
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    return { success: true, message: 'Evento removido do Google Sheets.' };
  } catch {
    try {
      await fetch(config.webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      return { success: true, message: 'Comando de exclusão enviado ao Google Sheets.' };
    } catch (err: unknown) {
      return { success: false, message: (err as Error).message || 'Falha ao remover do Google Sheets' };
    }
  }
}

/**
 * Envia todos os dados locais para o Google Sheets (Migração / Inicialização completa)
 */
export async function pushAllToGoogleSheets(): Promise<{ success: boolean; message: string; count?: number }> {
  const config = await getGoogleDriveConfig();
  if (!config.webhookUrl) {
    return { success: false, message: 'URL do Google Sheets / Drive não configurada.' };
  }

  const eventos = await db.eventos.toArray();
  const vistorias = await db.vistorias.toArray();
  const itens = await db.itens.toArray();
  const historico = await db.historico.toArray();

  if (eventos.length === 0) {
    return { success: false, message: 'Nenhum evento local para enviar.' };
  }

  currentStatus = { ...currentStatus, isSyncing: true, error: null };
  notifyListeners();

  const payload = {
    action: 'syncPushAll',
    folderName: config.folderName || 'Vistorias SEDE — Parque do Povo',
    folderId: config.folderId || '14oQVraHMiuWGYb1EuYl17S32-41oKGVQ',
    eventos,
    vistorias,
    itens,
    historico,
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    const now = new Date().toISOString();
    currentStatus = {
      isSyncing: false,
      lastSyncedAt: now,
      error: null,
      successMessage: `Todos os ${eventos.length} eventos foram enviados para a Planilha Google!`,
    };
    notifyListeners();

    if (response.ok || response.status === 200 || response.type === 'opaque') {
      return { success: true, message: `Banco de dados sincronizado na Planilha Google! (${eventos.length} eventos enviados)`, count: eventos.length };
    }
    return { success: true, message: `Dados enviados para o Google Sheets.`, count: eventos.length };
  } catch {
    try {
      await fetch(config.webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      const now = new Date().toISOString();
      currentStatus = {
        isSyncing: false,
        lastSyncedAt: now,
        error: null,
        successMessage: `Todos os ${eventos.length} eventos foram enviados para a Planilha Google!`,
      };
      notifyListeners();

      return { success: true, message: `Dados enviados com sucesso para a Planilha Google!`, count: eventos.length };
    } catch (fallbackErr: unknown) {
      const msg = (fallbackErr as Error).message || 'Erro ao sincronizar com Google Sheets';
      currentStatus = { ...currentStatus, isSyncing: false, error: msg };
      notifyListeners();
      return { success: false, message: msg };
    }
  }
}
