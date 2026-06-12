import { useNavigate } from 'react-router-dom'
import {
  Zap, Lock, TrendingUp, Users, Shield, Globe, ChevronRight,
  Coins, ArrowRight, BarChart3, Clock, Wallet
} from 'lucide-react'

/* ─── Tokenomics data ─────────────────────────────────────────── */
const TOKENOMICS = [
  { label: 'Strategic Investors', pct: 10, tokens: '100,000,000', color: '#10B981', cliff: '6 mo', unlock: '5% quarterly' },
  { label: 'Team & Founders',     pct: 10, tokens: '100,000,000', color: '#F59E0B', cliff: '18 mo', unlock: '2% monthly' },
  { label: 'Advisors & Partners', pct:  5, tokens:  '50,000,000', color: '#3B82F6', cliff: '12 mo', unlock: '2.5% monthly' },
  { label: 'Treasury Reserve',    pct: 25, tokens: '250,000,000', color: '#8B5CF6', cliff: 'Locked', unlock: 'Owner only' },
  { label: 'Liquidity',           pct: 10, tokens: '100,000,000', color: '#EC4899', cliff: 'Instant 30%', unlock: '5% quarterly' },
  { label: 'Community Incentives',pct: 20, tokens: '200,000,000', color: '#F97316', cliff: '—', unlock: 'Tracked balance' },
  { label: 'Ecosystem Dev',       pct: 15, tokens: '150,000,000', color: '#06B6D4', cliff: 'Instant 10%', unlock: '10% yearly' },
  { label: 'Community Growth',    pct:  5, tokens:  '50,000,000', color: '#84CC16', cliff: 'Instant 5%', unlock: '5% quarterly' },
]

const TOTAL_SUPPLY = '1,000,000,000'

/* ─── Features ────────────────────────────────────────────────── */
const FEATURES = [
  { icon: Shield,   color: '#10B981', title: 'Audited Contracts',  desc: 'Multi-pass security reviewed — 22 flaws found and resolved before mainnet.' },
  { icon: Clock,    color: '#F59E0B', title: 'Cliff-Based Vesting', desc: 'Precise unlock schedules enforced on-chain. No early withdrawals.' },
  { icon: BarChart3,color: '#3B82F6', title: 'Dual-Tree Genealogy', desc: 'Referral and binary network tracking with gas-optimized traversal.' },
  { icon: Globe,    color: '#8B5CF6', title: 'BSC Native',          desc: 'Deployed on BNB Smart Chain for fast, low-cost transactions.' },
  { icon: Wallet,   color: '#EC4899', title: 'USDT Purchases',      desc: 'Buy strategic or advisor vesting directly with USDT.' },
  { icon: Users,    color: '#F97316', title: 'Referral System',     desc: '10% AEOS bonus distributed to sponsors on every new registration.' },
]

/* ─── Donut chart (pure CSS + SVG) ───────────────────────────── */
function DonutSegment({ pct, color, offset, total = 100, r = 80 }) {
  const circ = 2 * Math.PI * r
  const dash = (pct / total) * circ
  const gap  = circ - dash
  return (
    <circle
      cx="100" cy="100" r={r}
      fill="none"
      stroke={color}
      strokeWidth="28"
      strokeDasharray={`${dash} ${gap}`}
      strokeDashoffset={-offset * circ / total}
      style={{ transition: 'stroke-dasharray 0.6s ease' }}
    />
  )
}

function TokenomicsDonut() {
  let offset = 0
  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-xs mx-auto drop-shadow-lg">
      {TOKENOMICS.map(t => {
        const seg = <DonutSegment key={t.label} pct={t.pct} color={t.color} offset={offset} />
        offset += t.pct
        return seg
      })}
      <text x="100" y="95"  textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.5">Total Supply</text>
      <text x="100" y="114" textAnchor="middle" fontSize="9"  fill="currentColor" opacity="0.7">1,000,000,000</text>
      <text x="100" y="126" textAnchor="middle" fontSize="8"  fill="currentColor" opacity="0.5">AEOS</text>
    </svg>
  )
}

/* ─── Connected dashboard shortcut ───────────────────────────── */
function ConnectedView() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-14">
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-bold" style={{ color: 'var(--primary)' }}>
          AEOS Vesting Dashboard
        </h1>
        <p className="text-lg" style={{ color: 'var(--muted-foreground)' }}>
          Manage your token allocations across multiple vesting modules
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { href: '/strategic', icon: TrendingUp, color: '#10B981', title: 'Strategic Investors', desc: '10% allocation · 6 mo cliff · 5% quarterly' },
          { href: '/advisor',   icon: Users,      color: '#3B82F6', title: 'Advisors',            desc: '5% allocation · 12 mo cliff · 2.5% monthly' },
          { href: '/team',      icon: Lock,       color: '#F59E0B', title: 'Team & Founders',     desc: '10% allocation · 18 mo cliff · 2% monthly' },
        ].map(m => (
          <a key={m.href} href={m.href} className="card-aeos p-6 hover:shadow-lg transition-all cursor-pointer group">
            <div className="flex items-center gap-3 mb-3">
              <m.icon size={22} style={{ color: m.color }} />
              <h2 className="text-lg font-bold">{m.title}</h2>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>{m.desc}</p>
            <div className="flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all" style={{ color: m.color }}>
              View Dashboard <ArrowRight size={14} />
            </div>
          </a>
        ))}
      </div>

      <div className="border-t pt-10" style={{ borderColor: 'var(--border)' }}>
        <p className="text-sm font-medium mb-4" style={{ color: 'var(--muted-foreground)' }}>Admin Panel</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/admin',           icon: Zap,         color: 'var(--primary)', label: 'Overview'   },
            { href: '/admin/strategic', icon: TrendingUp,  color: '#10B981',        label: 'Strategic'  },
            { href: '/admin/advisor',   icon: Users,       color: '#3B82F6',        label: 'Advisors'   },
            { href: '/admin/team',      icon: Lock,        color: '#F59E0B',        label: 'Team'       },
            { href: '/admin/genealogy', icon: Globe,       color: '#EC4899',        label: 'Genealogy'  },
          ].map(a => (
            <a key={a.href} href={a.href} className="card-aeos p-3 flex items-center gap-2 hover:shadow transition-all cursor-pointer">
              <a.icon size={16} style={{ color: a.color }} />
              <span className="text-sm font-medium">{a.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Main Landing ────────────────────────────────────────────── */
export default function Landing({ isConnected, connect }) {
  if (isConnected) return <ConnectedView />

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-20 blur-3xl"
               style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 pt-24 pb-20 text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border"
               style={{ borderColor: 'var(--primary)', color: 'var(--primary)', backgroundColor: 'var(--accent)' }}>
            <Coins size={14} />
            BSC Native · 1,000,000,000 AEOS Total Supply
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
            <span style={{ color: 'var(--foreground)' }}>Institutional </span>
            <span style={{ color: 'var(--primary)' }}>Token Vesting</span>
            <br />
            <span style={{ color: 'var(--foreground)' }}>for AEOS</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            Transparent, on-chain vesting for strategic investors, advisors, and team — with
            cliff-based unlock schedules, referral genealogy tracking, and USDT purchase support.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => connect({ connector: undefined })}
              className="btn-primary px-8 py-3 text-base flex items-center gap-2"
            >
              <Wallet size={18} />
              Connect Wallet
              <ChevronRight size={16} />
            </button>
            <a href="#tokenomics"
               className="px-8 py-3 rounded-lg text-base font-medium border transition-colors"
               style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
              View Tokenomics
            </a>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 max-w-3xl mx-auto">
            {[
              { value: '1B',   label: 'Total Supply' },
              { value: '8',    label: 'Vesting Modules' },
              { value: '0.2',  label: 'USDT per AEOS' },
              { value: '22+',  label: 'Security Fixes' },
            ].map(s => (
              <div key={s.label} className="card-aeos py-4 px-3 text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{s.value}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-bold">Built for Confidence</h2>
          <p className="text-base" style={{ color: 'var(--muted-foreground)' }}>
            Every mechanism designed for long-term token integrity
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="card-aeos p-6 space-y-3 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                   style={{ backgroundColor: f.color + '20' }}>
                <f.icon size={20} style={{ color: f.color }} />
              </div>
              <h3 className="font-semibold text-base">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TOKENOMICS ─────────────────────────────────────────── */}
      <section id="tokenomics" className="py-20"
               style={{ backgroundColor: 'var(--muted)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold">Tokenomics</h2>
            <p style={{ color: 'var(--muted-foreground)' }}>
              Total Supply: <span className="font-semibold" style={{ color: 'var(--primary)' }}>{TOTAL_SUPPLY} AEOS</span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Donut */}
            <div className="flex flex-col items-center gap-6">
              <TokenomicsDonut />
              {/* Legend */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 w-full max-w-sm">
                {TOKENOMICS.map(t => (
                  <div key={t.label} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{t.label}</span>
                    <span className="text-xs font-semibold ml-auto">{t.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="space-y-3">
              {TOKENOMICS.map(t => (
                <div key={t.label} className="card-aeos px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                      <span className="font-medium text-sm">{t.label}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: t.color }}>{t.pct}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1 rounded-full mb-3" style={{ backgroundColor: 'var(--border)' }}>
                    <div className="h-1 rounded-full transition-all duration-700"
                         style={{ width: `${t.pct * 4}%`, backgroundColor: t.color }} />
                  </div>

                  <div className="flex items-center justify-between text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    <span>{t.tokens} AEOS</span>
                    <div className="flex items-center gap-3">
                      <span><Clock size={10} className="inline mr-0.5" />{t.cliff}</span>
                      <span><ArrowRight size={10} className="inline mr-0.5" />{t.unlock}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FOOTER ─────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-24 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-bold">Ready to invest?</h2>
        <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--muted-foreground)' }}>
          Connect your wallet to access strategic investor and advisor vesting positions.
          Minimum purchase: 10 USDT.
        </p>
        <button
          onClick={() => connect({ connector: undefined })}
          className="btn-primary px-10 py-3 text-base inline-flex items-center gap-2"
        >
          <Wallet size={18} />
          Connect Wallet
          <ChevronRight size={16} />
        </button>

        <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-center gap-6 text-sm"
             style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
          <span>Token CA: <span className="font-mono text-xs">0x89417b...d25A</span></span>
          <span>·</span>
          <span>Price: 0.2 USDT / AEOS</span>
          <span>·</span>
          <span>Network: BNB Smart Chain</span>
        </div>
      </section>

    </div>
  )
}
