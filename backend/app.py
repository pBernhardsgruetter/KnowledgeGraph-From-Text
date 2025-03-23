from flask import Flask, request, jsonify
from flask_cors import CORS
from kg_gen import KGGen
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize KGGen with Gemini model
kg = KGGen(
    model="models/gemini-2.0-flash",  # Using Gemini Flash model
    temperature=0.0,
    api_key=os.getenv("GOOGLE_API_KEY")  # Using Google API key instead of OpenAI
)

@app.route('/api/generate-graph', methods=['POST'])
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
            return jsonify({'error': 'Failed to generate knowledge graph: ' + str(e)}), 500
        
    except Exception as e:
        return jsonify({'error': 'Invalid response format'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 