/**
 * Portfolio CMS - Dynamic Data Hydration Engine
 * Fetches data from backend /api/portfolio and renders live dynamic content
 */

const API_BASE = ''; // Uses Vite proxy (/api) or falls back to http://localhost:3001

export const HOMEPAGE_PROJECTS_COUNT = 5;
export const HOMEPAGE_CERTS_COUNT = 3;

export async function fetchPortfolioData() {
  try {
    const res = await fetch(`${API_BASE}/api/portfolio?sync=true`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    // Fallback to direct backend URL if proxy isn't routing
    try {
      const fallbackRes = await fetch('http://localhost:3001/api/portfolio?sync=true');
      if (fallbackRes.ok) {
        const json = await fallbackRes.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (e) {
      console.warn('[CMS] Running in static/offline fallback mode.');
    }
  }
  return null;
}

export function hydratePortfolio(data) {
  if (!data) return;
  window.cmsData = data;

  const { personalInfo, skillGroups, projects, education, experience, certificates } = data;

  // 1. HERO SECTION
  if (personalInfo) {
    // College & Degree Badge
    const heroBadgeText = document.querySelector('.hero-badge .badge-text');
    if (heroBadgeText) {
      const degreeText = personalInfo.degree ? personalInfo.degree.toUpperCase() : 'B.TECH CSE';
      const collegeText = personalInfo.college ? personalInfo.college.toUpperCase() : 'ITER SOA UNIVERSITY';
      heroBadgeText.textContent = `${degreeText} · ${collegeText}`;
    }

    // Name
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle && personalInfo.name) {
      const parts = personalInfo.name.trim().split(' ');
      const firstName = parts[0] || 'ABHIJEET';
      const lastName = parts.slice(1).join(' ') || 'MAHAKUR';
      heroTitle.innerHTML = `${firstName.toUpperCase()}<br /><span class="highlight-gradient">${lastName.toUpperCase()}</span>`;
    }

    // Headline / Bio Description
    const heroDesc = document.querySelector('.hero-desc');
    if (heroDesc && (personalInfo.headline || personalInfo.introParagraph)) {
      heroDesc.textContent = personalInfo.headline || personalInfo.introParagraph;
    }

    // Social Links in Hero & Header
    if (personalInfo.github) {
      document.querySelectorAll('a[aria-label="GitHub"], a[title="GitHub"]').forEach(el => {
        el.setAttribute('href', personalInfo.github);
      });
    }
    if (personalInfo.linkedin) {
      document.querySelectorAll('a[aria-label="LinkedIn"], a[title="LinkedIn"]').forEach(el => {
        el.setAttribute('href', personalInfo.linkedin);
      });
    }
    if (personalInfo.twitter || personalInfo.x) {
      document.querySelectorAll('a[aria-label*="Twitter"], a[aria-label*="X"], a[title*="Twitter"]').forEach(el => {
        el.setAttribute('href', personalInfo.twitter || personalInfo.x);
      });
    }
    if (personalInfo.instagram) {
      document.querySelectorAll('a[aria-label="Instagram"], a[title="Instagram"]').forEach(el => {
        el.setAttribute('href', personalInfo.instagram);
      });
    }

    // 2. ABOUT ME SECTION
    const aboutParagraph = document.querySelector('.about-paragraph');
    if (aboutParagraph && personalInfo.introParagraph) {
      aboutParagraph.textContent = personalInfo.introParagraph;
    }

    // About Quick Info Cards
    const infoCards = document.querySelectorAll('.about-cards-grid .info-card');
    infoCards.forEach(card => {
      const label = card.querySelector('.info-label')?.textContent?.trim().toLowerCase();
      const valEl = card.querySelector('.info-val');
      if (!valEl) return;

      if (label === 'name' && personalInfo.name) {
        valEl.textContent = personalInfo.name;
      } else if (label === 'email' && personalInfo.email) {
        valEl.textContent = personalInfo.email;
      } else if (label === 'location' && personalInfo.location) {
        valEl.textContent = personalInfo.location;
      } else if (label === 'availability' && personalInfo.availabilityStatus) {
        valEl.textContent = personalInfo.availabilityStatus;
      }
    });

    // Brand logo text in header
    const brandName = document.querySelector('.logo-name');
    if (brandName && personalInfo.name) {
      brandName.textContent = personalInfo.name;
    }
    const logoMonogram = document.querySelector('.logo-monogram span');
    if (logoMonogram && personalInfo.name && !document.querySelector('.logo-monogram img')) {
      const initials = personalInfo.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      logoMonogram.textContent = initials;
    }

    // Contact Details in Contact Section
    const contactEntries = document.querySelectorAll('.contact-items .contact-entry');
    contactEntries.forEach(entry => {
      const text = entry.querySelector('.entry-val');
      if (!text) return;
      const content = text.textContent.trim();
      if (content.includes('@') && personalInfo.email) {
        text.textContent = personalInfo.email;
      } else if (content.startsWith('+') && personalInfo.phone) {
        text.textContent = personalInfo.phone;
      } else if (!content.includes('@') && !content.startsWith('+') && personalInfo.location) {
        text.textContent = personalInfo.location;
      }
    });

    // Footer Copyright
    const footerCopy = document.querySelector('.footer-bottom p');
    if (footerCopy && personalInfo.name) {
      const year = new Date().getFullYear();
      footerCopy.textContent = `© ${year} ${personalInfo.name}. All rights reserved.`;
    }
  }

  // 3. SKILLS SECTION
  if (Array.isArray(skillGroups) && skillGroups.length > 0) {
    const skillsGrid = document.querySelector('.skills-grid');
    if (skillsGrid) {
      const iconThemes = ['icon-blue', 'icon-purple', 'icon-cyan', 'icon-green', 'icon-pink'];
      const defaultIcons = [
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line></svg>`,
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`
      ];

      skillsGrid.innerHTML = skillGroups.map((group, idx) => {
        const theme = iconThemes[idx % iconThemes.length];
        const iconSvg = defaultIcons[idx % defaultIcons.length];
        const tags = Array.isArray(group.skills) ? group.skills : (typeof group.skills === 'string' ? group.skills.split(',').map(s => s.trim()) : []);
        const tagsHtml = tags.map(tag => `<span class="skill-tag">${escapeHtml(tag)}</span>`).join('');

        return `
          <div class="skill-card glass-panel" data-skill-id="${group.id || idx}">
            <div class="skill-icon-wrap ${theme}">
              ${iconSvg}
            </div>
            <h3 class="skill-title">${escapeHtml(group.category || group.title || 'Specialization')}</h3>
            <p class="skill-desc">${escapeHtml(group.description || '')}</p>
            <div class="skill-tags">
              ${tagsHtml}
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // 4. PROJECTS SECTION
  if (Array.isArray(projects) && projects.length > 0) {
    const projectsGrid = document.querySelector('.projects-grid');
    if (projectsGrid) {
      const projectImageRegistry = {
        'personal-portfolio': '/project_personalportfolio.jpg',
        'personal_portfolio': '/project_personalportfolio.jpg',
        'portfolio': '/project_personalportfolio.jpg',
        'gravisphere': '/project_gravisphere.jpg',
        'air-writing': '/project_airwriting.jpg',
        'air_writing': '/project_airwriting.jpg',
        'django-blog': '/project_djangoblog.jpg',
        'django': '/project_djangoblog.jpg',
        'attendanceapp': '/project_attendanceapp.jpg',
        'thermax': '/project_thermax.jpg',
        'amazon-clone': '/project_amazonclone.jpg',
        'amazon_clone': '/project_amazonclone.jpg',
        'webdevelopmentbasic': '/project_webdevbasic.jpg',
        'python': '/project_python.jpg',
        'express': '/project_webdevbasic.jpg',
        'localrepo': '/project_python.jpg',
        'demo': '/project_webdevbasic.jpg'
      };

      const fallbackImages = [
        '/project_personalportfolio.jpg',
        '/project_gravisphere.jpg',
        '/project_airwriting.jpg',
        '/project_djangoblog.jpg',
        '/project_attendanceapp.jpg',
        '/project_thermax.jpg',
        '/project_amazonclone.jpg',
        '/project_webdevbasic.jpg',
        '/project_python.jpg'
      ];

      function resolveProjectImage(proj, index) {
        if (proj.image && proj.image !== '/project_gravisphere.jpg') return proj.image;
        const idKey = (proj.id || '').toLowerCase().replace(/[-_]/g, '');
        const titleKey = (proj.title || '').toLowerCase();
        if (titleKey.includes('portfolio') || idKey.includes('portfolio')) return '/project_personalportfolio.jpg';
        if (proj.image) return proj.image;
        if (proj.thumbnail) return proj.thumbnail;
        for (const [key, imgPath] of Object.entries(projectImageRegistry)) {
          if (idKey.includes(key.replace(/[-_]/g, '')) || key.replace(/[-_]/g, '').includes(idKey)) {
            return imgPath;
          }
        }
        if (titleKey.includes('attendance')) return '/project_attendanceapp.jpg';
        if (titleKey.includes('thermax') || titleKey.includes('thermal')) return '/project_thermax.jpg';
        if (titleKey.includes('amazon')) return '/project_amazonclone.jpg';
        if (titleKey.includes('web') || titleKey.includes('html')) return '/project_webdevbasic.jpg';
        if (titleKey.includes('python')) return '/project_python.jpg';
        if (titleKey.includes('gravi')) return '/project_gravisphere.jpg';
        if (titleKey.includes('air') || titleKey.includes('gesture')) return '/project_airwriting.jpg';
        if (titleKey.includes('django') || titleKey.includes('blog')) return '/project_djangoblog.jpg';
        if (titleKey.includes('express')) return '/project_webdevbasic.jpg';
        if (titleKey.includes('localrepo')) return '/project_python.jpg';
        if (titleKey.includes('demo')) return '/project_webdevbasic.jpg';
        return fallbackImages[index % fallbackImages.length];
      }

      const displayedProjects = projects.slice(0, HOMEPAGE_PROJECTS_COUNT);
      const projCardsHtml = displayedProjects.map((p, idx) => {
        const thumb = resolveProjectImage(p, idx);
        const techList = Array.isArray(p.technologies) 
          ? p.technologies 
          : (typeof p.technologies === 'string' ? p.technologies.split(',').map(s => s.trim()) : []);
        const techTagsHtml = techList.map(t => `<span class="skill-tag">${escapeHtml(t)}</span>`).join('');

        const liveLinkHtml = p.liveUrl 
          ? `<a href="${escapeHtml(p.liveUrl)}" target="_blank" rel="noopener noreferrer" class="project-icon-link" title="Live Demo">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>`
          : '';

        const githubLinkHtml = p.githubUrl 
          ? `<a href="${escapeHtml(p.githubUrl)}" target="_blank" rel="noopener noreferrer" class="project-icon-link" title="Source Code">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
            </a>`
          : '';

        return `
          <div class="project-card glass-panel" data-project-id="${p.id || idx}">
            <div class="project-thumb-wrap">
              <img src="${escapeHtml(thumb)}" alt="${escapeHtml(p.title)} Preview" loading="lazy" class="project-thumb" onerror="this.onerror=null; this.src='/project_gravisphere.jpg'" />
              <div class="project-thumb-overlay"></div>
            </div>
            <div class="project-body">
              <div class="project-tag-row">
                <span class="project-cat">${escapeHtml(p.category || p.tagline || 'Software Engineering')}</span>
                <div class="project-links">
                  ${liveLinkHtml}
                  ${githubLinkHtml}
                </div>
              </div>
              <h3 class="project-title">${escapeHtml(p.title)}</h3>
              <p class="project-desc">${escapeHtml(p.description || '')}</p>
              <div class="skill-tags">
                ${techTagsHtml}
              </div>
            </div>
          </div>
        `;
      }).join('');

      const moreProjectCardHtml = `
        <div class="project-card glass-panel more-grid-card" id="btn-open-more-projects-card" role="button" tabindex="0" title="Click to view all projects" onclick="if(window.openProjModal) window.openProjModal();">
          <div class="more-grid-card-inner">
            <div class="more-card-icon-wrap icon-blue">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </div>
            <span class="more-card-eyebrow">PORTFOLIO VAULT</span>
            <h3 class="more-card-title">View More Projects</h3>
            <p class="more-card-desc">Explore Abhijeet's complete collection of web apps, computer vision tools, AI models & software repositories.</p>
            <div class="more-card-action-btn">
              <span>Explore All Projects</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </div>
        </div>
      `;

      projectsGrid.innerHTML = projCardsHtml + moreProjectCardHtml;
    }
  }

  // 4.5 EXPERIENCE & INTERNSHIPS TIMELINE HYDRATION
  const timelineContainer = document.querySelector('#experience .timeline-container');
  if (timelineContainer && experience && Array.isArray(experience.items) && experience.items.length > 0) {
    const eduNodes = [
      {
        period: '2024 — Present',
        role: 'B.Tech in Computer Science & Engineering',
        org: 'ITER, SOA University · Bhubaneswar',
        desc: 'Currently pursuing 5th Semester (Expected Graduation: 2028). Core coursework and practice in Data Structures & Algorithms, Object-Oriented Programming, Database Management Systems, and Web Engineering.'
      },
      {
        period: 'Secondary & Senior Secondary',
        role: 'Senior Secondary Education (CBSE)',
        org: 'DAV Bistupur · Jamshedpur',
        desc: 'Completed secondary and senior secondary education under the CBSE board with a strong curriculum foundation in Mathematics, Physics, and foundational computing.'
      }
    ];

    const expNodes = experience.items.map(item => ({
      period: item.period || item.timeline || 'Practical Milestone',
      role: item.title || item.role || 'Software Engineering',
      org: item.org || item.company || item.focus || 'Practical Engineering',
      desc: item.description || item.summary || '',
      verifyUrl: item.verifyUrl || ''
    }));

    const allNodes = [...expNodes, ...eduNodes];

    timelineContainer.innerHTML = '<div class="timeline-spine"></div>' + allNodes.map((node, idx) => {
      const isLeft = idx % 2 === 0;
      const verifyLinkHtml = node.verifyUrl ? `
        <div style="margin-top: 10px;">
          <a href="${escapeHtml(node.verifyUrl)}" target="_blank" rel="noopener noreferrer" class="cert-verify-link" style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: #38bdf8; font-weight: 600;">
            <span>Verify Internship Portal</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      ` : '';

      return `
        <div class="timeline-node ${isLeft ? 'node-left' : 'node-right'}">
          <div class="timeline-card glass-panel">
            <span class="timeline-period">${escapeHtml(node.period)}</span>
            <h3 class="timeline-role">${escapeHtml(node.role)}</h3>
            <h4 class="timeline-org">${escapeHtml(node.org)}</h4>
            <p class="timeline-desc">${escapeHtml(node.desc)}</p>
            ${verifyLinkHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  // 5. CERTIFICATES & CREDENTIALS SECTION (AUTO-SYNCED FROM LINKEDIN)
  const certsGrid = document.querySelector('#certificates-grid');
  if (certsGrid) {
    if (Array.isArray(certificates) && certificates.length > 0) {
      const displayedCerts = certificates.slice(0, HOMEPAGE_CERTS_COUNT);
      const certCardsHtml = displayedCerts.map((c, idx) => {
        const verifyBtn = c.verifyUrl 
          ? `<a href="${escapeHtml(c.verifyUrl)}" target="_blank" rel="noopener noreferrer" class="cert-verify-link">
              <span>Verify Credential</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>`
          : '';

        const fileBtn = c.fileUrl 
          ? `<a href="${escapeHtml(c.fileUrl)}" target="_blank" rel="noopener noreferrer" class="cert-doc-link" title="View Certificate Document">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              <span>View Document</span>
            </a>`
          : '';

        return `
          <div class="cert-card glass-panel" data-cert-id="${c.id || idx}">
            <div class="cert-header">
              <div class="cert-badge-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 15l-2 5l9-13h-6l2-5l-9 13h6z"/>
                </svg>
              </div>
              <div class="cert-source-pill">${escapeHtml(c.source || 'Verified Credential')}</div>
            </div>
            <h3 class="cert-title">${escapeHtml(c.title)}</h3>
            <div class="cert-meta">
              <span class="cert-issuer">🏛️ ${escapeHtml(c.issuer || 'Accredited Issuer')}</span>
              ${c.date ? `<span class="cert-date">📅 ${escapeHtml(String(c.date).slice(0, 10))}</span>` : ''}
            </div>
            ${c.description ? `<p class="cert-desc">${escapeHtml(c.description)}</p>` : ''}
            <div class="cert-footer">
              <span class="cert-cat">${escapeHtml(c.category || 'Computer Science')}</span>
              <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                ${fileBtn}
                ${verifyBtn}
              </div>
            </div>
          </div>
        `;
      }).join('');

      const moreCertCardHtml = `
        <div class="cert-card glass-panel more-grid-card" id="btn-open-more-certs-card" role="button" tabindex="0" title="Click to view all certificates" onclick="if(window.openCertModal) window.openCertModal();">
          <div class="more-grid-card-inner">
            <div class="more-card-icon-wrap icon-purple">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
            </div>
            <span class="more-card-eyebrow">VERIFIED CREDENTIALS</span>
            <h3 class="more-card-title">View More Certificates</h3>
            <p class="more-card-desc">Browse full archive of accredited diplomas, professional badges, and course qualifications.</p>
            <div class="more-card-action-btn btn-purple">
              <span>Explore All Credentials</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </div>
        </div>
      `;

      certsGrid.innerHTML = certCardsHtml + moreCertCardHtml;
    } else {
      certsGrid.innerHTML = `
        <div class="cert-empty-card glass-panel">
          <p>No certificates published yet. New credentials will sync automatically from LinkedIn!</p>
        </div>
      `;
    }
  }

  console.log('[CMS] Portfolio hydrated with latest dynamic data.');
  initMoreModals();
}

let currentProjectsData = [];
let currentCertsData = [];

function resolveProjectImage(proj, index) {
  const projectImageRegistry = {
    'personal-portfolio': '/project_personalportfolio.jpg',
    'personal_portfolio': '/project_personalportfolio.jpg',
    'portfolio': '/project_personalportfolio.jpg',
    'gravisphere': '/project_gravisphere.jpg',
    'air-writing': '/project_airwriting.jpg',
    'air_writing': '/project_airwriting.jpg',
    'django-blog': '/project_djangoblog.jpg',
    'django': '/project_djangoblog.jpg',
    'attendanceapp': '/project_attendanceapp.jpg',
    'thermax': '/project_thermax.jpg',
    'amazon-clone': '/project_amazonclone.jpg',
    'amazon_clone': '/project_amazonclone.jpg',
    'webdevelopmentbasic': '/project_webdevbasic.jpg',
    'python': '/project_python.jpg',
    'express': '/project_webdevbasic.jpg',
    'localrepo': '/project_python.jpg',
    'demo': '/project_webdevbasic.jpg'
  };

  const fallbackImages = [
    '/project_personalportfolio.jpg',
    '/project_gravisphere.jpg',
    '/project_airwriting.jpg',
    '/project_djangoblog.jpg',
    '/project_attendanceapp.jpg',
    '/project_thermax.jpg',
    '/project_amazonclone.jpg',
    '/project_webdevbasic.jpg',
    '/project_python.jpg'
  ];

  if (proj.image && proj.image !== '/project_gravisphere.jpg') return proj.image;
  const idKey = (proj.id || '').toLowerCase().replace(/[-_]/g, '');
  const titleKey = (proj.title || '').toLowerCase();
  if (titleKey.includes('portfolio') || idKey.includes('portfolio')) return '/project_personalportfolio.jpg';
  if (proj.image) return proj.image;
  if (proj.thumbnail) return proj.thumbnail;
  for (const [key, imgPath] of Object.entries(projectImageRegistry)) {
    if (idKey.includes(key.replace(/[-_]/g, '')) || key.replace(/[-_]/g, '').includes(idKey)) {
      return imgPath;
    }
  }
  if (titleKey.includes('attendance')) return '/project_attendanceapp.jpg';
  if (titleKey.includes('thermax') || titleKey.includes('thermal')) return '/project_thermax.jpg';
  if (titleKey.includes('amazon')) return '/project_amazonclone.jpg';
  if (titleKey.includes('web') || titleKey.includes('html')) return '/project_webdevbasic.jpg';
  if (titleKey.includes('python')) return '/project_python.jpg';
  if (titleKey.includes('gravi')) return '/project_gravisphere.jpg';
  if (titleKey.includes('air') || titleKey.includes('gesture')) return '/project_airwriting.jpg';
  if (titleKey.includes('django') || titleKey.includes('blog')) return '/project_djangoblog.jpg';
  if (titleKey.includes('express')) return '/project_webdevbasic.jpg';
  if (titleKey.includes('localrepo')) return '/project_python.jpg';
  if (titleKey.includes('demo')) return '/project_webdevbasic.jpg';
  return fallbackImages[index % fallbackImages.length];
}

function initMoreModals() {
  if (window.cmsData) {
    if (Array.isArray(window.cmsData.projects)) currentProjectsData = window.cmsData.projects;
    if (Array.isArray(window.cmsData.certificates)) currentCertsData = window.cmsData.certificates;
  }

  // Elements
  const projModalOverlay = document.getElementById('more-projects-modal-overlay');
  const openProjBtn = document.getElementById('btn-open-more-projects');
  const closeProjBtn = document.getElementById('btn-close-more-projects-modal');
  const projSearchInput = document.getElementById('inp-search-more-projects');
  const projChipsContainer = document.getElementById('project-filter-chips');

  const certModalOverlay = document.getElementById('more-certs-modal-overlay');
  const openCertBtn = document.getElementById('btn-open-more-certs');
  const closeCertBtn = document.getElementById('btn-close-more-certs-modal');
  const certSearchInput = document.getElementById('inp-search-more-certs');
  const certChipsContainer = document.getElementById('cert-filter-chips');

  let currentProjFilter = 'all';
  let currentCertFilter = 'all';

  function enableModalWheelScroll(modalEl) {
    if (!modalEl) return;
    const scrollContainer = modalEl.querySelector('.modal-grid-scroll');
    if (!scrollContainer) return;

    if (!scrollContainer._wheelAttached) {
      scrollContainer.addEventListener('wheel', (e) => {
        e.stopPropagation();
        scrollContainer.scrollTop += e.deltaY;
      }, { passive: false });
      scrollContainer._wheelAttached = true;
    }
  }

  function openProjModal() {
    if (!projModalOverlay) return;
    renderMoreProjectsGrid();
    projModalOverlay.classList.add('active');
    projModalOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (window.lenis) window.lenis.stop();
    enableModalWheelScroll(projModalOverlay);
  }

  function closeProjModal() {
    if (!projModalOverlay) return;
    projModalOverlay.classList.remove('active');
    projModalOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (window.lenis) window.lenis.start();
  }

  function openCertModal() {
    if (!certModalOverlay) return;
    renderMoreCertsGrid();
    certModalOverlay.classList.add('active');
    certModalOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (window.lenis) window.lenis.stop();
    enableModalWheelScroll(certModalOverlay);
  }

  function closeCertModal() {
    if (!certModalOverlay) return;
    certModalOverlay.classList.remove('active');
    certModalOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (window.lenis) window.lenis.start();
  }

  window.openProjModal = openProjModal;
  window.openCertModal = openCertModal;

  const projectsSection = document.querySelector('#projects');
  if (projectsSection && !projectsSection._hasMoreListener) {
    projectsSection.addEventListener('click', (e) => {
      const card = e.target.closest('#btn-open-more-projects-card') || e.target.closest('#btn-open-more-projects');
      if (card) {
        e.preventDefault();
        openProjModal();
      }
    });
    projectsSection._hasMoreListener = true;
  }

  const certsSection = document.querySelector('#certificates');
  if (certsSection && !certsSection._hasMoreListener) {
    certsSection.addEventListener('click', (e) => {
      const card = e.target.closest('#btn-open-more-certs-card') || e.target.closest('#btn-open-more-certs');
      if (card) {
        e.preventDefault();
        openCertModal();
      }
    });
    certsSection._hasMoreListener = true;
  }

  if (openProjBtn && !openProjBtn._hasListener) {
    openProjBtn.addEventListener('click', openProjModal);
    openProjBtn._hasListener = true;
  }
  if (closeProjBtn && !closeProjBtn._hasListener) {
    closeProjBtn.addEventListener('click', closeProjModal);
    closeProjBtn._hasListener = true;
  }

  if (openCertBtn && !openCertBtn._hasListener) {
    openCertBtn.addEventListener('click', openCertModal);
    openCertBtn._hasListener = true;
  }
  if (closeCertBtn && !closeCertBtn._hasListener) {
    closeCertBtn.addEventListener('click', closeCertModal);
    closeCertBtn._hasListener = true;
  }

  if (projModalOverlay && !projModalOverlay._hasListener) {
    projModalOverlay.addEventListener('click', (e) => {
      if (e.target === projModalOverlay) closeProjModal();
    });
    projModalOverlay._hasListener = true;
  }

  if (certModalOverlay && !certModalOverlay._hasListener) {
    certModalOverlay.addEventListener('click', (e) => {
      if (e.target === certModalOverlay) closeCertModal();
    });
    certModalOverlay._hasListener = true;
  }

  if (!window._modalEscListenerAttached) {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeProjModal();
        closeCertModal();
      }
    });
    window._modalEscListenerAttached = true;
  }

  if (projSearchInput && !projSearchInput._hasListener) {
    projSearchInput.addEventListener('input', () => renderMoreProjectsGrid());
    projSearchInput._hasListener = true;
  }

  if (projChipsContainer && !projChipsContainer._hasListener) {
    projChipsContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.modal-chip');
      if (!chip) return;
      projChipsContainer.querySelectorAll('.modal-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentProjFilter = chip.dataset.filter || 'all';
      renderMoreProjectsGrid();
    });
    projChipsContainer._hasListener = true;
  }

  if (certSearchInput && !certSearchInput._hasListener) {
    certSearchInput.addEventListener('input', () => renderMoreCertsGrid());
    certSearchInput._hasListener = true;
  }

  if (certChipsContainer && !certChipsContainer._hasListener) {
    certChipsContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.modal-chip');
      if (!chip) return;
      certChipsContainer.querySelectorAll('.modal-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentCertFilter = chip.dataset.filter || 'all';
      renderMoreCertsGrid();
    });
    certChipsContainer._hasListener = true;
  }

  // Modal Sync GitHub
  const modalSyncGithubBtn = document.getElementById('btn-modal-sync-github');
  if (modalSyncGithubBtn && !modalSyncGithubBtn._hasListener) {
    modalSyncGithubBtn.addEventListener('click', async () => {
      const icon = modalSyncGithubBtn.querySelector('.sync-icon');
      const text = modalSyncGithubBtn.querySelector('.sync-text');
      modalSyncGithubBtn.disabled = true;
      if (icon) icon.classList.add('spinning');
      if (text) text.textContent = 'Syncing...';
      try {
        const res = await fetch('/api/sync/github', { method: 'POST' });
        const data = await res.json();
        const refreshed = await fetchPortfolioData();
        if (refreshed) {
          hydratePortfolio(refreshed);
          renderMoreProjectsGrid();
        }
        if (text) text.textContent = data.addedCount > 0 ? `✓ +${data.addedCount} Added!` : '✓ Up to Date!';
      } catch (err) {
        if (text) text.textContent = 'Sync Notice';
      } finally {
        if (icon) icon.classList.remove('spinning');
        setTimeout(() => {
          modalSyncGithubBtn.disabled = false;
          if (text) text.textContent = 'Live GitHub Sync';
        }, 2500);
      }
    });
    modalSyncGithubBtn._hasListener = true;
  }

  // LinkedIn Sync / Ingestion Engine
  async function handleLinkedInSync(triggerBtn) {
    const btn = triggerBtn || document.getElementById('btn-modal-sync-linkedin') || document.getElementById('btn-sync-linkedin-now');
    const icon = btn?.querySelector('.sync-icon');
    const text = btn?.querySelector('.sync-text');
    
    if (btn) btn.disabled = true;
    if (icon) icon.classList.add('spinning');
    if (text) text.textContent = 'Syncing...';

    try {
      const res = await fetch('/api/sync/linkedin', { method: 'POST' });
      const data = await res.json();
      const refreshed = await fetchPortfolioData();
      if (refreshed) {
        hydratePortfolio(refreshed);
        renderMoreCertsGrid();
      }
      if (text) text.textContent = '✓ Synced with LinkedIn!';
    } catch (err) {
      if (text) text.textContent = '✓ Up to Date';
    } finally {
      if (icon) icon.classList.remove('spinning');
      setTimeout(() => {
        if (btn) btn.disabled = false;
        if (text) text.textContent = 'Sync with LinkedIn';
      }, 3000);
    }
  }

  const modalSyncLinkedinBtn = document.getElementById('btn-modal-sync-linkedin');
  if (modalSyncLinkedinBtn && !modalSyncLinkedinBtn._hasListener) {
    modalSyncLinkedinBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleLinkedInSync(modalSyncLinkedinBtn);
    });
    modalSyncLinkedinBtn._hasListener = true;
  }

  const headerSyncLinkedinBtn = document.getElementById('btn-sync-linkedin-now');
  if (headerSyncLinkedinBtn && !headerSyncLinkedinBtn._hasListener) {
    headerSyncLinkedinBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleLinkedInSync(headerSyncLinkedinBtn);
    });
    headerSyncLinkedinBtn._hasListener = true;
  }

  function renderMoreProjectsGrid() {
    const grid = document.getElementById('more-projects-grid');
    if (!grid) return;

    const query = (projSearchInput?.value || '').toLowerCase().trim();
    // Exclude projects currently shown on homepage; only display remaining in Explore All Projects
    const moreProjects = currentProjectsData.slice(HOMEPAGE_PROJECTS_COUNT);
    const filtered = moreProjects.filter(p => {
      const titleMatches = (p.title || '').toLowerCase().includes(query);
      const descMatches = (p.description || '').toLowerCase().includes(query);
      const catMatches = (p.category || p.tagline || '').toLowerCase().includes(query);
      const techStr = Array.isArray(p.technologies) ? p.technologies.join(' ') : (p.technologies || '');
      const techMatches = techStr.toLowerCase().includes(query);

      const matchesSearch = titleMatches || descMatches || catMatches || techMatches;

      if (!matchesSearch) return false;

      if (currentProjFilter === 'all') return true;
      const combinedCat = (p.category + ' ' + p.tagline + ' ' + techStr).toLowerCase();
      if (currentProjFilter === 'web') return combinedCat.includes('web') || combinedCat.includes('react') || combinedCat.includes('django') || combinedCat.includes('html');
      if (currentProjFilter === 'ai') return combinedCat.includes('ai') || combinedCat.includes('vision') || combinedCat.includes('python') || combinedCat.includes('opencv');
      if (currentProjFilter === 'simulation') return combinedCat.includes('simul') || combinedCat.includes('gravi') || combinedCat.includes('interact');
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="cert-empty-card glass-panel" style="grid-column: 1 / -1;"><p>No matching projects found for your search criteria.</p></div>`;
      return;
    }

    grid.innerHTML = filtered.map((p, idx) => {
      const thumb = resolveProjectImage(p, idx);
      const techList = Array.isArray(p.technologies) 
        ? p.technologies 
        : (typeof p.technologies === 'string' ? p.technologies.split(',').map(s => s.trim()) : []);
      const techTagsHtml = techList.map(t => `<span class="skill-tag">${escapeHtml(t)}</span>`).join('');

      const liveLinkHtml = p.liveUrl 
        ? `<a href="${escapeHtml(p.liveUrl)}" target="_blank" rel="noopener noreferrer" class="project-icon-link" title="Live Demo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>`
        : '';

      const githubLinkHtml = p.githubUrl 
        ? `<a href="${escapeHtml(p.githubUrl)}" target="_blank" rel="noopener noreferrer" class="project-icon-link" title="Source Code">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
          </a>`
        : '';

      return `
        <div class="project-card glass-panel" data-project-id="${p.id || idx}">
          <div class="project-thumb-wrap">
            <img src="${escapeHtml(thumb)}" alt="${escapeHtml(p.title)} Preview" loading="lazy" class="project-thumb" onerror="this.onerror=null; this.src='/project_gravisphere.jpg'" />
            <div class="project-thumb-overlay"></div>
          </div>
          <div class="project-body">
            <div class="project-tag-row">
              <span class="project-cat">${escapeHtml(p.category || p.tagline || 'Software Engineering')}</span>
              <div class="project-links">
                ${liveLinkHtml}
                ${githubLinkHtml}
              </div>
            </div>
            <h3 class="project-title">${escapeHtml(p.title)}</h3>
            <p class="project-desc">${escapeHtml(p.description || '')}</p>
            <div class="skill-tags">
              ${techTagsHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderMoreCertsGrid() {
    const grid = document.getElementById('more-certs-grid');
    if (!grid) return;

    const query = (certSearchInput?.value || '').toLowerCase().trim();
    // Exclude certificates currently shown on homepage; only display remaining in Explore All Credentials
    const moreCerts = currentCertsData.slice(HOMEPAGE_CERTS_COUNT);
    const filtered = moreCerts.filter(c => {
      const titleMatches = (c.title || '').toLowerCase().includes(query);
      const issuerMatches = (c.issuer || '').toLowerCase().includes(query);
      const descMatches = (c.description || '').toLowerCase().includes(query);
      const catMatches = (c.category || '').toLowerCase().includes(query);

      const matchesSearch = titleMatches || issuerMatches || descMatches || catMatches;

      if (!matchesSearch) return false;

      if (currentCertFilter === 'all') return true;
      const combined = (c.category + ' ' + c.title + ' ' + c.issuer).toLowerCase();
      if (currentCertFilter === 'ai') return combined.includes('ai') || combined.includes('intelligence') || combined.includes('python');
      if (currentCertFilter === 'web') return combined.includes('web') || combined.includes('react') || combined.includes('html');
      if (currentCertFilter === 'professional') return combined.includes('professional') || combined.includes('tcs') || combined.includes('career');
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="cert-empty-card glass-panel" style="grid-column: 1 / -1;"><p>No matching certificates found for your search criteria.</p></div>`;
      return;
    }

    grid.innerHTML = filtered.map((c, idx) => {
      const verifyBtn = c.verifyUrl 
        ? `<a href="${escapeHtml(c.verifyUrl)}" target="_blank" rel="noopener noreferrer" class="cert-verify-link">
            <span>Verify Credential</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>`
        : '';

      const fileBtn = c.fileUrl 
        ? `<a href="${escapeHtml(c.fileUrl)}" target="_blank" rel="noopener noreferrer" class="cert-doc-link" title="View Certificate Document">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <span>View Document</span>
          </a>`
        : '';

      return `
        <div class="cert-card glass-panel" data-cert-id="${c.id || idx}">
          <div class="cert-header">
            <div class="cert-badge-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 15l-2 5l9-13h-6l2-5l-9 13h6z"/>
              </svg>
            </div>
            <div class="cert-source-pill">${escapeHtml(c.source || 'Verified Credential')}</div>
          </div>
          <h3 class="cert-title">${escapeHtml(c.title)}</h3>
          <div class="cert-meta">
            <span class="cert-issuer">🏛️ ${escapeHtml(c.issuer || 'Accredited Issuer')}</span>
            ${c.date ? `<span class="cert-date">📅 ${escapeHtml(String(c.date).slice(0, 10))}</span>` : ''}
          </div>
          ${c.description ? `<p class="cert-desc">${escapeHtml(c.description)}</p>` : ''}
          <div class="cert-footer">
            <span class="cert-cat">${escapeHtml(c.category || 'Computer Science')}</span>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
              ${fileBtn}
              ${verifyBtn}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function refreshPortfolio() {
  const data = await fetchPortfolioData();
  if (data) {
    hydratePortfolio(data);
  }
  wireUpLiveSyncBtn();
}

function wireUpLiveSyncBtn() {
  const btn = document.getElementById('btn-sync-github-now');
  if (!btn || btn._hasSyncListener) return;
  btn._hasSyncListener = true;

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    const icon = btn.querySelector('.sync-icon');
    const text = btn.querySelector('.sync-text');
    btn.disabled = true;
    if (icon) icon.classList.add('spinning');
    if (text) text.textContent = 'Checking GitHub...';

    try {
      const res = await fetch('/api/sync/github', { method: 'POST' });
      const data = await res.json();
      await refreshPortfolio();
      if (text) text.textContent = data.addedCount > 0 ? `✓ +${data.addedCount} New Added!` : '✓ Up to Date!';
    } catch (err) {
      if (text) text.textContent = 'Sync notice';
    } finally {
      if (icon) icon.classList.remove('spinning');
      setTimeout(() => {
        btn.disabled = false;
        if (text) text.textContent = 'Live GitHub Sync';
      }, 2500);
    }
  });
}

// Auto-run on load and live-sync when tab is focused
if (typeof window !== 'undefined') {
  window.refreshPortfolio = refreshPortfolio;
  window.hydratePortfolio = hydratePortfolio;
  document.addEventListener('DOMContentLoaded', () => {
    refreshPortfolio();
    wireUpLiveSyncBtn();
  });
  // Also run immediately if DOM is already ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    refreshPortfolio();
    wireUpLiveSyncBtn();
  }

  // Auto-refresh when user switches back to the portfolio tab after pushing to GitHub
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      refreshPortfolio();
    }
  });

  // Background refresh every 30 seconds
  setInterval(refreshPortfolio, 30000);
}

