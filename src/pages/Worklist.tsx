/**
 * Worklist.tsx — Listado principal de estudios.
 *
 * Cambios desde el handoff de Claude Design:
 * - Usa ChromeShell para navbar + sidebar (sin duplicación)
 * - Click en fila → navega a /study/:study_instance_uid
 * - Filtro por estado de informe (Pendiente/Informado) agregado
 * - Sample data del kit reemplazada por fetch real al backend PHP
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Eye, FileText, Download, Calendar, Filter,
  CheckCircle2, Clock, MessageCircle, AlertCircle, RefreshCw, List,
} from 'lucide-react';
import ChromeShell, { Sidebar, SidebarNav } from '../components/Chrome';
import type { EstudiosResponse, Estudio } from '../types';

const PHP = import.meta.env.VITE_PHP_BASE || 'http://127.0.0.1:8080';
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
  const [estado, setEstado] = useState<'' | 'pendiente' | 'informado'>('');
  const [periodo, setPeriodo] = useState<'hoy' | 'ayer' | '7d' | '30d' | 'all'>('all');

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
    if (periodo === '7d')  return { fechaDesde: fmt(new Date(now.getTime() - 7 * 86400000)),  fechaHasta: today };
    if (periodo === '30d') return { fechaDesde: fmt(new Date(now.getTime() - 30 * 86400000)), fechaHasta: today };
    return { fechaDesde: '', fechaHasta: '' };
  }, [periodo]);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (dSearch) p.set('search', dSearch);
    if (modSel.size) p.set('modalidad', [...modSel].join(','));
    if (estado === 'informado') p.set('con_informe', '1');
    else if (estado === 'pendiente') p.set('con_informe', '0');
    if (fechaDesde) p.set('fecha_desde', fechaDesde);
    if (fechaHasta) p.set('fecha_hasta', fechaHasta);
    p.set('limit', '500');
    return p.toString();
  }, [dSearch, modSel, estado, fechaDesde, fechaHasta]);

  const q = useQuery<EstudiosResponse>({
    queryKey: ['estudios', params],
    queryFn: async () => {
      const r = await fetch(`${PHP}/ecos/pacsexplorerwsp/api/estudios.php?${params}`, { credentials: 'include' });
      if (r.status === 401 || r.status === 403) { nav('/login'); throw new Error('not authenticated'); }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    placeholderData: prev => prev,
  });

  const rows = q.data?.rows ?? [];
  const total = q.data?.total ?? 0;
  const userName = q.data?.user?.nombre ?? '';

  function toggleMod(m: string) {
    setModSel(s => { const n = new Set(s); n.has(m) ? n.delete(m) : n.add(m); return n; });
  }

  function clearFilters() {
    setSearch(''); setModSel(new Set()); setEstado(''); setPeriodo('all');
  }

  return (
    <ChromeShell user={{ nombre: userName }} current="worklist">
      <Sidebar>
        <SidebarNav current="worklist" />

        <div className="nav-header"><Calendar size={11} /> &nbsp;Período</div>
        <div className="form-block" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          {(['hoy','ayer','7d','30d','all'] as const).map(p => (
            <button key={p} className={`adm-pill ${periodo === p ? 'active' : ''}`} onClick={() => setPeriodo(p)}>
              {p === 'hoy' ? 'Hoy' : p === 'ayer' ? 'Ayer' : p === '7d' ? '7 días' : p === '30d' ? '30 días' : 'Todos'}
            </button>
          ))}
        </div>

        <div className="nav-header"><Filter size={11} /> &nbsp;Modalidad</div>
        <div className="form-block" style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {MODALIDADES.map(m => (
            <button key={m} className={`adm-pill ${modSel.has(m) ? 'active' : ''}`} onClick={() => toggleMod(m)}>
              {m}
            </button>
          ))}
        </div>

        <div className="nav-header">Estado</div>
        <div className="form-block">
          <select className="adm-select" value={estado} onChange={e => setEstado(e.target.value as typeof estado)}>
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="informado">Informado</option>
          </select>
        </div>

        <div className="form-block">
          <button className="adm-btn" style={{ width: '100%' }} onClick={clearFilters}>
            Limpiar filtros
          </button>
        </div>

        <div className="nav-header">Resumen</div>
        <div className="form-block" style={{ fontSize: 12, color: 'var(--fg3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
            <span>Total</span>
            <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{total}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
            <span>Mostrando</span>
            <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{rows.length}</span>
          </div>
          {q.isFetching && (
            <div className="adm-text-info" style={{ marginTop: 6, fontSize: 11 }}>↻ actualizando…</div>
          )}
        </div>
      </Sidebar>

      <main style={{ flex: 1, padding: 16 }}>
        {/* Search bar */}
        <div className="adm-card" style={{ marginBottom: 14 }}>
          <div className="adm-card-header" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--fg3)' }} />
              <input
                type="search"
                placeholder="Buscar por paciente, CI, accession o estudio…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="adm-input"
                style={{ paddingLeft: 32 }}
              />
              {search && search !== dSearch && (
                <RefreshCw size={12} style={{ position: 'absolute', right: 10, top: 9, color: 'var(--fg3)' }} />
              )}
            </div>
            <div className="adm-muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
              {q.isFetching && search !== dSearch ? 'Buscando…' : `${rows.length} estudio${rows.length === 1 ? '' : 's'}`}
            </div>
          </div>
        </div>

        {q.isError && (
          <div className="adm-card" style={{ borderLeft: '3px solid var(--status-danger)', padding: 12, color: '#f5b7b1', marginBottom: 14 }}>
            <AlertCircle size={14} style={{ verticalAlign: 'middle' }} /> &nbsp;Error: {(q.error as Error).message}
          </div>
        )}

        <div className="adm-card">
          <div className="adm-card-header">
            <span><List size={14} /> &nbsp;Estudios</span>
            <span className="adm-muted" style={{ fontSize: 11 }}>
              {periodo !== 'all' && `Período: ${periodo}`}
              {modSel.size > 0 && ` · Mod: ${[...modSel].join(', ')}`}
              {estado && ` · ${estado}`}
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
                  <tr><td colSpan={11} style={{ textAlign: 'center', padding: 30, color: 'var(--fg3)' }}>Cargando…</td></tr>
                )}
                {!q.isLoading && rows.length === 0 && (
                  <tr><td colSpan={11} style={{ textAlign: 'center', padding: 40, color: 'var(--fg4)' }}>Sin estudios con estos filtros</td></tr>
                )}
                {rows.map((r, i) => <Row key={r.id} r={r} odd={i % 2 === 0} />)}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </ChromeShell>
  );
}

function sucAbbrev(name: string) {
  const w = name.split(/\s+/);
  return ((w[0]?.[0] ?? '') + (w[1]?.[0] ?? '')).toUpperCase();
}

function Row({ r, odd }: { r: Estudio; odd: boolean }) {
  const nav = useNavigate();
  const detailUrl   = `/study/${encodeURIComponent(r.study_instance_uid)}`;
  const viewerUrl   = `${PHP}/ecos/pacsexplorerwsp/view.php?studyuid=${encodeURIComponent(r.study_instance_uid)}`;
  const reportUrl   = `${PHP}/ecos/pacsexplorerwsp/informes_edit.php?studyuid=${encodeURIComponent(r.study_instance_uid)}`;
  const downloadUrl = `${PHP}/ecos/pacsexplorerwsp/descargardicom.php?studyuid=${encodeURIComponent(r.study_instance_uid)}`;

  function onRowClick(e: React.MouseEvent) {
    // Si clickearon un botón/anchor dentro de la celda, no navegar
    if ((e.target as HTMLElement).closest('a, button')) return;
    nav(detailUrl);
  }

  return (
    <tr className={odd ? 'odd' : 'even'} onClick={onRowClick}>
      <td className="mono-id">{sucAbbrev(r.sucursal)}</td>
      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.ci}</td>
      <td>
        <span style={{ color: 'var(--fg1)', fontWeight: 500 }}>{r.paciente}</span>
      </td>
      <td>{r.descripcion || <span style={{ color: 'var(--fg4)' }}>—</span>}</td>
      <td style={{ fontSize: 12, whiteSpace: 'nowrap' }} className="adm-muted">{formatDate(r.fecha_estudio)}</td>
      <td className="mono-id">{r.accession_number}</td>
      <td><span className="adm-badge bg-info">{r.modalidad}</span></td>
      <td style={{ fontSize: 12, whiteSpace: 'nowrap' }} className="adm-muted">{r.series_cnt} / {r.images_cnt}</td>
      <td>
        {r.confirmado === 1
          ? <span className="adm-text-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
              <CheckCircle2 size={12} /> Firmado
            </span>
          : <span className="adm-text-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
              <Clock size={12} /> Pendiente
            </span>}
      </td>
      <td style={{ fontSize: 12 }}>
        {r.wsp_estado === 'leido'     && <span className="adm-text-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MessageCircle size={11} /> leído</span>}
        {r.wsp_estado === 'entregado' && <span className="adm-text-info"    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MessageCircle size={11} /> entregado</span>}
        {r.wsp_estado === 'pendiente' && <span className="adm-text-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MessageCircle size={11} /> pendiente</span>}
        {r.wsp_estado === 'fallido'   && <span className="adm-text-danger"  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MessageCircle size={11} /> fallido</span>}
        {!r.wsp_estado && <span style={{ color: 'var(--fg4)' }}>—</span>}
      </td>
      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
        <a href={viewerUrl}   target="_blank" rel="noreferrer" className="adm-btn btn-ghost" title="Visor"><Eye size={14} /></a>
        <a href={reportUrl}   target="_blank" rel="noreferrer" className="adm-btn btn-ghost" title="Informe"><FileText size={14} /></a>
        <a href={downloadUrl}                                  className="adm-btn btn-ghost" title="Descargar DICOM"><Download size={14} /></a>
      </td>
    </tr>
  );
}
