from flask import Flask, request, jsonify
from flask_cors import CORS
from kg_gen import KGGen
from text_processor import TextProcessor
from services.graph_service import GraphService
import os
from dotenv import load_dotenv
import json
import logging
import traceback
import time
from functools import wraps

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Rate limiting configuration
RATE_LIMIT = 60  # requests per minute
request_timestamps = []

def rate_limit(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_time = time.time()
        # Remove timestamps older than 1 minute
        request_timestamps[:] = [ts for ts in request_timestamps if current_time - ts < 60]
        
        if len(request_timestamps) >= RATE_LIMIT:
            logger.warning("Rate limit exceeded")
            return jsonify({
                'error': 'Rate limit exceeded. Please wait a moment before trying again.',
                'retry_after': 60 - (current_time - request_timestamps[0])
            }), 429
            
        request_timestamps.append(current_time)
        return f(*args, **kwargs)
    return decorated_function

# Initialize services
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    logger.error("GOOGLE_API_KEY environment variable is not set")
    raise ValueError("GOOGLE_API_KEY environment variable is not set")

kg = KGGen(
    model="gemini/gemini-2.0-flash",
    temperature=0.0,
    api_key=api_key
)

# Initialize text processor and graph service
text_processor = TextProcessor()
graph_service = GraphService()

@app.route('/api/process-text', methods=['POST'])
@rate_limit
def process_text():
    """
    Process input text and return tokens, co-occurrences, and graph data.
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Text is required'}), 400
            
        text = data.get('text', '')
        window_size = data.get('window_size', 4)
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
            
        # Update window size if different from default
        if window_size != text_processor.window_size:
            text_processor.window_size = window_size
            
        # Process text
        result = text_processor.process(text)
        
        # Build graph
        graph_data = graph_service.build_graph(
            tokens=result['tokens'],
            cooccurrences=result['cooccurrences']
        )
        
        return jsonify({
            **result,
            'graph': graph_data
        })
        
    except Exception as e:
        logger.error(f"Error processing text: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/filter-edges', methods=['POST'])
@rate_limit
def filter_edges():
    """
    Filter graph edges based on minimum weight threshold.
    """
    try:
        data = request.get_json()
        min_weight = data.get('min_weight', 0.0)
        
        filtered_data = graph_service.filter_edges_by_weight(min_weight)
        return jsonify(filtered_data)
        
    except Exception as e:
        logger.error(f"Error filtering edges: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-graph', methods=['POST'])
@rate_limit
def generate_graph():
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Text is required'}), 400
            
        text = data.get('text', '')
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        # Preprocess text before generating graph
        processed_tokens = text_processor.process_for_topic_modeling(text)
        processed_text = ' '.join(processed_tokens)
            
        # Generate the knowledge graph using KG-Gen
        try:
            kg_result = kg.generate(
                input_data=processed_text,
                context="Extract key concepts and relationships"
            )
            
            # Convert KG-Gen output to our graph format
            nodes = []
            edges = []
            
            # Create nodes from entities
            # KG-Gen returns a set of entities
            for entity in kg_result.entities:
                node = {
                    'id': entity,
                    'label': entity,
                    'keyTerms': [term['term'] for term in text_processor.extract_key_terms(entity, max_terms=5)]
                }
                nodes.append(node)
            
            # Create edges from relations
            # KG-Gen returns a set of (source, relation_type, target) tuples
            for i, relation in enumerate(kg_result.relations):
                source, relation_type, target = relation
                edge = {
                    'id': f'e{i}',
                    'source': source,
                    'target': target,
                    'label': relation_type
                }
                edges.append(edge)
            
            result = {
                'nodes': nodes,
                'edges': edges
            }
                    
            return jsonify(result)
            
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            logger.error(f"Error generating graph: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return jsonify({'error': 'Failed to generate knowledge graph: ' + str(e)}), 500
        
    except Exception as e:
        logger.error(f"Unexpected error in generate_graph: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Invalid response format'}), 500

@app.route('/api/analyze-clusters', methods=['POST'])
@rate_limit
def analyze_clusters():
    try:
        data = request.get_json()
        
        if not data or 'nodes' not in data or 'edges' not in data:
            return jsonify({'error': 'Graph data is required'}), 400

        # Process nodes to extract key terms
        for node in data['nodes']:
            if 'label' in node and not node.get('keyTerms'):
                terms = text_processor.extract_key_terms(node['label'], max_terms=5)
                node['keyTerms'] = [term['term'] for term in terms]

        # Limit the number of nodes and edges
        max_nodes = 50
        max_edges = 100
        nodes = data['nodes'][:max_nodes]
        edges = data['edges'][:max_edges]
        
        # Generate the cluster analysis using KGGen
        try:
            cluster_result = kg.generate(
                input_data=json.dumps({"nodes": nodes, "edges": edges}),
                context="Analyze this graph data and identify 2-3 meaningful clusters of related concepts"
            )
            
            # Convert to expected cluster format
            clusters = []
            for i, (entity, relations) in enumerate(zip(cluster_result.get('entities', []), cluster_result.get('relations', []))):
                cluster = {
                    "id": str(i + 1),
                    "label": entity,
                    "nodes": [r[0] for r in relations if r[0] in [n['id'] for n in nodes]],
                    "edges": [e['id'] for e in edges if e['source'] in cluster['nodes'] and e['target'] in cluster['nodes']],
                    "summary": f"Cluster of concepts related to {entity}",
                    "keyTerms": [r[2] for r in relations if isinstance(r[2], str)][:5],
                    "level": 0,
                    "color": "#4f46e5"
                }
                clusters.append(cluster)
            
            return jsonify({"clusters": clusters})
            
        except Exception as e:
            logger.error(f"Error in cluster analysis: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return jsonify({'error': str(e)}), 500
            
    except Exception as e:
        logger.error(f"Error in analyze_clusters: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'error': f'Failed to analyze clusters: {str(e)}',
            'traceback': traceback.format_exc()
        }), 500

@app.route('/api/expand-cluster', methods=['POST'])
@rate_limit
def expand_cluster():
    try:
        data = request.get_json()
        
        if not data or 'clusterId' not in data or 'graphData' not in data:
            return jsonify({'error': 'Cluster ID and graph data are required'}), 400

        cluster_id = data['clusterId']
        graph_data = data['graphData']

        prompt = f"""Given this cluster from a knowledge graph, expand it into more detailed nodes and edges.
        Return ONLY a JSON object with the expanded nodes and edges in this exact format:
        {{
            "nodes": [
                {{"id": "detail1", "label": "Detailed Concept 1"}},
                {{"id": "detail2", "label": "Detailed Concept 2"}}
            ],
            "edges": [
                {{"source": "detail1", "target": "detail2", "label": "detailed relationship"}}
            ]
        }}

        Cluster ID: {cluster_id}
        Original graph: {json.dumps(graph_data)}
        """

        try:
            response = kg.model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.2,
                    "max_output_tokens": 1000
                }
            )
            
            result = response.text.strip()
            if result.startswith('```json'):
                result = result[7:]
            if result.startswith('```'):
                result = result[3:]
            if result.endswith('```'):
                result = result[:-3]
            result = result.strip()
            
            expanded_data = json.loads(result)
            
            # Process expanded nodes to extract key terms
            if 'nodes' in expanded_data:
                for node in expanded_data['nodes']:
                    if 'label' in node:
                        terms = text_processor.extract_key_terms(node['label'], max_terms=5)
                        node['keyTerms'] = [term['term'] for term in terms]
            
            if not isinstance(expanded_data, dict) or 'nodes' not in expanded_data or 'edges' not in expanded_data:
                raise ValueError("Invalid expansion response format")
            
            return jsonify(expanded_data)
            
        except Exception as e:
            logger.error(f"Error expanding cluster: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return jsonify({
                'error': f'Failed to expand cluster: {str(e)}',
                'traceback': traceback.format_exc()
            }), 500
            
    except Exception as e:
        logger.error(f"Error in expand_cluster: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'error': f'Failed to expand cluster: {str(e)}',
            'traceback': traceback.format_exc()
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 