from collections.abc import Generator

from sqlalchemy.engine import Engine
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.core.config import get_settings

settings = get_settings()

engine_options: dict[str, object] = {
    "echo": settings.debug,
}

if settings.database_url.startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False}

if settings.database_url.startswith("sqlite:///:memory:"):
    engine_options["poolclass"] = StaticPool

engine: Engine = create_engine(settings.database_url, **engine_options)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
