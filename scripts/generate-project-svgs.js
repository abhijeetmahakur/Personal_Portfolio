import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Express REST API Graphic
function createExpressSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050811"/>
      <stop offset="50%" stop-color="#0c1322"/>
      <stop offset="100%" stop-color="#020409"/>
    </linearGradient>
    <linearGradient id="neonGreen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
    <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#818cf8"/>
    </linearGradient>
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(15, 23, 42, 0.85)"/>
      <stop offset="100%" stop-color="rgba(10, 15, 30, 0.92)"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1280" height="720" fill="url(#bg)"/>

  <!-- Grid Pattern -->
  <g stroke="rgba(255,255,255,0.03)" stroke-width="1">
    <line x1="160" y1="0" x2="160" y2="720"/>
    <line x1="320" y1="0" x2="320" y2="720"/>
    <line x1="480" y1="0" x2="480" y2="720"/>
    <line x1="640" y1="0" x2="640" y2="720"/>
    <line x1="800" y1="0" x2="800" y2="720"/>
    <line x1="960" y1="0" x2="960" y2="720"/>
    <line x1="1120" y1="0" x2="1120" y2="720"/>
    <line x1="0" y1="180" x2="1280" y2="180"/>
    <line x1="0" y1="360" x2="1280" y2="360"/>
    <line x1="0" y1="540" x2="1280" y2="540"/>
  </g>

  <!-- Ambient Glow Orbs -->
  <circle cx="280" cy="220" r="220" fill="#10b981" opacity="0.08" filter="url(#glow)"/>
  <circle cx="1020" cy="480" r="260" fill="#38bdf8" opacity="0.09" filter="url(#glow)"/>

  <!-- Top App Navigation Bar -->
  <rect x="40" y="32" width="1200" height="64" rx="16" fill="rgba(15, 23, 42, 0.7)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
  <circle cx="72" cy="64" r="6" fill="#ef4444"/>
  <circle cx="94" cy="64" r="6" fill="#f59e0b"/>
  <circle cx="116" cy="64" r="6" fill="#10b981"/>
  
  <text x="150" y="70" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" letter-spacing="1">EXPRESS // BACKEND REST API &amp; MICROSERVICES ARCHITECTURE</text>
  <rect x="1040" y="48" width="170" height="32" rx="8" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" stroke-width="1"/>
  <circle cx="1060" cy="64" r="4" fill="#10b981"/>
  <text x="1074" y="69" fill="#10b981" font-family="monospace" font-size="12" font-weight="700">PORT 3001 ONLINE</text>

  <!-- Left Card: API Endpoints Table -->
  <rect x="40" y="116" width="600" height="564" rx="20" fill="url(#cardBg)" stroke="rgba(56, 189, 248, 0.3)" stroke-width="1.5" filter="url(#glow)"/>
  <text x="72" y="160" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="800">REST API ROUTE CONTROLLER</text>
  <text x="72" y="186" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="13">High-throughput Node.js microservices with JSON serialization</text>

  <!-- Endpoint 1 -->
  <g transform="translate(68, 210)">
    <rect width="544" height="68" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    <rect x="16" y="18" width="56" height="32" rx="6" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" stroke-width="1"/>
    <text x="44" y="39" fill="#10b981" font-family="monospace" font-size="13" font-weight="700" text-anchor="middle">GET</text>
    <text x="86" y="39" fill="#f1f5f9" font-family="monospace" font-size="14" font-weight="600">/api/projects</text>
    <rect x="360" y="20" width="76" height="28" rx="6" fill="rgba(16, 185, 129, 0.15)"/>
    <text x="398" y="39" fill="#34d399" font-family="monospace" font-size="12" font-weight="700" text-anchor="middle">200 OK</text>
    <text x="490" y="39" fill="#64748b" font-family="monospace" font-size="12">12ms</text>
  </g>

  <!-- Endpoint 2 -->
  <g transform="translate(68, 290)">
    <rect width="544" height="68" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    <rect x="16" y="18" width="56" height="32" rx="6" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" stroke-width="1"/>
    <text x="44" y="39" fill="#38bdf8" font-family="monospace" font-size="13" font-weight="700" text-anchor="middle">POST</text>
    <text x="86" y="39" fill="#f1f5f9" font-family="monospace" font-size="14" font-weight="600">/api/projects/generate</text>
    <rect x="360" y="20" width="76" height="28" rx="6" fill="rgba(16, 185, 129, 0.15)"/>
    <text x="398" y="39" fill="#34d399" font-family="monospace" font-size="12" font-weight="700" text-anchor="middle">201 CRE</text>
    <text x="490" y="39" fill="#64748b" font-family="monospace" font-size="12">38ms</text>
  </g>

  <!-- Endpoint 3 -->
  <g transform="translate(68, 370)">
    <rect width="544" height="68" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    <rect x="16" y="18" width="56" height="32" rx="6" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" stroke-width="1"/>
    <text x="44" y="39" fill="#38bdf8" font-family="monospace" font-size="13" font-weight="700" text-anchor="middle">POST</text>
    <text x="86" y="39" fill="#f1f5f9" font-family="monospace" font-size="14" font-weight="600">/api/sync/github</text>
    <rect x="360" y="20" width="76" height="28" rx="6" fill="rgba(16, 185, 129, 0.15)"/>
    <text x="398" y="39" fill="#34d399" font-family="monospace" font-size="12" font-weight="700" text-anchor="middle">200 OK</text>
    <text x="490" y="39" fill="#64748b" font-family="monospace" font-size="12">45ms</text>
  </g>

  <!-- Endpoint 4 -->
  <g transform="translate(68, 450)">
    <rect width="544" height="68" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    <rect x="16" y="18" width="56" height="32" rx="6" fill="rgba(129, 140, 248, 0.2)" stroke="#818cf8" stroke-width="1"/>
    <text x="44" y="39" fill="#818cf8" font-family="monospace" font-size="13" font-weight="700" text-anchor="middle">PUT</text>
    <text x="86" y="39" fill="#f1f5f9" font-family="monospace" font-size="14" font-weight="600">/api/portfolio</text>
    <rect x="360" y="20" width="76" height="28" rx="6" fill="rgba(16, 185, 129, 0.15)"/>
    <text x="398" y="39" fill="#34d399" font-family="monospace" font-size="12" font-weight="700" text-anchor="middle">200 OK</text>
    <text x="490" y="39" fill="#64748b" font-family="monospace" font-size="12">18ms</text>
  </g>

  <!-- Telemetry Row inside Left Card -->
  <g transform="translate(68, 540)">
    <rect width="170" height="100" rx="12" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)"/>
    <text x="20" y="36" fill="#64748b" font-family="system-ui, sans-serif" font-size="12" font-weight="600">THROUGHPUT</text>
    <text x="20" y="72" fill="#10b981" font-family="monospace" font-size="24" font-weight="800">1,480 <tspan font-size="13" fill="#94a3b8">req/s</tspan></text>

    <rect x="186" y="0" width="170" height="100" rx="12" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)"/>
    <text x="206" y="36" fill="#64748b" font-family="system-ui, sans-serif" font-size="12" font-weight="600">UPTIME</text>
    <text x="206" y="72" fill="#38bdf8" font-family="monospace" font-size="24" font-weight="800">99.98%</text>

    <rect x="372" y="0" width="172" height="100" rx="12" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)"/>
    <text x="392" y="36" fill="#64748b" font-family="system-ui, sans-serif" font-size="12" font-weight="600">HEAP USAGE</text>
    <text x="392" y="72" fill="#a78bfa" font-family="monospace" font-size="24" font-weight="800">42.6 <tspan font-size="13" fill="#94a3b8">MB</tspan></text>
  </g>

  <!-- Right Card: Live JSON Inspector -->
  <rect x="664" y="116" width="576" height="564" rx="20" fill="url(#cardBg)" stroke="rgba(16, 185, 129, 0.3)" stroke-width="1.5" filter="url(#glow)"/>
  <rect x="664" y="116" width="576" height="48" rx="20" fill="rgba(255,255,255,0.03)"/>
  <text x="696" y="146" fill="#38bdf8" font-family="monospace" font-size="14" font-weight="700">RESPONSE PAYLOAD // application/json</text>

  <g transform="translate(696, 195)" font-family="monospace" font-size="15" font-weight="500">
    <text y="0" fill="#94a3b8">{</text>
    <text y="28" fill="#38bdf8">  "success"<tspan fill="#94a3b8">: </tspan><tspan fill="#34d399">true</tspan><tspan fill="#94a3b8">,</tspan></text>
    <text y="56" fill="#38bdf8">  "server"<tspan fill="#94a3b8">: </tspan><tspan fill="#fde047">"Express/4.18 (Node.js v20)"</tspan><tspan fill="#94a3b8">,</tspan></text>
    <text y="84" fill="#38bdf8">  "cluster"<tspan fill="#94a3b8">: </tspan><tspan fill="#fde047">"primary-worker-01"</tspan><tspan fill="#94a3b8">,</tspan></text>
    <text y="112" fill="#38bdf8">  "endpoints"<tspan fill="#94a3b8">: [</tspan></text>
    <text y="140" fill="#fde047">    "/api/projects"<tspan fill="#94a3b8">,</tspan></text>
    <text y="168" fill="#fde047">    "/api/projects/generate-image"<tspan fill="#94a3b8">,</tspan></text>
    <text y="196" fill="#fde047">    "/api/sync/github"<tspan fill="#94a3b8">,</tspan></text>
    <text y="224" fill="#fde047">    "/api/certificates"</text>
    <text y="252" fill="#94a3b8">  ],</text>
    <text y="280" fill="#38bdf8">  "rateLimit"<tspan fill="#94a3b8">: { </tspan><tspan fill="#38bdf8">"limit"</tspan><tspan fill="#94a3b8">: </tspan><tspan fill="#fde047">500</tspan><tspan fill="#94a3b8">, </tspan><tspan fill="#38bdf8">"remaining"</tspan><tspan fill="#94a3b8">: </tspan><tspan fill="#fde047">498</tspan><tspan fill="#94a3b8"> },</tspan></text>
    <text y="308" fill="#38bdf8">  "telemetry"<tspan fill="#94a3b8">: {</tspan></text>
    <text y="336" fill="#38bdf8">    "status"<tspan fill="#94a3b8">: </tspan><tspan fill="#34d399">"HEALTHY_OPTIMAL"</tspan><tspan fill="#94a3b8">,</tspan></text>
    <text y="364" fill="#38bdf8">    "activeConnections"<tspan fill="#94a3b8">: </tspan><tspan fill="#fde047">24</tspan><tspan fill="#94a3b8">,</tspan></text>
    <text y="392" fill="#38bdf8">    "latencyP99"<tspan fill="#94a3b8">: </tspan><tspan fill="#fde047">"18.4ms"</tspan></text>
    <text y="420" fill="#94a3b8">  }</text>
    <text y="448" fill="#94a3b8">}</text>
  </g>
</svg>`;
}

// 2. LocalRepo Git Architecture Graphic
function createLocalRepoSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070a14"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="gitOrange" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#fb923c"/>
    </linearGradient>
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <rect width="1280" height="720" fill="url(#bg)"/>

  <!-- Top App Navigation -->
  <rect x="40" y="32" width="1200" height="64" rx="16" fill="rgba(15, 23, 42, 0.7)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
  <circle cx="72" cy="64" r="6" fill="#ef4444"/>
  <circle cx="94" cy="64" r="6" fill="#f59e0b"/>
  <circle cx="116" cy="64" r="6" fill="#10b981"/>
  <text x="150" y="70" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="16" font-weight="700" letter-spacing="1">LOCALREPO // GIT ARCHITECTURE &amp; VERSION CONTROL TOPOLOGY</text>

  <!-- Left: Git Branch Tree Visualizer -->
  <rect x="40" y="116" width="680" height="564" rx="20" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(249, 115, 22, 0.35)" stroke-width="1.5" filter="url(#glow)"/>
  <text x="72" y="160" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="20" font-weight="800">BRANCH GRAPH &amp; COMMIT TOPOLOGY</text>
  <text x="72" y="186" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">Interactive Git DAG visualization with fast-forward merging &amp; CI telemetry</text>

  <!-- Branch Lines -->
  <!-- main branch (orange) -->
  <line x1="120" y1="260" x2="620" y2="260" stroke="#f97316" stroke-width="4" stroke-linecap="round"/>
  <!-- feature/cms branch (cyan) -->
  <path d="M 220 260 C 260 260, 260 360, 300 360 L 520 360 C 560 360, 560 260, 600 260" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
  <!-- hotfix branch (violet) -->
  <path d="M 320 260 C 350 260, 350 460, 380 460 L 460 460 C 490 460, 490 260, 520 260" fill="none" stroke="#a855f7" stroke-width="3" stroke-linecap="round"/>

  <!-- Commits on main -->
  <circle cx="120" cy="260" r="14" fill="#0f172a" stroke="#f97316" stroke-width="4"/>
  <text x="120" y="300" fill="#f97316" font-family="monospace" font-size="11" font-weight="700" text-anchor="middle">c1a90b</text>

  <circle cx="220" cy="260" r="14" fill="#0f172a" stroke="#f97316" stroke-width="4"/>
  <text x="220" y="300" fill="#f97316" font-family="monospace" font-size="11" font-weight="700" text-anchor="middle">748709</text>

  <circle cx="320" cy="260" r="14" fill="#0f172a" stroke="#f97316" stroke-width="4"/>
  <text x="320" y="300" fill="#f97316" font-family="monospace" font-size="11" font-weight="700" text-anchor="middle">4fe4d0</text>

  <circle cx="620" cy="260" r="16" fill="#f97316" stroke="#fff" stroke-width="3"/>
  <text x="620" y="302" fill="#f97316" font-family="monospace" font-size="12" font-weight="800" text-anchor="middle">HEAD</text>

  <!-- Commits on feature/cms -->
  <circle cx="360" cy="360" r="12" fill="#0f172a" stroke="#38bdf8" stroke-width="3"/>
  <text x="360" y="396" fill="#38bdf8" font-family="monospace" font-size="11" font-weight="700" text-anchor="middle">feat/cms</text>
  <circle cx="460" cy="360" r="12" fill="#0f172a" stroke="#38bdf8" stroke-width="3"/>

  <!-- Commits on hotfix -->
  <circle cx="420" cy="460" r="10" fill="#0f172a" stroke="#a855f7" stroke-width="3"/>
  <text x="420" y="492" fill="#a855f7" font-family="monospace" font-size="11" font-weight="700" text-anchor="middle">fix/sync</text>

  <!-- Status pills below -->
  <g transform="translate(72, 540)">
    <rect width="280" height="90" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)"/>
    <text x="20" y="32" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">ACTIVE BRANCH</text>
    <text x="20" y="66" fill="#f97316" font-family="monospace" font-size="22" font-weight="800">main <tspan fill="#10b981" font-size="14">[synced]</tspan></text>

    <rect x="300" y="0" width="280" height="90" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)"/>
    <text x="320" y="32" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">COMMITS AHEAD</text>
    <text x="320" y="66" fill="#38bdf8" font-family="monospace" font-size="22" font-weight="800">0 · Clean Tree</text>
  </g>

  <!-- Right: Terminal Execution Log -->
  <rect x="744" y="116" width="496" height="564" rx="20" fill="rgba(10, 15, 30, 0.95)" stroke="rgba(56, 189, 248, 0.3)" stroke-width="1.5" filter="url(#glow)"/>
  <text x="776" y="160" fill="#38bdf8" font-family="monospace" font-size="15" font-weight="700">TERMINAL // GIT WORKSPACE</text>
  
  <g transform="translate(776, 210)" font-family="monospace" font-size="14">
    <text y="0" fill="#10b981">$ git status</text>
    <text y="26" fill="#94a3b8">On branch main</text>
    <text y="50" fill="#94a3b8">Your branch is up to date with 'origin/main'.</text>
    <text y="74" fill="#34d399">nothing to commit, working tree clean</text>

    <text y="124" fill="#10b981">$ git log -n 3 --oneline</text>
    <text y="150" fill="#f97316">00fd3dc <tspan fill="#f1f5f9">feat: 1-click automatic AI project image generator</tspan></text>
    <text y="174" fill="#f97316">f30c406 <tspan fill="#f1f5f9">chore: update sync log timestamps</tspan></text>
    <text y="198" fill="#f97316">4fe4d01 <tspan fill="#f1f5f9">feat: ultra-HD certificates archive</tspan></text>

    <text y="248" fill="#10b981">$ git remote -v</text>
    <text y="274" fill="#94a3b8">origin  https://github.com/abhijeetmahakur/...</text>

    <text y="324" fill="#10b981">$ git push origin main</text>
    <text y="350" fill="#38bdf8">Enumerating objects: 12, done.</text>
    <text y="374" fill="#38bdf8">Writing objects: 100% (12/12), 4.2 KiB</text>
    <text y="398" fill="#34d399">✓ Successfully pushed to GitHub origin/main</text>
  </g>
</svg>`;
}

// 3. Demo Sandbox Graphic
function createDemoSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080c18"/>
      <stop offset="50%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#030712"/>
    </linearGradient>
    <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <rect width="1280" height="720" fill="url(#bg)"/>

  <!-- Top App Navigation -->
  <rect x="40" y="32" width="1200" height="64" rx="16" fill="rgba(15, 23, 42, 0.7)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
  <circle cx="72" cy="64" r="6" fill="#ef4444"/>
  <circle cx="94" cy="64" r="6" fill="#f59e0b"/>
  <circle cx="116" cy="64" r="6" fill="#10b981"/>
  <text x="150" y="70" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="16" font-weight="700" letter-spacing="1">DEMO // FOUNDATIONS &amp; CODE EXPERIMENTATION SANDBOX</text>

  <!-- Left: Code Editor Component -->
  <rect x="40" y="116" width="600" height="564" rx="20" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(168, 85, 247, 0.35)" stroke-width="1.5" filter="url(#glow)"/>
  <text x="72" y="160" fill="#c084fc" font-family="monospace" font-size="16" font-weight="700">App.jsx // Reactive State Engine</text>

  <g transform="translate(72, 205)" font-family="monospace" font-size="15">
    <text y="0" fill="#a855f7">import <tspan fill="#f1f5f9">{ useState, useEffect }</tspan> from <tspan fill="#34d399">'react'</tspan>;</text>
    <text y="32" fill="#a855f7">import <tspan fill="#f1f5f9">{ Canvas, Motion }</tspan> from <tspan fill="#34d399">'@web/engine'</tspan>;</text>
    
    <text y="90" fill="#60a5fa">export default function <tspan fill="#facc15">SandboxDemo</tspan>() {</text>
    <text y="122" fill="#94a3b8">  const [metrics, setMetrics] = useState({</text>
    <text y="150" fill="#38bdf8">    fps<tspan fill="#94a3b8">: </tspan><tspan fill="#fde047">60</tspan><tspan fill="#94a3b8">,</tspan></text>
    <text y="178" fill="#38bdf8">    renderTime<tspan fill="#94a3b8">: </tspan><tspan fill="#fde047">'2.4ms'</tspan><tspan fill="#94a3b8">,</tspan></text>
    <text y="206" fill="#38bdf8">    interactive<tspan fill="#94a3b8">: </tspan><tspan fill="#34d399">true</tspan></text>
    <text y="234" fill="#94a3b8">  });</text>
    
    <text y="284" fill="#60a5fa">  return (</text>
    <text y="312" fill="#94a3b8">    &lt;<tspan fill="#38bdf8">InteractiveViewport</tspan>&gt;</text>
    <text y="340" fill="#94a3b8">      &lt;<tspan fill="#38bdf8">ParticleCanvas</tspan> count={<tspan fill="#fde047">1500</tspan>} /&gt;</text>
    <text y="368" fill="#94a3b8">      &lt;<tspan fill="#38bdf8">HUDTelemetry</tspan> data={metrics} /&gt;</text>
    <text y="396" fill="#94a3b8">    &lt;/<tspan fill="#38bdf8">InteractiveViewport</tspan>&gt;</text>
    <text y="424" fill="#60a5fa">  );</text>
    <text y="452" fill="#60a5fa">}</text>
  </g>

  <!-- Right: Live Interactive Render Preview -->
  <rect x="664" y="116" width="576" height="564" rx="20" fill="rgba(10, 15, 30, 0.95)" stroke="rgba(56, 189, 248, 0.35)" stroke-width="1.5" filter="url(#glow)"/>
  <rect x="664" y="116" width="576" height="48" rx="20" fill="rgba(255,255,255,0.03)"/>
  <text x="696" y="146" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="14" font-weight="700">LIVE RENDER VIEWPORT (60 FPS)</text>

  <!-- Interactive Graphic Orbs in Right Panel -->
  <g transform="translate(952, 380)">
    <circle cx="0" cy="0" r="140" fill="none" stroke="url(#purpleGrad)" stroke-width="3" stroke-dasharray="8 6"/>
    <circle cx="0" cy="0" r="100" fill="none" stroke="#38bdf8" stroke-width="2"/>
    <circle cx="0" cy="0" r="60" fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" stroke-width="3" filter="url(#glow)"/>
    <circle cx="0" cy="0" r="18" fill="#38bdf8" filter="url(#glow)"/>
    
    <!-- Orbiting Nodes -->
    <circle cx="-100" cy="0" r="8" fill="#facc15"/>
    <circle cx="70" cy="-70" r="10" fill="#10b981"/>
    <circle cx="0" cy="140" r="9" fill="#f43f5e"/>
  </g>

  <!-- Telemetry stats -->
  <g transform="translate(696, 570)">
    <rect width="160" height="70" rx="10" fill="rgba(255,255,255,0.03)"/>
    <text x="20" y="28" fill="#64748b" font-family="system-ui, sans-serif" font-size="11">FRAMERATE</text>
    <text x="20" y="54" fill="#10b981" font-family="monospace" font-size="20" font-weight="800">60 FPS</text>

    <rect x="176" y="0" width="160" height="70" rx="10" fill="rgba(255,255,255,0.03)"/>
    <text x="196" y="28" fill="#64748b" font-family="system-ui, sans-serif" font-size="11">PARTICLES</text>
    <text x="196" y="54" fill="#38bdf8" font-family="monospace" font-size="20" font-weight="800">1,500</text>

    <rect x="352" y="0" width="160" height="70" rx="10" fill="rgba(255,255,255,0.03)"/>
    <text x="372" y="28" fill="#64748b" font-family="system-ui, sans-serif" font-size="11">RENDER TIME</text>
    <text x="372" y="54" fill="#c084fc" font-family="monospace" font-size="20" font-weight="800">2.4 ms</text>
  </g>
</svg>`;
}

fs.writeFileSync(path.join(rootDir, 'public', 'project_express.svg'), createExpressSvg());
fs.writeFileSync(path.join(rootDir, 'public', 'project_localrepo.svg'), createLocalRepoSvg());
fs.writeFileSync(path.join(rootDir, 'public', 'project_demo.svg'), createDemoSvg());

console.log('Successfully generated project_express.svg, project_localrepo.svg, and project_demo.svg in public/!');
