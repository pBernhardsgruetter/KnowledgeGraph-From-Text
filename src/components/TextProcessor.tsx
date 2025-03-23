import React, { useState } from 'react';
import { processText } from '../services/textProcessingService';
import GraphVisualization from './GraphVisualization';
import { GraphData, Node, Edge } from '../types/graph';

interface TextProcessingRequest {
  text: string;
  window_size?: number;
}

interface TextProcessingResponse {
  tokens: string[];
  cooccurrences: Record<string, number>;
  graph: {
    nodes: Array<{
      id: string;
      label: string;
      degree: number;
    }>;
    edges: Array<{
      source: string;
      target: string;
      weight: number;
      log_weight: number;
      raw_count: number;
    }>;
  };
}

interface ProcessingResult {
  tokens: string[];
  cooccurrences: Record<string, number>;
  graph: GraphData;
}

const TextProcessor: React.FC = () => {
  const [text, setText] = useState('');
  const [windowSize, setWindowSize] = useState(5);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcessing = async (request: TextProcessingRequest) => {
    try {
      const response = await processText(request);
      // Convert the response to match our GraphData type
      const processedResult: ProcessingResult = {
        tokens: response.tokens,
        cooccurrences: response.cooccurrences,
        graph: {
          nodes: response.graph.nodes.map(node => ({
            id: node.id,
            label: node.label,
            degree: node.degree,
            keyTerms: [node.label], // Using label as the only key term
            summary: node.label,
            weight: 1, // Default weight
            centrality: 0, // Default centrality
            size: 1 // Default size
          })),
          edges: response.graph.edges.map(edge => ({
            source: edge.source,
            target: edge.target,
            weight: edge.weight,
            label: `Weight: ${edge.weight}`
          }))
        }
      };
      setResult(processedResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during processing');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await handleProcessing({ text, window_size: windowSize });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (minWeight: number) => {
    // Handle filter change logic
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Text Network Analysis</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2">
                Text to analyze:
                <textarea
                  className="w-full p-2 border rounded"
                  rows={5}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter text to analyze..."
                />
              </label>
            </div>
            
            <div>
              <label className="block mb-2">
                Window size:
                <input
                  type="number"
                  className="w-24 p-2 border rounded ml-2"
                  value={windowSize}
                  onChange={(e) => setWindowSize(Number(e.target.value))}
                  min={1}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              {loading ? 'Processing...' : 'Process Text'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-4 space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Processed Tokens:</h2>
                <div className="p-4 bg-gray-100 rounded">
                  {result.tokens.join(', ')}
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          {result?.graph && (
            <GraphVisualization
              data={{
                ...result.graph,
                metrics: {
                  node_count: result.graph.nodes.length,
                  density: 0,
                  average_clustering: 0,
                  average_degree: 0,
                  connected_components: 0,
                  largest_component_ratio: 0
                }
              }}
              onFilterChange={handleFilterChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TextProcessor; 