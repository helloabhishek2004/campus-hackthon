from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "lost-found-ai"

def test_analyze_endpoint():
    payload = {
        "itemId": "item-abc-123",
        "title": "Blue Dell Laptop Backpack",
        "description": "Left in CS department corridor 2nd floor",
        "imageUrls": ["https://example.com/test-bag.jpg"]
    }
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["itemId"] == "item-abc-123"
    assert len(data["textEmbedding"]) == 384
    assert len(data["imageEmbedding"]) == 512
    assert "suggestedCategory" in data
