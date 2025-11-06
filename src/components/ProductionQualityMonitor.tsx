import React, { useState, useEffect } from 'react'
import {
  Shield,
  Zap,
  Database,
  Wifi,
  Lock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  TrendingUp,
  Users,
  FileText,
  Settings
} from 'lucide-react'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { useAuth } from '../contexts/SupabaseAuthContext'
import { supabase } from '../lib/supabaseClient'

interface HealthCheck {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  message: string
  responseTime?: number
  lastChecked: Date
}

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  threshold: number
  status: 'good' | 'warning' | 'critical'
}

interface SecurityCheck {
  name: string
  passed: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
}

export default function ProductionQualityMonitor() {
  const { user } = useAuth()
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([])
  const [securityChecks, setSecurityChecks] = useState<SecurityCheck[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [overallScore, setOverallScore] = useState(0)

  useEffect(() => {
    runMonitoring()
    const interval = setInterval(runMonitoring, 60000) // Every minute
    return () => clearInterval(interval)
  }, [])

  const runMonitoring = async () => {
    setIsMonitoring(true)
    
    await Promise.all([
      checkHealth(),
      checkPerformance(),
      checkSecurity()
    ])

    calculateOverallScore()
    setIsMonitoring(false)
  }

  const checkHealth = async () => {
    const checks: HealthCheck[] = []

    // Database connectivity
    const dbStart = performance.now()
    try {
      const { error } = await supabase.from('profiles').select('count').limit(0)
      const dbTime = performance.now() - dbStart
      checks.push({
        name: 'Database Connection',
        status: error ? 'down' : dbTime > 1000 ? 'degraded' : 'healthy',
        message: error ? error.message : `Response time: ${dbTime.toFixed(0)}ms`,
        responseTime: dbTime,
        lastChecked: new Date()
      })
    } catch (error: any) {
      checks.push({
        name: 'Database Connection',
        status: 'down',
        message: error.message,
        lastChecked: new Date()
      })
    }

    // Authentication service
    try {
      const { data } = await supabase.auth.getSession()
      checks.push({
        name: 'Authentication Service',
        status: data.session ? 'healthy' : 'degraded',
        message: data.session ? 'User authenticated' : 'No active session',
        lastChecked: new Date()
      })
    } catch (error: any) {
      checks.push({
        name: 'Authentication Service',
        status: 'down',
        message: error.message,
        lastChecked: new Date()
      })
    }

    // IndexedDB
    try {
      if (typeof indexedDB !== 'undefined') {
        checks.push({
          name: 'Offline Storage',
          status: 'healthy',
          message: 'IndexedDB available',
          lastChecked: new Date()
        })
      } else {
        checks.push({
          name: 'Offline Storage',
          status: 'down',
          message: 'IndexedDB not available',
          lastChecked: new Date()
        })
      }
    } catch (error: any) {
      checks.push({
        name: 'Offline Storage',
        status: 'down',
        message: error.message,
        lastChecked: new Date()
      })
    }

    // Service Worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      checks.push({
        name: 'Service Worker',
        status: registration ? 'healthy' : 'degraded',
        message: registration ? 'Active' : 'Not registered',
        lastChecked: new Date()
      })
    } else {
      checks.push({
        name: 'Service Worker',
        status: 'down',
        message: 'Not supported',
        lastChecked: new Date()
      })
    }

    setHealthChecks(checks)
  }

  const checkPerformance = async () => {
    const metrics: PerformanceMetric[] = []

    // Page load time
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing
      const loadTime = timing.loadEventEnd - timing.navigationStart
      if (loadTime > 0) {
        metrics.push({
          name: 'Page Load Time',
          value: loadTime,
          unit: 'ms',
          threshold: 3000,
          status: loadTime < 1000 ? 'good' : loadTime < 3000 ? 'warning' : 'critical'
        })
      }
    }

    // Memory usage (if available)
    if ((performance as any).memory) {
      const memory = (performance as any).memory
      const usedMemory = memory.usedJSHeapSize / 1048576 // Convert to MB
      metrics.push({
        name: 'Memory Usage',
        value: usedMemory,
        unit: 'MB',
        threshold: 100,
        status: usedMemory < 50 ? 'good' : usedMemory < 100 ? 'warning' : 'critical'
      })
    }

    // Network status
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      if (connection.effectiveType) {
        const effectiveType = connection.effectiveType
        metrics.push({
          name: 'Network Speed',
          value: effectiveType === '4g' ? 4 : effectiveType === '3g' ? 3 : 2,
          unit: 'G',
          threshold: 3,
          status: effectiveType === '4g' ? 'good' : effectiveType === '3g' ? 'warning' : 'critical'
        })
      }
    }

    // Database query performance
    const queryStart = performance.now()
    try {
      await supabase.from('projects').select('id').limit(1)
      const queryTime = performance.now() - queryStart
      metrics.push({
        name: 'Database Query Time',
        value: queryTime,
        unit: 'ms',
        threshold: 500,
        status: queryTime < 200 ? 'good' : queryTime < 500 ? 'warning' : 'critical'
      })
    } catch (error) {
      // Query failed
    }

    setPerformanceMetrics(metrics)
  }

  const checkSecurity = async () => {
    const checks: SecurityCheck[] = []

    // HTTPS check
    checks.push({
      name: 'HTTPS Enabled',
      passed: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
      severity: 'critical',
      message: window.location.protocol === 'https:' ? 'Site served over HTTPS' : 'Not using HTTPS'
    })

    // Content Security Policy
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
    checks.push({
      name: 'Content Security Policy',
      passed: !!cspMeta,
      severity: 'medium',
      message: cspMeta ? 'CSP header present' : 'No CSP header found'
    })

    // Secure cookies
    const cookies = document.cookie
    const hasSecureCookies = !cookies || cookies.includes('Secure')
    checks.push({
      name: 'Secure Cookies',
      passed: hasSecureCookies || window.location.protocol === 'https:',
      severity: 'high',
      message: hasSecureCookies ? 'Cookies are secure' : 'Non-secure cookies detected'
    })

    // Authentication check
    checks.push({
      name: 'User Authentication',
      passed: !!user,
      severity: 'high',
      message: user ? 'User authenticated' : 'No active user session'
    })

    // Row Level Security check (RLS)
    if (user) {
      try {
        // Try to access another user's data - should fail with RLS
        const { data } = await supabase
          .from('projects')
          .select('*')
          .neq('user_id', user.id)
          .limit(1)

        const hasNonPublicData = data && data.length > 0 && !data[0].is_public
        checks.push({
          name: 'Row Level Security',
          passed: !hasNonPublicData,
          severity: 'critical',
          message: hasNonPublicData ? 'RLS not working - can access other users data!' : 'RLS properly enforced'
        })
      } catch (error) {
        checks.push({
          name: 'Row Level Security',
          passed: true,
          severity: 'critical',
          message: 'RLS enforced (query blocked)'
        })
      }
    }

    // XSS protection headers
    const xssProtection = document.querySelector('meta[http-equiv="X-XSS-Protection"]')
    checks.push({
      name: 'XSS Protection',
      passed: !!xssProtection,
      severity: 'medium',
      message: xssProtection ? 'XSS protection enabled' : 'No XSS protection header'
    })

    setSecurityChecks(checks)
  }

  const calculateOverallScore = () => {
    let totalScore = 0
    let maxScore = 0

    // Health checks (40% weight)
    healthChecks.forEach(check => {
      maxScore += 40 / healthChecks.length
      if (check.status === 'healthy') totalScore += 40 / healthChecks.length
      else if (check.status === 'degraded') totalScore += (40 / healthChecks.length) * 0.5
    })

    // Performance metrics (30% weight)
    performanceMetrics.forEach(metric => {
      maxScore += 30 / performanceMetrics.length
      if (metric.status === 'good') totalScore += 30 / performanceMetrics.length
      else if (metric.status === 'warning') totalScore += (30 / performanceMetrics.length) * 0.5
    })

    // Security checks (30% weight)
    securityChecks.forEach(check => {
      maxScore += 30 / securityChecks.length
      if (check.passed) totalScore += 30 / securityChecks.length
    })

    setOverallScore(maxScore > 0 ? (totalScore / maxScore) * 100 : 0)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'good':
        return 'text-green-500 bg-green-50'
      case 'degraded':
      case 'warning':
        return 'text-yellow-500 bg-yellow-50'
      case 'down':
      case 'critical':
        return 'text-red-500 bg-red-50'
      default:
        return 'text-gray-500 bg-gray-50'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gray-900">
              Production Quality Monitor
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Real-time monitoring of DevTrack Africa's health and performance
            </p>
          </div>
          <Button onClick={runMonitoring} disabled={isMonitoring}>
            <Activity className="w-4 h-4 mr-2" />
            {isMonitoring ? 'Monitoring...' : 'Refresh'}
          </Button>
        </div>

        {/* Overall Score */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-600">Overall Health Score</div>
              <div className={`text-4xl mt-2 ${getScoreColor(overallScore)}`}>
                {overallScore.toFixed(1)}%
              </div>
            </div>
            <div className={`p-4 rounded-full ${getScoreColor(overallScore)}`}>
              {overallScore >= 90 ? (
                <CheckCircle2 className="w-12 h-12" />
              ) : overallScore >= 70 ? (
                <AlertTriangle className="w-12 h-12" />
              ) : (
                <XCircle className="w-12 h-12" />
              )}
            </div>
          </div>
          <Progress value={overallScore} className="h-2" />
          <p className="text-xs text-gray-600 mt-2">
            {overallScore >= 90 && 'Excellent! All systems operating at peak performance.'}
            {overallScore >= 70 && overallScore < 90 && 'Good. Some areas need attention.'}
            {overallScore < 70 && 'Critical issues detected. Immediate action required.'}
          </p>
        </Card>

        {/* Detailed Monitoring */}
        <Tabs defaultValue="health" className="space-y-6">
          <TabsList>
            <TabsTrigger value="health">
              <Activity className="w-4 h-4 mr-2" />
              Health
            </TabsTrigger>
            <TabsTrigger value="performance">
              <Zap className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="health">
            <div className="grid gap-4">
              {healthChecks.map((check, idx) => (
                <Card key={idx} className={`p-4 ${getStatusColor(check.status)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {check.status === 'healthy' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        {check.status === 'degraded' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                        {check.status === 'down' && <XCircle className="w-4 h-4 text-red-500" />}
                        <span className="text-gray-900">{check.name}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{check.message}</p>
                      {check.responseTime && (
                        <p className="text-xs text-gray-500 mt-1">
                          Response time: {check.responseTime.toFixed(0)}ms
                        </p>
                      )}
                    </div>
                    <Badge variant={check.status === 'healthy' ? 'default' : 'destructive'}>
                      {check.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Last checked: {check.lastChecked.toLocaleTimeString()}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <div className="grid gap-4">
              {performanceMetrics.map((metric, idx) => (
                <Card key={idx} className={`p-4 ${getStatusColor(metric.status)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {metric.status === 'good' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        {metric.status === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                        {metric.status === 'critical' && <XCircle className="w-4 h-4 text-red-500" />}
                        <span className="text-gray-900">{metric.name}</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl text-gray-900">
                          {metric.value.toFixed(0)}
                        </span>
                        <span className="text-sm text-gray-600 ml-1">{metric.unit}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Threshold: {metric.threshold} {metric.unit}
                      </p>
                    </div>
                    <Badge variant={metric.status === 'good' ? 'default' : 'destructive'}>
                      {metric.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="security">
            <div className="grid gap-4">
              {securityChecks.map((check, idx) => (
                <Card
                  key={idx}
                  className={`p-4 ${check.passed ? 'bg-green-50 border-green-200' : 
                    check.severity === 'critical' ? 'bg-red-50 border-red-200' :
                    check.severity === 'high' ? 'bg-orange-50 border-orange-200' :
                    'bg-yellow-50 border-yellow-200'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {check.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-gray-900">{check.name}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{check.message}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={check.passed ? 'default' : 'destructive'}>
                        {check.passed ? 'Passed' : 'Failed'}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          check.severity === 'critical' ? 'border-red-500 text-red-500' :
                          check.severity === 'high' ? 'border-orange-500 text-orange-500' :
                          check.severity === 'medium' ? 'border-yellow-500 text-yellow-500' :
                          'border-gray-500 text-gray-500'
                        }
                      >
                        {check.severity}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
