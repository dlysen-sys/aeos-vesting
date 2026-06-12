import {
  Zap, Lock, TrendingUp, Users, Shield, Globe, ChevronRight,
  Coins, ArrowRight, BarChart3, Clock, Wallet, Store,
  Gamepad2, Star, CheckCircle, AlertTriangle
} from 'lucide-react'

/* ─── Tokenomics data ─────────────────────────────────────────── */
const TOKENOMICS = [
  {
    label: 'Treasury Reserve',      pct: 25, tokens: '250,000,000', color: '#8B5CF6',
    cliff: '24 mo hard lock', unlock: 'Max 5% yearly after lock',
    why: 'War chest for future exchange, blockchain, acquisitions, and compliance. Never touched early.'
  },
  {
    label: 'Community Incentives',  pct: 20, tokens: '200,000,000', color: '#F97316',
    cliff: 'Dynamic', unlock: 'Max 1.5% monthly',
    why: 'Subscriptions, gaming rewards, merchant and leadership rewards — released based on active usage, not dates.'
  },
  {
    label: 'Ecosystem Development', pct: 15, tokens: '150,000,000', color: '#06B6D4',
    cliff: '10% immediate', unlock: '10% yearly',
    why: 'Funds the blockchain explorer, AEOS Chain, wallet upgrades, AI integrations, and exchange development.'
  },
  {
    label: 'Strategic Investors',   pct: 10, tokens: '100,000,000', color: '#10B981',
    cliff: '6 mo', unlock: '5% quarterly · 5 yr total',
    why: 'Strategic partners should build alongside the project, not flip tokens on launch day.'
  },
  {
    label: 'Team & Founders',       pct: 10, tokens: '100,000,000', color: '#F59E0B',
    cliff: '18 mo', unlock: '2% monthly · 60 mo total',
    why: 'Founders are the last to sell. Long lock signals commitment and protects every holder.'
  },
  {
    label: 'Liquidity & Market',    pct: 10, tokens: '100,000,000', color: '#EC4899',
    cliff: '30% instant', unlock: '5% quarterly on remaining 70%',
    why: 'Enough liquidity to enable trading, structured to prevent it from becoming sell pressure.'
  },
  {
    label: 'Community Growth',      pct:  5, tokens:  '50,000,000', color: '#84CC16',
    cliff: '5% instant (2.5M)', unlock: '5% quarterly',
    why: 'Country expansion, ambassador programs, events, and marketing campaigns.'
  },
  {
    label: 'Advisors & Partners',   pct:  5, tokens:  '50,000,000', color: '#3B82F6',
    cliff: '12 mo', unlock: '2.5% monthly · 4 yr total',
    why: 'Advisors must stay long enough to actually contribute before they can exit.'
  },
]

const MERCHANT_TIERS = [
  { tier: 'Bronze',   amount: '10,000',  color: '#CD7F32', benefits: 'Lower transaction fees · Merchant rewards' },
  { tier: 'Silver',   amount: '20,000',  color: '#9CA3AF', benefits: 'Better visibility · Priority listing' },
  { tier: 'Gold',     amount: '50,000',  color: '#F59E0B', benefits: 'All Silver benefits · Featured placement' },
  { tier: 'Platinum', amount: '100,000', color: '#818CF8', benefits: 'All Gold benefits · Maximum rewards' },
]

/* ─── SVG Donut ───────────────────────────────────────────────── */
function DonutSegment({ pct, color, offset }) {
  const r = 80, circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <circle cx="100" cy="100" r={r} fill="none" stroke={color} strokeWidth="26"
      strokeDasharray={`${dash} ${circ - dash}`}
      strokeDashoffset={-(offset / 100) * circ} />
  )
}

function Donut() {
  let offset = 0
  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-xs mx-auto drop-shadow-xl">
      {TOKENOMICS.map(t => {
        const seg = <DonutSegment key={t.label} pct={t.pct} color={t.color} offset={offset} />
        offset += t.pct
        return seg
      })}
      <text x="100" y="93"  textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.5">Total Supply</text>
      <text x="100" y="108" textAnchor="middle" fontSize="13" fontWeight="bold" fill="currentColor">1,000,000,000</text>
      <text x="100" y="121" textAnchor="middle" fontSize="9"  fill="currentColor" opacity="0.5">AEOS</text>
    </svg>
  )
}

/* ─── Connected view ─────────────────────────────────────────── */
function ConnectedView() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-14">
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-bold" style={{ color: 'var(--primary)' }}>AEOS Vesting Dashboard</h1>
        <p className="text-lg" style={{ color: 'var(--muted-foreground)' }}>Manage your token allocations across multiple vesting modules</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { href: '/strategic', icon: TrendingUp, color: '#10B981', title: 'Strategic Investors', desc: '10% · 6 mo cliff · 5% quarterly' },
          { href: '/advisor',   icon: Users,      color: '#3B82F6', title: 'Advisors',            desc: '5% · 12 mo cliff · 2.5% monthly' },
          { href: '/team',      icon: Lock,       color: '#F59E0B', title: 'Team & Founders',     desc: '10% · 18 mo cliff · 2% monthly' },
        ].map(m => (
          <a key={m.href} href={m.href} className="card-aeos p-6 hover:shadow-lg transition-all cursor-pointer group">
            <div className="flex items-center gap-3 mb-3">
              <m.icon size={22} style={{ color: m.color }} />
              <h2 className="text-lg font-bold">{m.title}</h2>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>{m.desc}</p>
            <div className="flex items-center gap-1 text-sm font-medium" style={{ color: m.color }}>
              View Dashboard <ArrowRight size={14} />
            </div>
          </a>
        ))}
      </div>
      <div className="border-t pt-10" style={{ borderColor: 'var(--border)' }}>
        <p className="text-sm font-medium mb-4" style={{ color: 'var(--muted-foreground)' }}>Admin Panel</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { href: '/admin',           icon: Zap,        color: 'var(--primary)', label: 'Overview'  },
            { href: '/admin/strategic', icon: TrendingUp, color: '#10B981',        label: 'Strategic' },
            { href: '/admin/advisor',   icon: Users,      color: '#3B82F6',        label: 'Advisors'  },
            { href: '/admin/team',      icon: Lock,       color: '#F59E0B',        label: 'Team'      },
            { href: '/admin/genealogy', icon: Globe,      color: '#EC4899',        label: 'Genealogy' },
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

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-20 blur-3xl"
               style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 pt-24 pb-20 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border"
               style={{ borderColor: 'var(--primary)', color: 'var(--primary)', backgroundColor: 'var(--accent)' }}>
            <Coins size={14} />
            BSC · PancakeSwap Liquidity · 0x89417b...d25A
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
            <span style={{ color: 'var(--foreground)' }}>Supply-Controlled.</span>
            <br />
            <span style={{ color: 'var(--primary)' }}>Utility-Driven.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            AEOS is not just a token — it is the operating currency of an entire ecosystem.
            Gaming, merchants, subscriptions, wallet payments, and exchange services all run on AEOS.
            The vesting model exists to ensure supply never outruns adoption.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button onClick={() => connect({ connector: undefined })}
              className="btn-primary px-8 py-3 text-base flex items-center gap-2">
              <Wallet size={18} /> Connect Wallet <ChevronRight size={16} />
            </button>
            <a href="#tokenomics" className="px-8 py-3 rounded-lg text-base font-medium border transition-colors"
               style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
              View Tokenomics
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 max-w-3xl mx-auto">
            {[
              { value: '1B',    label: 'Total Supply'    },
              { value: '0.2',   label: 'USDT per AEOS'   },
              { value: '8',     label: 'Vesting Modules' },
              { value: '10K+',  label: 'AEOS to Merchant'},
            ].map(s => (
              <div key={s.label} className="card-aeos py-4 px-3 text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{s.value}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PHILOSOPHY ───────────────────────────────────────── */}
      <section className="py-16" style={{ backgroundColor: 'var(--muted)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full"
               style={{ backgroundColor: 'var(--accent)', color: 'var(--primary)' }}>
            <AlertTriangle size={13} /> The Real Risk
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold">
            The enemy is not volatility.<br />
            <span style={{ color: 'var(--primary)' }}>The enemy is oversupply.</span>
          </h2>
          <p className="text-base leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--muted-foreground)' }}>
            When tokens enter circulation faster than the ecosystem can absorb them, price collapses regardless
            of the product quality. AEOS addresses this through a structured vesting model that ties token release
            directly to measurable adoption — active users, merchant volume, and ecosystem activity.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-left">
            <div className="card-aeos p-5 space-y-2 border-l-4" style={{ borderLeftColor: '#EF4444' }}>
              <p className="font-semibold text-sm" style={{ color: '#EF4444' }}>Without Vesting</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Launch → Hype → Pump → Dump → Collapse. Holders lose, confidence evaporates, project dies.
              </p>
            </div>
            <div className="card-aeos p-5 space-y-2 border-l-4" style={{ borderLeftColor: '#10B981' }}>
              <p className="font-semibold text-sm" style={{ color: '#10B981' }}>With Vesting</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Launch → Adoption → Utility → Demand → Scarcity → Sustainable growth over years, not days.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TOKENOMICS ───────────────────────────────────────── */}
      <section id="tokenomics" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-14 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-bold">Token Allocation</h2>
          <p style={{ color: 'var(--muted-foreground)' }}>
            Total Supply: <span className="font-semibold" style={{ color: 'var(--primary)' }}>1,000,000,000 AEOS</span>
            &nbsp;·&nbsp; Vesting Price: <span className="font-semibold" style={{ color: 'var(--primary)' }}>0.2 USDT</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Donut + legend */}
          <div className="sticky top-8 flex flex-col items-center gap-6">
            <Donut />
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 w-full max-w-sm">
              {TOKENOMICS.map(t => (
                <div key={t.label} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                  <span className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{t.label}</span>
                  <span className="text-xs font-bold ml-auto">{t.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Allocation cards */}
          <div className="space-y-4">
            {TOKENOMICS.map((t, i) => (
              <div key={t.label} className="card-aeos px-5 py-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: t.color + '25', color: t.color }}>{i + 1}</span>
                    <span className="font-semibold text-sm">{t.label}</span>
                  </div>
                  <span className="text-base font-bold" style={{ color: t.color }}>{t.pct}%</span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 rounded-full" style={{ backgroundColor: 'var(--border)' }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${t.pct * 4}%`, backgroundColor: t.color }} />
                </div>

                {/* Details */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  <span className="font-mono">{t.tokens} AEOS</span>
                  <span className="flex items-center gap-1"><Clock size={10} />{t.cliff}</span>
                  <span className="flex items-center gap-1"><ArrowRight size={10} />{t.unlock}</span>
                </div>

                {/* Why */}
                <p className="text-xs leading-relaxed italic border-t pt-2"
                   style={{ color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}>
                  {t.why}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ECOSYSTEM DEMAND ─────────────────────────────────── */}
      <section className="py-20" style={{ backgroundColor: 'var(--muted)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold">What Drives Demand</h2>
            <p className="max-w-xl mx-auto text-base" style={{ color: 'var(--muted-foreground)' }}>
              AEOS is required across every layer of the ecosystem — creating recurring, structural demand
              rather than speculative interest.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Gamepad2, color: '#10B981', title: 'Gaming',
                desc: 'Every game in the ecosystem requires AEOS. Players buy to participate — not because of hype, but because gameplay demands it.' },
              { icon: Store, color: '#F97316', title: 'Merchant Requirements',
                desc: 'Merchants must hold AEOS to participate. Bronze starts at 10,000 AEOS. Locking creates permanent circulating supply reduction.' },
              { icon: Zap, color: '#3B82F6', title: 'Subscriptions',
                desc: 'Each subscription distributes $5 worth of AEOS — but 75% is vested over 6 months, converting subscribers into long-term holders.' },
              { icon: Globe, color: '#8B5CF6', title: 'Wallet & Payments',
                desc: 'QR payments, wallet-to-wallet transfers, and future exchange services all settle in AEOS.' },
              { icon: BarChart3, color: '#EC4899', title: 'Infrastructure',
                desc: 'Blockchain explorer, AEOS Chain, AI integrations, and exchange development funded through the Ecosystem Development allocation.' },
              { icon: Users, color: '#06B6D4', title: 'Community Network',
                desc: 'Referral genealogy tracks every sponsor relationship on-chain. Sponsors earn 10% AEOS bonus on new registrations.' },
            ].map(f => (
              <div key={f.title} className="card-aeos p-6 space-y-3 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                     style={{ backgroundColor: f.color + '20' }}>
                  <f.icon size={20} style={{ color: f.color }} />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MERCHANT TIERS ───────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-bold">Merchant Tier System</h2>
          <p className="max-w-xl mx-auto" style={{ color: 'var(--muted-foreground)' }}>
            Every merchant locks AEOS to participate in the network. Higher tiers unlock
            better rates, visibility, and rewards — creating permanent structural demand.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {MERCHANT_TIERS.map((m, i) => (
            <div key={m.tier} className="card-aeos p-6 text-center space-y-4 hover:shadow-lg transition-shadow relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-lg" style={{ backgroundColor: m.color }} />
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
                   style={{ backgroundColor: m.color + '20' }}>
                <Star size={22} style={{ color: m.color }} />
              </div>
              <div>
                <p className="font-bold text-lg">{m.tier}</p>
                <p className="text-2xl font-extrabold mt-1" style={{ color: m.color }}>
                  {m.amount}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>AEOS Locked</p>
              </div>
              <div className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                {m.benefits.split(' · ').map(b => (
                  <div key={b} className="flex items-center gap-1.5 mb-1">
                    <CheckCircle size={10} style={{ color: m.color, flexShrink: 0 }} />
                    {b}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SUBSCRIPTION MODEL ───────────────────────────────── */}
      <section className="py-20" style={{ backgroundColor: 'var(--muted)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold">Subscription Vesting Model</h2>
          <p className="text-base leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--muted-foreground)' }}>
            Every active subscription distributes <strong>$5 worth of AEOS</strong> — but releasing 100%
            immediately converts subscribers into sellers. Instead, the model splits each reward to create
            genuine long-term holders.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="card-aeos p-6 space-y-3 text-left">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#10B98120' }}>
                  <Zap size={16} style={{ color: '#10B981' }} />
                </div>
                <span className="font-semibold">25% — Immediate Release</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                A quarter of each subscription reward is available instantly — rewarding active participation
                without flooding supply.
              </p>
            </div>
            <div className="card-aeos p-6 space-y-3 text-left">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#6366f120' }}>
                  <Lock size={16} style={{ color: '#6366f1' }} />
                </div>
                <span className="font-semibold">75% — Vested over 6 Months</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                The remaining 75% unlocks gradually over 6 months, converting thousands of subscribers into
                long-term token holders rather than immediate sellers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FORMULA ──────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center space-y-8">
        <h2 className="text-3xl sm:text-4xl font-bold">The Formula</h2>
        <div className="card-aeos p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            {['Education', 'Gaming', 'Wallet', 'Merchants', 'Exchange', 'Community'].map((item, i, arr) => (
              <span key={item} className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg font-medium" style={{ backgroundColor: 'var(--accent)', color: 'var(--primary)' }}>
                  {item}
                </span>
                {i < arr.length - 1 && <span style={{ color: 'var(--muted-foreground)' }}>+</span>}
              </span>
            ))}
            <span style={{ color: 'var(--muted-foreground)' }}>=</span>
            <span className="px-3 py-1 rounded-lg font-bold" style={{ backgroundColor: '#10B98120', color: '#10B981' }}>Demand</span>
          </div>

          <div className="h-px" style={{ backgroundColor: 'var(--border)' }} />

          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            {['Vesting', 'Locked Supply', 'Merchant Requirements'].map((item, i, arr) => (
              <span key={item} className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg font-medium" style={{ backgroundColor: 'var(--accent)', color: 'var(--primary)' }}>
                  {item}
                </span>
                {i < arr.length - 1 && <span style={{ color: 'var(--muted-foreground)' }}>+</span>}
              </span>
            ))}
            <span style={{ color: 'var(--muted-foreground)' }}>=</span>
            <span className="px-3 py-1 rounded-lg font-bold" style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}>Scarcity</span>
          </div>

          <div className="h-px" style={{ backgroundColor: 'var(--border)' }} />

          <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
            When <span style={{ color: '#10B981' }}>Demand</span> grows faster than available{' '}
            <span style={{ color: '#F59E0B' }}>Supply</span> —{' '}
            <span className="font-bold" style={{ color: 'var(--foreground)' }}>sustainable value is created.</span>
          </p>
        </div>

        <p className="text-xl font-semibold italic" style={{ color: 'var(--primary)' }}>
          "Infrastructure First. Not Hype."
        </p>
      </section>

      {/* ── CTA FOOTER ───────────────────────────────────────── */}
      <section className="py-20" style={{ backgroundColor: 'var(--muted)' }}>
        <div className="max-w-3xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold">Join the Vesting Program</h2>
          <p className="text-base" style={{ color: 'var(--muted-foreground)' }}>
            Strategic investor and advisor positions are open to the public.
            Minimum purchase: <strong>10 USDT</strong>. Multiple vesting positions supported.
            Each position tracked independently on-chain.
          </p>
          <button onClick={() => connect({ connector: undefined })}
            className="btn-primary px-10 py-3 text-base inline-flex items-center gap-2">
            <Wallet size={18} /> Connect Wallet <ChevronRight size={16} />
          </button>
          <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-center gap-4 text-xs"
               style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
            <span>CA: <span className="font-mono">0x89417b107aD0eF0Ce0dA82c5d6fD6c81F6e0d25A</span></span>
            <span className="hidden sm:inline">·</span>
            <span>Price: 0.2 USDT / AEOS</span>
            <span className="hidden sm:inline">·</span>
            <span>Liquidity: PancakeSwap</span>
            <span className="hidden sm:inline">·</span>
            <span>Network: BNB Smart Chain</span>
          </div>
        </div>
      </section>

    </div>
  )
}
