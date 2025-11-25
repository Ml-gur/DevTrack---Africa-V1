/**
 * Offline Sync Manager
 * Manages offline data synchronization with Supabase
 * Stores operations in IndexedDB and syncs when online
 */

import { supabase } from '../lib/supabaseClient'

interface PendingOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  table: string
  data: any
  timestamp: number
  userId: string
}

const DB_NAME = 'devtrack_offline_sync'
const DB_VERSION = 1
const STORE_NAME = 'pending_operations'

class OfflineSyncManager {
  private db: IDBDatabase | null = null
  private syncInProgress = false

  // Initialize IndexedDB
  async init(): Promise<void> {
    if (this.db) return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('✅ Offline sync manager initialized')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('userId', 'userId', { unique: false })
          console.log('📦 Created offline sync store')
        }
      }
    })
  }

  // Add a pending operation
  async addPendingOperation(
    type: PendingOperation['type'],
    table: string,
    data: any,
    userId: string
  ): Promise<void> {
    await this.init()
    if (!this.db) return

    const operation: PendingOperation = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      table,
      data,
      timestamp: Date.now(),
      userId
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.add(operation)

      request.onsuccess = () => {
        console.log('📝 Pending operation saved:', type, table)
        resolve()
      }

      request.onerror = () => {
        console.error('Failed to save pending operation:', request.error)
        reject(request.error)
      }
    })
  }

  // Get all pending operations
  async getPendingOperations(userId?: string): Promise<PendingOperation[]> {
    await this.init()
    if (!this.db) return []

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = userId 
        ? store.index('userId').getAll(userId)
        : store.getAll()

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        console.error('Failed to get pending operations:', request.error)
        reject(request.error)
      }
    })
  }

  // Remove a pending operation
  async removePendingOperation(id: string): Promise<void> {
    await this.init()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        console.error('Failed to remove pending operation:', request.error)
        reject(request.error)
      }
    })
  }

  // Sync all pending operations
  async syncPendingOperations(userId: string): Promise<{ 
    success: number; 
    failed: number; 
    total: number 
  }> {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress')
      return { success: 0, failed: 0, total: 0 }
    }

    // Check if online
    if (!navigator.onLine) {
      console.log('📴 Offline - skipping sync')
      return { success: 0, failed: 0, total: 0 }
    }

    this.syncInProgress = true
    console.log('🔄 Starting offline sync...')

    try {
      const operations = await this.getPendingOperations(userId)
      
      if (operations.length === 0) {
        console.log('✅ No pending operations to sync')
        return { success: 0, failed: 0, total: 0 }
      }

      console.log(`📊 Syncing ${operations.length} pending operations`)

      let success = 0
      let failed = 0

      // Sort by timestamp (oldest first)
      operations.sort((a, b) => a.timestamp - b.timestamp)

      for (const operation of operations) {
        try {
          await this.executePendingOperation(operation)
          await this.removePendingOperation(operation.id)
          success++
          console.log('✅ Synced:', operation.type, operation.table)
        } catch (error) {
          console.error('❌ Failed to sync operation:', operation, error)
          failed++
          
          // Remove failed operations older than 7 days
          const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
          if (operation.timestamp < sevenDaysAgo) {
            console.log('🗑️ Removing old failed operation:', operation.id)
            await this.removePendingOperation(operation.id)
          }
        }
      }

      console.log(`✅ Sync complete: ${success} successful, ${failed} failed`)
      
      return { success, failed, total: operations.length }
    } finally {
      this.syncInProgress = false
    }
  }

  // Execute a pending operation
  private async executePendingOperation(operation: PendingOperation): Promise<void> {
    const { type, table, data } = operation

    switch (type) {
      case 'create':
        await this.executeCreate(table, data)
        break
      case 'update':
        await this.executeUpdate(table, data)
        break
      case 'delete':
        await this.executeDelete(table, data)
        break
    }
  }

  private async executeCreate(table: string, data: any): Promise<void> {
    const { error } = await supabase.from(table).insert(data)
    if (error) throw error
  }

  private async executeUpdate(table: string, data: any): Promise<void> {
    const { id, ...updates } = data
    const { error } = await supabase.from(table).update(updates).eq('id', id)
    if (error) throw error
  }

  private async executeDelete(table: string, data: any): Promise<void> {
    const { error } = await supabase.from(table).delete().eq('id', data.id)
    if (error) throw error
  }

  // Clear all pending operations (use with caution)
  async clearAllPending(): Promise<void> {
    await this.init()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => {
        console.log('🗑️ All pending operations cleared')
        resolve()
      }

      request.onerror = () => {
        console.error('Failed to clear pending operations:', request.error)
        reject(request.error)
      }
    })
  }

  // Get sync status
  async getSyncStatus(userId: string): Promise<{
    hasPending: boolean
    count: number
    oldestTimestamp: number | null
  }> {
    const operations = await this.getPendingOperations(userId)
    
    return {
      hasPending: operations.length > 0,
      count: operations.length,
      oldestTimestamp: operations.length > 0
        ? Math.min(...operations.map(op => op.timestamp))
        : null
    }
  }
}

// Export singleton instance
export const offlineSyncManager = new OfflineSyncManager()

// Auto-sync when coming online
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    console.log('🌐 Back online - triggering sync')
    
    // Get current user from supabase
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await offlineSyncManager.syncPendingOperations(session.user.id)
    }
  })

  // Initialize on load
  offlineSyncManager.init().catch(err => {
    console.error('Failed to initialize offline sync manager:', err)
  })
}

export default offlineSyncManager
