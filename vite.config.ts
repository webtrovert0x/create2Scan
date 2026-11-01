import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    define: {
      // Injects REOWN_ID directly so the user can use REOWN_ID instead of VITE_REOWN_ID in .env
      'process.env.REOWN_ID': JSON.stringify(env.REOWN_ID || ''),
      'process.env.VITE_CONTRACT_ADDRESS': JSON.stringify(env.VITE_CONTRACT_ADDRESS || ''),
    },
    server: {
      port: 5173,
    },
  }
})

