/* ─────────────────────────────────────────
   MyBento — Ajustes view (Mi Perfil)
   ───────────────────────────────────────── */

const { SettingsIcon, SaveIcon, AutoAwesomeIcon, EditIcon } = window;

function AjustesView() {
  const [obj, setObj] = React.useState('mantenimiento');
  const [act, setAct] = React.useState('moderado');

  return (
    <>
      {/* Page header */}
      <div style={{ padding: '16px 20px 8px' }}>
        <div className="mb-eyebrow">Ajustes</div>
        <h1 className="mb-h1" style={{ marginTop: 4 }}>Mi Perfil</h1>
        <div style={{ font: '500 13px Inter', color: 'var(--mb-fg-3)', marginTop: 4 }}>
          Personaliza tus objetivos y macros
        </div>
      </div>

      {/* Physical profile */}
      <div className="mb-section">
        <div className="hdr">
          <div className="mb-icon"><SettingsIcon size={18} /></div>
          <div>
            <div className="mb-h2" style={{ fontSize: 16 }}>Datos físicos</div>
            <div style={{ font: '500 11px Inter', color: 'var(--mb-fg-3)' }}>
              Para calcular tus kcal objetivo
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="mb-field">
            <label>Peso</label>
            <input className="mb-input" defaultValue="74 kg" />
          </div>
          <div className="mb-field">
            <label>Altura</label>
            <input className="mb-input" defaultValue="178 cm" />
          </div>
          <div className="mb-field">
            <label>Edad</label>
            <input className="mb-input" defaultValue="32" />
          </div>
          <div className="mb-field">
            <label>Sexo</label>
            <input className="mb-input" defaultValue="Hombre" />
          </div>
        </div>

        <div className="mb-field">
          <label>Nivel de actividad</label>
          <div className="mb-toggle-group" style={{ display: 'flex' }}>
            {[
              ['sedentario', 'Sedentario'],
              ['moderado', 'Moderado'],
              ['activo', 'Activo'],
            ].map(([v, l]) => (
              <button key={v} className={act === v ? 'on' : ''} onClick={() => setAct(v)} style={{ flex: 1 }}>{l}</button>
            ))}
          </div>
        </div>

        <div className="mb-field" style={{ marginBottom: 0 }}>
          <label>Objetivo</label>
          <div className="mb-toggle-group" style={{ display: 'flex' }}>
            {[
              ['perder', 'Perder'],
              ['mantenimiento', 'Mantenimiento'],
              ['ganar', 'Ganar'],
            ].map(([v, l]) => (
              <button key={v} className={obj === v ? 'on' : ''} onClick={() => setObj(v)} style={{ flex: 1 }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Kcal objective */}
      <div className="mb-section" style={{
        background: 'linear-gradient(135deg, rgba(0,130,253,0.05), rgba(0,130,253,0.12))',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="mb-eyebrow">Kcal · día</div>
            <div style={{ font: '800 36px/1 Inter', letterSpacing: '-0.02em', color: 'var(--mb-primary-strong)', marginTop: 6 }}>
              2.200
              <span style={{ font: '500 13px Inter', color: 'var(--mb-fg-2)', marginLeft: 6 }}>kcal</span>
            </div>
            <div style={{ font: '500 11px Inter', color: 'var(--mb-fg-3)', marginTop: 4 }}>
              Calculado con tus datos
            </div>
          </div>
          <button style={{
            background: 'rgba(255,255,255,0.7)',
            border: 'none', padding: '6px 12px', borderRadius: 999,
            color: 'var(--mb-primary-strong)', font: '700 11px Inter', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <EditIcon size={12} /> Editar
          </button>
        </div>
      </div>

      {/* Macro distribution */}
      <div className="mb-section">
        <div className="hdr">
          <div className="mb-icon"><AutoAwesomeIcon size={18} /></div>
          <div>
            <div className="mb-h2" style={{ fontSize: 16 }}>Distribución de macros</div>
            <div style={{ font: '500 11px Inter', color: 'var(--mb-fg-3)' }}>
              % sobre 2.200 kcal/día
            </div>
          </div>
        </div>
        {[
          { name: 'Proteínas', pct: 30, g: 165, color: 'var(--mb-macro-p)' },
          { name: 'Hidratos', pct: 45, g: 248, color: 'var(--mb-macro-h)' },
          { name: 'Grasas', pct: 25, g: 61, color: 'var(--mb-macro-g)' },
        ].map(m => (
          <div key={m.name} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span className="mb-macro-name">{m.name}</span>
              <span className="mb-macro-val" style={{ color: m.color }}>{m.pct}% · {m.g}g</span>
            </div>
            <div className="mb-macro-rail"><div style={{ width: m.pct * 2 + '%', background: m.color }} /></div>
          </div>
        ))}
      </div>

      {/* Save button */}
      <div style={{ padding: '12px 16px 100px' }}>
        <button className="mb-save">
          <SaveIcon size={18} /> Guardar perfil
        </button>
      </div>
    </>
  );
}

window.AjustesView = AjustesView;
