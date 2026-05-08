/**
 * Chrome.tsx — Top navbar + Sidebar shell compartidos por todas las
 * pantallas autenticadas. Adoptado del handoff de Claude Design.
 *
 * Uso:
 *   <ChromeShell user={…} current="worklist">
 *     <Sidebar>…</Sidebar>
 *     <main>…contenido…</main>
 *   </ChromeShell>
 */

import { type ReactNode } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  Menu, Eye, BarChart3, FileText, Bell, Maximize2,
  User as UserIcon, ChevronDown, LogOut,
} from 'lucide-react';

const PHP = import.meta.env.VITE_PHP_BASE || 'http://127.0.0.1:8080';

export type CurrentRoute = 'worklist' | 'dashboard' | 'historial' | 'study';

export interface ChromeUser {
  nombre?: string;
  usuario?: string;
}

interface NavbarProps {
  user?: ChromeUser | null;
  current: CurrentRoute;
  onToggleSidebar?: () => void;
}

export function Navbar({ user, current, onToggleSidebar }: NavbarProps) {
  const nav = useNavigate();

  async function logout() {
    try {
      await fetch(`${PHP}/ecos/pacsexplorerwsp/logout.php`, { credentials: 'include' });
    } catch {
      /* sin red, igual cerramos sesión local */
    }
    nav('/login');
  }

  function fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  }

  return (
    <nav className="adm-navbar">
      <button className="nav-link" title="Toggle menú" onClick={onToggleSidebar}>
        <Menu size={18} />
      </button>

      <NavLink to="/" className={`nav-link ${current === 'worklist' ? 'active' : ''}`}>
        <Eye size={14} /> Worklist
      </NavLink>
      <NavLink to="/dashboard" className={`nav-link ${current === 'dashboard' ? 'active' : ''}`}>
        <BarChart3 size={14} /> Dashboard
      </NavLink>
      <a className="nav-link" href={`${PHP}/ecos/pacsexplorerwsp/historial.php`} target="_blank" rel="noreferrer">
        <FileText size={14} /> Historial
      </a>

      <span className="spacer" />

      <button className="nav-link" title="Notificaciones"><Bell size={16} /></button>
      <button className="nav-link" title="Pantalla completa" onClick={fullscreen}>
        <Maximize2 size={16} />
      </button>
      <div className="nav-link" title="Usuario">
        <UserIcon size={16} />
        <span>{user?.nombre || '—'}</span>
        <ChevronDown size={12} />
      </div>
      <button className="nav-link danger" onClick={logout} title="Cerrar sesión">
        <LogOut size={16} />
      </button>
    </nav>
  );
}

interface SidebarProps {
  children: ReactNode;
}

/**
 * Sidebar — wrapper con brand link "Pentalogic-style".
 * El producto es "PACS Explorer", KINEA es la marca corporativa (sutil arriba).
 * La navegación NO se duplica acá: ya está en la top navbar. El sidebar es
 * exclusivamente para filtros (worklist) o controles contextuales (study, dashboard).
 */
export function Sidebar({ children }: SidebarProps) {
  return (
    <aside className="adm-sidebar">
      <div className="brand-link brand-pentalogic">
        <div className="brand-img">K</div>
        <div>
          <div className="brand-text">PACS Explorer</div>
          <div className="brand-sub">KINEA</div>
        </div>
      </div>
      {children}
    </aside>
  );
}

interface ChromeShellProps {
  user?: ChromeUser | null;
  current: CurrentRoute;
  children: ReactNode;
}

/**
 * Layout completo: navbar arriba + flex(sidebar+main).
 * Los hijos deben incluir el `<Sidebar>` y el `<main>` en ese orden.
 */
export default function ChromeShell({ user, current, children }: ChromeShellProps) {
  return (
    <div style={{ background: 'var(--surface-page)', minHeight: '100vh' }}>
      <Navbar user={user} current={current} />
      <div style={{ display: 'flex' }}>{children}</div>
    </div>
  );
}
