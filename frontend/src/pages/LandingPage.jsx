import { useState, useEffect, useRef } from 'react';
import { motion, useInView, animate } from 'framer-motion';

const DEMO_URL  = 'https://medi-queue-ten.vercel.app/login';
const GITHUB_URL = 'https://github.com/piyushkumar0707/MediQueue';

// ── Tokens (mirrors the CSS vars in the standalone HTML) ─────────────
const C = {
  bg:      '#0a0c0e',
  bg2:     '#0e1012',
  bg3:     '#111316',
  fg:      '#e8e4dc',
  fgDim:   '#8a877f',
  fgMuted: '#3a3830',
  accent:  '#00c2a8',
  border:  '#1e2124',
  border2: '#2a2d31',
};

// ── Variant presets ───────────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.65, delay: d, ease: [0.16, 1, 0.3, 1] } }),
};
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

// ── useScrollReveal ───────────────────────────────────────────────────
function useReveal(margin = '-80px') {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin });
  return { ref, inView };
}

// ── Count-up hook ─────────────────────────────────────────────────────
function useCountUp(target, duration = 1200, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    const controls = animate(0, target, {
      duration: duration / 1000,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: v => setVal(Math.round(v)),
    });
    return controls.stop;
  }, [target, duration, start]);
  return val;
}

// ── Shared border/accent line card ────────────────────────────────────
function BorderCard({ children, className = '', style = {} }) {
  return (
    <div
      className={`relative border transition-colors duration-200 group ${className}`}
      style={{ borderColor: C.border2, background: C.bg2, ...style }}
    >
      <div
        className="absolute top-0 left-0 w-0 h-[3px] group-hover:w-full transition-all duration-500"
        style={{ background: C.accent }}
      />
      {children}
    </div>
  );
}

// ── Eyebrow label ─────────────────────────────────────────────────────
function Eyebrow({ children }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="inline-block w-6 h-px" style={{ background: C.accent }} />
      <span
        className="font-mono text-[10px] tracking-[0.18em] uppercase"
        style={{ color: C.accent }}
      >
        {children}
      </span>
    </div>
  );
}

// ── Queue widget (hero right panel) ──────────────────────────────────
const NAMES = [
  ['Arjun Mehta', 'General Medicine'],
  ['Priya Nair', 'Cardiology'],
  ['Rohan Singh', 'Orthopaedics'],
  ['Fatima Khan', 'Dermatology'],
  ['Suresh Iyer', 'Neurology'],
  ['Ananya Gupta', 'Gynaecology'],
  ['Ravi Kumar', 'Ophthalmology'],
];

const SOCKET_EVENTS = [
  { color: C.accent,   text: 'queue:position_update · patient#P-0048 → pos=4' },
  { color: C.fgDim,    text: 'queue:notify_next · patient#P-0047 → "You are next"' },
  { color: C.accent,   text: 'queue:called · token#Q-0007 → dr.sharma' },
  { color: '#e8b64a',  text: 'queue:position_update · patient#P-0049 → pos=3' },
  { color: C.fgDim,    text: 'health_vault:consent_revoke · patient#P-0031' },
  { color: '#6bcc82',  text: 'queue:joined · patient#P-0052 · dept=cardiology' },
  { color: C.accent,   text: 'queue:position_update · patient#P-0048 → pos=3' },
  { color: C.fgDim,    text: 'auth:mfa_verified · user#U-0019 · method=totp' },
  { color: '#e8b64a',  text: 'triage:assessment · patient#P-0052 → level=URGENT' },
  { color: C.accent,   text: 'queue:served · token#Q-0007 · duration=8m22s' },
];

function QueueWidget() {
  const [token, setToken]     = useState(7);
  const [rows,  setRows]      = useState(NAMES.slice(0, 4));
  const [logs,  setLogs]      = useState([]);
  const [logIdx, setLogIdx]   = useState(0);
  const [started, setStarted] = useState(false);
  const counterVal            = useCountUp(7, 1200, started);
  const { ref, inView }       = useReveal('-40px');

  useEffect(() => { if (inView) setStarted(true); }, [inView]);

  // Queue cycle
  useEffect(() => {
    const id = setInterval(() => {
      setToken(t => {
        const next = t + 1;
        setRows(NAMES.slice(next % NAMES.length, (next % NAMES.length) + 4).concat(
          NAMES.slice(0, Math.max(0, 4 - (NAMES.length - (next % NAMES.length))))
        ).slice(0, 4));
        return next;
      });
    }, 6000);
    return () => clearInterval(id);
  }, []);

  // Socket log feed
  useEffect(() => {
    const push = () => {
      const ev  = SOCKET_EVENTS[logIdx % SOCKET_EVENTS.length];
      const ts  = new Date().toISOString().substring(11, 19);
      setLogs(prev => [...prev.slice(-4), { ts, ...ev, id: Date.now() }]);
      setLogIdx(i => i + 1);
    };
    for (let i = 0; i < 4; i++) setTimeout(push, i * 350);
    const id = setInterval(push, 2200);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayToken = started ? counterVal : '—';

  return (
    <div ref={ref} className="flex flex-col gap-5">
      {/* Live queue card */}
      <div className="border overflow-hidden" style={{ borderColor: C.border2, background: C.bg2 }}>
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: C.border, background: C.bg3 }}>
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase" style={{ color: C.fgDim }}>CareQueue · Live Feed</span>
          <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.1em]" style={{ color: C.accent }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.accent }} />
            LIVE
          </span>
        </div>
        <div className="p-5">
          <div className="text-center pb-5 mb-5 border-b" style={{ borderColor: C.border }}>
            <div className="font-mono text-[10px] tracking-[0.14em] uppercase mb-2" style={{ color: C.fgMuted }}>Now Serving</div>
            <div className="font-mono font-semibold leading-none tracking-tight tabular-nums" style={{ fontSize: 64, color: C.accent }}>
              #{String(started ? counterVal : 7).padStart(2, '0')}
            </div>
            <div className="font-mono text-[10px] mt-1.5" style={{ color: C.fgDim }}>General Medicine · Dr. Sharma</div>
          </div>
          <div className="flex flex-col gap-2">
            {rows.map((r, i) => {
              const num = token + i;
              const isActive = i === 0;
              const badge = i === 0 ? 'Calling' : i === 1 ? 'Next' : 'Waiting';
              const badgeColor = i === 0 ? C.accent : i === 1 ? '#e8b64a' : C.fgMuted;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between px-3.5 py-2.5 border transition-colors duration-300"
                  style={{
                    borderColor: isActive ? C.accent : C.border,
                    background:  isActive ? 'rgba(0,194,168,0.04)' : C.bg,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold" style={{ color: C.accent, minWidth: 28 }}>
                      #{String(num).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="text-xs font-medium" style={{ color: C.fg }}>{r[0]}</div>
                      <div className="font-mono text-[10px]" style={{ color: C.fgDim }}>{r[1]}</div>
                    </div>
                  </div>
                  <span
                    className="font-mono text-[9px] tracking-[0.08em] uppercase px-2 py-0.5 border"
                    style={{ color: badgeColor, borderColor: badgeColor,
                      animation: i === 0 ? 'pulse 1.4s ease-in-out infinite' : undefined }}
                  >
                    {badge}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Socket.io event log */}
      <div className="border p-4" style={{ borderColor: C.border2, background: C.bg2 }}>
        <div className="font-mono text-[9px] tracking-[0.14em] uppercase mb-3" style={{ color: C.fgMuted }}>Socket.io Event Stream</div>
        <div className="flex flex-col gap-0">
          {logs.map((l) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="font-mono text-[10px] leading-[1.9]"
            >
              <span style={{ color: C.fgMuted }}>[{l.ts}]</span>{' '}
              <span style={{ color: l.color }}>{l.text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Audit log entries ─────────────────────────────────────────────────
const AUDIT_ENTRIES = [
  {
    ts: '2026-06-06T15:44:02Z', action: 'RECORD_ACCESS',
    lines: [
      'actor: <u>dr.sharma@mediqueue</u> · record: <u>MRN-00481</u> · consent: <ok>GRANTED</ok>',
      'hash: <hash>sha256:a3f9c2d1e8b74f6a2c1d9e3f8a2b1c4d5e6f7a8b9c0d1e2f</hash>',
    ],
  },
  {
    ts: '2026-06-06T15:44:18Z', action: 'CONSENT_REVOKE',
    lines: [
      'actor: <u>patient.mehta@mediqueue</u> · revoked: <u>dr.verma</u> · scope: <u>MRN-00481/lab-results</u>',
      'hash: <hash>sha256:b4e0d3f2f9c85a7b3d2e0f4a9b3c5d6e7f8a9b0c1d2e3f4</hash>',
    ],
  },
  {
    ts: '2026-06-06T15:46:55Z', action: 'EMERGENCY_ACCESS_REQ',
    lines: [
      'actor: <u>dr.patel@mediqueue</u> · reason: <warn>"Acute cardiac event — patient unconscious"</warn>',
      'status: <warn>PENDING_ADMIN_REVIEW</warn> · ttl: 3600s',
      'hash: <hash>sha256:c5f1e4a3a0d96b8c4e3f1a5b0c4d7e8f9a0b1c2d3e4f5a6</hash>',
    ],
  },
  {
    ts: '2026-06-06T15:47:11Z', action: 'EMERGENCY_ACCESS_APPROVED',
    lines: [
      'reviewer: <u>admin.ops@mediqueue</u> · granted to: <u>dr.patel</u> · duration: <warn>60min</warn>',
      'hash: <hash>sha256:d6a2f5b4b1e07c9d5f4a2b6c1d5e9f0a1b2c3d4e5f6a7b8</hash>',
    ],
  },
  {
    ts: '2026-06-06T15:51:03Z', action: 'INTEGRITY_CHECK',
    lines: [
      'verifier: <u>system.integrity-daemon</u> · entries_verified: <u>1,842</u>',
      'chain_status: <ok>✓ ALL HASHES VALID — NO TAMPERING DETECTED</ok>',
    ],
  },
];

function renderAuditLine(line) {
  return line
    .replace(/<hash>(.*?)<\/hash>/g, `<span style="color:${C.accent};word-break:break-all;">$1</span>`)
    .replace(/<ok>(.*?)<\/ok>/g,     `<span style="color:#6bcc82;">$1</span>`)
    .replace(/<warn>(.*?)<\/warn>/g, `<span style="color:#e8b64a;">$1</span>`)
    .replace(/<u>(.*?)<\/u>/g,       `<span style="color:${C.fg};">$1</span>`);
}

function AuditLog() {
  const { ref, inView } = useReveal('-60px');
  return (
    <div ref={ref} className="border overflow-hidden" style={{ borderColor: C.border2, background: C.bg2 }}>
      <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: C.border, background: C.bg3 }}>
        <span className="font-mono text-[10px] tracking-[0.12em] uppercase" style={{ color: C.fgDim }}>system.audit.chain · mediqueue-prod</span>
        <span className="font-mono text-[9px]" style={{ color: C.accent }}>✓ CHAIN INTACT</span>
      </div>
      <div className="p-5 flex flex-col gap-0">
        {AUDIT_ENTRIES.map((e, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: i * 0.15, duration: 0.4 }}
            className="py-3 border-b font-mono text-[11px] leading-[1.6]"
            style={{ borderColor: C.border }}
          >
            <div>
              <span style={{ color: C.fgMuted }}>[{e.ts}]</span>{' '}
              <span style={{ color: C.fgDim }}>{e.action}</span>
            </div>
            {e.lines.map((l, j) => (
              <div key={j} dangerouslySetInnerHTML={{ __html: renderAuditLine(l) }} />
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Bar chart ─────────────────────────────────────────────────────────
const BAR_DATA = [40, 62, 55, 80, 95, 72, 88];
const BAR_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function BarChart() {
  const { ref, inView } = useReveal('-60px');
  const served = useCountUp(247, 1400, inView);
  return (
    <div>
      <div className="border p-6" style={{ borderColor: C.border2, background: C.bg2 }}>
        <div className="flex items-start justify-between mb-5">
          <span className="font-mono text-[10px] tracking-[0.12em] uppercase" style={{ color: C.fgDim }}>Patients Served Today</span>
          <span className="font-mono font-semibold text-3xl leading-none tabular-nums" style={{ color: C.accent }}>{served}</span>
        </div>
        <div ref={ref} className="flex items-end gap-1.5" style={{ height: 100 }}>
          {BAR_DATA.map((h, i) => (
            <div key={i} className="flex-1 relative" style={{ background: C.border }}>
              <motion.div
                className="absolute bottom-0 left-0 right-0"
                style={{ background: C.accent }}
                initial={{ height: 0 }}
                animate={inView ? { height: `${h}%` } : { height: 0 }}
                transition={{ delay: i * 0.08, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 mt-2">
          {BAR_DAYS.map(d => (
            <div key={d} className="flex-1 font-mono text-[9px] text-center" style={{ color: C.fgMuted }}>{d}</div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 border border-t-0" style={{ borderColor: C.border2 }}>
        {[['98.4%','Queue SLA met'],['0','Chain violations'],['1,842','Audit entries'],['3','Active doctors']].map(([v,l],i) => (
          <div key={i} className="p-4 border-b border-r last:border-r-0 [&:nth-child(3)]:border-b-0 [&:nth-child(4)]:border-b-0" style={{ borderColor: C.border }}>
            <div className="font-mono font-semibold text-xl" style={{ color: C.accent }}>{v}</div>
            <div className="font-mono text-[10px] mt-1" style={{ color: C.fgDim }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('carequeue');

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Stats reveal
  const statsRef  = useRef(null);
  const statsView = useInView(statsRef, { once: true, margin: '-60px' });
  const routeCount = useCountUp(116, 1000, statsView);
  const roleCount  = useCountUp(3,   900,  statsView);

  return (
    <div
      className="min-h-screen font-sora antialiased overflow-x-hidden"
      style={{ background: C.bg, color: C.fg }}
    >
      {/* ── NAV ── */}
      <nav
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between h-[60px] px-12 transition-all duration-300"
        style={{
          borderBottom: `1px solid ${scrolled ? C.border : 'transparent'}`,
          background:    scrolled ? 'rgba(10,12,14,0.9)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
        }}
      >
        <a href="#hero" className="font-mono text-[13px] font-medium tracking-[0.08em] no-underline" style={{ color: C.fg }}>
          Medi<span style={{ color: C.accent }}>Queue</span>
        </a>
        <div className="hidden md:flex items-center gap-8">
          {[['System','#features'],['Vault','#vault'],['AI Triage','#ai-triage'],['Security','#auth'],['Demo','#demo']].map(([l,h]) => (
            <a key={l} href={h} className="font-mono text-[11px] tracking-[0.1em] uppercase transition-colors duration-150 no-underline hover:opacity-100" style={{ color: C.fgDim }}>
              {l}
            </a>
          ))}
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="font-mono text-[11px] tracking-[0.1em] uppercase no-underline transition-colors" style={{ color: C.fgDim }}>
            GitHub
          </a>
          <a
            href={DEMO_URL} target="_blank" rel="noreferrer"
            className="font-mono text-[11px] tracking-[0.1em] uppercase no-underline px-4 py-1.5 border transition-colors duration-150"
            style={{ color: C.accent, borderColor: C.accent }}
            onMouseEnter={e => { e.target.style.background = C.accent; e.target.style.color = C.bg; }}
            onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = C.accent; }}
          >
            Live Demo
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        id="hero"
        className="min-h-screen grid pt-[60px]"
        style={{ gridTemplateColumns: '1fr 420px', borderBottom: `1px solid ${C.border}` }}
      >
        {/* Left */}
        <motion.div
          initial="hidden" animate="visible" variants={stagger}
          className="flex flex-col justify-center px-12 py-20"
          style={{ borderRight: `1px solid ${C.border}`, paddingRight: 64 }}
        >
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-7">
            <span className="inline-block w-6 h-px" style={{ background: C.accent }} />
            <span className="font-mono text-[11px] tracking-[0.18em] uppercase" style={{ color: C.accent }}>
              MediQueue · Healthcare Ops Platform
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp} custom={0.08}
            className="font-serif leading-[1.02] mb-8"
            style={{ fontSize: 'clamp(52px,6.5vw,92px)', letterSpacing: '-0.01em', color: C.fg }}
          >
            The Waiting<br />Room<br />
            <em style={{ fontStyle: 'italic', color: C.accent }}>Is Obsolete.</em>
          </motion.h1>

          <motion.p
            variants={fadeUp} custom={0.16}
            className="font-mono text-[12px] leading-[1.9] mb-14"
            style={{ maxWidth: 480, color: C.fgDim, borderLeft: `2px solid ${C.fgMuted}`, paddingLeft: 20 }}
          >
            // CareQueue + Health Vault<br />
            // Real-time digital queuing · AES-256-GCM encrypted records<br />
            // Three roles · One platform · Zero compromise
          </motion.p>

          <motion.div variants={fadeUp} custom={0.24} className="flex items-center gap-5 flex-wrap">
            <a
              href={DEMO_URL} target="_blank" rel="noreferrer"
              className="font-mono text-[12px] font-medium tracking-[0.1em] uppercase no-underline px-8 py-3.5 border transition-colors duration-150"
              style={{ background: C.accent, color: C.bg, borderColor: C.accent }}
              onMouseEnter={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.accent; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.accent; e.currentTarget.style.color = C.bg; }}
            >
              View Live Demo
            </a>
            <a
              href={GITHUB_URL} target="_blank" rel="noreferrer"
              className="font-mono text-[12px] tracking-[0.1em] uppercase no-underline px-8 py-3.5 border transition-colors duration-200"
              style={{ background: 'transparent', color: C.fgDim, borderColor: C.border2 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.fgDim; e.currentTarget.style.color = C.fg; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.fgDim; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ verticalAlign: -2, marginRight: 8, display: 'inline' }}>
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </a>
          </motion.div>
        </motion.div>

        {/* Right — Queue widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col justify-center py-20 px-12"
        >
          <QueueWidget />
        </motion.div>
      </section>

      {/* ── STATS BAND ── */}
      <div
        ref={statsRef}
        className="grid"
        style={{ gridTemplateColumns: 'repeat(3,1fr)', borderBottom: `1px solid ${C.border}` }}
      >
        {[
          {
            val: statsView ? `${roleCount} roles` : '0 roles',
            label: 'User Roles',
            desc: 'Patient · Doctor · Admin — each with a dedicated, permission-scoped dashboard.',
          },
          {
            val: statsView ? `${routeCount} routes` : '0 routes',
            label: 'API Endpoints',
            desc: 'Across 12 route modules — auth, queue, records, consent, audit, emergency, analytics & more.',
          },
          {
            val: 'AES-256-GCM',
            label: 'Encryption Standard',
            desc: 'Military-grade encryption for every Health Vault record. Patient-owned keys, consent-gated access.',
          },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={statsView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="group relative px-12 py-11 overflow-hidden transition-colors duration-300 cursor-default"
            style={{
              borderRight: i < 2 ? `1px solid ${C.border}` : 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.bg2; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div
              className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500"
              style={{ background: C.accent }}
            />
            <div className="font-mono font-semibold leading-none tracking-tight tabular-nums mb-2.5"
              style={{ fontSize: 'clamp(26px,3.2vw,46px)', color: C.accent }}>
              {s.val}
            </div>
            <div className="font-mono text-[11px] tracking-[0.1em] uppercase mb-2" style={{ color: C.fgDim }}>{s.label}</div>
            <p className="text-[13px] leading-relaxed" style={{ color: C.fgDim }}>{s.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* ── FEATURES / SYSTEM ── */}
      <section id="features" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="px-12 pt-20 pb-16">
          <Eyebrow>System Architecture</Eyebrow>
          <h2 className="font-serif leading-[1.08]" style={{ fontSize: 'clamp(34px,4vw,58px)', color: C.fg }}>
            Two systems.<br />One platform.
          </h2>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', borderTop: `1px solid ${C.border}` }}>
          {/* Left — tabbed */}
          <div style={{ borderRight: `1px solid ${C.border}` }}>
            {/* Tab list */}
            <div className="flex" style={{ borderBottom: `1px solid ${C.border}` }}>
              {[['carequeue','CareQueue'],['healthvault','Health Vault']].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="font-mono text-[10px] tracking-[0.12em] uppercase px-6 py-4 border-b-2 transition-colors duration-150 bg-transparent cursor-pointer"
                  style={{
                    color:       activeTab === id ? C.accent  : C.fgDim,
                    borderColor: activeTab === id ? C.accent  : 'transparent',
                    borderBottom: `2px solid ${activeTab === id ? C.accent : 'transparent'}`,
                    marginBottom: -1,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* CareQueue panel */}
            {activeTab === 'carequeue' && (
              <div className="px-10 pb-10">
                {[
                  { idx: '01', sub: 'Real-Time Queue Engine', title: 'Server-Pushed Position Updates', desc: 'Socket.io persistent connections push queue state to every connected patient. No polling. No refresh. Patients track their live position from anywhere — home, parking lot, another floor.' },
                  { idx: '02', sub: 'Remote Join',            title: 'Eliminate the Physical Waiting Room', desc: 'Patients join from their phone before arriving. The system estimates wait time, notifies when next, and lets them arrive on time — no crowded lobbies.' },
                  { idx: '03', sub: 'Doctor Controls',        title: 'Call · Skip · Defer from Dashboard', desc: 'Doctors manage their queue in real time. Every action triggers an immediate push to all affected patients. The admin panel reflects every state change with an audit timestamp.' },
                ].map((f, i) => (
                  <div key={i} className="pt-8 pb-8 border-b last:border-b-0" style={{ borderColor: C.border }}>
                    <div className="font-mono text-[11px] mb-3" style={{ color: C.accent }}>[ {f.idx} ] {f.sub}</div>
                    <div className="font-serif text-xl mb-2.5 leading-snug" style={{ color: C.fg }}>{f.title}</div>
                    <p className="text-[13px] leading-[1.75]" style={{ color: C.fgDim }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Health Vault panel */}
            {activeTab === 'healthvault' && (
              <div className="px-10 pb-10">
                {[
                  { idx: '01', sub: 'Granular Consent',    title: 'Per-Doctor, Per-Record Access Control', desc: 'Patients grant or revoke consent on individual records — not blanket access. A cardiologist sees only what you\'ve authorized. Revoke instantly. Every consent event is timestamped and immutable.' },
                  { idx: '02', sub: 'Encrypted Storage',   title: 'AES-256-GCM · Field-Level Encryption',  desc: 'Every medical record is encrypted at field level before storage. MongoDB never sees plaintext. The encryption key lifecycle is patient-controlled, not server-controlled.' },
                  { idx: '03', sub: 'Audit Trail',         title: 'SHA-256 Integrity · Tamper-Evident Logs', desc: 'Every access, share, and modification generates a log entry chained with a SHA-256 hash. Any tampering with historical entries invalidates the chain — detectable immediately.' },
                ].map((f, i) => (
                  <div key={i} className="pt-8 pb-8 border-b last:border-b-0" style={{ borderColor: C.border }}>
                    <div className="font-mono text-[11px] mb-3" style={{ color: C.accent }}>[ {f.idx} ] {f.sub}</div>
                    <div className="font-serif text-xl mb-2.5 leading-snug" style={{ color: C.fg }}>{f.title}</div>
                    <p className="text-[13px] leading-[1.75]" style={{ color: C.fgDim }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — role matrix */}
          <div className="p-12">
            <div className="font-mono text-[10px] tracking-[0.16em] uppercase mb-6" style={{ color: C.accent }}>User Role Matrix</div>
            {[
              { role: 'Patient', tag: 'Self-Service', perms: ['Join queue remotely — track live position','Upload & manage encrypted health records','Grant / revoke per-doctor consent on individual records','View full access audit trail for own records','Receive real-time notifications when called'] },
              { role: 'Doctor',  tag: 'Clinical Access', perms: ['Manage live queue — call, skip, defer patients','View consented patient records only','Emergency access with mandatory admin review trail','AI triage advisory — human override preserved','Session-limited record access windows'] },
              { role: 'Admin',   tag: 'Oversight',    perms: ['Full analytics dashboard — queue & vault metrics','Review emergency access requests & approve/deny','Audit log inspector with SHA-256 chain verification','User management — roles, suspensions, MFA status','System health monitoring & Redis cache metrics'] },
            ].map((r, i) => (
              <div
                key={i}
                className="mb-4 border overflow-hidden transition-colors duration-200 group cursor-default"
                style={{ borderColor: C.border2 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; }}
              >
                <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ background: C.bg3, borderColor: C.border }}>
                  <span className="font-mono text-[11px] font-semibold tracking-[0.1em] uppercase" style={{ color: C.fg }}>{r.role}</span>
                  <span className="font-mono text-[9px] tracking-[0.1em] uppercase px-2.5 py-0.5 border" style={{ color: C.accent, borderColor: C.accent }}>{r.tag}</span>
                </div>
                <div className="px-5 py-4" style={{ background: C.bg2 }}>
                  <ul className="flex flex-col gap-1.5 list-none">
                    {r.perms.map((p, j) => (
                      <li key={j} className="font-mono text-[11px] flex gap-2" style={{ color: C.fgDim }}>
                        <span style={{ color: C.accent }}>→</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HEALTH VAULT ── */}
      <section
        id="vault"
        className="grid"
        style={{ gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${C.border}` }}
      >
        <div className="px-12 py-20" style={{ borderRight: `1px solid ${C.border}`, paddingRight: 64 }}>
          <Eyebrow>Health Vault</Eyebrow>
          <h2 className="font-serif leading-[1.1] mb-6" style={{ fontSize: 'clamp(30px,3.5vw,50px)', color: C.fg }}>
            Your records.<br />Your keys.<br /><em style={{ fontStyle: 'italic', color: C.accent }}>Your consent.</em>
          </h2>
          <p className="text-[14px] leading-[1.85] mb-10" style={{ color: C.fgDim }}>
            Health Vault treats medical data as patient property — not hospital property. Encryption happens before storage. No plaintext ever reaches the database. Doctors see only what you explicitly authorize, for as long as you allow.
          </p>
          <div className="flex flex-col">
            {[
              { key: 'Encryption',    val: 'AES-256-GCM — authenticated encryption with associated data. Each record encrypted with a unique IV. Integrity verified on every read.' },
              { key: 'Consent Model', val: 'Granular per-doctor, per-record ACL. Consent grants are time-scoped and revocable. Revocation takes effect immediately — mid-session.' },
              { key: 'Audit Chain',   val: 'Every access logged with SHA-256 hash chaining. Immutable. Any modification to historical entries breaks the integrity chain.' },
              { key: 'Emergency',     val: 'Doctors can request emergency access to unconsented records. Access is logged, time-limited, and queued for mandatory admin review.' },
            ].map((s, i) => (
              <div key={i} className="flex gap-5 py-5 border-b last:border-b-0" style={{ borderColor: C.border }}>
                <span className="font-mono text-[10px] tracking-[0.12em] uppercase pt-0.5 shrink-0" style={{ color: C.accent, minWidth: 120 }}>{s.key}</span>
                <span className="text-[13px] leading-[1.65]" style={{ color: C.fg }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-12 py-20" style={{ paddingLeft: 64 }}>
          <div className="font-mono text-[10px] tracking-[0.16em] uppercase mb-5" style={{ color: C.accent }}>Audit Log · Integrity Verified</div>
          <AuditLog />
        </div>
      </section>

      {/* ── AI TRIAGE ── */}
      <section
        id="ai-triage"
        className="grid"
        style={{ gridTemplateColumns: '420px 1fr', borderBottom: `1px solid ${C.border}` }}
      >
        <div className="px-12 py-20" style={{ borderRight: `1px solid ${C.border}` }}>
          <Eyebrow>AI Triage</Eyebrow>
          <h2 className="font-serif leading-[1.1] mb-8" style={{ fontSize: 'clamp(26px,3vw,42px)', color: C.fg }}>
            Groq LLaMA.<br />Advisory only.<br /><em style={{ fontStyle: 'italic', color: C.accent }}>Human decides.</em>
          </h2>
          {/* Terminal */}
          <div className="border overflow-hidden" style={{ borderColor: C.border2, background: C.bg2 }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ background: C.bg3, borderColor: C.border }}>
              <span className="w-2 h-2 rounded-full" style={{ background: '#c0392b' }} />
              <span className="w-2 h-2 rounded-full" style={{ background: '#e8b64a' }} />
              <span className="w-2 h-2 rounded-full" style={{ background: C.accent }} />
              <span className="font-mono text-[9px] tracking-[0.12em] uppercase ml-auto" style={{ color: C.fgDim }}>groq-llama · triage-advisory</span>
            </div>
            <div className="p-5 font-mono text-[11px] leading-[1.85]">
              <div><span style={{ color: C.fgMuted }}>$ </span><span style={{ color: C.fgDim }}>POST /api/triage/assess</span></div>
              <div className="mt-2"><span style={{ color: C.fgDim }}>symptoms: </span><span style={{ color: C.accent }}>"chest tightness, shortness of breath, diaphoresis"</span></div>
              <div><span style={{ color: C.fgDim }}>age: </span><span style={{ color: C.fgDim }}>58</span>  <span style={{ color: C.fgDim }}>vitals: </span><span style={{ color: C.fgDim }}>BP 160/100, HR 98</span></div>
              <div className="mt-3 pt-3 border-t" style={{ borderColor: C.border }}>
                <div><span style={{ color: C.fgDim }}>triage_level: </span><span style={{ color: '#e8b64a' }}>URGENT (Level 2)</span></div>
                <div><span style={{ color: C.fgDim }}>recommendation: </span><span style={{ color: C.fgDim }}>"Cardiac evaluation — ECG priority"</span></div>
                <div><span style={{ color: C.fgDim }}>confidence: </span><span style={{ color: C.accent }}>0.87</span></div>
                <div><span style={{ color: C.fgDim }}>model: </span><span style={{ color: C.fgDim }}>llama3-70b-8192</span></div>
                <div><span style={{ color: C.fgDim }}>override_preserved: </span><span style={{ color: '#6bcc82' }}>true</span></div>
                <div>
                  <span style={{ color: C.fgDim }}>advisory_only: </span>
                  <span style={{ color: '#6bcc82' }}>true</span>
                  {' '}
                  <span className="inline-block w-1.5 h-3 animate-pulse" style={{ background: C.accent, verticalAlign: 'text-bottom' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-16 py-20">
          <div className="font-mono text-[10px] tracking-[0.16em] uppercase mb-8" style={{ color: C.accent }}>AI Capabilities</div>
          {[
            { glyph: '⟳', title: 'Groq LLaMA 3 · 70B',         desc: 'Ultra-low-latency inference via Groq\'s LPU architecture. Triage assessments in under 200ms — fast enough for real clinical workflows.' },
            { glyph: '⊘', title: 'Advisory-Only Architecture',   desc: 'The AI presents a structured recommendation with confidence score. It cannot take action. Human clinicians retain full authority and can override — this is non-negotiable.' },
            { glyph: '◈', title: 'Structured Symptom Parsing',   desc: 'Free-text symptom input is parsed into structured clinical entities before LLM processing. Reduces hallucination surface and grounds the model in factual patient data.' },
            { glyph: '▲', title: 'Priority Queue Integration',   desc: 'A high-urgency triage result can flag a patient for priority queue insertion — still requiring doctor confirmation. The system suggests; the clinician decides.' },
          ].map((f, i) => (
            <div key={i} className="flex gap-5 py-7 border-b last:border-b-0" style={{ borderColor: C.border }}>
              <span className="font-mono text-lg font-semibold leading-none pt-1 shrink-0" style={{ color: C.accent }}>{f.glyph}</span>
              <div>
                <div className="text-[15px] font-semibold mb-1.5" style={{ color: C.fg }}>{f.title}</div>
                <p className="text-[13px] leading-[1.65]" style={{ color: C.fgDim }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AUTH / SECURITY ── */}
      <section id="auth" className="px-12 py-20" style={{ borderBottom: `1px solid ${C.border}` }}>
        <Eyebrow>Security Infrastructure</Eyebrow>
        <h2 className="font-serif leading-[1.08] mb-14" style={{ fontSize: 'clamp(34px,4vw,56px)', color: C.fg }}>
          Authentication<br />without compromise.
        </h2>
        <div className="grid border" style={{ gridTemplateColumns: 'repeat(3,1fr)', borderColor: C.border2 }}>
          {[
            { idx: '01', title: 'Two-Factor Authentication', desc: 'OTP (email/SMS) and TOTP-based MFA compatible with Authenticator apps. MFA required for any sensitive vault operation — consent modification, emergency access, admin actions.', tags: ['OTP','TOTP / HOTP','Speakeasy','QR Enroll'] },
            { idx: '02', title: 'JWT · Zero localStorage',    desc: 'Access tokens are short-lived (15m). Refresh tokens stored exclusively in HttpOnly, SameSite=Strict cookies — never in localStorage or sessionStorage. XSS cannot steal tokens.', tags: ['HttpOnly Cookie','SameSite=Strict','15m Access TTL','7d Refresh TTL'] },
            { idx: '03', title: 'Tamper-Evident Logs',        desc: 'Every auth event, consent change, and record access is logged with a SHA-256 hash chained to the previous entry. The integrity daemon verifies the full chain on schedule — detecting any post-hoc modification.', tags: ['SHA-256','Hash Chain','Integrity Daemon','Immutable Log'] },
          ].map((c, i) => (
            <div
              key={i}
              className="relative overflow-hidden px-9 py-10 group cursor-default transition-colors duration-200 border-r last:border-r-0"
              style={{ borderColor: C.border }}
              onMouseEnter={e => { e.currentTarget.style.background = C.bg2; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div
                className="absolute top-0 left-0 w-[3px] h-0 group-hover:h-full transition-all duration-500"
                style={{ background: C.accent }}
              />
              <div className="font-mono text-[10px] tracking-[0.14em] mb-5" style={{ color: C.fgMuted }}>0{i+1} —</div>
              <div className="font-serif text-2xl mb-4 leading-snug" style={{ color: C.fg }}>{c.title}</div>
              <p className="text-[13px] leading-[1.75] mb-6" style={{ color: C.fgDim }}>{c.desc}</p>
              <div className="flex flex-wrap gap-2">
                {c.tags.map(t => (
                  <span key={t} className="font-mono text-[9px] tracking-[0.08em] uppercase px-2.5 py-1 border" style={{ borderColor: C.border2, color: C.fgDim }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ANALYTICS ── */}
      <section id="analytics" className="px-12 py-20" style={{ borderBottom: `1px solid ${C.border}` }}>
        <Eyebrow>Admin Analytics</Eyebrow>
        <h2 className="font-serif leading-[1.08] mb-14" style={{ fontSize: 'clamp(34px,4vw,56px)', color: C.fg }}>
          Full operational<br />visibility.
        </h2>
        <div className="grid gap-16" style={{ gridTemplateColumns: '1fr 480px', alignItems: 'start' }}>
          <div>
            <p className="text-[14px] leading-[1.85] mb-8" style={{ color: C.fgDim }}>
              The admin dashboard surfaces live queue metrics, vault access patterns, security events, and user management — all in a single pane. Redis-backed real-time counters ensure sub-second metric refresh. Every data point has a drill-down to the underlying audit entry.
            </p>
            {[
              { title: 'Live Queue Metrics',     desc: 'Active queue depth per department, average wait time, served vs. deferred ratio, doctor throughput — updated via Socket.io in real time.' },
              { title: 'Security Event Log',     desc: 'Failed auth attempts, MFA bypass attempts, emergency access events, and consent anomalies — surfaced with severity classification and linked audit hashes.' },
              { title: 'Vault Access Patterns',  desc: 'Which records are being accessed, by whom, how often, and under what consent scope — with timeline visualization and consent lifecycle tracking.' },
              { title: 'User & Role Management', desc: 'Create, suspend, or re-role users. View MFA enrollment status. Force password resets. All admin actions themselves are audit-logged and tamper-evident.' },
            ].map((f, i) => (
              <div key={i} className="flex gap-4 py-5 border-b last:border-b-0" style={{ borderColor: C.border }}>
                <span className="font-mono text-[11px] pt-0.5 shrink-0" style={{ color: C.accent }}>→</span>
                <div>
                  <div className="text-[14px] font-semibold mb-1" style={{ color: C.fg }}>{f.title}</div>
                  <p className="text-[12px] leading-[1.65]" style={{ color: C.fgDim }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <BarChart />
        </div>
      </section>

      {/* ── DEMO ACCOUNTS ── */}
      <section id="demo" className="px-12 py-20" style={{ borderBottom: `1px solid ${C.border}` }}>
        <Eyebrow>Try It Now</Eyebrow>
        <h2 className="font-serif leading-[1.08] mb-4" style={{ fontSize: 'clamp(34px,4vw,56px)', color: C.fg }}>
          Demo accounts.<br />All three roles.{' '}
          <em style={{ fontStyle: 'italic', color: C.accent }}>Live.</em>
        </h2>
        <p className="text-[14px] leading-[1.85] mb-12 max-w-2xl" style={{ color: C.fgDim }}>
          The live deployment is seeded with one account per role. Use any of the credentials below — MFA is disabled on demo accounts so you can explore immediately.
        </p>

        <div className="grid border mb-10" style={{ gridTemplateColumns: 'repeat(3,1fr)', borderColor: C.border2 }}>
          {[
            {
              idx: '01', role: 'Patient', tag: 'Self-Service',
              name: 'Aarav Patel', meta: 'General Patient · B+ · Age 30',
              email: 'demo.patient@mediqueue.local',
              perms: ['Join queue & track live position','Upload & manage encrypted records','Grant / revoke per-doctor consent','View audit trail of record access'],
            },
            {
              idx: '02', role: 'Doctor', tag: 'Clinical Access',
              name: 'Dr. Meera Shah', meta: 'General Medicine · MBBS, MD · 12 yrs exp',
              email: 'demo.doctor@mediqueue.local',
              perms: ['Manage live queue — call, skip, defer','View consented patient records','Request emergency record access','AI triage advisory panel'],
            },
            {
              idx: '03', role: 'Admin', tag: 'Oversight',
              name: 'Nikhil Rao', meta: 'Platform Admin · Full system access',
              email: 'demo.admin@mediqueue.local',
              perms: ['Full analytics & queue metrics dashboard','Review & approve emergency access','Audit log with SHA-256 chain verifier','User management & MFA oversight'],
            },
          ].map((c, i) => (
            <div
              key={i}
              className="relative overflow-hidden group cursor-default border-r last:border-r-0 transition-colors duration-200"
              style={{ borderColor: C.border }}
              onMouseEnter={e => { e.currentTarget.style.background = C.bg2; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-[3px] w-0 group-hover:w-full transition-all duration-500"
                style={{ background: C.accent }}
              />
              {/* Header */}
              <div className="px-8 py-7">
                <div className="flex items-center justify-between mb-5">
                  <span className="font-mono text-[10px] tracking-[0.18em] uppercase" style={{ color: C.fgMuted }}>{c.idx} — {c.role}</span>
                  <span className="font-mono text-[9px] tracking-[0.1em] uppercase px-2.5 py-0.5 border" style={{ color: C.accent, borderColor: C.accent }}>{c.tag}</span>
                </div>
                <div className="font-serif text-[22px] leading-snug mb-1.5" style={{ color: C.fg }}>{c.name}</div>
                <div className="font-mono text-[11px]" style={{ color: C.fgDim }}>{c.meta}</div>
              </div>

              {/* Credentials block */}
              <div
                className="px-8 py-5 font-mono text-[11px] leading-[2] border-y"
                style={{ background: C.bg3, borderColor: C.border }}
              >
                <div><span style={{ color: C.fgMuted }}>email    </span> <span style={{ color: C.fg }}>{c.email}</span></div>
                <div><span style={{ color: C.fgMuted }}>password </span> <span style={{ color: C.accent }}>DemoPass@123</span></div>
                <div><span style={{ color: C.fgMuted }}>mfa      </span> <span style={{ color: '#6bcc82' }}>disabled (demo)</span></div>
              </div>

              {/* Permissions */}
              <div className="px-8 py-6">
                <div className="font-mono text-[10px] tracking-[0.1em] uppercase mb-3" style={{ color: C.fgMuted }}>What you can explore</div>
                <ul className="flex flex-col gap-2 list-none">
                  {c.perms.map((p, j) => (
                    <li key={j} className="font-mono text-[11px] flex gap-2" style={{ color: C.fgDim }}>
                      <span style={{ color: C.accent }}>→</span>{p}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="px-8 pb-8">
                <a
                  href={DEMO_URL} target="_blank" rel="noreferrer"
                  className="block font-mono text-[11px] tracking-[0.1em] uppercase no-underline text-center py-3 border transition-colors duration-150"
                  style={{ color: C.accent, borderColor: C.accent }}
                  onMouseEnter={e => { e.target.style.background = C.accent; e.target.style.color = C.bg; }}
                  onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = C.accent; }}
                >
                  Login as {c.role} →
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Shared password callout */}
        <div
          className="flex items-center gap-6 flex-wrap px-7 py-5 border"
          style={{ borderColor: C.border2, background: C.bg2 }}
        >
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase" style={{ color: C.fgMuted }}>Shared password</span>
          <span className="font-mono font-semibold text-xl tracking-[0.06em]" style={{ color: C.accent }}>DemoPass@123</span>
          <span className="font-mono text-[11px] flex-1" style={{ color: C.fgDim }}>
            All three demo accounts use the same password. MFA is pre-disabled. Copy the email for the role you want, paste it with this password, and you're in.
          </span>
          <a
            href={DEMO_URL} target="_blank" rel="noreferrer"
            className="font-mono text-[11px] tracking-[0.1em] uppercase no-underline px-6 py-3 border transition-colors duration-150 whitespace-nowrap"
            style={{ background: C.accent, color: C.bg, borderColor: C.accent }}
            onMouseEnter={e => { e.target.style.background = 'transparent'; e.target.style.color = C.accent; }}
            onMouseLeave={e => { e.target.style.background = C.accent; e.target.style.color = C.bg; }}
          >
            Open Login Page →
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="grid px-12 py-14 gap-12"
        style={{ gridTemplateColumns: '1fr 1fr', borderTop: `1px solid ${C.border}`, alignItems: 'end' }}
      >
        <div>
          <div className="font-mono text-[13px] font-medium tracking-[0.08em] mb-3" style={{ color: C.fg }}>
            Medi<span style={{ color: C.accent }}>Queue</span>
          </div>
          <div className="text-[13px] mb-6" style={{ color: C.fgDim }}>A production-grade healthcare operations platform. Built to be deployed.</div>
          <div className="flex flex-wrap gap-2">
            {['Node.js','React','MongoDB','Redis','Socket.io','Docker','Groq LLaMA','JWT'].map(t => (
              <span
                key={t}
                className="font-mono text-[9px] tracking-[0.1em] uppercase px-3 py-1.5 border transition-colors duration-150 cursor-default"
                style={{ borderColor: C.border2, color: C.fgMuted, background: C.bg2 }}
                onMouseEnter={e => { e.target.style.color = C.accent; e.target.style.borderColor = C.accent; }}
                onMouseLeave={e => { e.target.style.color = C.fgMuted; e.target.style.borderColor = C.border2; }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="text-right">
          <div className="flex justify-end gap-7 mb-6 list-none">
            {[['System','#features'],['Vault','#vault'],['AI','#ai-triage'],['Security','#auth'],['GitHub ↗',GITHUB_URL],['Live Demo ↗',DEMO_URL]].map(([l,h]) => (
              <a
                key={l} href={h}
                target={h.startsWith('http') ? '_blank' : undefined}
                rel={h.startsWith('http') ? 'noreferrer' : undefined}
                className="font-mono text-[11px] tracking-[0.1em] uppercase no-underline transition-colors duration-150"
                style={{ color: C.fgDim }}
                onMouseEnter={e => { e.target.style.color = C.accent; }}
                onMouseLeave={e => { e.target.style.color = C.fgDim; }}
              >
                {l}
              </a>
            ))}
          </div>
          <div className="font-mono text-[10px]" style={{ color: C.fgMuted }}>
            <div>piyushkumar0707/MediQueue · MIT License</div>
            <div className="mt-1">CareQueue + Health Vault · All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
