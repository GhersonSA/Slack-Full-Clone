# Backend - Slack Clone MVP

FastAPI backend with modular architecture and SQLModel persistence.

## Setup

1. Create and activate venv:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
pip install -r requirements.txt
```

3. Copy environment file:

```powershell
Copy-Item .env.example .env
```

4. Run API:

```powershell
uvicorn app.main:app --reload
```

## Architecture

- app/core/config.py: environment-based settings
- app/db/models.py: SQLModel entities (users, channels, messages)
- app/db/session.py: engine/session management
- app/api/v1/endpoints: REST endpoints
- app/main.py: FastAPI app factory and middleware setup

## Current Endpoints

- GET /api/v1/health
- POST /api/v1/users
- GET /api/v1/users
- GET /api/v1/users/{user_id}
- POST /api/v1/channels
- GET /api/v1/channels
- GET /api/v1/channels/{channel_id}
