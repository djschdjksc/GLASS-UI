import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { spawn } from 'child_process'
import http from 'http'
import path from 'path'

// Automatically ensures the PyQt6 Print Server (F:\SUMMARY 1:1 Engine) is running
function autoStartPythonPrintEngine(): Plugin {
  return {
    name: 'auto-start-python-print-engine',
    configureServer() {
      // Check if port 5005 is already alive
      const req = http.get('http://127.0.0.1:5005/api/status', (res) => {
        if (res.statusCode === 200) {
          console.log('\x1b[32m%s\x1b[0m', '⚡ [Print Engine] Python PyQt6 Native Server active on http://127.0.0.1:5005')
        }
      })

      req.on('error', () => {
        console.log('\x1b[33m%s\x1b[0m', '⚡ [Print Engine] Spawning Python PyQt6 Native Server (port 5005)...')
        const pyScript = path.resolve(__dirname, 'server/native_print_server.py')
        const pyProc = spawn('python', [pyScript], {
          stdio: 'ignore',
          detached: true,
          shell: true,
        })
        pyProc.unref()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), autoStartPythonPrintEngine()],
  server: {
    host: true,
    port: 5173,
    open: true,
  },
})
