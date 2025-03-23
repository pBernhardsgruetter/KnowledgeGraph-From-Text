import pytest
import os
from kg_gen import KGGen
from dotenv import load_dotenv
import networkx as nx
from ..kg_gen import KnowledgeGraphGenerator

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

@pytest.fixture
def kg_generator():
    return KnowledgeGraphGenerator()

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

def test_edge_weight_calculation():
    generator = KnowledgeGraphGenerator()
    cooccurrences = [("word1", "word2", 3), ("word2", "word3", 2)]
    graph = generator.create_weighted_graph(cooccurrences)
    
    assert graph.has_edge("word1", "word2")
    assert graph.has_edge("word2", "word3")
    assert graph.edges[("word1", "word2")]["weight"] == 3
    assert graph.edges[("word2", "word3")]["weight"] == 2

def test_betweenness_centrality():
    generator = KnowledgeGraphGenerator()
    # Create a simple graph where node2 is a bridge between two clusters
    edges = [
        ("node1", "node2", 1),
        ("node2", "node3", 1),
        ("node3", "node4", 1),
        ("node2", "node5", 1)
    ]
    graph = generator.create_weighted_graph(edges)
    centrality = generator.calculate_betweenness_centrality(graph)
    
    # node2 should have the highest centrality as it's the bridge
    assert centrality["node2"] == max(centrality.values())

def test_graph_statistics():
    generator = KnowledgeGraphGenerator()
    edges = [("A", "B", 2), ("B", "C", 1), ("C", "A", 1)]
    graph = generator.create_weighted_graph(edges)
    stats = generator.calculate_graph_statistics(graph)
    
    assert "node_count" in stats
    assert "edge_count" in stats
    assert "avg_degree" in stats
    assert stats["node_count"] == 3
    assert stats["edge_count"] == 3

def test_empty_graph():
    generator = KnowledgeGraphGenerator()
    graph = generator.create_weighted_graph([])
    
    assert len(graph.nodes) == 0
    assert len(graph.edges) == 0
    
    stats = generator.calculate_graph_statistics(graph)
    assert stats["node_count"] == 0
    assert stats["edge_count"] == 0
    assert stats["avg_degree"] == 0

def test_weight_normalization():
    generator = KnowledgeGraphGenerator()
    edges = [("A", "B", 10), ("B", "C", 5), ("C", "D", 1)]
    graph = generator.create_weighted_graph(edges)
    
    # Check if weights are normalized between 0 and 1
    weights = [data["weight"] for _, _, data in graph.edges(data=True)]
    assert all(0 <= w <= 1 for w in weights)
    assert max(weights) == 1.0  # Highest weight should be normalized to 1