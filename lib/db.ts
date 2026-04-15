import { SavedApp } from "@/types"

const DB_NAME = 'AppBuilderDB'
const DB_VERSION = 2
const STORE_NAME = 'savedApps'
const CHAT_STORE_NAME = 'chatHistory'

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('code', 'code', { unique: true })
      }
      if (!db.objectStoreNames.contains(CHAT_STORE_NAME)) {
        db.createObjectStore(CHAT_STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

export const saveAppToDB = async (app: any): Promise<void> => {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(app)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Failed to save app to IndexedDB:', error)
  }
}

export const getAllAppsFromDB = async (): Promise<any[]> => {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Failed to get apps from IndexedDB:', error)
    return []
  }
}

export const deleteAppFromDB = async (appId: string): Promise<void> => {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(appId)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Failed to delete app from IndexedDB:', error)
  }
}

export const updateAppInDB = async (app: SavedApp): Promise<void> => {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(app)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Failed to update app in IndexedDB:', error)
  }
}

export const appExistsInDB = async (appId: string): Promise<boolean> => {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(appId)
      request.onsuccess = () => resolve(!!request.result)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Failed to check app in IndexedDB:', error)
    return false
  }
}

export const saveChatHistoryToDB = async (chatId: string, messages: any[]): Promise<void> => {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CHAT_STORE_NAME], 'readwrite')
      const store = transaction.objectStore(CHAT_STORE_NAME)
      const request = store.put({ id: chatId, messages, timestamp: Date.now() })
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Failed to save chat history to IndexedDB:', error)
  }
}

export const getChatHistoryFromDB = async (chatId: string): Promise<any[] | null> => {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CHAT_STORE_NAME], 'readonly')
      const store = transaction.objectStore(CHAT_STORE_NAME)
      const request = store.get(chatId)
      request.onsuccess = () => resolve(request.result?.messages || null)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Failed to get chat history from IndexedDB:', error)
    return null
  }
}

export const deleteChatHistoryFromDB = async (chatId: string): Promise<void> => {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CHAT_STORE_NAME], 'readwrite')
      const store = transaction.objectStore(CHAT_STORE_NAME)
      const request = store.delete(chatId)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Failed to delete chat history from IndexedDB:', error)
  }
}
