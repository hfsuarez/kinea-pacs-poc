/**
 * Dashboard.tsx — KPI row + alerts list.
 *
 * Adoptado del handoff de Claude Design (Dashboard.jsx) y conectado a
 * estadísticas reales del backend. Mientras el endpoint
 * `/api/dashboard.php` no exista, derivamos KPIs del response del worklist.
 *
 * Estado: stub funcional con datos derivados del catálogo `estudios.php`.
 * El dashboard "real" full sigue en `dashboard.php` (legado PHP).
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bell, AlertTriangle, CheckCircle2,
  Eye, BarChart3, FileText, Users, ExternalLink,
} from 'lucide-react';
import ChromeShell, { Sidebar, SidebarNav } from '../components/Chrome';
import type { EstudiosResponse, Estudio } from '../types';

const PHP = import.meta.env.VITE_PHP_BASE || 'http://127.0.0.1:8080';

interface KPI {
  label: string;
  value: string;
  sub: string;
  tone?: 'success' | 'warning' | 'danger';
}

interface Alert {
  icon: typeof AlertTriangle;
  tone: 'success' | 'warning' | 'danger' | 'info';
  msg: string;
  who: string;
  t: string;
}

function fmtRelative(fechaISO: string): string {
  const d = new Date(fechaISO.replace(' ', 'T'));
  const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  return `hace ${diffD} d`;
}

export default function DashboardPage() {
  const nav = useNavigate();

  // Reutilizamos el endpoint estudios.php para derivar KPIs sin tocar backend
  const q = useQuery<EstudiosResponse>({
    queryKey: ['estudios', 'dashboard'],
    queryFn: async () => {
      const r = await fetch(
        `${PHP}/ecos/pacsexplorerwsp/api/estudios.php?limit=500`,
        { credentials: 'include' }
      );
      if (r.status === 401 || r.status === 403) {
        nav('/login');
        throw new Error('not authenticated');
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  });

  const rows = q.data?.rows ?? [];
  const userName = q.data?.user?.nombre ?? '';

  const { kpis, alerts } = useMemo(() => {
    const total = rows.length;
    const informados = rows.filter(r => r.confirmado === 1).length;
    const pendientes = total - informados;
    const pctInf = total ? Math.round((informados / total) * 100) : 0;

    // Críticos: pendientes con > 24h
    const ahora = Date.now();
    const criticos = rows.filter(r => {
      if (r.confirmado === 1) return false;
      const t = new Date(r.fecha_estudio.replace(' ', 'T')).getTime();
      return ahora - t > 24 * 3600 * 1000;
    });

    const kpis: KPI[] = [
      { label: 'Estudios totales',  value: String(total),       sub: 'últimos 500'  },
      { label: 'Informados',         value: String(informados),  sub: `${pctInf}% del total`, tone: 'success' },
      { label: 'Pendientes',         value: String(pendientes),  sub: 'sin firmar', tone: 'warning' },
      { label: 'Críticos (>24h)',    value: String(criticos.length), sub: criticos.length ? 'requieren atención' : 'todo al día', tone: criticos.length ? 'danger' : undefined },
    ];

    // Alerts: 3 estudios críticos más antiguos + 1 info
    const alerts: Alert[] = criticos.slice(0, 3).map((r): Alert => ({
      icon: AlertTriangle,
      tone: 'warning',
      msg: 'Estudio sin informar > 24h',
      who: `${r.paciente} · ${r.descripcion || r.modalidad}`,
      t: fmtRelative(r.fecha_estudio),
    }));

    if (alerts.length === 0) {
      alerts.push({
        icon: CheckCircle2, tone: 'success',
        msg: 'Sin estudios críticos pendientes',
        who: 'Toda la cola al día',
        t: 'ahora',
      });
    }

    return { kpis, alerts };
  }, [rows]);

  return (
    <ChromeShell user={{ nombre: userName }} current="dashboard">
      <Sidebar>
        <SidebarNav current="dashboard" />
        <div className="form-block" style={{ marginTop: 14 }}>
          <a
            className="adm-btn"
            href={`${PHP}/ecos/pacsexplorerwsp/dashboard.php`}
            target="_blank"
            rel="noreferrer"
            style={{ width: '100%' }}
          >
            <ExternalLink size={13} /> &nbsp;Dashboard completo
          </a>
        </div>
      </Sidebar>

      <main style={{ flex: 1, padding: 18, background: 'var(--surface-page)' }}>
        <h1 style={{ marginBottom: 14 }}>Resumen del día</h1>

        {q.isLoading && (
          <div className="adm-card" style={{ padding: 32, textAlign: 'center', color: 'var(--fg3)' }}>
            Cargando datos…
          </div>
        )}

        {!q.isLoading && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
              {kpis.map((k, i) => (
                <KpiCard key={i} kpi={k} />
              ))}
            </div>

            <div className="adm-card">
              <div className="adm-card-header">
                <span><Bell size={14} /> &nbsp;Alertas</span>
                <a href="#" style={{ fontSize: 12 }}>Ver todas →</a>
              </div>
              {alerts.map((a, i) => <AlertRow key={i} a={a} first={i === 0} />)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 18 }}>
              <ShortcutCard
                title="Worklist"
                desc="Lista completa de estudios con filtros"
                icon={Eye}
                onClick={() => nav('/')}
              />
              <ShortcutCard
                title="Dashboard legado"
                desc="Charts, top radiólogos, tiempos medios"
                icon={BarChart3}
                href={`${PHP}/ecos/pacsexplorerwsp/dashboard.php`}
              />
              <ShortcutCard
                title="Informes"
                desc="Editor de informes radiológicos"
                icon={FileText}
                href={`${PHP}/ecos/pacsexplorerwsp/informes_edit.php`}
              />
              <ShortcutCard
                title="Pacientes"
                desc="Gestión de pacientes y agenda"
                icon={Users}
                href={`${PHP}/ecos/pacsexplorerwsp/gestionusuario/`}
              />
            </div>
          </>
        )}
      </main>
    </ChromeShell>
  );
}

function KpiCard({ kpi }: { kpi: KPI }) {
  return (
    <div className={`adm-kpi ${kpi.tone ?? ''}`}>
      <div className="label">{kpi.label}</div>
      <div className="value">{kpi.value}</div>
      <div className="sub">{kpi.sub}</div>
    </div>
  );
}

function AlertRow({ a, first }: { a: Alert; first: boolean }) {
  const Icon = a.icon;
  return (
    <div
      style={{
        padding: '12px 14px',
        borderTop: first ? '0' : '1px solid var(--border-subtle)',
        display: 'flex', gap: 12, alignItems: 'center',
      }}
    >
      <div className={`adm-text-${a.tone}`} style={{ display: 'flex' }}>
        <Icon size={18} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: 'var(--fg1)', fontSize: 13, fontWeight: 600 }}>{a.msg}</div>
        <div style={{ color: 'var(--fg3)', fontSize: 12, marginTop: 2 }}>{a.who}</div>
      </div>
      <div style={{ color: 'var(--fg4)', fontSize: 11 }}>{a.t}</div>
    </div>
  );
}

interface ShortcutCardProps {
  title: string;
  desc: string;
  icon: typeof Eye;
  href?: string;
  onClick?: () => void;
}

function ShortcutCard({ title, desc, icon: Icon, href, onClick }: ShortcutCardProps) {
  const inner = (
    <div className="adm-card" style={{ padding: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 40, height: 40,
        background: 'var(--surface-deep)',
        borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--kinea-cyan)',
      }}>
        <Icon size={20} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: 'var(--fg1)', fontSize: 14, fontWeight: 600 }}>{title}</div>
        <div style={{ color: 'var(--fg3)', fontSize: 12, marginTop: 2 }}>{desc}</div>
      </div>
      {href && <ExternalLink size={14} style={{ color: 'var(--fg4)' }} />}
    </div>
  );
  if (href) {
    return <a href={href} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>{inner}</a>;
  }
  return <div onClick={onClick}>{inner}</div>;
}

// Type re-export for consumers (currently unused but documented)
export type { Estudio };
