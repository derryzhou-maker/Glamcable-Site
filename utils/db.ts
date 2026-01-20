
// IndexedDB Utility for storing large data (images) that LocalStorage cannot handle.
const DB_NAME = 'GlamCableDB';
const DB_VERSION = 1;
const STORE_NAME = 'settings';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("IndexedDB error:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

export const dbGet = async (key: string): Promise<any> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result);
        db.close(); // Close connection after read
      };
      request.onerror = () => {
        reject(request.error);
        db.close();
      };
    });
  } catch (e) {
    console.error("Failed to read from DB", e);
    return null;
  }
};

export const dbSet = async (key: string, value: any): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);

      transaction.oncomplete = () => {
        db.close(); 
        resolve();
      };

      transaction.onerror = () => {
        console.error(`Transaction failed for key: ${key}`, transaction.error);
        db.close();
        reject(transaction.error);
      };

      request.onerror = () => {
        console.error(`Request failed for key: ${key}`, request.error);
      };
    });
  } catch (e) {
    console.error("Failed to write to DB", e);
    throw e;
  }
};

export const dbSetMany = async (entries: { key: string; value: any }[]): Promise<void> => {
    try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
  
        entries.forEach(entry => {
            store.put(entry.value, entry.key);
        });
  
        transaction.oncomplete = () => {
          db.close(); 
          resolve();
        };
  
        transaction.onerror = () => {
          console.error(`Batch Transaction failed`, transaction.error);
          db.close();
          reject(transaction.error);
        };
      });
    } catch (e) {
      console.error("Failed to batch write to DB", e);
      throw e;
    }
  };

export const dbDelete = async (key: string): Promise<void> => {
    try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.delete(key); 
  
        transaction.oncomplete = () => {
            db.close();
            resolve();
        };
        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };
      });
    } catch (e) {
      console.error("Failed to delete from DB", e);
    }
  };

export const clearDatabase = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => {
            console.log("Database deleted successfully");
            resolve();
        };
        req.onerror = () => {
            console.error("Couldn't delete database");
            reject();
        };
        req.onblocked = () => {
            console.warn("Database delete blocked");
            reject();
        };
    });
}

// === NEW: Optimized Large Import Function ===
// This handles the connection manually to allow granular progress updates
// without opening/closing DB hundreds of times.
export const dbRestoreLargeData = async (
    items: { key: string; value: any }[], 
    onProgress: (current: number, total: number) => void
): Promise<void> => {
    const BATCH_SIZE = 10; // Write 10 items per transaction to keep UI responsive
    const total = items.length;
    let processed = 0;

    // We process in chunks to yield to the main thread
    for (let i = 0; i < total; i += BATCH_SIZE) {
        const chunk = items.slice(i, i + BATCH_SIZE);
        
        await new Promise<void>(async (resolve, reject) => {
             // Open DB for THIS batch
             try {
                const db = await initDB();
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);

                chunk.forEach(item => {
                    store.put(item.value, item.key);
                });

                transaction.oncomplete = () => {
                    db.close();
                    resolve();
                };
                transaction.onerror = (e) => {
                    db.close();
                    reject(e);
                };
             } catch (e) {
                 reject(e);
             }
        });

        processed += chunk.length;
        onProgress(Math.min(processed, total), total);
        
        // CRITICAL: Yield to main thread to allow UI render (Progress Bar)
        await new Promise(r => setTimeout(r, 10));
    }
};
