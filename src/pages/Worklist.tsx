/**
 * Worklist.tsx — Listado principal de estudios (estética Pentalogic legado).
 *
 * Sidebar fiel al PACS Explorer original:
 * - Brand link cyan + "PACS Explorer"
 * - Atajo de fecha "Hoy / Ayer" como botones verdes grandes
 * - Items expandibles por filtro (Sucursal, CI, Paciente, Accession,
 *   Modalidad, Período, Informe) con icon + label + chevron
 * - Botones grandes "Buscar" (cyan) + "Limpiar" (gris) abajo
 *
 * Click en fila → /study/:study_instance_uid
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Eye, FileText, Download,
  CheckCircle2, Clock, MessageCircle, AlertCircle,
  RefreshCw, Building2, IdCard, User as UserIcon, Hash,
  Filter, Calendar, FileCheck2, ChevronRight, Eraser,
} from 'lucide-react';
import ChromeShell, { Sidebar } from '../components/Chrome';
import type { EstudiosResponse, Estudio } from '../types';

const PHP = import.meta.env.VITE_PHP_BASE || 'http://127.0.0.1:8080';
const MODALIDADES = ['DX','CR','CT','MR','US','MG','XA','NM','PT','OT'] as const;
const PERIOD_OPTIONS = [
  { k: 'all',  l: 'Todos' },
  { k: 'hoy',  l: 'Hoy' },
  { k: 'ayer', l: 'Ayer' },
  { k: '7d',   l: '7 días' },
  { k: '30d',  l: '30 días' },
] as const;

type Period = typeof PERIOD_OPTIONS[number]['k'];

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

  // ── Estado de filtros ──
  const [search, setSearch] = useState('');         // buscador genérico (search bar arriba de la tabla)
  const [ci, setCi] = useState('');
  const [paciente, setPaciente] = useState('');
  const [accession, setAccession] = useState('');
  const [sucursal, setSucursal] = useState('');     // future-proof, no implementado en backend aún
  const [modSel, setModSel] = useState<Set<string>>(new Set());
  const [periodo, setPeriodo] = useState<Period>('all');
  const [conInforme, setConInforme] = useState<'' | '0' | '1'>('');

  // ── Estado de UI: cuál panel del sidebar está abierto ──
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  function toggle(id: string) { setOpenPanel(p => p === id ? null : id); }

  const dSearch    = useDebounced(search, 200);
  const dCi        = useDebounced(ci, 200);
  const dPaciente  = useDebounced(paciente, 200);
  const dAccession = useDebounced(accession, 200);

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
    if (dSearch)    p.set('search', dSearch);
    if (dCi)        p.set('ci', dCi);
    if (dPaciente)  p.set('paciente', dPaciente);
    if (dAccession) p.set('accession', dAccession);
    if (modSel.size) p.set('modalidad', [...modSel].join(','));
    if (conInforme !== '') p.set('con_informe', conInforme);
    if (fechaDesde) p.set('fecha_desde', fechaDesde);
    if (fechaHasta) p.set('fecha_hasta', fechaHasta);
    p.set('limit', '500');
    return p.toString();
  }, [dSearch, dCi, dPaciente, dAccession, modSel, conInforme, fechaDesde, fechaHasta]);

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
    setSearch(''); setCi(''); setPaciente(''); setAccession(''); setSucursal('');
    setModSel(new Set()); setConInforme(''); setPeriodo('all');
    setOpenPanel(null);
  }

  // Cuántos filtros activos por categoría (badge en el item)
  const badges = {
    sucursal:  sucursal ? 1 : 0,
    ci:        ci ? 1 : 0,
    paciente:  paciente ? 1 : 0,
    accession: accession ? 1 : 0,
    modalidad: modSel.size,
    periodo:   periodo === 'all' ? 0 : 1,
    informe:   conInforme === '' ? 0 : 1,
  };

  return (
    <ChromeShell user={{ nombre: userName }} current="worklist">
      <Sidebar>
        {/* ── Botones de fecha rápidos (verdes, como en Pentalogic) ── */}
        <div style={{ padding: 'var(--space-md) var(--space-md) var(--space-sm)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <button
            className={`adm-btn btn-success btn-block ${periodo === 'hoy' ? '' : ''}`}
            onClick={() => { setPeriodo(periodo === 'hoy' ? 'all' : 'hoy'); setOpenPanel(null); }}
            style={{ opacity: periodo === 'hoy' ? 1 : .85 }}
            title="Estudios de hoy"
          >
            <Calendar size={13} /> Hoy
          </button>
          <button
            className="adm-btn btn-success btn-block"
            onClick={() => { setPeriodo(periodo === 'ayer' ? 'all' : 'ayer'); setOpenPanel(null); }}
            style={{ opacity: periodo === 'ayer' ? 1 : .85 }}
            title="Estudios de ayer"
          >
            <Calendar size={13} /> Ayer
          </button>
        </div>

        {/* ── Filtros expandibles ── */}
        <ExpandableItem
          id="sucursal"
          icon={<Building2 size={14} />}
          label="Sucursal"
          badge={badges.sucursal}
          openPanel={openPanel}
          onToggle={toggle}
        >
          <select className="adm-select" value={sucursal} onChange={e => setSucursal(e.target.value)}>
            <option value="">— Todas las sucursales —</option>
            <option value="kinea-central">KINEA Central</option>
            <option value="kinea-norte">KINEA Norte</option>
            <option value="kinea-japones">Hospital Japonés</option>
          </select>
          <p className="adm-muted" style={{ fontSize: 11, margin: '6px 0 0' }}>
            Filtro multi-sucursal (server-side todavía sin wirear).
          </p>
        </ExpandableItem>

        <ExpandableItem
          id="ci"
          icon={<IdCard size={14} />}
          label="CI"
          badge={badges.ci}
          openPanel={openPanel}
          onToggle={toggle}
        >
          <input className="adm-input" placeholder="Cédula de identidad…" value={ci} onChange={e => setCi(e.target.value)} />
        </ExpandableItem>

        <ExpandableItem
          id="paciente"
          icon={<UserIcon size={14} />}
          label="Paciente"
          badge={badges.paciente}
          openPanel={openPanel}
          onToggle={toggle}
        >
          <input className="adm-input" placeholder="Nombre o apellido…" value={paciente} onChange={e => setPaciente(e.target.value)} />
        </ExpandableItem>

        <ExpandableItem
          id="accession"
          icon={<Hash size={14} />}
          label="Accession Number"
          badge={badges.accession}
          openPanel={openPanel}
          onToggle={toggle}
        >
          <input className="adm-input" placeholder="A. number…" value={accession} onChange={e => setAccession(e.target.value)} />
        </ExpandableItem>

        <ExpandableItem
          id="modalidad"
          icon={<Filter size={14} />}
          label="Modalidad"
          badge={badges.modalidad}
          openPanel={openPanel}
          onToggle={toggle}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {MODALIDADES.map(m => (
              <button key={m} className={`adm-pill ${modSel.has(m) ? 'active' : ''}`} onClick={() => toggleMod(m)}>
                {m}
              </button>
            ))}
          </div>
        </ExpandableItem>

        <ExpandableItem
          id="periodo"
          icon={<Calendar size={14} />}
          label="Período"
          badge={badges.periodo}
          openPanel={openPanel}
          onToggle={toggle}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
            {PERIOD_OPTIONS.map(p => (
              <button key={p.k} className={`adm-pill ${periodo === p.k ? 'active' : ''}`} onClick={() => setPeriodo(p.k)}>
                {p.l}
              </button>
            ))}
          </div>
        </ExpandableItem>

        <ExpandableItem
          id="informe"
          icon={<FileCheck2 size={14} />}
          label="Informe"
          badge={badges.informe}
          openPanel={openPanel}
          onToggle={toggle}
        >
          <select className="adm-select" value={conInforme} onChange={e => setConInforme(e.target.value as typeof conInforme)}>
            <option value="">Todos los estudios</option>
            <option value="1">Sólo informados</option>
            <option value="0">Sólo pendientes</option>
          </select>
        </ExpandableItem>

        {/* ── Botones grandes Buscar / Limpiar ── */}
        <div style={{ padding: 'var(--space-md)', display: 'grid', gap: 6 }}>
          <button
            className="adm-btn btn-info btn-block"
            onClick={() => q.refetch()}
            disabled={q.isFetching}
          >
            {q.isFetching ? <RefreshCw size={13} className="adm-text-info" /> : <Search size={13} />}
            &nbsp;{q.isFetching ? 'Buscando…' : 'Buscar'}
          </button>
          <button className="adm-btn btn-block" onClick={clearFilters}>
            <Eraser size={13} /> Limpiar
          </button>
        </div>
      </Sidebar>

      <main style={{ flex: 1, padding: 16 }}>
        {/* Search bar global arriba de la tabla */}
        <div className="adm-card" style={{ marginBottom: 14 }}>
          <div className="adm-card-header" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--fg3)' }} />
              <input
                type="search"
                placeholder="Buscar globalmente (paciente, CI, accession, descripción)…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="adm-input"
                style={{ paddingLeft: 32 }}
              />
            </div>
            <div className="adm-muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
              {q.isFetching && search !== dSearch ? 'Buscando…' : `${rows.length} resultado${rows.length === 1 ? '' : 's'}`}
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
            <span>Lista de Estudios</span>
            <span className="adm-muted" style={{ fontSize: 11 }}>
              {periodo !== 'all' && `Período: ${periodo}`}
              {modSel.size > 0 && ` · Mod: ${[...modSel].join(', ')}`}
              {conInforme === '1' && ` · Informados`}
              {conInforme === '0' && ` · Pendientes`}
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

          {/* Footer tipo DataTables: Mostrando X al N de M registros */}
          <div style={{
            padding: '10px 14px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            color: 'var(--fg3)',
          }}>
            <span>
              {rows.length === 0
                ? 'Sin registros'
                : `Mostrando registros del 1 al ${rows.length} de un total de ${total} registros`}
            </span>
            <span>
              {q.isFetching && <span className="adm-text-info">↻ actualizando…</span>}
            </span>
          </div>
        </div>
      </main>
    </ChromeShell>
  );
}

/* ─── Componentes auxiliares ─── */

interface ExpandableItemProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  badge: number;
  openPanel: string | null;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}

function ExpandableItem({ id, icon, label, badge, openPanel, onToggle, children }: ExpandableItemProps) {
  const isOpen = openPanel === id;
  return (
    <>
      <button
        type="button"
        className={`nav-item-expandable ${isOpen ? 'is-open' : ''}`}
        onClick={() => onToggle(id)}
      >
        <span className="item-icon">{icon}</span>
        <span className="item-label">{label}</span>
        {badge > 0 && <span className="item-badge">{badge}</span>}
        <span className="item-chevron"><ChevronRight size={14} /></span>
      </button>
      {isOpen && <div className="nav-panel">{children}</div>}
    </>
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
    if ((e.target as HTMLElement).closest('a, button')) return;
    nav(detailUrl);
  }

  return (
    <tr className={odd ? 'odd' : 'even'} onClick={onRowClick}>
      <td className="mono-id">{sucAbbrev(r.sucursal)}</td>
      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.ci}</td>
      <td><span style={{ color: 'var(--fg1)', fontWeight: 500 }}>{r.paciente}</span></td>
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
