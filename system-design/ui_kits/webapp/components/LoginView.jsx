/* ─────────────────────────────────────────
   MyBento — Login view
   Tomado el layout de la referencia pero con
   el lenguaje visual de MyBento: azul producto
   + acento morado de marca, Inter, es-ES.
   ───────────────────────────────────────── */

const { AutoAwesomeIcon } = window;

function LoginView({ width = 1000, height = 800 }) {
  const [mode, setMode] = React.useState('login'); // login | signup
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');

  const wrapStyle = {
    width, height,
    position: 'relative',
    background: 'var(--mb-surface)',     // #fef7fd
    fontFamily: 'Inter, sans-serif',
    color: 'var(--mb-fg)',
    overflow: 'hidden',
  };

  return (
    <div style={wrapStyle}>
      {/* Ambient blobs — very subtle, no AI-slop gradients */}
      <div style={{
        position: 'absolute', top: -180, left: -160, width: 520, height: 520,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(104,84,141,0.10) 0%, transparent 60%)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', bottom: -220, right: -180, width: 640, height: 640,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,130,253,0.08) 0%, transparent 60%)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
      }}/>

      {/* ── Top bar ────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '24px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: 2,
      }}>
        <img src="../../assets/mybento-logo.png" alt="MyBento"
          style={{ height: 28, objectFit: 'contain' }}/>
        <button style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          font: '600 13px Inter', color: 'var(--mb-fg-muted)',
        }}>
          <span style={{
            width: 20, height: 20, borderRadius: '50%',
            background: 'var(--mb-fg-subtle)', color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700,
          }}>?</span>
          Ayuda
        </button>
      </div>

      {/* ── Card ──────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 380,
        zIndex: 1,
      }}>
        <div style={{
          background: 'var(--mb-surface-paper)',
          borderRadius: 28,
          padding: '36px 36px 28px',
          boxShadow: '0 8px 48px rgba(73,69,78,0.08), 0 1px 4px rgba(0,130,253,0.04)',
        }}>
          {/* Badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: 'linear-gradient(135deg, #68548d 0%, #b39ddb 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(104,84,141,0.3)',
              color: '#fff',
            }}>
              {/* Fork + knife glyph (same as RestaurantIcon, white) */}
              <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.1 13.34l2.83-2.83L3.91 3.5a4 4 0 0 0 0 5.66zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12s-4.21-1.1-6.12.81c-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"/>
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 style={{
            font: '800 26px/1.2 Inter',
            letterSpacing: '-0.02em',
            color: 'var(--mb-fg)',
            margin: '0 0 6px',
            textAlign: 'center',
          }}>
            {mode === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
          </h1>
          <p style={{
            font: '500 14px Inter',
            color: 'var(--mb-fg-muted)',
            margin: '0 0 24px',
            textAlign: 'center',
            textWrap: 'pretty',
          }}>
            {mode === 'login'
              ? 'Planifica tu menú y gestiona tus macros'
              : 'Empieza a planificar menús saludables en minutos'}
          </p>

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            {mode === 'signup' && (
              <Field label="Nombre" placeholder="Cómo te llamamos" />
            )}
            <Field label="Correo electrónico" placeholder="tu@email.com" type="email" value={email} onChange={setEmail} />
            <Field label="Contraseña" placeholder="••••••••" type="password" value={pw} onChange={setPw}
              trailing={mode === 'login' ? (
                <button style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  font: '700 11px Inter',
                  color: 'var(--mb-primary-strong)',
                  letterSpacing: '0.02em',
                  padding: 0,
                }}>¿Olvidaste?</button>
              ) : null}
            />
          </div>

          {/* CTA — MyBento's primary blue gradient */}
          <button style={{
            width: '100%',
            background: 'linear-gradient(90deg, #4da8ff 0%, #005cb2 100%)',
            color: '#fff',
            border: 'none',
            padding: '15px 24px',
            borderRadius: 16,
            font: '700 15px Inter',
            letterSpacing: '-0.005em',
            boxShadow: '0 4px 16px rgba(0,130,253,0.25)',
            cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'transform 150ms cubic-bezier(.4,0,.2,1), box-shadow 200ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 22px rgba(0,130,253,0.35)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,130,253,0.25)'; }}
          >
            {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>

          {/* Secondary link */}
          <div style={{
            textAlign: 'center',
            marginTop: 20,
            font: '500 13px Inter',
            color: 'var(--mb-fg-muted)',
          }}>
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                font: '700 13px Inter',
                color: 'var(--mb-primary-strong)',
                padding: 0,
                letterSpacing: '-0.005em',
              }}>
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </div>
        </div>

      </div>

      {/* ── Legal footer ─────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 20, left: 0, right: 0,
        textAlign: 'center',
        font: '500 11px Inter',
        color: 'var(--mb-fg-subtle)',
        zIndex: 2,
      }}>
        Al continuar aceptas los <a href="#" style={{ color: 'var(--mb-primary-strong)', textDecoration: 'none', fontWeight: 700 }}>Términos</a> y la <a href="#" style={{ color: 'var(--mb-primary-strong)', textDecoration: 'none', fontWeight: 700 }}>Política de Privacidad</a>
      </div>
    </div>
  );
}

function Field({ label, placeholder, type = 'text', value, onChange, trailing }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 6,
      }}>
        <label style={{
          font: '700 10px Inter',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--mb-fg-subtle)',
        }}>{label}</label>
        {trailing}
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          width: '100%',
          background: 'var(--mb-surface-chip)',
          border: 'none',
          borderRadius: 12,
          padding: '13px 16px',
          font: '500 14px Inter',
          color: 'var(--mb-fg)',
          outline: 'none',
          boxShadow: focus ? 'inset 0 0 0 2px var(--mb-primary)' : 'none',
          transition: 'box-shadow 150ms cubic-bezier(.4,0,.2,1)',
        }}
      />
    </div>
  );
}

function SocialButton({ children, label }) {
  return (
    <button
      aria-label={label}
      style={{
        flex: 1,
        background: 'var(--mb-surface-paper)',
        border: '1px solid rgba(121,116,126,0.18)',
        borderRadius: 14,
        padding: '10px 16px',
        font: '600 13px Inter',
        color: 'var(--mb-fg)',
        cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'all 150ms cubic-bezier(.4,0,.2,1)',
        maxWidth: 150,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {children}
      {label}
    </button>
  );
}

window.LoginView = LoginView;
