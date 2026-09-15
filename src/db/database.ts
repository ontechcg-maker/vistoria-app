import Dexie, { type Table } from 'dexie';
import type { Evento, Vistoria, ItemVistoria, FotoVistoria, HistoricoEvento, GoogleDriveConfig } from '../types/vistoria';
import {
  isReplicating,
  pushEventoToFirestore,
  deleteEventoFromFirestore,
  pushVistoriaToFirestore,
  pushItemToFirestore,
  deleteItemFromFirestore,
  pushFotoToFirestore,
  deleteFotoFromFirestore,
  pushHistoricoToFirestore,
} from '../services/firestoreSyncService';

export class VistoriaDatabase extends Dexie {
  eventos!: Table<Evento, string>;
  vistorias!: Table<Vistoria, string>;
  itens!: Table<ItemVistoria, string>;
  fotos!: Table<FotoVistoria, string>;
  historico!: Table<HistoricoEvento, string>;
  config!: Table<{ key: string; value: unknown }, string>;

  constructor() {
    super('VistoriaCessaoEspacoDB');

    this.version(1).stores({
      eventos: 'id, codigo, nome, contratante, status, dataInicio, createdAt, updatedAt',
      vistorias: 'id, eventoId, tipo, status, [eventoId+tipo]',
      itens: 'id, eventoId, vistoriaTipo, ambiente, ordem, situacao, [eventoId+vistoriaTipo]',
      fotos: 'id, eventoId, vistoriaTipo, itemId, ambiente, ordem, [eventoId+vistoriaTipo]',
      historico: 'id, eventoId, dataHora',
      config: 'key',
    });
  }
}

export const db = new VistoriaDatabase();

// Registra hooks automáticos para espelhar todas as mutações no Firebase Firestore
db.eventos.hook('creating', function (primKey, obj) {
  if (!isReplicating()) {
    const item = { ...obj, id: obj.id || String(primKey) };
    setTimeout(() => pushEventoToFirestore(item), 0);
  }
});

db.eventos.hook('updating', function (modifications, _primKey, obj) {
  if (!isReplicating()) {
    const updated = { ...obj, ...modifications };
    setTimeout(() => pushEventoToFirestore(updated as Evento), 0);
  }
});

db.eventos.hook('deleting', function (primKey) {
  if (!isReplicating()) {
    const id = String(primKey);
    setTimeout(() => deleteEventoFromFirestore(id), 0);
  }
});

db.vistorias.hook('creating', function (primKey, obj) {
  if (!isReplicating()) {
    const item = { ...obj, id: obj.id || String(primKey) };
    setTimeout(() => pushVistoriaToFirestore(item), 0);
  }
});

db.vistorias.hook('updating', function (modifications, _primKey, obj) {
  if (!isReplicating()) {
    const updated = { ...obj, ...modifications };
    setTimeout(() => pushVistoriaToFirestore(updated as Vistoria), 0);
  }
});

db.itens.hook('creating', function (primKey, obj) {
  if (!isReplicating()) {
    const item = { ...obj, id: obj.id || String(primKey) };
    setTimeout(() => pushItemToFirestore(item), 0);
  }
});

db.itens.hook('updating', function (modifications, _primKey, obj) {
  if (!isReplicating()) {
    const updated = { ...obj, ...modifications };
    setTimeout(() => pushItemToFirestore(updated as ItemVistoria), 0);
  }
});

db.itens.hook('deleting', function (primKey) {
  if (!isReplicating()) {
    const id = String(primKey);
    setTimeout(() => deleteItemFromFirestore(id), 0);
  }
});

db.fotos.hook('creating', function (primKey, obj) {
  if (!isReplicating()) {
    const item = { ...obj, id: obj.id || String(primKey) };
    setTimeout(() => pushFotoToFirestore(item), 0);
  }
});

db.fotos.hook('updating', function (modifications, _primKey, obj) {
  if (!isReplicating()) {
    const updated = { ...obj, ...modifications };
    setTimeout(() => pushFotoToFirestore(updated as FotoVistoria), 0);
  }
});

db.fotos.hook('deleting', function (primKey) {
  if (!isReplicating()) {
    const id = String(primKey);
    setTimeout(() => deleteFotoFromFirestore(id), 0);
  }
});

db.historico.hook('creating', function (primKey, obj) {
  if (!isReplicating()) {
    const item = { ...obj, id: obj.id || String(primKey) };
    setTimeout(() => pushHistoricoToFirestore(item), 0);
  }
});

// Helpers para logging e histórico
export async function registrarHistorico(
  eventoId: string,
  responsavel: string,
  acao: string,
  detalhes?: string
) {
  try {
    await db.historico.add({
      id: crypto.randomUUID(),
      eventoId,
      dataHora: new Date().toISOString(),
      responsavel: responsavel || 'Equipe de Vistoria',
      acao,
      detalhes,
    });
  } catch (err) {
    console.error('Erro ao registrar histórico:', err);
  }
}

// Configurações do Google Drive
import { GLOBAL_DEFAULT_DRIVE_CONFIG } from '../config/driveConfig';

export async function getGoogleDriveConfig(): Promise<GoogleDriveConfig> {
  try {
    const record = await db.config.get('google_drive');
    if (record && record.value) {
      const val = record.value as GoogleDriveConfig;
      return {
        folderName: val.folderName || GLOBAL_DEFAULT_DRIVE_CONFIG.folderName,
        folderId: val.folderId || GLOBAL_DEFAULT_DRIVE_CONFIG.folderId,
        webhookUrl: val.webhookUrl || GLOBAL_DEFAULT_DRIVE_CONFIG.webhookUrl,
        clientId: val.clientId || GLOBAL_DEFAULT_DRIVE_CONFIG.clientId,
        autoSync: val.autoSync !== undefined ? val.autoSync : GLOBAL_DEFAULT_DRIVE_CONFIG.autoSync,
      };
    }
  } catch (err) {
    console.warn('Erro ao ler config do IndexedDB:', err);
  }

  return { ...GLOBAL_DEFAULT_DRIVE_CONFIG };
}

export async function saveGoogleDriveConfig(config: GoogleDriveConfig): Promise<void> {
  await db.config.put({ key: 'google_drive', value: config });
}
