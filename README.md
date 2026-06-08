# Slack Full Clone MVP

Monorepo con backend FastAPI y desktop Electron + React para un MVP tipo Slack.

## Estructura

- `backend/`: API REST + WebSocket realtime + migraciones Alembic.
- `desktop/`: shell desktop con Electron, renderer React, pruebas Vitest.
- `.github/workflows/ci.yml`: pipeline de validacion en push/PR.
- `scripts/bootstrap.ps1`: prepara entorno local completo.
- `scripts/validate.ps1`: ejecuta quality gates locales.
- `scripts/release-desktop.ps1`: empaqueta desktop y corre smoke checks.
- `docs/runbooks/desktop-release.md`: runbook de release desktop.
- `docs/runbooks/backend-incident-first-response.md`: guia L1 para incidentes backend.

## Requisitos

- Python 3.12+
- Node.js 22+
- npm 10+

## Quick Start (Windows PowerShell)

```powershell
./scripts/bootstrap.ps1
```

Luego, en terminales separadas:

```powershell
# Backend
Set-Location ./backend
./.venv/Scripts/Activate.ps1
uvicorn app.main:app --reload
```

```powershell
# Desktop
Set-Location ./desktop
npm run dev
```

## Quality Gates

Ejecutar todos los checks locales:

```powershell
./scripts/validate.ps1
```

Incluye:

- Backend: `pytest tests/test_realtime_flow.py tests/test_end_to_end_user_journey.py tests/test_observability.py -q`
- Desktop: `npm run test:web`
- Desktop: `npm run typecheck`

## Desktop Release

Generar release local desktop (unpacked) + smoke checks:

```powershell
./scripts/release-desktop.ps1
```

Documentacion operativa completa:

- `docs/runbooks/desktop-release.md`

## Backend Observability

- Correlacion por `X-Request-ID` en todas las respuestas HTTP.
- Error payloads con `request_id` para trazabilidad operativa.
- Guia de primer nivel para incidentes en:
	- `docs/runbooks/backend-incident-first-response.md`

## Pipeline CI

La CI corre automaticamente en:

- Push a `main`
- Pull Requests

Jobs incluidos:

- Backend tests (FastAPI + Alembic migration)
- Desktop tests + typecheck

## Flujo de trabajo recomendado

1. Crear rama de trabajo.
2. Ejecutar `./scripts/validate.ps1` antes de commit.
3. Commits pequenos con Conventional Commits.
4. Push y validar pipeline CI en GitHub.

## Estado actual del MVP

- Backend robusto: usuarios, canales, membresias, mensajes, presencia y WebSocket.
- Persistencia con SQLModel + migraciones Alembic.
- Desktop funcional para flujos principales de chat.
- Cobertura frontend con pruebas de presencia, fallback REST y guard rails.
- CI activa para evitar regresiones.
