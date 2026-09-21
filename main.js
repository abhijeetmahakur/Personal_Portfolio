import Lenis from 'lenis';
import './portfolio-cms.js';
import './admin-cms.js';

// ==========================================================================
// Configuration & Constants
// ==========================================================================
const TOTAL_FRAMES = 240;
const LERP_FACTOR = 0.085; // Natural inertia for frame scrub
const KEYFRAME_STEP = 8;   // Stride for fast keyframe preload
const CONCURRENCY = 6;     // Background streaming concurrency

// DOM Elements
const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
const loaderLine = document.getElementById('loader-line');
const loaderProgress = document.getElementById('loader-progress');
const statusDot = document.querySelector('.status-dot');
const frameCounter = document.getElementById('frame-counter');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const mobileDrawer = document.getElementById('mobile-drawer');
const mobileDrawerBackdrop = document.getElementById('mobile-drawer-backdrop');
const mobileDrawerClose = document.getElementById('mobile-drawer-close');
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');
const newsletterForm = document.getElementById('newsletter-form');
const navLinks = document.querySelectorAll('.nav-link');

// Ask Abhijeet AI Widget Elements
const aiAssistantRoot = document.getElementById('ai-assistant-root');
const aiToggleBtn = document.getElementById('ai-assistant-toggle');
const aiChatPanel = document.getElementById('ai-chat-panel');
const aiChatClose = document.getElementById('ai-chat-close');
const aiChatMessages = document.getElementById('ai-chat-messages');
const aiChatForm = document.getElementById('ai-chat-form');
const aiChatInput = document.getElementById('ai-chat-input');
const aiChatChips = document.querySelectorAll('.ai-chip');

// Animation State
const images = new Array(TOTAL_FRAMES + 1);
const isLoaded = new Array(TOTAL_FRAMES + 1).fill(false);
let loadedCount = 0;
let currentFrame = 1;
let targetFrame = 1;
let lastRenderedFrame = -1;
let dpr = Math.min(window.devicePixelRatio || 1, 2);

// ==========================================================================
// Multi-Tier Responsive Frame Retrieval & Aspect-Ratio Preserving Canvas Math
// ==========================================================================
function getFrameDirectory() {
  const w = window.innerWidth;
  if (w < 768) {
    return 'frames_24fps_mobile'; // 640x360, ~9KB per frame
  } else if (w < 1024) {
    return 'frames_24fps_tablet'; // 960x540, ~19KB per frame
  }
  return 'frames_24fps_webp';     // 1920x1080 desktop master frames
}

function getFrameSrc(index, format = 'webp') {
  const pad = String(index).padStart(3, '0');
  if (format === 'webp') {
    const dir = getFrameDirectory();
    return `/${dir}/frame_${pad}.webp`;
  }
  return `/frames_24fps_${format}/frame_${pad}.${format}`;
}

// Render the requested frame index using center-cover math
function renderFrame(index) {
  const img = getNearestLoadedImage(index);
  if (!img || !img.naturalWidth) return;

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const imgWidth = img.naturalWidth;
  const imgHeight = img.naturalHeight;

  // Cover math: scale image so it completely fills the canvas without distortion
  const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
  const drawWidth = imgWidth * scale;
  const drawHeight = imgHeight * scale;
  const drawX = (canvasWidth - drawWidth) / 2;
  const drawY = (canvasHeight - drawHeight) / 2;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

  lastRenderedFrame = index;

  // Update Status HUD
  const displayIndex = String(Math.round(index)).padStart(3, '0');
  if (frameCounter) {
    frameCounter.textContent = `FRAME ${displayIndex} / ${TOTAL_FRAMES}`;
  }
}

// Outward search for nearest loaded frame (Zero flicker guarantee)
function getNearestLoadedImage(index) {
  const target = Math.round(index);
  if (isLoaded[target] && images[target]?.naturalWidth > 0) {
    return images[target];
  }

  for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
    const prev = target - offset;
    if (prev >= 1 && isLoaded[prev] && images[prev]?.naturalWidth > 0) {
      return images[prev];
    }
    const next = target + offset;
    if (next <= TOTAL_FRAMES && isLoaded[next] && images[next]?.naturalWidth > 0) {
      return images[next];
    }
  }

  return null;
}

// Responsive Canvas Resize with HiDPI support
function handleResize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;

  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);

  if (lastRenderedFrame !== -1) {
    renderFrame(lastRenderedFrame);
  }
}

// ==========================================================================
// Multi-Stage Progressive Preloader
// ==========================================================================
function loadImage(index) {
  return new Promise((resolve) => {
    if (isLoaded[index]) {
      resolve(images[index]);
      return;
    }

    const img = new Image();
    img.decoding = 'async';

    img.onload = () => {
      images[index] = img;
      isLoaded[index] = true;
      loadedCount++;
      updateLoadProgress();

      // Render Frame 1 immediately upon arrival
      if (index === 1 && lastRenderedFrame === -1) {
        renderFrame(1);
      }

      resolve(img);
    };

    img.onerror = () => {
      // Fallback to original PNG if WebP fails
      const fallback = new Image();
      fallback.decoding = 'async';
      fallback.onload = () => {
        images[index] = fallback;
        isLoaded[index] = true;
        loadedCount++;
        updateLoadProgress();
        if (index === 1 && lastRenderedFrame === -1) {
          renderFrame(1);
        }
        resolve(fallback);
      };
      fallback.onerror = () => {
        resolve(null);
      };
      fallback.src = getFrameSrc(index, 'png');
    };

    img.src = getFrameSrc(index, 'webp');
  });
}

function updateLoadProgress() {
  const percent = Math.round((loadedCount / TOTAL_FRAMES) * 100);
  if (loaderProgress) {
    loaderProgress.style.width = `${percent}%`;
  }

  if (loadedCount >= TOTAL_FRAMES) {
    statusDot?.classList.remove('buffering');
    loaderLine?.classList.add('is-hidden');
  } else {
    statusDot?.classList.add('buffering');
  }
}

async function startProgressivePreload() {
  // Phase 1: Poster Frame 1
  await loadImage(1);

  // Phase 2: Keyframe sampling across the sequence
  const keyframes = [];
  for (let i = 1; i <= TOTAL_FRAMES; i += KEYFRAME_STEP) {
    if (i !== 1) keyframes.push(i);
  }
  if (!keyframes.includes(TOTAL_FRAMES)) {
    keyframes.push(TOTAL_FRAMES);
  }
  await Promise.all(keyframes.map((idx) => loadImage(idx)));

  // Phase 3: Background pool for full frame density
  const remaining = [];
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    if (!isLoaded[i]) remaining.push(i);
  }

  let queueIdx = 0;
  async function worker() {
    while (queueIdx < remaining.length) {
      const idx = remaining[queueIdx++];
      await loadImage(idx);
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);
}

// ==========================================================================
// Lenis Smooth Scroll Setup with Accessibility Reduced-Motion Support
// ==========================================================================
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lenis = new Lenis({
  lerp: prefersReducedMotion ? 1 : 0.085,
  duration: prefersReducedMotion ? 0 : 1.2,
  smoothWheel: !prefersReducedMotion,
  wheelMultiplier: 0.95,
  touchMultiplier: 1.5,
  infinite: false,
});
window.lenis = lenis;

function calculateScrollTarget() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return 1;

  const progress = Math.max(0, Math.min(1, window.scrollY / maxScroll));
  return 1 + progress * (TOTAL_FRAMES - 1);
}

// Physics Scrubbing & Render Loop
function tick(time) {
  lenis.raf(time);

  targetFrame = calculateScrollTarget();

  // Inertia smoothing
  const diff = targetFrame - currentFrame;
  if (Math.abs(diff) < 0.005) {
    currentFrame = targetFrame;
  } else {
    currentFrame += diff * LERP_FACTOR;
  }

  const frameToDraw = Math.round(currentFrame);
  if (frameToDraw !== lastRenderedFrame) {
    renderFrame(frameToDraw);
  }

  requestAnimationFrame(tick);
}

// ==========================================================================
// Interactive UI & Event Listeners
// ==========================================================================

// Smooth Anchor Scrolling
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const targetId = anchor.getAttribute('href');
    if (targetId && targetId !== '#') {
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        lenis.scrollTo(targetEl, { offset: -70, duration: 1.2 });
        mobileDrawer?.classList.remove('open');
      }
    }
  });
});

// Active Section Highlighting in Navbar
const sections = document.querySelectorAll('section[id]');
function updateActiveNav() {
  const scrollY = window.scrollY + 120;
  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute('id');

    if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
      navLinks.forEach((link) => {
        if (link.getAttribute('href') === `#${sectionId}`) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }
  });
}
window.addEventListener('scroll', updateActiveNav, { passive: true });

// Mobile Drawer Controller
function openMobileDrawer() {
  mobileDrawer?.classList.add('open');
  mobileDrawerBackdrop?.classList.add('open');
  mobileMenuToggle?.classList.add('open');
  mobileMenuToggle?.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeMobileDrawer() {
  mobileDrawer?.classList.remove('open');
  mobileDrawerBackdrop?.classList.remove('open');
  mobileMenuToggle?.classList.remove('open');
  mobileMenuToggle?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

function toggleMobileDrawer() {
  if (mobileDrawer?.classList.contains('open')) {
    closeMobileDrawer();
  } else {
    openMobileDrawer();
  }
}

mobileMenuToggle?.addEventListener('click', toggleMobileDrawer);
mobileDrawerClose?.addEventListener('click', closeMobileDrawer);
mobileDrawerBackdrop?.addEventListener('click', closeMobileDrawer);

// Close drawer when clicking any link inside it
mobileDrawer?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    closeMobileDrawer();
  });
});

// Contact Form Handler - Live Backend API Integration with Gmail Forwarding
contactForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = contactForm.querySelector('.btn-submit');
  const originalText = btn.innerHTML;

  const nameInput = contactForm.querySelector('#name');
  const emailInput = contactForm.querySelector('#email');
  const subjectInput = contactForm.querySelector('#subject');
  const messageInput = contactForm.querySelector('#message');

  const name = nameInput?.value?.trim() || '';
  const email = emailInput?.value?.trim() || '';
  const subject = subjectInput?.value?.trim() || '';
  const message = messageInput?.value?.trim() || '';

  if (!name || !email || !message) {
    if (formStatus) {
      formStatus.className = 'form-status-msg error';
      formStatus.style.color = '#ef4444';
      formStatus.textContent = 'Please fill in all required fields.';
    }
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span>Sending to Gmail...</span>';
  btn.style.opacity = '0.85';

  if (formStatus) {
    formStatus.className = 'form-status-msg';
    formStatus.style.color = '#38bdf8';
    formStatus.textContent = "Delivering directly to Abhijeet's Gmail inbox...";
  }

  try {
    let res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message })
    });

    if (!res.ok && res.status !== 400) {
      res = await fetch('http://localhost:3001/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message })
      });
    }

    const data = await res.json();
    if (data.success) {
      if (formStatus) {
        formStatus.className = 'form-status-msg success';
        formStatus.style.color = '#34d399';
        formStatus.textContent = `✓ Message sent directly to Abhijeet's Gmail! Thank you, ${name}.`;
        contactForm.reset();
        setTimeout(() => {
          formStatus.textContent = '';
        }, 7000);
      }
    } else {
      if (formStatus) {
        formStatus.className = 'form-status-msg error';
        formStatus.style.color = '#ef4444';
        formStatus.textContent = `✕ ${data.message || 'Error sending message. Please try again.'}`;
      }
    }
  } catch (err) {
    console.error('Contact Form Error:', err);
    if (formStatus) {
      formStatus.className = 'form-status-msg error';
      formStatus.style.color = '#ef4444';
      formStatus.textContent = '✕ Network error sending message. Please check backend connection.';
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
    btn.style.opacity = '1';
  }
});

// Newsletter Form Handler - Live Backend Subscription & Database Persistence
newsletterForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = newsletterForm.querySelector('input');
  const btn = newsletterForm.querySelector('button');
  const statusEl = document.getElementById('newsletter-status');
  const email = input?.value?.trim();

  if (!email) return;

  const originalBtnContent = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = '0.6';
  }
  if (statusEl) {
    statusEl.style.color = '#38bdf8';
    statusEl.textContent = 'Subscribing...';
  }

  try {
    let res = await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!res.ok && res.status !== 400) {
      res = await fetch('http://localhost:3001/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
    }

    const data = await res.json();
    if (data.success) {
      if (statusEl) {
        statusEl.style.color = '#34d399';
        statusEl.textContent = data.alreadySubscribed ? '✓ Already subscribed!' : '✓ Subscribed! Welcome aboard.';
        if (input) input.value = '';
        setTimeout(() => {
          if (statusEl) statusEl.textContent = '';
        }, 6000);
      }
    } else {
      if (statusEl) {
        statusEl.style.color = '#ef4444';
        statusEl.textContent = `✕ ${data.message || 'Subscription failed.'}`;
      }
    }
  } catch (err) {
    console.error('Newsletter Error:', err);
    if (statusEl) {
      statusEl.style.color = '#ef4444';
      statusEl.textContent = '✕ Network error. Please try again.';
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.innerHTML = originalBtnContent;
    }
  }
});

// Keyboard Navigation & Escape Key Support
window.addEventListener('keydown', (e) => {
  const step = 80;
  if (e.key === 'ArrowDown') {
    lenis.scrollTo(window.scrollY + step);
  } else if (e.key === 'ArrowUp') {
    lenis.scrollTo(window.scrollY - step);
  } else if (e.key === 'Escape') {
    closeMobileDrawer();
    closeAiChat();
  }
});

// ==========================================================================
// Ask Abhijeet AI Floating Assistant Controller
// ==========================================================================
const aiChatTyping = document.getElementById('ai-chat-typing');
const aiChatReset = document.getElementById('ai-chat-reset');

function openAiChat() {
  aiChatPanel?.classList.add('active', 'open');
  aiToggleBtn?.classList.add('active', 'open');
  aiToggleBtn?.setAttribute('aria-expanded', 'true');
  aiChatPanel?.setAttribute('aria-hidden', 'false');
  setTimeout(() => aiChatInput?.focus(), 200);
}

function closeAiChat() {
  aiChatPanel?.classList.remove('active', 'open');
  aiToggleBtn?.classList.remove('active', 'open');
  aiToggleBtn?.setAttribute('aria-expanded', 'false');
  aiChatPanel?.setAttribute('aria-hidden', 'true');
}

function toggleAiChat() {
  if (aiChatPanel?.classList.contains('active') || aiChatPanel?.classList.contains('open')) {
    closeAiChat();
  } else {
    openAiChat();
  }
}

aiToggleBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleAiChat();
});

aiChatClose?.addEventListener('click', (e) => {
  e.stopPropagation();
  closeAiChat();
});

// Close AI chat panel on outside click
document.addEventListener('click', (e) => {
  if (aiChatPanel?.classList.contains('active') || aiChatPanel?.classList.contains('open')) {
    if (!aiChatPanel.contains(e.target) && !aiToggleBtn?.contains(e.target)) {
      closeAiChat();
    }
  }
});

// Markdown parser helper for AI responses
function formatAiMarkdown(str) {
  if (!str) return '';
  let escaped = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Hyperlinks: [label](url)
  escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="ai-link">$1</a>');
  // Bold: **text**
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Bullet items
  escaped = escaped.replace(/^• (.*)$/gm, '<li class="ai-bullet">$1</li>');
  // Paragraph line breaks
  escaped = escaped.replace(/\n\n/g, '<p class="ai-para"></p>');
  escaped = escaped.replace(/\n/g, '<br />');
  return escaped;
}

function appendAiMessage(role, text) {
  if (!aiChatMessages) return;
  const msgEl = document.createElement('div');
  const roleClass = role === 'user' ? 'ai-msg-user' : 'ai-msg-bot';
  msgEl.className = `ai-msg ${roleClass}`;
  const formatted = role === 'user' 
    ? `<div class="ai-msg-bubble"><p>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p></div>`
    : `<div class="ai-msg-bubble">${formatAiMarkdown(text)}</div>`;
  msgEl.innerHTML = formatted;
  aiChatMessages.appendChild(msgEl);
  aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
}

function showAiTypingIndicator() {
  if (aiChatTyping) {
    aiChatTyping.classList.remove('is-hidden');
  }
  if (aiChatMessages) aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
}

function removeAiTypingIndicator() {
  if (aiChatTyping) {
    aiChatTyping.classList.add('is-hidden');
  }
}

// Smart offline/fallback responses
function getOfflineAiAnswer(q) {
  const query = q.toLowerCase();
  if (query.includes('project') || query.includes('build') || query.includes('work')) {
    return "Abhijeet has built notable projects including **Gravisphere** (real-time physics simulator), **AirWriting** (computer vision gesture drawing), and full-stack enterprise web apps. Explore the Projects section for live demos and GitHub source code!";
  }
  if (query.includes('skill') || query.includes('tech') || query.includes('stack')) {
    return "Abhijeet's core expertise spans **React, Next.js, Node.js, Python, TypeScript, Tailwind CSS, PostgreSQL, and Docker**, with a focus on high-performance interactive interfaces.";
  }
  if (query.includes('education') || query.includes('college') || query.includes('degree')) {
    return "Abhijeet is pursuing his **B.Tech in Computer Science & Engineering** at **ITER, SOA University**, focusing on Data Structures, Algorithms, and Distributed Systems.";
  }
  if (query.includes('contact') || query.includes('email') || query.includes('hire') || query.includes('reach')) {
    return "You can reach Abhijeet directly at **abhijeetmahakur1234@gmail.com** or send a message directly using the interactive contact form below!";
  }
  return "Thanks for asking! I'm Abhijeet's portfolio AI assistant. You can ask me about his software projects, technical skill stack, academic background, or how to get in touch.";
}

async function sendAiQuery(message) {
  const q = message.trim();
  if (!q) return;

  appendAiMessage('user', q);
  if (aiChatInput) aiChatInput.value = '';
  showAiTypingIndicator();

  try {
    let res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: q })
    });

    if (!res.ok && res.status !== 400) {
      res = await fetch('http://localhost:3001/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q })
      });
    }

    const data = await res.json();
    removeAiTypingIndicator();
    if (data.success && data.answer) {
      appendAiMessage('assistant', data.answer);
    } else {
      appendAiMessage('assistant', data.message || getOfflineAiAnswer(q));
    }
  } catch (err) {
    console.warn('AI Chat Network Fallback:', err);
    removeAiTypingIndicator();
    appendAiMessage('assistant', getOfflineAiAnswer(q));
  }
}

aiChatForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  if (aiChatInput && aiChatInput.value.trim()) {
    sendAiQuery(aiChatInput.value);
  }
});

function wireUpChips() {
  document.querySelectorAll('.ai-chip').forEach((chip) => {
    chip.onclick = () => {
      const prompt = chip.getAttribute('data-question') || chip.getAttribute('data-prompt');
      if (prompt) {
        sendAiQuery(prompt);
      }
    };
  });
}
wireUpChips();

aiChatReset?.addEventListener('click', () => {
  if (aiChatMessages) {
    aiChatMessages.innerHTML = `
      <div class="ai-msg ai-msg-bot">
        <div class="ai-msg-bubble">
          <p>👋 Hi! I'm <strong>Abhijeet's AI Assistant</strong>. Ask me anything about his projects, technical skills, education, or how to get in touch!</p>
        </div>
      </div>
      <div class="ai-quick-chips" id="ai-quick-chips">
        <button class="ai-chip" data-question="What featured projects has Abhijeet built?">Featured Projects</button>
        <button class="ai-chip" data-question="What is Abhijeet's technical stack?">Tech Stack</button>
        <button class="ai-chip" data-question="Where is Abhijeet studying?">Education</button>
        <button class="ai-chip" data-question="How can I contact Abhijeet?">Contact Info</button>
      </div>
    `;
    wireUpChips();
  }
});

// ==========================================================================
// Dark / Light Theme Manager
// ==========================================================================
function initTheme() {
  // Guarantee Dark Mode is strictly the default for everyone on every visit/reload
  try {
    localStorage.removeItem('portfolio-theme');
    sessionStorage.removeItem('portfolio-theme');
  } catch (e) {}

  document.documentElement.setAttribute('data-theme', 'dark');

  const toggleButtons = document.querySelectorAll('.theme-toggle-btn');
  toggleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
    });
  });
}

// ==========================================================================
// Certificate Upload Modal Manager (Theme-Consistent)
// ==========================================================================
function initCertificateUpload() {
  const modalOverlay = document.getElementById('cert-upload-modal-overlay');
  const openBtn = document.getElementById('btn-open-cert-modal');
  const closeBtn = document.getElementById('btn-close-cert-modal');
  const cancelBtn = document.getElementById('btn-cancel-cert-modal');
  const uploadForm = document.getElementById('portfolio-cert-upload-form');
  const dropzone = document.getElementById('cert-dropzone');
  const fileInput = document.getElementById('inp-cert-file');
  const emptyState = document.getElementById('dropzone-empty-state');
  const previewState = document.getElementById('dropzone-preview-state');
  const previewImg = document.getElementById('cert-preview-img');
  const previewName = document.getElementById('cert-preview-filename');
  const previewSize = document.getElementById('cert-preview-size');
  const removeFileBtn = document.getElementById('btn-remove-cert-file');
  const statusMsg = document.getElementById('cert-upload-status');
  const submitBtn = document.getElementById('btn-submit-cert-modal');

  let selectedFileData = null;
  let selectedFileName = null;

  function openModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.add('active');
    modalOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('active');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    resetForm();
  }

  function resetForm() {
    if (uploadForm) uploadForm.reset();
    selectedFileData = null;
    selectedFileName = null;
    if (fileInput) fileInput.value = '';
    if (emptyState) emptyState.classList.remove('is-hidden');
    if (previewState) previewState.classList.add('is-hidden');
    if (statusMsg) {
      statusMsg.textContent = '';
      statusMsg.className = 'cert-status-msg';
    }
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>📜 Publish to Portfolio Vault</span>';
    }
  }

  openBtn?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);

  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay?.classList.contains('active')) {
      closeModal();
    }
  });

  // Drag and drop events
  dropzone?.addEventListener('click', () => {
    fileInput?.click();
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone?.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone?.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone?.addEventListener('drop', (e) => {
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  });

  fileInput?.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  });

  function handleFileSelection(file) {
    if (!file) return;
    selectedFileName = file.name;
    const reader = new FileReader();

    reader.onload = () => {
      selectedFileData = reader.result;

      if (emptyState) emptyState.classList.add('is-hidden');
      if (previewState) previewState.classList.remove('is-hidden');
      if (previewName) previewName.textContent = file.name;
      if (previewSize) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        previewSize.textContent = `${sizeMb} MB`;
      }

      if (previewImg) {
        if (file.type.startsWith('image/')) {
          previewImg.src = reader.result;
          previewImg.style.display = 'block';
        } else {
          // Fallback SVG icon for PDF documents
          previewImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2338bdf8" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
          previewImg.style.display = 'block';
        }
      }
    };

    reader.readAsDataURL(file);
  }

  removeFileBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    selectedFileData = null;
    selectedFileName = null;
    if (fileInput) fileInput.value = '';
    if (emptyState) emptyState.classList.remove('is-hidden');
    if (previewState) previewState.classList.add('is-hidden');
  });

  uploadForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('inp-form-cert-title')?.value?.trim();
    const issuer = document.getElementById('inp-form-cert-issuer')?.value?.trim();
    const date = document.getElementById('inp-form-cert-date')?.value?.trim();
    const category = document.getElementById('inp-form-cert-cat')?.value?.trim();
    const verifyUrl = document.getElementById('inp-form-cert-url')?.value?.trim();
    const description = document.getElementById('inp-form-cert-desc')?.value?.trim();

    if (!title || !issuer) {
      if (statusMsg) {
        statusMsg.textContent = 'Please provide both Title and Issuer.';
        statusMsg.className = 'cert-status-msg error';
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Uploading & Publishing...</span>';
    }
    if (statusMsg) {
      statusMsg.textContent = 'Publishing credential to vault...';
      statusMsg.className = 'cert-status-msg';
    }

    const payload = {
      title,
      issuer,
      date: date || new Date().toISOString().split('T')[0],
      category: category || 'Computer Science',
      verifyUrl: verifyUrl || '',
      description: description || '',
      fileData: selectedFileData || '',
      fileName: selectedFileName || ''
    };

    try {
      let res = await fetch('/api/certificates/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        res = await fetch('http://localhost:3001/api/certificates/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (data.success && data.certificate) {
        if (statusMsg) {
          statusMsg.textContent = '✓ Certificate published live to portfolio!';
          statusMsg.className = 'cert-status-msg success';
        }

        // Hydrate dynamically right away
        if (window.cmsData) {
          if (!Array.isArray(window.cmsData.certificates)) window.cmsData.certificates = [];
          window.cmsData.certificates.unshift(data.certificate);
          if (window.hydratePortfolio) {
            window.hydratePortfolio(window.cmsData);
          }
        } else if (window.refreshPortfolio) {
          window.refreshPortfolio();
        }

        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        if (statusMsg) {
          statusMsg.textContent = `✕ ${data.message || 'Failed to publish certificate.'}`;
          statusMsg.className = 'cert-status-msg error';
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>📜 Publish to Portfolio Vault</span>';
        }
      }
    } catch (err) {
      console.error('Certificate upload error:', err);
      if (statusMsg) {
        statusMsg.textContent = '✕ Network error uploading certificate.';
        statusMsg.className = 'cert-status-msg error';
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>📜 Publish to Portfolio Vault</span>';
      }
    }
  });
}

// Initialization
initTheme();
initCertificateUpload();
window.addEventListener('resize', handleResize);
handleResize();
startProgressivePreload();
requestAnimationFrame(tick);
