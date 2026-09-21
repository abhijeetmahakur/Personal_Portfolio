import { defineConfig } from 'vite';
import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Vite plugin to ensure Express backend on port 3001 is automatically started when Vite runs
function autoBackendPlugin() {
  let backendChild = null;

  function isPortInUse(port) {
    return new Promise((resolve) => {
      const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
        resolve(true);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(500, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  return {
    name: 'auto-backend-server',
    async configureServer(server) {
      const inUse = await isPortInUse(3001);
      if (!inUse) {
        console.log('\n[Vite] Starting Express Backend server on port 3001...');
        const serverScript = path.join(__dirname, 'server', 'server.js');
        backendChild = spawn(process.execPath, [serverScript], {
          cwd: __dirname,
          stdio: 'inherit',
          env: { ...process.env, FORCE_COLOR: '1' }
        });

        backendChild.on('exit', (code) => {
          if (code !== 0 && code !== null) {
            console.warn(`[Vite Plugin] Backend server exited with code ${code}`);
          }
        });
      } else {
        console.log('[Vite] Backend server is already running on port 3001.');
      }

      const cleanup = () => {
        if (backendChild) {
          try {
            backendChild.kill();
          } catch (_) {}
          backendChild = null;
        }
      };

      server.httpServer?.on('close', cleanup);
      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
      process.on('exit', cleanup);
    }
  };
}

export default defineConfig({
  plugins: [autoBackendPlugin()],
  server: {
    port: 5173,
    open: false,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            if (!res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                message: 'Backend server is starting up or offline on port 3001. Please ensure backend server is running.',
                error: err.message
              }));
            }
          });
        }
      },
      '/uploads': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            if (!res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'text/plain' });
              res.end('Upload asset unavailable (backend offline).');
            }
          });
        }
      },
    },
  },
  publicDir: 'public',
});
