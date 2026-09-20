/**
 * MÓDULO DE ARMAZENAMENTO INDEXEDDB DE ALTA CAPACIDADE
 * Locar Guindastes e Transportes Intermodais (Filial Betim / MG)
 * 
 * Elimina o limite crítico de 5MB do localStorage, permitindo armazenar centenas de laudos
 * com evidências fotográficas em alta resolução e assinaturas periciais no pátio offline.
 */

const DB_NAME = 'locar_inspecoes_betim_v1';
const DB_VERSION = 1;
const STORE_NAME = 'inspections';

export class IndexedDBStorage {
  constructor() {
    this.db = null;
    this._initPromise = null;
  }

  /**
   * Inicializa o banco IndexedDB
   * @returns {Promise<IDBDatabase>}
   */
  async init() {
    if (this.db) return this.db;
    if (this._initPromise) return this._initPromise;

    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('[IndexedDB] API não suportada neste ambiente. Fallback para LocalStorage.');
      return null;
    }

    this._initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('equipmentId', 'equipmentId', { unique: false });
          store.createIndex('equipmentTag', 'equipmentTag', { unique: false });
          store.createIndex('startedAt', 'startedAt', { unique: false });
          store.createIndex('finalStatus', 'finalStatus', { unique: false });
          console.log('[IndexedDB] Object store e índices criados com sucesso.');
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('[IndexedDB] Banco de laudos conectado com sucesso.');
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.warn('[IndexedDB] Falha ao abrir banco de dados:', event.target.error);
        resolve(null); // Resolve null para permitir fallback gracioso sem quebrar o app
      };
    });

    return this._initPromise;
  }

  /**
   * Salva ou atualiza uma inspeção com fotos completas
   * @param {object} inspection 
   * @returns {Promise<boolean>}
   */
  async saveInspection(inspection) {
    if (!inspection || !inspection.id) return false;
    try {
      const db = await this.init();
      if (!db) return false;

      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(inspection);

        req.onsuccess = () => resolve(true);
        req.onerror = (e) => {
          console.warn('[IndexedDB] Erro ao salvar laudo:', e.target.error);
          resolve(false);
        };
      });
    } catch (err) {
      console.warn('[IndexedDB] Exceção ao gravar laudo:', err);
      return false;
    }
  }

  /**
   * Retorna uma inspeção específica por ID
   * @param {string} id 
   * @returns {Promise<object|null>}
   */
  async getInspectionById(id) {
    try {
      const db = await this.init();
      if (!db) return null;

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);

        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (err) {
      return null;
    }
  }

  /**
   * Retorna todas as inspeções salvas ordenadas por data
   * @returns {Promise<Array>}
   */
  async getAllInspections() {
    try {
      const db = await this.init();
      if (!db) return [];

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          const list = req.result || [];
          // Ordena do mais recente para o mais antigo
          list.sort((a, b) => new Date(b.startedAt || 0) - new Date(a.startedAt || 0));
          resolve(list);
        };
        req.onerror = () => resolve([]);
      });
    } catch (err) {
      return [];
    }
  }

  /**
   * Conta a quantidade total de laudos persistidos
   * @returns {Promise<number>}
   */
  async count() {
    try {
      const db = await this.init();
      if (!db) return 0;

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.count();

        req.onsuccess = () => resolve(req.result || 0);
        req.onerror = () => resolve(0);
      });
    } catch (err) {
      return 0;
    }
  }
}

export const idbStorage = new IndexedDBStorage();
