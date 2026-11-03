import { useSyncExternalStore } from 'react'

export const DEBUG_ENDPOINTS = [
  { path: '/api/customer', method: 'GET', empty: false },
  { path: '/api/accounts', method: 'GET', empty: true },
  { path: '/api/transactions', method: 'GET', empty: true },
  { path: '/api/payees', method: 'GET', empty: true },
  { path: '/api/transfers', method: 'POST', empty: false },
] as const

export type DebugPath = (typeof DEBUG_ENDPOINTS)[number]['path']
export interface EndpointOverride {
  scenario: 'default' | 'error' | 'empty'
  delay: number | null
}
export interface DebugSettings {
  endpoints: Record<DebugPath, EndpointOverride>
  bypassValidation: boolean
}

export function defaultDebugSettings(): DebugSettings {
  return {
    endpoints: Object.fromEntries(
      DEBUG_ENDPOINTS.map(({ path }) => [path, { scenario: 'default', delay: null }]),
    ) as DebugSettings['endpoints'],
    bypassValidation: false,
  }
}

let settings = defaultDebugSettings()
const listeners = new Set<() => void>()

export function getDebugSettings() {
  return settings
}

export function setDebugSettings(next: DebugSettings) {
  settings = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useDebugSettings() {
  return useSyncExternalStore(subscribe, getDebugSettings)
}

export function withDebugParams(path: string, method = 'GET') {
  const [pathname, query = ''] = path.split('?')
  const endpoint = DEBUG_ENDPOINTS.find((item) => item.path === pathname && item.method === method.toUpperCase())
  if (!endpoint) return path
  const override = settings.endpoints[endpoint.path]
  const params = new URLSearchParams(query)
  if (
    endpoint.method === 'GET' &&
    (override.scenario === 'error' || (endpoint.empty && override.scenario === 'empty'))
  ) {
    params.set('scenario', override.scenario)
  }
  if (override.delay !== null && Number.isFinite(override.delay)) {
    params.set('delay', String(Math.min(5000, Math.max(0, Math.trunc(override.delay)))))
  }
  const search = params.toString()
  return `${pathname}${search ? `?${search}` : ''}`
}
