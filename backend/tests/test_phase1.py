import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.core.database import init_db, AsyncSessionLocal
from app.services.seed_data import seed_initial_data
from main import app

@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    await init_db()
    async with AsyncSessionLocal() as session:
        await seed_initial_data(session)

@pytest.mark.asyncio
async def test_health_and_root():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"

        root_res = await ac.get("/")
        assert root_res.status_code == 200
        assert root_res.json()["platform"] == "PULSEORA"

@pytest.mark.asyncio
async def test_auth_login_demo_patient():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        login_res = await ac.post("/api/v1/auth/login", json={
            "email": "ramesh@pulseora.health",
            "password": "Pulseora@123"
        })
        assert login_res.status_code == 200
        data = login_res.json()
        assert "access_token" in data
        assert data["user"]["role"] == "patient"
        assert data["patient_id"] is not None

@pytest.mark.asyncio
async def test_auth_login_doctor():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        login_res = await ac.post("/api/v1/auth/login", json={
            "email": "dr.shenoy@pulseora.health",
            "password": "Pulseora@123"
        })
        assert login_res.status_code == 200
        data = login_res.json()
        assert data["user"]["role"] == "doctor"

@pytest.mark.asyncio
async def test_auth_invalid_credentials():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/v1/auth/login", json={
            "email": "ramesh@pulseora.health",
            "password": "WrongPassword!"
        })
        assert res.status_code == 401

@pytest.mark.asyncio
async def test_patient_list_and_access_control():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Doctor login
        doc_login = await ac.post("/api/v1/auth/login", json={
            "email": "dr.shenoy@pulseora.health",
            "password": "Pulseora@123"
        })
        doc_token = doc_login.json()["access_token"]
        headers_doc = {"Authorization": f"Bearer {doc_token}"}

        # Doctor lists all patients
        pats_res = await ac.get("/api/v1/patients/", headers=headers_doc)
        assert pats_res.status_code == 200
        pats = pats_res.json()
        assert len(pats) == 5  # 5 demo patients

        # 2. Patient login (Ramesh)
        pat_login = await ac.post("/api/v1/auth/login", json={
            "email": "ramesh@pulseora.health",
            "password": "Pulseora@123"
        })
        pat_token = pat_login.json()["access_token"]
        pat_id = pat_login.json()["patient_id"]
        headers_pat = {"Authorization": f"Bearer {pat_token}"}

        # Patient summary
        summary_res = await ac.get(f"/api/v1/patients/{pat_id}/summary", headers=headers_pat)
        assert summary_res.status_code == 200
        summary = summary_res.json()
        assert summary["patient"]["full_name"] == "Ramesh Kumar"
        assert summary["latest_vitals"] is not None
        assert "heart_rate" in summary["latest_vitals"]
        assert len(summary["baselines"]) > 0
