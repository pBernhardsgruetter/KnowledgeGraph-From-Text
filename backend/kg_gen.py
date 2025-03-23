import google.generativeai as genai
import json
from dataclasses import dataclass
from typing import List, Tuple, Dict, Any

@dataclass
class Graph:
    entities: List[str]
    relations: List[Tuple[str, str, str]]

class KGGen:
    def __init__(self, model="models/gemini-2.0-flash", temperature=0.0, api_key=None):
        """Initialize the KGGen class.

        Args:
            model (str): The model to use (e.g., "models/gemini-2.0-flash")
            temperature (float): The temperature for generation (0.0 to 1.0)
            api_key (str): The API key for authentication
        """
        if not api_key:
            raise ValueError("API key is required")
            
        # Configure the Google Generative AI library
        genai.configure(api_key=api_key)
        
        # Initialize the model
        self.model = genai.GenerativeModel(model_name=model)
        self.temperature = temperature

    def generate(self, text):
        """Generate a knowledge graph from text.

        Args:
            text (str): The input text to process

        Returns:
            dict: A dictionary containing nodes and edges of the knowledge graph
        """
        if not text:
            raise ValueError("Text input is required")

        # Construct the prompt
        prompt = f"""Extract key concepts and relationships from the following text to create a knowledge graph.
        Return the result as a JSON object with 'nodes' and 'edges' arrays.
        Each node should have 'id' and 'label' fields.
        Each edge should have 'source', 'target', and 'label' fields representing the relationship.

        Text: {text}

        Response format:
        {{
            "nodes": [
                {{"id": "1", "label": "Concept1"}},
                {{"id": "2", "label": "Concept2"}},
                ...
            ],
            "edges": [
                {{"source": "1", "target": "2", "label": "relationship"}},
                ...
            ]
        }}
        """

        # Generate response
        response = self.model.generate_content(
            prompt,
            generation_config={"temperature": self.temperature}
        )

        try:
            # Extract the JSON string from the response
            result = response.text
            # Remove markdown code block if present
            if result.startswith('```json\n'):
                result = result[8:]  # Remove ```json\n
            if result.endswith('\n```'):
                result = result[:-4]  # Remove \n```
            # Parse the JSON string
            graph_data = json.loads(result)
            
            # Validate the response format
            if not isinstance(graph_data, dict):
                raise ValueError("Response is not a dictionary")
            if "nodes" not in graph_data or "edges" not in graph_data:
                raise ValueError("Response missing required fields")
            if not isinstance(graph_data["nodes"], list) or not isinstance(graph_data["edges"], list):
                raise ValueError("Nodes and edges must be arrays")
                
            return graph_data
            
        except json.JSONDecodeError:
            raise ValueError("Failed to parse response as JSON")
        except Exception as e:
            raise ValueError(f"Failed to generate knowledge graph: {str(e)}") 