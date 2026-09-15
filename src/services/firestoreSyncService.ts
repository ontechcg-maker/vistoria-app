import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { firestore } from '../db/firebase';
import { db } from '../db/database';
import type { Evento, Vistoria, ItemVistoria, FotoVistoria, HistoricoEvento } from '../types/vistoria';

export interface FirebaseSyncState {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  cloudEventsCount: number;
  error: string | null;
}

let syncState: FirebaseSyncState = {
  isConnected: true,
  isSyncing: false,
  lastSyncTime: null,
  cloudEventsCount: 0,
  error: null,
};

const listeners = new Set<(state: FirebaseSyncState) => void>();

export function subscribeFirebaseSync(callback: (state: FirebaseSyncState) => void): () => void {
  listeners.add(callback);
  callback({ ...syncState });
  return () => {
    listeners.delete(callback);
  };
}

function updateSyncState(patch: Partial<FirebaseSyncState>) {
  syncState = { ...syncState, ...patch };
  listeners.forEach((cb) => cb({ ...syncState }));
}

// Flag to prevent loop when updating Dexie from Firestore snapshot
let isReplicatingFromFirestore = false;

/**
 * Upload single Evento to Firestore
 */
export async function pushEventoToFirestore(evento: Evento): Promise<void> {
  try {
    const docRef = doc(firestore, 'eventos', evento.id);
    await setDoc(docRef, evento, { merge: true });
    updateSyncState({ lastSyncTime: new Date().toISOString(), error: null });
  } catch (err) {
    console.warn('Erro ao salvar evento no Firestore:', err);
    updateSyncState({ error: 'Erro de conexão com Firestore' });
  }
}

/**
 * Delete single Evento and related docs from Firestore
 */
export async function deleteEventoFromFirestore(eventoId: string): Promise<void> {
  try {
    const batch = writeBatch(firestore);

    // Delete evento
    batch.delete(doc(firestore, 'eventos', eventoId));

    // Get and delete vistorias
    const vistorias = await db.vistorias.where({ eventoId }).toArray();
    vistorias.forEach((v) => batch.delete(doc(firestore, 'vistorias', v.id)));

    // Get and delete itens
    const itens = await db.itens.where({ eventoId }).toArray();
    itens.forEach((i) => batch.delete(doc(firestore, 'itens', i.id)));

    // Get and delete fotos
    const fotos = await db.fotos.where({ eventoId }).toArray();
    fotos.forEach((f) => batch.delete(doc(firestore, 'fotos', f.id)));

    // Get and delete historico
    const hist = await db.historico.where({ eventoId }).toArray();
    hist.forEach((h) => batch.delete(doc(firestore, 'historico', h.id)));

    await batch.commit();
    updateSyncState({ lastSyncTime: new Date().toISOString(), error: null });
  } catch (err) {
    console.warn('Erro ao excluir evento do Firestore:', err);
  }
}

/**
 * Upload single Vistoria to Firestore
 */
export async function pushVistoriaToFirestore(vistoria: Vistoria): Promise<void> {
  try {
    const docRef = doc(firestore, 'vistorias', vistoria.id);
    await setDoc(docRef, vistoria, { merge: true });
  } catch (err) {
    console.warn('Erro ao salvar vistoria no Firestore:', err);
  }
}

/**
 * Upload multiple checklist itens to Firestore
 */
export async function pushItensToFirestore(itens: ItemVistoria[]): Promise<void> {
  if (itens.length === 0) return;
  try {
    // Firestore batch limit is 500
    const chunkSize = 400;
    for (let i = 0; i < itens.length; i += chunkSize) {
      const chunk = itens.slice(i, i + chunkSize);
      const batch = writeBatch(firestore);
      chunk.forEach((item) => {
        batch.set(doc(firestore, 'itens', item.id), item, { merge: true });
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn('Erro ao salvar itens no Firestore:', err);
  }
}

/**
 * Upload single item to Firestore
 */
export async function pushItemToFirestore(item: ItemVistoria): Promise<void> {
  try {
    await setDoc(doc(firestore, 'itens', item.id), item, { merge: true });
  } catch (err) {
    console.warn('Erro ao salvar item no Firestore:', err);
  }
}

/**
 * Delete item from Firestore
 */
export async function deleteItemFromFirestore(itemId: string): Promise<void> {
  try {
    await deleteDoc(doc(firestore, 'itens', itemId));
  } catch (err) {
    console.warn('Erro ao deletar item no Firestore:', err);
  }
}

/**
 * Upload Foto to Firestore
 */
export async function pushFotoToFirestore(foto: FotoVistoria): Promise<void> {
  try {
    await setDoc(doc(firestore, 'fotos', foto.id), foto, { merge: true });
  } catch (err) {
    console.warn('Erro ao salvar foto no Firestore:', err);
  }
}

/**
 * Delete Foto from Firestore
 */
export async function deleteFotoFromFirestore(fotoId: string): Promise<void> {
  try {
    await deleteDoc(doc(firestore, 'fotos', fotoId));
  } catch (err) {
    console.warn('Erro ao deletar foto no Firestore:', err);
  }
}

/**
 * Upload Historico to Firestore
 */
export async function pushHistoricoToFirestore(hist: HistoricoEvento): Promise<void> {
  try {
    await setDoc(doc(firestore, 'historico', hist.id), hist, { merge: true });
  } catch (err) {
    console.warn('Erro ao salvar histórico no Firestore:', err);
  }
}

/**
 * Migrate all local Dexie data to Firestore if it does not exist yet
 */
export async function migrateLocalDataToFirestore(): Promise<{ migratedCount: number }> {
  updateSyncState({ isSyncing: true });
  try {
    const localEventos = await db.eventos.toArray();
    let migratedCount = 0;

    for (const evento of localEventos) {
      await setDoc(doc(firestore, 'eventos', evento.id), evento, { merge: true });

      const vistorias = await db.vistorias.where({ eventoId: evento.id }).toArray();
      for (const v of vistorias) {
        await setDoc(doc(firestore, 'vistorias', v.id), v, { merge: true });
      }

      const itens = await db.itens.where({ eventoId: evento.id }).toArray();
      if (itens.length > 0) {
        await pushItensToFirestore(itens);
      }

      const fotos = await db.fotos.where({ eventoId: evento.id }).toArray();
      for (const f of fotos) {
        await setDoc(doc(firestore, 'fotos', f.id), f, { merge: true });
      }

      const hist = await db.historico.where({ eventoId: evento.id }).toArray();
      for (const h of hist) {
        await setDoc(doc(firestore, 'historico', h.id), h, { merge: true });
      }

      migratedCount++;
    }

    updateSyncState({
      isSyncing: false,
      lastSyncTime: new Date().toISOString(),
      error: null,
    });

    return { migratedCount };
  } catch (err) {
    console.error('Erro na migração para Firestore:', err);
    updateSyncState({
      isSyncing: false,
      error: 'Erro durante sincronização com Firestore',
    });
    return { migratedCount: 0 };
  }
}

/**
 * Initialize real-time synchronization listeners from Firestore to local Dexie
 */
export function initFirestoreRealtimeSync(): () => void {
  const unsubscribers: (() => void)[] = [];

  try {
    // 1. Sync Eventos
    const unsubEventos = onSnapshot(
      collection(firestore, 'eventos'),
      async (snapshot) => {
        isReplicatingFromFirestore = true;
        try {
          const docsToAddOrUpdate: Evento[] = [];
          const docsToDelete: string[] = [];

          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data() as Evento;
            if (change.type === 'added' || change.type === 'modified') {
              docsToAddOrUpdate.push(data);
            } else if (change.type === 'removed') {
              docsToDelete.push(change.doc.id);
            }
          });

          if (docsToAddOrUpdate.length > 0) {
            await db.eventos.bulkPut(docsToAddOrUpdate);
          }
          if (docsToDelete.length > 0) {
            await db.eventos.bulkDelete(docsToDelete);
          }

          updateSyncState({
            cloudEventsCount: snapshot.size,
            isConnected: true,
            lastSyncTime: new Date().toISOString(),
          });

          // If local has events that cloud doesn't have yet, trigger migration
          if (snapshot.size === 0) {
            const localCount = await db.eventos.count();
            if (localCount > 0) {
              migrateLocalDataToFirestore().catch(() => {});
            }
          }
        } catch (err) {
          console.warn('Erro ao replicar eventos do Firestore:', err);
        } finally {
          isReplicatingFromFirestore = false;
        }
      },
      (err) => {
        console.warn('Falha na conexão do Firestore (Eventos):', err);
        updateSyncState({ isConnected: false, error: 'Modo Offline (Cache Local Ativo)' });
      }
    );
    unsubscribers.push(unsubEventos);

    // 2. Sync Vistorias
    const unsubVistorias = onSnapshot(
      collection(firestore, 'vistorias'),
      async (snapshot) => {
        isReplicatingFromFirestore = true;
        try {
          const toUpdate: Vistoria[] = [];
          const toDelete: string[] = [];

          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data() as Vistoria;
            if (change.type === 'added' || change.type === 'modified') {
              toUpdate.push(data);
            } else if (change.type === 'removed') {
              toDelete.push(change.doc.id);
            }
          });

          if (toUpdate.length > 0) await db.vistorias.bulkPut(toUpdate);
          if (toDelete.length > 0) await db.vistorias.bulkDelete(toDelete);
        } catch (err) {
          console.warn('Erro ao replicar vistorias:', err);
        } finally {
          isReplicatingFromFirestore = false;
        }
      },
      () => {}
    );
    unsubscribers.push(unsubVistorias);

    // 3. Sync Itens
    const unsubItens = onSnapshot(
      collection(firestore, 'itens'),
      async (snapshot) => {
        isReplicatingFromFirestore = true;
        try {
          const toUpdate: ItemVistoria[] = [];
          const toDelete: string[] = [];

          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data() as ItemVistoria;
            if (change.type === 'added' || change.type === 'modified') {
              toUpdate.push(data);
            } else if (change.type === 'removed') {
              toDelete.push(change.doc.id);
            }
          });

          if (toUpdate.length > 0) await db.itens.bulkPut(toUpdate);
          if (toDelete.length > 0) await db.itens.bulkDelete(toDelete);
        } catch (err) {
          console.warn('Erro ao replicar itens:', err);
        } finally {
          isReplicatingFromFirestore = false;
        }
      },
      () => {}
    );
    unsubscribers.push(unsubItens);

    // 4. Sync Fotos
    const unsubFotos = onSnapshot(
      collection(firestore, 'fotos'),
      async (snapshot) => {
        isReplicatingFromFirestore = true;
        try {
          const toUpdate: FotoVistoria[] = [];
          const toDelete: string[] = [];

          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data() as FotoVistoria;
            if (change.type === 'added' || change.type === 'modified') {
              toUpdate.push(data);
            } else if (change.type === 'removed') {
              toDelete.push(change.doc.id);
            }
          });

          if (toUpdate.length > 0) await db.fotos.bulkPut(toUpdate);
          if (toDelete.length > 0) await db.fotos.bulkDelete(toDelete);
        } catch (err) {
          console.warn('Erro ao replicar fotos:', err);
        } finally {
          isReplicatingFromFirestore = false;
        }
      },
      () => {}
    );
    unsubscribers.push(unsubFotos);

    // 5. Sync Histórico
    const unsubHistorico = onSnapshot(
      collection(firestore, 'historico'),
      async (snapshot) => {
        isReplicatingFromFirestore = true;
        try {
          const toUpdate: HistoricoEvento[] = [];
          const toDelete: string[] = [];

          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data() as HistoricoEvento;
            if (change.type === 'added' || change.type === 'modified') {
              toUpdate.push(data);
            } else if (change.type === 'removed') {
              toDelete.push(change.doc.id);
            }
          });

          if (toUpdate.length > 0) await db.historico.bulkPut(toUpdate);
          if (toDelete.length > 0) await db.historico.bulkDelete(toDelete);
        } catch (err) {
          console.warn('Erro ao replicar histórico:', err);
        } finally {
          isReplicatingFromFirestore = false;
        }
      },
      () => {}
    );
    unsubscribers.push(unsubHistorico);
  } catch (err) {
    console.warn('Erro ao iniciar ouvintes do Firestore:', err);
    updateSyncState({ isConnected: false });
  }

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}

export function isReplicating(): boolean {
  return isReplicatingFromFirestore;
}
