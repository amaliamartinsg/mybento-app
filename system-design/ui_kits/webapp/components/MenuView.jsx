/* ─────────────────────────────────────────
   MyBento — Menú view (weekly planner)
   ───────────────────────────────────────── */

const { ChevronLeftIcon, ChevronRightIcon, AutoAwesomeIcon, BoltIcon, AddIcon } = window;

const DAYS = [
  { wk: 'LUN', num: 20, filled: [true, true, { pair: true }, true, false] },
  { wk: 'MAR', num: 21, filled: [true, false, true, true, true] },
  { wk: 'MIÉ', num: 22, filled: [true, true, true, false, true] },
  { wk: 'JUE', num: 23, filled: [false, false, { pair: true }, true, true] },
  { wk: 'VIE', num: 24, filled: [true, true, true, true, false] },
];

const MEALS = {
  0: ['Avena con arándanos', 'Tostada aguacate', 'Yogur con fruta', 'Batido proteína', 'Huevos revueltos'],
  1: ['Almendras', '', 'Fruta de temporada', 'Yogur natural', 'Barrita energética'],
  2: ['Pollo al curry + arroz', 'Ensalada César', { a: 'Crema calabaza', b: 'Pollo al limón' }, 'Salmón con quinoa', 'Pasta pesto'],
  3: ['Zanahoria + hummus', 'Tortitas de arroz', 'Fruta', 'Yogur griego', 'Queso fresco'],
  4: ['Tortilla francesa', 'Sopa de verduras', 'Ensalada atún', 'Salmón + brocoli', ''],
};

const SLOT_NAMES = ['Desayuno', 'M. Mañana', 'Comida', 'Merienda', 'Cena'];

function MenuView() {
  return (
    <>
      {/* Week strip */}
      <div className="mb-week-bar">
        <button className="nav"><ChevronLeftIcon size={22} /></button>
        <div className="title">
          <small>SEMANA 20 – 24 ENERO</small>
          <span>LUN MAR MIÉ JUE VIE</span>
        </div>
        <button className="nav"><ChevronRightIcon size={22} /></button>
      </div>

      {/* Autofill action row */}
      <div style={{
        padding: '10px 16px 4px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div className="mb-eyebrow">Planificador</div>
          <div style={{ font: '800 17px Inter', letterSpacing: '-0.02em', marginTop: 2 }}>
            Menú semanal
          </div>
        </div>
        <button className="mb-autofill">
          <AutoAwesomeIcon size={14} /> AUTOFILL
        </button>
      </div>

      {/* Day summary */}
      <div className="mb-day-summary">
        <div className="head">
          <div>
            <div className="label">Hoy · Lunes 20</div>
            <div className="kcal">1.840<span>/ 2.200 kcal</span></div>
          </div>
          <div className="bolt"><BoltIcon size={20} /></div>
        </div>
        <div className="mb-kcal-bar"><div style={{ width: '84%' }} /></div>
        <div className="mb-macros">
          <div className="mb-macro">
            <div className="mb-macro-top">
              <span className="mb-macro-name">Proteínas</span>
              <span className="mb-macro-val" style={{ color: 'var(--mb-macro-p)' }}>138g</span>
            </div>
            <div className="mb-macro-rail"><div style={{ width: '84%', background: 'var(--mb-macro-p)' }} /></div>
          </div>
          <div className="mb-macro">
            <div className="mb-macro-top">
              <span className="mb-macro-name">Hidratos</span>
              <span className="mb-macro-val" style={{ color: 'var(--mb-macro-h)' }}>201g</span>
            </div>
            <div className="mb-macro-rail"><div style={{ width: '81%', background: 'var(--mb-macro-h)' }} /></div>
          </div>
          <div className="mb-macro">
            <div className="mb-macro-top">
              <span className="mb-macro-name">Grasas</span>
              <span className="mb-macro-val" style={{ color: 'var(--mb-macro-g)' }}>52g</span>
            </div>
            <div className="mb-macro-rail"><div style={{ width: '85%', background: 'var(--mb-macro-g)' }} /></div>
          </div>
        </div>
      </div>

      {/* Day rows */}
      <div style={{ padding: '4px 0 100px' }}>
        <div style={{ padding: '4px 16px 6px', display: 'grid', gridTemplateColumns: '62px 1fr 1fr', gap: 10 }}>
          <div />
          <div className="mb-eyebrow">Des · M.Mañ · Comida</div>
          <div className="mb-eyebrow" style={{ textAlign: 'right' }}>Mer · Cena</div>
        </div>

        {DAYS.map((d, di) => (
          <div key={di} className="mb-dayrow">
            <div className="mb-dayside">
              <span className="wk">{d.wk}</span>
              <span className="num">{d.num}</span>
            </div>
            <div className="mb-slots">
              {d.filled.map((f, si) => {
                const meal = MEALS[si][di];
                if (typeof meal === 'object' && meal) {
                  return (
                    <div key={si} className="mb-slot filled pair">
                      <div className="course"><b>1°</b><span>{meal.a}</span></div>
                      <div className="sep" />
                      <div className="course"><b>2°</b><span>{meal.b}</span></div>
                    </div>
                  );
                }
                if (f && meal) {
                  return <div key={si} className="mb-slot filled"><span>{meal}</span></div>;
                }
                return <div key={si} className="mb-slot empty">+</div>;
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

window.MenuView = MenuView;
