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

4. Apply database migrations:

```powershell
alembic upgrade head
```

5. Run API:

```powershell
uvicorn app.main:app --reload
```

## Migrations

Create a new migration after model changes:

```powershell
alembic revision --autogenerate -m "describe_change"
```

Apply latest migrations:

```powershell
alembic upgrade head
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
- POST /api/v1/channels/{channel_id}/members
- GET /api/v1/channels/{channel_id}/members
- POST /api/v1/channels/{channel_id}/messages
- GET /api/v1/channels/{channel_id}/messages
- WS /api/v1/realtime/ws/channels/{channel_id}?user_id={user_id}

## Testing

Run the focused backend integration suite:

```powershell
pytest tests/test_realtime_flow.py -q
```

Current coverage includes:

- REST membership requirement for message fallback
- REST message persistence and history retrieval
- WebSocket membership guard
- WebSocket happy-path connect and message broadcast

## WebSocket Contract

- Client ping:

```json
{
	"type": "ping"
}
```

- Client chat message:

```json
{
	"type": "message",
	"body": "hello team"
}
```

- Server chat event:

```json
{
	"type": "message",
	"id": "uuid",
	"channel_id": "uuid",
	"author_id": "uuid",
	"body": "hello team",
	"created_at": "2026-06-05T18:00:00Z"
}
```
