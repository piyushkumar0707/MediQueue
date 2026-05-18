import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const DEMO_URL = 'https://medi-queue-ten.vercel.app/login';
const GITHUB_URL = 'https://github.com/piyushkumar0707/MediQueue';

// ── Animation helpers ──────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.1, ease: 'easeOut' } }),
};
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

function Section({ id, children, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section id={id} ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={stagger} className={className}>
      {children}
    </motion.section>
  );
}

// ── Reusable card ──────────────────────────────────────────────────
function Card({ children, className = '' }) {
  return (
    <motion.div variants={fadeUp} className={`bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-cyan-500/40 transition-colors duration-300 ${className}`}>
      {children}
    </motion.div>
  );
}

// ── GitHub SVG ─────────────────────────────────────────────────────
function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.167 6.839 9.49.5.09.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.934.359.31.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans antialiased overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/8' : ''}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-8">
          {/* Logo */}
          <a href="#hero" className="flex items-center gap-2 text-lg font-bold shrink-0">
            <span className="text-cyan-400 text-xl">⚕</span>
            <span>Medi<span className="text-cyan-400">Queue</span></span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1 ml-4">
            {['Problem','Features','Tech','Demo'].map(s => (
              <a key={s} href={`#${s.toLowerCase()}`} className="text-sm text-white/60 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                {s}
              </a>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hidden md:flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
              <GithubIcon /> GitHub
            </a>
            <a href={DEMO_URL} target="_blank" rel="noreferrer"
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors">
              Live Demo
            </a>
            <button className="md:hidden text-white/70" onClick={() => setMenuOpen(o => !o)}>
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {menuOpen ? <path d="M6 18L18 6M6 6l12 12"/> : <path d="M4 6h16M4 12h16M4 18h16"/>}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-[#0d0d14] border-t border-white/8 px-6 py-4 flex flex-col gap-3">
            {['Problem','Features','Tech','Demo'].map(s => (
              <a key={s} href={`#${s.toLowerCase()}`} onClick={() => setMenuOpen(false)}
                className="text-sm text-white/70 hover:text-white py-2">
                {s}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <Section id="hero" className="relative min-h-screen flex items-center justify-center pt-24 pb-20 px-6 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black,transparent)] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <motion.span variants={fadeUp}
            className="inline-block text-xs font-semibold tracking-widest uppercase text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 rounded-full px-4 py-1.5 mb-6">
            Production-Grade · Healthcare Ops · Open Source
          </motion.span>

          <motion.h1 variants={fadeUp} custom={1}
            className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
            Hospital queues,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              finally intelligent.
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2}
            className="text-lg text-white/60 max-w-xl mx-auto mb-10 leading-relaxed">
            MediQueue replaces paper slips and shouted names with real-time digital queues,
            AES-256 encrypted records, and live role-based dashboards — built on 100+ REST APIs.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex flex-wrap items-center justify-center gap-4 mb-14">
            <a href={DEMO_URL} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-7 py-3.5 rounded-xl text-base transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/25">
              Try Live Demo
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/15 font-semibold px-7 py-3.5 rounded-xl text-base transition-all hover:-translate-y-0.5">
              <GithubIcon /> View on GitHub
            </a>
          </motion.div>

          {/* Stat pills */}
          <motion.div variants={fadeUp} custom={4}
            className="inline-flex flex-wrap justify-center gap-3">
            {[
              { label: '100+ REST APIs', icon: '🔌' },
              { label: '<200ms Latency', icon: '⚡' },
              { label: 'AES-256 Encrypted', icon: '🔐' },
              { label: '4 RBAC Roles', icon: '🛡️' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white/80">
                <span>{s.icon}</span> {s.label}
              </div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ── PROBLEM ── */}
      <Section id="problem" className="py-24 px-6 bg-[#0d0d14]">
        <div className="max-w-6xl mx-auto">
          <motion.p variants={fadeUp} className="text-xs font-bold tracking-widest uppercase text-cyan-400 mb-3">The Problem</motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-black mb-4">
            Hospitals are running on<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">paper and guesswork.</span>
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-white/50 mb-14 max-w-lg">
            Every minute of inefficiency in a hospital queue costs time, money — and patient trust.
          </motion.p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '📋', title: 'Paper Slips', desc: 'Queue tokens written by hand. Lost slips = lost patients and zero traceability.' },
              { icon: '📢', title: 'Manual Calling', desc: 'Staff shout names across crowded waiting rooms. Missed calls, frustrated patients.' },
              { icon: '🚫', title: 'Zero Visibility', desc: 'Patients have no idea when they\'ll be seen. Doctors can\'t view queue state.' },
              { icon: '🔓', title: 'Unprotected Records', desc: 'Medical data in spreadsheets or unencrypted systems — a compliance disaster.' },
            ].map(c => (
              <Card key={c.title}>
                <div className="text-3xl mb-4">{c.icon}</div>
                <h3 className="font-bold text-base mb-2">{c.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{c.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* ── FEATURES ── */}
      <Section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.p variants={fadeUp} className="text-xs font-bold tracking-widest uppercase text-cyan-400 mb-3">Core Features</motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-black mb-14">
            Everything a modern hospital needs.
          </motion.h2>

          <div className="grid md:grid-cols-6 gap-4">
            {/* Large card */}
            <Card className="md:col-span-4">
              <span className="text-xs font-bold tracking-widest uppercase text-cyan-400 bg-cyan-400/10 rounded px-2 py-1">Doctors</span>
              <h3 className="text-xl font-bold mt-4 mb-2">Live Patient Queue Dashboard</h3>
              <p className="text-sm text-white/50 mb-6 leading-relaxed">
                Doctors see their full queue in real-time via Socket.io. Patient arrival, status, and priority — all in one view. Updates propagate in under 200ms.
              </p>
              {/* Mock queue */}
              <div className="flex flex-col gap-2">
                {[
                  { n: '01', name: 'Aarav Sharma', status: 'In Room', active: true },
                  { n: '02', name: 'Priya Mehta', status: 'Waiting', active: false },
                  { n: '03', name: 'Rohan Das', status: 'Waiting', active: false },
                ].map(r => (
                  <div key={r.n} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${r.active ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/8 bg-white/3'}`}>
                    <span className="font-mono text-white/40 w-6">{r.n}</span>
                    <span className="flex-1 font-medium">{r.name}</span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${r.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/12 text-amber-400'}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="md:col-span-2">
              <span className="text-xs font-bold tracking-widest uppercase text-cyan-400 bg-cyan-400/10 rounded px-2 py-1">Patients</span>
              <h3 className="text-xl font-bold mt-4 mb-2">Real-Time Position Tracking</h3>
              <p className="text-sm text-white/50 leading-relaxed">Check in digitally. Watch your queue position update live — no guessing, no desk trips.</p>
              <div className="text-6xl mt-6 font-black text-center text-cyan-400/80">#3</div>
            </Card>

            <Card className="md:col-span-2">
              <span className="text-xs font-bold tracking-widest uppercase text-purple-400 bg-purple-400/10 rounded px-2 py-1">Security</span>
              <h3 className="text-xl font-bold mt-4 mb-2">AES-256 Encrypted Vault</h3>
              <p className="text-sm text-white/50 leading-relaxed">Medical records encrypted at rest. RBAC ensures only authorised staff can access sensitive data.</p>
              <div className="text-5xl mt-4">🔐</div>
            </Card>

            <Card className="md:col-span-2">
              <span className="text-xs font-bold tracking-widest uppercase text-pink-400 bg-pink-400/10 rounded px-2 py-1">Admins</span>
              <h3 className="text-xl font-bold mt-4 mb-2">Central Operations Hub</h3>
              <p className="text-sm text-white/50 leading-relaxed">Staff accounts, appointments, audit logs, and system health — one dashboard.</p>
              <div className="text-5xl mt-4">⚙️</div>
            </Card>

            <Card className="md:col-span-2">
              <span className="text-xs font-bold tracking-widest uppercase text-amber-400 bg-amber-400/10 rounded px-2 py-1">Auth</span>
              <h3 className="text-xl font-bold mt-4 mb-2">JWT + RBAC</h3>
              <p className="text-sm text-white/50 mb-4 leading-relaxed">Four scoped roles enforced at middleware level.</p>
              <div className="flex flex-wrap gap-2">
                {[['Patient','blue'],['Doctor','emerald'],['Admin','pink'],['Super Admin','purple']].map(([r,c]) => (
                  <span key={r} className={`text-xs font-semibold px-3 py-1 rounded-full border border-${c}-500/30 bg-${c}-500/10 text-${c}-400`}>{r}</span>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </Section>

      {/* ── TECH STACK ── */}
      <Section id="tech" className="py-24 px-6 bg-[#0d0d14]">
        <div className="max-w-6xl mx-auto">
          <motion.p variants={fadeUp} className="text-xs font-bold tracking-widest uppercase text-cyan-400 mb-3">Tech Stack</motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-black mb-14">
            Production-grade architecture,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">built solo.</span>
          </motion.h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[
              { title: 'Backend', tags: ['Node.js', 'Express', 'MongoDB', 'Mongoose'] },
              { title: 'Real-time & Perf', tags: ['Socket.io', 'Redis', 'Rate Limiting'] },
              { title: 'Security', tags: ['JWT Auth', 'RBAC', 'AES-256', 'Helmet.js'] },
              { title: 'Frontend', tags: ['React 18', 'Vite', 'Tailwind CSS', 'Framer Motion'] },
              { title: 'DevOps & CI/CD', tags: ['Docker', 'GitHub Actions', 'Vercel'] },
              { title: 'APIs & Docs', tags: ['100+ REST APIs', 'Postman Collection', 'Swagger'] },
            ].map(cat => (
              <Card key={cat.title}>
                <h4 className="text-xs font-bold tracking-widest uppercase text-white/40 mb-4">{cat.title}</h4>
                <div className="flex flex-wrap gap-2">
                  {cat.tags.map(t => (
                    <span key={t} className="text-xs font-medium px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:border-cyan-500/30 hover:text-cyan-300 transition-colors cursor-default">
                      {t}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <motion.div variants={fadeUp}
            className="flex flex-wrap items-center gap-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl px-6 py-4">
            <span className="text-xs font-bold tracking-widest uppercase text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded">API</span>
            <code className="font-mono text-sm text-cyan-300">GET /api/queue/:doctorId/live</code>
            <span className="text-sm text-white/40">→ Returns live queue with Socket.io push updates</span>
          </motion.div>
        </div>
      </Section>

      {/* ── DEMO ── */}
      <Section id="demo" className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div variants={fadeUp}
            className="relative bg-white/4 border border-white/10 rounded-3xl p-10 md:p-16 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-40 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <p className="text-xs font-bold tracking-widest uppercase text-cyan-400 mb-3">Live Demo</p>
              <h2 className="text-3xl md:text-4xl font-black mb-4">See it running in production.</h2>
              <p className="text-white/50 mb-8">Explore all four role dashboards with test credentials — no setup needed.</p>

              {/* Credentials table */}
              <div className="bg-black/30 border border-white/8 rounded-2xl overflow-hidden mb-8 text-left">
                <div className="grid grid-cols-2 text-xs font-bold uppercase tracking-widest text-white/30 px-5 py-3 border-b border-white/8">
                  <span>Role</span><span>Credentials</span>
                </div>
                {[
                  { role: 'Patient', email: 'patient@demo.com', pass: 'Demo@123', color: 'text-blue-400' },
                  { role: 'Doctor', email: 'doctor@demo.com', pass: 'Demo@123', color: 'text-emerald-400' },
                  { role: 'Admin', email: 'admin@demo.com', pass: 'Demo@123', color: 'text-pink-400' },
                ].map((c, i) => (
                  <div key={c.role} className={`grid grid-cols-2 px-5 py-3.5 text-sm ${i < 2 ? 'border-b border-white/8' : ''}`}>
                    <span className={`font-bold ${c.color}`}>{c.role}</span>
                    <span className="font-mono text-white/60 text-xs">{c.email} / {c.pass}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                <a href={DEMO_URL} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-8 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/25">
                  Open Live Demo →
                </a>
                <a href={GITHUB_URL} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/15 font-semibold px-8 py-3.5 rounded-xl transition-all hover:-translate-y-0.5">
                  <GithubIcon /> Star on GitHub
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/8 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-base font-bold">
            <span className="text-cyan-400">⚕</span>
            Medi<span className="text-cyan-400">Queue</span>
          </div>
          <p className="text-sm text-white/40">
            Built by <span className="text-white/70 font-medium">Piyush Kumar Singh</span> · Full-Stack Developer
          </p>
          <div className="flex gap-5">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-sm text-white/40 hover:text-white transition-colors">GitHub</a>
            <a href={DEMO_URL} target="_blank" rel="noreferrer" className="text-sm text-white/40 hover:text-white transition-colors">Live Demo</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
