# KINEA · Design System

> Sistema de diseño para **KINEA PACS Explorer** — worklist + visor DICOM + módulo de informes.
> Inspirado en AdminLTE 3 dark-mode (legado de Pentalogic) re-implementado en CSS moderno + Tailwind v4.

Este documento es la **fuente de verdad para Claude Design** y para cualquier nueva pantalla que se sume al producto. Todo nuevo componente debe consumir tokens — nunca hardcodear hex.

---

## 1. Filosofía

| Principio | Aplicación |
|---|---|
| **Densidad de datos** | Worklist muestra ~30 estudios por viewport. Padding compacto (`8px / 10px`), font-size base `13px`. |
| **Contraste alto** | Texto `#e9ecef` sobre fondos `#1d2124` / `#343a40` (WCAG AA mínimo). |
| **Jerarquía cromática** | Cyan KINEA (`#01A3E4`) reservado para acciones primarias y elementos de marca. Nunca decorativo. |
| **Estados clínicos claros** | Verde = firmado/leído, ámbar = pendiente, rojo = error/urgente. Coherente con expectativas médicas. |
| **Tema oscuro como default** | Médicos/radiólogos trabajan en salas con poca luz. El light-mode es para login y reports impresos. |

---

## 2. Paleta

Todos los tokens viven en [`src/tokens.css`](./src/tokens.css) bajo `@theme { … }` (Tailwind v4).

### 2.1 Brand

| Token | HEX | Uso |
|---|---|---|
| `--color-kinea-cyan` | `#01A3E4` | Botones primary, brand badge, links activos, focus rings |
| `--color-kinea-cyan-dark` | `#0186b8` | Hover/active del primary |
| `--color-kinea-cyan-light` | `#82c8e3` | Texto secundario sobre fondo cyan |

### 2.2 Surfaces (lineage AdminLTE 3 dark)

| Token | HEX | Uso |
|---|---|---|
| `--color-surface-page` | `#454d55` | Body background |
| `--color-surface-card` | `#343a40` | Cards, navbar, sidebar header, table body |
| `--color-surface-deep` | `#1d2124` | Sidebar nav, contenedores principales |
| `--color-surface-deeper` | `#16191c` | Hover sobre `surface-deep` |
| `--color-surface-elevated` | `#3b4147` | Card-header (1 nivel arriba de card) |
| `--color-border-subtle` | `#23272b` | Bordes entre cards |
| `--color-border-strong` | `#495057` | Bordes de inputs, divisores activos |

### 2.3 Texto

| Token | HEX | Uso |
|---|---|---|
| `--color-text-primary` | `#e9ecef` | Headings, valores destacados |
| `--color-text-body` | `#c2c7d0` | Cuerpo, default |
| `--color-text-muted` | `#8e959c` | Labels, helper text |
| `--color-text-disabled` | `#6c757d` | Placeholders, "—" vacío |
| `--color-text-inverse` | `#212529` | Sobre fondos claros (login) |

### 2.4 Status

| Token | HEX | Significado clínico |
|---|---|---|
| `--color-status-success` | `#28a745` | Estudio firmado, mensaje WSP leído |
| `--color-status-warning` | `#ffc107` | Pendiente de informe, WSP pendiente |
| `--color-status-danger` | `#dc3545` | Error, WSP fallido, alerta >24h |
| `--color-status-info` | `#17a2b8` | Notificación neutra |

---

## 3. Tipografía

```
Familia:  'Segoe UI', system-ui, sans-serif
Mono:     'Cascadia Code', 'Consolas', monospace
```

Mono se usa para: CI, accession numbers, study UIDs, abreviaturas de sucursal.

| Token | Px | Uso |
|---|---|---|
| `--text-xs` | 11 | Labels, captions, badges |
| `--text-sm` | 12 | Tabla cells secundarias |
| `--text-base` | 13 | **Default** body, tabla cells |
| `--text-md` | 14 | Form inputs, paragraph |
| `--text-lg` | 16 | Brand text, sub-headings |
| `--text-xl` | 20 | Section titles |
| `--text-2xl` | 24 | Page titles |
| `--text-3xl` | 30 | KPI values del dashboard |

---

## 4. Espaciado (4-pt grid)

`--spacing-xs:4 / sm:6 / md:10 / lg:14 / xl:18 / 2xl:24`

> Nota: el grid es 4-pt salvo `md=10` y `lg=14` que son herencia AdminLTE — preservados para densidad.

**Layout fijo:**
- `--layout-navbar-height: 56px`
- `--layout-sidebar-width: 250px`

---

## 5. Componentes existentes

Todos viven en [`src/index.css`](./src/index.css) y se consumen como `className="adm-…"`.

### 5.1 `.adm-navbar`
Top bar sticky con altura `56px`. Contiene `.nav-link` (botones/anchors).
- **Posición**: `sticky top-0 z-30`
- **Estados**: default `#adb5bd`, hover blanco con bg `rgba(255,255,255,.04)`, `.active` blanco
- **Variantes especiales**: logout en `#ff6b6b`

### 5.2 `.adm-sidebar`
Sidebar oscuro `250px` colapsable.
- **Sub-elementos**: `.brand-link` (logo + nombre), `.nav-header` (sección uppercase), `.nav-item` (link), `.form-block` (filtros)
- **Estados de `.nav-item`**: default, hover (bg deeper + border-left gris), active (bg cyan + border-left blanco)

### 5.3 `.adm-pill`
Botones compactos para filtros multi-select.
- **Estados**: default (bg `#2b3035`), hover (bg strong), `.active` (bg cyan)
- **Uso**: chips de período, modalidad, etiquetas

### 5.4 `.adm-input` / `.adm-select`
Form controls oscuros con focus cyan.
- **Focus**: border cyan + box-shadow `--shadow-focus-cyan`

### 5.5 `.adm-btn`
- `.adm-btn` — default gris
- `.adm-btn.btn-primary` — cyan, CTA
- `.adm-btn.btn-ghost` — transparente, para action icons en tabla

### 5.6 `.adm-card` / `.adm-card-header`
Contenedor con border subtle + shadow card. Header en `surface-elevated`.

### 5.7 `.adm-table`
Estilo `table-dark table-striped table-hover` (DataTables 1.10 lineage).
- **Header**: `#2b3035`, uppercase, font-weight 600
- **Filas**: alternadas `.odd / .even`, hover `#2c3034 + texto blanco`
- **Cells**: padding `8px 10px`, border-top subtle

### 5.8 `.adm-badge`
Pills redondas para modalidad/estado.
- **Variantes**: `.bg-info` (cyan), `.bg-success`, `.bg-warning`, `.bg-danger`, `.bg-secondary`

### 5.9 `.adm-kpi`
Card de KPI para dashboards.
- Estructura: `.label` (uppercase) → `.value` (30px cyan) → `.sub` (muted)
- **Variantes color**: `.success`, `.warning`, `.danger`

### 5.10 `.login-wrap` / `.login-card`
Split-card 50/50: form blanco a la izquierda, hero cyan-gradient a la derecha.
- **`.login-input`**: underline-only, focus cyan
- **`.login-btn`**: pill-shaped (`radius-pill = 25px`), cyan brand

---

## 6. Patrones de layout

### 6.1 Worklist / Listados con filtros
```
┌─────────────────────────────────────────────┐
│ navbar (sticky, 56px)                       │
├──────┬──────────────────────────────────────┤
│      │ search bar (card-header)             │
│ side │─────────────────────────────────────│
│ bar  │ data table (adm-table)               │
│ 250  │                                      │
│      │                                      │
└──────┴──────────────────────────────────────┘
```

### 6.2 Login (público)
```
┌────────────────────────────────────┐
│  ┌─────────┬──────────┐            │
│  │  form   │  hero    │ centered   │
│  │  white  │  gradient│ 920px      │
│  └─────────┴──────────┘            │
└────────────────────────────────────┘
```

### 6.3 Dashboard (KPIs + charts)
```
┌─────────────────────────────────────────────┐
│ navbar                                      │
├─────────────────────────────────────────────┤
│ ┌───┬───┬───┬───┐  4 KPI cards row         │
│ │KPI│KPI│KPI│KPI│                          │
│ └───┴───┴───┴───┘                          │
│ ┌──────────┬──────────┐  2-col charts      │
│ │  chart   │  chart   │                    │
│ └──────────┴──────────┘                    │
│ ┌──────────────────────┐  alerts list      │
│ │  alert-row × N       │                   │
│ └──────────────────────┘                   │
└─────────────────────────────────────────────┘
```

### 6.4 Detalle de estudio / Visor (futuro)
```
┌─────────────────────────────────────────────┐
│ navbar (sticky)                             │
├──────┬──────────────────────────────────────┤
│      │  toolbar de visor (acciones)         │
│ side │─────────────────────────────────────│
│ list │  canvas DICOM                        │
│ de   │  (1×1, 2×1, 2×2 layouts)             │
│series│                                      │
└──────┴──────────────────────────────────────┘
```

---

## 7. Iconografía

**Librería**: [lucide-react](https://lucide.dev) (licencia ISC, ~70 KB tree-shakeable).

Tamaños canónicos:
- `12 / 13 px` — inline en cells de tabla, badges
- `14 / 16 px` — botones, navbar
- `18 / 20 px` — toggles principales (menú, fullscreen)
- `40+ px` — hero illustrations (login)

**Mapeo semántico:**
| Concepto | Icon |
|---|---|
| Visor | `Eye` |
| Informe | `FileText` |
| Descargar | `Download` |
| Búsqueda | `Search` |
| Filtros | `Filter` |
| Período | `Calendar` |
| Estado firmado | `CheckCircle2` |
| Estado pendiente | `Clock` |
| WhatsApp | `MessageCircle` |
| Error/Alerta | `AlertCircle` |
| Logout | `LogOut` |
| Usuario | `User` |
| Notificación | `Bell` |
| Pantalla completa | `Maximize2` |
| Menu toggle | `Menu` |
| Dashboard/charts | `BarChart3` |

---

## 8. Animaciones / transitions

| Token | Duración | Uso |
|---|---|---|
| `--transition-fast` | 120ms | Hover states de botones, pills |
| `--transition-normal` | 150ms | Background changes en buttons |
| `--transition-slow` | 220ms | Border-bottom de inputs login |

**Regla**: nada de animaciones gratuitas. La app es clínica, no marketing — los radiólogos trabajan rápido.

---

## 9. Responsive

El POC actual es **desktop-first** (médicos en escritorios con monitores 1080p+). Mobile no es prioridad por ahora.

**Breakpoints futuros** (si se agregan):
- `< 768px`: sidebar colapsa a drawer, navbar simplificada
- `768–1280px`: sidebar full, table con scroll horizontal
- `> 1280px`: layout actual

---

## 10. Glosario clínico (para Claude Design)

Cuando generes pantallas nuevas, usá esta nomenclatura:

| Término | Significado |
|---|---|
| **Estudio** | Conjunto de imágenes DICOM de un paciente en una fecha (= "study") |
| **Serie** | Subconjunto del estudio (ej: una secuencia MR) |
| **Modalidad** | Tipo de equipo: DX, CR, CT, MR, US, MG, XA, NM, PT, OT |
| **Accession Number (A.N.)** | ID único asignado por el RIS al ordenar el estudio |
| **CI** | Cédula de identidad del paciente (Bolivia) |
| **Sucursal** | Sede física del centro (KINEA Central, Norte, etc.) |
| **Worklist** | Listado de estudios para que el radiólogo lea |
| **Informe** | Reporte clínico firmado por el radiólogo |
| **Confirmado / Firmado** | Informe ya firmado digitalmente |
| **WSP** | Estado del envío del informe por WhatsApp |
| **Visor** | UI que renderiza imágenes DICOM (Cornerstone.js / Stone / OHIF) |

---

## 11. No-goals (qué evitar)

- ❌ Animaciones llamativas (skeletons OK; bouncing/spinning decorativo NO)
- ❌ Gradientes coloridos fuera del login
- ❌ Iconos decorativos sin función
- ❌ Light-mode en pantallas internas (sólo login y PDFs)
- ❌ Tipografías serif (excepto en informes impresos)
- ❌ Sombras grandes sobre cards (queda flotante, no plano)

---

## 12. Referencia rápida para Claude Design

> Usá esto en el chat de claude.ai/design al pedir nuevas pantallas:

> *"Aplicar el design system KINEA. Color primario `kinea-cyan`. Surfaces tipo AdminLTE dark (`surface-card`, `surface-deep`). Tabla con clase `adm-table`. Cards con `adm-card` + header `adm-card-header`. Botones `adm-btn.btn-primary` para CTAs. Sidebar oscuro 250px sticky con `adm-sidebar`. Navbar 56px sticky con `adm-navbar`. Iconos lucide-react 14px en tabla, 16px en navbar."*

---

**Versión**: 0.1.0 · **Última actualización**: ver git log de [`src/tokens.css`](./src/tokens.css)
