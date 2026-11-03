import '@testing-library/jest-dom/vitest'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { handlers, resetMockDb } from '../mocks/handlers'
import { defaultDebugSettings, setDebugSettings } from '../lib/debug-settings'

export const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => {
  resetMockDb()
  setDebugSettings(defaultDebugSettings())
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
