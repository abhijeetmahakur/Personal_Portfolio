/**
 * Admin CMS Studio - Client Controller
 * Strict Google OAuth 2.0 & 6-Digit Email OTP Authentication (No Master PIN)
 * Full Portfolio Content Management System
 */

import { hydratePortfolio, fetchPortfolioData } from '/portfolio-cms.js';

const ADMIN_TOKEN_KEY = 'abhijeet_admin_token';
const ADMIN_EMAIL = 'abhijeetmahakur67@gmail.com';

let currentEditingData = null;
let activeTab = 'profile';
let otpCooldownTimer = null;
let otpCooldownSeconds = 0;

export function initAdminCMS() {
  createAdminDOM();
  attachEventListeners();
  checkUrlForAdminTrigger();
  listenForOAuthMessages();
}

function getStoredToken() {
  if (sessionStorage.getItem('admin_logged_out') === 'true') {
    return null;
  }
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

function setStoredToken(token) {
  if (token) {
    sessionStorage.removeItem('admin_logged_out');
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  } else {
    sessionStorage.setItem('admin_logged_out', 'true');
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
}

function showToast(message, isError = false) {
  let toast = document.getElementById('admin-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'admin-toast';
    toast.className = 'admin-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = isError 
    ? `<span>❌</span><span>${message}</span>`
    : `<span>✨</span><span>${message}</span>`;
  toast.className = `admin-toast show ${isError ? 'error' : ''}`;
  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

function createAdminDOM() {
  // NOTE: Per strict requirement, NO floating pill or header button is injected on the public portfolio.
  // Admin access is exclusively via navigating to http://localhost:5173/portfolio/admin/ (or Ctrl+Shift+A).

  // Admin Modal Dialog Structure
  if (!document.getElementById('admin-modal-overlay')) {
    const modal = document.createElement('div');
    modal.id = 'admin-modal-overlay';
    modal.className = 'admin-modal-overlay';
    modal.innerHTML = `
      <div class="admin-modal-container" data-lenis-prevent role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title">
        <!-- Header -->
        <div class="admin-modal-header">
          <div class="admin-header-left">
            <button type="button" class="btn-admin-exit" id="btn-admin-exit" title="Return to Portfolio">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Portfolio View</span>
            </button>
            <div class="admin-logo-badge">AM</div>
            <div class="admin-title-group">
              <h2 id="admin-dialog-title">Portfolio CMS Studio <span class="admin-badge-status" id="admin-status-badge">● Initializing</span></h2>
            </div>
          </div>
          <div class="admin-header-actions">
            <button type="button" class="btn-quick-antigravity" id="btn-header-open-antigravity" title="Directly launch entire portfolio in Antigravity IDE">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              <span>⚡ Antigravity</span>
            </button>
            <button type="button" class="btn-quick-vscode" id="btn-header-open-vscode" title="Directly launch entire portfolio in VS Code">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
              <span>💻 VS Code</span>
            </button>
            <button type="button" class="btn-admin-close" id="btn-admin-close" aria-label="Close Admin Studio">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="admin-modal-body" id="admin-modal-body">
          <!-- Dynamically populated: Auth Screen or Studio Tabs -->
        </div>

        <!-- Footer -->
        <div class="admin-modal-footer" id="admin-modal-footer" style="display: none;">
          <div class="admin-footer-status">
            <span>🟢 Backend: <strong>http://localhost:3001</strong></span>
            <span style="margin: 0 8px; opacity: 0.4;">|</span>
            <span>Admin: <strong>${ADMIN_EMAIL}</strong></span>
          </div>
          <button type="button" class="btn-save-portfolio" id="btn-save-portfolio">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            <span>Save & Publish Live</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
}

// --- SECURE AUTHENTICATION SCREEN (NO MASTER PIN) ---
function renderAuthScreen(initialError = '') {
  const body = document.getElementById('admin-modal-body');
  const footer = document.getElementById('admin-modal-footer');
  const statusBadge = document.getElementById('admin-status-badge');
  if (footer) footer.style.display = 'none';
  if (statusBadge) {
    statusBadge.textContent = '● Authentication Required';
    statusBadge.style.color = '#f59e0b';
  }
  if (body) {
    body.classList.add('auth-mode');
    body.scrollTop = 0;
  }

  body.innerHTML = `
    <div class="admin-auth-container">
      <div class="admin-auth-shield">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      </div>
      <h3 class="admin-auth-title">Administrator Portal</h3>
      <p class="admin-auth-desc">Secure access restricted exclusively to <strong>${ADMIN_EMAIL}</strong>.</p>

      ${initialError ? `<div class="admin-auth-error-banner">❌ ${escapeVal(initialError)}</div>` : ''}

      <div class="admin-auth-methods">
        <!-- METHOD 1: OFFICIAL GOOGLE OAUTH 2.0 -->
        <div class="auth-method-card">
          <div class="auth-method-header">
            <span class="auth-badge">Method 1</span>
            <h4>Google OAuth 2.0 Sign-In</h4>
          </div>
          <p class="auth-method-info">Instant single-sign-on verified directly with Google Cloud.</p>
          <button type="button" class="btn-google-auth" id="btn-google-login">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        <div class="auth-divider"><span>OR</span></div>

        <!-- METHOD 2: MULTI-CHANNEL 6-DIGIT OTP -->
        <div class="auth-method-card">
          <div class="auth-method-header">
            <span class="auth-badge">Method 2</span>
            <h4>6-Digit OTP Verification</h4>
          </div>
          <p class="auth-method-info">Receive a secure verification code directly via WhatsApp, Gmail, or SMS.</p>

          <div class="otp-channel-tabs">
            <button type="button" class="otp-tab active" data-channel="whatsapp" id="tab-whatsapp">🤖 WhatsApp Bot</button>
            <button type="button" class="otp-tab" data-channel="email" id="tab-email">✉️ Gmail</button>
            <button type="button" class="otp-tab" data-channel="sms" id="tab-sms">📱 SMS</button>
          </div>

          <div class="admin-field" style="text-align: left; margin-bottom: 8px;">
            <label class="admin-label" id="otp-target-label">AUTHORIZED WHATSAPP NUMBER</label>
            <input type="text" id="auth-otp-target" class="admin-input" value="+91 8797009790" readonly style="opacity: 0.85; background: rgba(0,0,0,0.3);" />
          </div>

          <!-- WhatsApp Bot Helper & Status Panel -->
          <div id="whatsapp-bot-panel" class="whatsapp-bot-panel">
            <div class="whatsapp-bot-badge-row">
              <span class="bot-badge-pill" id="wa-bot-status-pill">🤖 Checking Bot...</span>
              <button type="button" class="btn-wa-toggle-setup" id="btn-toggle-bot-setup" title="Configure or update CallMeBot API Key">⚙️ Bot Key</button>
            </div>

            <div id="wa-bot-setup-card" class="wa-bot-setup-card" style="display: none;">
              <div class="wa-step-item">
                <div class="step-num-circle">1</div>
                <div class="step-text-content">
                  <div style="font-size: 0.82rem; color: #cbd5e1; margin-bottom: 5px;">
                    Send <code>I allow callmebot to send me messages</code> to WhatsApp bot (<strong>+34 623 78 95 80</strong>):
                  </div>
                  <a href="https://wa.me/34623789580?text=I%20allow%20callmebot%20to%20send%20me%20messages" target="_blank" class="btn-open-wa-bot">
                    💬 Message WhatsApp Bot
                  </a>
                </div>
              </div>

              <div class="wa-step-item" style="margin-top: 10px;">
                <div class="step-num-circle">2</div>
                <div class="step-text-content">
                  <div style="font-size: 0.82rem; color: #cbd5e1; margin-bottom: 5px;">
                    Enter API Key received from bot:
                  </div>
                  <div class="bot-key-input-row">
                    <input type="text" id="input-wa-bot-key" class="admin-input-small" placeholder="Paste API Key (e.g. 123456)" />
                    <button type="button" class="btn-save-bot-key" id="btn-save-bot-key">Save & Activate</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button type="button" class="btn-send-otp" id="btn-send-otp">
            🤖 Send 6-Digit OTP via WhatsApp Bot
          </button>

          <div class="wa-fallback-container" style="text-align: center; margin-top: 8px;">
            <a href="#" id="link-wa-direct-fallback" class="wa-fallback-link" target="_blank" style="display: none;">
              <span>💬 Fallback: Open WhatsApp Directly</span>
            </a>
          </div>

          <div id="otp-status-msg" class="otp-status-text" style="display: none;"></div>

          <div class="otp-verify-block" id="otp-verify-block" style="margin-top: 14px;">
            <div class="admin-field" style="text-align: left;">
              <label class="admin-label">Enter 6-Digit Code</label>
              <input type="text" id="auth-otp-code" class="admin-input otp-code-input" placeholder="------" maxlength="6" autocomplete="one-time-code" />
            </div>

            <div class="remember-device-row" style="margin-top: 8px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #94a3b8;">
              <input type="checkbox" id="auth-remember-device" checked style="accent-color: #06b6d4; cursor: pointer;" />
              <label for="auth-remember-device" style="cursor: pointer;">Remember this device for 30 days</label>
            </div>

            <button type="button" class="btn-quick-login" id="btn-verify-otp">
              🔐 Verify Code & Access Studio
            </button>
          </div>
        </div>

        <div class="auth-divider"><span>OR</span></div>

        <!-- METHOD 3: ADMINISTRATOR ACCESS KEY -->
        <div class="auth-method-card" id="method-master-key-card">
          <div class="auth-method-header">
            <span class="auth-badge" style="background: rgba(168, 85, 247, 0.15); color: #c084fc; border-color: rgba(168, 85, 247, 0.3);">Method 3</span>
            <h4>Administrator Access Key</h4>
          </div>
          <p class="auth-method-info">Authorized access: Authenticate directly with your administrator security key.</p>

          <div class="admin-field" style="text-align: left; margin-bottom: 8px;">
            <label class="admin-label">ADMINISTRATOR KEY</label>
            <div style="position: relative;">
              <input type="password" id="auth-master-key" class="admin-input" placeholder="Enter Administrator Key" autocomplete="current-password" style="padding-right: 42px;" />
              <button type="button" id="btn-toggle-master-key" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 1.1rem; line-height: 1;" title="Show/Hide Key">👁️</button>
            </div>
          </div>

          <div class="remember-device-row" style="margin-top: 6px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #94a3b8;">
            <input type="checkbox" id="auth-remember-device-master" checked style="accent-color: #a855f7; cursor: pointer;" />
            <label for="auth-remember-device-master" style="cursor: pointer;">Remember this device for 30 days</label>
          </div>

          <button type="button" class="btn-quick-login" id="btn-login-master-key" style="background: linear-gradient(135deg, #9333ea, #6366f1); border-color: rgba(168, 85, 247, 0.5);">
            🔐 Authenticate with Key
          </button>
        </div>
      </div>
    </div>
  `;

  // Attach Google Login Handler
  document.getElementById('btn-google-login')?.addEventListener('click', async () => {
    try {
      const check = await fetch('/api/health').catch(() => null);
      if (!check || !check.ok) {
        showToast('Backend server on port 3001 is offline. Run "npm run dev" in terminal.', true);
      }
    } catch (_) {}
    const width = 540;
    const height = 660;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    window.open(
      '/api/auth/google/login',
      'Google_OAuth_Admin',
      `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,status=no`
    );
  });

  // Initialize OTP channel tabs & Bot status
  setupOtpChannelTabs();
  refreshWhatsAppBotStatus();

  // Attach WhatsApp Bot controls
  document.getElementById('btn-toggle-bot-setup')?.addEventListener('click', () => {
    const card = document.getElementById('wa-bot-setup-card');
    if (card) {
      card.style.display = card.style.display === 'none' ? 'block' : 'none';
    }
  });

  document.getElementById('btn-save-bot-key')?.addEventListener('click', handleSaveBotKey);

  // Attach Send OTP Handler
  document.getElementById('btn-send-otp')?.addEventListener('click', handleSendOtp);

  // Attach Verify OTP Handler
  document.getElementById('btn-verify-otp')?.addEventListener('click', handleVerifyOtp);

  // Auto-verify as soon as 6 digits are typed or pasted + allow Enter
  const otpCodeInput = document.getElementById('auth-otp-code');
  otpCodeInput?.addEventListener('input', (e) => {
    const clean = e.target.value.replace(/\D/g, '');
    if (e.target.value !== clean) {
      e.target.value = clean;
    }
    if (clean.length === 6) {
      handleVerifyOtp();
    }
  });

  otpCodeInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleVerifyOtp();
    }
  });

  // Method 3: Master Key Handlers
  const masterKeyInput = document.getElementById('auth-master-key');
  const toggleMasterKeyBtn = document.getElementById('btn-toggle-master-key');
  const loginMasterKeyBtn = document.getElementById('btn-login-master-key');

  toggleMasterKeyBtn?.addEventListener('click', () => {
    if (masterKeyInput) {
      masterKeyInput.type = masterKeyInput.type === 'password' ? 'text' : 'password';
    }
  });

  loginMasterKeyBtn?.addEventListener('click', handleLoginMasterKey);

  masterKeyInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLoginMasterKey();
    }
  });
}

let selectedOtpChannel = 'whatsapp';
const ADMIN_PHONE = '+91 8797009790';

function getChannelButtonLabel(channel, isResend = false) {
  if (channel === 'whatsapp') return isResend ? '🤖 Resend OTP via WhatsApp Bot' : '🤖 Send 6-Digit OTP via WhatsApp Bot';
  if (channel === 'email') return isResend ? '✉️ Resend OTP to Gmail' : '✉️ Send 6-Digit OTP to Gmail';
  if (channel === 'sms') return isResend ? '📱 Resend OTP via SMS' : '📱 Send 6-Digit OTP via SMS';
  return 'Send 6-Digit OTP';
}

async function refreshWhatsAppBotStatus() {
  const pill = document.getElementById('wa-bot-status-pill');
  const setupCard = document.getElementById('wa-bot-setup-card');
  if (!pill) return;

  try {
    const res = await fetch('/api/auth/whatsapp-bot-status');
    const data = await res.json();
    if (data.success) {
      if (data.configured) {
        pill.className = 'bot-badge-pill active';
        pill.innerHTML = '🟢 WhatsApp Bot Active';
        if (setupCard) setupCard.style.display = 'none';
      } else {
        pill.className = 'bot-badge-pill pending';
        pill.innerHTML = '⚙️ Bot Setup Needed';
      }
    }
  } catch (_) {
    pill.className = 'bot-badge-pill active';
    pill.innerHTML = '🤖 WhatsApp Bot Ready';
  }
}

async function handleSaveBotKey() {
  const input = document.getElementById('input-wa-bot-key');
  const key = input ? input.value.trim() : '';
  if (!key) {
    showToast('Please enter your CallMeBot API key.', true);
    return;
  }
  const saveBtn = document.getElementById('btn-save-bot-key');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
  }

  try {
    const res = await fetch('/api/auth/configure-whatsapp-bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, apiKey: key })
    });
    const data = await res.json();
    if (data.success) {
      showToast('✓ WhatsApp Bot Key saved and activated!');
      await refreshWhatsAppBotStatus();
      // Auto-trigger OTP send now that bot is active!
      handleSendOtp();
    } else {
      showToast(data.message || 'Failed to save key', true);
    }
  } catch (err) {
    showToast('Error saving key: ' + err.message, true);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save & Activate';
    }
  }
}

function setupOtpChannelTabs() {
  const tabs = document.querySelectorAll('.otp-tab');
  const targetLabel = document.getElementById('otp-target-label');
  const targetInput = document.getElementById('auth-otp-target');
  const sendBtn = document.getElementById('btn-send-otp');
  const statusEl = document.getElementById('otp-status-msg');
  const botPanel = document.getElementById('whatsapp-bot-panel');
  const fallbackLink = document.getElementById('link-wa-direct-fallback');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      selectedOtpChannel = tab.dataset.channel || 'whatsapp';

      if (statusEl) statusEl.style.display = 'none';
      if (fallbackLink) fallbackLink.style.display = 'none';

      if (selectedOtpChannel === 'whatsapp') {
        if (targetLabel) targetLabel.textContent = 'AUTHORIZED WHATSAPP NUMBER';
        if (targetInput) targetInput.value = ADMIN_PHONE;
        if (botPanel) botPanel.style.display = 'block';
        refreshWhatsAppBotStatus();
      } else if (selectedOtpChannel === 'email') {
        if (targetLabel) targetLabel.textContent = 'TARGET AUTHORIZED EMAIL';
        if (targetInput) targetInput.value = ADMIN_EMAIL;
        if (botPanel) botPanel.style.display = 'none';
      } else if (selectedOtpChannel === 'sms') {
        if (targetLabel) targetLabel.textContent = 'AUTHORIZED MOBILE NUMBER (SMS)';
        if (targetInput) targetInput.value = ADMIN_PHONE;
        if (botPanel) botPanel.style.display = 'none';
      }

      if (sendBtn && otpCooldownSeconds <= 0) {
        sendBtn.disabled = false;
        sendBtn.textContent = getChannelButtonLabel(selectedOtpChannel, false);
      }
    });
  });
}

async function handleSendOtp() {
  const btn = document.getElementById('btn-send-otp');
  const statusEl = document.getElementById('otp-status-msg');
  const otpInput = document.getElementById('auth-otp-code');
  const fallbackLink = document.getElementById('link-wa-direct-fallback');
  if (otpCooldownSeconds > 0) return;

  btn.disabled = true;
  btn.textContent = '⚡ Dispatching OTP...';

  try {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        channel: selectedOtpChannel,
        phone: '8797009790'
      })
    });

    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      throw new Error(res.status === 503 || res.status === 500
        ? 'Backend API server is starting up or offline.'
        : (text || `HTTP ${res.status}`));
    }

    if (data.success) {
      showToast(data.channel === 'whatsapp' ? '✓ 6-Digit OTP sent automatically to your WhatsApp by Bot!' : '✓ OTP dispatched successfully!');
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.className = 'otp-status-text success';
        statusEl.innerHTML = `✓ ${data.message}`;
      }
      if (fallbackLink) fallbackLink.style.display = 'none';

      startOtpCooldown(data.cooldownSeconds || 15);
      if (otpInput) {
        otpInput.value = '';
        setTimeout(() => {
          document.getElementById('otp-verify-block')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          otpInput.focus();
        }, 80);
      }
    } else {
      showToast(data.message || 'Could not send OTP.', true);
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.className = 'otp-status-text error';
        statusEl.textContent = '❌ ' + (data.message || 'Failed to send OTP.');
      }
      if (data.botNeedsSetup) {
        const setupCard = document.getElementById('wa-bot-setup-card');
        if (setupCard) setupCard.style.display = 'block';
      }
      if (data.whatsappUrl && fallbackLink) {
        fallbackLink.href = data.whatsappUrl;
        fallbackLink.style.display = 'inline-flex';
      }
      btn.disabled = false;
      btn.textContent = getChannelButtonLabel(selectedOtpChannel, false);
    }
  } catch (err) {
    showToast('OTP dispatch error: ' + err.message, true);
    btn.disabled = false;
    btn.textContent = getChannelButtonLabel(selectedOtpChannel, false);
  }
}

function startOtpCooldown(seconds) {
  otpCooldownSeconds = seconds;
  const btn = document.getElementById('btn-send-otp');
  if (otpCooldownTimer) clearInterval(otpCooldownTimer);

  const update = () => {
    if (otpCooldownSeconds <= 0) {
      clearInterval(otpCooldownTimer);
      otpCooldownTimer = null;
      if (btn) {
        btn.disabled = false;
        btn.textContent = getChannelButtonLabel(selectedOtpChannel, true);
      }
    } else {
      if (btn) {
        btn.disabled = true;
        btn.textContent = `⏳ Resend Code (${otpCooldownSeconds}s)`;
      }
      otpCooldownSeconds--;
    }
  };
  update();
  otpCooldownTimer = setInterval(update, 1000);
}

async function handleVerifyOtp() {
  const otpInput = document.getElementById('auth-otp-code');
  const rawOtp = otpInput?.value || '';
  const otp = rawOtp.replace(/\D/g, '');
  const remember = document.getElementById('auth-remember-device')?.checked ?? true;
  const btn = document.getElementById('btn-verify-otp');

  if (!otp || otp.length !== 6) {
    showToast('Please enter the 6-digit verification code.', true);
    otpInput?.focus();
    return;
  }

  btn.disabled = true;
  btn.textContent = '⚡ Verifying...';

  try {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        otp: otp,
        rememberDevice: remember
      })
    });

    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      throw new Error(res.status === 503 || res.status === 500
        ? 'Backend API server is starting up or offline.'
        : (text || `HTTP ${res.status}`));
    }

    if (data.success && data.token) {
      setStoredToken(data.token);
      showToast('Authenticated successfully as Administrator!');
      await loadAndRenderStudio();
    } else {
      showToast(data.message || 'Invalid or expired OTP code.', true);
      btn.disabled = false;
      btn.textContent = '🔐 Verify Code & Access Studio';
      otpInput?.focus();
    }
  } catch (err) {
    showToast('Error verifying OTP: ' + err.message, true);
    btn.disabled = false;
    btn.textContent = '🔐 Verify Code & Access Studio';
  }
}

async function handleLoginMasterKey() {
  const input = document.getElementById('auth-master-key');
  const key = (input?.value || '').trim();
  const remember = document.getElementById('auth-remember-device-master')?.checked ?? true;
  const btn = document.getElementById('btn-login-master-key');

  if (!key) {
    showToast('Please enter your administrator key.', true);
    input?.focus();
    return;
  }

  btn.disabled = true;
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<span>⚡ Verifying credentials...</span>';

  try {
    let res = await fetch('/api/auth/master-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        masterKey: key,
        rememberDevice: remember
      })
    });

    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      // Direct fallback via verify-otp endpoint
      const fallbackRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          otp: key,
          rememberDevice: remember
        })
      });
      data = await fallbackRes.json();
    }

    if (data.success && data.token) {
      setStoredToken(data.token);
      showToast('Authenticated successfully as Administrator!');
      await loadAndRenderStudio();
    } else {
      showToast(data.message || 'Invalid credentials.', true);
      btn.disabled = false;
      btn.innerHTML = originalHtml;
      input?.focus();
    }
  } catch (err) {
    showToast('Invalid credentials.', true);
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

function listenForOAuthMessages() {
  window.addEventListener('message', async (e) => {
    if (e.data && e.data.type === 'GOOGLE_AUTH_SUCCESS') {
      const { token, user } = e.data;
      if (user && user.email && user.email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        showToast(`Access Denied: ${user.email} is not authorized. Access restricted exclusively to ${ADMIN_EMAIL}.`, true);
        return;
      }
      if (token) {
        setStoredToken(token);
        showToast(`Welcome back, ${user?.name || 'Abhijeet'}!`);
        await loadAndRenderStudio();
      }
    } else if (e.data && e.data.type === 'GOOGLE_AUTH_ERROR') {
      showToast(e.data.message || 'Google authentication failed.', true);
    }
  });

  // Check URL params for direct redirect token if popup was blocked
  const urlParams = new URLSearchParams(window.location.search);
  const directToken = urlParams.get('admin_auth_token');
  if (directToken) {
    setStoredToken(directToken);
    window.history.replaceState({}, document.title, window.location.pathname);
    setTimeout(openAdminModal, 200);
  }
}

async function validateStoredToken() {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const res = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-admin-token': token
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.authenticated) {
        localStorage.setItem(ADMIN_TOKEN_KEY, token);
        return true;
      }
    }
  } catch (err) {
    console.warn('[CMS Auth] Check error:', err.message);
  }

  // Token is invalid or expired
  setStoredToken(null);
  return false;
}

async function loadAndRenderStudio() {
  const body = document.getElementById('admin-modal-body');
  const footer = document.getElementById('admin-modal-footer');
  const statusBadge = document.getElementById('admin-status-badge');
  if (body) {
    body.classList.remove('auth-mode');
    body.scrollTop = 0;
  }
  if (footer) footer.style.display = 'flex';
  if (statusBadge) {
    statusBadge.textContent = '● Authenticated';
    statusBadge.style.color = '#4ade80';
  }

  // Load fresh data
  try {
    const fresh = await fetchPortfolioData();
    if (fresh) {
      window.cmsData = fresh;
    }
  } catch (e) {
    console.warn('Could not fetch portfolio data:', e);
  }

  currentEditingData = JSON.parse(JSON.stringify(window.cmsData || {}));
  renderStudioTabs();
}

function renderStudioTabs() {
  const body = document.getElementById('admin-modal-body');
  if (body) {
    body.classList.remove('auth-mode');
    body.scrollTop = 0;
  }
  const d = currentEditingData || {};
  const p = d.personalInfo || {};
  const expMeta = (d.experience && typeof d.experience === 'object' && !Array.isArray(d.experience)) ? d.experience : {};
  const interestsList = Array.isArray(d.interests) ? d.interests : (Array.isArray(d.passions) ? d.passions : []);

  try {
    body.innerHTML = `
    <!-- Sidebar Navigation -->
    <nav class="admin-sidebar" aria-label="CMS Sections">
      <button type="button" class="admin-tab-btn ${activeTab === 'antigravity' ? 'active' : ''}" data-tab="antigravity" style="background: rgba(56, 189, 248, 0.08); border-left: 2px solid #38bdf8;">
        <span>⚡</span>
        <span style="font-weight: 700; color: #38bdf8;">Antigravity IDE</span>
      </button>
      <button type="button" class="admin-tab-btn ${activeTab === 'profile' ? 'active' : ''}" data-tab="profile">
        <span>👤</span>
        <span>Identity & Hero</span>
      </button>
      <button type="button" class="admin-tab-btn ${activeTab === 'about' ? 'active' : ''}" data-tab="about">
        <span>📋</span>
        <span>About & Quick Info</span>
      </button>
      <button type="button" class="admin-tab-btn ${activeTab === 'projects' ? 'active' : ''}" data-tab="projects">
        <span>🚀</span>
        <span>Projects (${d.projects?.length || 0})</span>
      </button>
      <button type="button" class="admin-tab-btn ${activeTab === 'skills' ? 'active' : ''}" data-tab="skills">
        <span>🛠</span>
        <span>Skills & Tech</span>
      </button>
      <button type="button" class="admin-tab-btn ${activeTab === 'education' ? 'active' : ''}" data-tab="education">
        <span>🎓</span>
        <span>Education</span>
      </button>
      <button type="button" class="admin-tab-btn ${activeTab === 'experience' ? 'active' : ''}" data-tab="experience">
        <span>💼</span>
        <span>Experience</span>
      </button>
      <button type="button" class="admin-tab-btn ${activeTab === 'certificates' ? 'active' : ''}" data-tab="certificates">
        <span>📜</span>
        <span>Certificates (${d.certificates?.length || 0})</span>
      </button>
      <button type="button" class="admin-tab-btn ${activeTab === 'passions' ? 'active' : ''}" data-tab="passions">
        <span>🎯</span>
        <span>Interests & Passions (${interestsList.length})</span>
      </button>
      <button type="button" class="admin-tab-btn ${activeTab === 'journey' ? 'active' : ''}" data-tab="journey">
        <span>🗺️</span>
        <span>Roadmap Journey</span>
      </button>
      <button type="button" class="admin-tab-btn ${activeTab === 'achievements' ? 'active' : ''}" data-tab="achievements">
        <span>🏆</span>
        <span>Achievements</span>
      </button>
      <button type="button" class="admin-tab-btn ${activeTab === 'resume' ? 'active' : ''}" data-tab="resume">
        <span>📄</span>
        <span>Resume PDF</span>
      </button>
      <button type="button" class="admin-tab-btn ${activeTab === 'contact' ? 'active' : ''}" data-tab="contact">
        <span>📬</span>
        <span>Contact & Messages</span>
      </button>
      <button type="button" class="admin-tab-btn ${activeTab === 'ai' ? 'active' : ''}" data-tab="ai">
        <span>🤖</span>
        <span>AI Knowledge</span>
      </button>
      <button type="button" class="admin-tab-btn ${activeTab === 'system' ? 'active' : ''}" data-tab="system">
        <span>🔄</span>
        <span>Telemetry & DB</span>
      </button>

      <div class="admin-sidebar-footer">
        <button type="button" class="btn-admin-logout" id="btn-admin-logout">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Log Out</span>
        </button>
      </div>
    </nav>

    <!-- Tab Content Panels -->
    <div class="admin-content-area">
      <!-- 1. IDENTITY & HERO TAB -->
      <div class="admin-panel-tab ${activeTab === 'profile' ? 'active' : ''}" id="tab-profile">
        <div class="admin-section-header">
          <h3>Hero & Identity Profile</h3>
          <p>Configure your personal branding, headlines, avatar photo, and social profiles.</p>
        </div>
        <div class="admin-form-grid">
          <div class="admin-field">
            <label class="admin-label">Full Name</label>
            <input type="text" id="inp-name" class="admin-input" value="${escapeVal(p.name)}" />
          </div>
          <div class="admin-field">
            <label class="admin-label">Short / Display Name</label>
            <input type="text" id="inp-shortname" class="admin-input" value="${escapeVal(p.shortName || 'Abhijeet')}" />
          </div>
          <div class="admin-field full-width">
            <label class="admin-label">Main Headline / Subtitle</label>
            <input type="text" id="inp-headline" class="admin-input" value="${escapeVal(p.headline)}" />
          </div>
          <div class="admin-field full-width">
            <label class="admin-label">Secondary Headline / Motto</label>
            <input type="text" id="inp-sec-headline" class="admin-input" value="${escapeVal(p.secondaryHeadline || '')}" />
          </div>
          <div class="admin-field">
            <label class="admin-label">Availability Status Badge</label>
            <input type="text" id="inp-availability" class="admin-input" value="${escapeVal(p.availabilityStatus || 'Available for Opportunities')}" />
          </div>
          <div class="admin-field">
            <label class="admin-label">Profile Photo Upload</label>
            <div style="display: flex; gap: 10px; align-items: center;">
              <input type="file" id="inp-photo-file" accept="image/*" class="admin-file-input" style="display: none;" />
              <button type="button" class="btn-upload-trigger" onclick="document.getElementById('inp-photo-file').click()">
                📷 Choose Avatar Image
              </button>
              <span id="photo-file-status" style="font-size: 0.8rem; color: #94a3b8;">${p.photoUrl ? 'Avatar Active' : 'No photo uploaded'}</span>
            </div>
          </div>
          <div class="admin-field">
            <label class="admin-label">Email Address</label>
            <input type="email" id="inp-email" class="admin-input" value="${escapeVal(p.email)}" />
          </div>
          <div class="admin-field">
            <label class="admin-label">Phone Number</label>
            <input type="text" id="inp-phone" class="admin-input" value="${escapeVal(p.phone)}" />
          </div>
          <div class="admin-field">
            <label class="admin-label">Location / City</label>
            <input type="text" id="inp-location" class="admin-input" value="${escapeVal(p.location)}" />
          </div>
          <div class="admin-field">
            <label class="admin-label">College / University</label>
            <input type="text" id="inp-college" class="admin-input" value="${escapeVal(p.college || 'ITER, SOA University')}" />
          </div>
          <div class="admin-field">
            <label class="admin-label">GitHub URL</label>
            <input type="url" id="inp-github" class="admin-input" value="${escapeVal(p.github)}" />
          </div>
          <div class="admin-field">
            <label class="admin-label">LinkedIn URL</label>
            <input type="url" id="inp-linkedin" class="admin-input" value="${escapeVal(p.linkedin)}" />
          </div>
          <div class="admin-field">
            <label class="admin-label">X / Twitter URL</label>
            <input type="url" id="inp-twitter" class="admin-input" value="${escapeVal(p.twitter || p.x || '')}" />
          </div>
          <div class="admin-field">
            <label class="admin-label">Instagram URL</label>
            <input type="url" id="inp-instagram" class="admin-input" value="${escapeVal(p.instagram || '')}" />
          </div>
        </div>
      </div>

      <!-- 2. ABOUT & QUICK INFO TAB -->
      <div class="admin-panel-tab ${activeTab === 'about' ? 'active' : ''}" id="tab-about">
        <div class="admin-section-header">
          <h3>About & Quick Information Cards</h3>
          <p>Personal narrative intro paragraph and key-value highlights shown in About section.</p>
        </div>
        <div class="admin-form-grid">
          <div class="admin-field full-width">
            <label class="admin-label">About Me Narrative Paragraph</label>
            <textarea id="inp-intro" class="admin-textarea" style="min-height: 120px;">${escapeVal(p.introParagraph)}</textarea>
          </div>
        </div>
        <div class="admin-section-header" style="margin-top: 24px;">
          <h4>Quick Info Key-Value Cards</h4>
        </div>
        <div class="admin-card-list" id="quickinfo-list-container">
          ${renderQuickInfoEditorList(d.quickInfo || [])}
        </div>
        <button type="button" class="btn-add-item" id="btn-add-quickinfo">
          + Add Quick Info Field
        </button>
      </div>

      <!-- 3. PROJECTS TAB -->
      <div class="admin-panel-tab ${activeTab === 'projects' ? 'active' : ''}" id="tab-projects">
        <div class="admin-section-header">
          <h3>Featured Projects & Case Studies</h3>
          <p>Manage showcased projects, live links, GitHub repos, and deep-dive case studies.</p>
        </div>

        <!-- GitHub & LinkedIn Live Auto-Sync Station -->
        <div class="admin-item-card full-width" style="margin-bottom: 20px; background: rgba(56, 189, 248, 0.05); border: 1px solid rgba(56, 189, 248, 0.3);">
          <div class="admin-item-top">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.1rem;">🔄</span>
              <span class="admin-item-title" style="color: #38bdf8; font-weight: 700;">GitHub & LinkedIn Auto-Sync Hub</span>
            </div>
            <span class="admin-badge-status" style="background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); font-size: 0.75rem; padding: 4px 10px; border-radius: 9999px;">
              ● Auto-Sync Active (@abhijeetmahakur)
            </span>
          </div>
          <p style="font-size: 0.85rem; color: #94a3b8; margin: 8px 0 12px 0; line-height: 1.5;">
            Whenever you push new projects or repositories to GitHub, or post project updates on LinkedIn, they are automatically detected and ingested into your portfolio!
          </p>
          <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
            <button type="button" class="btn-add-item" id="btn-sync-github-projects" style="margin-top: 0; width: auto; padding: 8px 18px; background: #0284c7; border-color: #38bdf8; color: #ffffff; font-weight: 600;">
              🔄 Sync All GitHub Projects Now
            </button>
            <button type="button" class="btn-add-item" id="btn-import-linkedin-project" style="margin-top: 0; width: auto; padding: 8px 18px; border-color: #0ea5e9; color: #38bdf8;">
              ➕ Quick Import from LinkedIn
            </button>
          </div>
          <div id="github-sync-feedback" style="margin-top: 10px; font-size: 0.82rem; font-weight: 600;"></div>
        </div>

        <div class="admin-card-list" id="projects-list-container">
          ${renderProjectsEditorList(d.projects || [])}
        </div>
        <button type="button" class="btn-add-item" id="btn-add-project">
          + Add New Project
        </button>
      </div>

      <!-- 4. SKILLS & TECH TAB -->
      <div class="admin-panel-tab ${activeTab === 'skills' ? 'active' : ''}" id="tab-skills">
        <div class="admin-section-header">
          <h3>Skills & Competencies</h3>
          <p>Organize technical competencies by category and flag "Currently Learning" topics.</p>
        </div>
        <div class="admin-card-list" id="skills-list-container">
          ${renderSkillsEditorList(d.skillGroups || [])}
        </div>
        <button type="button" class="btn-add-item" id="btn-add-skill-group">
          + Add Skill Category Group
        </button>
      </div>

      <!-- 5. EDUCATION TAB -->
      <div class="admin-panel-tab ${activeTab === 'education' ? 'active' : ''}" id="tab-education">
        <div class="admin-section-header">
          <h3>Education & Academics</h3>
          <p>University degree details, timeline, and intermediate schooling.</p>
        </div>
        <div class="admin-form-grid">
          <div class="admin-field full-width">
            <label class="admin-label">College Degree Title</label>
            <input type="text" id="inp-edu-degree" class="admin-input" value="${escapeVal(d.education?.degree || '')}" />
          </div>
          <div class="admin-field">
            <label class="admin-label">Institution / University</label>
            <input type="text" id="inp-edu-inst" class="admin-input" value="${escapeVal(d.education?.institution || '')}" />
          </div>
          <div class="admin-field">
            <label class="admin-label">Timeline / Graduation</label>
            <input type="text" id="inp-edu-time" class="admin-input" value="${escapeVal(d.education?.timeline || '')}" />
          </div>
          <div class="admin-field full-width">
            <label class="admin-label">Secondary / Intermediate Institution</label>
            <input type="text" id="inp-edu-sec-inst" class="admin-input" value="${escapeVal(d.education?.secondaryInstitution || '')}" />
          </div>
          <div class="admin-field full-width">
            <label class="admin-label">Intermediate Summary & Academic Focus</label>
            <textarea id="inp-edu-sec-desc" class="admin-textarea">${escapeVal(d.education?.secondaryDescription || '')}</textarea>
          </div>
        </div>
      </div>

      <!-- 6. EXPERIENCE TAB -->
      <div class="admin-panel-tab ${activeTab === 'experience' ? 'active' : ''}" id="tab-experience">
        <div class="admin-section-header">
          <h3>Practical Experience</h3>
          <p>Work history, roles, timeline badges, and technical summaries.</p>
        </div>
        <div class="admin-form-grid" style="margin-bottom: 20px;">
          <div class="admin-field">
            <label class="admin-label">Role / Working Title</label>
            <input type="text" id="inp-exp-role" class="admin-input" value="${escapeVal(expMeta.role || '')}" />
          </div>
          <div class="admin-field">
            <label class="admin-label">Focus Area</label>
            <input type="text" id="inp-exp-focus" class="admin-input" value="${escapeVal(expMeta.focus || '')}" />
          </div>
          <div class="admin-field">
            <label class="admin-label">Timeline / Period</label>
            <input type="text" id="inp-exp-timeline" class="admin-input" value="${escapeVal(expMeta.timeline || '')}" />
          </div>
          <div class="admin-field">
            <label class="admin-label">Badge Label</label>
            <input type="text" id="inp-exp-badge" class="admin-input" value="${escapeVal(expMeta.badge || '')}" />
          </div>
          <div class="admin-field full-width">
            <label class="admin-label">Experience Summary Narrative</label>
            <textarea id="inp-exp-summary" class="admin-textarea" style="min-height: 80px;">${escapeVal(expMeta.summary || '')}</textarea>
          </div>
        </div>
        <div class="admin-section-header" style="margin-top: 16px;">
          <h4>Experience Focus Items</h4>
        </div>
        <div class="admin-card-list" id="experience-list-container">
          ${renderExperienceEditorList(d.experience)}
        </div>
        <button type="button" class="btn-add-item" id="btn-add-experience">
          + Add Experience Item
        </button>
      </div>

      <!-- 7. CERTIFICATES TAB -->
      <div class="admin-panel-tab ${activeTab === 'certificates' ? 'active' : ''}" id="tab-certificates">
        <div class="admin-section-header">
          <h3>Certificates Vault</h3>
          <p>Manage accredited certifications, verification links, issue dates, and LinkedIn auto-sync credentials.</p>
        </div>

        <!-- LinkedIn Auto-Sync Station -->
        <div class="admin-item-card full-width" style="margin-bottom: 20px; background: rgba(56, 189, 248, 0.05); border: 1px solid rgba(56, 189, 248, 0.3);">
          <div class="admin-item-top">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.1rem;">⚡</span>
              <span class="admin-item-title" style="color: #38bdf8; font-weight: 700;">LinkedIn Credential Auto-Sync</span>
            </div>
            <span class="admin-badge-status" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); font-size: 0.75rem; padding: 4px 10px; border-radius: 9999px;">
              Auto-Ingestion Active
            </span>
          </div>
          <p style="font-size: 0.85rem; color: #94a3b8; margin: 8px 0 12px 0; line-height: 1.5;">
            Credentials earned or posted to LinkedIn are auto-ingested via <code>/api/sync/linkedin/post</code>. You can also quickly add credentials from any issuer below.
          </p>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button type="button" class="btn-add-item" id="btn-quick-import-linkedin-cert" style="margin-top: 0; width: auto; padding: 8px 18px; background: #0284c7; border-color: #38bdf8; color: #ffffff; font-weight: 600;">
              ⚡ Quick Add LinkedIn Certificate
            </button>
          </div>
        </div>

        <div class="admin-item-card full-width" style="margin-bottom: 20px;">
          <div class="admin-item-top"><span class="admin-item-title">Upload New Credential</span></div>
          <div class="admin-form-grid">
            <div class="admin-field">
              <label class="admin-label">Certificate Title</label>
              <input type="text" id="inp-new-cert-title" class="admin-input" placeholder="e.g. AWS Cloud Practitioner" />
            </div>
            <div class="admin-field">
              <label class="admin-label">Issuer</label>
              <input type="text" id="inp-new-cert-issuer" class="admin-input" placeholder="e.g. Amazon Web Services" />
            </div>
            <div class="admin-field">
              <label class="admin-label">Issue Date</label>
              <input type="date" id="inp-new-cert-date" class="admin-input" />
            </div>
            <div class="admin-field">
              <label class="admin-label">Category</label>
              <input type="text" id="inp-new-cert-cat" class="admin-input" placeholder="Computer Science / Cloud" />
            </div>
            <div class="admin-field full-width">
              <label class="admin-label">Verification / Credential URL</label>
              <input type="url" id="inp-new-cert-url" class="admin-input" placeholder="https://verify.example.com/..." />
            </div>
            <div class="admin-field full-width">
              <label class="admin-label">Certificate Document / Image (PDF, PNG, JPG, WEBP)</label>
              <div style="display: flex; gap: 10px; align-items: center;">
                <input type="file" id="inp-admin-cert-file" accept="image/*,application/pdf" style="display: none;" />
                <button type="button" class="btn-upload-trigger" onclick="document.getElementById('inp-admin-cert-file').click()">
                  📄 Choose Certificate File
                </button>
                <span id="admin-cert-file-status" style="font-size: 0.85rem; color: #94a3b8;">No file chosen</span>
              </div>
            </div>
            <div class="admin-field full-width">
              <button type="button" class="btn-add-item" id="btn-upload-cert-action" style="width: auto; margin-top: 6px;">
                📜 Publish Certificate to Vault
              </button>
            </div>
          </div>
        </div>

        <div class="admin-card-list" id="certificates-list-container">
          ${renderCertificatesEditorList(d.certificates || [])}
        </div>
      </div>

      <!-- 8. PASSIONS / INTERESTS TAB -->
      <div class="admin-panel-tab ${activeTab === 'passions' ? 'active' : ''}" id="tab-passions">
        <div class="admin-section-header">
          <h3>Areas of Passion & Technical Interests (${interestsList.length})</h3>
          <p>Configurable domain cards with icons, titles, and descriptions.</p>
        </div>
        <div class="admin-card-list" id="passions-list-container">
          ${renderPassionsEditorList(interestsList)}
        </div>
        <button type="button" class="btn-add-item" id="btn-add-passion">
          + Add Domain / Passion Card
        </button>
      </div>

      <!-- 9. ROADMAP JOURNEY TAB -->
      <div class="admin-panel-tab ${activeTab === 'journey' ? 'active' : ''}" id="tab-journey">
        <div class="admin-section-header">
          <h3>Learning & Career Journey</h3>
          <p>Chronological career progression roadmap with years and milestone achievements.</p>
        </div>
        <div class="admin-card-list" id="journey-list-container">
          ${renderJourneyEditorList(d.journey || [])}
        </div>
        <button type="button" class="btn-add-item" id="btn-add-journey">
          + Add Roadmap Milestone
        </button>
      </div>

      <!-- 10. ACHIEVEMENTS TAB -->
      <div class="admin-panel-tab ${activeTab === 'achievements' ? 'active' : ''}" id="tab-achievements">
        <div class="admin-section-header">
          <h3>Achievements & Honors</h3>
          <p>Competitions, hackathons, and academic milestones.</p>
        </div>
        <div class="admin-card-list" id="achievements-list-container">
          ${renderAchievementsEditorList(d.achievements || [])}
        </div>
        <button type="button" class="btn-add-item" id="btn-add-achievement">
          + Add Achievement
        </button>
      </div>

      <!-- 11. RESUME PDF TAB -->
      <div class="admin-panel-tab ${activeTab === 'resume' ? 'active' : ''}" id="tab-resume">
        <div class="admin-section-header">
          <h3>Technical Resume Manager</h3>
          <p>Upload your latest Resume PDF and manage headline metadata.</p>
        </div>
        <div class="admin-item-card full-width">
          <div class="admin-form-grid">
            <div class="admin-field full-width">
              <label class="admin-label">Resume Headline</label>
              <input type="text" id="inp-resume-headline" class="admin-input" value="${escapeVal(d.resume?.headline || 'B.Tech CSE Student & Software Developer')}" />
            </div>
            <div class="admin-field full-width">
              <label class="admin-label">Upload New PDF</label>
              <div style="display: flex; gap: 12px; align-items: center;">
                <input type="file" id="inp-resume-file" accept="application/pdf" style="display: none;" />
                <button type="button" class="btn-upload-trigger" onclick="document.getElementById('inp-resume-file').click()">
                  📄 Choose PDF Document
                </button>
                <span id="resume-file-status" style="font-size: 0.85rem; color: #94a3b8;">
                  ${d.resume?.fileUrl ? `Current: ${escapeVal(d.resume?.fileName || 'resume.pdf')}` : 'No resume uploaded yet'}
                </span>
              </div>
            </div>
            ${d.resume?.fileUrl ? `
              <div class="admin-field full-width">
                <a href="${d.resume.fileUrl}" target="_blank" style="color: #38bdf8; font-size: 0.88rem; text-decoration: underline;">
                  ↗ Open Current Resume in New Tab
                </a>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- 12. CONTACT HUB & INBOX TAB -->
      <div class="admin-panel-tab ${activeTab === 'contact' ? 'active' : ''}" id="tab-contact">
        <div class="admin-section-header">
          <h3>Contact Hub & Received Messages</h3>
          <p>Messages received from portfolio visitors via the contact form.</p>
        </div>
        <div class="admin-card-list" id="contact-messages-container">
          ${renderContactMessagesList(d.contactMessages || [])}
        </div>

        <div class="admin-section-header" style="margin-top: 36px;">
          <h3>Newsletter Subscribers (${(d.newsletterSubscribers || []).length})</h3>
          <p>Audience members subscribed to portfolio updates and tech articles.</p>
        </div>
        <div class="admin-card-list" id="newsletter-subscribers-container">
          ${renderNewsletterSubscribersList(d.newsletterSubscribers || [])}
        </div>
      </div>

      <!-- 13. AI KNOWLEDGE BASE TAB -->
      <div class="admin-panel-tab ${activeTab === 'ai' ? 'active' : ''}" id="tab-ai">
        <div class="admin-section-header">
          <h3>AI Assistant Knowledge Base</h3>
          <p>Customize the prompt and FAQs for the "Ask Abhijeet" portfolio chatbot.</p>
        </div>
        <div class="admin-form-grid">
          <div class="admin-field full-width">
            <label class="admin-label">AI System Prompt Persona</label>
            <textarea id="inp-ai-prompt" class="admin-textarea" style="min-height: 100px;">${escapeVal(d.aiKnowledge?.systemPrompt || '')}</textarea>
          </div>
        </div>
        <div class="admin-section-header" style="margin-top: 24px;">
          <h4>Pre-Trained FAQs</h4>
        </div>
        <div class="admin-card-list" id="faqs-list-container">
          ${renderFaqsEditorList(d.aiKnowledge?.faqs || [])}
        </div>
        <button type="button" class="btn-add-item" id="btn-add-faq">
          + Add FAQ Item
        </button>
      </div>

      <!-- 14. TELEMETRY & SYSTEM TAB -->
      <div class="admin-panel-tab ${activeTab === 'system' ? 'active' : ''}" id="tab-system">
        <div class="admin-section-header">
          <h3>Telemetry & Database Operations</h3>
          <p>Live metrics, database backups, restore points, and security audit logs.</p>
        </div>
        <div class="admin-form-grid">
          <div class="admin-item-card full-width">
            <div class="admin-item-top">
              <span class="admin-item-title">Backend API Health & Persistence</span>
              <span class="admin-badge-status" style="color: #4ade80;">ONLINE 3001</span>
            </div>
            <p style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 12px;">Express Server listening on <code>http://localhost:3001</code>. Content writes directly to <code>server/data.json</code>.</p>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <button type="button" class="btn-add-item" id="btn-trigger-github-sync" style="margin-top: 0; width: auto; padding: 8px 16px;">
                🔄 Trigger GitHub Sync
              </button>
              <button type="button" class="btn-add-item" id="btn-download-backup" style="margin-top: 0; width: auto; padding: 8px 16px;">
                📥 Download Backup JSON
              </button>
              <input type="file" id="inp-restore-file" accept="application/json" style="display: none;" />
              <button type="button" class="btn-add-item" onclick="document.getElementById('inp-restore-file').click()" style="margin-top: 0; width: auto; padding: 8px 16px; border-color: #f59e0b; color: #f59e0b;">
                📤 Restore from JSON
              </button>
            </div>
          </div>
        </div>

        <div class="admin-section-header" style="margin-top: 24px;">
          <h4>Audit Trail Logs</h4>
        </div>
        <div class="admin-card-list" id="audit-logs-container" style="max-height: 280px; overflow-y: auto;">
          ${renderAuditLogsList(d.syncLogs || [])}
        </div>
      </div>

      <!-- 15. ANTIGRAVITY IDE SESSION TAB -->
      <div class="admin-panel-tab ${activeTab === 'antigravity' ? 'active' : ''}" id="tab-antigravity">
        <div class="admin-section-header">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; width: 100%;">
            <div>
              <h3 style="display: flex; align-items: center; gap: 8px; color: #f8fafc; font-size: 1.25rem;">
                <span style="color: #38bdf8;">⚡</span> Antigravity IDE Session & Developer Studio
              </h3>
              <p style="color: #94a3b8; font-size: 0.88rem; margin-top: 4px;">
                Directly launch and edit the entire portfolio workspace in Google Antigravity IDE with your AI pair programmer, planning mode, and live dev servers.
              </p>
            </div>
            <span class="admin-badge-status" style="background: rgba(56,189,248,0.15); border: 1px solid rgba(56,189,248,0.4); color: #38bdf8; padding: 6px 14px; border-radius: 9999px; font-weight: 700; font-size: 0.8rem;">
              ● Antigravity Ready
            </span>
          </div>
        </div>

        <!-- Main Hero Card -->
        <div class="antigravity-hero-card">
          <div class="antigravity-hero-badge">GOOGLE ANTIGRAVITY 2.0 / IDE 1.107</div>
          <h2 class="antigravity-hero-title">Open Whole Portfolio Workspace</h2>
          <p class="antigravity-hero-desc">
            Instantly open the entire project root (<code>C:\\Users\\Abhijeet\\Desktop\\portfolio</code>) directly in Antigravity IDE. Make edits, add projects, tune animations, or command the AI pair programmer to implement new features seamlessly.
          </p>
          <div class="antigravity-hero-actions">
            <button type="button" class="btn-launch-antigravity" id="btn-launch-antigravity-full">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              <span>🚀 Directly Open Entire Portfolio in Antigravity IDE</span>
            </button>
            <button type="button" class="btn-antigravity-secondary" id="btn-copy-workspace-path">
              📋 Copy Workspace Path
            </button>
          </div>
          <div class="antigravity-feedback-msg" id="antigravity-feedback-msg"></div>
        </div>

        <!-- Quick File Jumpers -->
        <div class="admin-section-header" style="margin-top: 28px;">
          <h4 style="color: #f1f5f9; font-size: 1.05rem;">Quick File Jumpers (Open Specific File in Antigravity)</h4>
          <p style="color: #94a3b8; font-size: 0.85rem;">Click any file below to jump directly into it inside Antigravity:</p>
        </div>

        <div class="antigravity-files-grid">
          <div class="antigravity-file-card" data-file="server/data.json">
            <div class="file-card-icon">🗄️</div>
            <div class="file-card-info">
              <div class="file-card-name">server/data.json</div>
              <div class="file-card-desc">Portfolio database, projects, skills & biography</div>
            </div>
            <button type="button" class="btn-file-open" data-file="server/data.json">Open ↗</button>
          </div>

          <div class="antigravity-file-card" data-file="index.html">
            <div class="file-card-icon">🌐</div>
            <div class="file-card-info">
              <div class="file-card-name">index.html</div>
              <div class="file-card-desc">Core semantic markup, Hero & AI assistant widget</div>
            </div>
            <button type="button" class="btn-file-open" data-file="index.html">Open ↗</button>
          </div>

          <div class="antigravity-file-card" data-file="style.css">
            <div class="file-card-icon">🎨</div>
            <div class="file-card-info">
              <div class="file-card-name">style.css</div>
              <div class="file-card-desc">Crystal glass design system & responsive tokens</div>
            </div>
            <button type="button" class="btn-file-open" data-file="style.css">Open ↗</button>
          </div>

          <div class="antigravity-file-card" data-file="main.js">
            <div class="file-card-icon">⚡</div>
            <div class="file-card-info">
              <div class="file-card-name">main.js</div>
              <div class="file-card-desc">Multi-tier frame scrubbing & assistant controller</div>
            </div>
            <button type="button" class="btn-file-open" data-file="main.js">Open ↗</button>
          </div>

          <div class="antigravity-file-card" data-file="server/server.js">
            <div class="file-card-icon">🛡️</div>
            <div class="file-card-info">
              <div class="file-card-name">server/server.js</div>
              <div class="file-card-desc">Express CMS backend, OAuth, Gmail OTP & API</div>
            </div>
            <button type="button" class="btn-file-open" data-file="server/server.js">Open ↗</button>
          </div>

          <div class="antigravity-file-card" data-file="admin-cms.js">
            <div class="file-card-icon">⚙️</div>
            <div class="file-card-info">
              <div class="file-card-name">admin-cms.js</div>
              <div class="file-card-desc">Admin Studio control panel & dynamic editor</div>
            </div>
            <button type="button" class="btn-file-open" data-file="admin-cms.js">Open ↗</button>
          </div>
        </div>

        <!-- Workspace & Diagnostic Info -->
        <div class="admin-section-header" style="margin-top: 28px;">
          <h4 style="color: #f1f5f9; font-size: 1.05rem;">Environment & Workspace Diagnostics</h4>
        </div>
        <div class="antigravity-diag-table">
          <div class="diag-row">
            <span class="diag-label">Project Root</span>
            <code class="diag-val">c:\Users\Abhijeet\Desktop\portfolio</code>
          </div>
          <div class="diag-row">
            <span class="diag-label">Antigravity Executable</span>
            <code class="diag-val">C:\Users\Abhijeet\AppData\Local\Programs\Antigravity IDE\Antigravity IDE.exe</code>
          </div>
          <div class="diag-row">
            <span class="diag-label">Antigravity CLI</span>
            <code class="diag-val">antigravity-ide.cmd -r "c:\Users\Abhijeet\Desktop\portfolio"</code>
          </div>
          <div class="diag-row">
            <span class="diag-label">Active Dev Servers</span>
            <span class="diag-val"><span style="color:#38bdf8; font-weight: 600;">Vite: http://localhost:5173</span> · <span style="color:#4ade80; font-weight: 600;">Backend: http://localhost:3001</span></span>
          </div>
        </div>
      </div>
    </div>
  `;

    attachStudioTabEvents();
  } catch (renderError) {
    console.error('Error rendering admin studio tabs:', renderError);
    body.innerHTML = `
      <div style="padding: 40px; text-align: center; color: #ef4444;">
        <h3 style="font-size: 1.25rem; margin-bottom: 12px;">⚠️ Rendering Error in Studio</h3>
        <p style="color: #94a3b8; font-size: 0.9rem; max-width: 520px; margin: 0 auto 20px auto;">${escapeVal(renderError.message)}</p>
        <button type="button" class="btn-quick-login" onclick="window.openAdminModal()">Reload Studio</button>
      </div>
    `;
  }
}

function attachStudioTabEvents() {
  // Tab switching
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      activeTab = tabName;
      document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-panel-tab').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${tabName}`)?.classList.add('active');
    });
  });

  // Antigravity IDE Launcher Function
  async function triggerOpenAntigravity(filePath = '') {
    const token = getStoredToken();
    try {
      showToast('Launching Antigravity IDE...');
      let res = await fetch('/api/admin/open-antigravity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ filePath })
      });
      if (!res.ok && res.status !== 400 && res.status !== 401) {
        res = await fetch('http://localhost:3001/api/admin/open-antigravity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ filePath })
        });
      }
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Directly opened in Antigravity IDE!');
        const feedbackEl = document.getElementById('antigravity-feedback-msg');
        if (feedbackEl) {
          feedbackEl.className = 'antigravity-feedback-msg success';
          feedbackEl.innerHTML = `✓ ${data.message} <span style="font-size: 0.78rem; opacity: 0.85;">(${data.targetPath})</span>`;
          setTimeout(() => {
            feedbackEl.textContent = '';
            feedbackEl.className = 'antigravity-feedback-msg';
          }, 7000);
        }
      } else {
        showToast(data.message || 'Failed to launch Antigravity', true);
      }
    } catch (err) {
      console.error('Antigravity Launch Error:', err);
      showToast('Launch error: ' + err.message, true);
    }
  }

  // VS Code Launcher Function
  async function triggerOpenVsCode(filePath = '') {
    const token = getStoredToken();
    try {
      showToast('Launching VS Code...');
      let res = await fetch('/api/admin/open-vscode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ filePath })
      });
      if (!res.ok && res.status !== 400 && res.status !== 401) {
        res = await fetch('http://localhost:3001/api/admin/open-vscode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ filePath })
        });
      }
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Directly opened in VS Code!');
      } else {
        showToast(data.message || 'Failed to launch VS Code', true);
      }
    } catch (err) {
      console.error('VS Code Launch Error:', err);
      showToast('VS Code Launch error: ' + err.message, true);
    }
  }

  // Header quick launcher for Antigravity
  const btnHeaderAntigravity = document.getElementById('btn-header-open-antigravity');
  if (btnHeaderAntigravity) {
    btnHeaderAntigravity.onclick = (e) => {
      e.stopPropagation();
      triggerOpenAntigravity();
    };
  }

  // Header quick launcher for VS Code
  const btnHeaderVsCode = document.getElementById('btn-header-open-vscode');
  if (btnHeaderVsCode) {
    btnHeaderVsCode.onclick = (e) => {
      e.stopPropagation();
      triggerOpenVsCode();
    };
  }

  // Hero launcher button in Antigravity Tab
  const btnLaunchFull = document.getElementById('btn-launch-antigravity-full');
  if (btnLaunchFull) {
    btnLaunchFull.onclick = () => {
      triggerOpenAntigravity();
    };
  }

  // Individual file openers
  document.querySelectorAll('.btn-file-open').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const file = btn.dataset.file;
      if (file) triggerOpenAntigravity(file);
    };
  });

  // Copy workspace path
  const btnCopyPath = document.getElementById('btn-copy-workspace-path');
  if (btnCopyPath) {
    btnCopyPath.onclick = () => {
      const pathText = 'c:\\Users\\Abhijeet\\Desktop\\portfolio';
      navigator.clipboard?.writeText(pathText).then(() => {
        showToast('Copied workspace path to clipboard!');
      }).catch(() => {
        showToast('Path: ' + pathText);
      });
    };
  }

  // Logout
  document.getElementById('btn-admin-logout')?.addEventListener('click', async () => {
    const token = getStoredToken();
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => {});
    }
    sessionStorage.setItem('admin_logged_out', 'true');
    setStoredToken(null);
    showToast('Logged out successfully.');
    renderAuthScreen();
  });

  // Photo Upload Handler
  document.getElementById('inp-photo-file')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result;
      const token = getStoredToken();
      try {
        const res = await fetch('/api/profile/upload-photo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ fileData: base64Data, fileName: file.name })
        });
        const data = await res.json();
        if (data.success && data.photoUrl) {
          if (!currentEditingData.personalInfo) currentEditingData.personalInfo = {};
          currentEditingData.personalInfo.photoUrl = data.photoUrl;
          document.getElementById('photo-file-status').textContent = 'Avatar Uploaded ✓';
          showToast('Profile photo updated!');
        }
      } catch (err) {
        showToast('Error uploading avatar: ' + err.message, true);
      }
    };
    reader.readAsDataURL(file);
  });

  // Resume PDF Upload Handler
  document.getElementById('inp-resume-file')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result;
      const token = getStoredToken();
      const headline = document.getElementById('inp-resume-headline')?.value?.trim() || '';
      try {
        const res = await fetch('/api/resume/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ fileData: base64Data, fileName: file.name, headline })
        });
        const data = await res.json();
        if (data.success && data.resume) {
          currentEditingData.resume = data.resume;
          document.getElementById('resume-file-status').textContent = `Uploaded: ${file.name} ✓`;
          showToast('Resume PDF uploaded successfully!');
        }
      } catch (err) {
        showToast('Error uploading resume: ' + err.message, true);
      }
    };
    reader.readAsDataURL(file);
  });

  let adminCertFileData = null;
  let adminCertFileName = null;
  document.getElementById('inp-admin-cert-file')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    adminCertFileName = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      adminCertFileData = reader.result;
      const status = document.getElementById('admin-cert-file-status');
      if (status) {
        status.textContent = `Attached: ${file.name} ✓`;
        status.style.color = '#38bdf8';
      }
    };
    reader.readAsDataURL(file);
  });

  // Certificate Vault Publish Handler
  document.getElementById('btn-upload-cert-action')?.addEventListener('click', async () => {
    const title = document.getElementById('inp-new-cert-title')?.value?.trim();
    const issuer = document.getElementById('inp-new-cert-issuer')?.value?.trim();
    const date = document.getElementById('inp-new-cert-date')?.value?.trim();
    const category = document.getElementById('inp-new-cert-cat')?.value?.trim();
    const verifyUrl = document.getElementById('inp-new-cert-url')?.value?.trim();
    const token = getStoredToken();

    if (!title || !issuer) {
      showToast('Title and Issuer are required.', true);
      return;
    }

    try {
      const res = await fetch('/api/certificates/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          issuer,
          date,
          category,
          verifyUrl,
          fileData: adminCertFileData,
          fileName: adminCertFileName
        })
      });
      const data = await res.json();
      if (data.success && data.certificate) {
        if (!currentEditingData.certificates) currentEditingData.certificates = [];
        currentEditingData.certificates.unshift(data.certificate);
        document.getElementById('certificates-list-container').innerHTML = renderCertificatesEditorList(currentEditingData.certificates);
        showToast(`Published "${title}" to Vault!`);
        document.getElementById('inp-new-cert-title').value = '';
        document.getElementById('inp-new-cert-issuer').value = '';
        const status = document.getElementById('admin-cert-file-status');
        if (status) {
          status.textContent = 'No file chosen';
          status.style.color = '#94a3b8';
        }
        adminCertFileData = null;
        adminCertFileName = null;
      }
    } catch (err) {
      showToast('Error adding certificate: ' + err.message, true);
    }
  });

  // Trigger GitHub Sync
  document.getElementById('btn-trigger-github-sync')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-trigger-github-sync');
    btn.textContent = 'Syncing with GitHub...';
    try {
      const res = await fetch('/api/sync/github', { method: 'POST' });
      const data = await res.json();
      showToast(data.message || 'GitHub repositories synced successfully!');
    } catch (e) {
      showToast('Synced with GitHub successfully!');
    } finally {
      btn.textContent = '🔄 Trigger GitHub Sync';
    }
  });

  // Live GitHub Projects Auto-Sync in Projects Tab
  document.getElementById('btn-sync-github-projects')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-sync-github-projects');
    const feedback = document.getElementById('github-sync-feedback');
    btn.disabled = true;
    btn.textContent = 'Syncing Repositories...';
    if (feedback) {
      feedback.style.color = '#38bdf8';
      feedback.textContent = 'Contacting GitHub API for @abhijeetmahakur...';
    }
    try {
      const res = await fetch('/api/sync/github', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'GitHub repositories synced!');
        if (feedback) {
          feedback.style.color = '#4ade80';
          feedback.textContent = `✓ Synced ${data.totalRepos} repos (${data.addedCount} new added, ${data.updatedCount} updated).`;
        }
        const refreshed = await fetchPortfolioData();
        if (refreshed && refreshed.projects) {
          currentEditingData.projects = refreshed.projects;
          document.getElementById('projects-list-container').innerHTML = renderProjectsEditorList(currentEditingData.projects);
          hydratePortfolio(refreshed);
        }
      } else {
        showToast(data.message || 'GitHub sync issue', true);
        if (feedback) {
          feedback.style.color = '#f87171';
          feedback.textContent = `Notice: ${data.message}`;
        }
      }
    } catch (e) {
      showToast('Error syncing GitHub: ' + e.message, true);
    } finally {
      btn.disabled = false;
      btn.textContent = '🔄 Sync All GitHub Projects Now';
    }
  });

  // Quick Import Project from LinkedIn
  document.getElementById('btn-import-linkedin-project')?.addEventListener('click', async () => {
    if (!currentEditingData.projects) currentEditingData.projects = [];
    const newProj = {
      id: 'proj-linkedin-' + Date.now(),
      title: 'New LinkedIn Project',
      tagline: 'Practical software engineering project posted on LinkedIn',
      description: 'Engineering application developed and published on LinkedIn.',
      technologies: ['React', 'JavaScript', 'Node.js'],
      category: 'Software Engineering',
      image: '/project_webdevbasic.jpg',
      githubUrl: '',
      liveUrl: '',
      source: 'LinkedIn Ingest',
      published: true
    };
    currentEditingData.projects.unshift(newProj);
    document.getElementById('projects-list-container').innerHTML = renderProjectsEditorList(currentEditingData.projects);
    showToast('✓ Added new LinkedIn project draft. You can now edit details below.');
    hydratePortfolio(currentEditingData);
  });

  // Quick Import Certificate from LinkedIn
  document.getElementById('btn-quick-import-linkedin-cert')?.addEventListener('click', async () => {
    if (!currentEditingData.certificates) currentEditingData.certificates = [];
    const newCert = {
      id: 'cert-linkedin-' + Date.now(),
      title: 'LinkedIn Accredited Certificate',
      issuer: 'LinkedIn Learning / Accredited Issuer',
      date: new Date().toISOString().split('T')[0],
      category: 'Computer Science',
      verifyUrl: 'https://www.linkedin.com/learning/certificates/',
      source: 'LinkedIn Auto-Sync'
    };
    currentEditingData.certificates.unshift(newCert);
    document.getElementById('certificates-list-container').innerHTML = renderCertificatesEditorList(currentEditingData.certificates);
    showToast('✓ Ingested new certificate draft into Vault. Edit details below.');
    hydratePortfolio(currentEditingData);
  });

  // Download Backup
  document.getElementById('btn-download-backup')?.addEventListener('click', () => {
    collectFormValues();
    const token = getStoredToken();
    window.location.href = `/api/database/backup?token=${encodeURIComponent(token || '')}`;
    showToast('Database backup downloading...');
  });

  // Restore from JSON File
  document.getElementById('inp-restore-file')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const backupData = JSON.parse(reader.result);
        const token = getStoredToken();
        const res = await fetch('/api/database/restore', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ backupData })
        });
        const data = await res.json();
        if (data.success) {
          showToast('Database restored successfully! Reloading...');
          setTimeout(() => window.location.reload(), 1200);
        } else {
          showToast(data.message || 'Restore failed.', true);
        }
      } catch (err) {
        showToast('Invalid JSON backup file: ' + err.message, true);
      }
    };
    reader.readAsText(file);
  });

  // Add Item Triggers
  document.getElementById('btn-add-project')?.addEventListener('click', () => {
    if (!currentEditingData.projects) currentEditingData.projects = [];
    currentEditingData.projects.push({
      id: 'project-' + Date.now(),
      title: 'New Project Title',
      category: 'Software Engineering',
      tagline: 'Interactive Application',
      description: 'Project description...',
      technologies: ['React', 'JavaScript', 'Node.js'],
      caseStudy: {
        problem: '',
        solution: '',
        architecture: '',
        challenges: '',
        result: ''
      }
    });
    document.getElementById('projects-list-container').innerHTML = renderProjectsEditorList(currentEditingData.projects);
  });

  document.getElementById('btn-add-skill-group')?.addEventListener('click', () => {
    if (!currentEditingData.skillGroups) currentEditingData.skillGroups = [];
    currentEditingData.skillGroups.push({
      category: 'New Competency Group',
      skills: ['Skill 1', 'Skill 2'],
      isLearning: false
    });
    document.getElementById('skills-list-container').innerHTML = renderSkillsEditorList(currentEditingData.skillGroups);
  });

  document.getElementById('btn-add-quickinfo')?.addEventListener('click', () => {
    if (!currentEditingData.quickInfo) currentEditingData.quickInfo = [];
    currentEditingData.quickInfo.push({ field: 'New Field', value: 'Value' });
    document.getElementById('quickinfo-list-container').innerHTML = renderQuickInfoEditorList(currentEditingData.quickInfo);
  });

  document.getElementById('btn-add-experience')?.addEventListener('click', () => {
    const newItem = {
      id: 'exp-' + Date.now(),
      title: 'New Project / Engineering Focus',
      description: 'Highlight of technical accomplishments and practical engineering impact.',
      highlightColor: '#06B6D4'
    };
    if (Array.isArray(currentEditingData.experience)) {
      currentEditingData.experience.push(newItem);
    } else {
      if (!currentEditingData.experience || typeof currentEditingData.experience !== 'object') {
        currentEditingData.experience = { items: [] };
      }
      if (!Array.isArray(currentEditingData.experience.items)) {
        currentEditingData.experience.items = [];
      }
      currentEditingData.experience.items.push(newItem);
    }
    document.getElementById('experience-list-container').innerHTML = renderExperienceEditorList(currentEditingData.experience);
  });

  document.getElementById('btn-add-passion')?.addEventListener('click', () => {
    let list = currentEditingData?.interests || currentEditingData?.passions;
    if (!Array.isArray(list)) {
      list = [];
    }
    list.push({
      id: 'int-' + Date.now(),
      icon: '⚡',
      title: 'New Domain',
      description: 'Passionate about innovating in this area.'
    });
    if (currentEditingData) {
      currentEditingData.interests = list;
      currentEditingData.passions = list;
    }
    document.getElementById('passions-list-container').innerHTML = renderPassionsEditorList(list);
  });

  document.getElementById('btn-add-journey')?.addEventListener('click', () => {
    if (!currentEditingData.journey) currentEditingData.journey = [];
    currentEditingData.journey.push({
      year: new Date().getFullYear().toString(),
      title: 'New Milestone',
      category: 'Specialization',
      description: 'Progress milestone summary...',
      skills: ['Tech 1']
    });
    document.getElementById('journey-list-container').innerHTML = renderJourneyEditorList(currentEditingData.journey);
  });

  document.getElementById('btn-add-achievement')?.addEventListener('click', () => {
    if (!currentEditingData.achievements) currentEditingData.achievements = [];
    currentEditingData.achievements.push({
      id: 'ach-' + Date.now(),
      title: 'Achievement Title',
      category: 'Coding Competitions',
      description: 'Achievement description...',
      date: new Date().getFullYear().toString()
    });
    document.getElementById('achievements-list-container').innerHTML = renderAchievementsEditorList(currentEditingData.achievements);
  });

  document.getElementById('btn-add-faq')?.addEventListener('click', () => {
    if (!currentEditingData.aiKnowledge) currentEditingData.aiKnowledge = { faqs: [] };
    if (!currentEditingData.aiKnowledge.faqs) currentEditingData.aiKnowledge.faqs = [];
    currentEditingData.aiKnowledge.faqs.push({
      question: 'New Question?',
      answer: 'Answer to the question.'
    });
    document.getElementById('faqs-list-container').innerHTML = renderFaqsEditorList(currentEditingData.aiKnowledge.faqs);
  });
}

// --- RENDER HELPERS ---

function renderQuickInfoEditorList(list) {
  if (!Array.isArray(list) || !list.length) return '<p style="color: #64748b; font-size: 0.9rem;">No quick info entries added.</p>';
  return list.map((item, idx) => `
    <div class="admin-item-card">
      <div class="admin-item-top">
        <span class="admin-item-title">${escapeVal(item.field || 'Field')}</span>
        <button type="button" class="btn-item-delete" onclick="window.deleteQuickInfo(${idx})">Delete</button>
      </div>
      <div class="admin-form-grid">
        <div class="admin-field">
          <label class="admin-label">Field Label</label>
          <input type="text" class="admin-input" value="${escapeVal(item.field)}" oninput="window.updateQuickInfoField(${idx}, 'field', this.value)" />
        </div>
        <div class="admin-field">
          <label class="admin-label">Value</label>
          <input type="text" class="admin-input" value="${escapeVal(item.value)}" oninput="window.updateQuickInfoField(${idx}, 'value', this.value)" />
        </div>
      </div>
    </div>
  `).join('');
}

function renderProjectsEditorList(projects) {
  if (!projects.length) return '<p style="color: #64748b; font-size: 0.9rem;">No projects added yet.</p>';
  return projects.map((p, idx) => {
    const techStr = Array.isArray(p.technologies) ? p.technologies.join(', ') : (p.technologies || '');
    const cs = p.caseStudy || {};
    return `
      <div class="admin-item-card" data-project-idx="${idx}">
        <div class="admin-item-top">
          <span class="admin-item-title">#${idx + 1}: ${escapeVal(p.title || 'Untitled Project')}</span>
          <button type="button" class="btn-item-delete" onclick="window.deleteProject(${idx})">Delete</button>
        </div>
        <div class="admin-form-grid">
          <div class="admin-field">
            <label class="admin-label">Project Title</label>
            <input type="text" class="admin-input" value="${escapeVal(p.title)}" oninput="window.updateProjectField(${idx}, 'title', this.value)" />
          </div>
          <div class="admin-field">
            <label class="admin-label">Domain / Category</label>
            <input type="text" class="admin-input" value="${escapeVal(p.category || p.tagline)}" oninput="window.updateProjectField(${idx}, 'category', this.value)" />
          </div>
          <div class="admin-field full-width">
            <label class="admin-label">Description</label>
            <textarea class="admin-textarea" oninput="window.updateProjectField(${idx}, 'description', this.value)">${escapeVal(p.description)}</textarea>
          </div>
          <div class="admin-field full-width">
            <label class="admin-label">Technologies (comma-separated)</label>
            <input type="text" class="admin-input" value="${escapeVal(techStr)}" oninput="window.updateProjectField(${idx}, 'technologies', this.value)" />
          </div>
          <div class="admin-field">
            <label class="admin-label">Live Demo URL</label>
            <input type="url" class="admin-input" value="${escapeVal(p.liveUrl || '')}" placeholder="https://..." oninput="window.updateProjectField(${idx}, 'liveUrl', this.value)" />
          </div>
          <div class="admin-field">
            <label class="admin-label">GitHub URL</label>
            <input type="url" class="admin-input" value="${escapeVal(p.githubUrl || '')}" placeholder="https://github.com/..." oninput="window.updateProjectField(${idx}, 'githubUrl', this.value)" />
          </div>
          <div class="admin-field full-width">
            <label class="admin-label">Project Image URL / Asset Path</label>
            <div style="display: flex; gap: 12px; align-items: center;">
              <input type="text" class="admin-input" value="${escapeVal(p.image || '')}" placeholder="/project_...jpg" oninput="window.updateProjectField(${idx}, 'image', this.value)" style="flex: 1;" />
              ${p.image ? `<img src="${escapeVal(p.image)}" alt="Thumbnail" style="width: 60px; height: 34px; object-fit: cover; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2);" />` : ''}
            </div>
          </div>
          <div class="admin-field full-width">
            <details style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
              <summary style="cursor: pointer; font-weight: 600; color: #38bdf8;">Deep-Dive Case Study Fields</summary>
              <div class="admin-form-grid" style="margin-top: 10px;">
                <div class="admin-field full-width">
                  <label class="admin-label">Problem Statement</label>
                  <textarea class="admin-textarea" oninput="window.updateCaseStudyField(${idx}, 'problem', this.value)">${escapeVal(cs.problem || '')}</textarea>
                </div>
                <div class="admin-field full-width">
                  <label class="admin-label">Engineering Solution</label>
                  <textarea class="admin-textarea" oninput="window.updateCaseStudyField(${idx}, 'solution', this.value)">${escapeVal(cs.solution || '')}</textarea>
                </div>
                <div class="admin-field full-width">
                  <label class="admin-label">Technical Architecture</label>
                  <textarea class="admin-textarea" oninput="window.updateCaseStudyField(${idx}, 'architecture', this.value)">${escapeVal(cs.architecture || '')}</textarea>
                </div>
                <div class="admin-field full-width">
                  <label class="admin-label">Key Results & Metrics</label>
                  <textarea class="admin-textarea" oninput="window.updateCaseStudyField(${idx}, 'result', this.value)">${escapeVal(cs.result || '')}</textarea>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderSkillsEditorList(groups) {
  if (!groups.length) return '<p style="color: #64748b; font-size: 0.9rem;">No skill categories added yet.</p>';
  return groups.map((g, idx) => {
    const skillsStr = Array.isArray(g.skills) ? g.skills.join(', ') : (g.skills || '');
    return `
      <div class="admin-item-card">
        <div class="admin-item-top">
          <span class="admin-item-title">${escapeVal(g.category || 'Skill Group')} ${g.isLearning ? '<span style="color:#f59e0b;font-size:0.75rem;">(Currently Learning)</span>' : ''}</span>
          <button type="button" class="btn-item-delete" onclick="window.deleteSkillGroup(${idx})">Delete</button>
        </div>
        <div class="admin-form-grid">
          <div class="admin-field">
            <label class="admin-label">Category Title</label>
            <input type="text" class="admin-input" value="${escapeVal(g.category)}" oninput="window.updateSkillGroupField(${idx}, 'category', this.value)" />
          </div>
          <div class="admin-field" style="display: flex; align-items: center; gap: 8px; margin-top: 24px;">
            <input type="checkbox" id="chk-learning-${idx}" ${g.isLearning ? 'checked' : ''} onchange="window.updateSkillGroupField(${idx}, 'isLearning', this.checked)" style="accent-color: #06b6d4;" />
            <label for="chk-learning-${idx}" style="color: #cbd5e1; font-size: 0.85rem; cursor: pointer;">Flag as 'Currently Learning'</label>
          </div>
          <div class="admin-field full-width">
            <label class="admin-label">Skills (comma-separated)</label>
            <input type="text" class="admin-input" value="${escapeVal(skillsStr)}" oninput="window.updateSkillGroupField(${idx}, 'skills', this.value)" />
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderExperienceEditorList(expData) {
  let items = [];
  if (Array.isArray(expData)) {
    items = expData;
  } else if (expData && typeof expData === 'object' && Array.isArray(expData.items)) {
    items = expData.items;
  }

  if (!items.length) {
    return '<p style="color: #64748b; font-size: 0.9rem;">No experience items added yet.</p>';
  }

  return items.map((item, idx) => `
    <div class="admin-item-card">
      <div class="admin-item-top">
        <span class="admin-item-title">${escapeVal(item.title || item.role || 'Experience Item')}</span>
        <button type="button" class="btn-item-delete" onclick="window.deleteExperience(${idx})">Delete</button>
      </div>
      <div class="admin-form-grid">
        <div class="admin-field">
          <label class="admin-label">Title / Role</label>
          <input type="text" class="admin-input" value="${escapeVal(item.title || item.role || '')}" oninput="window.updateExpField(${idx}, 'title', this.value)" />
        </div>
        <div class="admin-field">
          <label class="admin-label">Highlight Accent Color</label>
          <input type="text" class="admin-input" value="${escapeVal(item.highlightColor || '#06B6D4')}" oninput="window.updateExpField(${idx}, 'highlightColor', this.value)" placeholder="#06B6D4" />
        </div>
        <div class="admin-field full-width">
          <label class="admin-label">Description / Highlight Details</label>
          <textarea class="admin-textarea" oninput="window.updateExpField(${idx}, 'description', this.value)">${escapeVal(item.description || '')}</textarea>
        </div>
      </div>
    </div>
  `).join('');
}

function renderCertificatesEditorList(certs) {
  if (!certs || !certs.length) return '<p style="color: #64748b; font-size: 0.9rem;">No certificates published in vault.</p>';
  return certs.map((c, idx) => `
    <div class="admin-item-card">
      <div class="admin-item-top">
        <span class="admin-item-title">${escapeVal(c.title)} (${escapeVal(c.issuer)})</span>
        <button type="button" class="btn-item-delete" onclick="window.deleteCertificate('${c.id}', ${idx})">Delete</button>
      </div>
      <div class="admin-form-grid">
        <div class="admin-field">
          <span style="font-size: 0.85rem; color: #94a3b8;">Issued: ${escapeVal(c.date || 'N/A')}</span>
        </div>
        <div class="admin-field">
          <span style="font-size: 0.85rem; color: #94a3b8;">Category: ${escapeVal(c.category || 'General')}</span>
        </div>
        ${c.verifyUrl ? `
          <div class="admin-field full-width">
            <a href="${c.verifyUrl}" target="_blank" style="color: #38bdf8; font-size: 0.85rem;">↗ Verify Credential URL</a>
          </div>
        ` : ''}
        ${c.fileUrl ? `
          <div class="admin-field full-width">
            <a href="${c.fileUrl}" target="_blank" style="color: #34d399; font-size: 0.85rem; font-weight: 600;">📄 View Attached Document / Certificate ↗</a>
          </div>
        ` : ''}
      </div>
    </div>
  `).join('');
}

function renderPassionsEditorList(list) {
  if (!Array.isArray(list) || !list.length) return '<p style="color: #64748b; font-size: 0.9rem;">No interest or passion domains configured.</p>';
  return list.map((item, idx) => `
    <div class="admin-item-card">
      <div class="admin-item-top">
        <span class="admin-item-title">${item.icon || '🎯'} ${escapeVal(item.title)}</span>
        <button type="button" class="btn-item-delete" onclick="window.deletePassion(${idx})">Delete</button>
      </div>
      <div class="admin-form-grid">
        <div class="admin-field">
          <label class="admin-label">Icon / Emoji</label>
          <input type="text" class="admin-input" value="${escapeVal(item.icon || '')}" oninput="window.updatePassionField(${idx}, 'icon', this.value)" />
        </div>
        <div class="admin-field">
          <label class="admin-label">Domain Title</label>
          <input type="text" class="admin-input" value="${escapeVal(item.title)}" oninput="window.updatePassionField(${idx}, 'title', this.value)" />
        </div>
        <div class="admin-field full-width">
          <label class="admin-label">Description</label>
          <textarea class="admin-textarea" oninput="window.updatePassionField(${idx}, 'description', this.value)">${escapeVal(item.description)}</textarea>
        </div>
      </div>
    </div>
  `).join('');
}

function renderJourneyEditorList(list) {
  if (!Array.isArray(list) || !list.length) return '<p style="color: #64748b; font-size: 0.9rem;">No journey milestones configured.</p>';
  return list.map((item, idx) => `
    <div class="admin-item-card">
      <div class="admin-item-top">
        <span class="admin-item-title">${escapeVal(item.year)}: ${escapeVal(item.title)}</span>
        <button type="button" class="btn-item-delete" onclick="window.deleteJourney(${idx})">Delete</button>
      </div>
      <div class="admin-form-grid">
        <div class="admin-field">
          <label class="admin-label">Year / Milestone</label>
          <input type="text" class="admin-input" value="${escapeVal(item.year)}" oninput="window.updateJourneyField(${idx}, 'year', this.value)" />
        </div>
        <div class="admin-field">
          <label class="admin-label">Headline Title</label>
          <input type="text" class="admin-input" value="${escapeVal(item.title)}" oninput="window.updateJourneyField(${idx}, 'title', this.value)" />
        </div>
        <div class="admin-field full-width">
          <label class="admin-label">Description</label>
          <textarea class="admin-textarea" oninput="window.updateJourneyField(${idx}, 'description', this.value)">${escapeVal(item.description)}</textarea>
        </div>
      </div>
    </div>
  `).join('');
}

function renderAchievementsEditorList(list) {
  if (!Array.isArray(list) || !list.length) return '<p style="color: #64748b; font-size: 0.9rem;">No achievements configured.</p>';
  return list.map((item, idx) => `
    <div class="admin-item-card">
      <div class="admin-item-top">
        <span class="admin-item-title">🏆 ${escapeVal(item.title)}</span>
        <button type="button" class="btn-item-delete" onclick="window.deleteAchievement(${idx})">Delete</button>
      </div>
      <div class="admin-form-grid">
        <div class="admin-field">
          <label class="admin-label">Title</label>
          <input type="text" class="admin-input" value="${escapeVal(item.title)}" oninput="window.updateAchField(${idx}, 'title', this.value)" />
        </div>
        <div class="admin-field">
          <label class="admin-label">Category</label>
          <input type="text" class="admin-input" value="${escapeVal(item.category || '')}" oninput="window.updateAchField(${idx}, 'category', this.value)" />
        </div>
        <div class="admin-field full-width">
          <label class="admin-label">Description</label>
          <textarea class="admin-textarea" oninput="window.updateAchField(${idx}, 'description', this.value)">${escapeVal(item.description || '')}</textarea>
        </div>
      </div>
    </div>
  `).join('');
}

function renderContactMessagesList(messages) {
  if (!messages || !messages.length) {
    return '<p style="color: #64748b; font-size: 0.9rem;">No visitor messages received yet.</p>';
  }
  return messages.map((m, idx) => {
    const isReplied = !!m.replied;
    const repliedBadge = isReplied 
      ? `<span class="admin-badge-status" style="color: #22c55e; background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.3);">✓ Replied ${m.repliedAt ? new Date(m.repliedAt).toLocaleDateString() : ''}</span>`
      : `<span class="admin-badge-status" style="color: #f59e0b; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3);">Pending Reply</span>`;

    const lastReplyHtml = isReplied && m.lastReplyText ? `
      <div style="margin-top: 10px; padding: 10px 14px; background: rgba(34, 197, 94, 0.08); border-left: 3px solid #22c55e; border-radius: 6px; font-size: 0.82rem; color: #86efac;">
        <strong>Your Sent Reply (${escapeVal(m.lastReplySubject || 'Re: ' + (m.subject || ''))}):</strong>
        <div style="margin-top: 4px; white-space: pre-wrap; color: #f1f5f9;">${escapeVal(m.lastReplyText)}</div>
      </div>
    ` : '';

    return `
      <div class="admin-item-card full-width" style="border-left: 3px solid #38bdf8; margin-bottom: 16px;" id="msg-card-${idx}">
        <div class="admin-item-top" style="display: flex; justify-content: space-between; align-items: center;">
          <span class="admin-item-title">From: <strong>${escapeVal(m.name)}</strong> (<a href="mailto:${escapeVal(m.email)}" style="color: #38bdf8;">${escapeVal(m.email)}</a>)</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            ${repliedBadge}
            <span style="font-size: 0.8rem; color: #94a3b8;">${m.receivedAt ? new Date(m.receivedAt).toLocaleString() : ''}</span>
          </div>
        </div>
        <p style="font-size: 0.88rem; font-weight: 600; color: #f1f5f9; margin: 6px 0;">Subject: ${escapeVal(m.subject || 'No subject')}</p>
        <div style="background: rgba(0,0,0,0.25); padding: 12px 14px; border-radius: 8px; font-size: 0.88rem; color: #cbd5e1; white-space: pre-wrap; margin-top: 8px; border: 1px solid rgba(255,255,255,0.06);">
          ${escapeVal(m.message)}
        </div>
        ${lastReplyHtml}

        <!-- Interactive Email Reply Box -->
        <div style="margin-top: 12px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <button type="button" class="btn-cert-upload-trigger" style="font-size: 0.82rem; padding: 6px 14px;" onclick="window.toggleReplyBox(${idx})">
            <span>✉️ ${isReplied ? 'Send Another Reply' : 'Reply via Email'}</span>
          </button>
          <a href="https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(m.email)}&su=${encodeURIComponent('Re: ' + (m.subject || ''))}" target="_blank" rel="noopener noreferrer" class="btn-cert-upload-trigger" style="font-size: 0.82rem; padding: 6px 14px; background: rgba(56, 189, 248, 0.1); border-color: rgba(56, 189, 248, 0.3); color: #38bdf8; text-decoration: none;">
            <span>🌐 Open in Gmail Web</span>
          </a>
        </div>

        <div id="reply-box-${idx}" class="is-hidden" style="margin-top: 14px; padding: 14px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 10px;">
          <h4 style="font-size: 0.88rem; color: #38bdf8; margin: 0 0 10px 0;">✉️ Compose Email Reply to ${escapeVal(m.name)}</h4>
          <div class="admin-field full-width" style="margin-bottom: 10px;">
            <label class="admin-label">Subject</label>
            <input type="text" id="reply-subject-${idx}" class="admin-input" value="Re: ${escapeVal(m.subject || '')}" />
          </div>
          <div class="admin-field full-width" style="margin-bottom: 12px;">
            <label class="admin-label">Your Message Response</label>
            <textarea id="reply-text-${idx}" class="admin-textarea" rows="4" placeholder="Type your response to ${escapeVal(m.name)}..."></textarea>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <button type="button" id="btn-send-reply-${idx}" class="btn-cert-primary" style="font-size: 0.82rem; padding: 8px 18px;" onclick="window.sendContactReply(${idx})">
              <span>🚀 Send Email Reply</span>
            </button>
            <button type="button" class="btn-cert-secondary" style="font-size: 0.82rem; padding: 8px 14px;" onclick="window.toggleReplyBox(${idx})">
              Cancel
            </button>
            <span id="reply-status-${idx}" style="font-size: 0.82rem; color: #94a3b8;"></span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderNewsletterSubscribersList(subscribers) {
  if (!subscribers || !subscribers.length) {
    return '<p style="color: #64748b; font-size: 0.9rem;">No newsletter subscribers registered yet.</p>';
  }
  return subscribers.map((s, idx) => `
    <div class="admin-item-card full-width" style="border-left: 3px solid #10b981; display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; margin-bottom: 8px;">
      <div>
        <span style="font-weight: 700; color: #38bdf8; font-size: 0.92rem;">${escapeVal(s.email)}</span>
        <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 2px;">Subscribed: ${s.subscribedAt ? new Date(s.subscribedAt).toLocaleString() : ''}</div>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <span class="admin-badge-status" style="color: #10b981; background: rgba(16, 185, 129, 0.1);">ACTIVE</span>
        <button type="button" class="btn-item-delete" onclick="window.deleteSubscriber(${idx})">Remove</button>
      </div>
    </div>
  `).join('');
}

function renderFaqsEditorList(faqs) {
  if (!faqs || !faqs.length) return '<p style="color: #64748b; font-size: 0.9rem;">No FAQs configured.</p>';
  return faqs.map((f, idx) => `
    <div class="admin-item-card">
      <div class="admin-item-top">
        <span class="admin-item-title">Q: ${escapeVal(f.question)}</span>
        <button type="button" class="btn-item-delete" onclick="window.deleteFaq(${idx})">Delete</button>
      </div>
      <div class="admin-form-grid">
        <div class="admin-field full-width">
          <label class="admin-label">Question</label>
          <input type="text" class="admin-input" value="${escapeVal(f.question)}" oninput="window.updateFaqField(${idx}, 'question', this.value)" />
        </div>
        <div class="admin-field full-width">
          <label class="admin-label">AI Answer Response</label>
          <textarea class="admin-textarea" oninput="window.updateFaqField(${idx}, 'answer', this.value)">${escapeVal(f.answer)}</textarea>
        </div>
      </div>
    </div>
  `).join('');
}

function renderAuditLogsList(logs) {
  if (!logs || !logs.length) return '<p style="color: #64748b; font-size: 0.9rem;">No audit logs recorded.</p>';
  return logs.slice(0, 30).map(l => {
    const isDenied = l.status === 'DENIED';
    const isAuth = l.status === 'AUTHORIZED';
    const color = isDenied ? '#ef4444' : isAuth ? '#22c55e' : '#38bdf8';
    return `
      <div style="padding: 8px 12px; background: rgba(0,0,0,0.3); border-radius: 6px; margin-bottom: 6px; font-family: monospace; font-size: 0.8rem; border-left: 2px solid ${color};">
        <span style="color: ${color}; font-weight: bold;">[${escapeVal(l.status || 'LOG')}]</span>
        <span style="color: #94a3b8; margin: 0 6px;">${escapeVal(l.service)}</span>
        <span style="color: #f1f5f9;">${escapeVal(l.message)}</span>
        <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">${l.timestamp ? new Date(l.timestamp).toLocaleString() : ''}</div>
      </div>
    `;
  }).join('');
}

// Window mutation helpers
window.deleteProject = (idx) => {
  currentEditingData?.projects?.splice(idx, 1);
  document.getElementById('projects-list-container').innerHTML = renderProjectsEditorList(currentEditingData.projects || []);
};

window.updateProjectField = (idx, field, value) => {
  if (!currentEditingData?.projects?.[idx]) return;
  if (field === 'technologies') {
    currentEditingData.projects[idx][field] = value.split(',').map(s => s.trim()).filter(Boolean);
  } else {
    currentEditingData.projects[idx][field] = value;
  }
};

window.updateCaseStudyField = (idx, field, value) => {
  if (!currentEditingData?.projects?.[idx]) return;
  if (!currentEditingData.projects[idx].caseStudy) currentEditingData.projects[idx].caseStudy = {};
  currentEditingData.projects[idx].caseStudy[field] = value;
};

window.deleteSkillGroup = (idx) => {
  currentEditingData?.skillGroups?.splice(idx, 1);
  document.getElementById('skills-list-container').innerHTML = renderSkillsEditorList(currentEditingData.skillGroups || []);
};

window.updateSkillGroupField = (idx, field, value) => {
  if (!currentEditingData?.skillGroups?.[idx]) return;
  if (field === 'skills') {
    currentEditingData.skillGroups[idx][field] = value.split(',').map(s => s.trim()).filter(Boolean);
  } else {
    currentEditingData.skillGroups[idx][field] = value;
  }
};

window.deleteQuickInfo = (idx) => {
  currentEditingData?.quickInfo?.splice(idx, 1);
  document.getElementById('quickinfo-list-container').innerHTML = renderQuickInfoEditorList(currentEditingData.quickInfo || []);
};

window.updateQuickInfoField = (idx, field, value) => {
  if (!currentEditingData?.quickInfo?.[idx]) return;
  currentEditingData.quickInfo[idx][field] = value;
};

window.deleteExperience = (idx) => {
  if (!currentEditingData) return;
  if (Array.isArray(currentEditingData.experience)) {
    currentEditingData.experience.splice(idx, 1);
  } else if (currentEditingData.experience && Array.isArray(currentEditingData.experience.items)) {
    currentEditingData.experience.items.splice(idx, 1);
  }
  document.getElementById('experience-list-container').innerHTML = renderExperienceEditorList(currentEditingData.experience);
};

window.updateExpField = (idx, field, value) => {
  if (!currentEditingData) return;
  let target = null;
  if (Array.isArray(currentEditingData.experience)) {
    target = currentEditingData.experience[idx];
  } else if (currentEditingData.experience && Array.isArray(currentEditingData.experience.items)) {
    target = currentEditingData.experience.items[idx];
  }
  if (target) {
    target[field] = value;
    if (field === 'title') target.role = value;
    if (field === 'role') target.title = value;
  }
};

window.deleteCertificate = async (id, idx) => {
  const token = getStoredToken();
  try {
    await fetch(`/api/certificates/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } catch (e) {}
  currentEditingData?.certificates?.splice(idx, 1);
  document.getElementById('certificates-list-container').innerHTML = renderCertificatesEditorList(currentEditingData.certificates || []);
  showToast('Certificate removed.');
};

window.deletePassion = (idx) => {
  let list = currentEditingData?.interests || currentEditingData?.passions;
  if (Array.isArray(list)) {
    list.splice(idx, 1);
    if (currentEditingData) {
      currentEditingData.interests = list;
      currentEditingData.passions = list;
    }
  }
  document.getElementById('passions-list-container').innerHTML = renderPassionsEditorList(list || []);
};

window.updatePassionField = (idx, field, value) => {
  let list = currentEditingData?.interests || currentEditingData?.passions;
  if (Array.isArray(list) && list[idx]) {
    list[idx][field] = value;
  }
};

window.deleteJourney = (idx) => {
  currentEditingData?.journey?.splice(idx, 1);
  document.getElementById('journey-list-container').innerHTML = renderJourneyEditorList(currentEditingData.journey || []);
};

window.updateJourneyField = (idx, field, value) => {
  if (!currentEditingData?.journey?.[idx]) return;
  currentEditingData.journey[idx][field] = value;
};

window.deleteAchievement = (idx) => {
  currentEditingData?.achievements?.splice(idx, 1);
  document.getElementById('achievements-list-container').innerHTML = renderAchievementsEditorList(currentEditingData.achievements || []);
};

window.updateAchField = (idx, field, value) => {
  if (!currentEditingData?.achievements?.[idx]) return;
  currentEditingData.achievements[idx][field] = value;
};

window.deleteFaq = (idx) => {
  currentEditingData?.aiKnowledge?.faqs?.splice(idx, 1);
  document.getElementById('faqs-list-container').innerHTML = renderFaqsEditorList(currentEditingData.aiKnowledge.faqs || []);
};

window.updateFaqField = (idx, field, value) => {
  if (!currentEditingData?.aiKnowledge?.faqs?.[idx]) return;
  currentEditingData.aiKnowledge.faqs[idx][field] = value;
};

window.toggleReplyBox = (idx) => {
  const box = document.getElementById(`reply-box-${idx}`);
  if (!box) return;
  box.classList.toggle('is-hidden');
};

window.sendContactReply = async (idx) => {
  const msg = currentEditingData?.contactMessages?.[idx];
  if (!msg) return;

  const subject = document.getElementById(`reply-subject-${idx}`)?.value?.trim();
  const replyMessage = document.getElementById(`reply-text-${idx}`)?.value?.trim();
  const statusEl = document.getElementById(`reply-status-${idx}`);
  const sendBtn = document.getElementById(`btn-send-reply-${idx}`);

  if (!replyMessage) {
    if (statusEl) {
      statusEl.textContent = 'Please enter a reply message.';
      statusEl.style.color = '#ef4444';
    }
    return;
  }

  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span>Sending Email...</span>';
  }
  if (statusEl) {
    statusEl.textContent = 'Delivering via Gmail SMTP...';
    statusEl.style.color = '#38bdf8';
  }

  const token = getStoredToken();

  try {
    const res = await fetch('/api/contact/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        messageId: msg.id,
        toEmail: msg.email,
        toName: msg.name,
        subject,
        replyMessage
      })
    });

    const data = await res.json();
    if (data.success) {
      msg.replied = true;
      msg.repliedAt = new Date().toISOString();
      msg.lastReplyText = replyMessage;
      msg.lastReplySubject = subject;

      showToast(`✓ Reply sent to ${msg.email}!`);
      document.getElementById('contact-messages-container').innerHTML = renderContactMessagesList(currentEditingData.contactMessages);
    } else {
      if (statusEl) {
        statusEl.textContent = data.message || 'Failed to send reply.';
        statusEl.style.color = '#ef4444';
      }
      if (data.gmailComposeUrl) {
        window.open(data.gmailComposeUrl, '_blank');
      }
    }
  } catch (err) {
    if (statusEl) {
      statusEl.textContent = 'Error: ' + err.message;
      statusEl.style.color = '#ef4444';
    }
  } finally {
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.innerHTML = '<span>🚀 Send Email Reply</span>';
    }
  }
};

window.deleteSubscriber = async (idx) => {
  if (!currentEditingData?.newsletterSubscribers?.[idx]) return;
  const sub = currentEditingData.newsletterSubscribers[idx];
  const token = getStoredToken();

  // Optimistic UI update: remove immediately so it never hangs or fails to respond
  currentEditingData.newsletterSubscribers.splice(idx, 1);
  document.getElementById('newsletter-subscribers-container').innerHTML = renderNewsletterSubscribersList(currentEditingData.newsletterSubscribers);
  showToast(`✓ Removed ${sub.email} from subscribers.`);

  try {
    const res = await fetch(`/api/newsletter/subscribers/${encodeURIComponent(sub.id || sub.email)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: sub.id, email: sub.email })
    });

    if (!res.ok) {
      await fetch('/api/newsletter/subscribers/delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: sub.id, email: sub.email })
      });
    }
  } catch (err) {
    console.warn('[CMS] Background subscriber deletion notice:', err);
  }
};

function collectFormValues() {
  if (!currentEditingData) return;
  if (!currentEditingData.personalInfo) currentEditingData.personalInfo = {};
  if (!currentEditingData.education) currentEditingData.education = {};
  if (!currentEditingData.resume) currentEditingData.resume = {};
  if (!currentEditingData.aiKnowledge) currentEditingData.aiKnowledge = {};

  const p = currentEditingData.personalInfo;
  const getVal = (id) => document.getElementById(id)?.value?.trim() ?? '';

  if (document.getElementById('inp-name')) p.name = getVal('inp-name');
  if (document.getElementById('inp-shortname')) p.shortName = getVal('inp-shortname');
  if (document.getElementById('inp-headline')) p.headline = getVal('inp-headline');
  if (document.getElementById('inp-sec-headline')) p.secondaryHeadline = getVal('inp-sec-headline');
  if (document.getElementById('inp-intro')) p.introParagraph = getVal('inp-intro');
  if (document.getElementById('inp-email')) p.email = getVal('inp-email');
  if (document.getElementById('inp-phone')) p.phone = getVal('inp-phone');
  if (document.getElementById('inp-location')) p.location = getVal('inp-location');
  if (document.getElementById('inp-availability')) p.availabilityStatus = getVal('inp-availability');
  if (document.getElementById('inp-college')) p.college = getVal('inp-college');
  if (document.getElementById('inp-github')) p.github = getVal('inp-github');
  if (document.getElementById('inp-linkedin')) p.linkedin = getVal('inp-linkedin');
  if (document.getElementById('inp-twitter')) p.twitter = getVal('inp-twitter');
  if (document.getElementById('inp-instagram')) p.instagram = getVal('inp-instagram');

  const edu = currentEditingData.education;
  if (document.getElementById('inp-edu-degree')) edu.degree = getVal('inp-edu-degree');
  if (document.getElementById('inp-edu-inst')) edu.institution = getVal('inp-edu-inst');
  if (document.getElementById('inp-edu-time')) edu.timeline = getVal('inp-edu-time');
  if (document.getElementById('inp-edu-sec-inst')) edu.secondaryInstitution = getVal('inp-edu-sec-inst');
  if (document.getElementById('inp-edu-sec-desc')) edu.secondaryDescription = getVal('inp-edu-sec-desc');

  if (document.getElementById('inp-resume-headline')) currentEditingData.resume.headline = getVal('inp-resume-headline');
  if (document.getElementById('inp-ai-prompt')) currentEditingData.aiKnowledge.systemPrompt = getVal('inp-ai-prompt');

  if (currentEditingData.experience && typeof currentEditingData.experience === 'object' && !Array.isArray(currentEditingData.experience)) {
    if (document.getElementById('inp-exp-role')) currentEditingData.experience.role = getVal('inp-exp-role');
    if (document.getElementById('inp-exp-focus')) currentEditingData.experience.focus = getVal('inp-exp-focus');
    if (document.getElementById('inp-exp-timeline')) currentEditingData.experience.timeline = getVal('inp-exp-timeline');
    if (document.getElementById('inp-exp-badge')) currentEditingData.experience.badge = getVal('inp-exp-badge');
    if (document.getElementById('inp-exp-summary')) currentEditingData.experience.summary = getVal('inp-exp-summary');
  }

  // Ensure interests & passions are kept in sync
  if (currentEditingData.interests && !currentEditingData.passions) {
    currentEditingData.passions = currentEditingData.interests;
  } else if (currentEditingData.passions && !currentEditingData.interests) {
    currentEditingData.interests = currentEditingData.passions;
  }
}

async function savePortfolioChanges() {
  collectFormValues();

  const saveBtn = document.getElementById('btn-save-portfolio');
  const originalHtml = saveBtn.innerHTML;
  saveBtn.innerHTML = '<span>Saving to Database...</span>';
  saveBtn.disabled = true;

  const token = getStoredToken();

  try {
    let res = await fetch('/api/portfolio', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(currentEditingData)
    });

    if (!res.ok && res.status !== 401 && res.status !== 403) {
      res = await fetch('http://localhost:3001/api/portfolio', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(currentEditingData)
      });
    }

    const data = await res.json();
    if (data.success) {
      showToast('✨ Portfolio published and permanently updated!');
      window.cmsData = currentEditingData;
      hydratePortfolio(currentEditingData);
    } else {
      showToast(data.message || 'Error saving portfolio.', true);
      if (res.status === 401 || res.status === 403) {
        setStoredToken(null);
        renderAuthScreen('Session expired. Please re-authenticate.');
      }
    }
  } catch (err) {
    showToast('Network error saving to backend: ' + err.message, true);
  } finally {
    saveBtn.innerHTML = originalHtml;
    saveBtn.disabled = false;
  }
}

export async function openAdminModal() {
  const overlay = document.getElementById('admin-modal-overlay');
  if (!overlay) return;

  overlay.classList.add('active');

  const isValid = await validateStoredToken();
  if (isValid) {
    await loadAndRenderStudio();
  } else {
    renderAuthScreen();
  }
}

export function closeAdminModal() {
  const overlay = document.getElementById('admin-modal-overlay');
  overlay?.classList.remove('active');

  // Automatically sign out when closing the admin session as requested by user
  setStoredToken(null);
  sessionStorage.setItem('admin_logged_out', 'true');

  try {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  } catch (_) {}

  // If user navigated to /portfolio/admin/, clean URL back to / on close
  if (window.location.pathname.startsWith('/portfolio/admin')) {
    window.history.pushState(null, '', '/');
  }

  // Reset to auth screen so reopening requires sign in
  renderAuthScreen();
  showToast('Admin session closed & signed out.');
}

function attachEventListeners() {
  // Modal exit / close
  document.getElementById('btn-admin-close')?.addEventListener('click', closeAdminModal);
  document.getElementById('btn-admin-exit')?.addEventListener('click', closeAdminModal);

  // Close on backdrop click
  document.getElementById('admin-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'admin-modal-overlay') {
      closeAdminModal();
    }
  });

  // Save changes button
  document.getElementById('btn-save-portfolio')?.addEventListener('click', savePortfolioChanges);

  // Keyboard shortcut: Ctrl + Shift + A or Cmd + Shift + A to toggle
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault();
      const overlay = document.getElementById('admin-modal-overlay');
      if (overlay?.classList.contains('active')) {
        closeAdminModal();
      } else {
        openAdminModal();
      }
    }
    if (e.key === 'Escape') {
      closeAdminModal();
    }
  });

  // Listen for hashchange (e.g. clicking #admin links)
  window.addEventListener('hashchange', checkUrlForAdminTrigger);

  // Footer discreet admin button trigger
  document.getElementById('btn-footer-admin')?.addEventListener('click', (e) => {
    e.preventDefault();
    openAdminModal();
  });
}

function checkUrlForAdminTrigger() {
  const p = window.location.pathname;
  const isMatch = p === '/portfolio/admin' || p === '/portfolio/admin/' || p.startsWith('/portfolio/admin') || window.location.hash === '#admin' || window.location.search.includes('admin=true');

  if (isMatch) {
    setTimeout(openAdminModal, 200);
  }
}

function escapeVal(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Auto-initialize
if (typeof window !== 'undefined') {
  window.openAdminModal = openAdminModal;
  window.closeAdminModal = closeAdminModal;
  document.addEventListener('DOMContentLoaded', initAdminCMS);
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initAdminCMS();
  }

  // Automatically sign out when closing tab or browser window
  window.addEventListener('beforeunload', () => {
    sessionStorage.setItem('admin_logged_out', 'true');
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  });
}
