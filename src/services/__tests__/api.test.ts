import { processText, getGraphStatistics } from '../api';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Service', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('processText', () => {
    const mockResponse = {
      nodes: [{ id: 'test', label: 'Test', centrality: 0.5 }],
      edges: [{ source: 'test', target: 'test2', weight: 1 }],
      statistics: { nodeCount: 1, edgeCount: 1 }
    };

    test('successfully processes text', async () => {
      (fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      );

      const result = await processText('test text', 2);
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith('/api/process-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: 'test text',
          window_size: 2
        })
      });
    });

    test('handles API errors', async () => {
      (fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request'
        })
      );

      await expect(processText('', 2)).rejects.toThrow('Bad Request');
    });

    test('handles network errors', async () => {
      (fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.reject(new Error('Network error'))
      );

      await expect(processText('test', 2)).rejects.toThrow('Network error');
    });
  });

  describe('getGraphStatistics', () => {
    const mockStats = {
      nodeCount: 10,
      edgeCount: 15,
      avgDegree: 3,
      density: 0.33
    };

    test('successfully fetches graph statistics', async () => {
      (fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStats)
        })
      );

      const result = await getGraphStatistics('test text', 2);
      expect(result).toEqual(mockStats);
      expect(fetch).toHaveBeenCalledWith('/api/graph-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: 'test text',
          window_size: 2
        })
      });
    });

    test('handles API errors', async () => {
      (fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        })
      );

      await expect(getGraphStatistics('test', 2)).rejects.toThrow('Internal Server Error');
    });
  });
}); 