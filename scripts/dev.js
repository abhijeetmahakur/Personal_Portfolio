import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('----------------------------------------------------');
console.log('🚀 Starting Full-Stack Dev Environment (Frontend + Backend)...');
console.log('----------------------------------------------------\n');

const nodeExe = process.execPath;
const viteBin = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
const serverScript = path.join(rootDir, 'server', 'server.js');

let backendProcess = null;
let frontendProcess = null;

function startBackend() {
  backendProcess = spawn(nodeExe, [serverScript], {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  backendProcess.on('exit', (code, signal) => {
    if (signal !== 'SIGINT' && signal !== 'SIGTERM' && code !== 0 && code !== null) {
      console.warn(`\n[Backend] Server exited with code ${code}. Restarting in 2s...`);
      setTimeout(startBackend, 2000);
    }
  });
}

function startFrontend() {
  frontendProcess = spawn(nodeExe, [viteBin, '--host'], {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  frontendProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.warn(`[Frontend] Vite exited with code ${code}`);
    }
  });
}

startBackend();
startFrontend();

function cleanup() {
  console.log('\n🛑 Shutting down dev servers...');
  if (backendProcess) {
    try {
      backendProcess.kill();
    } catch (_) {}
  }
  if (frontendProcess) {
    try {
      frontendProcess.kill();
    } catch (_) {}
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
