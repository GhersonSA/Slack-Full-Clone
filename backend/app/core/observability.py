import logging
from time import perf_counter
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response

REQUEST_ID_HEADER = 'X-Request-ID'

logger = logging.getLogger('app.observability')


def configure_logging(log_level: str) -> None:
  numeric_level = getattr(logging, log_level.upper(), logging.INFO)
  logging.basicConfig(
    level=numeric_level,
    format='%(asctime)s %(levelname)s %(name)s %(message)s',
  )


def _get_request_id(request: Request) -> str:
  header_value = request.headers.get(REQUEST_ID_HEADER)
  if header_value:
    return header_value
  return str(uuid4())


def _request_id_from_state(request: Request) -> str:
  request_id = getattr(request.state, 'request_id', None)
  if request_id:
    return request_id
  return _get_request_id(request)


def setup_observability(application: FastAPI) -> None:
  @application.middleware('http')
  async def request_context_middleware(request: Request, call_next) -> Response:
    request_id = _get_request_id(request)
    request.state.request_id = request_id

    start = perf_counter()
    response = await call_next(request)
    duration_ms = int((perf_counter() - start) * 1000)

    response.headers[REQUEST_ID_HEADER] = request_id

    logger.info(
      'request_completed request_id=%s method=%s path=%s status=%s duration_ms=%s',
      request_id,
      request.method,
      request.url.path,
      response.status_code,
      duration_ms,
    )

    return response

  @application.exception_handler(HTTPException)
  async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    request_id = _request_id_from_state(request)
    logger.warning(
      'http_exception request_id=%s method=%s path=%s status=%s detail=%s',
      request_id,
      request.method,
      request.url.path,
      exc.status_code,
      exc.detail,
    )

    response = JSONResponse(
      status_code=exc.status_code,
      content={
        'detail': exc.detail,
        'request_id': request_id,
      },
      headers=exc.headers,
    )
    response.headers[REQUEST_ID_HEADER] = request_id
    return response

  @application.exception_handler(RequestValidationError)
  async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    request_id = _request_id_from_state(request)
    logger.warning(
      'validation_exception request_id=%s method=%s path=%s errors=%s',
      request_id,
      request.method,
      request.url.path,
      exc.errors(),
    )

    response = JSONResponse(
      status_code=422,
      content={
        'detail': exc.errors(),
        'request_id': request_id,
      },
    )
    response.headers[REQUEST_ID_HEADER] = request_id
    return response

  @application.exception_handler(Exception)
  async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = _request_id_from_state(request)
    logger.exception(
      'unhandled_exception request_id=%s method=%s path=%s',
      request_id,
      request.method,
      request.url.path,
    )

    response = JSONResponse(
      status_code=500,
      content={
        'detail': 'Internal server error',
        'request_id': request_id,
      },
    )
    response.headers[REQUEST_ID_HEADER] = request_id
    return response
