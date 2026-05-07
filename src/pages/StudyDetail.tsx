/**
 * StudyDetail.tsx — Página de detalle de un estudio.
 *
 * Adoptado del handoff de Claude Design (StudyDetail.jsx) y conectado a
 * datos reales: busca el estudio por `study_instance_uid` en el endpoint
 * `/api/estudios.php` y muestra ficha + sidebar de series.
 *
 * El visor DICOM real sigue siendo `view.php` (Cornerstone.js) — desde acá
 * se abre en una pestaña nueva con el botón "Abrir visor".
 */

import { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Image as ImageIcon, Info, Eye, FileText, Download,
  Sun, Ruler, Maximize2, ExternalLink, AlertCircle,
} from 'lucide-react';
import ChromeShell, { Sidebar } from '../components/Chrome';
import type { EstudiosResponse, Estudio } from '../types';

const PHP = import.meta.env.VITE_PHP_BASE || 'http://127.0.0.1:8080';

function calcEdad(fechaNac: string | null): string {
  if (!fechaNac) return '—';
  const n = new Date(fechaNac.replace(' ', 'T'));
  const ms = Date.now() - n.getTime();
  const years = Math.floor(ms / (365.25 * 24 * 3600 * 1000));
  return years > 0 && years < 150 ? `${years} a` : '—';
}

function formatFecha(s: string): string {
  const d = new Date(s.replace(' ', 'T'));
  return d.toLocaleString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function StatusBadge({ estudio }: { estudio: Estudio }) {
  if (estudio.confirmado === 1) {
    return <span className="adm-badge bg-success">Informado</span>;
  }
  return <span className="adm-badge bg-warning">Pendiente</span>;
}

export default function StudyDetailPage() {
  const { studyUid } = useParams<{ studyUid: string }>();
  const nav = useNavigate();

  // Estrategia: pedimos hasta 500 estudios y filtramos por UID.
  // Cuando el backend tenga `/api/estudio/:uid`, cambiar a single-fetch.
  const q = useQuery<EstudiosResponse>({
    queryKey: ['estudios', 'detail-source'],
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

  const estudio = useMemo<Estudio | undefined>(
    () => q.data?.rows.find(r => r.study_instance_uid === studyUid),
    [q.data, studyUid]
  );

  const userName = q.data?.user?.nombre ?? '';

  if (q.isLoading) {
    return (
      <ChromeShell user={{ nombre: userName }} current="study">
        <Sidebar><div className="form-block adm-muted">Cargando…</div></Sidebar>
        <main style={{ flex: 1, padding: 18 }}>
          <div className="adm-card" style={{ padding: 32, textAlign: 'center', color: 'var(--fg3)' }}>
            Cargando estudio…
          </div>
        </main>
      </ChromeShell>
    );
  }

  if (!estudio) {
    return (
      <ChromeShell user={{ nombre: userName }} current="study">
        <Sidebar>
          <div className="form-block">
            <Link to="/" className="adm-btn" style={{ width: '100%' }}>
              <ArrowLeft size={13} /> &nbsp;Volver al worklist
            </Link>
          </div>
        </Sidebar>
        <main style={{ flex: 1, padding: 18 }}>
          <div className="adm-card" style={{ padding: 32, textAlign: 'center' }}>
            <AlertCircle size={32} style={{ color: 'var(--status-warning)' }} />
            <div style={{ marginTop: 12, color: 'var(--fg1)', fontSize: 14, fontWeight: 600 }}>
              Estudio no encontrado
            </div>
            <div style={{ marginTop: 4, color: 'var(--fg3)', fontSize: 12 }}>
              UID: <code>{studyUid}</code>
            </div>
          </div>
        </main>
      </ChromeShell>
    );
  }

  const viewerUrl   = `${PHP}/ecos/pacsexplorerwsp/view.php?studyuid=${encodeURIComponent(estudio.study_instance_uid)}`;
  const reportUrl   = `${PHP}/ecos/pacsexplorerwsp/informes_edit.php?studyuid=${encodeURIComponent(estudio.study_instance_uid)}`;
  const downloadUrl = `${PHP}/ecos/pacsexplorerwsp/descargardicom.php?studyuid=${encodeURIComponent(estudio.study_instance_uid)}`;

  return (
    <ChromeShell user={{ nombre: userName }} current="study">
      <Sidebar>
        <div className="nav-header">Estudio</div>
        <div className="form-block">
          <div style={{ color: 'var(--fg1)', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            {estudio.paciente}
          </div>
          <div style={{ color: 'var(--fg3)', fontSize: 11.5 }}>
            {calcEdad(estudio.fecha_nacimiento)} · {estudio.sexo ?? '—'} · {formatFecha(estudio.fecha_estudio)}
          </div>
          <div className="mono-id" style={{ marginTop: 6 }}>
            CI: {estudio.ci}
          </div>
        </div>

        <div className="nav-header">Series ({estudio.series_cnt})</div>
        {Array.from({ length: Math.min(estudio.series_cnt, 6) }).map((_, i) => {
          const imgsAprox = Math.max(1, Math.round(estudio.images_cnt / estudio.series_cnt));
          return (
            <a key={i} className={`nav-item ${i === 0 ? 'active' : ''}`} href="#">
              <ImageIcon size={13} /> &nbsp;Series {i + 1} · ~{imgsAprox} img
            </a>
          );
        })}
        {estudio.series_cnt > 6 && (
          <div className="form-block adm-muted" style={{ fontSize: 11.5 }}>
            +{estudio.series_cnt - 6} series más…
          </div>
        )}

        <div className="form-block" style={{ marginTop: 14 }}>
          <Link to="/" className="adm-btn" style={{ width: '100%' }}>
            <ArrowLeft size={13} /> &nbsp;Volver al worklist
          </Link>
        </div>
      </Sidebar>

      <main style={{ flex: 1, padding: 18, background: 'var(--surface-page)' }}>
        {/* Ficha del estudio */}
        <div className="adm-card" style={{ marginBottom: 14 }}>
          <div className="adm-card-header">
            <span><Info size={14} /> &nbsp;Detalle del estudio</span>
            <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
              <StatusBadge estudio={estudio} />
              <span className="adm-badge bg-info">{estudio.modalidad}</span>
            </span>
          </div>
          <div style={{
            padding: '14px 16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 18,
            color: 'var(--fg2)',
            fontSize: 13,
          }}>
            <Field label="Paciente" value={estudio.paciente} bold />
            <Field label="Edad / Sexo" value={`${calcEdad(estudio.fecha_nacimiento)} · ${estudio.sexo ?? '—'}`} />
            <Field label="A. Number" value={estudio.accession_number} mono />
            <Field label="Sucursal" value={estudio.sucursal} />

            <Field label="Fecha estudio" value={formatFecha(estudio.fecha_estudio)} />
            <Field label="Series / Imgs" value={`${estudio.series_cnt} / ${estudio.images_cnt}`} mono />
            <Field label="Estado" value={estudio.estado || (estudio.confirmado ? 'Informado' : 'Pendiente')} />
            <Field label="WSP" value={estudio.wsp_estado ?? '—'} />

            <div style={{ gridColumn: '1 / -1' }}>
              <Label text="Descripción" />
              <div style={{ marginTop: 3, color: 'var(--fg1)' }}>
                {estudio.descripcion || <span style={{ color: 'var(--fg4)' }}>—</span>}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Label text="Study Instance UID" />
              <div className="mono-id" style={{ marginTop: 3, wordBreak: 'break-all' }}>
                {estudio.study_instance_uid}
              </div>
            </div>
          </div>
        </div>

        {/* Visor placeholder */}
        <div className="adm-card">
          <div className="adm-card-header">
            <span><ImageIcon size={14} /> &nbsp;Visor DICOM</span>
            <span style={{ display: 'inline-flex', gap: 4 }}>
              <button className="adm-btn btn-ghost" title="Brillo/contraste"><Sun size={13} /></button>
              <button className="adm-btn btn-ghost" title="Medir"><Ruler size={13} /></button>
              <button className="adm-btn btn-ghost" title="Pantalla completa"><Maximize2 size={13} /></button>
              <a className="adm-btn btn-primary" href={viewerUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={13} /> &nbsp;Abrir visor
              </a>
            </span>
          </div>
          <div style={{
            height: 420,
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 10,
            color: '#3a3f47',
            borderRadius: '0 0 4px 4px',
          }}>
            <ImageIcon size={48} />
            <div style={{ fontSize: 12, letterSpacing: .5, textTransform: 'uppercase' }}>
              Visor DICOM · placeholder
            </div>
            <div style={{ fontSize: 11, color: '#2a2e35' }}>
              Cornerstone.js corre en el sistema legado · Click "Abrir visor" para verlo
            </div>
          </div>
        </div>

        {/* Acciones inferiores */}
        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          <a className="adm-btn btn-primary" href={viewerUrl} target="_blank" rel="noreferrer">
            <Eye size={13} /> &nbsp;Visor clásico
          </a>
          <a className="adm-btn" href={reportUrl} target="_blank" rel="noreferrer">
            <FileText size={13} /> &nbsp;Editor de informe
          </a>
          <a className="adm-btn" href={downloadUrl}>
            <Download size={13} /> &nbsp;Descargar DICOM
          </a>
        </div>
      </main>
    </ChromeShell>
  );
}

function Label({ text }: { text: string }) {
  return (
    <div style={{
      fontSize: 10.5, textTransform: 'uppercase',
      letterSpacing: .5, color: 'var(--fg3)',
      fontWeight: 700,
    }}>{text}</div>
  );
}

function Field({ label, value, bold, mono }: { label: string; value: string; bold?: boolean; mono?: boolean }) {
  return (
    <div>
      <Label text={label} />
      <div style={{
        marginTop: 3,
        color: 'var(--fg1)',
        fontWeight: bold ? 600 : 400,
        fontFamily: mono ? 'var(--font-mono)' : undefined,
        fontSize: mono ? 12 : undefined,
      }}>
        {value || <span style={{ color: 'var(--fg4)' }}>—</span>}
      </div>
    </div>
  );
}
