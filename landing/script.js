// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

// ===== HAMBURGER =====
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

// ===== REVEAL ON SCROLL =====
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger siblings within same parent
        const siblings = [...entry.target.parentElement.querySelectorAll('.reveal')];
        const idx = siblings.indexOf(entry.target);
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, idx * 80);
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ===== LIVE QUEUE ANIMATION =====
const queueItems = document.querySelectorAll('.queue-item');
if (queueItems.length) {
  let activeIdx = 0;
  setInterval(() => {
    queueItems.forEach(item => {
      item.classList.remove('active');
      item.querySelector('.q-status').className = 'q-status status-wait';
      item.querySelector('.q-status').textContent = 'Waiting';
    });
    queueItems[activeIdx].classList.add('active');
    queueItems[activeIdx].querySelector('.q-status').className = 'q-status status-in';
    queueItems[activeIdx].querySelector('.q-status').textContent = 'In Room';
    activeIdx = (activeIdx + 1) % queueItems.length;
  }, 2200);
}

// ===== SMOOTH ACTIVE NAV =====
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
const scrollSpy = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.style.color = link.getAttribute('href') === `#${entry.target.id}`
            ? 'var(--text)' : '';
        });
      }
    });
  },
  { threshold: 0.4 }
);
sections.forEach(s => scrollSpy.observe(s));

// ===== TECH PILLS HOVER GLOW =====
document.querySelectorAll('.tech-pill').forEach(pill => {
  pill.addEventListener('mouseenter', () => {
    pill.style.boxShadow = '0 0 12px rgba(59,130,246,0.25)';
  });
  pill.addEventListener('mouseleave', () => {
    pill.style.boxShadow = '';
  });
});

// ===== STAT NUMBER COUNTER =====
function animateCounter(el, target, suffix = '') {
  let start = 0;
  const isAlpha = isNaN(parseInt(target));
  if (isAlpha) return;
  const num = parseInt(target);
  const duration = 1200;
  const step = duration / 60;
  const increment = num / (duration / step);
  const timer = setInterval(() => {
    start += increment;
    if (start >= num) { start = num; clearInterval(timer); }
    el.textContent = Math.floor(start) + suffix;
  }, step);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    statsObserver.unobserve(entry.target);
    entry.target.querySelectorAll('.stat-num').forEach(el => {
      const text = el.textContent;
      if (text.startsWith('<')) animateCounter(el, 200, 'ms'); // skip for <200ms label
    });
  });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObserver.observe(heroStats);
