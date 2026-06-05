from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.db.session import create_db_and_tables

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    # For MVP speed we create tables automatically; Alembic migrations come next phase.
    create_db_and_tables()
    yield


def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.app_name,
        debug=settings.debug,
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(api_router, prefix=settings.api_v1_prefix)
    return application


app = create_application()
