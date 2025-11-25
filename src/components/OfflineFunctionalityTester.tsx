/**
 * Offline Functionality Tester
 * Comprehensive testing component for offline features
 */

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import {
  Wifi,
  WifiOff,
  Database,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Download,
  Upload,
  HardDrive,
  Cloud,
  Clock,
  Settings
} from 'lucide-react'
import { offlineSyncManager } from '../utils/offline-sync-manager'
import { offlineDatabase } from '../utils/offline-database-wrapper'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/SupabaseAuthContext'

interface TestResult {
  name: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  message: string
  details?: string
}

export function OfflineFunctionalityTester() {
  const { user } = useAuth()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [tests, setTests] = useState<TestResult[]>([])
  const [testing, setTesting] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{
    hasPending: boolean
    count: number
    oldestTimestamp: number | null
  } | null>(null)
  const [cacheInfo, setCacheInfo] = useState<{
    supported: boolean
    usage?: number
    quota?: number
  } | null>(null)

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load sync status
  useEffect(() => {
    if (user) {
      loadSyncStatus()
    }
  }, [user])

  // Load cache info
  useEffect(() => {
    loadCacheInfo()
  }, [])

  const loadSyncStatus = async () => {
    if (!user) return

    try {
      const status = await offlineSyncManager.getSyncStatus(user.id)
      setSyncStatus(status)
    } catch (error) {
      console.error('Failed to load sync status:', error)
    }
  }

  const loadCacheInfo = async () => {
    if (!('storage' in navigator && 'estimate' in navigator.storage)) {
      setCacheInfo({ supported: false })
      return
    }

    try {
      const estimate = await navigator.storage.estimate()
      setCacheInfo({
        supported: true,
        usage: estimate.usage,
        quota: estimate.quota
      })
    } catch (error) {
      console.error('Failed to get cache info:', error)
      setCacheInfo({ supported: false })
    }
  }

  const updateTest = (name: string, updates: Partial<TestResult>) => {
    setTests(prev => prev.map(test =>
      test.name === name ? { ...test, ...updates } : test
    ))
  }

  const runAllTests = async () => {
    if (!user) {
      alert('Please sign in to run tests')
      return
    }

    setTesting(true)

    const testSuite: TestResult[] = [
      { name: 'IndexedDB Support', status: 'pending', message: 'Checking...' },
      { name: 'Service Worker', status: 'pending', message: 'Checking...' },
      { name: 'Offline Sync Manager', status: 'pending', message: 'Checking...' },
      { name: 'Supabase Connection', status: 'pending', message: 'Checking...' },
      { name: 'Cache Storage', status: 'pending', message: 'Checking...' },
      { name: 'Offline Database Wrapper', status: 'pending', message: 'Checking...' },
      { name: 'Data Persistence', status: 'pending', message: 'Checking...' }
    ]

    setTests(testSuite)

    // Test 1: IndexedDB Support
    try {
      updateTest('IndexedDB Support', { status: 'running' })
      const dbSupported = 'indexedDB' in window
      if (dbSupported) {
        // Try to open a test database
        await new Promise((resolve, reject) => {
          const request = indexedDB.open('test_db', 1)
          request.onsuccess = () => {
            indexedDB.deleteDatabase('test_db')
            resolve(true)
          }
          request.onerror = () => reject(request.error)
        })
        updateTest('IndexedDB Support', {
          status: 'passed',
          message: 'IndexedDB is fully supported and functional'
        })
      } else {
        throw new Error('IndexedDB not supported')
      }
    } catch (error: any) {
      updateTest('IndexedDB Support', {
        status: 'failed',
        message: 'IndexedDB test failed',
        details: error.message
      })
    }

    await new Promise(resolve => setTimeout(resolve, 500))

    // Test 2: Service Worker
    try {
      updateTest('Service Worker', { status: 'running' })
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          updateTest('Service Worker', {
            status: 'passed',
            message: `Service worker active (${registration.active ? 'running' : 'installing'})`
          })
        } else {
          throw new Error('No service worker registered')
        }
      } else {
        throw new Error('Service Worker not supported')
      }
    } catch (error: any) {
      updateTest('Service Worker', {
        status: 'failed',
        message: 'Service Worker test failed',
        details: error.message
      })
    }

    await new Promise(resolve => setTimeout(resolve, 500))

    // Test 3: Offline Sync Manager
    try {
      updateTest('Offline Sync Manager', { status: 'running' })
      await offlineSyncManager.init()
      const status = await offlineSyncManager.getSyncStatus(user.id)
      updateTest('Offline Sync Manager', {
        status: 'passed',
        message: `Sync manager initialized (${status.count} pending operations)`
      })
    } catch (error: any) {
      updateTest('Offline Sync Manager', {
        status: 'failed',
        message: 'Sync manager test failed',
        details: error.message
      })
    }

    await new Promise(resolve => setTimeout(resolve, 500))

    // Test 4: Supabase Connection
    try {
      updateTest('Supabase Connection', { status: 'running' })
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const testResult = await offlineDatabase.testConnection()
        if (testResult.success) {
          updateTest('Supabase Connection', {
            status: 'passed',
            message: 'Connected to Supabase successfully'
          })
        } else {
          throw new Error(testResult.message)
        }
      } else {
        throw new Error('No active session')
      }
    } catch (error: any) {
      updateTest('Supabase Connection', {
        status: 'failed',
        message: 'Supabase connection test failed',
        details: error.message
      })
    }

    await new Promise(resolve => setTimeout(resolve, 500))

    // Test 5: Cache Storage
    try {
      updateTest('Cache Storage', { status: 'running' })
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        updateTest('Cache Storage', {
          status: 'passed',
          message: `Cache API available (${cacheNames.length} caches)`
        })
      } else {
        throw new Error('Cache API not supported')
      }
    } catch (error: any) {
      updateTest('Cache Storage', {
        status: 'failed',
        message: 'Cache storage test failed',
        details: error.message
      })
    }

    await new Promise(resolve => setTimeout(resolve, 500))

    // Test 6: Offline Database Wrapper
    try {
      updateTest('Offline Database Wrapper', { status: 'running' })
      const projects = await offlineDatabase.getProjects(user.id)
      updateTest('Offline Database Wrapper', {
        status: 'passed',
        message: `Database wrapper functional (${projects.length} projects loaded)`
      })
    } catch (error: any) {
      updateTest('Offline Database Wrapper', {
        status: 'failed',
        message: 'Database wrapper test failed',
        details: error.message
      })
    }

    await new Promise(resolve => setTimeout(resolve, 500))

    // Test 7: Data Persistence
    try {
      updateTest('Data Persistence', { status: 'running' })
      
      // Test localStorage
      const testKey = 'devtrack_persistence_test'
      const testValue = JSON.stringify({ test: true, timestamp: Date.now() })
      localStorage.setItem(testKey, testValue)
      const retrieved = localStorage.getItem(testKey)
      localStorage.removeItem(testKey)
      
      if (retrieved === testValue) {
        updateTest('Data Persistence', {
          status: 'passed',
          message: 'localStorage persistence working correctly'
        })
      } else {
        throw new Error('localStorage read/write mismatch')
      }
    } catch (error: any) {
      updateTest('Data Persistence', {
        status: 'failed',
        message: 'Data persistence test failed',
        details: error.message
      })
    }

    setTesting(false)
    await loadSyncStatus()
    await loadCacheInfo()
  }

  const triggerSync = async () => {
    if (!user) return

    try {
      const result = await offlineSyncManager.syncPendingOperations(user.id)
      alert(`Sync complete:\n${result.success} successful\n${result.failed} failed\n${result.total} total`)
      await loadSyncStatus()
    } catch (error) {
      console.error('Sync failed:', error)
      alert('Sync failed - check console for details')
    }
  }

  const clearCache = async () => {
    if (!confirm('Clear all cached data? This cannot be undone.')) return

    try {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
      alert('Cache cleared successfully')
      await loadCacheInfo()
    } catch (error) {
      console.error('Failed to clear cache:', error)
      alert('Failed to clear cache - check console for details')
    }
  }

  const clearPending = async () => {
    if (!confirm('Clear all pending sync operations? This cannot be undone.')) return

    try {
      await offlineSyncManager.clearAllPending()
      alert('Pending operations cleared')
      await loadSyncStatus()
    } catch (error) {
      console.error('Failed to clear pending:', error)
      alert('Failed to clear pending operations - check console for details')
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400" />
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'passed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700'
      case 'running':
        return 'bg-blue-100 text-blue-700'
      case 'passed':
        return 'bg-green-100 text-green-700'
      case 'failed':
        return 'bg-red-100 text-red-700'
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  if (!user) {
    return (
      <div className="p-8">
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Please sign in to use the offline functionality tester
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold mb-2">Offline Functionality Tester</h2>
        <p className="text-gray-600">
          Test and verify offline features, data synchronization, and caching
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Online Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              {isOnline ? (
                <div className="p-2 bg-green-100 rounded-lg">
                  <Wifi className="w-5 h-5 text-green-600" />
                </div>
              ) : (
                <div className="p-2 bg-red-100 rounded-lg">
                  <WifiOff className="w-5 h-5 text-red-600" />
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Connection</p>
                <p className="font-semibold">
                  {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Sync */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Sync</p>
                <p className="font-semibold">
                  {syncStatus ? syncStatus.count : '...'} operations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cache Storage */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <HardDrive className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Cache Used</p>
                <p className="font-semibold">
                  {cacheInfo?.usage ? formatBytes(cacheInfo.usage) : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Manage offline functionality and synchronization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={runAllTests}
              disabled={testing}
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4 mr-2" />
                  Run All Tests
                </>
              )}
            </Button>
            
            <Button
              onClick={triggerSync}
              disabled={!syncStatus?.hasPending || !isOnline}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Now
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={clearCache}
              variant="outline"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Clear Cache
            </Button>
            
            <Button
              onClick={clearPending}
              disabled={!syncStatus?.hasPending}
              variant="outline"
              className="w-full"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Clear Pending
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {tests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              {tests.filter(t => t.status === 'passed').length} / {tests.length} tests passed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tests.map((test) => (
                <div
                  key={test.name}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-start space-x-3 flex-1">
                    {getStatusIcon(test.status)}
                    <div className="flex-1">
                      <p className="font-medium">{test.name}</p>
                      <p className="text-sm text-gray-600">{test.message}</p>
                      {test.details && (
                        <p className="text-xs text-red-600 mt-1">{test.details}</p>
                      )}
                    </div>
                  </div>
                  <Badge className={getStatusColor(test.status)}>
                    {test.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Storage Info */}
      {cacheInfo?.supported && (
        <Card>
          <CardHeader>
            <CardTitle>Storage Information</CardTitle>
            <CardDescription>
              Browser storage usage and quota
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Used:</span>
                <span className="font-medium">
                  {cacheInfo.usage ? formatBytes(cacheInfo.usage) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quota:</span>
                <span className="font-medium">
                  {cacheInfo.quota ? formatBytes(cacheInfo.quota) : 'N/A'}
                </span>
              </div>
              {cacheInfo.usage && cacheInfo.quota && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Percentage:</span>
                  <span className="font-medium">
                    {((cacheInfo.usage / cacheInfo.quota) * 100).toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default OfflineFunctionalityTester
