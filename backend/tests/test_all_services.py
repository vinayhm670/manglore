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
async def test_vitals_and_baselines_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Login Ramesh
        login_res = await ac.post("/api/v1/auth/login", json={
            "email": "ramesh@pulseora.health",
            "password": "Pulseora@123"
        })
        pat_id = login_res.json()["patient_id"]

        # 1. Fetch baselines
        base_res = await ac.get(f"/api/v1/baselines/{pat_id}")
        assert base_res.status_code == 200
        baselines = base_res.json()
        assert len(baselines) > 0

        # 2. Fetch vitals
        vitals_res = await ac.get(f"/api/v1/vitals/{pat_id}?range_filter=24h")
        assert vitals_res.status_code == 200
        vitals = vitals_res.json()
        assert len(vitals) > 0

@pytest.mark.asyncio
async def test_deterioration_and_anomaly_detection():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        login_res = await ac.post("/api/v1/auth/login", json={
            "email": "ramesh@pulseora.health",
            "password": "Pulseora@123"
        })
        pat_id = login_res.json()["patient_id"]

        # Trigger deterioration simulation
        det_res = await ac.post(f"/api/v1/simulator/deteriorate/{pat_id}")
        assert det_res.status_code == 200
        data = det_res.json()
        assert "risk_assessment" in data["data"]
        assert "score" in data["data"]["risk_assessment"]
        assert "status" in data["data"]["risk_assessment"]

@pytest.mark.asyncio
async def test_companion_multilingual_and_emergency():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        login_res = await ac.post("/api/v1/auth/login", json={
            "email": "ramesh@pulseora.health",
            "password": "Pulseora@123"
        })
        pat_id = login_res.json()["patient_id"]

        # 1. Normal question in English
        chat1 = await ac.post("/api/v1/companion/chat", json={
            "content": "How is my heart rate today?",
            "patient_id": pat_id
        })
        assert chat1.status_code == 200
        assert "heart" in chat1.json()["response"].lower()
        assert not chat1.json()["is_emergency"]

        # 2. Kannada question
        chat_kn = await ac.post("/api/v1/companion/chat", json={
            "content": "ನನ್ನ ಆರೋಗ್ಯ ಹೇಗಿದೆ?",
            "patient_id": pat_id
        })
        assert chat_kn.status_code == 200
        assert chat_kn.json()["detected_language"] in ["kn", "tcy"]

        # 3. Emergency red-flag symptom
        chat_em = await ac.post("/api/v1/companion/chat", json={
            "content": "I have sudden severe chest pain and cannot breathe",
            "patient_id": pat_id
        })
        assert chat_em.status_code == 200
        assert chat_em.json()["is_emergency"]
        assert "108" in chat_em.json()["response"] or "112" in chat_em.json()["response"]

@pytest.mark.asyncio
async def test_clinical_pdf_generation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        login_res = await ac.post("/api/v1/auth/login", json={
            "email": "ramesh@pulseora.health",
            "password": "Pulseora@123"
        })
        pat_id = login_res.json()["patient_id"]

        pdf_res = await ac.get(f"/api/v1/reports/pdf/{pat_id}")
        assert pdf_res.status_code == 200
        assert pdf_res.headers["content-type"] == "application/pdf"
        assert len(pdf_res.content) > 1000  # PDF generated with tables and disclaimer
