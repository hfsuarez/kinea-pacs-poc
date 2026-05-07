/**
 * Login.tsx — Split-card login (white form + cyan-gradient hero).
 *
 * Aplica el design system del handoff de Claude Design pero mantiene la
 * lógica real (fetch a /api/login.php, manejo de errores, redirect).
 * El mock auth (admin/admin) NO es nuestro: el backend valida contra usuarios
 * de la tabla `usuario` con bcrypt.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import kineaMark from '../assets/brand/kinea-mark.svg';

const PHP = import.meta.env.VITE_PHP_BASE || 'http://127.0.0.1:8080';

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
        {/* ── form ── */}
        <div className="login-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <img src={kineaMark} alt="KINEA" width={50} height={50} style={{ boxShadow: 'var(--shadow-brand)', borderRadius: '50%' }} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#212529', letterSpacing: .3 }}>KINEA</div>
              <div className="caps" style={{ color: '#6c757d' }}>PACS Explorer</div>
            </div>
          </div>

          <h3 style={{ color: '#495057', margin: '24px 0 28px', fontWeight: 500, fontSize: 16 }}>
            Ingrese sus credenciales para continuar
          </h3>

          <form onSubmit={submit}>
            <div style={{ marginBottom: 20 }}>
              <label className="caps" style={{ color: '#6c757d', display: 'block', marginBottom: 4 }}>Usuario</label>
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
              <label className="caps" style={{ color: '#6c757d', display: 'block', marginBottom: 4 }}>Contraseña</label>
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
              <a href="#" style={{ color: 'var(--kinea-cyan)', textDecoration: 'none' }}>Términos y Condiciones</a>.
            </div>
          </div>
        </div>

        {/* ── hero ── */}
        <div className="login-right">
          <div className="tagline">
            <div style={{
              width: 80, height: 80, margin: '0 auto 20px',
              borderRadius: '50%', background: 'rgba(255,255,255,.1)',
              border: '2px solid rgba(255,255,255,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(10px)',
            }}>
              <LayoutDashboard size={40} color="#fff" strokeWidth={1.5} />
            </div>
            <h2>Sistema de Imagenología</h2>
            <p>Worklist · DICOM · Informes</p>
            <div className="caps" style={{ marginTop: 32, color: 'var(--kinea-cyan-light)', letterSpacing: 1 }}>
              KINEA · Centro de Diagnóstico
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
