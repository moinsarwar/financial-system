import os


TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
)

if not TEST_DATABASE_URL:
    raise RuntimeError(
        "TEST_DATABASE_URL must be configured",
    )

if "test" not in TEST_DATABASE_URL.lower():
    raise RuntimeError(
        "Refusing to run tests against a database "
        "whose name does not contain 'test'",
    )

# These must be set before importing any app module.
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["ENVIRONMENT"] = "test"

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.database import get_db
from app.main import app
from app.services.seed_service import seed_demo_data


test_engine = create_engine(
    TEST_DATABASE_URL,
    pool_pre_ping=True,
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    bind=test_engine,
)


def truncate_database() -> None:
    with test_engine.begin() as connection:
        connection.execute(
            text(
                """
                TRUNCATE TABLE
                    audit_logs,
                    documents,
                    claims,
                    holdings,
                    policies,
                    applications,
                    users,
                    clients
                RESTART IDENTITY CASCADE
                """
            )
        )


@pytest.fixture(
    scope="session",
    autouse=True,
)
def migrated_database():
    alembic_config = Config(
        "alembic.ini",
    )

    alembic_config.set_main_option(
        "sqlalchemy.url",
        TEST_DATABASE_URL,
    )

    command.upgrade(
        alembic_config,
        "head",
    )

    yield

    # The database is deliberately not downgraded here.
    # It must be a dedicated disposable test database.


@pytest.fixture(autouse=True)
def clean_database(
    migrated_database,
):
    truncate_database()

    session = TestingSessionLocal()

    try:
        seed_demo_data(
            session,
            commit=True,
        )

    finally:
        session.close()

    yield

    truncate_database()


@pytest.fixture
def db_session():
    session = TestingSessionLocal()

    try:
        yield session

    finally:
        session.close()


@pytest.fixture
def api_client():
    def override_get_db():
        session = TestingSessionLocal()

        try:
            yield session
            session.commit()

        except Exception:
            session.rollback()
            raise

        finally:
            session.close()

    app.dependency_overrides[get_db] = (
        override_get_db
    )

    with TestClient(app) as client:
        yield client

    app.dependency_overrides.clear()


def get_token(
    api_client: TestClient,
    email: str,
) -> str:
    response = api_client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": "password123",
        },
    )

    assert response.status_code == 200

    return response.json()["access_token"]


@pytest.fixture
def client_token(
    api_client,
):
    return get_token(
        api_client,
        "client@finos.com",
    )


@pytest.fixture
def admin_token(
    api_client,
):
    return get_token(
        api_client,
        "ops@finos.com",
    )


@pytest.fixture
def operations_agent_token(
    api_client,
):
    return get_token(
        api_client,
        "ops_agent@finos.com",
    )


@pytest.fixture
def operations_manager_token(
    api_client,
):
    return get_token(
        api_client,
        "ops_manager@finos.com",
    )


@pytest.fixture
def claims_agent_token(
    api_client,
):
    return get_token(
        api_client,
        "claims_agent@finos.com",
    )


@pytest.fixture
def underwriter_token(
    api_client,
):
    return get_token(
        api_client,
        "underwriter@finos.com",
    )


@pytest.fixture
def compliance_token(
    api_client,
):
    return get_token(
        api_client,
        "compliance@finos.com",
    )
