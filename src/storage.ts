import type { CueSheet } from './model'

export type StorageNamespace = 'real' | 'demo'

const databaseName = (namespace: StorageNamespace): string => (
  namespace === 'demo' ? 'demo:rehearsal-section-cues' : 'rehearsal-section-cues'
)
const STORE_NAME = 'sheets'
const SHEET_KEY = 'current'

function openDatabase(namespace: StorageNamespace): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName(namespace), 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open local storage.'))
  })
}

export async function loadSheet(namespace: StorageNamespace = 'real'): Promise<CueSheet | undefined> {
  const db = await openDatabase(namespace)
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const request = transaction.objectStore(STORE_NAME).get(SHEET_KEY)
    request.onsuccess = () => resolve(request.result as CueSheet | undefined)
    request.onerror = () => reject(request.error ?? new Error('Could not read the cue sheet.'))
    transaction.oncomplete = () => db.close()
  })
}

export async function saveSheet(sheet: CueSheet, namespace: StorageNamespace = 'real'): Promise<void> {
  const db = await openDatabase(namespace)
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put(sheet, SHEET_KEY)
    transaction.oncomplete = () => {
      db.close()
      resolve()
    }
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not save the cue sheet.'))
  })
}

export async function clearSheet(namespace: StorageNamespace = 'real'): Promise<void> {
  const db = await openDatabase(namespace)
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).delete(SHEET_KEY)
    transaction.oncomplete = () => {
      db.close()
      resolve()
    }
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not clear local storage.'))
  })
}
