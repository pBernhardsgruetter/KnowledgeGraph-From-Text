import pytest
import os
from kg_gen import KGGen
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

@pytest.fixture
def kg_gen():
    """Create a KGGen instance for testing"""
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        pytest.skip("GOOGLE_API_KEY not found in environment variables")
    
    return KGGen(
        model="models/gemini-2.0-flash",
        temperature=0.0,  # Use 0 for deterministic results
        api_key=api_key
    )

def test_simple_relationship_extraction(kg_gen):
    """Test extraction of simple relationships from text"""
    text = "Python is a programming language."
    result = kg_gen.generate(text)
    
    assert isinstance(result, dict)
    assert "nodes" in result
    assert "edges" in result
    assert len(result["nodes"]) > 0
    assert len(result["edges"]) > 0
    
    # Check for expected concepts (case-insensitive)
    node_labels = [node["label"].lower() for node in result["nodes"]]
    assert "python" in node_labels
    assert "programming language" in node_labels

def test_complex_relationship_extraction(kg_gen):
    """Test extraction of complex relationships from text"""
    text = "The sun is a star that provides light and heat to Earth through nuclear fusion."
    result = kg_gen.generate(text)
    
    assert isinstance(result, dict)
    assert "nodes" in result
    assert "edges" in result
    assert len(result["nodes"]) > 0
    assert len(result["edges"]) > 0
    
    # Check for expected concepts (case-insensitive)
    node_labels = [node["label"].lower() for node in result["nodes"]]
    assert "sun" in node_labels
    assert any("earth" in label for label in node_labels)

def test_empty_text(kg_gen):
    """Test handling of empty text input"""
    with pytest.raises(ValueError, match="Text input is required"):
        kg_gen.generate("")

def test_long_text(kg_gen):
    """Test extraction from longer text"""
    text = """
    Artificial Intelligence (AI) is transforming various industries.
    Machine learning, a subset of AI, uses data to improve performance.
    Deep learning models can process complex patterns in large datasets.
    """
    result = kg_gen.generate(text)
    
    assert isinstance(result, dict)
    assert "nodes" in result
    assert "edges" in result
    assert len(result["nodes"]) > 0
    assert len(result["edges"]) > 0
    
    # Check for expected concepts (case-insensitive)
    node_labels = [node["label"].lower() for node in result["nodes"]]
    assert any("artificial intelligence" in label or "ai" in label for label in node_labels)
    assert any("machine learning" in label for label in node_labels)

def test_technical_text(kg_gen):
    """Test extraction from technical text"""
    text = "Neural networks are deep learning models that use layers of interconnected nodes to process data."
    result = kg_gen.generate(text)
    
    assert isinstance(result, dict)
    assert "nodes" in result
    assert "edges" in result
    assert len(result["nodes"]) > 0
    assert len(result["edges"]) > 0
    
    # Check for expected concepts (case-insensitive)
    node_labels = [node["label"].lower() for node in result["nodes"]]
    assert "neural networks" in node_labels or any("neural" in label for label in node_labels)
    assert any("deep learning" in label for label in node_labels)

def test_multiple_relationships(kg_gen):
    """Test extraction of multiple relationships"""
    text = "Dogs are mammals that can be trained as pets. Cats are also mammals that make popular pets."
    result = kg_gen.generate(text)
    
    assert isinstance(result, dict)
    assert "nodes" in result
    assert "edges" in result
    assert len(result["nodes"]) > 0
    assert len(result["edges"]) > 0
    
    # Check for expected concepts (case-insensitive)
    node_labels = [node["label"].lower() for node in result["nodes"]]
    assert "dogs" in node_labels or "dog" in node_labels
    assert "cats" in node_labels or "cat" in node_labels
    assert any("mammals" in label or "mammal" in label for label in node_labels)
    assert any("pets" in label or "pet" in label for label in node_labels)