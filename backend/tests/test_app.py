import pytest
from app import app
import json
from unittest.mock import patch, MagicMock
import os
from dotenv import load_dotenv

# Load environment variables for integration tests
load_dotenv()

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

# Unit Tests (with mocks)

def test_generate_graph_endpoint_empty_text(client):
    response = client.post('/api/generate-graph',
                          json={'text': ''})
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert data['error'] == 'Text is required'

def test_generate_graph_endpoint_missing_text(client):
    response = client.post('/api/generate-graph',
                          json={})
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert data['error'] == 'Text is required'

def test_generate_graph_endpoint_api_error(client):
    with patch('kg_gen.KGGen.generate') as mock_generate:
        mock_generate.side_effect = Exception("Failed to generate knowledge graph: API Error")
        
        response = client.post('/api/generate-graph',
                             json={'text': 'Test text'})
        
        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'error' in data
        assert 'Failed to generate knowledge graph' in data['error']

def test_generate_graph_endpoint_invalid_response(client):
    with patch('kg_gen.KGGen.generate') as mock_generate:
        mock_generate.side_effect = ValueError("Invalid response format")
        
        response = client.post('/api/generate-graph',
                             json={'text': 'Test text'})
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'Invalid response format' in data['error']

# Integration Tests (real API calls)

@pytest.mark.integration
def test_generate_graph_endpoint_simple_text_integration(client):
    """Integration test with a simple text input"""
    response = client.post('/api/generate-graph',
                          json={'text': 'Python is a programming language.'})
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Check response structure
    assert 'nodes' in data
    assert 'edges' in data
    
    # Check nodes
    assert len(data['nodes']) >= 2  # Should have at least Python and Programming Language
    assert all('id' in node and 'label' in node for node in data['nodes'])
    assert any(node['label'].lower() == 'python' for node in data['nodes'])
    assert any('programming' in node['label'].lower() for node in data['nodes'])
    
    # Check edges
    assert len(data['edges']) >= 1
    assert all('source' in edge and 'target' in edge and 'label' in edge 
              for edge in data['edges'])

@pytest.mark.integration
def test_generate_graph_endpoint_complex_text_integration(client):
    """Integration test with more complex text"""
    text = """
    Machine Learning is a subset of Artificial Intelligence that uses data to make predictions.
    Deep Learning is a type of Machine Learning based on neural networks.
    """
    
    response = client.post('/api/generate-graph', json={'text': text})
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Check response structure
    assert 'nodes' in data
    assert 'edges' in data
    
    # Check nodes - should identify key concepts
    assert len(data['nodes']) >= 4  # ML, AI, Deep Learning, Neural Networks
    assert all('id' in node and 'label' in node for node in data['nodes'])
    
    # Verify key concepts are present
    node_labels = [node['label'].lower() for node in data['nodes']]
    assert any('machine learning' in label for label in node_labels)
    assert any('artificial intelligence' in label for label in node_labels)
    assert any('deep learning' in label for label in node_labels)
    
    # Check edges
    assert len(data['edges']) >= 3  # Should have multiple relationships
    assert all('source' in edge and 'target' in edge and 'label' in edge 
              for edge in data['edges'])

@pytest.mark.integration
def test_generate_graph_endpoint_technical_text_integration(client):
    """Integration test with technical content"""
    text = """
    Neural networks are deep learning models that use layers of interconnected nodes to process data.
    Convolutional Neural Networks (CNNs) are specialized for image processing tasks.
    """
    
    response = client.post('/api/generate-graph', json={'text': text})
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Check structure
    assert 'nodes' in data
    assert 'edges' in data
    
    # Verify technical concepts
    node_labels = [node['label'].lower() for node in data['nodes']]
    assert any('neural network' in label for label in node_labels)
    assert any('deep learning' in label for label in node_labels)
    assert any('cnn' in label or 'convolutional' in label for label in node_labels)
    
    # Check relationships
    assert len(data['edges']) >= 2
    assert all('source' in edge and 'target' in edge and 'label' in edge 
              for edge in data['edges']) 