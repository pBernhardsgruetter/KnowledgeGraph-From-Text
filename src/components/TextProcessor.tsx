import React, { useState } from 'react';
import { processText } from '../services/textProcessingService';

interface ProcessingResult {
  tokens: string[];
  cooccurrences: { [key: string]: number };
}

const TextProcessor: React.FC = () => {
  const [text, setText] = useState('');
  const [windowSize, setWindowSize] = useState(4);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await processText({ text, window_size: windowSize });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Text Processor</h1>
      
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

          <div>
            <h2 className="text-xl font-semibold mb-2">Co-occurrences:</h2>
            <div className="p-4 bg-gray-100 rounded">
              <ul>
                {Object.entries(result.cooccurrences).map(([pair, count]: [string, number]) => (
                  <li key={pair}>
                    {pair}: {count}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextProcessor; 