// IndexedDB wrapper for larger storage capacity
import { StoredWorldCup } from './storage';

class WorldCupDB {
  private dbName = 'WorldCupPlatform';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 월드컵 저장소
        if (!db.objectStoreNames.contains('worldcups')) {
          const store = db.createObjectStore('worldcups', { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('category', 'category', { unique: false });
        }
        
        // 이미지 저장소 (압축된 이미지들)
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'id' });
        }
      };
    });
  }

  async saveWorldCup(worldcup: StoredWorldCup): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['worldcups'], 'readwrite');
      const store = transaction.objectStore('worldcups');
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      
      store.add(worldcup);
    });
  }

  async getAllWorldCups(): Promise<StoredWorldCup[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['worldcups'], 'readonly');
      const store = transaction.objectStore('worldcups');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getWorldCupById(id: string): Promise<StoredWorldCup | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['worldcups'], 'readonly');
      const store = transaction.objectStore('worldcups');
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteWorldCup(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['worldcups'], 'readwrite');
      const store = transaction.objectStore('worldcups');
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      
      store.delete(id);
    });
  }

  async updateWorldCupStats(id: string, updates: Partial<StoredWorldCup>): Promise<void> {
    if (!this.db) await this.init();
    
    const existing = await this.getWorldCupById(id);
    if (!existing) throw new Error('WorldCup not found');
    
    const updated = { ...existing, ...updates };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['worldcups'], 'readwrite');
      const store = transaction.objectStore('worldcups');
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      
      store.put(updated);
    });
  }

  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { used: 0, quota: 0 };
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['worldcups', 'images'], 'readwrite');
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      
      transaction.objectStore('worldcups').clear();
      transaction.objectStore('images').clear();
    });
  }
}

export const worldCupDB = new WorldCupDB();