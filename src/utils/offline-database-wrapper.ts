/**
 * Offline Database Wrapper
 * Provides offline-first database operations with automatic sync
 * Falls back to IndexedDB when offline, syncs to Supabase when online
 */

import { supabaseDatabase, Project, Task, Post } from './supabase-database'
import { offlineSyncManager } from './offline-sync-manager'

const DB_NAME = 'devtrack_offline_data'
const DB_VERSION = 1

interface CachedData {
  id: string
  data: any
  timestamp: number
  userId: string
}

class OfflineDatabaseWrapper {
  private db: IDBDatabase | null = null
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  // Initialize IndexedDB for offline storage
  async init(): Promise<void> {
    if (this.db) return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('Failed to open offline DB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('✅ Offline database initialized')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create object stores for caching
        const stores = ['projects', 'tasks', 'posts', 'profiles']
        
        stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' })
            store.createIndex('userId', 'userId', { unique: false })
            store.createIndex('timestamp', 'timestamp', { unique: false })
          }
        })
      }
    })
  }

  // Check if online
  private isOnline(): boolean {
    return navigator.onLine
  }

  // Cache data to IndexedDB
  private async cacheData(
    store: string,
    id: string,
    data: any,
    userId: string
  ): Promise<void> {
    await this.init()
    if (!this.db) return

    const cached: CachedData = {
      id,
      data,
      timestamp: Date.now(),
      userId
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], 'readwrite')
      const objectStore = transaction.objectStore(store)
      const request = objectStore.put(cached)

      request.onsuccess = () => resolve()
      request.onerror = () => {
        console.warn('Failed to cache data:', request.error)
        resolve() // Don't reject - caching is optional
      }
    })
  }

  // Get cached data from IndexedDB
  private async getCachedData(store: string, id: string): Promise<any | null> {
    await this.init()
    if (!this.db) return null

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([store], 'readonly')
      const objectStore = transaction.objectStore(store)
      const request = objectStore.get(id)

      request.onsuccess = () => {
        const cached = request.result as CachedData | undefined
        
        if (!cached) {
          resolve(null)
          return
        }

        // Check if cache is still valid
        const age = Date.now() - cached.timestamp
        if (age > this.cacheTimeout) {
          resolve(null)
          return
        }

        resolve(cached.data)
      }

      request.onerror = () => {
        console.warn('Failed to get cached data:', request.error)
        resolve(null)
      }
    })
  }

  // Get all cached data by userId
  private async getAllCachedData(store: string, userId: string): Promise<any[]> {
    await this.init()
    if (!this.db) return []

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([store], 'readonly')
      const objectStore = transaction.objectStore(store)
      const index = objectStore.index('userId')
      const request = index.getAll(userId)

      request.onsuccess = () => {
        const results = request.result as CachedData[]
        
        // Filter out expired cache entries
        const valid = results.filter(cached => {
          const age = Date.now() - cached.timestamp
          return age <= this.cacheTimeout
        })

        resolve(valid.map(cached => cached.data))
      }

      request.onerror = () => {
        console.warn('Failed to get cached data:', request.error)
        resolve([])
      }
    })
  }

  // Projects
  async getProjects(userId: string): Promise<Project[]> {
    try {
      if (this.isOnline()) {
        const projects = await supabaseDatabase.getProjects(userId)
        
        // Cache each project
        for (const project of projects) {
          await this.cacheData('projects', project.id, project, userId)
        }
        
        return projects
      } else {
        console.log('📴 Offline - using cached projects')
        return await this.getAllCachedData('projects', userId)
      }
    } catch (error) {
      console.error('Failed to get projects, falling back to cache:', error)
      return await this.getAllCachedData('projects', userId)
    }
  }

  async createProject(userId: string, projectData: Omit<Project, 'id' | 'userId' | 'created_at' | 'updated_at'>): Promise<Project | null> {
    try {
      if (this.isOnline()) {
        const project = await supabaseDatabase.createProject(userId, projectData)
        if (project) {
          await this.cacheData('projects', project.id, project, userId)
        }
        return project
      } else {
        console.log('📴 Offline - queueing project creation')
        
        // Create temporary project with offline ID
        const tempProject: Project = {
          id: `offline_${Date.now()}`,
          userId,
          ...projectData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        // Cache locally
        await this.cacheData('projects', tempProject.id, tempProject, userId)
        
        // Queue for sync
        await offlineSyncManager.addPendingOperation('create', 'projects', tempProject, userId)
        
        return tempProject
      }
    } catch (error) {
      console.error('Failed to create project:', error)
      return null
    }
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<Project | null> {
    try {
      if (this.isOnline()) {
        const project = await supabaseDatabase.updateProject(projectId, updates)
        if (project) {
          await this.cacheData('projects', project.id, project, project.userId)
        }
        return project
      } else {
        console.log('📴 Offline - queueing project update')
        
        // Get cached project
        const cached = await this.getCachedData('projects', projectId)
        if (!cached) return null
        
        // Update locally
        const updated = { ...cached, ...updates, updated_at: new Date().toISOString() }
        await this.cacheData('projects', projectId, updated, cached.userId)
        
        // Queue for sync
        await offlineSyncManager.addPendingOperation('update', 'projects', { id: projectId, ...updates }, cached.userId)
        
        return updated
      }
    } catch (error) {
      console.error('Failed to update project:', error)
      return null
    }
  }

  async deleteProject(projectId: string): Promise<boolean> {
    try {
      if (this.isOnline()) {
        return await supabaseDatabase.deleteProject(projectId)
      } else {
        console.log('📴 Offline - queueing project deletion')
        
        // Get cached project to get userId
        const cached = await this.getCachedData('projects', projectId)
        if (!cached) return false
        
        // Queue for sync
        await offlineSyncManager.addPendingOperation('delete', 'projects', { id: projectId }, cached.userId)
        
        return true
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
      return false
    }
  }

  // Tasks
  async getTasks(projectId: string): Promise<Task[]> {
    try {
      if (this.isOnline()) {
        return await supabaseDatabase.getTasks(projectId)
      } else {
        console.log('📴 Offline - using cached tasks')
        // Note: This is simplified - you'd want to filter by projectId
        return []
      }
    } catch (error) {
      console.error('Failed to get tasks:', error)
      return []
    }
  }

  async getUserTasks(userId: string): Promise<Task[]> {
    try {
      if (this.isOnline()) {
        const tasks = await supabaseDatabase.getUserTasks(userId)
        
        // Cache each task
        for (const task of tasks) {
          await this.cacheData('tasks', task.id, task, userId)
        }
        
        return tasks
      } else {
        console.log('📴 Offline - using cached tasks')
        return await this.getAllCachedData('tasks', userId)
      }
    } catch (error) {
      console.error('Failed to get user tasks, falling back to cache:', error)
      return await this.getAllCachedData('tasks', userId)
    }
  }

  async createTask(taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task | null> {
    try {
      if (this.isOnline()) {
        const task = await supabaseDatabase.createTask(taskData)
        if (task) {
          await this.cacheData('tasks', task.id, task, taskData.userId)
        }
        return task
      } else {
        console.log('📴 Offline - queueing task creation')
        
        const tempTask: Task = {
          id: `offline_${Date.now()}`,
          ...taskData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        await this.cacheData('tasks', tempTask.id, tempTask, taskData.userId)
        await offlineSyncManager.addPendingOperation('create', 'tasks', tempTask, taskData.userId)
        
        return tempTask
      }
    } catch (error) {
      console.error('Failed to create task:', error)
      return null
    }
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    try {
      if (this.isOnline()) {
        const task = await supabaseDatabase.updateTask(taskId, updates)
        if (task) {
          await this.cacheData('tasks', task.id, task, task.userId)
        }
        return task
      } else {
        console.log('📴 Offline - queueing task update')
        
        const cached = await this.getCachedData('tasks', taskId)
        if (!cached) return null
        
        const updated = { ...cached, ...updates, updated_at: new Date().toISOString() }
        await this.cacheData('tasks', taskId, updated, cached.userId)
        await offlineSyncManager.addPendingOperation('update', 'tasks', { id: taskId, ...updates }, cached.userId)
        
        return updated
      }
    } catch (error) {
      console.error('Failed to update task:', error)
      return null
    }
  }

  async deleteTask(taskId: string): Promise<boolean> {
    try {
      if (this.isOnline()) {
        return await supabaseDatabase.deleteTask(taskId)
      } else {
        console.log('📴 Offline - queueing task deletion')
        
        const cached = await this.getCachedData('tasks', taskId)
        if (!cached) return false
        
        await offlineSyncManager.addPendingOperation('delete', 'tasks', { id: taskId }, cached.userId)
        return true
      }
    } catch (error) {
      console.error('Failed to delete task:', error)
      return false
    }
  }

  // Delegate other methods directly to supabaseDatabase
  async getPublicProjects() {
    return supabaseDatabase.getPublicProjects()
  }

  async getPosts() {
    return supabaseDatabase.getPosts()
  }

  async getUserPosts(userId: string) {
    return supabaseDatabase.getUserPosts(userId)
  }

  async createPost(postData: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'likes' | 'comments'>) {
    return supabaseDatabase.createPost(postData)
  }

  async deletePost(postId: string) {
    return supabaseDatabase.deletePost(postId)
  }

  async getProjectStats(userId: string) {
    return supabaseDatabase.getProjectStats(userId)
  }

  async initializeDemoData(userId: string) {
    return supabaseDatabase.initializeDemoData(userId)
  }

  async testConnection() {
    return supabaseDatabase.testConnection()
  }
}

// Export singleton instance
export const offlineDatabase = new OfflineDatabaseWrapper()

// Export as default and for backward compatibility
export default offlineDatabase
export const localDatabase = offlineDatabase
