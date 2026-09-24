import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

// --- COMMON SVG DEFS & HELPERS ---
function wrapSvg(title, subtitle, content, color1 = '#38bdf8', color2 = '#818cf8') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050814"/>
      <stop offset="50%" stop-color="#0c1326"/>
      <stop offset="100%" stop-color="#02040a"/>
    </linearGradient>
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(15, 23, 42, 0.88)"/>
      <stop offset="100%" stop-color="rgba(10, 15, 30, 0.94)"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color1}"/>
      <stop offset="100%" stop-color="${color2}"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1280" height="720" fill="url(#bg)"/>

  <!-- Subtle Cyber Grid -->
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

  <!-- Ambient Light Orbs -->
  <circle cx="240" cy="180" r="220" fill="${color1}" opacity="0.08" filter="url(#glow)"/>
  <circle cx="1060" cy="500" r="260" fill="${color2}" opacity="0.08" filter="url(#glow)"/>

  <!-- Top App Navigation Bar -->
  <rect x="40" y="30" width="1200" height="60" rx="14" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
  <circle cx="70" cy="60" r="6" fill="#ef4444"/>
  <circle cx="92" cy="60" r="6" fill="#f59e0b"/>
  <circle cx="114" cy="60" r="6" fill="#10b981"/>
  
  <text x="145" y="66" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" letter-spacing="1">${title}</text>
  <text x="1200" y="66" fill="#94a3b8" font-family="monospace" font-size="12" font-weight="600" text-anchor="end">${subtitle}</text>

  <!-- Content Body -->
  ${content}
</svg>`;
}

// 1. Personal Portfolio & CMS
function createPersonalPortfolioSvg() {
  const content = `
  <rect x="40" y="110" width="580" height="570" rx="18" fill="url(#cardBg)" stroke="rgba(56, 189, 248, 0.35)" stroke-width="1.5" filter="url(#glow)"/>
  <text x="70" y="155" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="22" font-weight="800">ABHIJEET MAHAKUR // PORTFOLIO</text>
  <text x="70" y="180" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13" font-weight="600">Full-Stack Software Developer &amp; AI Engineer · B.Tech CSE</text>

  <g transform="translate(68, 205)">
    <!-- TruckFlow -->
    <rect width="524" height="74" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(56, 189, 248, 0.25)" stroke-width="1"/>
    <text x="20" y="32" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="16" font-weight="700">TruckFlow — Freight Logistics AI</text>
    <text x="20" y="54" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">Round-trip optimizer, GPS telemetry, route profit calculation</text>
    <rect x="420" y="24" width="84" height="26" rx="6" fill="rgba(56, 189, 248, 0.15)"/>
    <text x="462" y="41" fill="#38bdf8" font-family="monospace" font-size="11" font-weight="700" text-anchor="middle">PYTHON</text>

    <!-- Spotify Clone -->
    <g transform="translate(0, 86)">
      <rect width="524" height="74" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(16, 185, 129, 0.25)" stroke-width="1"/>
      <text x="20" y="32" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="16" font-weight="700">Spotify Clone — Audio Streaming</text>
      <text x="20" y="54" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">Interactive song queue, glowing audio waveforms, modern UI</text>
      <rect x="420" y="24" width="84" height="26" rx="6" fill="rgba(16, 185, 129, 0.15)"/>
      <text x="462" y="41" fill="#34d399" font-family="monospace" font-size="11" font-weight="700" text-anchor="middle">WEB APP</text>
    </g>

    <!-- GraviSphere -->
    <g transform="translate(0, 172)">
      <rect width="524" height="74" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(168, 85, 247, 0.25)" stroke-width="1"/>
      <text x="20" y="32" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="16" font-weight="700">GraviSphere — Physics Simulation</text>
      <text x="20" y="54" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">Simulated gravity control, celestial orbital physics, 60 FPS</text>
      <rect x="420" y="24" width="84" height="26" rx="6" fill="rgba(168, 85, 247, 0.15)"/>
      <text x="462" y="41" fill="#c084fc" font-family="monospace" font-size="11" font-weight="700" text-anchor="middle">REACT</text>
    </g>

    <!-- Air Writing -->
    <g transform="translate(0, 258)">
      <rect width="524" height="74" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(234, 179, 8, 0.25)" stroke-width="1"/>
      <text x="20" y="32" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="16" font-weight="700">Air Writing — Computer Vision AI</text>
      <text x="20" y="54" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">MediaPipe 21 landmark hand tracking, contactless mid-air canvas</text>
      <rect x="420" y="24" width="84" height="26" rx="6" fill="rgba(234, 179, 8, 0.15)"/>
      <text x="462" y="41" fill="#facc15" font-family="monospace" font-size="11" font-weight="700" text-anchor="middle">OPENCV</text>
    </g>
  </g>

  <!-- Metrics row -->
  <g transform="translate(68, 565)">
    <rect width="160" height="90" rx="12" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)"/>
    <text x="20" y="30" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">FEATURED REPOS</text>
    <text x="20" y="66" fill="#38bdf8" font-family="monospace" font-size="26" font-weight="800">15</text>

    <rect x="180" y="0" width="160" height="90" rx="12" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)"/>
    <text x="200" y="30" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">CREDENTIALS</text>
    <text x="200" y="66" fill="#34d399" font-family="monospace" font-size="26" font-weight="800">7 Verified</text>

    <rect x="360" y="0" width="164" height="90" rx="12" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)"/>
    <text x="380" y="30" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">ARCHITECTURE</text>
    <text x="380" y="66" fill="#c084fc" font-family="monospace" font-size="20" font-weight="800">Full-Stack</text>
  </g>

  <!-- Right Column: Dual-Auth CMS & Terminal Stream -->
  <rect x="644" y="110" width="596" height="570" rx="18" fill="url(#cardBg)" stroke="rgba(168, 85, 247, 0.35)" stroke-width="1.5" filter="url(#glow)"/>
  <text x="674" y="155" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="20" font-weight="800">HEADLESS CMS &amp; DUAL-AUTH SECURITY</text>
  <text x="674" y="180" fill="#a78bfa" font-family="system-ui, sans-serif" font-size="13">Google OAuth 2.0 + Gmail OTP Multi-Factor Verification</text>

  <g transform="translate(674, 210)">
    <rect width="536" height="110" rx="12" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)"/>
    <circle cx="45" cy="55" r="24" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" stroke-width="2"/>
    <path d="M 37 55 L 43 61 L 55 47" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round"/>
    <text x="85" y="44" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="16" font-weight="700">Authenticated Admin: abhijeetmahakur67@gmail.com</text>
    <text x="85" y="68" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">Session Status: ACTIVE · Multi-factor OTP Verified</text>
    <text x="85" y="90" fill="#34d399" font-family="monospace" font-size="12">ENCRYPTION: AES-256 · JWT Bearer Signed</text>
  </g>

  <g transform="translate(674, 345)" font-family="monospace" font-size="14">
    <rect width="536" height="310" rx="12" fill="rgba(5, 8, 18, 0.9)" stroke="rgba(255,255,255,0.06)"/>
    <text x="24" y="34" fill="#38bdf8">// Headless CMS Auto-Sync Engine</text>
    <text x="24" y="64" fill="#f8fafc">const portfolio = await cms.getProfile({</text>
    <text x="44" y="94" fill="#38bdf8">  developer: <tspan fill="#fde047">"Abhijeet Mahakur"</tspan>,</text>
    <text x="44" y="124" fill="#38bdf8">  degree: <tspan fill="#fde047">"B.Tech CSE (ITER SOA University)"</tspan>,</text>
    <text x="44" y="154" fill="#38bdf8">  autoSync: <tspan fill="#34d399">true</tspan>,</text>
    <text x="44" y="184" fill="#38bdf8">  geminiTopicEngine: <tspan fill="#34d399">true</tspan>,</text>
    <text x="44" y="214" fill="#38bdf8">  features: [<tspan fill="#fde047">"Lenis Canvas"</tspan>, <tspan fill="#fde047">"Vite"</tspan>, <tspan fill="#fde047">"Express API"</tspan>]</text>
    <text x="24" y="244" fill="#f8fafc">});</text>
    <text x="24" y="280" fill="#34d399">✓ 15 GitHub repositories synchronized in real-time</text>
  </g>
`;
  return wrapSvg('PERSONAL PORTFOLIO &amp; CMS // ARCHITECTURE DASHBOARD', 'ABHIJEET MAHAKUR', content, '#38bdf8', '#818cf8');
}

// 2. Amazon Clone
function createAmazonCloneSvg() {
  const content = `
  <rect x="40" y="110" width="1200" height="80" rx="14" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(245, 158, 11, 0.4)" stroke-width="1.5" filter="url(#glow)"/>
  <text x="70" y="158" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="28" font-weight="900" letter-spacing="-0.5">amazon<tspan fill="#38bdf8">.in</tspan></text>
  
  <rect x="230" y="130" width="600" height="42" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)"/>
  <text x="250" y="156" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="14">Search Amazon Clone for electronics, laptops, monitors...</text>
  <rect x="780" y="130" width="50" height="42" rx="8" fill="#f59e0b"/>
  <text x="805" y="157" fill="#000" font-family="system-ui, sans-serif" font-size="18" text-anchor="middle">🔍</text>

  <text x="940" y="148" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">Hello, Sign in</text>
  <text x="940" y="165" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">Account &amp; Lists</text>
  <text x="1070" y="148" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">Returns</text>
  <text x="1070" y="165" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="700">&amp; Orders</text>
  <rect x="1150" y="130" width="70" height="40" rx="8" fill="rgba(245, 158, 11, 0.15)" stroke="#f59e0b"/>
  <text x="1185" y="156" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="14" font-weight="800" text-anchor="middle">🛒 3</text>

  <rect x="40" y="210" width="1200" height="110" rx="14" fill="linear-gradient(90deg, #1e293b, #0f172a)" stroke="rgba(255,255,255,0.08)"/>
  <text x="80" y="260" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="28" font-weight="800">Great Indian Festival Deals &amp; Tech Essentials</text>
  <text x="80" y="292" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="16" font-weight="600">Up to 60% off on Laptops, Mechanical Keyboards &amp; Gaming Monitors · Prime Free Delivery</text>

  <g transform="translate(40, 345)">
    <!-- Item 1 -->
    <rect width="280" height="335" rx="14" fill="url(#cardBg)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <rect x="20" y="20" width="240" height="160" rx="10" fill="rgba(255,255,255,0.03)"/>
    <circle cx="140" cy="100" r="50" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" stroke-width="2"/>
    <text x="140" y="108" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="36" text-anchor="middle">🎧</text>
    <text x="20" y="210" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="15" font-weight="700">Wireless ANC Headphones</text>
    <text x="20" y="235" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="13">★★★★★ (4.8)</text>
    <text x="20" y="265" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="20" font-weight="800">₹4,999 <tspan fill="#94a3b8" font-size="13" text-decoration="line-through">₹8,999</tspan></text>
    <rect x="20" y="285" width="240" height="34" rx="8" fill="#f59e0b"/>
    <text x="140" y="307" fill="#000" font-family="system-ui, sans-serif" font-size="13" font-weight="800" text-anchor="middle">Add to Cart</text>

    <!-- Item 2 -->
    <g transform="translate(305, 0)">
      <rect width="280" height="335" rx="14" fill="url(#cardBg)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      <rect x="20" y="20" width="240" height="160" rx="10" fill="rgba(255,255,255,0.03)"/>
      <circle cx="140" cy="100" r="50" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" stroke-width="2"/>
      <text x="140" y="108" fill="#10b981" font-family="system-ui, sans-serif" font-size="36" text-anchor="middle">⌨️</text>
      <text x="20" y="210" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="15" font-weight="700">RGB Mechanical Keyboard</text>
      <text x="20" y="235" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="13">★★★★★ (4.9)</text>
      <text x="20" y="265" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="20" font-weight="800">₹3,499 <tspan fill="#94a3b8" font-size="13" text-decoration="line-through">₹5,999</tspan></text>
      <rect x="20" y="285" width="240" height="34" rx="8" fill="#f59e0b"/>
      <text x="140" y="307" fill="#000" font-family="system-ui, sans-serif" font-size="13" font-weight="800" text-anchor="middle">Add to Cart</text>
    </g>

    <!-- Item 3 -->
    <g transform="translate(610, 0)">
      <rect width="280" height="335" rx="14" fill="url(#cardBg)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      <rect x="20" y="20" width="240" height="160" rx="10" fill="rgba(255,255,255,0.03)"/>
      <circle cx="140" cy="100" r="50" fill="rgba(168, 85, 247, 0.15)" stroke="#a855f7" stroke-width="2"/>
      <text x="140" y="108" fill="#a855f7" font-family="system-ui, sans-serif" font-size="36" text-anchor="middle">⌚</text>
      <text x="20" y="210" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="15" font-weight="700">Fitness Smartwatch v2</text>
      <text x="20" y="235" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="13">★★★★☆ (4.7)</text>
      <text x="20" y="265" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="20" font-weight="800">₹2,899 <tspan fill="#94a3b8" font-size="13" text-decoration="line-through">₹4,999</tspan></text>
      <rect x="20" y="285" width="240" height="34" rx="8" fill="#f59e0b"/>
      <text x="140" y="307" fill="#000" font-family="system-ui, sans-serif" font-size="13" font-weight="800" text-anchor="middle">Add to Cart</text>
    </g>

    <!-- Item 4 -->
    <g transform="translate(915, 0)">
      <rect width="285" height="335" rx="14" fill="url(#cardBg)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      <rect x="20" y="20" width="245" height="160" rx="10" fill="rgba(255,255,255,0.03)"/>
      <circle cx="142" cy="100" r="50" fill="rgba(244, 63, 94, 0.15)" stroke="#f43f5e" stroke-width="2"/>
      <text x="142" y="108" fill="#f43f5e" font-family="system-ui, sans-serif" font-size="36" text-anchor="middle">🖥️</text>
      <text x="20" y="210" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="15" font-weight="700">27" 165Hz Curved Monitor</text>
      <text x="20" y="235" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="13">★★★★★ (4.9)</text>
      <text x="20" y="265" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="20" font-weight="800">₹16,499 <tspan fill="#94a3b8" font-size="13" text-decoration="line-through">₹24,999</tspan></text>
      <rect x="20" y="285" width="245" height="34" rx="8" fill="#f59e0b"/>
      <text x="142" y="307" fill="#000" font-family="system-ui, sans-serif" font-size="13" font-weight="800" text-anchor="middle">Add to Cart</text>
    </g>
  </g>
`;
  return wrapSvg('AMAZON CLONE // E-COMMERCE WEB STOREFRONT', 'ABHIJEET MAHAKUR', content, '#f59e0b', '#38bdf8');
}

// 3. GraviSphere
function createGraviSphereSvg() {
  const content = `
  <rect x="40" y="110" width="380" height="570" rx="18" fill="url(#cardBg)" stroke="rgba(56, 189, 248, 0.35)" stroke-width="1.5" filter="url(#glow)"/>
  <text x="70" y="155" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="20" font-weight="800">SIMULATION PARAMETERS</text>
  <text x="70" y="180" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="12">Interactive Orbital Physics Engine</text>

  <g transform="translate(70, 215)">
    <text y="0" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">Gravitational Constant G</text>
    <line x1="0" y1="20" x2="320" y2="20" stroke="rgba(255,255,255,0.15)" stroke-width="6" stroke-linecap="round"/>
    <line x1="0" y1="20" x2="220" y2="20" stroke="#38bdf8" stroke-width="6" stroke-linecap="round"/>
    <circle cx="220" cy="20" r="10" fill="#38bdf8" filter="url(#glow)"/>
  </g>

  <g transform="translate(70, 285)">
    <text y="0" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">Force Multiplier (78%)</text>
    <line x1="0" y1="20" x2="320" y2="20" stroke="rgba(255,255,255,0.15)" stroke-width="6" stroke-linecap="round"/>
    <line x1="0" y1="20" x2="250" y2="20" stroke="#06b6d4" stroke-width="6" stroke-linecap="round"/>
    <circle cx="250" cy="20" r="10" fill="#06b6d4" filter="url(#glow)"/>
  </g>

  <g transform="translate(70, 355)">
    <text y="0" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">Speed Scale (1.25x)</text>
    <line x1="0" y1="20" x2="320" y2="20" stroke="rgba(255,255,255,0.15)" stroke-width="6" stroke-linecap="round"/>
    <line x1="0" y1="20" x2="160" y2="20" stroke="#a855f7" stroke-width="6" stroke-linecap="round"/>
    <circle cx="160" cy="20" r="10" fill="#a855f7" filter="url(#glow)"/>
  </g>

  <g transform="translate(70, 440)">
    <rect width="320" height="210" rx="12" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)"/>
    <text x="20" y="32" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="14" font-weight="700">CELESTIAL COORDINATES</text>
    <text x="20" y="65" fill="#38bdf8" font-family="monospace" font-size="13">Azimuth: 142.5°</text>
    <text x="20" y="95" fill="#38bdf8" font-family="monospace" font-size="13">Elevation: 24.8°</text>
    <text x="20" y="125" fill="#38bdf8" font-family="monospace" font-size="13">Kepler-18b: 29.8 km/s</text>
    <text x="20" y="155" fill="#10b981" font-family="monospace" font-size="13">SIMULATION: 60 FPS STABLE</text>
    <text x="20" y="185" fill="#94a3b8" font-family="monospace" font-size="12">GPU Load: 42% · Memory: 210MB</text>
  </g>

  <rect x="440" y="110" width="800" height="570" rx="18" fill="url(#cardBg)" stroke="rgba(168, 85, 247, 0.35)" stroke-width="1.5" filter="url(#glow)"/>
  <text x="470" y="155" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="20" font-weight="800">ORION SYSTEM // ORBITAL MECHANICS SIMULATOR</text>
  
  <g transform="translate(840, 395)">
    <ellipse cx="0" cy="0" rx="340" ry="170" fill="none" stroke="rgba(56, 189, 248, 0.25)" stroke-width="1.5" stroke-dasharray="8 6"/>
    <ellipse cx="0" cy="0" rx="250" ry="125" fill="none" stroke="rgba(16, 185, 129, 0.3)" stroke-width="1.5"/>
    <ellipse cx="0" cy="0" rx="160" ry="80" fill="none" stroke="rgba(168, 85, 247, 0.35)" stroke-width="1.5"/>

    <circle cx="0" cy="0" r="38" fill="#fde047" filter="url(#glow)"/>
    <circle cx="0" cy="0" r="48" fill="none" stroke="#facc15" stroke-width="3" opacity="0.6"/>

    <circle cx="-130" cy="-45" r="14" fill="#a855f7" filter="url(#glow)"/>
    <line x1="-130" y1="-45" x2="-80" y2="-90" stroke="#c084fc" stroke-width="2"/>
    <text x="-80" y="-95" fill="#c084fc" font-family="monospace" font-size="11">Vector: 38.4 m/s²</text>

    <circle cx="210" cy="65" r="18" fill="#10b981" filter="url(#glow)"/>
    <circle cx="210" cy="65" r="28" fill="none" stroke="#34d399" stroke-width="1" stroke-dasharray="3 3"/>
    <text x="235" y="70" fill="#34d399" font-family="monospace" font-size="12" font-weight="700">Terra-9</text>

    <circle cx="-270" cy="100" r="26" fill="#38bdf8" filter="url(#glow)"/>
    <ellipse cx="-270" cy="100" rx="42" ry="10" fill="none" stroke="#7dd3fc" stroke-width="3"/>
    <text x="-310" y="145" fill="#38bdf8" font-family="monospace" font-size="12" font-weight="700">Jovian-X</text>
  </g>
`;
  return wrapSvg('GRAVISPHERE // 3D GRAVITY PHYSICS SIMULATION', 'ABHIJEET MAHAKUR', content, '#a855f7', '#38bdf8');
}

// 4. IPS Algorithm Hub
function createIpsSvg() {
  const content = `
  <rect x="40" y="110" width="560" height="570" rx="18" fill="url(#cardBg)" stroke="rgba(56, 189, 248, 0.35)" stroke-width="1.5" filter="url(#glow)"/>
  <text x="70" y="155" fill="#38bdf8" font-family="monospace" font-size="16" font-weight="700">BinarySearchTree.java // Core Java Architecture</text>
  
  <g transform="translate(70, 195)" font-family="monospace" font-size="14">
    <text y="0" fill="#a855f7">package <tspan fill="#f1f5f9">ips.algorithms.trees;</tspan></text>
    <text y="30" fill="#a855f7">public class <tspan fill="#facc15">BinarySearchTree&lt;T extends Comparable&lt;T&gt;&gt;</tspan> {</text>
    <text y="60" fill="#94a3b8">  private TreeNode&lt;T&gt; root;</text>
    <text y="100" fill="#60a5fa">  public void <tspan fill="#facc15">insert</tspan>(T key) {</text>
    <text y="130" fill="#94a3b8">    this.root = insertRecursive(this.root, key);</text>
    <text y="160" fill="#60a5fa">  }</text>
    <text y="200" fill="#60a5fa">  public boolean <tspan fill="#facc15">search</tspan>(T target) {</text>
    <text y="230" fill="#94a3b8">    return searchNode(this.root, target);</text>
    <text y="260" fill="#60a5fa">  }</text>
    <text y="300" fill="#60a5fa">  public List&lt;T&gt; <tspan fill="#facc15">inOrderTraversal</tspan>() {</text>
    <text y="330" fill="#94a3b8">    List&lt;T&gt; result = new ArrayList&lt;&gt;();</text>
    <text y="360" fill="#94a3b8">    traverseInOrder(this.root, result);</text>
    <text y="390" fill="#94a3b8">    return result; // Time: O(n), Space: O(h)</text>
    <text y="420" fill="#60a5fa">  }</text>
    <text y="450" fill="#a855f7">}</text>
  </g>

  <rect x="620" y="110" width="620" height="570" rx="18" fill="url(#cardBg)" stroke="rgba(168, 85, 247, 0.35)" stroke-width="1.5" filter="url(#glow)"/>
  <text x="650" y="155" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="20" font-weight="800">DATA STRUCTURES &amp; GRAPH VISUALIZER</text>

  <g transform="translate(760, 240)">
    <circle cx="90" cy="0" r="24" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" stroke-width="3" filter="url(#glow)"/>
    <text x="90" y="7" fill="#38bdf8" font-family="monospace" font-size="16" font-weight="800" text-anchor="middle">50</text>

    <line x1="75" y1="20" x2="30" y2="70" stroke="#38bdf8" stroke-width="2"/>
    <line x1="105" y1="20" x2="150" y2="70" stroke="#38bdf8" stroke-width="2"/>

    <circle cx="30" cy="85" r="22" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" stroke-width="3"/>
    <text x="30" y="92" fill="#10b981" font-family="monospace" font-size="15" font-weight="800" text-anchor="middle">30</text>

    <circle cx="150" cy="85" r="22" fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" stroke-width="3"/>
    <text x="150" y="92" fill="#a855f7" font-family="monospace" font-size="15" font-weight="800" text-anchor="middle">70</text>

    <line x1="18" y1="104" x2="-10" y2="150" stroke="#10b981" stroke-width="2"/>
    <line x1="42" y1="104" x2="70" y2="150" stroke="#10b981" stroke-width="2"/>
    <line x1="138" y1="104" x2="110" y2="150" stroke="#a855f7" stroke-width="2"/>
    <line x1="162" y1="104" x2="190" y2="150" stroke="#a855f7" stroke-width="2"/>

    <circle cx="-10" cy="165" r="18" fill="#0f172a" stroke="#10b981" stroke-width="2"/>
    <text x="-10" y="171" fill="#10b981" font-family="monospace" font-size="13" font-weight="700" text-anchor="middle">20</text>
    
    <circle cx="70" cy="165" r="18" fill="#0f172a" stroke="#10b981" stroke-width="2"/>
    <text x="70" y="171" fill="#10b981" font-family="monospace" font-size="13" font-weight="700" text-anchor="middle">40</text>

    <circle cx="110" cy="165" r="18" fill="#0f172a" stroke="#a855f7" stroke-width="2"/>
    <text x="110" y="171" fill="#a855f7" font-family="monospace" font-size="13" font-weight="700" text-anchor="middle">60</text>

    <circle cx="190" cy="165" r="18" fill="#0f172a" stroke="#a855f7" stroke-width="2"/>
    <text x="190" y="171" fill="#a855f7" font-family="monospace" font-size="13" font-weight="700" text-anchor="middle">80</text>
  </g>

  <g transform="translate(650, 520)">
    <rect width="265" height="110" rx="12" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)"/>
    <text x="20" y="32" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">COMPLEXITY</text>
    <text x="20" y="68" fill="#38bdf8" font-family="monospace" font-size="24" font-weight="800">O(log n) <tspan font-size="13" fill="#94a3b8">Search/Insert</tspan></text>
    <text x="20" y="94" fill="#34d399" font-family="monospace" font-size="12">AVL Balanced Tree Guaranteed</text>

    <rect x="290" y="0" width="265" height="110" rx="12" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)"/>
    <text x="310" y="32" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">BENCHMARK RUNTIME</text>
    <text x="310" y="68" fill="#a78bfa" font-family="monospace" font-size="24" font-weight="800">14.2 ms <tspan font-size="13" fill="#94a3b8">100k nodes</tspan></text>
    <text x="310" y="94" fill="#34d399" font-family="monospace" font-size="12">Passed All Test Benchmarks</text>
  </g>
`;
  return wrapSvg('IPS // CORE JAVA &amp; ALGORITHMIC ARCHITECTURE', 'ABHIJEET MAHAKUR', content, '#38bdf8', '#a855f7');
}

// 5. TruckFlow
function createTruckFlowSvg() {
  const content = `
  <rect x="40" y="110" width="460" height="570" rx="18" fill="url(#cardBg)" stroke="rgba(56, 189, 248, 0.35)" stroke-width="1.5" filter="url(#glow)"/>
  <text x="70" y="155" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="22" font-weight="800">LIVE FLEET STATUS</text>
  <text x="70" y="180" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13">Real-time GPS Telemetry &amp; Load Matching</text>

  <g transform="translate(65, 205)">
    <!-- Truck 1 -->
    <rect width="410" height="90" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(56, 189, 248, 0.25)" stroke-width="1"/>
    <text x="20" y="34" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="16" font-weight="700">🚛 Truck T-101 · Volvo FH16</text>
    <text x="20" y="58" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">Route: Mumbai ➔ Delhi | Load: 88%</text>
    <text x="20" y="76" fill="#34d399" font-family="monospace" font-size="12">ACTIVE · Speed: 88 km/h · ETA: 03:14:22</text>
    <rect x="320" y="24" width="70" height="26" rx="6" fill="rgba(16, 185, 129, 0.15)"/>
    <text x="355" y="41" fill="#34d399" font-family="monospace" font-size="11" font-weight="700" text-anchor="middle">EN ROUTE</text>

    <!-- Truck 2 -->
    <g transform="translate(0, 105)">
      <rect width="410" height="90" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(245, 158, 11, 0.25)" stroke-width="1"/>
      <text x="20" y="34" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="16" font-weight="700">🚛 Truck T-104 · Scania R500</text>
      <text x="20" y="58" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">Route: Kolkata ➔ Bhubaneswar | Load: 91%</text>
      <text x="20" y="76" fill="#f59e0b" font-family="monospace" font-size="12">DELIVERING · Speed: 92 km/h · ETA: 02:45:10</text>
      <rect x="320" y="24" width="70" height="26" rx="6" fill="rgba(245, 158, 11, 0.15)"/>
      <text x="355" y="41" fill="#f59e0b" font-family="monospace" font-size="11" font-weight="700" text-anchor="middle">ON TRACK</text>
    </g>

    <!-- Truck 3 -->
    <g transform="translate(0, 210)">
      <rect width="410" height="90" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(168, 85, 247, 0.25)" stroke-width="1"/>
      <text x="20" y="34" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="16" font-weight="700">🚛 Truck T-109 · BharatBenz</text>
      <text x="20" y="58" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">Route: Chennai ➔ Bangalore | Round-Trip Match</text>
      <text x="20" y="76" fill="#c084fc" font-family="monospace" font-size="12">OPTIMIZED · Zero Empty Kilometers</text>
      <rect x="320" y="24" width="70" height="26" rx="6" fill="rgba(168, 85, 247, 0.15)"/>
      <text x="355" y="41" fill="#c084fc" font-family="monospace" font-size="11" font-weight="700" text-anchor="middle">MATCHED</text>
    </g>
  </g>

  <!-- Metrics row -->
  <g transform="translate(65, 545)">
    <rect width="195" height="110" rx="12" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)"/>
    <text x="20" y="30" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">FUEL EFFICIENCY</text>
    <text x="20" y="66" fill="#38bdf8" font-family="monospace" font-size="26" font-weight="800">4.2 km/L</text>
    <text x="20" y="92" fill="#34d399" font-family="monospace" font-size="12">+18% Profit Optimized</text>

    <rect x="215" width="195" height="110" rx="12" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)"/>
    <text x="20" y="30" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">FLEET UTILIZATION</text>
    <text x="20" y="66" fill="#f59e0b" font-family="monospace" font-size="26" font-weight="800">94.8%</text>
    <text x="20" y="92" fill="#34d399" font-family="monospace" font-size="12">Proof of Delivery Active</text>
  </g>

  <!-- Right: GIS Map & Telemetry HUD -->
  <rect x="525" y="110" width="715" height="570" rx="18" fill="url(#cardBg)" stroke="rgba(245, 158, 11, 0.35)" stroke-width="1.5" filter="url(#glow)"/>
  <text x="555" y="155" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="20" font-weight="800">DYNAMIC ROUTE MAP &amp; GPS TELEMETRY</text>
  <text x="555" y="180" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="13">Route ID: FLT-NY-104 · Distance: 612 km · Highway Corridor AI</text>

  <!-- Simulated Map Vector Graphics -->
  <g transform="translate(555, 210)">
    <rect width="655" height="440" rx="14" fill="#070c18" stroke="rgba(255,255,255,0.06)"/>
    <!-- Map grid paths -->
    <path d="M 40 380 Q 200 320 280 200 T 520 80" fill="none" stroke="#f59e0b" stroke-width="5" stroke-linecap="round" filter="url(#glow)"/>
    <path d="M 80 420 Q 220 280 380 240 T 600 160" fill="none" stroke="#38bdf8" stroke-width="3" stroke-dasharray="6 6"/>
    
    <!-- Waypoints -->
    <circle cx="40" cy="380" r="12" fill="#10b981" filter="url(#glow)"/>
    <text x="60" y="385" fill="#34d399" font-family="system-ui, sans-serif" font-size="14" font-weight="700">Origin Depot</text>

    <circle cx="280" cy="200" r="10" fill="#f59e0b"/>
    <text x="300" y="205" fill="#fde047" font-family="system-ui, sans-serif" font-size="13" font-weight="600">Hub Waypoint (Mid-Trip Match)</text>

    <circle cx="520" cy="80" r="14" fill="#ef4444" filter="url(#glow)"/>
    <text x="540" y="85" fill="#f87171" font-family="system-ui, sans-serif" font-size="14" font-weight="700">Destination</text>

    <!-- Telemetry Overlay Box -->
    <rect x="30" y="30" width="220" height="90" rx="10" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(56, 189, 248, 0.3)"/>
    <text x="45" y="55" fill="#38bdf8" font-family="monospace" font-size="13" font-weight="700">LIVE GPS: LOCK</text>
    <text x="45" y="78" fill="#f8fafc" font-family="monospace" font-size="12">Lat: 19.0760 N</text>
    <text x="45" y="98" fill="#f8fafc" font-family="monospace" font-size="12">Lng: 72.8777 E</text>
  </g>
`;
  return wrapSvg('TRUCKFLOW // FREIGHT LOGISTICS &amp; ROUTE OPTIMIZATION AI', 'ABHIJEET MAHAKUR', content, '#38bdf8', '#f59e0b');
}

// 6. Spotify Clone
function createSpotifyCloneSvg() {
  const content = `
  <rect x="40" y="110" width="700" height="570" rx="18" fill="url(#cardBg)" stroke="rgba(34, 197, 94, 0.35)" stroke-width="1.5" filter="url(#glow)"/>
  <text x="70" y="155" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="22" font-weight="800">SYNTHWAVE MUSIC STREAMING</text>
  <text x="70" y="180" fill="#22c55e" font-family="system-ui, sans-serif" font-size="13">High-Fidelity Audio API · Dynamic Queue &amp; Waveforms</text>

  <!-- Album Art & Center Stage -->
  <g transform="translate(70, 210)">
    <rect width="220" height="220" rx="14" fill="#0d1527" stroke="rgba(34, 197, 94, 0.4)" stroke-width="2"/>
    <circle cx="110" cy="110" r="70" fill="rgba(34, 197, 94, 0.15)" stroke="#22c55e" stroke-width="3" filter="url(#glow)"/>
    <text x="110" y="120" fill="#22c55e" font-family="system-ui, sans-serif" font-size="44" text-anchor="middle">🎧</text>
    
    <g transform="translate(250, 20)">
      <text y="24" fill="#94a3b8" font-family="monospace" font-size="12" letter-spacing="2">NOW PLAYING</text>
      <text y="60" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="28" font-weight="900">Neon Drift (Retro Edit)</text>
      <text y="90" fill="#22c55e" font-family="system-ui, sans-serif" font-size="16" font-weight="600">Synthwavers ft. Abhijeet</text>
      
      <!-- Progress Bar -->
      <line x1="0" y1="130" x2="380" y2="130" stroke="rgba(255,255,255,0.12)" stroke-width="6" stroke-linecap="round"/>
      <line x1="0" y1="130" x2="260" y2="130" stroke="#22c55e" stroke-width="6" stroke-linecap="round"/>
      <circle cx="260" cy="130" r="8" fill="#22c55e" filter="url(#glow)"/>
      <text x="0" y="155" fill="#94a3b8" font-family="monospace" font-size="12">03:45</text>
      <text x="380" y="155" fill="#94a3b8" font-family="monospace" font-size="12" text-anchor="end">04:12</text>

      <!-- Player Controls -->
      <g transform="translate(190, 180)">
        <text x="-90" y="10" fill="#94a3b8" font-size="18" text-anchor="middle">🔀</text>
        <text x="-45" y="10" fill="#f8fafc" font-size="20" text-anchor="middle">⏮</text>
        <circle cx="0" cy="5" r="22" fill="#22c55e" filter="url(#glow)"/>
        <text x="0" y="12" fill="#000" font-size="18" font-weight="900" text-anchor="middle">❚❚</text>
        <text x="45" y="10" fill="#f8fafc" font-size="20" text-anchor="middle">⏭</text>
        <text x="90" y="10" fill="#94a3b8" font-size="18" text-anchor="middle">🔁</text>
      </g>
    </g>
  </g>

  <!-- Glowing Soundwave -->
  <g transform="translate(70, 480)">
    <rect width="640" height="170" rx="14" fill="rgba(5, 10, 20, 0.8)" stroke="rgba(255,255,255,0.06)"/>
    <text x="24" y="32" fill="#22c55e" font-family="system-ui, sans-serif" font-size="13" font-weight="700">AUDIO WAVEFORM SPECTRUM (60 FPS)</text>
    
    <!-- 28 Waveform Bars -->
    ${Array.from({ length: 28 }).map((_, i) => {
      const h = 20 + Math.sin(i * 0.4) * 45 + ((i % 3) * 15);
      return `<rect x="${30 + i * 21}" y="${140 - h}" width="10" height="${h}" rx="5" fill="${i % 2 === 0 ? '#22c55e' : '#a855f7'}" opacity="0.85"/>`;
    }).join('')}
  </g>

  <!-- Right: Playlist Queue -->
  <rect x="765" y="110" width="475" height="570" rx="18" fill="url(#cardBg)" stroke="rgba(168, 85, 247, 0.35)" stroke-width="1.5" filter="url(#glow)"/>
  <text x="795" y="155" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="20" font-weight="800">UP NEXT // QUEUE</text>
  
  <g transform="translate(795, 185)">
    ${[
      { title: 'Cyberpunk Nights', artist: 'Arcade Pulse', dur: '3:24', color: '#22c55e' },
      { title: 'Echoes of Tomorrow', artist: 'Solar Flare', dur: '4:08', color: '#38bdf8' },
      { title: 'Future Bass Odyssey', artist: 'Hyperion', dur: '2:56', color: '#a855f7' },
      { title: 'Midnight City Highway', artist: 'Overdrive', dur: '3:50', color: '#f59e0b' },
      { title: 'Quantum Melodies', artist: 'Zero State', dur: '4:15', color: '#ec4899' }
    ].map((item, idx) => `
      <g transform="translate(0, ${idx * 90})">
        <rect width="415" height="76" rx="12" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)"/>
        <rect x="15" y="14" width="48" height="48" rx="8" fill="rgba(255,255,255,0.05)" stroke="${item.color}" stroke-width="1.5"/>
        <text x="39" y="44" fill="${item.color}" font-size="20" text-anchor="middle">🎵</text>
        <text x="75" y="36" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="15" font-weight="700">${item.title}</text>
        <text x="75" y="56" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">${item.artist}</text>
        <text x="395" y="44" fill="#94a3b8" font-family="monospace" font-size="13" text-anchor="end">${item.dur}</text>
      </g>
    `).join('')}
  </g>
`;
  return wrapSvg('SPOTIFY CLONE // AUDIO STREAMING WEB APPLICATION', 'ABHIJEET MAHAKUR', content, '#22c55e', '#a855f7');
}

// 7. Air Writing
function createAirWritingSvg() {
  const content = `
  <rect x="40" y="110" width="440" height="570" rx="18" fill="url(#cardBg)" stroke="rgba(16, 185, 129, 0.35)" stroke-width="1.5" filter="url(#glow)"/>
  <text x="70" y="155" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="22" font-weight="800">COMPUTER VISION HUD</text>
  <text x="70" y="180" fill="#10b981" font-family="system-ui, sans-serif" font-size="13">MediaPipe 21 Landmark Topology + OpenCV</text>

  <g transform="translate(70, 215)">
    <rect width="380" height="150" rx="14" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)"/>
    <text x="24" y="36" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="15" font-weight="700">GESTURE RECOGNIZER</text>
    <text x="24" y="65" fill="#10b981" font-family="monospace" font-size="13">CV STATUS: [LIVE FEED]</text>
    <text x="24" y="95" fill="#38bdf8" font-family="monospace" font-size="13">CONFIDENCE: 98.4% (Landmarks: 21)</text>
    <text x="24" y="125" fill="#facc15" font-family="monospace" font-size="13">MODE: DRAWING (Index Tip Active)</text>
  </g>

  <!-- Color Palette -->
  <g transform="translate(70, 395)">
    <rect width="380" height="120" rx="14" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)"/>
    <text x="24" y="32" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="14" font-weight="700">VIRTUAL PALETTE</text>
    
    <g transform="translate(24, 55)">
      <circle cx="20" cy="15" r="18" fill="#10b981" stroke="#fff" stroke-width="3"/>
      <circle cx="70" cy="15" r="16" fill="#f97316"/>
      <circle cx="120" cy="15" r="16" fill="#38bdf8"/>
      <circle cx="170" cy="15" r="16" fill="#a855f7"/>
      <circle cx="220" cy="15" r="16" fill="#ec4899"/>
      <circle cx="270" cy="15" r="16" fill="#fde047"/>
    </g>
  </g>

  <g transform="translate(70, 545)">
    <rect width="380" height="110" rx="14" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)"/>
    <text x="20" y="32" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">SMOOTHING ENGINE</text>
    <text x="20" y="66" fill="#10b981" font-family="monospace" font-size="24" font-weight="800">60 FPS</text>
    <text x="20" y="92" fill="#34d399" font-family="monospace" font-size="12">Exponential Moving Average Filter</text>
  </g>

  <!-- Right: Real-time Mid-Air Drawing Canvas -->
  <rect x="505" y="110" width="735" height="570" rx="18" fill="url(#cardBg)" stroke="rgba(56, 189, 248, 0.35)" stroke-width="1.5" filter="url(#glow)"/>
  <text x="535" y="155" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="20" font-weight="800">CONTACTLESS MID-AIR CANVAS</text>
  <text x="535" y="180" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13">Index Fingertip Landmark Coordinate Tracking</text>

  <!-- Canvas Visual Area -->
  <g transform="translate(535, 210)">
    <rect width="675" height="440" rx="14" fill="#060913" stroke="rgba(255,255,255,0.08)"/>
    
    <!-- Neon Glowing Text "Air Writing" in cursive style -->
    <path d="M 120 260 Q 180 140 240 220 T 360 200 T 480 240" fill="none" stroke="#10b981" stroke-width="8" stroke-linecap="round" filter="url(#glow)"/>
    <path d="M 140 320 Q 260 260 380 320 T 560 300" fill="none" stroke="#34d399" stroke-width="6" stroke-linecap="round"/>
    <text x="340" y="230" fill="#10b981" font-family="system-ui, sans-serif" font-size="56" font-weight="900" text-anchor="middle" filter="url(#glow)">Air Writing</text>
    <text x="340" y="290" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="32" font-weight="700" text-anchor="middle">System AI</text>

    <!-- Hand Landmark Skeleton Diagram -->
    <g transform="translate(500, 100)">
      <circle cx="80" cy="40" r="8" fill="#10b981" filter="url(#glow)"/>
      <line x1="80" y1="40" x2="60" y2="80" stroke="#34d399" stroke-width="3"/>
      <circle cx="60" cy="80" r="6" fill="#34d399"/>
      <line x1="60" y1="80" x2="50" y2="120" stroke="#34d399" stroke-width="3"/>
      <circle cx="50" cy="120" r="6" fill="#34d399"/>
      <!-- Other fingers -->
      <line x1="50" y1="120" x2="90" y2="90" stroke="#38bdf8" stroke-width="2"/>
      <circle cx="90" cy="90" r="5" fill="#38bdf8"/>
      <line x1="50" y1="120" x2="110" y2="105" stroke="#38bdf8" stroke-width="2"/>
      <circle cx="110" cy="105" r="5" fill="#38bdf8"/>
      <text x="80" y="25" fill="#10b981" font-family="monospace" font-size="12" font-weight="700" text-anchor="middle">Tip 08 [DRAW]</text>
    </g>
  </g>
`;
  return wrapSvg('AIR WRITING // COMPUTER VISION HAND DRAWING SYSTEM', 'ABHIJEET MAHAKUR', content, '#10b981', '#38bdf8');
}

// 8. Django Blog
function createDjangoBlogSvg() {
  const content = `
  <rect x="40" y="110" width="1200" height="570" rx="18" fill="url(#cardBg)" stroke="rgba(16, 185, 129, 0.35)" stroke-width="1.5" filter="url(#glow)"/>
  <text x="70" y="155" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="22" font-weight="800">DJANGO TECHBLOG // EDITORIAL WEB PLATFORM</text>
  <text x="70" y="180" fill="#10b981" font-family="system-ui, sans-serif" font-size="13">Python · Django MVT · SQLite ORM · Responsive Article Feed</text>

  <!-- Left: 2x2 Article Cards -->
  <g transform="translate(70, 210)">
    <!-- Article 1 -->
    <rect width="360" height="210" rx="14" fill="rgba(255,255,255,0.02)" stroke="rgba(16, 185, 129, 0.25)" stroke-width="1"/>
    <rect x="20" y="20" width="80" height="26" rx="6" fill="rgba(16, 185, 129, 0.15)"/>
    <text x="60" y="37" fill="#10b981" font-family="monospace" font-size="11" font-weight="700" text-anchor="middle">DJANGO</text>
    <text x="20" y="80" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="17" font-weight="700">Django MVT Architecture: Deep Dive</text>
    <text x="20" y="105" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">Understanding Models, Views &amp; Template flow in depth.</text>
    <text x="20" y="145" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="12">⏱ 12 min read · Python</text>
    <text x="20" y="175" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="600">✍️ by Abhijeet Mahakur</text>

    <!-- Article 2 -->
    <g transform="translate(390, 0)">
      <rect width="360" height="210" rx="14" fill="rgba(255,255,255,0.02)" stroke="rgba(56, 189, 248, 0.25)" stroke-width="1"/>
      <rect x="20" y="20" width="80" height="26" rx="6" fill="rgba(56, 189, 248, 0.15)"/>
      <text x="60" y="37" fill="#38bdf8" font-family="monospace" font-size="11" font-weight="700" text-anchor="middle">REST API</text>
      <text x="20" y="80" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="17" font-weight="700">Building Robust REST APIs</text>
      <text x="20" y="105" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">Designing high-throughput endpoints with Django REST.</text>
      <text x="20" y="145" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="12">⏱ 8 min read · Backend</text>
      <text x="20" y="175" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="600">✍️ by Abhijeet Mahakur</text>
    </g>

    <!-- Article 3 -->
    <g transform="translate(0, 230)">
      <rect width="750" height="190" rx="14" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      <text x="25" y="35" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="16" font-weight="700">DATABASE INTEGRATION &amp; DJANGO ADMIN</text>
      <text x="25" y="65" fill="#94a3b8" font-family="monospace" font-size="13">python manage.py makemigrations &amp;&amp; python manage.py migrate</text>
      <text x="25" y="95" fill="#34d399" font-family="monospace" font-size="13">✓ Applied all migrations: auth, contenttypes, sessions, blog</text>
      <text x="25" y="125" fill="#38bdf8" font-family="monospace" font-size="13">✓ Dynamic slug routing &amp; author roles active</text>
    </g>
  </g>

  <!-- Right: Trending Topics Sidebar -->
  <rect x="860" y="210" width="350" height="440" rx="14" fill="rgba(5, 10, 20, 0.85)" stroke="rgba(255,255,255,0.08)"/>
  <text x="890" y="250" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="18" font-weight="800">TRENDING TOPICS</text>
  
  <g transform="translate(890, 280)">
    ${[
      { topic: 'Celery Task Queues', views: '58k' },
      { topic: 'PostgreSQL Optimization', views: '23k' },
      { topic: 'Django ORM Queries', views: '25k' },
      { topic: 'Machine Learning in Python', views: '12k' },
      { topic: 'FastAPI vs Django', views: '8k' }
    ].map((item, idx) => `
      <g transform="translate(0, ${idx * 60})">
        <circle cx="10" cy="15" r="4" fill="#10b981"/>
        <text x="25" y="20" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="14" font-weight="600">${item.topic}</text>
        <text x="280" y="20" fill="#94a3b8" font-family="monospace" font-size="12" text-anchor="end">${item.views}</text>
        <line x1="0" y1="40" x2="280" y2="40" stroke="rgba(255,255,255,0.04)"/>
      </g>
    `).join('')}
  </g>
`;
  return wrapSvg('DJANGO BLOG WEBSITE // FULL-STACK WEB PLATFORM', 'ABHIJEET MAHAKUR', content, '#10b981', '#059669');
}

// 9. AttendanceApp
function createAttendanceAppSvg() {
  const content = `
  <rect x="40" y="110" width="1200" height="570" rx="18" fill="url(#cardBg)" stroke="rgba(56, 189, 248, 0.35)" stroke-width="1.5" filter="url(#glow)"/>
  <text x="70" y="155" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="22" font-weight="800">SMART ATTENDANCE &amp; BIOMETRIC ANALYTICS</text>
  <text x="70" y="180" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13">Python GUI · Automated Verification · Analytics Dashboard</text>

  <!-- Top KPI Cards -->
  <g transform="translate(70, 210)">
    <!-- KPI 1 -->
    <rect width="210" height="100" rx="14" fill="rgba(56, 189, 248, 0.1)" stroke="rgba(56, 189, 248, 0.3)"/>
    <text x="20" y="35" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">TOTAL STUDENTS</text>
    <text x="20" y="75" fill="#f8fafc" font-family="monospace" font-size="34" font-weight="900">148</text>

    <!-- KPI 2 -->
    <g transform="translate(230, 0)">
      <rect width="210" height="100" rx="14" fill="rgba(16, 185, 129, 0.1)" stroke="rgba(16, 185, 129, 0.3)"/>
      <text x="20" y="35" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">PRESENT TODAY</text>
      <text x="20" y="75" fill="#34d399" font-family="monospace" font-size="34" font-weight="900">94%</text>
    </g>

    <!-- KPI 3 -->
    <g transform="translate(460, 0)">
      <rect width="210" height="100" rx="14" fill="rgba(239, 68, 68, 0.1)" stroke="rgba(239, 68, 68, 0.3)"/>
      <text x="20" y="35" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">ABSENT</text>
      <text x="20" y="75" fill="#f87171" font-family="monospace" font-size="34" font-weight="900">9</text>
    </g>

    <!-- KPI 4 -->
    <g transform="translate(690, 0)">
      <rect width="210" height="100" rx="14" fill="rgba(245, 158, 11, 0.1)" stroke="rgba(245, 158, 11, 0.3)"/>
      <text x="20" y="35" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">LATE CHECK-IN</text>
      <text x="20" y="75" fill="#fbbf24" font-family="monospace" font-size="34" font-weight="900">4</text>
    </g>
  </g>

  <!-- Table Roster -->
  <g transform="translate(70, 335)">
    <rect width="780" height="315" rx="14" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.06)"/>
    <text x="24" y="35" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="15" font-weight="700">RECENT ATTENDANCE LOGS</text>
    
    <!-- Table Header -->
    <text x="24" y="70" fill="#94a3b8" font-family="monospace" font-size="12">ATTENDEE NAME</text>
    <text x="230" y="70" fill="#94a3b8" font-family="monospace" font-size="12">ID</text>
    <text x="360" y="70" fill="#94a3b8" font-family="monospace" font-size="12">TIMESTAMP</text>
    <text x="520" y="70" fill="#94a3b8" font-family="monospace" font-size="12">VERIFICATION</text>
    <text x="680" y="70" fill="#94a3b8" font-family="monospace" font-size="12">STATUS</text>
    <line x1="20" y1="85" x2="760" y2="85" stroke="rgba(255,255,255,0.08)"/>

    <!-- Rows -->
    ${[
      { name: 'Abhijeet Mahakur', id: 'ITER-2024-01', time: '08:31:02 AM', status: 'Present' },
      { name: 'Sarah Smith', id: 'ITER-2024-02', time: '08:34:45 AM', status: 'Present' },
      { name: 'Michael Brown', id: 'ITER-2024-03', time: '09:15:20 AM', status: 'Late' },
      { name: 'Emily Chen', id: 'ITER-2024-04', time: '08:38:11 AM', status: 'Present' }
    ].map((r, idx) => `
      <g transform="translate(24, ${115 + idx * 45})">
        <text y="0" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="14" font-weight="600">${r.name}</text>
        <text x="206" y="0" fill="#38bdf8" font-family="monospace" font-size="13">${r.id}</text>
        <text x="336" y="0" fill="#94a3b8" font-family="monospace" font-size="13">${r.time}</text>
        <rect x="496" y="-16" width="90" height="24" rx="6" fill="rgba(16, 185, 129, 0.15)"/>
        <text x="541" y="0" fill="#34d399" font-family="monospace" font-size="11" font-weight="700" text-anchor="middle">VERIFIED</text>
        <text x="656" y="0" fill="${r.status === 'Present' ? '#34d399' : '#f59e0b'}" font-family="system-ui, sans-serif" font-size="13" font-weight="700">${r.status}</text>
      </g>
    `).join('')}
  </g>

  <!-- Right Weekly Circular Gauge -->
  <g transform="translate(880, 210)">
    <rect width="360" height="440" rx="14" fill="rgba(5, 10, 20, 0.85)" stroke="rgba(255,255,255,0.08)"/>
    <text x="30" y="40" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="16" font-weight="800">WEEKLY ACCURACY</text>
    
    <g transform="translate(180, 200)">
      <circle cx="0" cy="0" r="100" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="16"/>
      <circle cx="0" cy="0" r="100" fill="none" stroke="#38bdf8" stroke-width="16" stroke-dasharray="580" stroke-dashoffset="60" filter="url(#glow)"/>
      <text x="0" y="10" fill="#f8fafc" font-family="monospace" font-size="38" font-weight="900" text-anchor="middle">94%</text>
      <text x="0" y="38" fill="#38bdf8" font-family="monospace" font-size="12" text-anchor="middle">ATTENDANCE RATE</text>
    </g>

    <text x="180" y="370" fill="#34d399" font-family="monospace" font-size="13" font-weight="700" text-anchor="middle">✓ Automated CSV &amp; Excel Reports</text>
  </g>
`;
  return wrapSvg('ATTENDANCEAPP // SMART ATTENDANCE &amp; BIOMETRIC ANALYTICS', 'ABHIJEET MAHAKUR', content, '#38bdf8', '#6366f1');
}

// 10. ThermaX
function createThermaXSvg() {
  const content = `
  <rect x="40" y="110" width="1200" height="570" rx="18" fill="url(#cardBg)" stroke="rgba(249, 115, 22, 0.35)" stroke-width="1.5" filter="url(#glow)"/>
  <text x="70" y="155" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="22" font-weight="800">THERMAX // HARDWARE THERMAL MONITOR &amp; ANALYTICS</text>
  <text x="70" y="180" fill="#f97316" font-family="system-ui, sans-serif" font-size="13">Python Hardware Telemetry · CPU/GPU Thermal Curves · Fan Control</text>

  <!-- Top Thermal Dials -->
  <g transform="translate(70, 210)">
    <!-- CPU Dial -->
    <rect width="360" height="110" rx="14" fill="rgba(255,255,255,0.02)" stroke="rgba(56, 189, 248, 0.3)"/>
    <circle cx="65" cy="55" r="34" fill="none" stroke="rgba(56, 189, 248, 0.2)" stroke-width="8"/>
    <circle cx="65" cy="55" r="34" fill="none" stroke="#38bdf8" stroke-width="8" stroke-dasharray="160" stroke-dashoffset="40" filter="url(#glow)"/>
    <text x="65" y="62" fill="#38bdf8" font-family="monospace" font-size="18" font-weight="800" text-anchor="middle">58°C</text>
    <text x="120" y="45" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="16" font-weight="700">CPU Package</text>
    <text x="120" y="70" fill="#34d399" font-family="monospace" font-size="13">Normal · Intel Core i7</text>

    <!-- GPU Dial -->
    <g transform="translate(390, 0)">
      <rect width="360" height="110" rx="14" fill="rgba(255,255,255,0.02)" stroke="rgba(249, 115, 22, 0.3)"/>
      <circle cx="65" cy="55" r="34" fill="none" stroke="rgba(249, 115, 22, 0.2)" stroke-width="8"/>
      <circle cx="65" cy="55" r="34" fill="none" stroke="#f97316" stroke-width="8" stroke-dasharray="160" stroke-dashoffset="30" filter="url(#glow)"/>
      <text x="65" y="62" fill="#f97316" font-family="monospace" font-size="18" font-weight="800" text-anchor="middle">64°C</text>
      <text x="120" y="45" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="16" font-weight="700">GPU Core Temp</text>
      <text x="120" y="70" fill="#facc15" font-family="monospace" font-size="13">Optimal · RTX 40-Series</text>
    </g>

    <!-- Motherboard Dial -->
    <g transform="translate(780, 0)">
      <rect width="360" height="110" rx="14" fill="rgba(255,255,255,0.02)" stroke="rgba(16, 185, 129, 0.3)"/>
      <circle cx="65" cy="55" r="34" fill="none" stroke="rgba(16, 185, 129, 0.2)" stroke-width="8"/>
      <circle cx="65" cy="55" r="34" fill="none" stroke="#10b981" stroke-width="8" stroke-dasharray="160" stroke-dashoffset="70" filter="url(#glow)"/>
      <text x="65" y="62" fill="#10b981" font-family="monospace" font-size="18" font-weight="800" text-anchor="middle">36°C</text>
      <text x="120" y="45" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="16" font-weight="700">Motherboard &amp; VRM</text>
      <text x="120" y="70" fill="#34d399" font-family="monospace" font-size="13">Cool &amp; Stable</text>
    </g>
  </g>

  <!-- Real-time Temperature Curves Chart -->
  <g transform="translate(70, 345)">
    <rect width="1140" height="305" rx="14" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.06)"/>
    <text x="30" y="35" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="15" font-weight="700">REAL-TIME TEMPERATURE TELEMETRY CURVES (15 MIN)</text>
    <text x="1080" y="35" fill="#94a3b8" font-family="monospace" font-size="12" text-anchor="end">Alert Threshold: 95°C</text>

    <!-- Grid lines -->
    <line x1="60" y1="70" x2="1080" y2="70" stroke="rgba(255,255,255,0.05)"/>
    <line x1="60" y1="130" x2="1080" y2="130" stroke="rgba(255,255,255,0.05)"/>
    <line x1="60" y1="190" x2="1080" y2="190" stroke="rgba(255,255,255,0.05)"/>
    <line x1="60" y1="250" x2="1080" y2="250" stroke="rgba(255,255,255,0.1)"/>

    <!-- Curves -->
    <path d="M 60 210 Q 200 170 380 180 T 700 160 T 1080 150" fill="none" stroke="#38bdf8" stroke-width="3" filter="url(#glow)"/>
    <path d="M 60 190 Q 200 140 380 150 T 700 130 T 1080 120" fill="none" stroke="#f97316" stroke-width="3" filter="url(#glow)"/>

    <!-- Legend & Fan Speed -->
    <circle cx="80" cy="280" r="5" fill="#38bdf8"/>
    <text x="95" y="285" fill="#38bdf8" font-family="monospace" font-size="12">CPU Curve</text>

    <circle cx="200" cy="280" r="5" fill="#f97316"/>
    <text x="215" y="285" fill="#f97316" font-family="monospace" font-size="12">GPU Curve</text>

    <text x="900" y="285" fill="#34d399" font-family="monospace" font-size="13">Fan Speed: 1,840 RPM (Active Curve)</text>
  </g>
`;
  return wrapSvg('THERMAX // HARDWARE THERMAL MONITORING &amp; ANALYTICS', 'ABHIJEET MAHAKUR', content, '#f97316', '#ef4444');
}

// 11. WebDevBasic
function createWebDevBasicSvg() {
  const content = `
  <rect x="40" y="110" width="1200" height="570" rx="18" fill="url(#cardBg)" stroke="rgba(56, 189, 248, 0.35)" stroke-width="1.5" filter="url(#glow)"/>
  <text x="70" y="155" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="22" font-weight="800">WEB DEVELOPMENT FUNDAMENTALS // SANDBOX</text>
  <text x="70" y="180" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13">HTML5 Semantic Layouts · CSS3 Flexbox &amp; Grid · Modern UI Components</text>

  <!-- Left: Sandbox Controls -->
  <g transform="translate(70, 210)">
    <rect width="360" height="440" rx="14" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)"/>
    <text x="24" y="36" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="16" font-weight="700">CORE WEB MODULES</text>
    
    ${[
      { name: 'HTML5 Semantic Structure', status: 'Mastered' },
      { name: 'CSS Flexbox & Grid Systems', status: 'Mastered' },
      { name: 'Responsive Breakpoint Scaling', status: 'Mastered' },
      { name: 'CSS Variables & Design Tokens', status: 'Mastered' },
      { name: 'DOM Event Listeners & State', status: 'Mastered' }
    ].map((m, idx) => `
      <g transform="translate(24, ${70 + idx * 65})">
        <text y="0" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="14" font-weight="600">${m.name}</text>
        <rect x="0" y="10" width="310" height="6" rx="3" fill="rgba(255,255,255,0.08)"/>
        <rect x="0" y="10" width="${280 - idx * 10}" height="6" rx="3" fill="#38bdf8"/>
        <text x="310" y="3" fill="#34d399" font-family="monospace" font-size="11" text-anchor="end">${m.status}</text>
      </g>
    `).join('')}
  </g>

  <!-- Right: Interactive Component Showcase -->
  <g transform="translate(460, 210)">
    <!-- Buttons card -->
    <rect width="750" height="210" rx="14" fill="rgba(255,255,255,0.02)" stroke="rgba(56, 189, 248, 0.25)"/>
    <text x="30" y="40" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="16" font-weight="700">UI COMPONENT TOKENS</text>
    
    <!-- Button previews -->
    <g transform="translate(30, 70)">
      <rect width="140" height="42" rx="10" fill="#38bdf8"/>
      <text x="70" y="26" fill="#000" font-family="system-ui, sans-serif" font-size="13" font-weight="800" text-anchor="middle">Primary Glow</text>

      <g transform="translate(160, 0)">
        <rect width="140" height="42" rx="10" fill="linear-gradient(135deg, #a855f7, #ec4899)"/>
        <text x="70" y="26" fill="#fff" font-family="system-ui, sans-serif" font-size="13" font-weight="800" text-anchor="middle">Gradient Pulse</text>
      </g>

      <g transform="translate(320, 0)">
        <rect width="140" height="42" rx="10" fill="none" stroke="#10b981" stroke-width="2"/>
        <text x="70" y="26" fill="#10b981" font-family="system-ui, sans-serif" font-size="13" font-weight="800" text-anchor="middle">Outline Cyber</text>
      </g>
    </g>

    <!-- Palette Swatches -->
    <g transform="translate(30, 140)">
      <rect x="0" y="0" width="60" height="40" rx="8" fill="#38bdf8"/>
      <rect x="75" y="0" width="60" height="40" rx="8" fill="#818cf8"/>
      <rect x="150" y="0" width="60" height="40" rx="8" fill="#a855f7"/>
      <rect x="225" y="0" width="60" height="40" rx="8" fill="#10b981"/>
      <rect x="300" y="0" width="60" height="40" rx="8" fill="#f59e0b"/>
      <text x="420" y="25" fill="#94a3b8" font-family="monospace" font-size="12">Tailored HSL Design Tokens</text>
    </g>

    <!-- Bottom: Flexbox / Grid Preview -->
    <g transform="translate(0, 230)">
      <rect width="750" height="210" rx="14" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.06)"/>
      <text x="30" y="35" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="15" font-weight="700">RESPONSIVE CSS GRID CARDS</text>
      
      <g transform="translate(30, 55)">
        ${[1, 2, 3].map((card, idx) => `
          <g transform="translate(${idx * 230}, 0)">
            <rect width="210" height="125" rx="10" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)"/>
            <text x="20" y="35" fill="#38bdf8" font-family="monospace" font-size="12">Grid Item 0${card}</text>
            <text x="20" y="65" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="14" font-weight="700">Dynamic Card ${card}</text>
            <text x="20" y="95" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">Fluid width 1fr</text>
          </g>
        `).join('')}
      </g>
    </g>
  </g>
`;
  return wrapSvg('WEB DEVELOPMENT FUNDAMENTALS // SANDBOX', 'ABHIJEET MAHAKUR', content, '#38bdf8', '#818cf8');
}

// 12. Python Algorithms
function createPythonSvg() {
  const content = `
  <rect x="40" y="110" width="650" height="570" rx="18" fill="url(#cardBg)" stroke="rgba(56, 189, 248, 0.35)" stroke-width="1.5" filter="url(#glow)"/>
  <text x="70" y="155" fill="#facc15" font-family="monospace" font-size="16" font-weight="700">algorithms.py // Python DSA Suite</text>

  <g transform="translate(70, 195)" font-family="monospace" font-size="14">
    <text y="0" fill="#60a5fa">class <tspan fill="#facc15">BinarySearchTree</tspan>:</text>
    <text y="30" fill="#94a3b8">    def __init__(self):</text>
    <text y="60" fill="#94a3b8">        self.root = None</text>
    <text y="100" fill="#60a5fa">    def <tspan fill="#facc15">depth_first_search</tspan>(self, graph, start):</text>
    <text y="130" fill="#94a3b8">        visited = set()</text>
    <text y="160" fill="#94a3b8">        return self._dfs_recursive(graph, start, visited)</text>
    <text y="200" fill="#60a5fa">    def <tspan fill="#facc15">knapsack_dp</tspan>(self, weights, values, capacity):</text>
    <text y="230" fill="#94a3b8">        dp = [[0] * (capacity + 1) for _ in range(len(weights) + 1)]</text>
    <text y="260" fill="#94a3b8">        # Solves 0/1 knapsack in O(nW) time</text>
    <text y="290" fill="#a855f7">        return dp[len(weights)][capacity]</text>
    <text y="340" fill="#34d399">✓ 42/42 Algorithms Verified with PyTest</text>
  </g>

  <!-- Right: Terminal Execution Runner -->
  <rect x="715" y="110" width="525" height="570" rx="18" fill="#060913" stroke="rgba(250, 204, 21, 0.35)" stroke-width="1.5" filter="url(#glow)"/>
  <rect x="715" y="110" width="525" height="48" rx="18" fill="rgba(15, 23, 42, 0.9)"/>
  <text x="745" y="140" fill="#f8fafc" font-family="monospace" font-size="13" font-weight="700">TERMINAL // pytest execution</text>

  <g transform="translate(745, 190)" font-family="monospace" font-size="13">
    <text y="0" fill="#38bdf8">root@workstation:~/python$</text>
    <text y="25" fill="#f8fafc">pytest -v test_algorithms.py</text>
    <text y="65" fill="#94a3b8">==================== test session starts ====================</text>
    <text y="90" fill="#94a3b8">platform linux -- Python 3.11.8, pytest-8.1.1</text>
    <text y="130" fill="#34d399">test_algorithms.py::test_binary_search_tree PASSED     [ 25%]</text>
    <text y="160" fill="#34d399">test_algorithms.py::test_graph_dfs_bfs      PASSED     [ 50%]</text>
    <text y="190" fill="#34d399">test_algorithms.py::test_knapsack_dp        PASSED     [ 75%]</text>
    <text y="220" fill="#34d399">test_algorithms.py::test_sorting_benchmarks PASSED     [100%]</text>
    <text y="260" fill="#94a3b8">------------------------------------------------------------</text>
    <text y="290" fill="#34d399">✓ 42 passed in 0.12s (Optimal Asymptotic Efficiency)</text>
    <text y="340" fill="#38bdf8">root@workstation:~/python$</text>
    <text y="365" fill="#facc15">_</text>
  </g>
`;
  return wrapSvg('PYTHON // DATA STRUCTURES &amp; ALGORITHMS SUITE', 'ABHIJEET MAHAKUR', content, '#38bdf8', '#facc15');
}

// Write the files
fs.writeFileSync(path.join(publicDir, 'project_personalportfolio.svg'), createPersonalPortfolioSvg());
fs.writeFileSync(path.join(publicDir, 'project_amazonclone.svg'), createAmazonCloneSvg());
fs.writeFileSync(path.join(publicDir, 'project_gravisphere.svg'), createGraviSphereSvg());
fs.writeFileSync(path.join(publicDir, 'project_ips.svg'), createIpsSvg());
fs.writeFileSync(path.join(publicDir, 'project_truckflow.svg'), createTruckFlowSvg());
fs.writeFileSync(path.join(publicDir, 'project_spotifyclone.svg'), createSpotifyCloneSvg());
fs.writeFileSync(path.join(publicDir, 'project_airwriting.svg'), createAirWritingSvg());
fs.writeFileSync(path.join(publicDir, 'project_djangoblog.svg'), createDjangoBlogSvg());
fs.writeFileSync(path.join(publicDir, 'project_attendanceapp.svg'), createAttendanceAppSvg());
fs.writeFileSync(path.join(publicDir, 'project_thermax.svg'), createThermaXSvg());
fs.writeFileSync(path.join(publicDir, 'project_webdevbasic.svg'), createWebDevBasicSvg());
fs.writeFileSync(path.join(publicDir, 'project_python.svg'), createPythonSvg());

console.log('Successfully generated authentic, bespoke SVGs for ALL projects in public/!');
