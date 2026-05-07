import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PHP = 'http://127.0.0.1:8080';

export default function LoginPage() {
  const nav = useNavigate();
  const [usuario, setU] = useState('admin');
  const [clave, setC] = useState('admin');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const r = await fetch(`${PHP}/ecos/pacsexplorerwsp/api/login.php`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, clave }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Usuario o contraseña incorrectos.'); return; }
      nav('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally { setLoading(false); }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        {/* ── lado izquierdo: form ── */}
        <div className="login-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 50, height: 50, borderRadius: '50%',
              background: '#01A3E4', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 24,
              boxShadow: '0 4px 12px rgba(1,163,228,.4)',
            }}>K</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#212529', letterSpacing: .3 }}>KINEA</div>
              <div style={{ fontSize: 12, color: '#6c757d', letterSpacing: .8, textTransform: 'uppercase' }}>
                PACS Explorer
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 500, color: '#495057', margin: '24px 0 28px' }}>
            Ingrese sus credenciales para continuar
          </h3>

          <form onSubmit={submit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: .5, color: '#6c757d', fontWeight: 600 }}>
                Usuario
              </label>
              <input
                className="login-input"
                type="text"
                value={usuario}
                onChange={e => setU(e.target.value)}
                required
                autoFocus
                placeholder="usuario"
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: .5, color: '#6c757d', fontWeight: 600 }}>
                Contraseña
              </label>
              <input
                className="login-input"
                type="password"
                value={clave}
                onChange={e => setC(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div style={{
                background: '#fdecea', border: '1px solid #f5c6cb', color: '#721c24',
                padding: '8px 12px', borderRadius: 4, fontSize: 13, marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="login-btn">
              {loading ? 'Ingresando…' : 'INGRESAR'}
            </button>
          </form>

          <div style={{ marginTop: 32, paddingTop: 18, borderTop: '1px solid #e9ecef', textAlign: 'center' }}>
            <div style={{ fontSize: 10.5, color: '#adb5bd', lineHeight: 1.5 }}>
              El uso de la Plataforma conlleva la aceptación obligatoria de los{' '}
              <a href="#" style={{ color: '#01A3E4', textDecoration: 'none' }}>Términos y Condiciones</a>.
            </div>
          </div>
        </div>

        {/* ── lado derecho: imagen / branding ── */}
        <div className="login-right">
          <div className="tagline">
            <div style={{
              width: 80, height: 80, margin: '0 auto 20px',
              borderRadius: '50%', background: 'rgba(255,255,255,.1)',
              border: '2px solid rgba(255,255,255,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(10px)',
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <h2>Sistema de Imagenología</h2>
            <p>Worklist · DICOM · Informes</p>
            <div style={{
              marginTop: 32, fontSize: 11, color: '#82c8e3', letterSpacing: 1,
              textTransform: 'uppercase',
            }}>
              KINEA · Centro de Diagnóstico
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
