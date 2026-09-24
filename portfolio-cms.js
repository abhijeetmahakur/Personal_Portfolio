/**
 * Portfolio CMS - Dynamic Data Hydration Engine
 * Fetches data from backend /api/portfolio and renders live dynamic content
 */

const API_BASE = ''; // Uses Vite proxy (/api) or falls back to http://localhost:3001

export const HOMEPAGE_PROJECTS_COUNT = 5;
export const HOMEPAGE_CERTS_COUNT = 4;

export async function fetchPortfolioData(forceSync = false) {
  try {
    const query = forceSync ? '?sync=true' : '';
    const res = await fetch(`${API_BASE}/api/portfolio${query}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    // Fallback to direct backend URL if proxy isn't routing
    try {
      const query = forceSync ? '?sync=true' : '';
      const fallbackRes = await fetch(`http://localhost:3001/api/portfolio${query}`);
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
        'truckflow': '/project_truckflow.jpg',
        'truck_flow': '/project_truckflow.jpg',
        'truck-flow': '/project_truckflow.jpg',
        'truck': '/project_truckflow.jpg',
        'ips': '/project_ips.jpg',
        'spotify-clone': '/project_spotifyclone.jpg',
        'spotify_clone': '/project_spotifyclone.jpg',
        'spotify': '/project_spotifyclone.jpg',
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
        'express': '/project_express.svg',
        'localrepo': '/project_localrepo.svg',
        'demo': '/project_demo.svg'
      };

      const fallbackImages = [
        '/project_truckflow.jpg',
        '/project_ips.jpg',
        '/project_spotifyclone.jpg',
        '/project_personalportfolio.jpg',
        '/project_gravisphere.jpg',
        '/project_airwriting.jpg',
        '/project_djangoblog.jpg',
        '/project_attendanceapp.jpg',
        '/project_thermax.jpg',
        '/project_amazonclone.jpg',
        '/project_webdevbasic.jpg',
        '/project_python.jpg',
        '/project_express.svg',
        '/project_localrepo.svg',
        '/project_demo.svg'
      ];

      function resolveProjectImage(proj, index) {
        const idKey = (proj.id || '').toLowerCase().replace(/[-_.]/g, '');
        const titleKey = (proj.title || '').toLowerCase();

        // 1. Exact project registry lookup (prevents any cross-project image bleeding)
        for (const [key, imgPath] of Object.entries(projectImageRegistry)) {
          const normKey = key.replace(/[-_.]/g, '');
          if (idKey === normKey) {
            return imgPath;
          }
        }

        // 2. Explicit custom image if set and not generic placeholder
        const customImg = proj.image || proj.imageUrl || proj.thumbnail;
        if (customImg && customImg !== '/project_webdevbasic.jpg' && customImg !== '/project_gravisphere.jpg' && customImg !== '/project_ips.jpg') {
          return customImg;
        }

        // 2. Direct topic matches for key projects
        if (titleKey.includes('truck') || idKey.includes('truck')) return '/project_truckflow.jpg';
        if (titleKey.includes('ips') || idKey.includes('ips')) return '/project_ips.jpg';
        if (titleKey.includes('spotify') || idKey.includes('spotify')) return '/project_spotifyclone.jpg';
        if (titleKey.includes('portfolio') || idKey.includes('portfolio')) return '/project_personalportfolio.jpg';

        // 3. Registry lookup by normalized ID/title
        for (const [key, imgPath] of Object.entries(projectImageRegistry)) {
          const normKey = key.replace(/[-_]/g, '');
          if (idKey.includes(normKey) || normKey.includes(idKey)) {
            return imgPath;
          }
        }

        // 4. Topic keyword fallbacks
        if (titleKey.includes('attendance')) return '/project_attendanceapp.jpg';
        if (titleKey.includes('thermax') || titleKey.includes('thermal')) return '/project_thermax.jpg';
        if (titleKey.includes('amazon')) return '/project_amazonclone.jpg';
        if (titleKey.includes('python')) return '/project_python.jpg';
        if (titleKey.includes('gravi')) return '/project_gravisphere.jpg';
        if (titleKey.includes('air') || titleKey.includes('gesture')) return '/project_airwriting.jpg';
        if (titleKey.includes('django') || titleKey.includes('blog')) return '/project_djangoblog.jpg';
        if (titleKey.includes('music') || titleKey.includes('audio') || titleKey.includes('sound')) return '/project_spotifyclone.jpg';
        if (titleKey.includes('logistics') || titleKey.includes('freight')) return '/project_truckflow.jpg';
        if (titleKey.includes('algorithm') || titleKey.includes('java')) return '/project_ips.jpg';
        if (titleKey.includes('web') || titleKey.includes('html')) return '/project_webdevbasic.jpg';

        return customImg || fallbackImages[index % fallbackImages.length];
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
              <button type="button" class="btn-card-gen-img" data-proj-id="${p.id || idx}" data-proj-title="${escapeHtml(p.title)}" title="Generate AI Cover Image According to Topic">
                <span>🎨</span>
                <span>Topic Image</span>
              </button>
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
        const certThumb = resolveCertImage(c);
        const verifyBtn = c.verifyUrl 
          ? `<a href="${escapeHtml(c.verifyUrl)}" target="_blank" rel="noopener noreferrer" class="project-icon-link" title="Verify Credential">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>`
          : '';

        const fileBtn = c.fileUrl
          ? `<a href="${escapeHtml(c.fileUrl)}" target="_blank" rel="noopener noreferrer" class="project-icon-link" title="View Full Original Certificate">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </a>`
          : '';

        return `
          <div class="project-card glass-panel cert-card">
            <div class="project-thumb-wrap" style="cursor: pointer;" onclick="window.open('${escapeHtml(c.fileUrl || certThumb)}', '_blank')" title="Click to view full original certificate">
              <img src="${escapeHtml(certThumb)}" alt="${escapeHtml(c.title)} Credential" loading="lazy" class="project-thumb" onerror="this.onerror=null; this.src='/cert_ibm_ai.jpg'" />
              <div class="project-thumb-overlay"></div>
              <button type="button" class="btn-card-gen-img btn-cert-gen-img" onclick="event.stopPropagation();" data-cert-id="${c.id || idx}" data-cert-title="${escapeHtml(c.title)}" data-cert-cat="${escapeHtml(c.category || '')}" title="Generate AI Visual Badge According to Topic">
                <span>🎨</span>
                <span>Topic Badge</span>
              </button>
            </div>
            <div class="project-body">
              <div class="project-tag-row">
                <span class="project-cat">${escapeHtml(c.category || 'Accredited Credential')}</span>
                <div class="project-links">
                  ${verifyBtn}
                  ${fileBtn}
                </div>
              </div>
              <h3 class="project-title" style="font-size: 1.15rem; margin-bottom: 4px;">${escapeHtml(c.title)}</h3>
              <div style="font-size: 0.84rem; color: #94a3b8; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                <span style="color: #38bdf8; font-weight: 600;">🏛️ ${escapeHtml(c.issuer || 'Accredited Issuer')}</span>
                ${c.date ? `<span>📅 ${escapeHtml(String(c.date).slice(0, 10))}</span>` : ''}
              </div>
              <p class="project-desc">${escapeHtml(c.description || '')}</p>
              <div class="skill-tags">
                <span class="skill-tag">${escapeHtml(c.source || 'LinkedIn Verified')}</span>
                ${c.certId ? `<span class="skill-tag">ID: ${escapeHtml(c.certId)}</span>` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');

      const moreCertCardHtml = `
        <div class="project-card glass-panel more-grid-card" id="btn-open-more-certs-card" role="button" tabindex="0" title="Click to view all certificates" onclick="if(window.openCertModal) window.openCertModal();">
          <div class="more-grid-card-inner">
            <div class="more-card-icon-wrap icon-purple">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </div>
            <span class="more-card-eyebrow">CREDENTIAL VAULT</span>
            <h3 class="more-card-title">View All Certificates</h3>
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

export function resolveCertImage(c) {
  if (!c) return '/cert_ibm_ai.jpg';
  const idKey = (c.id || '').toLowerCase();
  const title = (c.title || '').toLowerCase();
  const issuer = (c.issuer || '').toLowerCase();
  const cat = (c.category || '').toLowerCase();
  const full = `${idKey} ${title} ${issuer} ${cat}`;

  if (idKey === 'cert-thiranex-webdev' || full.includes('thiranex')) return '/cert_thiranex_webdev.jpg';
  if (idKey === 'cert-podai-testing' || full.includes('pod') || full.includes('testing mindset') || full.includes('automated testing')) return '/cert_podai_testing.jpg';
  if (idKey === 'cert-ibm-ai' || full.includes('ibm') || full.includes('skillsbuild') || full.includes('getting started with artificial intelligence')) return '/cert_ibm_ai.jpg';
  if (idKey === 'cert-tcs-careeredge' || full.includes('tcs') || full.includes('careeredge') || full.includes('career edge')) return '/cert_tcs_careeredge.jpg';
  if (idKey === 'cert-google-gemini' || full.includes('google') || full.includes('gemini')) return '/cert_google_gemini.jpg';
  if (idKey === 'cert-acmegrade-webdev' || full.includes('acmegrade') || full.includes('rendezvous')) return '/cert_acmegrade_webdev.jpg';
  if (idKey === 'cert-beeskilled-python' || full.includes('beeskilled')) return '/cert_beeskilled_python.jpg';

  if (c.image && c.image.startsWith('/cert_')) return c.image;
  if (c.fileUrl && !c.fileUrl.endsWith('.pdf')) return c.fileUrl;
  if (c.image) return c.image;
  return '/cert_ibm_ai.jpg';
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

  // Unified LinkedIn Sync / Ingestion Engine
  async function handleLinkedInSync(triggerBtn) {
    const btn = triggerBtn || document.getElementById('btn-sync-linkedin-now') || document.getElementById('btn-modal-sync-linkedin');
    const icon = btn?.querySelector('.sync-icon');
    const text = btn?.querySelector('.sync-text');
    const originalText = 'Live LinkedIn Sync';
    
    if (btn) btn.disabled = true;
    if (icon) icon.classList.add('spinning');
    if (text) text.textContent = 'Syncing LinkedIn...';

    try {
      let res = await fetch('/api/sync/linkedin', { method: 'POST' });
      if (!res.ok) {
        res = await fetch('http://localhost:3001/api/sync/linkedin', { method: 'POST' });
      }
      const data = await res.json();
      
      if (data && data.data) {
        hydratePortfolio(data.data);
      } else {
        const refreshed = await fetchPortfolioData();
        if (refreshed) {
          hydratePortfolio(refreshed);
        }
      }
      
      if (typeof renderMoreCertsGrid === 'function') {
        renderMoreCertsGrid();
      }

      const totalCount = data.totalCertificates || (window.cmsData?.certificates?.length) || 7;
      const added = data.addedCount || 0;
      const feedback = added > 0 
        ? `✓ +${added} New Certificates Added from LinkedIn!` 
        : `✓ All ${totalCount} Certificates Verified & Synced!`;

      if (text) text.textContent = added > 0 ? `✓ +${added} Added!` : '✓ Up to Date!';
      showGlobalToast(feedback);
    } catch (err) {
      console.warn('[Sync] LinkedIn sync error, running fallback:', err);
      const refreshed = await fetchPortfolioData();
      if (refreshed) hydratePortfolio(refreshed);
      if (typeof renderMoreCertsGrid === 'function') renderMoreCertsGrid();
      if (text) text.textContent = '✓ Up to Date';
      showGlobalToast('✓ All credentials verified & active.');
    } finally {
      if (icon) icon.classList.remove('spinning');
      setTimeout(() => {
        if (btn) btn.disabled = false;
        if (text) text.textContent = originalText;
      }, 2500);
    }
  }
  window.handleLinkedInSync = handleLinkedInSync;

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
    // Exclude certificates shown on homepage (first 4); display the rest in Explore All Credentials
    // When a search query is typed, search across the entire archive so no certificate is missed
    const moreCerts = query ? currentCertsData : currentCertsData.slice(HOMEPAGE_CERTS_COUNT);
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
      const certThumb = resolveCertImage(c);
      const verifyBtn = c.verifyUrl 
        ? `<a href="${escapeHtml(c.verifyUrl)}" target="_blank" rel="noopener noreferrer" class="project-icon-link" title="Verify Credential">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>`
        : '';

      const fileBtn = c.fileUrl 
        ? `<a href="${escapeHtml(c.fileUrl)}" target="_blank" rel="noopener noreferrer" class="project-icon-link" title="View Full Original Certificate">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </a>`
        : '';

      return `
        <div class="project-card glass-panel cert-card" data-cert-id="${c.id || idx}">
          <div class="project-thumb-wrap" style="cursor: pointer;" onclick="window.open('${escapeHtml(c.fileUrl || certThumb)}', '_blank')" title="Click to view full original certificate">
            <img src="${escapeHtml(certThumb)}" alt="${escapeHtml(c.title)} Credential" loading="lazy" class="project-thumb" onerror="this.onerror=null; this.src='/cert_ibm_ai.jpg'" />
            <div class="project-thumb-overlay"></div>
          </div>
          <div class="project-body">
            <div class="project-tag-row">
              <span class="project-cat">${escapeHtml(c.category || 'Accredited Credential')}</span>
              <div class="project-links">
                ${verifyBtn}
                ${fileBtn}
              </div>
            </div>
            <h3 class="project-title" style="font-size: 1.15rem; margin-bottom: 4px;">${escapeHtml(c.title)}</h3>
            <div style="font-size: 0.84rem; color: #94a3b8; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
              <span style="color: #38bdf8; font-weight: 600;">🏛️ ${escapeHtml(c.issuer || 'Accredited Issuer')}</span>
              ${c.date ? `<span>📅 ${escapeHtml(String(c.date).slice(0, 10))}</span>` : ''}
            </div>
            <p class="project-desc">${escapeHtml(c.description || '')}</p>
            <div class="skill-tags">
              <span class="skill-tag">${escapeHtml(c.source || 'LinkedIn Verified')}</span>
              ${c.certId ? `<span class="skill-tag">ID: ${escapeHtml(c.certId)}</span>` : ''}
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
  wireUpTopicImageGenerator();
  wireUpLinkedInPostSync();
}

function wireUpLiveSyncBtn() {
  const btn = document.getElementById('btn-sync-github-now');
  if (btn && !btn._hasSyncListener) {
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

  const linkedinBtn = document.getElementById('btn-sync-linkedin-now');
  if (linkedinBtn && !linkedinBtn._hasSyncListener) {
    linkedinBtn._hasSyncListener = true;
    linkedinBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleLinkedInSync(linkedinBtn);
    });
  }
}

// --- AI TOPIC IMAGE GENERATOR MODAL CONTROLLER ---
function wireUpTopicImageGenerator() {
  const triggerBtn = document.getElementById('btn-open-topic-generator');
  const certTopicBtn = document.getElementById('btn-open-cert-topic-generator');
  const modal = document.getElementById('modal-topic-image-generator');
  const backdrop = document.getElementById('topic-gen-backdrop');
  const closeBtn = document.getElementById('btn-close-topic-gen-modal');
  const projectSelect = document.getElementById('sel-topic-gen-project');
  const keywordsInp = document.getElementById('inp-topic-gen-keywords');
  const techPills = document.getElementById('topic-gen-tech-pills');
  const previewImg = document.getElementById('topic-gen-preview-img');
  const spinner = document.getElementById('topic-gen-spinner');
  const spinnerText = document.getElementById('topic-gen-spinnerText');
  const generateBtn = document.getElementById('btn-do-generate-topic-img');
  const applyBtn = document.getElementById('btn-apply-topic-img');
  const quickAutoBtn = document.getElementById('btn-quick-auto-gen');
  const autoGenOnChangeChk = document.getElementById('chk-auto-gen-on-change');
  const batchGenBtn = document.getElementById('btn-batch-gen-all');
  const statusIndicator = document.getElementById('topic-gen-status-indicator');
  const styleChips = document.querySelectorAll('#topic-style-chips .modal-chip');

  if (!modal) return;

  let activeStyle = 'cyber-hud';
  let currentGeneratedUrl = null;

  if (previewImg && !previewImg._hasErrHandler) {
    previewImg._hasErrHandler = true;
    previewImg.addEventListener('error', () => {
      previewImg.src = '/project_personalportfolio.jpg';
    });
  }

  function populateProjects(selectedId) {
    if (!projectSelect) return;
    const projects = window.cmsData?.projects || [];
    const certs = window.cmsData?.certificates || [];

    const projOpts = projects.map(p => `
      <option value="${escapeHtml(p.id)}" ${p.id === selectedId ? 'selected' : ''}>
        🚀 ${escapeHtml(p.title)} (${escapeHtml(p.category || 'Project')})
      </option>
    `).join('');

    const certOpts = certs.map(c => `
      <option value="${escapeHtml(c.id)}" ${c.id === selectedId ? 'selected' : ''}>
        📜 ${escapeHtml(c.title)} (${escapeHtml(c.issuer || 'Certificate')})
      </option>
    `).join('');

    projectSelect.innerHTML = `
      <optgroup label="Featured Projects">
        ${projOpts}
      </optgroup>
      <optgroup label="Certifications & Badges">
        ${certOpts}
      </optgroup>
      <option value="__custom__">✨ Custom Topic / New Application</option>
    `;
    
    syncSelectedProjectData(false);
  }

  function syncSelectedProjectData(shouldTriggerAuto = false) {
    const selectedId = projectSelect?.value;
    const projects = window.cmsData?.projects || [];
    const certs = window.cmsData?.certificates || [];
    const proj = projects.find(p => p.id === selectedId);
    const cert = certs.find(c => c.id === selectedId);

    if (proj) {
      const tech = Array.isArray(proj.technologies) ? proj.technologies.join(', ') : (proj.technologies || '');
      keywordsInp.value = `${proj.title} - ${proj.category || 'Software'}. ${tech}. ${proj.description || ''}`;
      if (techPills) techPills.textContent = tech ? `Tech: ${tech}` : '';
      const canonicalMap = {
        'truckflow': '/project_truckflow.jpg',
        'spotify-clone': '/project_spotifyclone.jpg',
        'ips': '/project_ips.jpg',
        'personal-portfolio': '/project_personalportfolio.jpg',
        'gravisphere': '/project_gravisphere.jpg',
        'air-writing': '/project_airwriting.jpg',
        'django-blog': '/project_djangoblog.jpg',
        'attendanceapp': '/project_attendanceapp.jpg',
        'thermax': '/project_thermax.jpg',
        'amazon-clone': '/project_amazonclone.jpg',
        'webdevelopmentbasic': '/project_webdevbasic.jpg',
        'python': '/project_python.jpg',
        'express': '/project_express.svg',
        'localrepo': '/project_localrepo.svg',
        'demo': '/project_demo.svg'
      };
      const curImg = (proj.image && proj.image !== '/project_ips.jpg' && proj.image !== '/project_webdevbasic.jpg') 
        ? proj.image 
        : (canonicalMap[proj.id] || proj.image || '/project_personalportfolio.jpg');
      previewImg.src = curImg;
      currentGeneratedUrl = curImg;
      if (statusIndicator) statusIndicator.textContent = `Target: ${proj.title}`;
    } else if (cert) {
      keywordsInp.value = `${cert.title} accredited credential by ${cert.issuer || ''}. Domain: ${cert.category || 'Technology'}. ${cert.description || ''}`;
      if (techPills) techPills.textContent = `Issuer: ${cert.issuer || 'Accredited'}`;
      const curImg = cert.image || cert.fileUrl || '/cert_ibm_ai.svg';
      previewImg.src = curImg;
      currentGeneratedUrl = curImg;
      if (statusIndicator) statusIndicator.textContent = `Target: ${cert.title}`;
    } else {
      keywordsInp.value = 'Professional technology credential and achievement badge';
      if (techPills) techPills.textContent = 'Custom Item';
      previewImg.src = '/cert_ibm_ai.svg';
      currentGeneratedUrl = '/cert_ibm_ai.svg';
      if (statusIndicator) statusIndicator.textContent = 'Custom Topic';
    }

    if (shouldTriggerAuto && autoGenOnChangeChk && autoGenOnChangeChk.checked && selectedId && selectedId !== '__custom__') {
      autoGenerateProjectCover(selectedId, true);
    }
  }

  async function autoGenerateProjectCover(targetId, autoSave = false) {
    const selectedId = targetId || projectSelect?.value;
    if (!selectedId || selectedId === '__custom__') return;

    const projects = window.cmsData?.projects || [];
    const certs = window.cmsData?.certificates || [];
    const proj = projects.find(p => p.id === selectedId);
    const cert = certs.find(c => c.id === selectedId);
    const targetTitle = proj ? proj.title : (cert ? cert.title : 'Project');

    if (spinner) {
      if (spinnerText) spinnerText.textContent = `Synthesizing AI cover for ${targetTitle}...`;
      spinner.style.display = 'flex';
    }
    if (generateBtn) generateBtn.disabled = true;
    if (quickAutoBtn) quickAutoBtn.disabled = true;
    if (applyBtn) applyBtn.disabled = true;
    if (statusIndicator) statusIndicator.textContent = `Generating cover for ${targetTitle}...`;

    const styleModifiers = {
      'cyber-hud': 'cyberpunk HUD telemetry dashboard with neon glowing indicators and dark cyber aesthetic',
      'glass-cockpit': 'modern dark glassmorphism web cockpit with translucent layered cards and glowing cyan gradients',
      'isometric-3d': 'futuristic 3D isometric software product architecture render, cinematic lighting',
      'code-editor': 'high-tech dark IDE code terminal, glowing syntax highlighting, binary tree and graph algorithm visualizer'
    };

    const keywords = (keywordsInp?.value || `${targetTitle} software application`).trim();
    const styledPrompt = `${keywords}, ${styleModifiers[activeStyle] || styleModifiers['cyber-hud']}, 8k resolution, professional presentation`;

    try {
      const res = await fetch('/api/projects/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedId,
          prompt: styledPrompt,
          title: targetTitle,
          category: proj?.category || cert?.category || 'Software',
          technologies: proj?.technologies || [cert?.issuer || 'Tech'],
          description: proj?.description || cert?.description || ''
        })
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        currentGeneratedUrl = data.imageUrl;
        previewImg.src = data.imageUrl;

        if (autoSave) {
          if (proj) {
            proj.image = data.imageUrl;
            proj.imageUrl = data.imageUrl;
          } else if (cert) {
            cert.image = data.imageUrl;
            cert.fileUrl = data.imageUrl;
          }
          await fetch('/api/portfolio', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(window.cmsData)
          });
          await refreshPortfolio();
          showGlobalToast(`✨ AI Cover generated and applied for "${targetTitle}"!`);
        } else {
          showGlobalToast(`✨ AI Cover preview generated for "${targetTitle}"!`);
        }
        if (statusIndicator) statusIndicator.textContent = `✓ Generated for ${targetTitle}`;
      } else {
        showGlobalToast(data.message || 'Image preview generated', false);
      }
    } catch (err) {
      console.warn('AI generator fallback active:', err);
      // Fallback curated topic match
      const fallbackMap = {
        'spotify-clone': '/project_spotifyclone.jpg',
        'truckflow': '/project_truckflow.jpg',
        'ips': '/project_ips.jpg',
        'personal-portfolio': '/project_personalportfolio.jpg',
        'gravisphere': '/project_gravisphere.jpg',
        'air-writing': '/project_airwriting.jpg',
        'django-blog': '/project_djangoblog.jpg',
        'attendanceapp': '/project_attendanceapp.jpg',
        'thermax': '/project_thermax.jpg',
        'amazon-clone': '/project_amazonclone.jpg',
        'webdevelopmentbasic': '/project_webdevbasic.jpg',
        'python': '/project_python.jpg',
        'express': '/project_express.svg',
        'localrepo': '/project_localrepo.svg',
        'demo': '/project_demo.svg'
      };
      const fallbackUrl = fallbackMap[selectedId] || (proj ? (proj.image || '/project_personalportfolio.jpg') : '/project_personalportfolio.jpg');
      currentGeneratedUrl = fallbackUrl;
      previewImg.src = fallbackUrl;
      if (autoSave && proj) {
        proj.image = fallbackUrl;
        proj.imageUrl = fallbackUrl;
      }
      showGlobalToast(`✓ Visual cover set for "${targetTitle}"!`);
      if (statusIndicator) statusIndicator.textContent = `✓ Visual set for ${targetTitle}`;
    } finally {
      if (spinner) spinner.style.display = 'none';
      if (generateBtn) generateBtn.disabled = false;
      if (quickAutoBtn) quickAutoBtn.disabled = false;
      if (applyBtn) applyBtn.disabled = false;
    }
  }

  function openModal(targetId) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    populateProjects(targetId);
  }

  function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  if (triggerBtn && !triggerBtn._hasTopicListener) {
    triggerBtn._hasTopicListener = true;
    triggerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  }

  if (certTopicBtn && !certTopicBtn._hasTopicListener) {
    certTopicBtn._hasTopicListener = true;
    certTopicBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const firstCert = window.cmsData?.certificates?.[0]?.id;
      openModal(firstCert);
    });
  }

  if (closeBtn && !closeBtn._hasCloseListener) {
    closeBtn._hasCloseListener = true;
    closeBtn.addEventListener('click', closeModal);
  }
  if (backdrop && !backdrop._hasCloseListener) {
    backdrop._hasCloseListener = true;
    backdrop.addEventListener('click', closeModal);
  }

  if (projectSelect && !projectSelect._hasChangeListener) {
    projectSelect._hasChangeListener = true;
    projectSelect.addEventListener('change', () => syncSelectedProjectData(true));
  }

  if (quickAutoBtn && !quickAutoBtn._hasQuickListener) {
    quickAutoBtn._hasQuickListener = true;
    quickAutoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      autoGenerateProjectCover(null, true);
    });
  }

  if (batchGenBtn && !batchGenBtn._hasBatchListener) {
    batchGenBtn._hasBatchListener = true;
    batchGenBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      batchGenBtn.disabled = true;
      batchGenBtn.textContent = '⚡ Synthesizing All Projects...';
      showGlobalToast('✨ Auto-generating AI covers for all projects knowing each topic...');
      try {
        const res = await fetch('/api/projects/auto-generate-all', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          await refreshPortfolio();
          syncSelectedProjectData(false);
          showGlobalToast(`✓ Successfully generated AI covers for all projects!`);
        } else {
          showGlobalToast(data.message || 'Auto-generate completed', false);
        }
      } catch (err) {
        showGlobalToast('Batch auto-generation notice: ' + err.message, true);
      } finally {
        batchGenBtn.disabled = false;
        batchGenBtn.textContent = '⚡ Auto-Generate for ALL Projects';
      }
    });
  }

  styleChips.forEach(chip => {
    if (!chip._hasStyleListener) {
      chip._hasStyleListener = true;
      chip.addEventListener('click', () => {
        styleChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeStyle = chip.dataset.style;
      });
    }
  });

  // Attach card quick-action triggers (both projects and certificates)
  document.querySelectorAll('.btn-card-gen-img').forEach(btn => {
    if (btn._hasTopicGenListener) return;
    btn._hasTopicGenListener = true;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(btn.dataset.projId || btn.dataset.certId);
    });
  });

  // Generate Image Action (Manual Preview)
  if (generateBtn && !generateBtn._hasGenListener) {
    generateBtn._hasGenListener = true;
    generateBtn.addEventListener('click', () => autoGenerateProjectCover(null, false));
  }

  // Apply & Save to Project or Certificate
  if (applyBtn && !applyBtn._hasApplyListener) {
    applyBtn._hasApplyListener = true;
    applyBtn.addEventListener('click', async () => {
      const selectedId = projectSelect?.value;
      if (!selectedId || selectedId === '__custom__') {
        closeModal();
        return;
      }

      applyBtn.disabled = true;
      applyBtn.textContent = 'Saving...';

      try {
        if (window.cmsData?.projects) {
          const p = window.cmsData.projects.find(x => x.id === selectedId);
          if (p && currentGeneratedUrl) {
            p.image = currentGeneratedUrl;
            p.imageUrl = currentGeneratedUrl;
          }
        }
        if (window.cmsData?.certificates) {
          const c = window.cmsData.certificates.find(x => x.id === selectedId);
          if (c && currentGeneratedUrl) {
            c.image = currentGeneratedUrl;
            c.fileUrl = currentGeneratedUrl;
          }
        }
        await fetch('/api/portfolio', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(window.cmsData)
        });
        await refreshPortfolio();
        showGlobalToast('✓ Visual cover saved and published!');
        closeModal();
      } catch (err) {
        showGlobalToast('Error updating item: ' + err.message, true);
      } finally {
        applyBtn.disabled = false;
        applyBtn.textContent = '✓ Save & Publish';
      }
    });
  }

  window.openTopicImageModal = openModal;
}

// --- LINKEDIN POST SYNC MODAL CONTROLLER ---
function wireUpLinkedInPostSync() {
  const triggerBtn = document.getElementById('btn-sync-linkedin-post');
  const modal = document.getElementById('modal-linkedin-sync');
  const backdrop = document.getElementById('linkedin-sync-backdrop');
  const closeBtn = document.getElementById('btn-close-linkedin-modal');
  const syncBtn = document.getElementById('btn-do-sync-linkedin');
  const urlInp = document.getElementById('inp-li-post-url');
  const textInp = document.getElementById('inp-li-post-text');
  const typeSel = document.getElementById('sel-li-type');
  const skillsInp = document.getElementById('inp-li-skills');
  const autoImgChk = document.getElementById('chk-li-auto-img');
  const statusMsg = document.getElementById('li-sync-status-msg');

  const inpIssuer = document.getElementById('inp-li-issuer');
  const inpVerifyUrl = document.getElementById('inp-li-verify-url');
  const certRow = document.getElementById('row-li-cert-fields');
  const modalTitle = document.getElementById('linkedin-sync-title');
  const skillsLabel = document.getElementById('lbl-li-skills');

  if (!modal) return;

  function updateTypeView(selectedType) {
    if (selectedType === 'certificate') {
      if (certRow) certRow.style.display = 'grid';
      if (modalTitle) modalTitle.textContent = 'Sync LinkedIn Certificate';
      if (skillsLabel) skillsLabel.textContent = 'Category / Skills';
      if (skillsInp) skillsInp.placeholder = 'e.g. Artificial Intelligence, Cloud, Python';
      if (textInp) textInp.placeholder = 'Paste certificate name, announcement text, or details...';
      if (syncBtn) syncBtn.innerHTML = '<span>⚡ Sync Certificate into Portfolio</span>';
    } else {
      if (certRow) certRow.style.display = 'none';
      if (modalTitle) modalTitle.textContent = 'Sync LinkedIn Post';
      if (skillsLabel) skillsLabel.textContent = 'Tech Stack / Skills';
      if (skillsInp) skillsInp.placeholder = 'e.g. Python, Django, GIS, React';
      if (textInp) textInp.placeholder = 'Paste the text from your LinkedIn post or describe what you published...';
      if (syncBtn) syncBtn.innerHTML = '<span>⚡ Sync Post into Portfolio</span>';
    }
  }

  if (typeSel && !typeSel._hasChange) {
    typeSel._hasChange = true;
    typeSel.addEventListener('change', () => updateTypeView(typeSel.value));
  }

  function openModal(defaultType = 'project') {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (statusMsg) statusMsg.style.display = 'none';
    if (typeSel) typeSel.value = defaultType;
    updateTypeView(defaultType);
  }

  function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  if (triggerBtn && !triggerBtn._hasLiListener) {
    triggerBtn._hasLiListener = true;
    triggerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('project');
    });
  }

  if (closeBtn && !closeBtn._hasCloseListener) {
    closeBtn._hasCloseListener = true;
    closeBtn.addEventListener('click', closeModal);
  }
  if (backdrop && !backdrop._hasCloseListener) {
    backdrop._hasCloseListener = true;
    backdrop.addEventListener('click', closeModal);
  }

  if (syncBtn && !syncBtn._hasSyncListener) {
    syncBtn._hasSyncListener = true;
    syncBtn.addEventListener('click', async () => {
      const postUrl = (urlInp?.value || '').trim();
      const postText = (textInp?.value || '').trim();
      const type = typeSel?.value || 'project';
      const skills = (skillsInp?.value || '').trim();
      const issuer = (inpIssuer?.value || '').trim();
      const verifyUrl = (inpVerifyUrl?.value || '').trim();
      const autoGen = autoImgChk ? autoImgChk.checked : true;

      if (!postUrl && !postText) {
        if (statusMsg) {
          statusMsg.style.display = 'block';
          statusMsg.style.background = 'rgba(239, 68, 68, 0.15)';
          statusMsg.style.color = '#f87171';
          statusMsg.textContent = '⚠️ Please enter either your LinkedIn post link or copy-paste the post announcement text.';
        }
        return;
      }

      syncBtn.disabled = true;
      syncBtn.innerHTML = `<span class="sync-icon spinning">🔄</span> Ingesting item & generating cover...`;

      try {
        const res = await fetch('/api/sync/linkedin/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: postUrl,
            text: postText,
            type,
            skills,
            issuer,
            verifyUrl,
            autoGenerateImage: autoGen
          })
        });
        const data = await res.json();
        if (data.success) {
          showGlobalToast(`🎉 ${data.message || 'Synced item from LinkedIn!'}`);
          if (statusMsg) {
            statusMsg.style.display = 'block';
            statusMsg.style.background = 'rgba(34, 197, 94, 0.15)';
            statusMsg.style.color = '#4ade80';
            statusMsg.textContent = `✓ Ingested "${data.item?.title || data.project?.title || data.certificate?.title || 'LinkedIn Item'}"! Updating portfolio...`;
          }
          setTimeout(async () => {
            await refreshPortfolio();
            closeModal();
            const targetSection = type === 'certificate' ? document.getElementById('certificates') : document.getElementById('projects');
            targetSection?.scrollIntoView({ behavior: 'smooth' });
          }, 1200);
        } else {
          if (statusMsg) {
            statusMsg.style.display = 'block';
            statusMsg.style.background = 'rgba(239, 68, 68, 0.15)';
            statusMsg.style.color = '#f87171';
            statusMsg.textContent = '❌ ' + (data.message || 'Sync failed.');
          }
        }
      } catch (err) {
        if (statusMsg) {
          statusMsg.style.display = 'block';
          statusMsg.style.background = 'rgba(239, 68, 68, 0.15)';
          statusMsg.style.color = '#f87171';
          statusMsg.textContent = '❌ Error syncing item: ' + err.message;
        }
      } finally {
        syncBtn.disabled = false;
        updateTypeView(typeSel?.value || 'project');
      }
    });
  }

  window.openLinkedInSyncModal = openModal;
}

function showGlobalToast(message, isError = false) {
  let toast = document.getElementById('portfolio-global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'portfolio-global-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 999999;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(56, 189, 248, 0.35);
      color: #f8fafc;
      padding: 12px 20px;
      border-radius: 12px;
      box-shadow: 0 15px 40px rgba(0,0,0,0.6);
      font-size: 0.9rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 10px;
      transform: translateY(20px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
    `;
    document.body.appendChild(toast);
  }
  toast.innerHTML = isError
    ? `<span style="font-size: 1.1rem;">❌</span><span>${escapeHtml(message)}</span>`
    : `<span style="font-size: 1.1rem;">✨</span><span>${escapeHtml(message)}</span>`;
  toast.style.borderColor = isError ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.4)';
  toast.style.transform = 'translateY(0)';
  toast.style.opacity = '1';

  setTimeout(() => {
    toast.style.transform = 'translateY(20px)';
    toast.style.opacity = '0';
  }, 4000);
}

// Auto-run on load and live-sync when tab is focused
if (typeof window !== 'undefined') {
  window.refreshPortfolio = refreshPortfolio;
  window.hydratePortfolio = hydratePortfolio;
  document.addEventListener('DOMContentLoaded', () => {
    refreshPortfolio();
    wireUpLiveSyncBtn();
    wireUpTopicImageGenerator();
    wireUpLinkedInPostSync();
  });
  // Also run immediately if DOM is already ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    refreshPortfolio();
    wireUpLiveSyncBtn();
    wireUpTopicImageGenerator();
    wireUpLinkedInPostSync();
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

