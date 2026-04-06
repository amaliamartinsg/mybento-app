import axios, { AxiosHeaders } from 'axios'

const TRACE_HEADER_NAME = 'X-Trace-Id'

type TraceableRequestConfig = {
  headers?: Record<string, string>
  metadata?: {
    startedAt: number
    traceId: string
  }
}

const generateTraceId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '')
  }

  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 18)}`
}

const logFrontendEvent = (
  level: 'INFO' | 'ERROR',
  message: string,
  traceId: string,
  extra: Record<string, unknown> = {},
) => {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    service_name: 'frontend',
    message,
    trace_id: traceId,
    ...extra,
  }

  const serialized = JSON.stringify(payload)
  if (level === 'ERROR') {
    console.error(serialized)
    return
  }

  console.info(serialized)
}

const client = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000',
})

client.interceptors.request.use((config) => {
  const existingTraceId = (config.headers as Record<string, string> | undefined)?.[TRACE_HEADER_NAME]
  const traceId = existingTraceId ?? generateTraceId()
  const startedAt = performance.now()

  const headers = AxiosHeaders.from(config.headers)
  headers.set(TRACE_HEADER_NAME, traceId)
  config.headers = headers

  ;(config as typeof config & TraceableRequestConfig).metadata = {
    startedAt,
    traceId,
  }

  logFrontendEvent('INFO', 'api_request_started', traceId, {
    method: config.method?.toUpperCase(),
    url: config.url,
  })

  return config
})

client.interceptors.response.use(
  (response) => {
    const metadata = (response.config as typeof response.config & TraceableRequestConfig).metadata
    const traceId =
      response.headers?.[TRACE_HEADER_NAME.toLowerCase()] ??
      metadata?.traceId ??
      generateTraceId()

    logFrontendEvent('INFO', 'api_request_completed', traceId, {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      status_code: response.status,
      duration_ms: metadata ? Math.round(performance.now() - metadata.startedAt) : undefined,
    })

    return response
  },
  (error) => {
    const detail = error.response?.data?.detail
    const message =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: { msg: string }) => d.msg).join(', ')
          : error.message ?? 'Error desconocido'

    const metadata = (error.config as TraceableRequestConfig | undefined)?.metadata
    const traceId =
      error.response?.headers?.[TRACE_HEADER_NAME.toLowerCase()] ??
      metadata?.traceId ??
      generateTraceId()

    logFrontendEvent('ERROR', 'api_request_failed', traceId, {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status_code: error.response?.status,
      duration_ms: metadata ? Math.round(performance.now() - metadata.startedAt) : undefined,
      error_message: message,
    })

    return Promise.reject(new Error(message))
  },
)

export default client
