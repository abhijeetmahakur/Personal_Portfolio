import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const publicDir = path.join(rootDir, 'public');
const distDir = path.join(rootDir, 'dist');
const tempDir = path.join(rootDir, 'temp_cert_render');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// 1. HTML FOR THIRANEX CERTIFICATE (2400 x 1650)
const thiranexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Thiranex Certificate of Achievement - Abhijeet Mahakur</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;800&family=Great+Vibes&family=Montserrat:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 2400px;
      height: 1650px;
      background: #fdfdfd;
      font-family: 'Montserrat', sans-serif;
      color: #1e293b;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px;
      -webkit-font-smoothing: antialiased;
    }
    .cert-frame {
      width: 100%;
      height: 100%;
      background: #ffffff;
      border: 8px solid #0f2e59;
      position: relative;
      padding: 50px 70px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: inset 0 0 0 4px #e2b755, inset 0 0 0 12px #ffffff, inset 0 0 0 14px #0f2e59;
    }
    .corner-decor {
      position: absolute;
      width: 60px;
      height: 60px;
      border: 3px solid #e2b755;
    }
    .top-left { top: 20px; left: 20px; border-right: none; border-bottom: none; }
    .top-right { top: 20px; right: 20px; border-left: none; border-bottom: none; }
    .bottom-left { bottom: 20px; left: 20px; border-right: none; border-top: none; }
    .bottom-right { bottom: 20px; right: 20px; border-left: none; border-top: none; }

    /* Header */
    .cert-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 15px;
    }
    .brand-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .thiranex-logo {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .thiranex-icon {
      width: 54px;
      height: 54px;
    }
    .thiranex-title {
      font-size: 52px;
      font-weight: 800;
      color: #0284c7;
      letter-spacing: -0.5px;
      font-family: 'Montserrat', sans-serif;
    }
    .thiranex-sub {
      font-size: 15px;
      letter-spacing: 4px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      margin-left: 2px;
    }
    .msme-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      background: #f8fafc;
      padding: 12px 24px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .msme-text {
      font-size: 26px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 2px;
    }
    .msme-sub {
      font-size: 11px;
      color: #475569;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Main Content */
    .cert-body {
      text-align: center;
      margin: 20px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .cert-headline {
      font-family: 'Playfair Display', serif;
      font-size: 78px;
      font-weight: 700;
      color: #0f2e59;
      margin-bottom: 8px;
      letter-spacing: 1px;
    }
    .cert-subhead {
      font-size: 26px;
      letter-spacing: 8px;
      text-transform: uppercase;
      color: #e2b755;
      font-weight: 700;
      margin-bottom: 35px;
    }
    .cert-present-to {
      font-size: 24px;
      color: #475569;
      font-style: italic;
      margin-bottom: 25px;
    }
    .recipient-name {
      font-family: 'Cinzel', serif;
      font-size: 68px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 2px;
      margin-bottom: 12px;
      display: inline-block;
      position: relative;
    }
    .name-divider {
      width: 480px;
      height: 3px;
      background: linear-gradient(90deg, transparent, #e2b755, #0f2e59, #e2b755, transparent);
      margin: 0 auto 35px auto;
    }
    .cert-description {
      font-size: 26px;
      line-height: 1.7;
      color: #334155;
      max-width: 1700px;
      margin: 0 auto;
    }
    .cert-description strong {
      color: #0f172a;
      font-weight: 700;
    }

    /* Footer */
    .cert-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 0 30px;
      margin-bottom: 15px;
    }
    .qr-block {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .qr-img {
      width: 130px;
      height: 130px;
      background: #ffffff;
      border: 2px solid #cbd5e1;
      padding: 6px;
      border-radius: 8px;
    }
    .qr-meta {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .qr-tag {
      font-size: 14px;
      letter-spacing: 2px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    .cert-id-tag {
      font-size: 20px;
      font-weight: 800;
      color: #0284c7;
      font-family: 'Montserrat', sans-serif;
    }

    /* Seal */
    .seal-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .gold-seal {
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: radial-gradient(circle, #fde047 0%, #ca8a04 80%, #a16207 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 4px dashed #ffffff;
      box-shadow: 0 10px 25px rgba(202, 138, 4, 0.4);
      color: #ffffff;
      text-align: center;
    }
    .seal-inner {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      text-shadow: 0 1px 2px rgba(0,0,0,0.4);
    }
    .seal-stars {
      font-size: 16px;
      margin: 2px 0;
    }

    /* Signature */
    .sig-block {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .sig-cursive {
      font-family: 'Great Vibes', cursive;
      font-size: 64px;
      color: #0f2e59;
      height: 70px;
      line-height: 70px;
      margin-bottom: 6px;
    }
    .sig-line {
      width: 280px;
      height: 2px;
      background: #94a3b8;
      margin-bottom: 10px;
    }
    .sig-name {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
    }
    .sig-role {
      font-size: 16px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
  </style>
</head>
<body>
  <div class="cert-frame">
    <div class="corner-decor top-left"></div>
    <div class="corner-decor top-right"></div>
    <div class="corner-decor bottom-left"></div>
    <div class="corner-decor bottom-right"></div>

    <div class="cert-header">
      <div class="brand-group">
        <div class="thiranex-logo">
          <svg class="thiranex-icon" viewBox="0 0 100 100" fill="none">
            <path d="M20 20 L80 20 L50 80 Z" fill="#0284c7" opacity="0.9"/>
            <path d="M35 30 L90 50 L45 85 Z" fill="#38bdf8" opacity="0.75"/>
            <circle cx="50" cy="50" r="16" fill="#0f2e59"/>
          </svg>
          <div class="thiranex-title">Thiranex</div>
        </div>
        <div class="thiranex-sub">Skill Development & Future Tech</div>
      </div>

      <div class="msme-badge">
        <svg width="42" height="30" viewBox="0 0 60 40">
          <rect width="60" height="13.3" fill="#FF9933"/>
          <rect y="13.3" width="60" height="13.3" fill="#FFFFFF"/>
          <rect y="26.6" width="60" height="13.3" fill="#138808"/>
          <circle cx="30" cy="20" r="5" fill="#000080"/>
        </svg>
        <div class="msme-text">MSME</div>
        <div class="msme-sub">Govt. of India Registered</div>
      </div>
    </div>

    <div class="cert-body">
      <h1 class="cert-headline">Certificate</h1>
      <div class="cert-subhead">OF ACHIEVEMENT</div>
      <p class="cert-present-to">This acknowledgement is proudly presented to</p>
      <div class="recipient-name">Abhijeet Mahakur</div>
      <div class="name-divider"></div>
      <p class="cert-description">
        This is to certify that <strong>Abhijeet Mahakur</strong> has successfully completed an intensive internship<br>
        in <strong>Web Development</strong> from <strong>27 Jul 2026</strong> to <strong>26 Aug 2026</strong>.
      </p>
    </div>

    <div class="cert-footer">
      <div class="qr-block">
        <svg class="qr-img" viewBox="0 0 100 100" fill="#0f172a">
          <rect width="100" height="100" fill="#ffffff"/>
          <!-- QR finder patterns -->
          <rect x="10" y="10" width="26" height="26" rx="4" fill="#0f2e59"/>
          <rect x="15" y="15" width="16" height="16" fill="#ffffff"/>
          <rect x="19" y="19" width="8" height="8" fill="#0f2e59"/>

          <rect x="64" y="10" width="26" height="26" rx="4" fill="#0f2e59"/>
          <rect x="69" y="15" width="16" height="16" fill="#ffffff"/>
          <rect x="73" y="19" width="8" height="8" fill="#0f2e59"/>

          <rect x="10" y="64" width="26" height="26" rx="4" fill="#0f2e59"/>
          <rect x="15" y="69" width="16" height="16" fill="#ffffff"/>
          <rect x="19" y="73" width="8" height="8" fill="#0f2e59"/>

          <!-- QR modules -->
          <rect x="42" y="12" width="6" height="14" fill="#0f2e59"/>
          <rect x="52" y="16" width="6" height="8" fill="#0f2e59"/>
          <rect x="44" y="32" width="14" height="6" fill="#0f2e59"/>
          <rect x="14" y="44" width="12" height="6" fill="#0f2e59"/>
          <rect x="32" y="44" width="8" height="14" fill="#0f2e59"/>
          <rect x="46" y="46" width="10" height="10" fill="#0f2e59"/>
          <rect x="64" y="44" width="8" height="8" fill="#0f2e59"/>
          <rect x="78" y="44" width="12" height="12" fill="#0f2e59"/>
          <rect x="44" y="66" width="14" height="8" fill="#0f2e59"/>
          <rect x="64" y="66" width="8" height="16" fill="#0f2e59"/>
          <rect x="78" y="64" width="10" height="8" fill="#0f2e59"/>
          <rect x="74" y="78" width="14" height="10" fill="#0f2e59"/>
        </svg>
        <div class="qr-meta">
          <span class="qr-tag">Verified Certificate</span>
          <span class="cert-id-tag">ID: THX-JUL2726-371</span>
        </div>
      </div>

      <div class="seal-wrap">
        <div class="gold-seal">
          <div class="seal-inner">THIRANEX</div>
          <div class="seal-stars">★ ★ ★ ★ ★</div>
          <div class="seal-inner" style="font-size: 11px;">OFFICIAL SEAL</div>
        </div>
      </div>

      <div class="sig-block">
        <div class="sig-cursive">Hariharan M</div>
        <div class="sig-line"></div>
        <div class="sig-name">Hariharan M</div>
        <div class="sig-role">Founder & CEO</div>
      </div>
    </div>
  </div>
</body>
</html>
`;

// 2. HTML FOR POD.AI CERTIFICATE (2400 x 1650)
const podaiHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Pod.ai Certificate of Participation - Abhijeet Mahakur</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 2400px;
      height: 1650px;
      background: #f8fafc;
      font-family: 'Inter', sans-serif;
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      -webkit-font-smoothing: antialiased;
    }
    .cert-card {
      width: 100%;
      height: 100%;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      display: flex;
      overflow: hidden;
      box-shadow: 0 25px 60px rgba(15, 23, 42, 0.12);
      position: relative;
    }

    /* Left Purple Banner */
    .purple-spine {
      width: 190px;
      background: linear-gradient(180deg, #4c1d95 0%, #581c87 50%, #3b0764 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 50px 0;
      position: relative;
      flex-shrink: 0;
    }
    .cr-badge {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 24px;
      color: #581c87;
      letter-spacing: -1px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.25);
    }
    .vertical-title-wrap {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .vertical-title {
      color: #ffffff;
      font-size: 38px;
      font-weight: 700;
      letter-spacing: 5px;
      text-transform: uppercase;
      font-family: 'Outfit', sans-serif;
    }

    /* Main Area */
    .main-content {
      flex: 1;
      padding: 70px 90px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }

    /* Background Watermark */
    .watermark-emblem {
      position: absolute;
      right: 70px;
      bottom: 70px;
      width: 480px;
      height: 480px;
      opacity: 0.055;
      pointer-events: none;
    }

    /* Header Row */
    .top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .pod-brand {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .pod-icon {
      width: 65px;
      height: 65px;
    }
    .pod-wordmark {
      font-family: 'Outfit', sans-serif;
      font-size: 68px;
      font-weight: 800;
      color: #6b21a8;
      letter-spacing: -2px;
    }
    .qr-badge-block {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
    }
    .page-indicator {
      font-size: 18px;
      font-weight: 700;
      color: #94a3b8;
      letter-spacing: 1px;
    }
    .pod-qr {
      width: 105px;
      height: 105px;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 5px;
    }

    /* Center Text */
    .center-text {
      margin: 40px 0;
    }
    .presented-tag {
      font-size: 26px;
      font-weight: 500;
      color: #475569;
      margin-bottom: 24px;
    }
    .pod-recipient {
      font-family: 'Outfit', sans-serif;
      font-size: 78px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -1px;
      margin-bottom: 30px;
    }
    .pod-body-desc {
      font-size: 28px;
      line-height: 1.68;
      color: #334155;
      max-width: 1700px;
    }
    .pod-body-desc strong {
      color: #0f172a;
      font-weight: 700;
    }

    /* Bottom Signatures */
    .bottom-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid #f1f5f9;
      padding-top: 35px;
    }
    .sig-area {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    .pod-sig-cursive {
      font-family: 'Great Vibes', cursive;
      font-size: 64px;
      color: #581c87;
      height: 70px;
      line-height: 70px;
      margin-bottom: 8px;
    }
    .sig-divider {
      width: 300px;
      height: 2px;
      background: #cbd5e1;
      margin-bottom: 12px;
    }
    .sig-director {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .sig-company {
      font-size: 18px;
      color: #64748b;
      font-weight: 500;
    }
    .auth-badge {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fdf4ff;
      border: 1px solid #f0abfc;
      padding: 12px 24px;
      border-radius: 9999px;
    }
    .auth-badge span {
      font-size: 18px;
      font-weight: 700;
      color: #a21caf;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="cert-card">
    <div class="purple-spine">
      <div class="cr-badge">cr</div>
      <div class="vertical-title-wrap">
        <span class="vertical-title">Certificate of Participation</span>
      </div>
      <div style="height: 40px;"></div>
    </div>

    <div class="main-content">
      <!-- Watermark SVG -->
      <svg class="watermark-emblem" viewBox="0 0 100 100" fill="#6b21a8">
        <polygon points="50,5 90,25 90,75 50,95 10,75 10,25"/>
        <circle cx="50" cy="50" r="28" fill="#581c87"/>
      </svg>

      <div class="top-row">
        <div class="pod-brand">
          <svg class="pod-icon" viewBox="0 0 100 100" fill="none">
            <path d="M30 25 C30 15, 45 15, 45 35 C45 55, 30 55, 30 75" stroke="#7e22ce" stroke-width="12" stroke-linecap="round"/>
            <path d="M70 25 C70 15, 55 15, 55 35 C55 55, 70 55, 70 75" stroke="#a855f7" stroke-width="12" stroke-linecap="round"/>
            <circle cx="37" cy="20" r="8" fill="#7e22ce"/>
            <circle cx="63" cy="20" r="8" fill="#a855f7"/>
          </svg>
          <span class="pod-wordmark">pod</span>
        </div>

        <div class="qr-badge-block">
          <span class="page-indicator">1 / 3</span>
          <svg class="pod-qr" viewBox="0 0 100 100" fill="#1e1b4b">
            <rect width="100" height="100" fill="#ffffff"/>
            <rect x="10" y="10" width="26" height="26" rx="4" fill="#581c87"/>
            <rect x="15" y="15" width="16" height="16" fill="#ffffff"/>
            <rect x="19" y="19" width="8" height="8" fill="#581c87"/>

            <rect x="64" y="10" width="26" height="26" rx="4" fill="#581c87"/>
            <rect x="69" y="15" width="16" height="16" fill="#ffffff"/>
            <rect x="73" y="19" width="8" height="8" fill="#581c87"/>

            <rect x="10" y="64" width="26" height="26" rx="4" fill="#581c87"/>
            <rect x="15" y="69" width="16" height="16" fill="#ffffff"/>
            <rect x="19" y="73" width="8" height="8" fill="#581c87"/>

            <rect x="42" y="14" width="10" height="10" fill="#581c87"/>
            <rect x="44" y="44" width="12" height="12" fill="#581c87"/>
            <rect x="68" y="44" width="16" height="8" fill="#581c87"/>
            <rect x="44" y="68" width="14" height="14" fill="#581c87"/>
            <rect x="68" y="72" width="18" height="12" fill="#581c87"/>
          </svg>
        </div>
      </div>

      <div class="center-text">
        <p class="presented-tag">This certificate is proudly presented to</p>
        <h2 class="pod-recipient">Abhijeet Mahakur</h2>
        <p class="pod-body-desc">
          For actively participating and engaging in the Expert Talk: <strong>The Automated Testing Mindset</strong>, conducted by <strong>Vinay Kushwaha</strong>, Frontend Expert, on <strong>10th September 2026</strong>.
        </p>
      </div>

      <div class="bottom-row">
        <div class="sig-area">
          <div class="pod-sig-cursive">Rishu Gupta</div>
          <div class="sig-divider"></div>
          <div class="sig-director">Rishu Gupta</div>
          <div class="sig-company">Co-founder and Director, Pod.ai</div>
        </div>

        <div class="auth-badge">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a21caf" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>Verified Credential</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

// Save HTML files
const thiranexFile = path.join(tempDir, 'thiranex.html');
const podaiFile = path.join(tempDir, 'podai.html');
fs.writeFileSync(thiranexFile, thiranexHtml, 'utf8');
fs.writeFileSync(podaiFile, podaiHtml, 'utf8');

console.log('Rendering Ultra HD Certificates via Headless Chrome...');

const thiranexPng = path.join(tempDir, 'thiranex.png');
const podaiPng = path.join(tempDir, 'podai.png');

try {
  const cmd1 = `"${chromePath}" --headless --disable-gpu --screenshot="${thiranexPng}" --window-size=2400,1650 --hide-scrollbars "file:///${thiranexFile.replace(/\\/g, '/')}"`;
  const cmd2 = `"${chromePath}" --headless --disable-gpu --screenshot="${podaiPng}" --window-size=2400,1650 --hide-scrollbars "file:///${podaiFile.replace(/\\/g, '/')}"`;
  execSync(cmd1, { stdio: 'inherit' });
  execSync(cmd2, { stdio: 'inherit' });
  console.log('Chrome screenshots rendered successfully!');
} catch (e) {
  console.error('Error rendering screenshots:', e.message);
}

// Convert/Copy to public and dist as crystal-clear JPGs
const targetThiranexPub = path.join(publicDir, 'cert_thiranex_webdev.jpg');
const targetThiranexDist = path.join(distDir, 'cert_thiranex_webdev.jpg');
const targetPodaiPub = path.join(publicDir, 'cert_podai_testing.jpg');
const targetPodaiDist = path.join(distDir, 'cert_podai_testing.jpg');

if (fs.existsSync(thiranexPng)) {
  fs.copyFileSync(thiranexPng, targetThiranexPub);
  fs.copyFileSync(thiranexPng, targetThiranexDist);
  console.log('Saved crystal clear:', targetThiranexPub);
}
if (fs.existsSync(podaiPng)) {
  fs.copyFileSync(podaiPng, targetPodaiPub);
  fs.copyFileSync(podaiPng, targetPodaiDist);
  console.log('Saved crystal clear:', targetPodaiPub);
}

console.log('Done!');
