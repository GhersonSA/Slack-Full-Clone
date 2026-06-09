# Slack Full Clone

Monorepo orientado a producto que replica el núcleo de la experiencia de Slack en escritorio: navegación por canales y mensajes directos, mensajería en tiempo real, presencia, persistencia y una interfaz desktop con un nivel de fidelidad visual alto.

El proyecto está organizado en dos dominios claros:

- `backend`: API REST + WebSocket en FastAPI, persistencia con SQLModel/SQLAlchemy y migraciones Alembic.
- `desktop`: aplicación desktop con Electron, renderer en React + TypeScript, estilos con TailwindCSS y cobertura con Vitest.

## Objetivo del proyecto

Este repositorio no busca únicamente “mostrar pantallas”; busca resolver un flujo real de colaboración tipo Slack con una arquitectura suficientemente limpia para evolucionar hacia producción. El alcance actual cubre:

- creación y listado de usuarios
- creación y listado de canales
- membresías por canal
- envío y recuperación de mensajes
- presencia por canal en tiempo real
- cliente desktop con fallback local cuando el backend no está disponible
- validaciones mínimas de calidad para evitar regresiones visibles

## Stack técnico

### Backend

- Python `3.12+`
- FastAPI `0.136.3`
- Uvicorn `0.49.0`
- SQLModel `0.0.38`
- SQLAlchemy `2.0.50`
- Alembic `1.18.4`
- pydantic-settings `2.14.1`
- python-dotenv `1.2.2`
- websockets `16.0`
- psycopg2-binary `2.9.12`

### Desktop

- Node.js `22+`
- npm `10+`
- Electron `39.2.6`
- React `19.2.1`
- React DOM `19.2.1`
- TypeScript `5.9.3`
- Vite `7.2.6`
- electron-vite `5.0.0`
- TailwindCSS `3.4.19`
- Vitest `4.1.8`
- Testing Library React `16.3.2`
- ESLint `9.39.1`
- Prettier `3.7.4`
- electron-builder `26.0.12`

## Arquitectura

### Visión general

El sistema separa con claridad transporte, estado y presentación:

1. El `backend` expone endpoints REST para bootstrap y operaciones de negocio.
2. El canal WebSocket cubre eventos de presencia y mensajería en tiempo real.
3. El cliente `desktop` consume REST/WebSocket cuando el backend está disponible.
4. Si la conectividad falla, el renderer activa un fallback local para preservar la interacción principal.
5. Un adaptador transforma el estado de dominio en props de layout para la réplica visual estilo Slack.

### Backend

Piezas principales:

- `backend/app/main.py`: inicialización de FastAPI, middleware y wiring principal.
- `backend/app/core/config.py`: configuración por entorno.
- `backend/app/db/models.py`: entidades y relaciones de persistencia.
- `backend/app/db/session.py`: gestión de engine y sesiones.
- `backend/app/api/v1/endpoints/`: endpoints REST versionados.
- `backend/app/realtime/`: presencia, contratos y flujo WebSocket.
- `backend/alembic/`: historial de migraciones.

Responsabilidades clave:

- persistencia de usuarios, canales, membresías y mensajes
- broadcasting realtime por canal
- observabilidad básica con `X-Request-ID`
- soporte para evolución del esquema mediante Alembic

### Desktop

Piezas principales:

- `desktop/src/main/`: proceso principal de Electron.
- `desktop/src/renderer/src/App.tsx`: bootstrap, estado orquestador y fallback local.
- `desktop/src/renderer/src/components/layout/`: layout visual, navegación y chat.
- `desktop/src/renderer/src/components/layout/adapter.ts`: adaptación entre dominio y UI.
- `desktop/src/renderer/src/assets/main.css`: tokens visuales y ajustes globales.

Decisiones relevantes del cliente:

- aislamiento entre datos de dominio y componentes presentacionales
- tolerancia a backend caído mediante mocks y acciones locales
- sanitización de errores para evitar mensajes técnicos en UI
- composición visual pensada para parecerse a Slack sin sacrificar mantenibilidad

## Estructura del repositorio

```text
.
├─ backend/
│  ├─ alembic/
│  ├─ app/
│  ├─ tests/
│  ├─ requirements.txt
│  └─ README.md
├─ desktop/
│  ├─ src/
│  ├─ package.json
│  └─ ...
├─ docs/
│  └─ runbooks/
├─ scripts/
│  ├─ bootstrap.ps1
│  ├─ validate.ps1
│  └─ release-desktop.ps1
└─ .github/
   └─ workflows/
```

## Características implementadas

### Backend

- `GET /api/v1/health`
- CRUD operativo mínimo para usuarios y canales
- alta de miembros por canal
- creación y lectura de mensajes por canal
- endpoint de presencia por canal
- WebSocket de tiempo real por canal

### Desktop

- interfaz desktop tipo Slack
- navegación entre canales y DMs
- composer de mensajes funcional
- top navigation y sidebar pulidas visualmente
- fallback local para crear canales y enviar mensajes
- semilla local de workspace para mantener la UX aunque la API falle
- textos UI en español corregidos y consistentes

## Inicio rápido

### Opción recomendada

```powershell
./scripts/bootstrap.ps1
```

### Arranque manual

Backend:

```powershell
Set-Location ./backend
python -m venv .venv
./.venv/Scripts/Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

Desktop:

```powershell
Set-Location ./desktop
npm install
npm run dev
```

## Calidad y validación

Validación local completa:

```powershell
./scripts/validate.ps1
```

Checks relevantes:

- backend: `pytest tests/test_realtime_flow.py tests/test_end_to_end_user_journey.py tests/test_observability.py -q`
- desktop: `npm run test:web`
- desktop: `npm run typecheck`

El objetivo de estos gates no es “sumar comandos”, sino garantizar que los flujos más sensibles no se rompan:

- persistencia y recuperación de mensajes
- guardas de membresía
- presencia en tiempo real
- trazabilidad de requests
- consistencia básica de tipado en desktop

## Observabilidad y operación

El backend incorpora mecanismos básicos pero útiles de operación:

- todas las respuestas HTTP incluyen `X-Request-ID`
- si el cliente envía `X-Request-ID`, el backend lo preserva
- los errores devuelven `request_id` para correlación rápida
- el nivel de logs se controla con `LOG_LEVEL`

Runbooks disponibles:

- `docs/runbooks/desktop-release.md`
- `docs/runbooks/backend-incident-first-response.md`

## CI/CD

La pipeline de CI se ejecuta sobre `push` a `main` y en `pull requests`.

Cobertura actual de CI:

- tests backend con FastAPI + Alembic
- tests frontend desktop
- typecheck del cliente desktop

## Flujo de trabajo recomendado

1. Crear una rama de trabajo.
2. Ejecutar `./scripts/validate.ps1` antes de commitear.
3. Mantener commits pequeños y con Conventional Commits.
4. Validar CI antes de fusionar a `main`.

## Estado actual

Estado del proyecto en este momento:

- backend estable para el flujo base de colaboración
- cliente desktop funcional y visualmente muy avanzado
- fallback local implementado para mejorar resiliencia en demos y desarrollo
- suite de pruebas orientada a regresiones del flujo principal
- base preparada para extender autenticación, persistencia avanzada y multi-workspace

## Roadmap sugerido

Siguientes pasos razonables para evolucionar el proyecto:

- autenticación real y gestión de sesión
- persistencia local del fallback en desktop
- edición y borrado de mensajes
- indicadores de lectura y no leídos
- gestión multi-workspace
- empaquetado y distribución desktop por entorno

## Documentación adicional

- `backend/README.md`
- `docs/runbooks/desktop-release.md`
- `docs/runbooks/backend-incident-first-response.md`

## Licencia

Consulta el archivo `LICENSE` del repositorio para detalles de licencia y uso.
