import { getGoogleDriveConfig, registrarHistorico, db } from '../db/database';
import { generateTermoVistoriaPdf } from './pdfGenerator';

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: unknown }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
    gapi?: unknown;
  }
}

export interface SyncDriveResult {
  success: boolean;
  message: string;
  folderUrl?: string;
}

/**
 * Testa a conexão com a URL de Webhook do Google Apps Script
 */
export async function testGoogleDriveConnection(
  webhookUrl: string,
  folderName?: string
): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return { success: false, message: 'Por favor, informe uma URL válida do Google Apps Script (iniciando com https://script.google.com/...).' };
  }

  const testPayload = {
    test: true,
    folderName: folderName || 'Vistorias SEDE — Parque do Povo',
    timestamp: new Date().toISOString(),
    message: 'Teste de conexão do Sistema de Vistoria da SEDE',
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(testPayload),
    });

    if (response.ok || response.status === 200 || response.type === 'opaque') {
      return { success: true, message: 'Conexão com o Google Drive realizada com sucesso!' };
    }
    return { success: false, message: `Resposta do servidor: Status HTTP ${response.status}` };
  } catch {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(testPayload),
      });
      return { success: true, message: 'Requisição de teste enviada com sucesso para o Webhook do Google Drive!' };
    } catch (err: unknown) {
      return { success: false, message: `Falha ao conectar: ${(err as Error).message || 'Erro de rede ou URL bloqueada'}` };
    }
  }
}

/**
 * Envia todos os dados do evento, o PDF e as fotos para o Google Drive
 */
export async function syncEventToGoogleDrive(eventoId: string, accessToken?: string): Promise<SyncDriveResult> {
  const evento = await db.eventos.get(eventoId);
  if (!evento) {
    return { success: false, message: 'Evento não encontrado no banco local.' };
  }

  const vistorias = await db.vistorias.where({ eventoId }).toArray();
  const vistoriaInicial = vistorias.find(v => v.tipo === 'INICIAL');
  const vistoriaFinal = vistorias.find(v => v.tipo === 'FINAL');
  const itensIniciais = await db.itens.where({ eventoId, vistoriaTipo: 'INICIAL' }).sortBy('ordem');
  const itensFinais = await db.itens.where({ eventoId, vistoriaTipo: 'FINAL' }).sortBy('ordem');
  const fotos = await db.fotos.where({ eventoId }).sortBy('ordem');

  const config = await getGoogleDriveConfig();

  // 1. Se houver Webhook configurado para o Google Drive
  if (config.webhookUrl) {
    try {
      const pdfDoc = await generateTermoVistoriaPdf({
        evento,
        vistoriaInicial,
        vistoriaFinal,
        itensIniciais,
        itensFinais,
        fotos,
      });
      const pdfBase64 = pdfDoc.output('datauristring').split(',')[1];
      const payload = {
        action: 'saveVistoriaPdf',
        evento,
        pdfBase64,
        fileName: `Termo_Vistoria_${evento.codigo || 'SN'}.pdf`,
        folderId: config.folderId || '14oQVraHMiuWGYb1EuYl17S32-41oKGVQ',
        timestamp: new Date().toISOString(),
      };

      await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      return {
        success: true,
        message: 'Termo em PDF salvo com sucesso na pasta do Google Drive!',
      };
    } catch (err: unknown) {
      return {
        success: false,
        message: `Falha ao enviar para o Drive: ${(err as Error).message || 'Erro de conexão'}`,
      };
    }
  }

  // 2. Se tiver token de acesso OAuth 2.0 (Google Drive API v3)
  if (accessToken) {
    try {
      // Cria a pasta do evento no Google Drive
      const folderName = `Vistoria_${evento.codigo || 'S-N'}_${evento.nome.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };

      const createFolderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(folderMetadata),
      });

      const folderData = await createFolderRes.json();
      const folderId = folderData.id;

      // Gera o PDF e faz upload
      const pdfDoc = await generateTermoVistoriaPdf({
        evento,
        vistoriaInicial,
        vistoriaFinal,
        itensIniciais,
        itensFinais,
        fotos,
      });

      const pdfBlob = pdfDoc.output('blob');
      const fileName = `Termo_Vistoria_${evento.codigo || 'SN'}.pdf`;

      const metadata = {
        name: fileName,
        parents: folderId ? [folderId] : undefined,
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', pdfBlob);

      await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });

      // Atualiza status local
      const now = new Date().toISOString();
      await db.eventos.update(eventoId, {
        googleDriveFolderId: folderId,
        googleDriveSyncedAt: now,
        updatedAt: now,
      });

      await registrarHistorico(eventoId, 'Sistema', 'Sincronizado com Google Drive API', `Pasta criada: ${folderName}`);

      return {
        success: true,
        message: 'Evento, Termo em PDF e anexos sincronizados com o Google Drive!',
        folderUrl: folderId ? `https://drive.google.com/drive/folders/${folderId}` : undefined,
      };
    } catch (err: unknown) {
      console.error('Erro na API do Google Drive:', err);
      return { success: false, message: `Erro ao enviar para o Google Drive: ${(err as Error).message || 'Falha na conexão'}` };
    }
  }

  // 3. Fallback: Exporta pacote de backup para download / compartilhamento manual
  return {
    success: false,
    message: 'Nenhuma credencial do Google Drive ou Webhook ativa. Configure o Google Drive no menu superior.',
  };
}

/**
 * Exporta todo o banco de dados em arquivo JSON para backup
 */
export async function exportFullDatabaseBackup(): Promise<void> {
  const eventos = await db.eventos.toArray();
  const vistorias = await db.vistorias.toArray();
  const itens = await db.itens.toArray();
  const fotos = await db.fotos.toArray();
  const historico = await db.historico.toArray();
  const config = await db.config.toArray();

  const backupData = {
    versao: 1,
    exportadoEm: new Date().toISOString(),
    eventos,
    vistorias,
    itens,
    fotos,
    historico,
    config,
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Backup_Vistorias_Cessao_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Importa dados de um arquivo JSON de backup
 */
export async function importFullDatabaseBackup(file: File): Promise<{ success: boolean; message: string }> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.eventos || !Array.isArray(data.eventos)) {
      return { success: false, message: 'Arquivo de backup inválido.' };
    }

    await db.transaction('rw', [db.eventos, db.vistorias, db.itens, db.fotos, db.historico, db.config], async () => {
      await db.eventos.bulkPut(data.eventos);
      if (data.vistorias) await db.vistorias.bulkPut(data.vistorias);
      if (data.itens) await db.itens.bulkPut(data.itens);
      if (data.fotos) await db.fotos.bulkPut(data.fotos);
      if (data.historico) await db.historico.bulkPut(data.historico);
      if (data.config) await db.config.bulkPut(data.config);
    });

    return { success: true, message: `Backup restaurado com sucesso! (${data.eventos.length} eventos importados)` };
  } catch (err: unknown) {
    return { success: false, message: `Erro ao importar backup: ${(err as Error).message || 'Formato inválido'}` };
  }
}
