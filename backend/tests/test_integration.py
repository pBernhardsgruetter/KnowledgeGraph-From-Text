import pytest
from app import app
import json

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_process_text_endpoint(client):
    test_data = {
        "text": "The quick brown fox jumps over the lazy dog.",
        "window_size": 2
    }
    response = client.post('/api/process-text',
                         data=json.dumps(test_data),
                         content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "nodes" in data
    assert "edges" in data
    assert "statistics" in data
    
    # Check if common words are present in nodes
    node_words = [node["id"] for node in data["nodes"]]
    assert "quick" in node_words
    assert "fox" in node_words
    
    # Check if edges exist between adjacent words
    edge_pairs = [(edge["source"], edge["target"]) for edge in data["edges"]]
    assert any(("quick", "brown") in edge_pairs or ("brown", "quick") in edge_pairs)

def test_invalid_input(client):
    # Test empty text
    test_data = {
        "text": "",
        "window_size": 2
    }
    response = client.post('/api/process-text',
                         data=json.dumps(test_data),
                         content_type='application/json')
    assert response.status_code == 400
    
    # Test missing required field
    test_data = {
        "window_size": 2
    }
    response = client.post('/api/process-text',
                         data=json.dumps(test_data),
                         content_type='application/json')
    assert response.status_code == 400

def test_large_text_processing(client):
    # Test with a larger text to ensure proper processing
    large_text = " ".join(["word" + str(i) for i in range(100)])
    test_data = {
        "text": large_text,
        "window_size": 3
    }
    response = client.post('/api/process-text',
                         data=json.dumps(test_data),
                         content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data["nodes"]) > 0
    assert len(data["edges"]) > 0

def test_graph_statistics_endpoint(client):
    test_data = {
        "text": "This is a test sentence for graph statistics.",
        "window_size": 2
    }
    response = client.post('/api/graph-stats',
                         data=json.dumps(test_data),
                         content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "node_count" in data
    assert "edge_count" in data
    assert "avg_degree" in data
    assert "density" in data
    assert data["node_count"] > 0 