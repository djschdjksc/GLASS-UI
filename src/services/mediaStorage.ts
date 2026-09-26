// IndexedDB High-Capacity Media Storage for Background Videos and Images
// Bypasses browser localStorage 5MB quota to allow seamless HD videos (10MB - 500MB+)

const DB_NAME = 'ModernSummaryMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'customMediaStore';
const MEDIA_KEY = 'active_bg_media';

interface MediaRecord {
  id: string;
  name: string;
  type: 'video' | 'image';
  mimeType: string;
  blob: Blob;
  updatedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Saves a File or Blob to IndexedDB without size quota crashes
 */
export async function saveMediaToDB(file: File | Blob, name: string, type: 'video' | 'image'): Promise<string> {
  try {
    const db = await openDB();
    const record: MediaRecord = {
      id: MEDIA_KEY,
      name,
      type,
      mimeType: file.type,
      blob: file,
      updatedAt: Date.now()
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Generate Object URL for immediate playback in <video> or <img>
    return URL.createObjectURL(file);
  } catch (err) {
    console.error('Failed to save media to IndexedDB:', err);
    return URL.createObjectURL(file);
  }
}

/**
 * Loads the saved media Blob from IndexedDB and returns an Object URL
 */
export async function loadMediaFromDB(): Promise<{ url: string; name: string; type: 'video' | 'image' } | null> {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(MEDIA_KEY);
      req.onsuccess = () => {
        const res = req.result as MediaRecord | undefined;
        if (res && res.blob) {
          const url = URL.createObjectURL(res.blob);
          resolve({
            url,
            name: res.name,
            type: res.type
          });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to load media from IndexedDB:', err);
    return null;
  }
}

/**
 * Deletes custom media from IndexedDB
 */
export async function clearMediaFromDB(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(MEDIA_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to clear media from IndexedDB:', err);
  }
}
