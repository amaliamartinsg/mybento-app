/* ──────────────────────────────────────────────────
   LandingView — Página de marketing de MyBento
   Fiel al system-design/landing/app.jsx
   ────────────────────────────────────────────────── */
import React, { useState, useEffect } from 'react'
import {
  Restaurant as RestaurantIcon,
  CalendarMonth as CalendarIcon,
  Settings as SettingsIcon,
  AutoAwesome as AutoAwesomeIcon,
  Kitchen as KitchenIcon,
  Bolt as BoltIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoginView from './LoginView'
import logoSimple from '../assets/mybento-logo-simple.png'

// ── Design tokens (espejo de system-design/colors_and_type.css) ──
const C = {
  fg:           '#1a1c1e',
  fgMuted:      '#44464f',
  fgSubtle:     '#6a769e',
  surface:      '#fef7fd',
  surfacePaper: '#ffffff',
  surfaceChip:  '#eef2ff',
  brand:        '#68548d',
  brandDark:    '#4a3870',
  primary:      '#4da8ff',
  primaryStrong:'#005cb2',
  primaryMid:   '#5071d5',
} as const

// ── Mockup: RecetasView estático ──────────────────
function RecetasMockup() {
  const items = [
    { name: 'Pollo al limón',    kcal: 420, P: 35, HC: 18, G: 14, emoji: '🍋', bg: 'linear-gradient(135deg, #a8e063, #56ab2f)' },
    { name: 'Salmón al vapor',   kcal: 310, P: 28, HC:  4, G: 18, emoji: '🐟', bg: 'linear-gradient(135deg, #f7971e, #ffd200)' },
    { name: 'Tortilla española', kcal: 280, P: 12, HC: 22, G: 16, emoji: '🥚', bg: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  ]
  const macroColors: Record<string, string> = { P: '#1565C0', HC: '#F57F17', G: '#C62828' }
  return (
    <div style={{ background: C.surface, padding: 16, width: 390 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.surfaceChip, borderRadius: 16, padding: '10px 14px', marginBottom: 14 }}>
        <SearchIcon style={{ fontSize: 18, color: C.fgSubtle }}/>
        <span style={{ font: '500 13px/1 Inter', color: C.fgSubtle }}>Buscar recetas…</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['Todos', 'Pollo', 'Pescado', 'Vegetariano'].map((c, i) => (
          <div key={c} style={{ padding: '5px 14px', borderRadius: 999, flexShrink: 0, background: i === 0 ? C.primary : C.surfaceChip, color: i === 0 ? '#fff' : C.fgMuted, font: '700 11px Inter' }}>{c}</div>
        ))}
      </div>
      {items.map(r => (
        <div key={r.name} style={{ background: C.surfacePaper, borderRadius: 24, marginBottom: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ height: 110, background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <span style={{ fontSize: 36 }}>{r.emoji}</span>
            <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(8px)', padding: '3px 10px', borderRadius: 999, font: '700 11px Inter', color: C.primaryStrong }}>{r.kcal} kcal</div>
          </div>
          <div style={{ padding: '10px 14px 12px' }}>
            <div style={{ font: '700 14px Inter', color: C.fg, marginBottom: 6 }}>{r.name}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['P', 'HC', 'G'] as const).map(k => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 4, background: macroColors[k] }}/>
                  <span style={{ font: '600 11px Inter', color: C.fgMuted }}>{k} {r[k]}g</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Mockup: MenuView estático ─────────────────────
function MenuMockup() {
  const days = [
    { d: 'LUN', comidas: [['Desayuno', 'Avena con frutas'], ['Comida', 'Pollo al limón'], ['Cena', 'Ensalada templada']] },
    { d: 'MAR', comidas: [['Desayuno', 'Tortilla espinacas'], ['Comida', 'Salmón al vapor'], ['Cena', 'Crema verduras']] },
    { d: 'MIÉ', comidas: [['Desayuno', 'Batido proteico'], ['Comida', 'Pasta con atún'], ['Cena', 'Pechuga plancha']] },
  ]
  return (
    <div style={{ background: C.surface, padding: 16, width: 390 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 16, background: C.surfaceChip, display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 16px Inter', color: C.primaryStrong }}>‹</div>
        <div style={{ font: '700 13px Inter', color: C.fg }}>28 abr – 2 may</div>
        <div style={{ width: 32, height: 32, borderRadius: 16, background: C.surfaceChip, display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 16px Inter', color: C.primaryStrong }}>›</div>
      </div>
      <div style={{ background: 'linear-gradient(90deg, #4da8ff 0%, #005cb2 100%)', borderRadius: 16, padding: '10px 14px', marginBottom: 14, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ font: '800 15px Inter', letterSpacing: '-0.01em' }}>1.840 kcal</div>
        <div style={{ display: 'flex', gap: 12 }}>
          {[['P', '142g'], ['HC', '195g'], ['G', '68g']].map(([k, v]) => (
            <div key={k} style={{ textAlign: 'center' }}>
              <div style={{ font: '600 10px Inter', opacity: 0.85 }}>{k}</div>
              <div style={{ font: '700 12px Inter' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      {days.map(day => (
        <div key={day.d} style={{ background: C.surfacePaper, borderRadius: 16, padding: 12, marginBottom: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ font: '800 11px Inter', color: C.primaryStrong, letterSpacing: '0.08em', marginBottom: 8 }}>{day.d}</div>
          {day.comidas.map(([meal, recipe]) => (
            <div key={meal} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ font: '600 10px Inter', color: C.fgSubtle, width: 54, flexShrink: 0 }}>{meal}</div>
              <div style={{ font: '500 11px Inter', color: C.fg }}>{recipe}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Mockup: AjustesView estático ──────────────────
function AjustesMockup() {
  return (
    <div style={{ background: C.surface, padding: 16, width: 390 }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ width: 60, height: 60, borderRadius: 30, margin: '0 auto 8px', background: 'linear-gradient(135deg, #68548d, #4da8ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 22px Inter', color: '#fff' }}>A</div>
        <div style={{ font: '700 14px Inter', color: C.fg }}>Amalia</div>
        <div style={{ font: '500 11px Inter', color: C.fgSubtle }}>amalia@mybento.app</div>
      </div>
      {[['Peso', '68 kg'], ['Altura', '165 cm'], ['Edad', '29 años']].map(([label, value]) => (
        <div key={label} style={{ marginBottom: 10 }}>
          <div style={{ font: '700 10px Inter', color: C.fgSubtle, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
          <div style={{ background: C.surfaceChip, borderRadius: 12, padding: '9px 14px', font: '500 13px Inter', color: C.fg }}>{value}</div>
        </div>
      ))}
      <div style={{ marginBottom: 12 }}>
        <div style={{ font: '700 10px Inter', color: C.fgSubtle, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Objetivo</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['Perder', 'Mantener', 'Ganar'].map((o, i) => (
            <div key={o} style={{ flex: 1, padding: '8px 4px', borderRadius: 10, textAlign: 'center', background: i === 1 ? C.primaryStrong : C.surfaceChip, color: i === 1 ? '#fff' : C.fgMuted, font: '700 11px Inter' }}>{o}</div>
          ))}
        </div>
      </div>
      <div style={{ background: 'linear-gradient(135deg, rgba(0,92,178,0.08), rgba(104,84,141,0.08))', borderRadius: 16, padding: 12, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ font: '500 12px Inter', color: C.fgMuted }}>Kcal diarios</div>
        <div style={{ font: '800 20px Inter', color: C.primaryStrong, letterSpacing: '-0.02em' }}>2.200</div>
      </div>
      <div style={{ background: 'linear-gradient(90deg, #4da8ff 0%, #005cb2 100%)', borderRadius: 14, padding: '12px', textAlign: 'center', font: '700 13px Inter', color: '#fff' }}>Guardar cambios</div>
    </div>
  )
}

// ── Carcasa del teléfono ──────────────────────────
function LandingPhone({ view }: { view: 'recetas' | 'menu' | 'ajustes' }) {
  return (
    <div style={{ transform: 'scale(0.78)', transformOrigin: 'top center' }}>
      <div style={{ width: 390, height: 780, borderRadius: 44, border: '8px solid #1a1c1e', background: C.surface, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Status bar */}
        <div style={{ height: 36, flexShrink: 0, background: C.brand, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
          <span style={{ font: '600 12px Inter' }}>9:41</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <svg width="14" height="10" viewBox="0 0 18 12" fill="white"><path d="M1 10V8h2v2H1zm4 0V6h2v4H5zm4 0V3h2v7H9zm4 0V0h2v10h-2z"/></svg>
            <svg width="20" height="10" viewBox="0 0 24 12" fill="none"><rect x="1" y="1" width="20" height="10" rx="2.5" stroke="white" strokeOpacity=".4"/><rect x="3" y="3" width="13" height="6" rx="1" fill="white"/></svg>
          </div>
        </div>
        {/* AppBar */}
        <div style={{ height: 48, flexShrink: 0, background: C.brand, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={logoSimple} alt="MyBento" style={{ height: 20, filter: 'invert(1)', mixBlendMode: 'screen' }}/>
        </div>
        {/* Contenido */}
        <div style={{ flex: 1, overflowY: 'hidden', overflowX: 'hidden' }}>
          {view === 'recetas' && <RecetasMockup/>}
          {view === 'menu'    && <MenuMockup/>}
          {view === 'ajustes' && <AjustesMockup/>}
        </div>
        {/* Bottom nav */}
        <div style={{ height: 68, flexShrink: 0, background: 'rgba(200,215,255,0.92)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 8px' }}>
          {(['recetas', 'menu', 'ajustes'] as const).map(v => {
            const label = v === 'recetas' ? 'Recetas' : v === 'menu' ? 'Menú' : 'Ajustes'
            const Icon  = v === 'recetas' ? RestaurantIcon : v === 'menu' ? CalendarIcon : SettingsIcon
            const active = v === view
            return (
              <div key={v} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 16px', borderRadius: 16, background: active ? 'rgba(0,92,178,0.12)' : 'transparent', color: active ? C.primaryStrong : C.fgSubtle }}>
                <Icon style={{ fontSize: 20, color: 'inherit' }}/>
                <span style={{ font: '700 9px Inter', color: 'inherit' }}>{label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Átomos ────────────────────────────────────────
function Eyebrow({ children, color = C.brand }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ font: '700 11px Inter', letterSpacing: '0.14em', textTransform: 'uppercase', color, marginBottom: 14 }}>{children}</div>
  )
}

function SectionTitle({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return (
    <>
      <h2 style={{ font: '800 44px/1.1 Inter', letterSpacing: '-0.03em', color: C.fg, margin: '0 0 14px' }}>{children}</h2>
      {subtitle && <p style={{ font: '500 17px/1.55 Inter', color: C.fgMuted, margin: '0 auto', maxWidth: 560 }}>{subtitle}</p>}
    </>
  )
}

function PrimaryButton({ children, onClick, icon, size = 'md' }: { children: React.ReactNode; onClick?: () => void; icon?: React.ReactNode; size?: 'md' | 'lg' }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: 'linear-gradient(90deg, #4da8ff 0%, #005cb2 100%)', color: '#fff', border: 'none', padding: size === 'lg' ? '18px 32px' : '14px 24px', borderRadius: 16, font: `700 ${size === 'lg' ? 16 : 14}px Inter`, letterSpacing: '-0.005em', boxShadow: h ? '0 8px 28px rgba(0,130,253,0.38)' : '0 4px 16px rgba(0,130,253,0.25)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'box-shadow 200ms, transform 150ms cubic-bezier(.4,0,.2,1)', transform: h ? 'translateY(-1px)' : 'translateY(0)' }}>
      {icon}{children}
    </button>
  )
}

// ── TopNav ────────────────────────────────────────
function TopNav({ onSignIn, onSignUp }: { onSignIn: () => void; onSignUp: () => void }) {
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(254,247,253,0.82)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(104,84,141,0.08)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="#" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src={logoSimple} alt="MyBento" style={{ height: 28 }}/>
        </a>
        <nav style={{ display: 'flex', gap: 32 }}>
          {[
            ['Funcionalidades', '#funcionalidades'],
            ['Cómo funciona',   '#comofunciona'],
            ['Precios',         '#precios'],
            ['FAQ',             '#faq'],
          ].map(([l, href]) => (
            <a key={l} href={href}
              style={{ font: '600 14px Inter', color: C.fgMuted, textDecoration: 'none', transition: 'color 150ms' }}
              onMouseEnter={e => (e.currentTarget.style.color = C.brand)}
              onMouseLeave={e => (e.currentTarget.style.color = C.fgMuted)}
            >{l}</a>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onSignIn} style={{ background: 'transparent', border: 'none', cursor: 'pointer', font: '600 14px Inter', color: C.fgMuted, padding: '10px 8px' }}>Iniciar sesión</button>
          <button onClick={onSignUp}
            style={{ background: C.brand, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 12, font: '700 14px Inter', cursor: 'pointer', transition: 'background 150ms' }}
            onMouseEnter={e => (e.currentTarget.style.background = C.brandDark)}
            onMouseLeave={e => (e.currentTarget.style.background = C.brand)}
          >Regístrate</button>
        </div>
      </div>
    </header>
  )
}

// ── Hero ──────────────────────────────────────────
function Hero({ onSignUp }: { onSignUp: () => void }) {
  return (
    <section style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -220, left: -180, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(104,84,141,0.14) 0%, transparent 60%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }}/>
      <div style={{ position: 'absolute', top: 100, right: -200, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,130,253,0.10) 0%, transparent 60%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }}/>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '80px 32px 60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'rgba(104,84,141,0.08)', marginBottom: 24 }}>
            <AutoAwesomeIcon style={{ fontSize: 14, color: C.brand }}/>
            <span style={{ font: '700 12px Inter', color: C.brand, letterSpacing: '0.02em' }}>Ahora con Autofill inteligente</span>
          </div>
          <h1 style={{ font: '800 60px/1.05 Inter', letterSpacing: '-0.035em', color: C.fg, margin: '0 0 20px' }}>
            Planifica tu semana,<br/>
            <span style={{ background: 'linear-gradient(135deg, #68548d 0%, #4da8ff 60%, #005cb2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>come mejor sin pensarlo.</span>
          </h1>
          <p style={{ font: '500 19px/1.55 Inter', color: C.fgMuted, margin: '0 0 34px', maxWidth: 520 }}>
            MyBento es tu planificador de menús con macros y recetas guiadas por IA. Elige tus objetivos, llena la semana en un clic y cocina lo que tú quieres.
          </p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 36 }}>
            <PrimaryButton size="lg" onClick={onSignUp} icon={<AutoAwesomeIcon style={{ fontSize: 16 }}/>}>Empieza gratis</PrimaryButton>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            {[['✓', 'Sin tarjeta'], ['✓', 'En español'], ['✓', 'Cancelas cuando quieras']].map(([g, t], i) => (
              <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '600 13px Inter', color: C.fgMuted }}>
                <span style={{ width: 18, height: 18, borderRadius: 9, background: 'rgba(46,125,50,0.12)', color: '#2e7d32', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: '700 10px Inter' }}>{g}</span>
                {t}
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', height: 620 }}>
          <div style={{ position: 'absolute', left: '6%', top: 30, transform: 'rotate(-6deg) scale(0.72)', transformOrigin: 'top center', opacity: 0.72, filter: 'drop-shadow(0 20px 40px rgba(104,84,141,0.15))' }}>
            <LandingPhone view="menu"/>
          </div>
          <div style={{ position: 'relative', transform: 'scale(0.88)', transformOrigin: 'top center', filter: 'drop-shadow(0 30px 60px rgba(0,92,178,0.22))', zIndex: 2 }}>
            <LandingPhone view="recetas"/>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── SocialProof ───────────────────────────────────
function SocialProof() {
  const stats = [
    ['+1.200', 'recetas con macros calculados'],
    ['15 min',  'para planificar tu semana entera'],
    ['★ 4.8',   'de valoración media'],
    ['-30%',    'menos desperdicio en tu despensa'],
  ]
  return (
    <section style={{ borderTop: '1px solid rgba(104,84,141,0.08)', borderBottom: '1px solid rgba(104,84,141,0.08)', background: 'rgba(255,255,255,0.4)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 32px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32 }}>
        {stats.map(([n, t], i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ font: '800 28px/1 Inter', letterSpacing: '-0.02em', color: C.primaryStrong, marginBottom: 4 }}>{n}</div>
            <div style={{ font: '500 13px/1.4 Inter', color: C.fgMuted }}>{t}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Features ──────────────────────────────────────
function Features() {
  const features = [
    { Icon: RestaurantIcon,  color: '#4da8ff', bg: 'rgba(0,130,253,0.10)',  title: 'Recetas con macros al dedillo', body: 'Más de 1.200 recetas en español con kcal y macros por ración. Filtra por categoría, pollo, pescado o vegetariano.' },
    { Icon: CalendarIcon,    color: '#005cb2', bg: 'rgba(0,92,178,0.12)',   title: 'Planificador semanal',          body: 'Lunes a viernes, cinco momentos del día. Arrastra, cambia o deja que la IA te rellene la semana entera.' },
    { Icon: AutoAwesomeIcon, color: '#5071d5', bg: 'rgba(80,113,213,0.12)', title: 'Autofill con IA',               body: 'Dinos tu objetivo y pulsa AUTOFILL. En segundos tienes una semana equilibrada que respeta tus macros.' },
    { Icon: KitchenIcon,     color: '#68548d', bg: 'rgba(104,84,141,0.12)', title: 'Despensa Virtual',              body: '¿Qué tienes en la nevera? Escribe los ingredientes y te sugerimos recetas reales que puedes cocinar ya.' },
    { Icon: BoltIcon,        color: '#F57F17', bg: 'rgba(245,127,23,0.12)', title: 'Macros en tiempo real',         body: 'Proteínas, hidratos y grasas actualizados a medida que eliges platos. Kcal diarios calculados con tus datos.' },
    { Icon: SettingsIcon,    color: '#1565C0', bg: 'rgba(21,101,192,0.12)', title: 'Tu perfil, tus reglas',         body: 'Peso, altura, actividad y objetivo (perder, mantener, ganar). Cambia la distribución de macros cuando quieras.' },
  ]
  return (
    <section id="funcionalidades" style={{ padding: '100px 0', background: C.surface }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <Eyebrow>Funcionalidades</Eyebrow>
          <SectionTitle subtitle="Todo lo que necesitas para comer con cabeza, sin pasar horas pensando qué toca hoy.">
            Hecho para que no improvises la cena.
          </SectionTitle>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {features.map((f, i) => (
            <div key={i}
              style={{ background: C.surfacePaper, borderRadius: 24, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'box-shadow 250ms, transform 250ms', cursor: 'default' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,130,253,0.10)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 14, background: f.bg, color: f.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <f.Icon style={{ fontSize: 22, color: f.color }}/>
              </div>
              <h3 style={{ font: '800 18px/1.25 Inter', letterSpacing: '-0.015em', color: C.fg, margin: '0 0 8px' }}>{f.title}</h3>
              <p style={{ font: '500 14px/1.55 Inter', color: C.fgMuted, margin: 0 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── HowItWorks ────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n: '01', title: 'Define tu perfil',           body: 'Peso, altura, objetivo. Calculamos tus kcal y macros diarios automáticamente.',                        view: 'ajustes'  as const, accent: C.primary },
    { n: '02', title: 'Elige o deja que la IA elija', body: 'Navega por las recetas o pulsa AUTOFILL y ten la semana lista en segundos.',                         view: 'recetas'  as const, accent: C.primaryMid },
    { n: '03', title: 'Cocina sin pensar',           body: 'Cada día ves qué toca, con cantidades para tu peso y un resumen de macros.',                          view: 'menu'     as const, accent: C.primaryStrong },
  ]
  return (
    <section id="comofunciona" style={{ padding: '100px 0', background: 'linear-gradient(180deg, #fef7fd 0%, #f4eef5 100%)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <Eyebrow>Cómo funciona</Eyebrow>
          <SectionTitle subtitle="Tres pasos. Quince minutos el domingo. Toda tu semana resuelta.">
            De "¿qué ceno?" a "ya está hecho".
          </SectionTitle>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 40 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ height: 520, display: 'flex', justifyContent: 'center', marginBottom: 24, overflow: 'hidden', filter: 'drop-shadow(0 24px 40px rgba(0,92,178,0.12))' }}>
                <LandingPhone view={s.view}/>
              </div>
              <div style={{ font: '800 11px Inter', letterSpacing: '0.18em', color: s.accent, marginBottom: 10 }}>PASO {s.n}</div>
              <h3 style={{ font: '800 22px/1.2 Inter', letterSpacing: '-0.02em', color: C.fg, margin: '0 0 10px' }}>{s.title}</h3>
              <p style={{ font: '500 15px/1.55 Inter', color: C.fgMuted, margin: 0, maxWidth: 320 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── AutofillSpotlight ─────────────────────────────
function AutofillSpotlight() {
  return (
    <section style={{ padding: '100px 0', background: C.surface }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
        <div>
          <Eyebrow color={C.primaryStrong}>Autofill con IA</Eyebrow>
          <SectionTitle subtitle="Pulsa un botón. Obtienes un menú variado, con comida, cena, snacks y desayunos, que cuadra tus macros y respeta tus gustos.">
            El domingo ya no es para planear.
          </SectionTitle>
          <ul style={{ listStyle: 'none', padding: 0, margin: '28px 0 0', display: 'grid', gap: 14 }}>
            {[
              'Respeta tus kcal diarios y tu distribución de macros',
              'Evita repetir platos tres días seguidos',
              'Lo editas a mano cuando te apetezca',
              'Aprende de lo que guardas y rechazas',
            ].map((t, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, font: '500 15px/1.5 Inter', color: C.fgMuted }}>
                <span style={{ width: 22, height: 22, borderRadius: 11, flexShrink: 0, background: 'linear-gradient(135deg, #4da8ff, #005cb2)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: '700 11px Inter', marginTop: 1 }}>✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div style={{ background: 'linear-gradient(135deg, rgba(0,130,253,0.08) 0%, rgba(104,84,141,0.08) 100%)', borderRadius: 32, padding: '40px 20px 0', display: 'flex', justifyContent: 'center', height: 560, overflow: 'hidden' }}>
          <div style={{ filter: 'drop-shadow(0 20px 40px rgba(0,92,178,0.18))' }}>
            <LandingPhone view="menu"/>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Pricing ───────────────────────────────────────
function Pricing({ onSignUp }: { onSignUp: () => void }) {
  const plans = [
    { name: 'Gratis',   price: '0€',     per: 'para siempre', desc: 'Todo lo que necesitas para empezar a comer con cabeza.',  features: ['Hasta 30 recetas guardadas', 'Planificador semanal completo', 'Macros y kcal en tiempo real', 'Modo oscuro'],                                               cta: 'Empieza gratis', accent: false },
    { name: 'Pro',      price: '4,99 €', per: '/ mes',         desc: 'Añade IA, Despensa Virtual y recetas sin límite.',        features: ['Recetas ilimitadas', 'Autofill con IA', 'Despensa Virtual', 'Exportar a PDF / lista de la compra', 'Soporte prioritario'],                               cta: 'Probar Pro',     accent: true  },
  ]
  return (
    <section id="precios" style={{ padding: '100px 0', background: 'linear-gradient(180deg, #f4eef5 0%, #fef7fd 100%)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <Eyebrow>Precios</Eyebrow>
          <SectionTitle subtitle="Empieza gratis. Pásate a Pro cuando la IA te ahorre el primer domingo.">Sencillo. Sin letra pequeña.</SectionTitle>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {plans.map((p, i) => (
            <div key={i} style={{ background: p.accent ? 'linear-gradient(165deg, #4da8ff 0%, #005cb2 100%)' : C.surfacePaper, borderRadius: 28, padding: 36, position: 'relative', boxShadow: p.accent ? '0 20px 48px rgba(0,92,178,0.25)' : '0 1px 4px rgba(0,0,0,0.04)', color: p.accent ? '#fff' : C.fg }}>
              {p.accent && (
                <div style={{ position: 'absolute', top: -14, right: 24, background: C.brand, color: '#fff', padding: '4px 12px', borderRadius: 999, font: '800 10px Inter', letterSpacing: '0.1em', textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(104,84,141,0.35)' }}>Más popular</div>
              )}
              <div style={{ font: '800 16px Inter', marginBottom: 6 }}>{p.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 10 }}>
                <span style={{ font: '800 44px/1 Inter', letterSpacing: '-0.03em', color: p.accent ? '#fff' : C.primaryStrong }}>{p.price}</span>
                <span style={{ font: '500 14px Inter', opacity: p.accent ? 0.85 : 0.6 }}>{p.per}</span>
              </div>
              <p style={{ font: '500 14px/1.5 Inter', margin: '0 0 24px', opacity: p.accent ? 0.92 : 0.7, color: p.accent ? '#fff' : C.fgMuted }}>{p.desc}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px' }}>
                {p.features.map((f, j) => (
                  <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, font: '500 14px/1.5 Inter', padding: '6px 0', color: p.accent ? 'rgba(255,255,255,0.95)' : C.fg }}>
                    <span style={{ width: 18, height: 18, borderRadius: 9, flexShrink: 0, background: p.accent ? 'rgba(255,255,255,0.2)' : 'rgba(0,130,253,0.12)', color: p.accent ? '#fff' : C.primaryStrong, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: '700 11px Inter', marginTop: 1 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={onSignUp}
                style={{ width: '100%', background: p.accent ? '#fff' : C.brand, color: p.accent ? C.primaryStrong : '#fff', border: 'none', padding: '14px 20px', borderRadius: 14, font: '700 14px Inter', cursor: 'pointer', transition: 'transform 150ms' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >{p.cta}</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── FAQ ───────────────────────────────────────────
function FAQ() {
  const items: [string, string][] = [
    ['¿MyBento cuenta las calorías por mí?',    'Sí. Introduces peso, altura, edad, actividad y objetivo; calculamos tus kcal y macros diarios con la fórmula Mifflin-St Jeor y los repartimos según tu plan.'],
    ['¿La IA decide lo que como?',              'Sólo si tú quieres. Autofill propone una semana; puedes usarla tal cual, cambiar platos sueltos o hacerlo todo a mano como siempre.'],
    ['¿Puedo editar recetas o añadir las mías?','Claro. Puedes crear recetas desde cero, duplicar las existentes o generar un borrador con IA describiendo qué quieres cocinar.'],
    ['¿Qué es la Despensa Virtual?',            'Le dices qué tienes en la nevera y te sugerimos recetas reales de MyBento que puedes cocinar sin comprar nada más.'],
    ['¿Hay app móvil?',                         'MyBento funciona perfectamente en móvil desde el navegador. La versión iOS/Android nativa llegará pronto.'],
  ]
  const [open, setOpen] = useState<number>(0)
  return (
    <section id="faq" style={{ padding: '100px 0', background: C.surface }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Eyebrow>Preguntas frecuentes</Eyebrow>
          <SectionTitle>¿Dudas? Lo más habitual.</SectionTitle>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {items.map(([q, a], i) => {
            const isOpen = open === i
            return (
              <div key={i} style={{ background: C.surfacePaper, borderRadius: 16, overflow: 'hidden', boxShadow: isOpen ? '0 4px 20px rgba(0,130,253,0.08)' : '0 1px 3px rgba(0,0,0,0.04)', transition: 'box-shadow 200ms' }}>
                <button onClick={() => setOpen(isOpen ? -1 : i)}
                  style={{ width: '100%', background: 'transparent', border: 'none', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left', font: '700 16px/1.4 Inter', letterSpacing: '-0.01em', color: C.fg }}>
                  {q}
                  <span style={{ width: 28, height: 28, borderRadius: 14, flexShrink: 0, background: isOpen ? C.primary : C.surfaceChip, color: isOpen ? '#fff' : C.primaryStrong, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 180ms cubic-bezier(.4,0,.2,1)', transform: isOpen ? 'rotate(45deg)' : 'rotate(0)', marginLeft: 12 }}>
                    <AddIcon style={{ fontSize: 16 }}/>
                  </span>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 24px 22px', font: '500 14px/1.6 Inter', color: C.fgMuted }}>{a}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ── FinalCTA ──────────────────────────────────────
function FinalCTA({ onSignUp }: { onSignUp: () => void }) {
  return (
    <section style={{ padding: '80px 32px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', background: 'linear-gradient(135deg, #68548d 0%, #4a3870 60%, #005cb2 100%)', borderRadius: 40, padding: '72px 48px', textAlign: 'center', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -120, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(77,168,255,0.25)', filter: 'blur(60px)', pointerEvents: 'none' }}/>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ font: '800 48px/1.1 Inter', letterSpacing: '-0.03em', margin: '0 0 16px' }}>Tu próxima semana, ya planeada.</h2>
          <p style={{ font: '500 18px/1.55 Inter', opacity: 0.88, margin: '0 auto 32px', maxWidth: 540 }}>Prueba MyBento gratis. Si la IA no te ahorra el domingo, no te cobramos nada.</p>
          <button onClick={onSignUp}
            style={{ background: '#fff', color: C.brand, border: 'none', padding: '20px 40px', borderRadius: 18, font: '700 17px Inter', cursor: 'pointer', boxShadow: '0 10px 32px rgba(0,0,0,0.2)', transition: 'transform 150ms' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
          >Empieza gratis</button>
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────
function Footer() {
  const cols = [
    { t: 'Producto',  links: ['Funcionalidades', 'Precios', 'Novedades', 'Hoja de ruta'] },
    { t: 'Recursos',  links: ['Blog de recetas', 'Guía de macros', 'Centro de ayuda', 'Contacto'] },
    { t: 'Empresa',   links: ['Sobre nosotros', 'Trabaja con nosotros', 'Prensa', 'Términos'] },
  ]
  return (
    <footer style={{ background: C.surfacePaper, borderTop: '1px solid rgba(104,84,141,0.08)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 32px 32px', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 40 }}>
        <div>
          <img src={logoSimple} alt="MyBento" style={{ height: 28, marginBottom: 14 }}/>
          <p style={{ font: '500 14px/1.55 Inter', color: C.fgMuted, margin: 0, maxWidth: 280 }}>
            Tu planificador de menús con macros y recetas en español. Hecho en Madrid con ❤.
          </p>
        </div>
        {cols.map((c, i) => (
          <div key={i}>
            <div style={{ font: '800 12px Inter', letterSpacing: '0.12em', textTransform: 'uppercase', color: C.fg, marginBottom: 16 }}>{c.t}</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {c.links.map((l, j) => (
                <a key={j} href="#" style={{ font: '500 14px Inter', color: C.fgMuted, textDecoration: 'none', transition: 'color 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.brand)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.fgMuted)}
                >{l}</a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 32px 40px', borderTop: '1px solid rgba(104,84,141,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', font: '500 12px Inter', color: C.fgSubtle }}>
        <span>© 2025 MyBento. Todos los derechos reservados.</span>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacidad', 'Términos', 'Cookies'].map(l => (
            <a key={l} href="#" style={{ color: C.fgSubtle, textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
      </div>
    </footer>
  )
}

// ── Modal de login ────────────────────────────────
function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) {
      document.addEventListener('keydown', k)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', k)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(20,15,30,0.55)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 200ms ease-out' }}>
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: 1000, height: 800, borderRadius: 32, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.25)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', color: C.fg }}>
          <CloseIcon style={{ fontSize: 20 }}/>
        </button>
        <div style={{ width: '100%', height: '100%' }}>
          <LoginView/>
        </div>
      </div>
    </div>
  )
}

// ── LandingView (export) ──────────────────────────
export default function LandingView() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [authOpen, setAuthOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate('/recipes', { replace: true })
  }, [isAuthenticated, isLoading, navigate])

  if (isLoading) return null

  const openAuth = () => setAuthOpen(true)

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        html { scroll-behavior: smooth; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Inter', sans-serif; background: #fef7fd; }
      `}</style>
      <TopNav onSignIn={openAuth} onSignUp={openAuth}/>
      <Hero onSignUp={openAuth}/>
      <SocialProof/>
      <Features/>
      <HowItWorks/>
      <AutofillSpotlight/>
      <Pricing onSignUp={openAuth}/>
      <FAQ/>
      <FinalCTA onSignUp={openAuth}/>
      <Footer/>
      <LoginModal open={authOpen} onClose={() => setAuthOpen(false)}/>
    </>
  )
}
