# KINEA · PACS Explorer (POC Frontend)

Front-end alternativo para **KINEA PACS Explorer** — worklist + login modernizados en React 19 + Vite, manteniendo el estilo visual del producto original (AdminLTE 3 dark-mode lineage).

> **Status**: Proof of concept funcional. La worklist y el login están listos. El visor DICOM y el editor de informes siguen viviendo en el back-end PHP existente y se abren en pestañas nuevas.

---

## ¿Por qué este POC?

El PACS original es **PHP 8.3 + jQuery 3.6 + DataTables 1.10 + AdminLTE 3**. Funciona, pero:
- Cada filtro recarga la página entera (~800 ms FCP)
- jQuery + DataTables suman ~600 KB de JS legado
- Cero type-safety
- Difícil de iterar en UI

Este POC mide cuánto valor agrega React/Vite **manteniendo el back-end PHP intacto**. Resultados (datos reales del repo):

| Métrica | PHP+jQuery | Vite+React |
|---|---|---|
| First paint worklist | ~800 ms (full reload) | ~6 ms (cache hit) |
| Cambio de filtro | full page reload | fetch incremental |
| Build prod | n/a | 639 ms |
| Bundle gzip | ~600 KB | ~180 KB |

---

## Stack

- **React 19** + TypeScript 6
- **Vite 8** (dev server + build)
- **TanStack Query v5** (data fetching + cache)
- **React Router v7**
- **Tailwind CSS v4** (CSS-first config con `@theme`)
- **lucide-react** (iconos)
- **Backend**: el PHP existente (sin cambios excepto CORS + 2 endpoints JSON nuevos)

---

## Arquitectura

```
┌──────────────────────┐         ┌────────────────────────┐
│  Vite + React        │ fetch   │  PHP 8.3 + SQLite      │
│  http://127.0.0.1:3000│ ──────▶ │  http://127.0.0.1:8080 │
│                      │ creds   │                        │
│  · Login             │ include │  · /api/login.php      │
│  · Worklist          │         │  · /api/estudios.php   │
│                      │         │  · session cookies     │
└──────────────────────┘         └────────────────────────┘
                                            │
                                            ▼
                                  ┌────────────────────────┐
                                  │  Orthanc DICOM         │
                                  │  http://127.0.0.1:8042 │
                                  └────────────────────────┘
```

El front nunca habla con Orthanc directo — todo va vía el PHP que ya existe.

---

## Setup (primera vez)

### Requisitos
- Node ≥ 20 (probado en 24)
- El back-end PHP corriendo en `:8080` (ver `../public/ecos/pacsexplorerwsp/`)
- Orthanc corriendo en `:8042` (opcional, sólo para abrir el visor)

### Pasos

```bash
# 1. Clonar y entrar
cd poc-vite

# 2. Instalar dependencias
npm install

# 3. Levantar el dev server
npm run dev
# → http://127.0.0.1:3000

# 4. (En otra terminal) levantar el PHP
cd ../tools/php
./php.exe -S 127.0.0.1:8080 -t ../../public

# 5. Login
# Usuario: admin
# Contraseña: admin
```

---

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Vite dev server con HMR (puerto 3000, strict) |
| `npm run build` | Type-check + build de producción a `dist/` |
| `npm run preview` | Servir `dist/` para validar build prod |
| `npm run lint` | ESLint + react-hooks rules |

---

## Estructura

```
poc-vite/
├── DESIGN_SYSTEM.md      ← documentación de paleta, tokens y componentes
├── README.md             ← este archivo
├── index.html
├── vite.config.ts        ← puerto 3000, host 127.0.0.1, plugin tailwind
├── package.json
├── tsconfig*.json
└── src/
    ├── main.tsx          ← bootstrap: QueryClient + Router + rutas
    ├── tokens.css        ← @theme tokens (Tailwind v4 CSS-first)
    ├── index.css         ← componentes (.adm-card, .adm-table, .adm-btn, …)
    ├── types.ts          ← TS types para responses del backend PHP
    └── pages/
        ├── Login.tsx     ← form auth contra /api/login.php
        └── Worklist.tsx  ← tabla + filtros contra /api/estudios.php
```

---

## Backend — endpoints consumidos

Todos viven en `public/ecos/pacsexplorerwsp/api/` (creados específicamente para este POC, no rompen nada del PHP original).

### `POST /api/login.php`

```http
POST /api/login.php HTTP/1.1
Content-Type: application/json

{ "usuario": "admin", "clave": "admin" }
```

**Response 200:**
```json
{
  "user": { "id": 1, "usuario": "admin", "nombre": "Administrador", "perfil": "admin" },
  "permisos": ["view_estudios", "edit_informe", ...]
}
```

Setea cookie `pacsexplorerwsp` (PHP session, HttpOnly, SameSite=Lax).

### `GET /api/estudios.php`

Query params:
- `search` — busca en paciente / CI / accession / descripción
- `modalidad` — CSV (`CT,MR`)
- `fecha_desde`, `fecha_hasta` — `YYYY-MM-DD`
- `con_informe` — `0` o `1`
- `sucursal_id` — int
- `limit` / `offset` — paginación
- `catalog=1` — devuelve también catálogos (modalidades, sucursales)

**Response 200:**
```json
{
  "total": 5,
  "limit": 500,
  "offset": 0,
  "rows": [
    {
      "id": 1,
      "study_instance_uid": "1.2.840.…",
      "ci": "3928916",
      "paciente": "PEDRAZA MORALES INGRID",
      "descripcion": "DX TÓRAX",
      "modalidad": "DX",
      "fecha_estudio": "2026-05-04 14:57:00",
      "accession_number": "924989",
      "series_cnt": 1,
      "images_cnt": 1,
      "confirmado": 0,
      "wsp_estado": null,
      "sucursal": "KINEA CENTRAL"
    }
  ],
  "user": { "nombre": "Administrador", … }
}
```

### CORS

Configurado en `_boot.php` para permitir `http://localhost:3000` y `http://127.0.0.1:3000` con `credentials: include`. **No habilitado en producción** — recortar a dominio real cuando se despliegue.

---

## Diseño / UI

Ver [**DESIGN_SYSTEM.md**](./DESIGN_SYSTEM.md) para la documentación completa de paleta, tokens, componentes y patrones.

**Resumen rápido:**
- Paleta KINEA cyan (`#01A3E4`) sobre superficies AdminLTE dark (`#343a40 / #1d2124`)
- Tipografía Segoe UI, base `13px`
- Componentes en `.adm-*` clases (navbar, sidebar, card, table, pill, badge, btn)
- Tokens en `src/tokens.css` consumidos vía `var(--…)` en `src/index.css`

---

## Integrar con Claude Design

Este repo está estructurado para que [**Claude Design**](https://claude.ai/design) lo entienda como design system:

1. **Linkeá el repo** en claude.ai/design → tu proyecto → *Set up design system*
2. Apuntá a la subcarpeta `poc-vite/src` (no el monorepo entero)
3. Subí adicionalmente un screenshot del worklist actual como referencia visual
4. Pedile pantallas nuevas en lenguaje natural — usará automáticamente los tokens definidos en `tokens.css` y los componentes documentados en `DESIGN_SYSTEM.md`

Frase sugerida para el chat:

> *"Generá [pantalla X] usando el design system KINEA. Tokens en src/tokens.css, componentes en src/index.css, documentación en DESIGN_SYSTEM.md."*

---

## Lo que **NO** está en el POC (a propósito)

- Visor DICOM → sigue siendo el `view.php` actual (Cornerstone.js)
- Editor de informes → sigue siendo `informes_edit.php` (TinyMCE)
- Dashboard → sigue siendo `dashboard.php`
- RBAC en UI → el back-end ya tira 403, falta esconder botones en el front
- Multi-tenant subdomain routing
- Dictáfono / plantillas de informe
- Pruebas E2E (existen scripts manuales en `recon-output/`, no integrados en CI)

---

## Decisión arquitectónica: ¿reemplazar todo el PHP?

**No por ahora.** El POC es para evaluar, no para migrar. Si el feedback es positivo, las opciones son:

| Opción | Esfuerzo | Riesgo |
|---|---|---|
| **A. Híbrido** — worklist + login en React, resto en PHP | ~1 sem | Bajo |
| **B. Migración full** — todo a React (incl. visor + informes) | ~3-4 sem | Medio (visor DICOM es no trivial) |
| **C. Mantener PHP** — descartar el POC | 0 | Cero |

---

## Troubleshooting

**Vite arranca pero el browser muestra "Cannot connect"**
→ Confirmá que el puerto 3000 no está ocupado. `vite.config.ts` tiene `strictPort: true`, así que falla en lugar de saltar a otro puerto.

**Worklist queda en "Cargando…" y el devtools muestra CORS error**
→ El PHP no está corriendo o `_boot.php` no tiene los headers CORS. Verificá:
```php
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin === 'http://localhost:3000' || $origin === 'http://127.0.0.1:3000') { … }
```

**Login funciona pero la worklist tira 401**
→ La cookie de sesión no se está enviando. Confirmá que **todos** los `fetch` tienen `credentials: 'include'` y que el browser no está bloqueando third-party cookies (mismo dominio = OK, dev usa `127.0.0.1` ↔ `localhost` que el browser trata como same-site).

**Build falla con "tsc: command not found"**
→ Faltan dependencias. `npm install` de nuevo.

---

## Licencia

Privado / KINEA. No redistribuir.
