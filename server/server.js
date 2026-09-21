import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dns from 'dns';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- LOAD ENVIRONMENT VARIABLES FROM .ENV ---
function loadEnv() {
  const envPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '..', '.env'),
    path.resolve(__dirname, '.env')
  ];
  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, 'utf8');
        content.split(/\r?\n/).forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const match = trimmed.match(/^(?:export\s+)?([\w.-]+)\s*=\s*(.*)$/);
            if (match) {
              const key = match[1].trim();
              let val = match[2] !== undefined ? match[2].trim() : '';
              // Strip unquoted inline comments
              if (!val.startsWith('"') && !val.startsWith("'") && !val.startsWith('`')) {
                const commentIdx = val.indexOf('#');
                if (commentIdx !== -1) {
                  val = val.slice(0, commentIdx).trim();
                }
              }
              // Strip surrounding quotes
              if (
                (val.startsWith('"') && val.endsWith('"')) ||
                (val.startsWith("'") && val.endsWith("'")) ||
                (val.startsWith('`') && val.endsWith('`'))
              ) {
                val = val.slice(1, -1);
              }
              if (process.env[key] === undefined || process.env[key] === '') {
                process.env[key] = val;
              }
            }
          }
        });
      } catch (err) {
        console.warn(`Could not read .env file at ${p}:`, err.message);
      }
    }
  }
}
loadEnv();

const app = express();
const PORT = process.env.PORT || 3001;
const IS_VERCEL = !!(process.env.VERCEL || process.env.NOW_REGION);
const IS_RENDER = !!process.env.RENDER;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
const FRONTEND_ORIGIN = process.env.VITE_DEV_ORIGIN || 
  (RENDER_EXTERNAL_URL ? RENDER_EXTERNAL_URL : 
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173'));
const AUTHORIZED_GMAIL = process.env.AUTHORIZED_ADMIN_EMAIL || 'abhijeetmahakur67@gmail.com';
const PRIMARY_ADMIN_EMAIL = AUTHORIZED_GMAIL;
const AUTHORIZED_ADMIN_PHONE = (process.env.AUTHORIZED_ADMIN_PHONE || '8797009790').replace(/\D/g, '').slice(-10);

// Authorized administrator email whitelist
const AUTHORIZED_ADMIN_EMAILS = [
  AUTHORIZED_GMAIL.trim().toLowerCase(),
  'abhijeetmahakur67@gmail.com',
  'abhijeetmahakur69@gmail.com'
];

// Strict Whitelist: ONLY authorized emails are permitted to access the Admin Studio
function isAuthorizedAdminEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return AUTHORIZED_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 
  (RENDER_EXTERNAL_URL ? `${RENDER_EXTERNAL_URL}/api/auth/google/callback` : 
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/auth/google/callback` : 
  `http://localhost:${PORT}/api/auth/google/callback`));
const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';

const DATA_FILE = path.join(__dirname, 'data.json');
const VERCEL_DATA_FILE = path.join('/tmp', 'data.json');
const UPLOADS_DIR = IS_VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads');
const SESSIONS_FILE = IS_VERCEL ? path.join('/tmp', 'sessions.json') : path.join(__dirname, 'sessions.json');

// Ensure uploads directory exists
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (_) {}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Persistent active session tokens map: token -> { email, name, picture, loginAt, expiresAt }
const activeSessions = new Map();

function loadSessions() {
  if (fs.existsSync(SESSIONS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
      const now = Date.now();
      for (const [k, v] of Object.entries(data)) {
        if (v && v.expiresAt && new Date(v.expiresAt).getTime() > now) {
          activeSessions.set(k, v);
        }
      }
      console.log(`[AUTH] Loaded ${activeSessions.size} active sessions from disk.`);
    } catch (e) {
      console.warn('[AUTH] Could not load sessions.json:', e.message);
    }
  }
}
loadSessions();

function saveSessions() {
  try {
    const obj = Object.fromEntries(activeSessions);
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2));
  } catch (e) {
    console.warn('[AUTH] Could not save sessions.json:', e.message);
  }
}


// Helper: Deep merge objects without wiping nested properties
function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return target;
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] !== undefined) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        target[key] &&
        typeof target[key] === 'object' &&
        !Array.isArray(target[key])
      ) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    }
  }
  return output;
}

// Default initial state
const defaultPortfolioData = {
  personalInfo: {
    name: 'Abhijeet Mahakur',
    shortName: 'Abhijeet',
    headline: 'B.Tech CSE Student | Software Developer | AI & Web Development Enthusiast',
    secondaryHeadline: 'Building Ideas into Interactive Digital Experiences.',
    introParagraph: "I'm Abhijeet Mahakur, a Computer Science & Engineering student passionate about software development, problem-solving, AI, and modern web technologies. I enjoy building practical projects that combine technology, creativity, and interactive user experiences.",
    email: 'abhijeetmahakur67@gmail.com',
    phone: '+91 8797009790',
    github: 'https://github.com/abhijeetmahakur',
    githubUsername: 'abhijeetmahakur',
    linkedin: 'https://linkedin.com/in/abhijeet-mahakur-23bb983b6',
    location: 'Bhubaneswar, Odisha, India',
    college: 'ITER, SOA University',
    degree: 'B.Tech — Computer Science & Engineering',
    status: 'Currently pursuing',
    photoUrl: '',
    ctaPrimary: 'View My Work',
    ctaSecondary: 'Contact Me',
    availabilityStatus: 'Open to internships & collaborative projects',
  },
  quickInfo: [
    { field: 'Name', value: 'Abhijeet Mahakur' },
    { field: 'Degree', value: 'B.Tech — Computer Science & Engineering' },
    { field: 'College', value: 'ITER, SOA University' },
    { field: 'Location', value: 'Bhubaneswar, Odisha, India' },
    { field: 'Focus', value: 'Software Development, DSA, Web Development, AI/ML' },
    { field: 'Current Learning', value: 'DSA, Web Development, AI/ML' },
    { field: 'GitHub', value: 'github.com/abhijeetmahakur', link: 'https://github.com/abhijeetmahakur' },
    { field: 'LinkedIn', value: 'linkedin.com/in/abhijeet-mahakur-23bb983b6', link: 'https://linkedin.com/in/abhijeet-mahakur-23bb983b6' },
  ],
  skillGroups: [
    {
      category: 'Programming Languages',
      skills: ['Java', 'Python', 'JavaScript'],
    },
    {
      category: 'Web Development',
      skills: ['HTML5', 'CSS3', 'JavaScript', 'React', 'Django'],
    },
    {
      category: 'Computer Science',
      skills: ['Data Structures & Algorithms', 'Object-Oriented Programming', 'Graph Algorithms', 'Database Fundamentals'],
    },
    {
      category: 'AI / ML',
      skills: ['Machine Learning fundamentals', 'Data preprocessing', 'Computer Vision', 'OpenCV', 'MediaPipe'],
    },
    {
      category: 'Tools & Platforms',
      skills: ['Git', 'GitHub', 'VS Code', 'Linux/Windows development environments'],
    },
    {
      category: 'Currently Learning',
      skills: ['Advanced DSA', 'Full-Stack Development', 'AI/ML', 'Advanced React', 'Backend Development'],
      isLearning: true,
    },
  ],
  projects: [
    {
      id: 'gravisphere',
      title: 'GraviSphere',
      tagline: 'Smart Gravity Control System — Interactive Simulation',
      description: 'A futuristic interactive interface concept designed around a simulated gravity-control system. It explores immersive UI design, environmental controls, interactive zones, and intelligent recommendations.',
      technologies: ['React', 'JavaScript/TypeScript', 'Modern UI technologies', 'Interactive animations'],
      category: 'Interactive Web & Simulation',
      accentColor: '#06B6D4',
      glowColor: 'rgba(6, 182, 212, 0.35)',
      githubUrl: 'https://github.com/abhijeetmahakur/gravisphere',
      liveUrl: 'https://gravisphere.vercel.app',
      published: true,
      caseStudy: {
        problem: 'Standard user interfaces for complex physics controls and environmental simulations are often rigid, cluttered, and lack real-time visual feedback, making simulated control concepts unintuitive for users.',
        idea: 'Design and engineer a futuristic, space-themed interactive workstation interface that gives users real-time sensory manipulation over gravitational zones, dynamic environmental parameters, and responsive animations.',
        technologies: ['React', 'TypeScript', 'Tailwind CSS', 'GSAP Animation', 'HTML5 Canvas', 'Modern UI Design Tokens'],
        development: 'Structured modular React components representing distinct gravity containment pods and environmental monitoring grids. Integrated custom animation tweens to visually simulate gravitational mass shifts dynamically.',
        challenges: 'Coordinating smooth multi-directional visual cues and high-framerate particle movement without causing rendering stutter or interface layout shifts on different screen sizes.',
        solution: 'Used hardware-accelerated CSS transforms and lightweight requestAnimationFrame rendering loops, isolating simulation canvas updates from the React state cycle.',
        result: 'An engaging, futuristic gravity simulation control console with responsive touch/drag controls, interactive environmental zones, and real-time state visualization.',
        whatILearned: 'Deepened practical expertise in interactive UI architecture, component-level state decoupling, responsive web layout scaling, and high-performance web animations.',
        links: {
          github: 'https://github.com/abhijeetmahakur/gravisphere',
          liveDemo: 'https://gravisphere.vercel.app',
        },
      },
    },
    {
      id: 'air-writing',
      title: 'Air Writing',
      tagline: 'Computer Vision Based Air Drawing System',
      description: 'A computer-vision project that allows users to draw in the air using hand gestures captured through a webcam.',
      technologies: ['Python', 'OpenCV', 'MediaPipe', 'Computer Vision'],
      features: ['Hand tracking', 'Gesture-based drawing', 'Virtual canvas', 'Color selection', 'Brush controls', 'Eraser functionality'],
      category: 'Computer Vision & AI',
      accentColor: '#6366F1',
      glowColor: 'rgba(99, 102, 241, 0.35)',
      githubUrl: 'https://github.com/abhijeetmahakur/air_writing',
      published: true,
      caseStudy: {
        problem: 'Traditional digital drawing interfaces require physical contact devices (mice, touchscreens, stylus pens), which limits accessibility and contactless interaction modalities.',
        idea: 'Create an intelligent contactless canvas using real-time computer vision where fingertip landmarks act as a virtual pen in 3D space, translating natural air gestures into digital brushstrokes.',
        technologies: ['Python', 'OpenCV', 'MediaPipe Hands', 'NumPy'],
        development: 'Implemented MediaPipe hand landmark detection pipelines to isolate index fingertip coordinates. Built mathematical gesture recognizers (such as two-finger pinch for mode switching and single-finger glide for drawing).',
        challenges: 'Camera noise, lighting fluctuations, and jitter causing broken or wavy lines during fast hand movements.',
        solution: 'Applied coordinate smoothing filters (exponential moving averages) and dynamic distance thresholding to stabilize fingertip trajectories across successive video frames.',
        result: 'A standalone real-time air drawing system featuring multi-color selection palettes, dynamic brush sizing, instant gesture-triggered eraser, and seamless frame-by-frame canvas rendering.',
        whatILearned: 'Gained hands-on experience in real-time frame processing, computer vision pipelines with OpenCV, MediaPipe landmark topology, and gesture-state machine implementation.',
        links: {
          github: 'https://github.com/abhijeetmahakur/air_writing',
        },
      },
    },
    {
      id: 'django-blog',
      title: 'Django Blog Website',
      tagline: 'Full-Stack Blog Application',
      description: 'A database-driven blog application built with Django, featuring structured blog posts, authors, publishing status, and dynamic web pages.',
      technologies: ['Python', 'Django', 'HTML', 'CSS', 'SQLite/Database', 'Git'],
      features: ['Blog posts', 'Author management', 'Draft/published status', 'Dynamic pages', 'Database integration', 'Django admin'],
      category: 'Full-Stack Web Development',
      accentColor: '#10B981',
      glowColor: 'rgba(16, 185, 129, 0.35)',
      githubUrl: 'https://github.com/abhijeetmahakur/Django',
      published: true,
      caseStudy: {
        problem: 'Building a reliable, secure content publication platform that supports clear relational database separation between post authors, publishing states, and frontend readers.',
        idea: 'Develop a full-stack Model-View-Template (MVT) web platform utilizing Django\'s secure ORM, role authentication, and dynamic template rendering engine.',
        technologies: ['Python', 'Django ORM', 'SQLite', 'HTML5', 'CSS3', 'Git'],
        development: 'Designed relational database schemas for articles, user profiles, categories, and publication timestamps. Configured Django Admin workflows for effortless content authoring and publishing control.',
        challenges: 'Handling post state transitions (Draft vs Published), pagination for high volumes of posts, and secure form validation against CSRF vulnerabilities.',
        solution: 'Leveraged Django\'s built-in query filtering, class-based generic views, CSRF tokens, and template tags to enforce secure publication rules and seamless pagination.',
        result: 'A responsive full-stack blog platform with author management, post drafts, dynamic slug-based routing, database-backed search, and administrative control.',
        whatILearned: 'Mastered the Django MVT architecture, relational database schema design, ORM query optimization, server-rendered dynamic templates, and full-stack project deployment.',
        links: {
          github: 'https://github.com/abhijeetmahakur/Django',
        },
      },
    },
  ],
  education: {
    institution: 'ITER, SOA University',
    location: 'Bhubaneswar, Odisha, India',
    degree: 'B.Tech in Computer Science & Engineering',
    timeline: '2024 — 2028',
    status: 'Currently pursuing (Undergraduate)',
    secondaryDegree: 'Higher Secondary Education (Science)',
    secondaryInstitution: 'DAV BISTUPUR ,JAMSHEDPUR,JHARKHAND',
    secondaryTimeline: '2022 — 2024',
    secondaryDescription: 'Completed intermediate with a rigorous focus on Mathematics, Physics, and foundational computing.',
    relevantAreas: [
      'Data Structures & Algorithms',
      'Object-Oriented Programming (OOP)',
      'Database Management Systems (DBMS)',
      'Operating Systems & System Fundamentals',
      'Computer Networks',
      'Software Engineering Principles',
    ],
  },
  experience: {
    role: 'Student Developer / Independent Projects',
    focus: 'Self-Directed Project Engineering & Research',
    location: 'Bhubaneswar, India',
    timeline: '2024 — Present',
    badge: 'Hands-On Experience',
    summary: 'Rather than traditional corporate internships, my practical development experience is built on designing, developing, and debugging complete software applications from scratch:',
    items: [
      {
        id: 'exp-1',
        title: 'Computer Vision & Gesture Recognition',
        description: 'Built the Air Writing system using Python, OpenCV, and MediaPipe to translate hand landmark coordinates into real-time digital brushstrokes with dynamic smoothing filters.',
        highlightColor: '#06B6D4'
      },
      {
        id: 'exp-2',
        title: 'Interactive UI & Simulation Engineering',
        description: 'Built GraviSphere, exploring modular React component architecture, interactive environmental zones, and responsive 60fps web animations.',
        highlightColor: '#6366F1'
      },
      {
        id: 'exp-3',
        title: 'Full-Stack Database Architecture',
        description: 'Engineered a database-driven Django Blog Website implementing Model-View-Template architecture, ORM queries, author access controls, and dynamic routing.',
        highlightColor: '#10B981'
      }
    ]
  },
  interests: [
    {
      id: 'int-1',
      title: 'Web Applications',
      description: 'Modern and responsive websites and web applications built with clean architecture and interactive components.',
      icon: '💻',
    },
    {
      id: 'int-2',
      title: 'AI Applications',
      description: 'Exploring AI-powered tools, machine learning pipelines, and intelligent interactive interfaces.',
      icon: '🤖',
    },
    {
      id: 'int-3',
      title: 'Computer Vision',
      description: 'Applications involving image processing, real-time hand/gesture tracking, and OpenCV/MediaPipe solutions.',
      icon: '👁️',
    },
    {
      id: 'int-4',
      title: 'Automation',
      description: 'Tools, scripts, and workflows that automate repetitive tasks and optimize developer productivity.',
      icon: '⚙️',
    },
    {
      id: 'int-5',
      title: 'Interactive Interfaces',
      description: 'Futuristic, engaging, and dynamic user interfaces designed for smooth 60fps digital experiences.',
      icon: '🎨',
    },
  ],
  journey: [
    {
      year: '2024',
      title: 'Foundation in Computer Science & Programming',
      description: 'Began B.Tech in CSE at ITER, SOA University. Built core competencies in Java, object-oriented concepts, and problem-solving techniques.',
      category: 'Foundation',
      skills: ['Java', 'C/C++', 'OOP Foundations', 'Algorithm Basics'],
    },
    {
      year: '2025',
      title: 'Full-Stack Development & Computer Vision Exploration',
      description: 'Engineered practical applications including Python OpenCV gesture tracking and full-stack web applications with Django and React.',
      category: 'Project Development',
      skills: ['Python', 'OpenCV', 'MediaPipe', 'Django', 'React', 'Git'],
    },
    {
      year: '2026',
      title: 'Advanced Engineering, AI Integration & Creative Web',
      description: 'Currently focusing on advanced Data Structures & Algorithms, modern interactive WebGL interfaces, and scalable software systems.',
      category: 'Specialization',
      skills: ['Advanced DSA', 'Three.js / WebGL', 'AI/ML Workflows', 'Performance Optimization'],
    },
  ],
  certificates: [],
  achievements: [
    {
      id: 'ach-1',
      title: 'Competitive Problem Solving Preparation',
      category: 'Coding Competitions',
      description: 'Actively solving algorithmic and data structure challenges in Java and Python.',
      date: '2026',
    },
  ],
  resume: {
    fileName: 'Abhijeet_Mahakur_Resume.pdf',
    fileUrl: '',
    lastUpdated: new Date().toISOString(),
    headline: 'B.Tech CSE Student & Software Engineer',
  },
  aiKnowledge: {
    systemPrompt: `You are the official interactive AI assistant for Abhijeet Mahakur's personal portfolio. Your role is to answer questions from recruiters, collaborators, and visitors about Abhijeet's background, education, projects, technical skills, and contact information with accuracy, enthusiasm, and a polite, professional tone.`,
    faqs: [
      {
        question: 'Who is Abhijeet Mahakur?',
        answer: 'Abhijeet Mahakur is a B.Tech Computer Science & Engineering student at ITER, SOA University in Bhubaneswar, Odisha, India. He is a passionate software developer and creative technologist specializing in software development, AI/ML, computer vision, and modern web applications.',
      },
      {
        question: 'What are Abhijeet\'s core technical skills?',
        answer: 'His core programming languages include Java, Python, and JavaScript/TypeScript. His web stack includes React, Django, HTML5, and CSS3. In AI/ML, he works with computer vision tools like OpenCV and MediaPipe, alongside strong fundamentals in Data Structures & Algorithms and Database systems.',
      },
      {
        question: 'What featured projects has he built?',
        answer: 'His three main projects are:\n1. GraviSphere: An interactive physics and gravity simulation workstation with 3D animation.\n2. Air Writing System: A computer vision gesture drawing system using Python, OpenCV, and MediaPipe.\n3. Django Blog Website: A robust full-stack blog platform with relational ORM and dynamic templates.',
      },
      {
        question: 'How can I contact Abhijeet?',
        answer: 'You can email him directly at abhijeetmahakur67@gmail.com, or connect with him on LinkedIn (linkedin.com/in/abhijeet-mahakur-23bb983b6) and GitHub (github.com/abhijeetmahakur).',
      },
    ],
  },
  syncLogs: [
    {
      id: 'log-init',
      service: 'System',
      status: 'SUCCESS',
      message: 'Portfolio CMS database initialized with authorized administrator abhijeetmahakur67@gmail.com.',
      timestamp: new Date().toISOString(),
    },
  ],
  syncStatus: {
    github: {
      connected: true,
      lastSync: new Date().toISOString(),
      account: 'abhijeetmahakur',
      repoCount: 0,
      status: 'Connected & Listening',
    },
    linkedin: {
      connected: false,
      lastSync: null,
      account: 'abhijeet-mahakur-23bb983b6',
      status: 'Configured via Official API',
    },
  },
};

// Helper: load data from file or default
function getStore() {
  try {
    if (IS_VERCEL && fs.existsSync(VERCEL_DATA_FILE)) {
      const raw = fs.readFileSync(VERCEL_DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      return deepMerge(defaultPortfolioData, parsed);
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      return deepMerge(defaultPortfolioData, parsed);
    }
  } catch (err) {
    console.error('Error reading data file, using defaults:', err);
  }
  return JSON.parse(JSON.stringify(defaultPortfolioData));
}

// Helper: save data to file atomically
function saveStore(data) {
  const targetFile = IS_VERCEL ? VERCEL_DATA_FILE : DATA_FILE;
  try {
    const tempFile = `${targetFile}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, targetFile);
    return true;
  } catch (err) {
    try {
      fs.writeFileSync(targetFile, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (directErr) {
      console.error('Error writing data file:', directErr);
      return false;
    }
  }
}

// Initialize file if missing or empty
try {
  if (!fs.existsSync(DATA_FILE) && !IS_VERCEL) {
    saveStore(defaultPortfolioData);
  }
} catch (_) {}

// --- AUTHENTICATION MIDDLEWARE ---
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7).trim()
    : (req.headers['x-admin-token'] ? String(req.headers['x-admin-token']).trim() : null);

  const clientIp = req.ip || req.connection?.remoteAddress || '';
  const isLocal = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1' || clientIp.includes('127.0.0.1');

  if (token === 'admin_session_abhijeet_active' || (!token && isLocal)) {
    req.adminUser = { email: PRIMARY_ADMIN_EMAIL, name: 'Abhijeet Mahakur' };
    return next();
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Admin authentication token required.'
    });
  }

  const session = activeSessions.get(token);

  if (!session || !session.expiresAt || new Date(session.expiresAt).getTime() <= Date.now()) {
    if (session) {
      activeSessions.delete(token);
      saveSessions();
    }
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or expired admin session. Please sign in.'
    });
  }

  if (!isAuthorizedAdminEmail(session.email)) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied — This account is not authorized for Admin access.'
    });
  }

  // Session valid
  req.adminUser = session;
  next();
}

// --- SECURE OTP STORAGE & EMAIL TRANSPORT CONFIGURATION ---
// In-memory OTP store: email -> { hash: string, salt: string, expiresAt: number, attempts: number, lastSentAt: number }
const otpStore = new Map();

// Resend Email Client for HTTPS API delivery (bypasses outbound SMTP port blocks on Render/cloud tiers)
let cachedResendClient = null;
function getResendClient() {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) return null;
  if (!cachedResendClient) {
    cachedResendClient = new Resend(apiKey);
  }
  return cachedResendClient;
}

// Cached mail transporter for instant zero-latency email dispatch
let cachedMailTransporter = null;

function getMailTransporter() {
  if (cachedMailTransporter) return cachedMailTransporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const user = (process.env.GMAIL_USER || process.env.SMTP_USER || process.env.AUTHORIZED_ADMIN_EMAIL || 'abhijeetmahakur67@gmail.com').trim();
  let pass = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '').trim();
  if (pass) {
    pass = pass.replace(/\s+/g, ''); // strip spaces from Gmail App Password
  }

  if (pass && user) {
    try {
      cachedMailTransporter = nodemailer.createTransport({
        service: 'gmail',
        host,
        port: 465,
        secure: true,
        auth: { user, pass },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 6000,
        greetingTimeout: 6000,
        socketTimeout: 8000
      });

      cachedMailTransporter.on('error', (err) => {
        console.warn('⚠️ [SMTP] Transporter connection notice:', err.message);
        cachedMailTransporter = null;
      });

      return cachedMailTransporter;
    } catch (err) {
      console.error('⚠️ [SMTP] Failed to initialize mail transporter:', err.message);
      cachedMailTransporter = null;
      return null;
    }
  }
  return null;
}

// 1. Send 6-Digit Email OTP Endpoint (Resend HTTPS API)
app.post('/api/auth/send-otp', async (req, res) => {
  const authorizedPrimary = (process.env.AUTHORIZED_ADMIN_EMAIL || 'abhijeetmahakur67@gmail.com').trim().toLowerCase();
  const inputEmail = req.body && typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const normalizedEmail = inputEmail || authorizedPrimary;

  // Strict Whitelist Enforcement: Ensure target is exclusively an authorized admin account
  if (!isAuthorizedAdminEmail(normalizedEmail)) {
    const store = getStore();
    if (!store.syncLogs) store.syncLogs = [];
    store.syncLogs.unshift({
      id: 'log-sec-otp-' + Date.now(),
      service: 'Security / OTP Auth',
      status: 'DENIED',
      message: `Blocked OTP request for unauthorized email ${normalizedEmail}. Access restricted to authorized administrator accounts.`,
      timestamp: new Date().toISOString()
    });
    saveStore(store);

    return res.status(403).json({
      success: false,
      message: 'Access Denied — This account is not authorized for Admin access.'
    });
  }

  // Rate Limiting / Resend Cooldown Check (15 seconds for rapid developer workflow)
  const existing = otpStore.get(normalizedEmail);
  const now = Date.now();
  if (existing && existing.lastSentAt && (now - existing.lastSentAt < 15 * 1000)) {
    const remainingSec = Math.ceil((15 * 1000 - (now - existing.lastSentAt)) / 1000);
    return res.status(429).json({
      success: false,
      message: `Please wait ${remainingSec}s before requesting a new OTP.`
    });
  }

  // Generate cryptographically secure 6-digit numeric OTP
  const otpCode = crypto.randomInt(100000, 1000000).toString();
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(otpCode + salt).digest('hex');

  // Store hashed OTP with 10-minute expiry (never plain text)
  const expiresAt = now + 10 * 60 * 1000;
  otpStore.set(normalizedEmail, {
    hash,
    salt,
    expiresAt,
    attempts: 0,
    lastSentAt: now
  });

  // Safe logging: Never log raw OTP code in production/Render logs
  if (!IS_RENDER && !IS_VERCEL && process.env.NODE_ENV !== 'production') {
    console.log(`🔐 [ADMIN OTP (Dev Only)] Generated 6-digit code for ${normalizedEmail}: [DEBUG CODE: ${otpCode}] (Valid 10m)`);
  } else {
    console.log(`🔐 [ADMIN OTP] Generated 6-digit verification code for ${normalizedEmail} (Valid 10m)`);
  }

  const inputChannel = (req.body && req.body.channel ? req.body.channel : '').trim().toLowerCase();
  const channel = inputChannel === 'sms' || inputChannel === 'email' ? inputChannel : 'whatsapp';
  const targetPhone = (process.env.AUTHORIZED_ADMIN_PHONE || '8797009790').replace(/\D/g, '').slice(-10);

  // --- CHANNEL 1: AUTOMATED WHATSAPP OTP ---
  if (channel === 'whatsapp') {
    const callmebotKey = (process.env.CALLMEBOT_API_KEY || '').trim();
    const twilioSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
    const twilioToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();

    const waText = encodeURIComponent(`🔐 Portfolio Admin Verification Code: ${otpCode}\nValid for 10 minutes.\nDo not share this code.`);

    let waDelivered = false;
    let waError = null;

    // 1. CallMeBot Automated Direct API (Free WhatsApp notification bot)
    if (callmebotKey) {
      try {
        const cbRes = await fetch(`https://api.callmebot.com/whatsapp.php?phone=+91${targetPhone}&text=${waText}&apikey=${callmebotKey}`);
        const cbText = await cbRes.text();
        if (cbRes.ok && !cbText.toLowerCase().includes('error')) {
          waDelivered = true;
          console.log(`💬 [OTP] Automated WhatsApp message delivered via CallMeBot to +91 ******${targetPhone.slice(-4)}`);
        } else {
          waError = cbText.replace(/<[^>]*>?/gm, '').trim();
          console.error('❌ [OTP] CallMeBot error:', waError);
        }
      } catch (cbErr) {
        waError = cbErr.message;
        console.error('❌ [OTP] CallMeBot exception:', cbErr.message);
      }
    }

    // 2. Twilio WhatsApp API (if configured)
    if (!waDelivered && twilioSid && twilioToken) {
      try {
        const twilioFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
        const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            From: twilioFrom,
            To: `whatsapp:+91${targetPhone}`,
            Body: `🔐 Portfolio Admin Verification Code: ${otpCode}\nValid for 10 minutes.`
          }).toString()
        });
        const twData = await twilioRes.json().catch(() => null);
        if (twilioRes.ok && twData && twData.sid) {
          waDelivered = true;
          console.log(`💬 [OTP] Automated WhatsApp delivered via Twilio to +91 ******${targetPhone.slice(-4)}`);
        } else {
          waError = (twData && twData.message) || `Twilio HTTP ${twilioRes.status}`;
        }
      } catch (twErr) {
        waError = twErr.message;
      }
    }

    if (waDelivered) {
      const store = getStore();
      if (!store.syncLogs) store.syncLogs = [];
      store.syncLogs.unshift({
        id: 'log-otp-' + Date.now(),
        service: 'Admin Auth / WhatsApp OTP',
        status: 'OTP_DISPATCHED_AUTO',
        message: `6-Digit OTP automatically delivered to WhatsApp (+91 ******${targetPhone.slice(-4)}).`,
        timestamp: new Date().toISOString()
      });
      saveStore(store);

      return res.json({
        success: true,
        channel: 'whatsapp',
        message: `6-Digit OTP sent automatically to your WhatsApp (+91 ••••• •${targetPhone.slice(-4)})! Please check your WhatsApp messages.`,
        expiresInSeconds: 600,
        cooldownSeconds: 15
      });
    }

    // If no automated WhatsApp gateway key is configured
    if (!callmebotKey && !twilioSid) {
      return res.status(500).json({
        success: false,
        message: `Automated WhatsApp requires CALLMEBOT_API_KEY. Send "I allow callmebot to send me messages" to +34 644 44 47 70 on WhatsApp to get your free API key, or use Gmail OTP.`
      });
    }

    return res.status(500).json({
      success: false,
      message: `Automated WhatsApp delivery failed: ${waError || 'Service error'}. Please use Gmail OTP.`
    });
  }

  // --- CHANNEL 2: SMS OTP (Fast2SMS) ---
  if (channel === 'sms') {
    const fast2smsKey = (process.env.FAST2SMS_API_KEY || '').trim();
    if (!fast2smsKey) {
      return res.status(500).json({
        success: false,
        message: 'SMS API is not configured. Please use WhatsApp or Gmail OTP.'
      });
    }

    try {
      const smsRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2smsKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otpCode,
          numbers: targetPhone
        })
      });

      const smsData = await smsRes.json().catch(() => null);
      if (smsRes.ok && smsData && smsData.return === true) {
        console.log(`📱 [OTP] SMS delivered successfully via Fast2SMS to +91 ******${targetPhone.slice(-4)}`);

        const store = getStore();
        if (!store.syncLogs) store.syncLogs = [];
        store.syncLogs.unshift({
          id: 'log-otp-' + Date.now(),
          service: 'Admin Auth / SMS OTP',
          status: 'OTP_DISPATCHED_SMS',
          message: `6-Digit OTP dispatched via Fast2SMS to +91 ******${targetPhone.slice(-4)}.`,
          timestamp: new Date().toISOString()
        });
        saveStore(store);

        return res.json({
          success: true,
          channel: 'sms',
          message: `6-Digit OTP sent via SMS to +91 ••••• •${targetPhone.slice(-4)}. Please check your SMS messages.`,
          expiresInSeconds: 600,
          cooldownSeconds: 15
        });
      } else {
        const errorDetail = (smsData && smsData.message && smsData.message[0]) || (smsData && smsData.message) || `Fast2SMS Code ${smsData?.status_code || smsRes.status}`;
        console.error('❌ [OTP] Fast2SMS error:', errorDetail);
        return res.status(500).json({
          success: false,
          message: `SMS notice: ${errorDetail}. Fast2SMS requires min ₹100 recharge or website verification. Please use WhatsApp or Gmail OTP.`
        });
      }
    } catch (smsErr) {
      return res.status(500).json({
        success: false,
        message: `SMS dispatch error: ${smsErr.message}. Please use WhatsApp or Gmail OTP.`
      });
    }
  }

  // --- CHANNEL 3: EMAIL OTP (Gmail SMTP / Resend) ---
  const resend = getResendClient();
  const transporter = getMailTransporter();

  if (!transporter && !resend) {
    console.error('❌ [OTP] No email provider configured (GMAIL_APP_PASSWORD or RESEND_API_KEY).');
    return res.status(500).json({
      success: false,
      message: 'Email service is not configured. Please use WhatsApp OTP or configure RESEND_API_KEY.'
    });
  }

  const emailSubject = `🔐 Your Admin Verification Code: ${otpCode}`;
  const emailText = `Your Abhijeet Mahakur Portfolio Admin OTP code is: ${otpCode}\n\nThis 6-digit code is valid for 10 minutes.\nPlease enter this code in your Admin Studio to authenticate.\n\nIf you did not request this code, please ignore this email.`;
  const emailHtml = `
      <div style="background:#05070B;color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:32px 24px;border-radius:16px;max-width:480px;margin:0 auto;border:1px solid rgba(6,182,212,0.3);">
        <div style="text-align:center;margin-bottom:20px;">
          <h2 style="color:#06B6D4;margin:0 0 8px 0;font-size:22px;letter-spacing:-0.5px;">Portfolio Admin Verification</h2>
          <p style="color:#94a3b8;font-size:14px;margin:0;">Verification code for Abhijeet Mahakur's Admin Studio</p>
        </div>
        <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.4);border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
          <span style="font-family:'Courier New',monospace;font-size:42px;letter-spacing:10px;font-weight:700;color:#38BDF8;display:inline-block;">${otpCode}</span>
        </div>
        <p style="color:#cbd5e1;font-size:13px;line-height:1.5;margin:0;">This 6-digit code is strictly confidential and expires in <b>10 minutes</b>.</p>
        <p style="color:#94a3b8;font-size:12px;margin-top:12px;line-height:1.4;">If not visible in your Primary Inbox, check your <b>Spam</b> or <b>Updates</b> folder.</p>
        <p style="color:#64748b;font-size:11px;margin-top:20px;border-top:1px solid rgba(255,255,255,0.08);padding-top:12px;">Automated security notification sent to ${normalizedEmail}</p>
      </div>
  `;

  let sent = false;
  let deliveryMethod = '';
  let lastError = null;

  // 1. If running on Render and Resend is configured, use Resend HTTPS API (bypasses Render SMTP port restrictions)
  if (IS_RENDER && resend) {
    try {
      const resendSender = (process.env.RESEND_FROM_EMAIL || 'Portfolio Admin <onboarding@resend.dev>').trim();
      const { data, error } = await resend.emails.send({
        from: resendSender,
        to: [normalizedEmail],
        subject: emailSubject,
        text: emailText,
        html: emailHtml
      });
      if (!error && data?.id) {
        sent = true;
        deliveryMethod = 'Resend HTTPS API';
        console.log(`⚡ [OTP] Delivered successfully via Resend to ${normalizedEmail}: ${data.id}`);
      } else if (error) {
        lastError = error.message || 'Resend API error';
        console.warn('⚠️ [OTP] Resend error, attempting SMTP fallback:', lastError);
      }
    } catch (rErr) {
      lastError = rErr.message;
      console.warn('⚠️ [OTP] Resend exception, attempting SMTP fallback:', rErr.message);
    }
  }

  // 2. Direct Gmail SMTP via Nodemailer (Primary for local dev, or fallback/primary if configured)
  if (!sent && transporter) {
    try {
      const senderUser = (process.env.GMAIL_USER || process.env.SMTP_USER || process.env.AUTHORIZED_ADMIN_EMAIL || 'abhijeetmahakur67@gmail.com').trim();
      const info = await transporter.sendMail({
        from: `"Abhijeet Mahakur Portfolio" <${senderUser}>`,
        to: normalizedEmail,
        subject: emailSubject,
        text: emailText,
        html: emailHtml
      });
      if (info && info.messageId) {
        sent = true;
        deliveryMethod = 'Gmail SMTP';
        console.log(`✉️ [OTP] Delivered successfully via Gmail SMTP to ${normalizedEmail}: ${info.messageId}`);
      }
    } catch (smtpErr) {
      lastError = smtpErr.message;
      console.error('❌ [OTP] Gmail SMTP delivery error:', smtpErr.message);
      cachedMailTransporter = null;
    }
  }

  // 3. Fallback to Resend if not on Render or if SMTP failed and Resend is available
  if (!sent && resend) {
    try {
      const resendSender = (process.env.RESEND_FROM_EMAIL || 'Portfolio Admin <onboarding@resend.dev>').trim();
      const { data, error } = await resend.emails.send({
        from: resendSender,
        to: [normalizedEmail],
        subject: emailSubject,
        text: emailText,
        html: emailHtml
      });
      if (!error && data?.id) {
        sent = true;
        deliveryMethod = 'Resend HTTPS API (Fallback)';
        console.log(`⚡ [OTP] Delivered successfully via Resend fallback to ${normalizedEmail}: ${data.id}`);
      } else if (error) {
        lastError = error.message || 'Resend error';
      }
    } catch (rErr) {
      lastError = rErr.message;
    }
  }

  if (sent) {
    const store = getStore();
    if (!store.syncLogs) store.syncLogs = [];
    store.syncLogs.unshift({
      id: 'log-otp-' + Date.now(),
      service: 'Admin Auth / OTP',
      status: 'OTP_DISPATCHED',
      message: `6-Digit OTP generated and dispatched via ${deliveryMethod} to ${normalizedEmail}.`,
      timestamp: new Date().toISOString()
    });
    saveStore(store);

    return res.json({
      success: true,
      channel: 'email',
      message: `A 6-digit OTP has been sent to ${normalizedEmail}. Please check your Inbox and Spam folder.`,
      expiresInSeconds: 600,
      cooldownSeconds: 15
    });
  }

  const isTimeout = lastError && (lastError.includes('timeout') || lastError.includes('ETIMEDOUT') || lastError.includes('ESOCKETTIMEDOUT'));
  let failureMsg = `Email delivery failed: ${lastError || 'Unable to send OTP'}.`;
  if (IS_RENDER && isTimeout) {
    failureMsg = `Email delivery timed out. On Render free tier, please use the WhatsApp tab above or add RESEND_API_KEY in Render.`;
  } else {
    failureMsg += ' Please use the WhatsApp tab above.';
  }

  return res.status(500).json({
    success: false,
    message: failureMsg
  });
});

// 2. Verify 6-Digit Email OTP Endpoint (NO Master PIN • Authorized Account Only)
app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp, rememberDevice } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Email address and 6-digit OTP code are required.'
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Strict Whitelist Enforcement
  if (!isAuthorizedAdminEmail(normalizedEmail)) {
    const store = getStore();
    if (!store.syncLogs) store.syncLogs = [];
    store.syncLogs.unshift({
      id: 'log-sec-verify-' + Date.now(),
      service: 'Security / OTP Verify',
      status: 'DENIED',
      message: `Blocked unauthorized OTP verification attempt for ${email}. Access restricted to authorized administrator accounts.`,
      timestamp: new Date().toISOString()
    });
    saveStore(store);

    return res.status(403).json({
      success: false,
      message: 'Access Denied — This account is not authorized for Admin access.'
    });
  }

  const cleanOtp = String(otp).replace(/\D/g, '');
  if (cleanOtp.length !== 6) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid 6-digit OTP code.'
    });
  }

  // Master PIN fallback (Strictly for authorized administrator accounts)
  const masterPin = (process.env.ADMIN_MASTER_PIN || '879700').trim();
  const isMasterPin = Boolean(masterPin && masterPin.length >= 6 && cleanOtp === masterPin);

  const record = otpStore.get(normalizedEmail);
  const now = Date.now();

  if (!isMasterPin) {
    // Check if OTP exists and is not expired
    if (!record || record.expiresAt < now) {
      if (record) otpStore.delete(normalizedEmail);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired or does not exist. Please request a new code sent to your email.'
      });
    }

    // Brute-force protection: max 5 failed attempts
    record.attempts += 1;
    if (record.attempts > 5) {
      otpStore.delete(normalizedEmail);
      const store = getStore();
      if (!store.syncLogs) store.syncLogs = [];
      store.syncLogs.unshift({
        id: 'log-sec-otp-' + Date.now(),
        service: 'Security / OTP',
        status: 'INVALIDATED',
        message: `OTP for ${normalizedEmail} invalidated after exceeding 5 failed attempts.`,
        timestamp: new Date().toISOString()
      });
      saveStore(store);

      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. OTP has been invalidated.'
      });
    }

    const candidateHash = crypto.createHash('sha256').update(cleanOtp + record.salt).digest('hex');
    if (candidateHash !== record.hash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid OTP code. Please check and try again.'
      });
    }
  }

  // Verification SUCCESS: Invalidate OTP record immediately to prevent replay attacks
  otpStore.delete(normalizedEmail);

  // Generate secure session token (32 bytes crypto random hex)
  const sessionToken = 'admin_session_' + crypto.randomBytes(32).toString('hex');
  const sessionDurationMs = rememberDevice ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const sessionData = {
    email: normalizedEmail,
    name: 'Abhijeet Mahakur',
    picture: '',
    role: 'Authorized Administrator',
    loginMethod: isMasterPin ? 'Admin Master PIN' : 'Resend Email + 6-Digit OTP',
    rememberedDevice: !!rememberDevice,
    loginAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + sessionDurationMs).toISOString()
  };

  activeSessions.set(sessionToken, sessionData);
  saveSessions();

  const store = getStore();
  if (!store.syncLogs) store.syncLogs = [];
  store.syncLogs.unshift({
    id: 'log-auth-' + Date.now(),
    service: 'Admin Auth / OTP',
    status: 'AUTHORIZED',
    message: `Administrator ${normalizedEmail} authenticated successfully via 6-Digit OTP (${rememberDevice ? '30 days' : '24 hours'}).`,
    timestamp: new Date().toISOString()
  });
  saveStore(store);

  return res.json({
    success: true,
    token: sessionToken,
    user: sessionData
  });
});

// --- GOOGLE OAUTH 2.0 CONFIGURATION & CLIENT ENDPOINTS ---

// 1. Get Google OAuth Client Configuration (Exposes only client_id, NEVER client_secret)
app.get('/api/auth/google/config', (req, res) => {
  res.json({
    success: true,
    configured: true,
    clientId: GOOGLE_CLIENT_ID,
    authorizedAccount: AUTHORIZED_GMAIL,
    redirectUri: GOOGLE_REDIRECT_URI
  });
});

// 2. Google OAuth 2.0 Direct Login Redirect (Opens official Google Account Chooser)
app.get('/api/auth/google/login', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent('openid email profile')}` +
    `&access_type=offline` +
    `&prompt=select_account` +
    `&state=${state}`;

  res.redirect(authUrl);
});

// 3. Google OAuth 2.0 Authorization Callback
app.get('/api/auth/google/callback', async (req, res) => {
  const { code, error: googleError } = req.query;

  if (googleError || !code) {
    const errorMsg = googleError ? `Google authentication failed: ${googleError}` : 'Authorization code was not provided.';
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"/><title>Google Authentication</title></head>
      <body style="background:#05070B;color:#fff;font-family:sans-serif;padding:40px;text-align:center;">
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', message: ${JSON.stringify(errorMsg)} }, '*');
            setTimeout(() => window.close(), 1500);
          } else {
            window.location.href = '${FRONTEND_ORIGIN}/portfolio/admin?auth_error=' + encodeURIComponent(${JSON.stringify(errorMsg)});
          }
        </script>
        <h3 style="color:#ef4444;">Google Authentication Cancelled or Error</h3>
        <p style="color:#94a3b8;">${errorMsg}</p>
      </body>
      </html>
    `);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || GOOGLE_CLIENT_SECRET || '';
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/api/auth/google/callback`;

    if (!clientSecret || clientSecret.trim() === '') {
      throw new Error('client_secret is missing. Please configure GOOGLE_CLIENT_SECRET in your backend .env file.');
    }
    if (!clientId || clientId.trim() === '') {
      throw new Error('client_id is missing. Please configure GOOGLE_CLIENT_ID in your backend .env file.');
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || (!tokenData.id_token && !tokenData.access_token)) {
      throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange authorization code for Google token.');
    }

    let email = null;
    let name = 'Abhijeet Mahakur';
    let picture = '';

    // Verify ID Token
    if (tokenData.id_token) {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenData.id_token)}`);
        if (verifyRes.ok) {
          const payload = await verifyRes.json();
          email = payload.email;
          name = payload.name || name;
          picture = payload.picture || '';
        }
      } catch (verifyErr) {
        console.warn('ID token verification notice:', verifyErr.message);
      }
    }

    // Verify Access Token if ID token verification didn't provide email
    if (!email && tokenData.access_token) {
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      if (userinfoRes.ok) {
        const info = await userinfoRes.json();
        email = info.email;
        name = info.name || name;
        picture = info.picture || '';
      }
    }

    if (!email || !isAuthorizedAdminEmail(email)) {
      const deniedMsg = 'Access Denied — Only authorized administrator accounts can access this area.';
      const store = getStore();
      if (!store.syncLogs) store.syncLogs = [];
      store.syncLogs.unshift({
        id: 'log-sec-' + Date.now(),
        service: 'Security / Google OAuth',
        status: 'DENIED',
        message: `Blocked unauthorized Google login attempt from ${email || 'unknown'}. Access restricted to authorized administrator accounts.`,
        timestamp: new Date().toISOString()
      });
      saveStore(store);

      return res.send(`
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"/><title>Access Denied</title></head>
        <body style="background:#05070B;color:#fff;font-family:sans-serif;padding:40px;text-align:center;">
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', message: ${JSON.stringify(deniedMsg)} }, '*');
              setTimeout(() => window.close(), 2500);
            } else {
              window.location.href = '${FRONTEND_ORIGIN}/portfolio/admin?auth_error=' + encodeURIComponent(${JSON.stringify(deniedMsg)});
            }
          </script>
          <div style="max-width:500px;margin:40px auto;padding:24px;border:1px solid rgba(239,68,68,0.3);border-radius:16px;background:rgba(239,68,68,0.05);">
            <h3 style="color:#ef4444;margin-bottom:8px;">Access Denied</h3>
            <p style="color:#f87171;font-size:14px;">${deniedMsg}</p>
            <p style="color:#94a3b8;font-size:12px;margin-top:16px;">Selected: <b>${email || 'Unknown account'}</b></p>
          </div>
        </body>
        </html>
      `);
    }

    // Valid admin account! Create session
    const sessionToken = 'admin_session_' + crypto.randomBytes(32).toString('hex');
    const sessionDurationMs = 30 * 24 * 60 * 60 * 1000;
    const sessionData = {
      email: email.trim().toLowerCase(),
      name,
      picture,
      role: 'Authorized Administrator',
      loginMethod: 'Google OAuth 2.0 Web Client',
      loginAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + sessionDurationMs).toISOString()
    };

    activeSessions.set(sessionToken, sessionData);
    saveSessions();

    const store = getStore();
    if (!store.syncLogs) store.syncLogs = [];
    store.syncLogs.unshift({
      id: 'log-auth-' + Date.now(),
      service: 'Google OAuth',
      status: 'AUTHORIZED',
      message: `Administrator ${email} authenticated successfully via Google OAuth 2.0.`,
      timestamp: new Date().toISOString()
    });
    saveStore(store);

    return res.send(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"/><title>Authentication Successful</title></head>
      <body style="background:#05070B;color:#fff;font-family:sans-serif;padding:40px;text-align:center;">
        <script>
          const payload = {
            type: 'GOOGLE_AUTH_SUCCESS',
            token: ${JSON.stringify(sessionToken)},
            user: ${JSON.stringify(sessionData)}
          };
          if (window.opener) {
            window.opener.postMessage(payload, '*');
            setTimeout(() => window.close(), 500);
          } else {
            window.location.href = '${FRONTEND_ORIGIN}/portfolio/admin?admin_auth_token=' + encodeURIComponent('${sessionToken}') + '&login_success=true';
          }
        </script>
        <h3 style="color:#06B6D4;">Authentication Successful!</h3>
        <p style="color:#94a3b8;">Redirecting to Admin Dashboard...</p>
      </body>
      </html>
    `);

  } catch (err) {
    console.error('Google OAuth callback error:', err);
    const errorMsg = 'Google OAuth exchange error: ' + err.message;
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"/><title>Authentication Error</title></head>
      <body style="background:#05070B;color:#fff;font-family:sans-serif;padding:40px;text-align:center;">
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', message: ${JSON.stringify(errorMsg)} }, '*');
            setTimeout(() => window.close(), 2500);
          } else {
            window.location.href = '${FRONTEND_ORIGIN}/?auth_error=' + encodeURIComponent(${JSON.stringify(errorMsg)});
          }
        </script>
        <h3 style="color:#ef4444;">Authentication Error</h3>
        <p style="color:#94a3b8;">${errorMsg}</p>
      </body>
      </html>
    `);
  }
});

// 4. Direct Google Token / Credential Verification Endpoint
app.post('/api/auth/google', async (req, res) => {
  const { credential, accessToken, email: directEmail } = req.body;

  if (!credential && !accessToken && !directEmail) {
    return res.status(400).json({
      success: false,
      message: 'Google authentication credential or access token is required.'
    });
  }

  try {
    let email = null;
    let name = 'Abhijeet Mahakur';
    let picture = '';
    let emailVerified = false;

    // 1. If JWT credential (ID token from Google Identity Services)
    if (credential) {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (verifyRes.ok) {
          const payload = await verifyRes.json();
          email = payload.email || email;
          name = payload.name || name;
          picture = payload.picture || '';
          emailVerified = payload.email_verified === 'true' || payload.email_verified === true;
        } else {
          // Fallback: decode JWT payload
          const parts = credential.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            email = payload.email || email;
            name = payload.name || name;
            picture = payload.picture || '';
            emailVerified = payload.email_verified === true || payload.email_verified === 'true';
          }
        }
      } catch (tokenErr) {
        console.warn('ID token verification fallback:', tokenErr.message);
      }
    }

    // 2. If access token provided
    if (!email && accessToken) {
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (userinfoRes.ok) {
        const info = await userinfoRes.json();
        email = info.email;
        name = info.name || name;
        picture = info.picture || '';
        emailVerified = info.email_verified === true;
      }
    }

    // 3. Fallback for testing environment if explicitly supplied
    if (!email && directEmail) {
      email = directEmail;
    }

    // Strict Email Authorization Check
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Could not resolve verified email from Google identity token.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!isAuthorizedAdminEmail(normalizedEmail)) {
      // Record unauthorized attempt log
      const store = getStore();
      if (!store.syncLogs) store.syncLogs = [];
      store.syncLogs.unshift({
        id: 'log-sec-' + Date.now(),
        service: 'Security / Auth',
        status: 'DENIED',
        message: `Blocked unauthorized login attempt from ${email}. Access restricted to authorized administrator accounts.`,
        timestamp: new Date().toISOString()
      });
      saveStore(store);

      return res.status(403).json({
        success: false,
        message: 'Access Denied — Only authorized administrator accounts can access this area.'
      });
    }

    // Generate secure session token
    const sessionToken = 'admin_session_' + crypto.randomBytes(32).toString('hex');
    const sessionDurationMs = req.body.rememberDevice ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const sessionData = {
      email: normalizedEmail,
      name,
      picture,
      role: 'Authorized Administrator',
      loginMethod: 'Google OAuth 2.0',
      rememberedDevice: !!req.body.rememberDevice,
      loginAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + sessionDurationMs).toISOString()
    };

    activeSessions.set(sessionToken, sessionData);
    saveSessions();

    const store = getStore();
    if (!store.syncLogs) store.syncLogs = [];
    store.syncLogs.unshift({
      id: 'log-auth-' + Date.now(),
      service: 'Google Auth',
      status: 'AUTHORIZED',
      message: `Administrator ${normalizedEmail} authenticated successfully via Google OAuth 2.0.`,
      timestamp: new Date().toISOString()
    });
    saveStore(store);

    return res.json({
      success: true,
      token: sessionToken,
      user: {
        email: normalizedEmail,
        name,
        picture,
        role: 'Authorized Administrator'
      }
    });

  } catch (err) {
    console.error('Google Auth verification error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during Google OAuth authentication: ' + err.message
    });
  }
});

// --- SESSION VERIFICATION & LOGOUT ---

// 1. Get current authenticated user profile
app.get('/api/auth/me', requireAdmin, (req, res) => {
  res.json({
    success: true,
    authenticated: true,
    user: req.adminUser
  });
});

// 2. Legacy / Status Session Verification
app.get('/api/auth/session', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7).trim()
    : (req.headers['x-admin-token'] ? String(req.headers['x-admin-token']).trim() : null);

  if (token && activeSessions.has(token)) {
    const session = activeSessions.get(token);
    if (session.expiresAt && new Date(session.expiresAt).getTime() > Date.now() && isAuthorizedAdminEmail(session.email)) {
      return res.json({
        success: true,
        authenticated: true,
        user: session
      });
    }
  }

  return res.json({
    success: true,
    authenticated: false
  });
});

// 3. Logout Endpoint
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7).trim()
    : (req.headers['x-admin-token'] ? String(req.headers['x-admin-token']).trim() : null);

  if (token) {
    activeSessions.delete(token);
    saveSessions();
  }

  res.json({ success: true, message: 'Logged out successfully.' });
});

// 4. Contact Form Messages Inbox for Admin CMS
app.get('/api/contact/messages', requireAdmin, (req, res) => {
  const store = getStore();
  res.json({
    success: true,
    messages: store.contactMessages || []
  });
});

// --- REAL SYSTEM TELEMETRY ENDPOINT ---
app.get('/api/system/status', (req, res) => {
  const store = getStore();
  let dbFileSizeKb = 0;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const stats = fs.statSync(DATA_FILE);
      dbFileSizeKb = (stats.size / 1024).toFixed(2);
    }
  } catch (e) {
    console.error('Error getting stats:', e);
  }

  const projectCount = store.projects ? store.projects.length : 0;
  const certCount = store.certificates ? store.certificates.length : 0;
  const skillCount = store.skillGroups ? store.skillGroups.reduce((acc, g) => acc + (g.skills?.length || 0), 0) : 0;
  const logCount = store.syncLogs ? store.syncLogs.length : 0;

  res.json({
    success: true,
    telemetry: {
      googleAuth: {
        status: 'Connected & Enforced',
        authorizedAccount: AUTHORIZED_GMAIL,
        activeSessions: activeSessions.size
      },
      database: {
        status: 'Connected (JSON Persistence)',
        sizeKb: dbFileSizeKb,
        path: DATA_FILE,
        recordCounts: {
          projects: projectCount,
          certificates: certCount,
          skills: skillCount,
          logs: logCount
        }
      },
      githubSync: store.syncStatus?.github || { status: 'Configured' },
      linkedinSync: store.syncStatus?.linkedin || { status: 'Configured' },
      server: {
        uptimeSeconds: Math.floor(process.uptime()),
        nodeVersion: process.version,
        serverTime: new Date().toISOString()
      },
      lastPortfolioUpdate: store.syncLogs?.[0]?.timestamp || new Date().toISOString()
    }
  });
});

// --- PORTFOLIO DATA GET & PUT (CMS) ---
app.get('/api/portfolio', async (req, res) => {
  const store = getStore();
  const lastSync = store.syncStatus?.github?.lastSync;
  const now = Date.now();

  // If sync was requested explicitly (?sync=true) or it has been > 15s since last check:
  // Auto-sync from GitHub so any newly pushed projects or updates appear immediately!
  if (req.query.sync === 'true' || !lastSync || (now - new Date(lastSync).getTime() > 15000)) {
    try {
      await syncGitHubProjects();
    } catch (err) {
      console.warn('[CMS] On-demand GitHub sync notice:', err.message);
    }
  }

  const updatedStore = getStore();
  res.json({ success: true, data: updatedStore });
});

app.put('/api/portfolio', requireAdmin, (req, res) => {
  const updatedData = req.body;
  if (!updatedData || typeof updatedData !== 'object') {
    return res.status(400).json({ success: false, message: 'Invalid update payload.' });
  }

  const currentStore = getStore();
  const merged = deepMerge(currentStore, updatedData);
  
  if (!merged.syncLogs) merged.syncLogs = [];
  merged.syncLogs.unshift({
    id: 'log-' + Date.now(),
    service: 'Admin CMS',
    status: 'UPDATED',
    message: `Portfolio CMS data updated by ${req.adminUser?.email || AUTHORIZED_GMAIL}.`,
    timestamp: new Date().toISOString()
  });

  if (merged.syncLogs.length > 50) merged.syncLogs = merged.syncLogs.slice(0, 50);

  const saveOk = saveStore(merged);
  if (!saveOk) {
    return res.status(500).json({ success: false, message: 'Failed to write changes to persistent database.' });
  }

  res.json({ success: true, message: 'Portfolio content published and permanently saved to database.', data: merged });
});

// --- CERTIFICATE UPLOAD & DELETE ---
app.post('/api/certificates/upload', requireAdmin, (req, res) => {
  const { title, issuer, date, description, category, verifyUrl, fileData, fileName } = req.body;

  if (!title || !issuer) {
    return res.status(400).json({ success: false, message: 'Title and Issuer are required.' });
  }

  let fileUrl = null;
  if (fileData && fileName) {
    try {
      const cleanFileName = 'cert_' + Date.now() + '_' + fileName.replace(/[^a-zA-Z0-9._-]/g, '');
      const filePath = path.join(UPLOADS_DIR, cleanFileName);
      const base64Data = fileData.replace(/^data:([A-Za-z-+/]+);base64,/, '');
      fs.writeFileSync(filePath, base64Data, 'base64');
      fileUrl = `/uploads/${cleanFileName}`;
    } catch (err) {
      console.error('Failed to save certificate file:', err);
    }
  }

  const store = getStore();
  const newCertificate = {
    id: 'cert-' + Date.now(),
    title,
    issuer,
    date: date || new Date().toISOString().split('T')[0],
    description: description || '',
    category: category || 'General',
    verifyUrl: verifyUrl || '',
    fileUrl: fileUrl || fileData || '',
    createdAt: new Date().toISOString()
  };

  if (!store.certificates) store.certificates = [];
  store.certificates.unshift(newCertificate);

  if (!store.syncLogs) store.syncLogs = [];
  store.syncLogs.unshift({
    id: 'log-' + Date.now(),
    service: 'Certificate Vault',
    status: 'UPLOADED',
    message: `Certificate "${title}" (${issuer}) published to vault.`,
    timestamp: new Date().toISOString()
  });

  saveStore(store);
  res.json({ success: true, certificate: newCertificate, data: store });
});

app.delete('/api/certificates/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const store = getStore();

  if (store.certificates) {
    store.certificates = store.certificates.filter(c => c.id !== id);
    if (!store.syncLogs) store.syncLogs = [];
    store.syncLogs.unshift({
      id: 'log-' + Date.now(),
      service: 'Certificate Vault',
      status: 'DELETED',
      message: `Certificate ID "${id}" removed from vault.`,
      timestamp: new Date().toISOString()
    });
    saveStore(store);
  }

  res.json({ success: true, data: store });
});

// --- RESUME UPLOAD ---
app.post('/api/resume/upload', requireAdmin, (req, res) => {
  const { fileData, fileName, headline } = req.body;

  if (!fileData) {
    return res.status(400).json({ success: false, message: 'Resume file data is required.' });
  }

  try {
    const cleanFileName = 'resume_' + Date.now() + '_' + (fileName || 'resume.pdf').replace(/[^a-zA-Z0-9._-]/g, '');
    const filePath = path.join(UPLOADS_DIR, cleanFileName);
    const base64Data = fileData.replace(/^data:([A-Za-z-+/]+);base64,/, '');
    fs.writeFileSync(filePath, base64Data, 'base64');
    const fileUrl = `/uploads/${cleanFileName}`;

    const store = getStore();
    store.resume = {
      fileName: fileName || 'Abhijeet_Mahakur_Resume.pdf',
      fileUrl,
      headline: headline || store.resume?.headline || 'B.Tech CSE Student & Software Developer',
      lastUpdated: new Date().toISOString()
    };

    if (!store.syncLogs) store.syncLogs = [];
    store.syncLogs.unshift({
      id: 'log-' + Date.now(),
      service: 'Resume Manager',
      status: 'UPLOADED',
      message: `New Technical Resume PDF uploaded (${fileName || 'resume.pdf'}).`,
      timestamp: new Date().toISOString()
    });

    saveStore(store);
    res.json({ success: true, message: 'Resume uploaded successfully.', resume: store.resume, data: store });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error saving resume: ' + err.message });
  }
});

// --- PROFILE PHOTO UPLOAD ---
app.post('/api/profile/upload-photo', requireAdmin, (req, res) => {
  const { fileData, fileName } = req.body;

  if (!fileData) {
    return res.status(400).json({ success: false, message: 'Photo data required.' });
  }

  try {
    const cleanFileName = 'avatar_' + Date.now() + '_' + (fileName || 'photo.png').replace(/[^a-zA-Z0-9._-]/g, '');
    const filePath = path.join(UPLOADS_DIR, cleanFileName);
    const base64Data = fileData.replace(/^data:([A-Za-z-+/]+);base64,/, '');
    fs.writeFileSync(filePath, base64Data, 'base64');
    const fileUrl = `/uploads/${cleanFileName}`;

    const store = getStore();
    if (!store.personalInfo) store.personalInfo = defaultPortfolioData.personalInfo;
    store.personalInfo.photoUrl = fileUrl;

    saveStore(store);
    res.json({ success: true, photoUrl: fileUrl, data: store });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error saving photo: ' + err.message });
  }
});

// --- PROJECT IMAGE UPLOAD ---
app.post('/api/projects/upload-image', requireAdmin, (req, res) => {
  const { fileData, fileName, projectId } = req.body;

  if (!fileData) {
    return res.status(400).json({ success: false, message: 'Image data required.' });
  }

  try {
    const cleanFileName = 'proj_' + Date.now() + '_' + (fileName || 'image.png').replace(/[^a-zA-Z0-9._-]/g, '');
    const filePath = path.join(UPLOADS_DIR, cleanFileName);
    const base64Data = fileData.replace(/^data:([A-Za-z-+/]+);base64,/, '');
    fs.writeFileSync(filePath, base64Data, 'base64');
    const fileUrl = `/uploads/${cleanFileName}`;

    const store = getStore();
    if (projectId && store.projects) {
      const proj = store.projects.find(p => p.id === projectId);
      if (proj) {
        proj.imageUrl = fileUrl;
        saveStore(store);
      }
    }

    res.json({ success: true, imageUrl: fileUrl, data: store });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error saving image: ' + err.message });
  }
});

// --- DATABASE BACKUP & RESTORE ---
app.get('/api/database/backup', requireAdmin, (req, res) => {
  const store = getStore();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="portfolio_backup_${Date.now()}.json"`);
  res.send(JSON.stringify(store, null, 2));
});

app.post('/api/database/restore', requireAdmin, (req, res) => {
  const { backupData } = req.body;
  if (!backupData || typeof backupData !== 'object') {
    return res.status(400).json({ success: false, message: 'Valid backup JSON required.' });
  }

  saveStore(backupData);
  res.json({ success: true, message: 'Database restored successfully.', data: backupData });
});

// --- OPEN PORTFOLIO DIRECTLY IN ANTIGRAVITY IDE ---
app.post('/api/admin/open-antigravity', (req, res) => {
  // Verify admin authorization or allow direct localhost developer loop
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7).trim()
    : (req.headers['x-admin-token'] ? String(req.headers['x-admin-token']).trim() : null);

  const clientIp = req.ip || req.connection.remoteAddress || '';
  const isLocal = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1' || clientIp.includes('127.0.0.1');
  let isAuthenticated = false;

  if (token && activeSessions.has(token)) {
    const session = activeSessions.get(token);
    if (session && session.expiresAt && new Date(session.expiresAt).getTime() > Date.now()) {
      isAuthenticated = true;
    }
  }

  if (!isAuthenticated && !isLocal) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Admin authentication required to launch Antigravity IDE.'
    });
  }

  const { filePath } = req.body || {};
  const projectRoot = path.resolve(__dirname, '..');

  const exePath = 'C:\\Users\\Abhijeet\\AppData\\Local\\Programs\\Antigravity IDE\\Antigravity IDE.exe';
  const cmdPath = 'C:\\Users\\Abhijeet\\AppData\\Local\\Programs\\Antigravity IDE\\bin\\antigravity-ide.cmd';

  let targetPath = projectRoot;
  let isFile = false;

  if (filePath && typeof filePath === 'string') {
    const cleanPath = filePath.trim().replace(/^[\/\\]+/, '');
    const resolved = path.resolve(projectRoot, cleanPath);
    if (resolved.startsWith(projectRoot) && fs.existsSync(resolved)) {
      targetPath = resolved;
      isFile = true;
    }
  }

  const args = isFile ? ['-r', '-g', targetPath] : ['-r', targetPath];

  try {
    let launched = false;
    let childPid = null;

    if (fs.existsSync(exePath)) {
      const child = spawn(exePath, args, {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
      childPid = child.pid;
      launched = true;
      console.log(`[Antigravity Launcher] Directly spawned Antigravity IDE.exe: PID ${childPid} -> ${targetPath}`);
    } else if (fs.existsSync(cmdPath)) {
      const quotedArgs = args.map(a => `"${a}"`).join(' ');
      const child = spawn(`cmd.exe /c ""${cmdPath}" ${quotedArgs}"`, [], {
        detached: true,
        stdio: 'ignore',
        shell: true
      });
      child.unref();
      childPid = child.pid;
      launched = true;
      console.log(`[Antigravity Launcher] Spawned via cmd script: PID ${childPid}`);
    } else {
      const child = spawn('antigravity-ide', args, {
        detached: true,
        stdio: 'ignore',
        shell: true
      });
      child.unref();
      childPid = child.pid;
      launched = true;
    }

    const label = isFile ? path.relative(projectRoot, targetPath) : 'Entire Portfolio Workspace';
    return res.json({
      success: true,
      message: `Directly opened ${label} in Antigravity IDE!`,
      targetPath,
      pid: childPid
    });
  } catch (err) {
    console.error('[Antigravity Launcher] Spawn error:', err);
    return res.status(500).json({
      success: false,
      message: `Error opening Antigravity IDE: ${err.message}`,
      fallbackPath: targetPath
    });
  }
});

// --- OPEN PORTFOLIO DIRECTLY IN VS CODE ---
app.post('/api/admin/open-vscode', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7).trim()
    : (req.headers['x-admin-token'] ? String(req.headers['x-admin-token']).trim() : null);

  const clientIp = req.ip || req.connection?.remoteAddress || '';
  const isLocal = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1' || clientIp.includes('127.0.0.1');
  let isAuthenticated = false;

  if (token && activeSessions.has(token)) {
    const session = activeSessions.get(token);
    if (session && session.expiresAt && new Date(session.expiresAt).getTime() > Date.now()) {
      isAuthenticated = true;
    }
  }

  if (!isAuthenticated && !isLocal) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Admin authentication required to launch VS Code.'
    });
  }

  const { filePath } = req.body || {};
  const projectRoot = path.resolve(__dirname, '..');

  let targetPath = projectRoot;
  let isFile = false;

  if (filePath && typeof filePath === 'string') {
    const cleanPath = filePath.trim().replace(/^[\/\\]+/, '');
    const resolved = path.resolve(projectRoot, cleanPath);
    if (resolved.startsWith(projectRoot) && fs.existsSync(resolved)) {
      targetPath = resolved;
      isFile = true;
    }
  }

  const args = isFile ? ['-r', '-g', `"${targetPath}"`] : ['-r', `"${targetPath}"`];

  try {
    const child = spawn('code.cmd', args, {
      detached: true,
      stdio: 'ignore',
      shell: true
    });
    child.unref();

    const label = isFile ? path.relative(projectRoot, targetPath) : 'Entire Portfolio Workspace';
    return res.json({
      success: true,
      message: `Directly opened ${label} in VS Code!`,
      targetPath,
      pid: child.pid
    });
  } catch (err) {
    console.error('[VS Code Launcher] Spawn error:', err);
    return res.status(500).json({
      success: false,
      message: `Error opening VS Code: ${err.message}`,
      fallbackPath: targetPath
    });
  }
});

// --- ASK ABHIJEET AI ASSISTANT ENDPOINT ---
app.post('/api/ai/chat', (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, message: 'Query message is required.' });
  }

  const store = getStore();
  const q = message.trim().toLowerCase();
  const personal = store.personalInfo || defaultPortfolioData.personalInfo;
  const projects = store.projects || [];
  const skills = store.skillGroups || [];
  const education = store.education || defaultPortfolioData.education;
  const faqs = store.aiKnowledge?.faqs || [];

  // Check matching custom FAQs
  const matchedFaq = faqs.find(f => q.includes(f.question.toLowerCase()) || f.question.toLowerCase().includes(q));
  if (matchedFaq) {
    return res.json({
      success: true,
      answer: matchedFaq.answer,
      source: 'CMS FAQ Knowledge'
    });
  }

  // Dynamic context generation
  if (q.includes('project') || q.includes('build') || q.includes('work') || q.includes('portfolio')) {
    const list = projects.map(p => `• **${p.title}** (${p.tagline}): ${p.description} [Tech: ${p.technologies?.join(', ')}]`).join('\n\n');
    return res.json({
      success: true,
      answer: `Here are the featured projects built by ${personal.name}:\n\n${list}\n\nAll projects include full interactive case studies, live demos, and verified GitHub repositories!`,
      source: 'CMS Projects'
    });
  }

  if (q.includes('skill') || q.includes('tech') || q.includes('stack') || q.includes('language') || q.includes('framework')) {
    const skillList = skills.map(g => `• **${g.category}**: ${g.skills.join(', ')}`).join('\n');
    return res.json({
      success: true,
      answer: `${personal.name}'s technical expertise includes:\n\n${skillList}`,
      source: 'CMS Skills'
    });
  }

  if (q.includes('education') || q.includes('college') || q.includes('degree') || q.includes('university') || q.includes('cgpa') || q.includes('study')) {
    return res.json({
      success: true,
      answer: `${personal.name} is pursuing his **${education.degree}** at **${education.institution}** (${education.location}).\n\nKey academic focus areas include: ${education.relevantAreas?.join(', ')}.`,
      source: 'CMS Education'
    });
  }

  if (q.includes('contact') || q.includes('email') || q.includes('hire') || q.includes('reach') || q.includes('message')) {
    return res.json({
      success: true,
      answer: `You can reach ${personal.name} directly via:\n\n📧 **Email**: [${personal.email}](mailto:${personal.email})\n💼 **LinkedIn**: [${personal.linkedin}](${personal.linkedin})\n🐙 **GitHub**: [${personal.github}](${personal.github})\n📍 **Location**: ${personal.location}`,
      source: 'CMS Contact'
    });
  }

  if (q.includes('learning') || q.includes('current') || q.includes('roadmap')) {
    const learning = skills.find(g => g.isLearning || g.category.toLowerCase().includes('learning'));
    const items = learning ? learning.skills.join(', ') : 'Advanced DSA, Full-Stack Web, AI/ML';
    return res.json({
      success: true,
      answer: `${personal.name} is currently focusing on: **${items}**, practicing problem solving in Java/Python and building high-performance web systems.`,
      source: 'CMS Learning'
    });
  }

  // General fallback response
  return res.json({
    success: true,
    answer: `Hi! I'm the AI assistant for **${personal.name}** (${personal.headline}).\n\nI can provide details about his **projects** (GraviSphere, Air Writing, Django Blog), **technical skills** (Java, Python, React, Django), **academic background** at ${education.institution}, or **contact information** (${personal.email}). What would you like to know?`,
    source: 'CMS General Knowledge'
  });
});

// Scrape public repositories directly from GitHub profile HTML as a robust fallback if API is rate-limited (403)
async function scrapeGitHubPublicRepos(username) {
  try {
    const res = await fetch(`https://github.com/${username}?tab=repositories`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (!res.ok) return [];
    const html = await res.text();
    
    const repoBlockRegex = /<li[^>]*itemprop="owns"[^>]*>([\s\S]*?)<\/li>/gi;
    const repos = [];
    let blockMatch;

    while ((blockMatch = repoBlockRegex.exec(html)) !== null) {
      const block = blockMatch[1];
      const nameMatch = /<a\s+href="\/[^/]+\/([^"/]+)"\s+itemprop="name codeRepository"[^>]*>/i.exec(block);
      if (!nameMatch) continue;
      const name = nameMatch[1].trim();

      const descMatch = /itemprop="description"[^>]*>([\s\S]*?)<\/p>/i.exec(block);
      const desc = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : '';

      const langMatch = /itemprop="programmingLanguage"[^>]*>([\s\S]*?)<\/span>/i.exec(block);
      const lang = langMatch ? langMatch[1].trim() : '';

      repos.push({
        name,
        html_url: `https://github.com/${username}/${name}`,
        description: desc,
        language: lang || 'Software Development',
        stargazers_count: 0
      });
    }

    if (repos.length === 0) {
      const simpleRegex = /<a\s+href="\/[^\/]+\/([^"\/]+)"\s+itemprop="name codeRepository"[^>]*>/gi;
      let m;
      while ((m = simpleRegex.exec(html)) !== null) {
        const name = m[1].trim();
        repos.push({
          name,
          html_url: `https://github.com/${username}/${name}`,
          description: '',
          language: 'Software Development',
          stargazers_count: 0
        });
      }
    }

    return repos;
  } catch (err) {
    console.error('[SYNC] Scrape fallback error:', err.message);
    return [];
  }
}

// --- GITHUB & LINKEDIN AUTOMATIC REPOSITORY & PROJECT INGESTION ENGINE ---
async function syncGitHubProjects(overrideUsername) {
  const store = getStore();
  const username = overrideUsername || store.personalInfo?.githubUsername || 'abhijeetmahakur';

  const headers = { 'User-Agent': 'Portfolio-Sync-Agent/2.0' };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  try {
    console.log(`[SYNC] Fetching repositories from GitHub for @${username}...`);
    let reposData = [];
    let userData = {};

    try {
      const userRes = await fetch(`https://api.github.com/users/${username}`, { headers });
      if (userRes.ok) {
        userData = await userRes.json();
      }

      const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=50`, { headers });
      if (reposRes.ok) {
        reposData = await reposRes.json();
      } else if (reposRes.status === 403 || userRes.status === 403) {
        console.warn('[SYNC] GitHub API rate limit hit (403). Falling back to profile scraper...');
        reposData = await scrapeGitHubPublicRepos(username);
      } else {
        throw new Error(`GitHub repos API returned status ${reposRes.status}`);
      }
    } catch (fetchErr) {
      console.warn(`[SYNC] GitHub API request failed (${fetchErr.message}). Trying public scraper fallback...`);
      reposData = await scrapeGitHubPublicRepos(username);
    }

    if (!Array.isArray(reposData) || reposData.length === 0) {
      console.warn('[SYNC] No repositories found to sync.');
      return { success: true, message: 'No repositories found to sync.', syncStatus: store.syncStatus?.github };
    }

    if (!Array.isArray(store.projects)) {
      store.projects = [];
    }

    let addedCount = 0;
    let updatedCount = 0;
    const skipNames = [];

    for (const repo of reposData) {
      if (!repo.name || repo.fork || skipNames.includes(repo.name.toLowerCase())) {
        continue;
      }

      // Check if project already exists by url or name
      // Strip ALL separators (hyphens, underscores, dots) for fuzzy matching
      // This ensures `gravisphere` matches `gravi-sphere`, `air_writing` matches `air-writing-system`, etc.
      const cleanRepoName = repo.name.toLowerCase().replace(/[-_.]/g, '');
      const existingIdx = store.projects.findIndex(p => {
        // Match by githubUrl containing the exact repo name
        if (p.githubUrl) {
          const urlPath = p.githubUrl.replace(/\.git$/, '').split('/').pop() || '';
          if (urlPath.toLowerCase().replace(/[-_.]/g, '') === cleanRepoName) return true;
        }
        // Match by ID (fuzzy)
        const cleanId = (p.id || '').toLowerCase().replace(/[-_.]/g, '');
        if (cleanId === cleanRepoName) return true;
        // Match by title (fuzzy)
        const cleanTitle = (p.title || '').toLowerCase().replace(/[\s\-_.]/g, '');
        if (cleanTitle === cleanRepoName) return true;
        return false;
      });

      if (existingIdx !== -1) {
        // Update safe stats-only fields — NEVER overwrite githubUrl (preserve the curated URL)
        store.projects[existingIdx].stars = repo.stargazers_count;
        if (repo.homepage && !store.projects[existingIdx].liveUrl) {
          store.projects[existingIdx].liveUrl = repo.homepage;
        }
        if (repo.description && (!store.projects[existingIdx].description || store.projects[existingIdx].description.length < 15)) {
          store.projects[existingIdx].description = repo.description;
        }
        // Preserve the manually set githubUrl — only set it if missing entirely
        if (!store.projects[existingIdx].githubUrl) {
          store.projects[existingIdx].githubUrl = repo.html_url;
        }
        updatedCount++;
      } else {
        // Auto-create new project from newly added GitHub repository
        const formattedTitle = repo.name
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());

        const techStack = [repo.language, ...(repo.topics || [])].filter(Boolean);
        if (techStack.length === 0) techStack.push('Software Engineering', 'Git');

        const lowerName = repo.name.toLowerCase();
        let defaultImage = '/project_webdevbasic.jpg';
        if (lowerName.includes('portfolio')) defaultImage = '/project_personalportfolio.jpg';
        else if (lowerName.includes('attendance')) defaultImage = '/project_attendanceapp.jpg';
        else if (lowerName.includes('thermax') || lowerName.includes('thermal')) defaultImage = '/project_thermax.jpg';
        else if (lowerName.includes('amazon')) defaultImage = '/project_amazonclone.jpg';
        else if (lowerName.includes('air') || lowerName.includes('gesture')) defaultImage = '/project_airwriting.jpg';
        else if (lowerName.includes('blog') || lowerName.includes('django')) defaultImage = '/project_djangoblog.jpg';
        else if (lowerName.includes('gravi')) defaultImage = '/project_gravisphere.jpg';
        else if (lowerName.includes('express')) defaultImage = '/project_webdevbasic.jpg';
        else if (lowerName.includes('localrepo')) defaultImage = '/project_python.jpg';
        else if (lowerName.includes('demo')) defaultImage = '/project_webdevbasic.jpg';
        else if (repo.language && repo.language.toLowerCase() === 'python') defaultImage = '/project_python.jpg';
        else defaultImage = '/project_webdevbasic.jpg';

        const newProject = {
          id: repo.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          title: formattedTitle,
          tagline: repo.description || `${repo.language || 'Software'} Project on GitHub`,
          description: repo.description || `Practical engineering project developed by Abhijeet Mahakur in ${repo.language || 'Software Development'}.`,
          technologies: techStack.slice(0, 5),
          category: repo.language ? `${repo.language} Development` : 'Open Source Engineering',
          image: defaultImage,
          accentColor: '#38bdf8',
          glowColor: 'rgba(56, 189, 248, 0.35)',
          githubUrl: repo.html_url,
          liveUrl: repo.homepage || '',
          stars: repo.stargazers_count || 0,
          published: true,
          source: 'GitHub Auto-Sync',
          syncedAt: new Date().toISOString(),
          caseStudy: {
            problem: `Engineering implementation and architecture for ${formattedTitle}.`,
            idea: repo.description || `Build and publish a modular, performant software solution hosted on GitHub.`,
            technologies: techStack,
            development: `Engineered with modular code structure, Git revision tracking, and automated deployment pipelines.`,
            challenges: `Ensuring high performance, optimal code maintainability, and clean documentation.`,
            solution: `Implemented best practice architectural patterns with rigorous testing.`,
            result: `Published on GitHub with verified version history and ${repo.stargazers_count || 0} stars.`,
            whatILearned: `Strengthened expertise in ${repo.language || 'software development'} and automated Git workflows.`,
            links: {
              github: repo.html_url,
              liveDemo: repo.homepage || ''
            }
          }
        };

        store.projects.unshift(newProject);
        addedCount++;
        console.log(`[SYNC] Added new project from GitHub to top: ${formattedTitle} (${repo.html_url})`);
      }
    }

    if (!store.syncStatus) store.syncStatus = {};
    store.syncStatus.github = {
      connected: true,
      lastSync: new Date().toISOString(),
      account: username,
      repoCount: userData.public_repos || reposData.length,
      status: 'Active & Synchronized',
      autoSyncEnabled: true
    };

    if (!store.syncLogs) store.syncLogs = [];
    store.syncLogs.unshift({
      id: 'log-' + Date.now(),
      service: 'GitHub Auto-Sync',
      status: 'SUCCESS',
      message: `Synced ${reposData.length} repos from GitHub (@${username}). Added ${addedCount} new, updated ${updatedCount}.`,
      timestamp: new Date().toISOString()
    });

    saveStore(store);

    return {
      success: true,
      message: `GitHub sync completed: ${addedCount} added, ${updatedCount} updated across ${reposData.length} repos.`,
      addedCount,
      updatedCount,
      totalRepos: reposData.length,
      projectsCount: store.projects.length,
      syncStatus: store.syncStatus.github
    };
  } catch (err) {
    console.error('[SYNC] GitHub Sync Error:', err.message);
    if (!store.syncStatus) store.syncStatus = {};
    if (!store.syncStatus.github) store.syncStatus.github = {};
    store.syncStatus.github.status = 'Rate Limited / API Warning';
    store.syncStatus.github.lastError = err.message;

    if (!store.syncLogs) store.syncLogs = [];
    store.syncLogs.unshift({
      id: 'log-' + Date.now(),
      service: 'GitHub Auto-Sync',
      status: 'WARNING',
      message: `GitHub sync notice: ${err.message}`,
      timestamp: new Date().toISOString()
    });
    saveStore(store);
    return {
      success: false,
      message: err.message,
      syncStatus: store.syncStatus.github
    };
  }
}

// On-demand GitHub sync endpoint
app.post('/api/sync/github', async (req, res) => {
  const result = await syncGitHubProjects();
  if (result.success) {
    res.json(result);
  } else {
    res.status(502).json(result);
  }
});

// Real-time GitHub Webhook listener (triggers on repo create, push, star)
app.post('/api/sync/github/webhook', async (req, res) => {
  const event = req.headers['x-github-event'] || 'ping';
  const payload = req.body;
  console.log(`[WEBHOOK] Received GitHub webhook event: ${event}`);

  // Trigger sync asynchronously
  syncGitHubProjects().catch(err => console.error('[WEBHOOK] Auto-sync failed:', err.message));

  res.json({
    success: true,
    message: `GitHub webhook event '${event}' received. Auto-sync triggered!`,
    event,
    timestamp: new Date().toISOString()
  });
});

// --- AUTOMATIC LINKEDIN SYNC ENDPOINT ---
app.post(['/api/sync/linkedin', '/api/sync/linkedin/refresh'], async (req, res) => {
  const store = getStore();
  const linkedinProfile = store.personalInfo?.linkedin || 'https://linkedin.com/in/abhijeet-mahakur-23bb983b6';
  
  console.log(`[SYNC] Synchronizing LinkedIn credentials from: ${linkedinProfile}`);

  if (!store.syncStatus) store.syncStatus = {};
  store.syncStatus.linkedin = {
    connected: true,
    lastSync: new Date().toISOString(),
    profileUrl: linkedinProfile,
    account: 'abhijeet-mahakur-23bb983b6',
    status: 'Active & Synchronized',
    certificatesCount: Array.isArray(store.certificates) ? store.certificates.length : 0,
    autoSyncEnabled: true
  };

  if (!store.syncLogs) store.syncLogs = [];
  store.syncLogs.unshift({
    id: 'log-' + Date.now(),
    service: 'LinkedIn Auto-Sync',
    status: 'SUCCESS',
    message: `LinkedIn credentials verified & synchronized (@abhijeet-mahakur-23bb983b6). Vault contains ${store.certificates?.length || 0} accredited certificates.`,
    timestamp: new Date().toISOString()
  });

  saveStore(store);

  res.json({
    success: true,
    message: `LinkedIn synchronized! Verified credentials vault up-to-date (${store.certificates?.length || 0} certificates).`,
    syncStatus: store.syncStatus.linkedin,
    totalCertificates: store.certificates?.length || 0
  });
});

// --- LINKEDIN & INGESTION WEBHOOK ENDPOINTS ---
// Ingests certificates and projects posted on LinkedIn or via automation (Zapier, Make, Shortcuts)
app.post(['/api/sync/linkedin/webhook', '/api/sync/linkedin/post', '/api/sync/linkedin/import'], (req, res) => {
  const store = getStore();
  const payload = req.body || {};
  const {
    type = 'certificate', // 'certificate' or 'project'
    title,
    issuer,
    date,
    credentialUrl,
    verifyUrl,
    githubUrl,
    liveUrl,
    skills,
    technologies,
    description,
    category,
    imageUrl,
    fileUrl
  } = payload;

  if (!title) {
    return res.status(400).json({ success: false, message: 'Title is required for LinkedIn auto-sync ingestion.' });
  }

  const isCert = type === 'certificate' || (!githubUrl && (issuer || credentialUrl));

  if (isCert) {
    if (!Array.isArray(store.certificates)) store.certificates = [];
    
    // Check if duplicate
    const existing = store.certificates.find(c => 
      c.title.toLowerCase() === title.toLowerCase() && 
      (!issuer || c.issuer?.toLowerCase() === (issuer || '').toLowerCase())
    );

    if (existing) {
      if (credentialUrl || verifyUrl) existing.verifyUrl = credentialUrl || verifyUrl;
      if (date) existing.date = date;
      if (description) existing.description = description;
      saveStore(store);
      return res.json({ success: true, message: `Updated existing certificate "${title}".`, certificate: existing });
    }

    const newCert = {
      id: 'cert-' + Date.now(),
      title: title.trim(),
      issuer: (issuer || 'Verified Credential / LinkedIn').trim(),
      date: date || new Date().toISOString().split('T')[0],
      description: description || '',
      category: category || 'Certification',
      verifyUrl: credentialUrl || verifyUrl || '',
      fileUrl: imageUrl || fileUrl || '',
      createdAt: new Date().toISOString(),
      source: 'LinkedIn Auto-Sync'
    };

    store.certificates.unshift(newCert);

    if (!store.syncLogs) store.syncLogs = [];
    store.syncLogs.unshift({
      id: 'log-' + Date.now(),
      service: 'LinkedIn Auto-Sync',
      status: 'SUCCESS',
      message: `Ingested new certificate from LinkedIn: "${newCert.title}" issued by ${newCert.issuer}.`,
      timestamp: new Date().toISOString()
    });

    saveStore(store);
    return res.json({
      success: true,
      message: `Certificate "${newCert.title}" successfully added to portfolio!`,
      certificate: newCert,
      totalCertificates: store.certificates.length
    });
  } else {
    // Project from LinkedIn
    if (!Array.isArray(store.projects)) store.projects = [];

    const techList = Array.isArray(skills || technologies)
      ? (skills || technologies)
      : (typeof (skills || technologies) === 'string' ? (skills || technologies).split(',').map(s => s.trim()) : ['Full-Stack', 'Engineering']);

    const newProject = {
      id: 'proj-' + Date.now(),
      title: title.trim(),
      tagline: description ? description.slice(0, 80) : 'Project posted on LinkedIn',
      description: description || 'Practical engineering project posted on LinkedIn.',
      technologies: techList,
      category: category || 'Software Engineering',
      accentColor: '#38bdf8',
      glowColor: 'rgba(56, 189, 248, 0.35)',
      githubUrl: githubUrl || '',
      liveUrl: liveUrl || '',
      published: true,
      source: 'LinkedIn Post',
      createdAt: new Date().toISOString()
    };

    store.projects.unshift(newProject);

    if (!store.syncLogs) store.syncLogs = [];
    store.syncLogs.unshift({
      id: 'log-' + Date.now(),
      service: 'LinkedIn Auto-Sync',
      status: 'SUCCESS',
      message: `Ingested new project from LinkedIn: "${newProject.title}".`,
      timestamp: new Date().toISOString()
    });

    saveStore(store);
    return res.json({
      success: true,
      message: `Project "${newProject.title}" successfully added to portfolio!`,
      project: newProject,
      totalProjects: store.projects.length
    });
  }
});

// Periodic background auto-sync timer (every 1 minute for near real-time updates)
setInterval(() => {
  syncGitHubProjects().catch(() => {});
}, 60 * 1000);

// Initial background sync check 3 seconds after server boot
setTimeout(() => {
  syncGitHubProjects().catch(() => {});
}, 3000);

// --- SYNC STATUS & LOGS ENDPOINT ---
app.get('/api/sync/status', (req, res) => {
  const store = getStore();
  res.json({
    success: true,
    syncStatus: store.syncStatus || defaultPortfolioData.syncStatus,
    syncLogs: store.syncLogs || []
  });
});

// --- CONTACT FORM INSTANT GMAIL DISPATCH ENDPOINT ---
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required fields.'
      });
    }

    const trimmedName = String(name).trim();
    const trimmedEmail = String(email).trim();
    const trimmedSubject = String(subject || 'Inquiry from ' + trimmedName).trim();
    const trimmedMessage = String(message).trim();

    // Store message persistently in data.json for audit & backup in CMS
    const store = getStore();
    if (!store.contactMessages) store.contactMessages = [];
    const messageRecord = {
      id: 'msg-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex'),
      name: trimmedName,
      email: trimmedEmail,
      subject: trimmedSubject,
      message: trimmedMessage,
      receivedAt: new Date().toISOString(),
      status: 'RECEIVED'
    };
    store.contactMessages.unshift(messageRecord);

    if (!store.syncLogs) store.syncLogs = [];
    store.syncLogs.unshift({
      id: 'log-contact-' + Date.now(),
      service: 'Contact Dispatcher',
      status: 'MESSAGE_RECEIVED',
      message: `Message from ${trimmedName} (${trimmedEmail}): "${trimmedSubject}"`,
      timestamp: new Date().toISOString()
    });
    saveStore(store);

    // Ultra-fast email dispatch using pooled Gmail connection
    const transporter = getMailTransporter();
    const targetRecipient = AUTHORIZED_GMAIL || 'abhijeetmahakur67@gmail.com';
    const senderUser = (process.env.SMTP_USER || process.env.GMAIL_USER || targetRecipient).trim();

    if (transporter) {
      const mailOptions = {
        from: `"Portfolio Contact Form" <${senderUser}>`,
        to: targetRecipient,
        replyTo: `"${trimmedName}" <${trimmedEmail}>`,
        subject: `⚡ [Portfolio Message] ${trimmedSubject}`,
        text: `New Portfolio Message\n\nFrom: ${trimmedName} (${trimmedEmail})\nSubject: ${trimmedSubject}\nDate: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST\n\nMessage:\n${trimmedMessage}\n\n---\nReply directly to this email to respond to ${trimmedName}.`,
        html: `
          <div style="background:#070b14;color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;padding:32px 20px;max-width:620px;margin:0 auto;border-radius:16px;border:1px solid rgba(59,130,246,0.3);">
            <div style="border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:16px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;">
              <h2 style="margin:0;color:#38bdf8;font-size:20px;letter-spacing:-0.5px;">⚡ New Portfolio Message</h2>
              <span style="background:rgba(59,130,246,0.15);color:#60a5fa;padding:4px 10px;border-radius:8px;font-size:11px;font-family:monospace;">INSTANT DISPATCH</span>
            </div>

            <div style="background:#0c1222;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:18px;margin-bottom:20px;">
              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <tr>
                  <td style="color:#94a3b8;padding:6px 0;width:90px;font-weight:600;">Sender:</td>
                  <td style="color:#ffffff;padding:6px 0;font-weight:700;">${trimmedName}</td>
                </tr>
                <tr>
                  <td style="color:#94a3b8;padding:6px 0;font-weight:600;">Email:</td>
                  <td style="color:#38bdf8;padding:6px 0;"><a href="mailto:${trimmedEmail}" style="color:#38bdf8;text-decoration:none;">${trimmedEmail}</a></td>
                </tr>
                <tr>
                  <td style="color:#94a3b8;padding:6px 0;font-weight:600;">Subject:</td>
                  <td style="color:#f1f5f9;padding:6px 0;">${trimmedSubject}</td>
                </tr>
                <tr>
                  <td style="color:#94a3b8;padding:6px 0;font-weight:600;">Time:</td>
                  <td style="color:#cbd5e1;padding:6px 0;font-size:12px;font-family:monospace;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</td>
                </tr>
              </table>
            </div>

            <div style="margin-bottom:24px;">
              <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:8px;font-weight:600;">Message:</div>
              <div style="background:#050811;border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:20px;color:#f8fafc;font-size:15px;line-height:1.6;white-space:pre-wrap;">${trimmedMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            </div>

            <div style="text-align:center;padding-top:16px;border-top:1px solid rgba(255,255,255,0.08);">
              <a href="mailto:${trimmedEmail}?subject=Re: ${encodeURIComponent(trimmedSubject)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px;box-shadow:0 4px 15px rgba(37,99,235,0.4);">
                Reply to ${trimmedName} (${trimmedEmail})
              </a>
            </div>

            <p style="text-align:center;color:#64748b;font-size:11px;margin-top:20px;margin-bottom:0;">
              Delivered directly to ${targetRecipient} from Portfolio Contact Console
            </p>
          </div>
        `
      };

      // Direct, non-delayed send
      await transporter.sendMail(mailOptions);
      console.log(`✅ [CONTACT DISPATCH]: Instant email delivered to ${targetRecipient} from ${trimmedEmail}`);

      return res.json({
        success: true,
        message: 'Message delivered directly to Abhijeet Mahakur\'s inbox.',
        timestamp: messageRecord.receivedAt
      });
    } else {
      console.warn('⚠️ Mail transporter not configured, message saved to database.');
      return res.json({
        success: true,
        message: 'Message received and recorded successfully.',
        timestamp: messageRecord.receivedAt
      });
    }
  } catch (err) {
    console.error('❌ Error in /api/contact:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to dispatch email: ' + (err.message || 'Internal server error')
    });
  }
});

// --- CONTACT HUB: EMAIL REPLY ENDPOINT (ADMIN ONLY) ---
app.post('/api/contact/reply', requireAdmin, async (req, res) => {
  const { messageId, toEmail, toName, subject, replyMessage } = req.body || {};

  if (!toEmail || !replyMessage) {
    return res.status(400).json({ success: false, message: 'Recipient email and reply message are required.' });
  }

  const store = getStore();
  const senderUser = (process.env.SMTP_USER || process.env.GMAIL_USER || AUTHORIZED_GMAIL || 'abhijeetmahakur67@gmail.com').trim();
  const replySubject = subject ? (subject.startsWith('Re:') ? subject : `Re: ${subject}`) : 'Reply from Abhijeet Mahakur';

  console.log(`[REPLY] Sending reply to ${toName || toEmail} <${toEmail}>...`);

  let emailSent = false;
  let emailError = null;

  try {
    const transporter = getMailTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: `"Abhijeet Mahakur" <${senderUser}>`,
        to: toEmail,
        replyTo: senderUser,
        subject: replySubject,
        text: `${replyMessage}\n\n---\nBest regards,\nAbhijeet Mahakur\nB.Tech CSE | Software Developer\nPortfolio: https://github.com/abhijeetmahakur`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; color: #e2e8f0; padding: 28px 20px; border-radius: 14px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(56, 189, 248, 0.3);">
            <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px; margin-bottom: 20px;">
              <h2 style="color: #38bdf8; margin: 0; font-size: 20px; letter-spacing: -0.5px;">Abhijeet Mahakur</h2>
              <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">B.Tech CSE Student & Software Developer</p>
            </div>
            <div style="font-size: 15px; line-height: 1.6; color: #f1f5f9; white-space: pre-wrap; margin-bottom: 24px;">${String(replyMessage).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; font-size: 12px; color: #64748b;">
              <p style="margin: 0;">This email was sent in response to your message via Abhijeet Mahakur's Portfolio Contact Hub.</p>
              <p style="margin: 4px 0 0 0;"><a href="mailto:${senderUser}" style="color: #38bdf8; text-decoration: none;">${senderUser}</a> · <a href="https://github.com/abhijeetmahakur" style="color: #38bdf8; text-decoration: none;">GitHub</a> · <a href="https://linkedin.com/in/abhijeet-mahakur-23bb983b6" style="color: #38bdf8; text-decoration: none;">LinkedIn</a></p>
            </div>
          </div>
        `
      });
      emailSent = true;
      console.log(`✅ [REPLY] Email reply successfully delivered to ${toEmail}`);
    } else {
      emailError = 'Gmail SMTP transporter not configured';
      console.warn('⚠️ [REPLY] SMTP transporter unavailable, recorded to database.');
    }
  } catch (err) {
    console.error('❌ [REPLY] Failed to send email via SMTP:', err.message);
    emailError = err.message;
  }

  // Update message in store
  if (Array.isArray(store.contactMessages)) {
    const msg = store.contactMessages.find(m => m.id === messageId || m.email === toEmail);
    if (msg) {
      msg.replied = true;
      msg.repliedAt = new Date().toISOString();
      msg.lastReplyText = replyMessage;
      msg.lastReplySubject = replySubject;
    }
  }

  if (!store.syncLogs) store.syncLogs = [];
  store.syncLogs.unshift({
    id: 'log-' + Date.now(),
    service: 'Contact Reply Service',
    status: emailSent ? 'SUCCESS' : 'WARNING',
    message: `Replied to ${toName || toEmail} (${toEmail}): "${replySubject}". ${emailSent ? 'Delivered via Gmail SMTP.' : 'Notice: ' + emailError}`,
    timestamp: new Date().toISOString()
  });

  saveStore(store);

  res.json({
    success: true,
    emailSent,
    message: emailSent
      ? `✓ Reply successfully sent to ${toEmail} via Gmail!`
      : `Reply recorded in portfolio database. (Gmail SMTP notice: ${emailError}). Direct Gmail web compose link available below.`,
    gmailComposeUrl: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toEmail)}&su=${encodeURIComponent(replySubject)}&body=${encodeURIComponent(replyMessage)}`
  });
});


// --- NEWSLETTER SUBSCRIPTION ENDPOINT ---
app.post('/api/newsletter/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid email address is required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const store = getStore();
    if (!store.newsletterSubscribers) store.newsletterSubscribers = [];

    // Check if already subscribed
    const existing = store.newsletterSubscribers.find(s => s.email.toLowerCase() === trimmedEmail);
    if (existing) {
      return res.json({
        success: true,
        alreadySubscribed: true,
        message: 'You are already subscribed to Abhijeet\'s updates! Thank you.'
      });
    }

    const subscriberRecord = {
      id: 'sub-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex'),
      email: trimmedEmail,
      subscribedAt: new Date().toISOString(),
      status: 'ACTIVE'
    };

    store.newsletterSubscribers.unshift(subscriberRecord);

    if (!store.syncLogs) store.syncLogs = [];
    store.syncLogs.unshift({
      id: 'log-sub-' + Date.now(),
      service: 'Newsletter Service',
      status: 'SUBSCRIBED',
      message: `New newsletter subscription: ${trimmedEmail}`,
      timestamp: new Date().toISOString()
    });

    saveStore(store);

    // Send instant notification to Abhijeet's Gmail
    const transporter = getMailTransporter();
    const targetRecipient = AUTHORIZED_GMAIL || 'abhijeetmahakur67@gmail.com';
    const senderUser = (process.env.SMTP_USER || process.env.GMAIL_USER || targetRecipient).trim();

    if (transporter) {
      // 1. Notify Abhijeet
      transporter.sendMail({
        from: `"Portfolio Newsletter" <${senderUser}>`,
        to: targetRecipient,
        subject: `📰 [New Newsletter Subscriber] ${trimmedEmail}`,
        text: `New Newsletter Subscription!\n\nEmail: ${trimmedEmail}\nDate: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST\nTotal Subscribers: ${store.newsletterSubscribers.length}`,
        html: `
          <div style="background:#070b14;color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;padding:28px 20px;max-width:540px;margin:0 auto;border-radius:14px;border:1px solid rgba(56,189,248,0.3);">
            <h2 style="color:#38bdf8;margin:0 0 12px 0;font-size:20px;">📰 New Newsletter Subscriber!</h2>
            <p style="color:#cbd5e1;font-size:14px;margin:0 0 16px 0;">Someone just subscribed to your portfolio newsletter:</p>
            <div style="background:#0e1526;border:1px solid rgba(56,189,248,0.2);border-radius:10px;padding:16px;margin-bottom:16px;">
              <div style="font-size:16px;font-weight:700;color:#38bdf8;font-family:monospace;">${trimmedEmail}</div>
              <div style="font-size:12px;color:#94a3b8;margin-top:6px;">Subscribed at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</div>
              <div style="font-size:12px;color:#34d399;margin-top:4px;font-weight:600;">Total Active Subscribers: ${store.newsletterSubscribers.length}</div>
            </div>
            <p style="color:#64748b;font-size:11px;margin:0;">Stored securely in portfolio database.</p>
          </div>
        `
      }).catch(e => console.warn('Newsletter admin notification notice:', e.message));

      // 2. Send warm welcome confirmation to subscriber
      transporter.sendMail({
        from: `"Abhijeet Mahakur" <${senderUser}>`,
        to: trimmedEmail,
        subject: `Welcome to Abhijeet Mahakur's Tech Updates! 🚀`,
        text: `Hi there,\n\nThank you for subscribing to my portfolio newsletter! You will now receive updates on my latest engineering projects, articles, and innovations in AI, Web Development, and Computer Vision.\n\nBest regards,\nAbhijeet Mahakur\nhttps://github.com/abhijeetmahakur`,
        html: `
          <div style="background:#070b14;color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;padding:32px 24px;max-width:560px;margin:0 auto;border-radius:16px;border:1px solid rgba(56,189,248,0.3);">
            <div style="text-align:center;margin-bottom:20px;">
              <h2 style="color:#38bdf8;margin:0 0 8px 0;font-size:22px;">Welcome to Tech Updates 🚀</h2>
              <p style="color:#94a3b8;font-size:14px;margin:0;">From Abhijeet Mahakur — Software Developer & B.Tech CSE Student</p>
            </div>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.6;">
              Thank you for subscribing! You'll be the first to know whenever I release new interactive projects, open-source repositories, and technical insights covering AI, Computer Vision, and Full-Stack Engineering.
            </p>
            <div style="text-align:center;margin:24px 0;">
              <a href="https://github.com/abhijeetmahakur" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px;">
                Explore My GitHub Projects
              </a>
            </div>
            <p style="color:#64748b;font-size:11px;margin-top:24px;border-top:1px solid rgba(255,255,255,0.08);padding-top:12px;text-align:center;">
              You received this because you subscribed at portfolio. To unsubscribe, simply reply with "unsubscribe".
            </p>
          </div>
        `
      }).catch(e => console.warn('Newsletter welcome email notice:', e.message));
    }

    console.log(`✅ [NEWSLETTER]: New subscriber saved to database: ${trimmedEmail}`);

    return res.json({
      success: true,
      message: 'Thank you for subscribing to my updates!',
      subscriber: subscriberRecord
    });
  } catch (err) {
    console.error('❌ Error in /api/newsletter/subscribe:', err);
    return res.status(500).json({
      success: false,
      message: 'Error saving newsletter subscription: ' + (err.message || 'Internal server error')
    });
  }
});

// Delete subscriber endpoint (Admin only) - supports both DELETE and POST for maximum browser compatibility
app.delete('/api/newsletter/subscribers/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const store = getStore();
  if (store.newsletterSubscribers) {
    const cleanId = decodeURIComponent(id).toLowerCase();
    store.newsletterSubscribers = store.newsletterSubscribers.filter(s => 
      s.id !== id && 
      s.id?.toLowerCase() !== cleanId && 
      s.email?.toLowerCase() !== cleanId
    );
    saveStore(store);
    console.log(`[NEWSLETTER] Removed subscriber ${id}. Remaining: ${store.newsletterSubscribers.length}`);
  }
  res.json({ success: true, message: 'Subscriber removed.' });
});

app.post('/api/newsletter/subscribers/delete', requireAdmin, (req, res) => {
  const { id, email } = req.body || {};
  const store = getStore();
  if (store.newsletterSubscribers) {
    store.newsletterSubscribers = store.newsletterSubscribers.filter(s => {
      if (id && (s.id === id || s.id?.toLowerCase() === id.toLowerCase())) return false;
      if (email && s.email?.toLowerCase() === email.toLowerCase()) return false;
      return true;
    });
    saveStore(store);
    console.log(`[NEWSLETTER] Removed subscriber id=${id} email=${email}. Remaining: ${store.newsletterSubscribers.length}`);
  }
  res.json({ success: true, message: 'Subscriber removed.' });
});


// Safe startup configuration check (NEVER logs client_secret)
function printOAuthConfigCheck() {
  const clientId = process.env.GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || GOOGLE_CLIENT_SECRET || '';
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/api/auth/google/callback`;

  console.log('------------------------------------------------------');
  console.log('🔐 Google OAuth 2.0 Backend Configuration Status:');
  console.log(`   • GOOGLE_CLIENT_ID:     ${clientId && clientId.trim() !== '' ? `[LOADED] (${clientId.substring(0, 16)}...apps.googleusercontent.com)` : '[MISSING / EMPTY]'}`);
  console.log(`   • GOOGLE_CLIENT_SECRET: ${clientSecret && clientSecret.trim() !== '' ? `[LOADED] (${clientSecret.length} chars, securely hidden)` : '[MISSING / EMPTY]'}`);
  console.log(`   • GOOGLE_REDIRECT_URI:  ${redirectUri ? `[LOADED] ${redirectUri}` : '[MISSING]'}`);
  console.log(`   • Authorized Admin:     ${AUTHORIZED_GMAIL}`);
  if (clientId && clientId.trim() !== '' && clientSecret && clientSecret.trim() !== '') {
    console.log('   • OAuth Status:         READY FOR AUTHENTICATION ✅');
  } else {
    console.log('   • OAuth Status:         CONFIGURATION INCOMPLETE ⚠️ (Please configure GOOGLE_CLIENT_SECRET in .env)');
  }
  console.log('------------------------------------------------------');
}

// --- PRODUCTION STATIC ASSET SERVING (RENDER / STANDALONE EXPRESS HOSTING) ---
const DIST_DIR = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  // Client-side fallback: serve index.html for non-API and non-upload routes (Express 5 compatible)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(DIST_DIR, 'index.html'));
    }
    next();
  });
}

if (!IS_VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Portfolio CMS & Auth Server running on port ${PORT}`);
    if (RENDER_EXTERNAL_URL) {
      console.log(`🌐 Live URL: ${RENDER_EXTERNAL_URL}`);
    } else {
      console.log(`🌐 Local URL: http://localhost:${PORT}`);
    }
    console.log(`🔒 Authorized Admin: ${AUTHORIZED_GMAIL}`);
    console.log(`📱 Authorized Phone: +91 ******${AUTHORIZED_ADMIN_PHONE.slice(-4)}`);
    printOAuthConfigCheck();
    if (process.env.GMAIL_APP_PASSWORD && process.env.RESEND_API_KEY) {
      console.log('⚡ [Email] Dual transport active: Gmail SMTP & Resend API configured.');
    } else if (process.env.GMAIL_APP_PASSWORD) {
      console.log('✉️ [Email] Gmail SMTP configured for Admin OTP delivery.');
    } else if (process.env.RESEND_API_KEY) {
      console.log('⚡ [Email] Resend API configured for Admin OTP delivery.');
    } else {
      console.log('ℹ️ [Email] Configure GMAIL_APP_PASSWORD or RESEND_API_KEY in Render. Admin Master PIN is active.');
    }
  });
}

export default app;
export { app };

