import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        // Zod's explanatory comments mention pure annotations without using them.
        if (warning.code === 'INVALID_ANNOTATION' && warning.id?.includes('/node_modules/zod/')) return
        defaultHandler(warning)
      },
    },
  },
  // Optional: use the Node mock server instead of MSW.
  // server: { proxy: { '/api': 'http://localhost:4010' } },
})
