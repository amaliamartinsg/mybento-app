/* ─────────────────────────────────────────
   MyBento — Recetas view
   Grid with category chips, search, recipe cards.
   ───────────────────────────────────────── */

const {
  RestaurantIcon, CalendarIcon, SettingsIcon, SearchIcon,
  AddIcon, AutoAwesomeIcon, KitchenIcon, DarkModeIcon, LightModeIcon
} = window;

const CATS = [
  { id: 'all', label: 'Todas', emoji: null },
  { id: 'principales', label: 'Principales', emoji: '🍽️' },
  { id: 'snacks', label: 'Snacks', emoji: null },
  { id: 'desayunos', label: 'Desayunos', emoji: null },
  { id: 'postres', label: 'Postres', emoji: null },
  { id: 'bebidas', label: 'Bebidas', emoji: null },
];

const RECIPES = [
  { id: 1, cat: 'Pollo', name: 'Pollo al curry con arroz basmati', kcal: 420, p: 38, h: 45, g: 12, emoji: '🍲', bg: 'linear-gradient(135deg,#ffd8a8,#ffb066)' },
  { id: 2, cat: 'Ensaladas', name: 'Ensalada César ligera', kcal: 290, p: 28, h: 18, g: 14, emoji: '🥗', bg: 'linear-gradient(135deg,#c3e8c8,#7fc88a)' },
  { id: 3, cat: 'Pescado', name: 'Salmón al horno con verduras', kcal: 380, p: 34, h: 22, g: 18, emoji: '🐟', bg: 'linear-gradient(135deg,#ffc2b8,#ff9180)' },
  { id: 4, cat: 'Pasta', name: 'Espaguetis con pesto y pollo', kcal: 510, p: 32, h: 58, g: 16, emoji: '🍝', bg: 'linear-gradient(135deg,#fff4a3,#ffdb6b)' },
  { id: 5, cat: 'Vegetariano', name: 'Crema de calabaza asada', kcal: 220, p: 8, h: 32, g: 7, emoji: '🎃', bg: 'linear-gradient(135deg,#ffcc80,#ff8a4a)' },
  { id: 6, cat: 'Tortilla', name: 'Tortilla de patatas tradicional', kcal: 350, p: 18, h: 28, g: 20, emoji: '🍳', bg: 'linear-gradient(135deg,#ffe49c,#ffc34a)' },
];

function RecetasView() {
  const [cat, setCat] = React.useState('principales');
  const [q, setQ] = React.useState('');
  const [tab, setTab] = React.useState('all');

  return (
    <>
      {/* Tab selector */}
      <div style={{ display: 'flex', gap: 2, padding: '12px 16px 0' }}>
        <button onClick={() => setTab('all')}
          style={{
            flex: 1, border: 'none', background: 'transparent',
            padding: '10px 0', fontWeight: tab === 'all' ? 700 : 500, fontSize: 15,
            color: tab === 'all' ? 'var(--mb-primary)' : 'var(--mb-fg-3)',
            borderBottom: tab === 'all' ? '2px solid var(--mb-primary)' : '2px solid transparent',
            cursor: 'pointer',
          }}>
          Recetas
        </button>
        <button onClick={() => setTab('snacks')}
          style={{
            flex: 1, border: 'none', background: 'transparent',
            padding: '10px 0', fontWeight: tab === 'snacks' ? 700 : 500, fontSize: 15,
            color: tab === 'snacks' ? 'var(--mb-primary)' : 'var(--mb-fg-3)',
            borderBottom: tab === 'snacks' ? '2px solid var(--mb-primary)' : '2px solid transparent',
            cursor: 'pointer',
          }}>
          Snacks Rápidos
        </button>
      </div>

      {/* Search */}
      <div className="mb-search">
        <SearchIcon size={20} />
        <input placeholder="Buscar recetas saludables…" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {/* Category chips */}
      <div className="mb-chip-row">
        {CATS.map(c => (
          <button key={c.id}
            className={'mb-chip ' + (cat === c.id ? 'on' : '')}
            onClick={() => setCat(c.id)}>
            {c.emoji && <span style={{ marginRight: 4 }}>{c.emoji}</span>}
            {c.label}
          </button>
        ))}
      </div>

      {/* Despensa Virtual entry */}
      <div style={{
        margin: '4px 16px 0', padding: '12px 14px',
        background: 'linear-gradient(135deg, rgba(104,84,141,0.08), rgba(104,84,141,0.14))',
        borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12, background: 'var(--mb-brand)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><KitchenIcon size={20} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ font: '700 13px Inter', color: 'var(--mb-brand)', marginBottom: 1 }}>Despensa Virtual</div>
          <div style={{ font: '500 11px Inter', color: 'var(--mb-fg-3)' }}>Busca recetas con los ingredientes que tienes</div>
        </div>
        <span style={{ color: 'var(--mb-brand)' }}>›</span>
      </div>

      {/* Recipe grid */}
      <div className="mb-grid">
        {RECIPES.map(r => (
          <div key={r.id} className="mb-recipe">
            <div className="mb-recipe-imgwrap">
              <div className="mb-recipe-img" style={{ background: r.bg }}>{r.emoji}</div>
              <div className="mb-recipe-kcal">{r.kcal} kcal/ración</div>
            </div>
            <div className="mb-recipe-body">
              <div className="mb-recipe-cat">{r.cat}</div>
              <div className="mb-recipe-name">{r.name}</div>
              <div className="mb-recipe-tags">
                <span className="mb-tag p">P: {r.p}g</span>
                <span className="mb-tag h">HC: {r.h}g</span>
                <span className="mb-tag g">G: {r.g}g</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button className="mb-fab" aria-label="Añadir receta">
        <AddIcon size={26} />
      </button>
    </>
  );
}

window.RecetasView = RecetasView;
