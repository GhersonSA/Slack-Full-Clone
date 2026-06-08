from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine

from app.api.v1.endpoints import realtime as realtime_module
from app.db import session as session_module
from app.main import app


@pytest.fixture
def client(tmp_path: pytest.TempPathFactory) -> Generator[TestClient, None, None]:
    database_file = tmp_path / 'test.db'
    test_engine = create_engine(
        f'sqlite:///{database_file}',
        connect_args={'check_same_thread': False},
    )

    session_module.engine = test_engine
    realtime_module.engine = test_engine

    def override_get_session() -> Generator[Session, None, None]:
        with Session(test_engine) as session:
            yield session

    app.dependency_overrides[session_module.get_session] = override_get_session

    SQLModel.metadata.create_all(test_engine)

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    SQLModel.metadata.drop_all(test_engine)
    test_engine.dispose()
