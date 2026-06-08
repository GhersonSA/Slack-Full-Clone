# Backend Incident First Response

Guia de primer nivel para diagnosticar incidencias del backend FastAPI.

## Objetivo

Reducir tiempo de diagnostico inicial usando correlacion por `request_id` y checks rapidos.

## Checklist de 5 minutos

1. Confirmar estado de API:

```powershell
curl http://127.0.0.1:8000/api/v1/health
```

2. Verificar que la respuesta incluya header `X-Request-ID`.
3. Reproducir request fallida capturando `X-Request-ID` de respuesta.
4. Buscar ese `request_id` en logs de backend.
5. Clasificar incidente: validacion (4xx), negocio (403/409), no controlado (500).

## Clasificacion rapida

- 4xx con `detail` claro:
  - problema de datos de entrada o reglas funcionales.
- 403/409 recurrente:
  - potencial problema de flujo de negocio del cliente.
- 500:
  - revisar traza completa por `request_id` y escalar a soporte de desarrollo.

## Datos minimos para escalar

1. Timestamp aproximado.
2. Endpoint y metodo HTTP.
3. `X-Request-ID`.
4. Payload de entrada (sin secretos).
5. `detail` de respuesta.

## Comandos de verificacion local

```powershell
./scripts/validate.ps1
```

Si falla solo backend:

```powershell
Set-Location ./backend
./.venv/Scripts/Activate.ps1
pytest tests/test_observability.py -q
```

## Criterio de cierre L1

- Si el incidente es de datos/uso del endpoint y hay workaround documentado, cerrar con guia al consumidor.
- Si hay 500 o comportamiento inconsistente no reproducible, escalar con evidencia minima completa.
