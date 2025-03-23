from flask import Flask, request, jsonify
from flask_cors import CORS
from kg_gen import KGGen
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

# Initialize KGGen with Gemini model
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    logger.error("GOOGLE_API_KEY environment variable is not set")
    raise ValueError("GOOGLE_API_KEY environment variable is not set")

kg = KGGen(
    model="models/gemini-2.0-flash",  # Using Gemini Flash model
    temperature=0.0,
    api_key=api_key  # Using Google API key instead of OpenAI
)

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
            
        # Generate the knowledge graph
        try:
            result = kg.generate(text)
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

        # Limit the number of nodes and edges to prevent too large responses
        max_nodes = 50
        max_edges = 100
        
        # Take only the first max_nodes nodes and max_edges edges
        nodes = data['nodes'][:max_nodes]
        edges = data['edges'][:max_edges]
        
        # Construct a more concise prompt
        prompt = f"""Analyze this knowledge graph and identify 2-3 meaningful clusters of related concepts.
        Keep the response concise and focused on the most important relationships.
        
        Graph data:
        Nodes: {json.dumps(nodes)}
        Edges: {json.dumps(edges)}

        Return ONLY a JSON object in this exact format:
        {{
            "clusters": [
                {{
                    "id": "1",
                    "label": "Main Theme",
                    "nodes": ["node1", "node2"],
                    "edges": ["edge1", "edge2"],
                    "summary": "Brief theme description",
                    "keyTerms": ["term1", "term2"],
                    "level": 0,
                    "color": "#4f46e5"
                }}
            ]
        }}
        """

        # Generate response using the LLM
        try:
            response = kg.model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.2,
                    "max_output_tokens": 1000  # Limit response size
                }
            )
        except Exception as e:
            logger.error(f"Error calling Gemini API: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return jsonify({
                'error': f'Failed to analyze clusters: {str(e)}',
                'traceback': traceback.format_exc()
            }), 500

        try:
            # Extract and parse the JSON response
            result = response.text.strip()
            
            # Clean up the response if it contains markdown code blocks
            if result.startswith('```json'):
                result = result[7:]
            if result.startswith('```'):
                result = result[3:]
            if result.endswith('```'):
                result = result[:-3]
            
            # Remove any leading/trailing whitespace
            result = result.strip()
            
            # Log the cleaned response for debugging
            logger.debug(f"Cleaned response: {result}")
            
            cluster_data = json.loads(result)
            
            # Validate the response format
            if not isinstance(cluster_data, dict) or 'clusters' not in cluster_data:
                raise ValueError("Invalid cluster analysis response format")
                
            return jsonify(cluster_data)
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse cluster analysis response: {str(e)}")
            logger.error(f"Raw response: {result}")
            # Try to extract JSON-like content if the response is malformed
            try:
                # Look for content between curly braces
                start = result.find('{')
                end = result.rfind('}') + 1
                if start >= 0 and end > start:
                    json_str = result[start:end]
                    cluster_data = json.loads(json_str)
                    return jsonify(cluster_data)
            except:
                pass
            raise ValueError("Failed to parse cluster analysis response as JSON")
            
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

        # Construct the prompt for cluster expansion
        prompt = f"""Analyze the following cluster in detail and provide a more granular view of its internal structure.
        Return the result as a JSON object with:
        - nodes: array of detailed nodes within the cluster
        - edges: array of detailed edges within the cluster
        - subclusters: array of smaller clusters (if any)

        Cluster ID: {cluster_id}
        Graph data: {graph_data}

        Response format:
        {{
            "nodes": [
                {{"id": "subnode1", "label": "Detailed Concept 1", "details": "Additional information"}},
                ...
            ],
            "edges": [
                {{"source": "subnode1", "target": "subnode2", "label": "detailed relationship"}},
                ...
            ],
            "subclusters": [
                {{
                    "id": "subcluster1",
                    "label": "Subtheme",
                    "nodes": ["subnode1", "subnode2"],
                    "summary": "Detailed description"
                }},
                ...
            ]
        }}
        """

        # Generate response using the LLM
        try:
            response = kg.model.generate_content(
                prompt,
                generation_config={"temperature": 0.2}
            )
        except Exception as e:
            logger.error(f"Error calling Gemini API: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return jsonify({
                'error': f'Failed to expand cluster: {str(e)}',
                'traceback': traceback.format_exc()
            }), 500

        try:
            # Extract and parse the JSON response
            result = response.text
            if result.startswith('```json\n'):
                result = result[8:]
            if result.endswith('\n```'):
                result = result[:-4]
            
            expansion_data = json.loads(result)
            
            # Validate the response format
            if not isinstance(expansion_data, dict):
                raise ValueError("Invalid cluster expansion response format")
                
            return jsonify(expansion_data)
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse cluster expansion response: {str(e)}")
            logger.error(f"Raw response: {result}")
            raise ValueError("Failed to parse cluster expansion response as JSON")
            
    except Exception as e:
        logger.error(f"Error in expand_cluster: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'error': f'Failed to expand cluster: {str(e)}',
            'traceback': traceback.format_exc()
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 