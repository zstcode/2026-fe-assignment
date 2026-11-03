import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  DEBUG_ENDPOINTS,
  defaultDebugSettings,
  getDebugSettings,
  setDebugSettings,
  useDebugSettings,
} from '../lib/debug-settings'
import type { DebugPath, DebugSettings, EndpointOverride } from '../lib/debug-settings'
import { Icon } from './Icon'

export default function DebugDrawer() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(getDebugSettings)
  const [applying, setApplying] = useState(false)
  const [message, setMessage] = useState('')
  const trigger = useRef<HTMLButtonElement>(null)
  const applied = useDebugSettings()
  const queryClient = useQueryClient()
  const activeCount =
    Object.values(applied.endpoints).filter((value) => value.scenario !== 'default' || value.delay !== null).length +
    Number(applied.bypassValidation)

  function close() {
    setOpen(false)
    trigger.current?.focus()
  }

  function update(path: DebugPath, value: Partial<EndpointOverride>) {
    setDraft((current) => ({
      ...current,
      endpoints: { ...current.endpoints, [path]: { ...current.endpoints[path], ...value } },
    }))
    setMessage('')
  }

  async function apply(next: DebugSettings, refresh = false) {
    if (!refresh) {
      setDebugSettings(next)
      setMessage('Applied. Data will use these settings on the next request.')
      return
    }

    setApplying(true)
    const filters = {
      predicate: (query: { queryKey: readonly unknown[] }) =>
        query.queryKey[0] === 'dashboard' || query.queryKey[0] === 'payees',
    }
    try {
      await queryClient.cancelQueries(filters)
      setDebugSettings(next)
      await queryClient.resetQueries(filters)
      setMessage('Applied. Dashboard data refreshed.')
    } finally {
      setApplying(false)
    }
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="debug-trigger"
        aria-expanded={open}
        aria-controls="debug-drawer"
        onClick={() => {
          if (open) close()
          else {
            setDraft(getDebugSettings())
            setMessage('')
            setOpen(true)
          }
        }}
      >
        Debug{activeCount > 0 && <span className="debug-count">{activeCount}</span>}
      </button>
      {open && (
        <aside
          id="debug-drawer"
          className="debug-drawer"
          aria-labelledby="debug-title"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation()
              close()
            }
          }}
        >
          <header className="debug-header">
            <div>
              <p className="eyebrow">Demo tools</p>
              <h2 id="debug-title">API debug controls</h2>
            </div>
            <button type="button" className="icon-button" aria-label="Close debug drawer" onClick={close} autoFocus>
              <Icon name="close" />
            </button>
          </header>
          <form
            className="debug-form"
            onSubmit={(event) => {
              event.preventDefault()
              apply(draft)
            }}
          >
            <div className="debug-content">
              <p className="muted">
                Apply settings to future requests, or apply and refresh data now. Settings reset on page refresh.
              </p>
              <fieldset className="debug-bypass" disabled={applying}>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.bypassValidation}
                    onChange={(event) => {
                      setDraft((current) => ({ ...current, bypassValidation: event.target.checked }))
                      setMessage('')
                    }}
                  />
                  Bypass form validation
                </label>
                <p className="muted">
                  Skip recipient, amount, balance and daily-limit checks in the transfer form. The API still validates
                  requests.
                </p>
              </fieldset>
              {DEBUG_ENDPOINTS.map((endpoint) => (
                <fieldset className="debug-endpoint" key={endpoint.path} disabled={applying}>
                  <legend>
                    <span>{endpoint.method}</span> <code>{endpoint.path}</code>
                  </legend>
                  <div className="debug-fields">
                    <label>
                      Response
                      <select
                        aria-label={`${endpoint.method} ${endpoint.path} response`}
                        value={draft.endpoints[endpoint.path].scenario}
                        disabled={endpoint.method !== 'GET'}
                        onChange={(event) =>
                          update(endpoint.path, { scenario: event.target.value as EndpointOverride['scenario'] })
                        }
                      >
                        <option value="default">Default</option>
                        {endpoint.method === 'GET' && <option value="error">500 · INTERNAL_ERROR</option>}
                        {endpoint.empty && <option value="empty">Empty list</option>}
                      </select>
                    </label>
                    <label>
                      Delay (ms)
                      <input
                        aria-label={`${endpoint.method} ${endpoint.path} delay`}
                        type="number"
                        min="0"
                        max="5000"
                        step="1"
                        placeholder="500"
                        value={draft.endpoints[endpoint.path].delay ?? ''}
                        onChange={(event) =>
                          update(endpoint.path, {
                            delay:
                              event.target.value === ''
                                ? null
                                : Math.min(5000, Math.max(0, Number(event.target.value))),
                          })
                        }
                      />
                    </label>
                  </div>
                  {endpoint.method === 'POST' && (
                    <p className="muted">To test a transfer error, include #fail in its note.</p>
                  )}
                </fieldset>
              ))}
              <p className="muted">Blank delay uses the API default (~500 ms). Maximum: 5000 ms.</p>
            </div>
            <footer className="debug-footer">
              <p className="muted" role="status">
                {applying ? 'Applying and refreshing…' : message || `${activeCount} active overrides`}
              </p>
              <div>
                <button
                  type="button"
                  className="button secondary"
                  disabled={applying}
                  onClick={() => {
                    const defaults = defaultDebugSettings()
                    setDraft(defaults)
                    apply(defaults, true)
                  }}
                >
                  Reset all
                </button>
                <button type="submit" className="button secondary" disabled={applying}>
                  Apply settings
                </button>
                <button type="button" className="button primary" disabled={applying} onClick={() => apply(draft, true)}>
                  Apply &amp; refresh
                </button>
              </div>
            </footer>
          </form>
        </aside>
      )}
    </>
  )
}
