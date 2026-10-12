import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "llm_provider" in data

def test_repository_validation_endpoint():
    response = client.post("/api/repository/validate", json={"repository_url": "https://github.com/fastapi/fastapi"})
    assert response.status_code == 200
    assert response.json()["valid"] is True

    response_invalid = client.post("/api/repository/validate", json={"repository_url": "invalid_url"})
    assert response_invalid.status_code == 400

def test_investigation_lifecycle_and_sub_endpoints():
    payload = {
        "repository_url": "https://github.com/fastapi/fastapi",
        "bug_report": "Test bug report describing a transaction retry error",
        "mode": "WHY"
    }
    res = client.post("/api/investigations", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "id" in data
    assert data["status"] == "started"

    inv_id = data["id"]
    
    # 1. Main status endpoint
    status_res = client.get(f"/api/investigations/{inv_id}")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["id"] == inv_id

    # 2. Events sub-endpoint
    events_res = client.get(f"/api/investigations/{inv_id}/events")
    assert events_res.status_code == 200
    assert "events" in events_res.json()

    # 3. Hypotheses sub-endpoint
    hypo_res = client.get(f"/api/investigations/{inv_id}/hypotheses")
    assert hypo_res.status_code == 200
    assert "hypotheses" in hypo_res.json()

    # 4. Evidence sub-endpoint
    ev_res = client.get(f"/api/investigations/{inv_id}/evidence")
    assert ev_res.status_code == 200

    # 5. Root Cause sub-endpoint
    rc_res = client.get(f"/api/investigations/{inv_id}/root-cause")
    assert rc_res.status_code == 200
    assert "root_cause" in rc_res.json()
