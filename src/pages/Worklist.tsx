import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, LogOut, Eye, FileText, Download, Calendar, Filter,
  CheckCircle2, Clock, MessageCircle, AlertCircle, Menu, Maximize2,
  Bell, User, ChevronDown, BarChart3,
} from 'lucide-react';
import type { EstudiosResponse, Estudio } from '../types';

const PHP = 'http://127.0.0.1:8080';
const MODALIDADES = ['DX','CR','CT','MR','US','MG','XA','NM','PT','OT'] as const;

function useDebounced<T>(value: T, ms = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

function formatDate(s: string) {
  const d = new Date(s.replace(' ', 'T'));
  return d.toLocaleString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function WorklistPage() {
  const nav = useNavigate();
  const [search, setSearch] = useState('');
  const [modSel, setModSel] = useState<Set<string>>(new Set());
  const [conInf, setConInf] = useState<string>('');
  const [periodo, setPeriodo] = useState<'hoy' | 'ayer' | '7d' | '30d' | 'all'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const dSearch = useDebounced(search, 200);

  const { fechaDesde, fechaHasta } = useMemo(() => {
    const now = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const today = fmt(now);
    if (periodo === 'hoy') return { fechaDesde: today, fechaHasta: today };
    if (periodo === 'ayer') {
      const y = new Date(now.getTime() - 86400000);
      return { fechaDesde: fmt(y), fechaHasta: fmt(y) };
    }
    if (periodo === '7d')  return { fechaDesde: fmt(new Date(now.getTime() - 7*86400000)),  fechaHasta: today };
    if (periodo === '30d') return { fechaDesde: fmt(new Date(now.getTime() - 30*86400000)), fechaHasta: today };
    return { fechaDesde: '', fechaHasta: '' };
  }, [periodo]);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (dSearch) p.set('search', dSearch);
    if (modSel.size) p.set('modalidad', [...modSel].join(','));
    if (conInf !== '') p.set('con_informe', conInf);
    if (fechaDesde) p.set('fecha_desde', fechaDesde);
    if (fechaHasta) p.set('fecha_hasta', fechaHasta);
    p.set('limit', '500');
    return p.toString();
  }, [dSearch, modSel, conInf, fechaDesde, fechaHasta]);

  const q = useQuery<EstudiosResponse>({
    queryKey: ['estudios', params],
    queryFn: async () => {
      const r = await fetch(`${PHP}/ecos/pacsexplorerwsp/api/estudios.php?${params}`, { credentials: 'include' });
      if (r.status === 401 || r.status === 403) { nav('/login'); throw new Error('not authenticated'); }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    placeholderData: (prev) => prev,
  });

  const rows = q.data?.rows ?? [];
  const total = q.data?.total ?? 0;
  const userName = q.data?.user?.nombre || '';

  function toggleMod(m: string) {
    setModSel(s => { const n = new Set(s); n.has(m) ? n.delete(m) : n.add(m); return n; });
  }

  async function logout() {
    await fetch(`${PHP}/ecos/pacsexplorerwsp/logout.php`, { credentials: 'include' });
    nav('/login');
  }

  return (
    <div style={{ background: 'var(--adm-bg)', minHeight: '100vh' }}>
      {/* ─── Top navbar ─── */}
      <nav className="adm-navbar" style={{ position: 'sticky', top: 0, zIndex: 30 }}>
        <button className="nav-link" onClick={() => setSidebarOpen(s => !s)} title="Toggle menú">
          <Menu size={18} />
        </button>
        <a className="nav-link active" href="#"><Eye size={14} /> Worklist</a>
        <a className="nav-link" href={`${PHP}/ecos/pacsexplorerwsp/dashboard.php`} target="_blank" rel="noreferrer">
          <BarChart3 size={14} /> Dashboard
        </a>
        <a className="nav-link" href={`${PHP}/ecos/pacsexplorerwsp/historial.php`} target="_blank" rel="noreferrer">
          <FileText size={14} /> Historial
        </a>

        <div style={{ flex: 1 }} />

        <button className="nav-link" title="Notificaciones"><Bell size={16} /></button>
        <button className="nav-link" title="Pantalla completa" onClick={() => document.documentElement.requestFullscreen?.()}>
          <Maximize2 size={16} />
        </button>
        <div className="nav-link" title="Usuario">
          <User size={16} />
          <span>{userName || '—'}</span>
          <ChevronDown size={12} />
        </div>
        <button className="nav-link" onClick={logout} title="Cerrar sesión" style={{ color: '#ff6b6b' }}>
          <LogOut size={16} />
        </button>
      </nav>

      <div style={{ display: 'flex' }}>
        {/* ─── Sidebar ─── */}
        {sidebarOpen && (
          <aside className="adm-sidebar" style={{ position: 'sticky', top: 56, alignSelf: 'flex-start', maxHeight: 'calc(100vh - 56px)', overflowY: 'auto' }}>
            <div className="brand-link">
              <div className="brand-img">K</div>
              <div>
                <div className="brand-text">KINEA</div>
                <div style={{ fontSize: 10.5, color: '#8e959c', letterSpacing: .3 }}>PACS Explorer</div>
              </div>
            </div>

            <div className="nav-header">Filtros</div>

            <div className="form-block">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={11} /> Período
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                {(['hoy','ayer','7d','30d','all'] as const).map(p => (
                  <button key={p}
                    className={`adm-pill ${periodo === p ? 'active' : ''}`}
                    onClick={() => setPeriodo(p)}>
                    {p === 'hoy' ? 'Hoy' : p === 'ayer' ? 'Ayer' : p === '7d' ? '7 días' : p === '30d' ? '30 días' : 'Todos'}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-block">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Filter size={11} /> Modalidad
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {MODALIDADES.map(m => (
                  <button key={m}
                    className={`adm-pill ${modSel.has(m) ? 'active' : ''}`}
                    onClick={() => toggleMod(m)}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-block">
              <label className="form-label">Informe</label>
              <select className="adm-select" value={conInf} onChange={e => setConInf(e.target.value)}>
                <option value="">Todos</option>
                <option value="1">Confirmados</option>
                <option value="0">Sin informe</option>
              </select>
            </div>

            <div className="form-block">
              <button
                className="adm-btn"
                style={{ width: '100%' }}
                onClick={() => { setSearch(''); setModSel(new Set()); setConInf(''); setPeriodo('all'); }}>
                Limpiar filtros
              </button>
            </div>

            <div className="nav-header">Estado</div>
            <div className="form-block" style={{ fontSize: 12, color: '#adb5bd' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span>Total</span>
                <span style={{ color: '#fff', fontFamily: 'monospace' }}>{total}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span>Mostrando</span>
                <span style={{ color: '#fff', fontFamily: 'monospace' }}>{rows.length}</span>
              </div>
              {q.isFetching && (
                <div className="adm-text-info" style={{ marginTop: 6, fontSize: 11 }}>↻ actualizando…</div>
              )}
            </div>
          </aside>
        )}

        {/* ─── Main ─── */}
        <main style={{ flex: 1, padding: 16 }}>
          {/* Search bar arriba */}
          <div className="adm-card" style={{ marginBottom: 14 }}>
            <div className="adm-card-header" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: '#8e959c' }} />
                <input
                  type="search"
                  placeholder="Buscar por paciente, CI, accession o estudio…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="adm-input"
                  style={{ paddingLeft: 32 }}
                />
              </div>
              <div className="adm-muted" style={{ fontSize: 12 }}>
                {q.isFetching && search !== dSearch ? 'Buscando…' : `${rows.length} resultados`}
              </div>
            </div>
          </div>

          {q.isError && (
            <div className="adm-card" style={{ borderLeft: '3px solid var(--adm-danger)', padding: 12, color: '#f5b7b1', marginBottom: 14 }}>
              <AlertCircle size={14} style={{ verticalAlign: 'middle' }} /> Error: {(q.error as Error).message}
            </div>
          )}

          <div className="adm-card">
            <div className="adm-card-header">
              <span><Eye size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Listado de estudios</span>
              <span className="adm-muted" style={{ fontSize: 11 }}>
                {periodo !== 'all' && `Período: ${periodo}`}
                {modSel.size > 0 && ` · Mod: ${[...modSel].join(', ')}`}
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Suc</th>
                    <th>CI</th>
                    <th>Paciente</th>
                    <th>Estudio</th>
                    <th>Fecha</th>
                    <th>A.N.</th>
                    <th>Mod</th>
                    <th>Series/Img</th>
                    <th>Estado</th>
                    <th>WSP</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {q.isLoading && (
                    <tr><td colSpan={11} style={{ textAlign: 'center', padding: 30, color: '#8e959c' }}>Cargando…</td></tr>
                  )}
                  {!q.isLoading && rows.length === 0 && (
                    <tr><td colSpan={11} style={{ textAlign: 'center', padding: 40, color: '#6c757d' }}>Sin estudios con estos filtros</td></tr>
                  )}
                  {rows.map((r, i) => <Row key={r.id} r={r} odd={i % 2 === 0} />)}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function sucAbbrev(name: string) {
  const w = name.split(/\s+/);
  return ((w[0]?.[0] ?? '') + (w[1]?.[0] ?? '')).toUpperCase();
}

function Row({ r, odd }: { r: Estudio; odd: boolean }) {
  const studyUrl    = `${PHP}/ecos/pacsexplorerwsp/view.php?studyuid=${encodeURIComponent(r.study_instance_uid)}`;
  const reportUrl   = `${PHP}/ecos/pacsexplorerwsp/informes_edit.php?studyuid=${encodeURIComponent(r.study_instance_uid)}`;
  const downloadUrl = `${PHP}/ecos/pacsexplorerwsp/descargardicom.php?studyuid=${encodeURIComponent(r.study_instance_uid)}`;
  return (
    <tr className={odd ? 'odd' : 'even'}>
      <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#adb5bd' }}>{sucAbbrev(r.sucursal)}</td>
      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.ci}</td>
      <td style={{ color: '#fff', fontWeight: 500 }}>{r.paciente}</td>
      <td>{r.descripcion || <span style={{ color: '#6c757d' }}>—</span>}</td>
      <td style={{ fontSize: 12, whiteSpace: 'nowrap', color: '#adb5bd' }}>{formatDate(r.fecha_estudio)}</td>
      <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#8e959c' }}>{r.accession_number}</td>
      <td><span className="adm-badge bg-info">{r.modalidad}</span></td>
      <td style={{ fontSize: 12, whiteSpace: 'nowrap', color: '#adb5bd' }}>{r.series_cnt} / {r.images_cnt}</td>
      <td>
        {r.confirmado
          ? <span className="adm-text-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
              <CheckCircle2 size={12} /> Firmado
            </span>
          : <span className="adm-text-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
              <Clock size={12} /> Pendiente
            </span>}
      </td>
      <td style={{ fontSize: 12 }}>
        {r.wsp_estado === 'leido'     && <span className="adm-text-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MessageCircle size={11} /> leído</span>}
        {r.wsp_estado === 'entregado' && <span className="adm-text-info" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MessageCircle size={11} /> entregado</span>}
        {r.wsp_estado === 'pendiente' && <span className="adm-text-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MessageCircle size={11} /> pendiente</span>}
        {r.wsp_estado === 'fallido'   && <span className="adm-text-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MessageCircle size={11} /> fallido</span>}
        {!r.wsp_estado && <span style={{ color: '#495057' }}>—</span>}
      </td>
      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
        <a href={studyUrl}    target="_blank" rel="noreferrer" className="adm-btn btn-ghost" title="Visor">       <Eye size={14} /></a>
        <a href={reportUrl}   target="_blank" rel="noreferrer" className="adm-btn btn-ghost" title="Informe">     <FileText size={14} /></a>
        <a href={downloadUrl}                                  className="adm-btn btn-ghost" title="Descargar DICOM"><Download size={14} /></a>
      </td>
    </tr>
  );
}
