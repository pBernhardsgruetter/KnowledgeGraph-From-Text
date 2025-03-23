import { GraphData } from '../types/graph';

interface TextAnalysisOptions {
  minWordLength?: number;
  maxWords?: number;
  stopWords?: string[];
}

interface RawEdge {
  source: string;
  target: string;
  weight: number;
  label?: string;
}

const defaultOptions: TextAnalysisOptions = {
  minWordLength: 3,
  maxWords: 100,
  stopWords: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at']
};

export class TextAnalysisService {
  private static instance: TextAnalysisService;
  private options: TextAnalysisOptions;

  private constructor(options: TextAnalysisOptions = {}) {
    this.options = { ...defaultOptions, ...options };
  }

  public static getInstance(options?: TextAnalysisOptions): TextAnalysisService {
    if (!TextAnalysisService.instance) {
      TextAnalysisService.instance = new TextAnalysisService(options);
    }
    return TextAnalysisService.instance;
  }

  private preprocessText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => 
        word.length >= this.options.minWordLength! && 
        !this.options.stopWords!.includes(word)
      );
  }

  private createGraphData(nodes: string[], edges: RawEdge[]): GraphData {
    return {
      nodes: nodes.map(node => ({
        id: node,
        label: node,
        size: 1
      })),
      edges: edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        weight: edge.weight,
        label: edge.label || `Weight: ${edge.weight}`
      })),
      links: edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        weight: edge.weight,
        label: edge.label || `Weight: ${edge.weight}`
      }))
    } as GraphData;
  }

  public analyzeCoOccurrence(text: string): GraphData {
    const words = this.preprocessText(text);
    const wordFreq = new Map<string, number>();
    const coOccurrence = new Map<string, Map<string, number>>();

    // Count word frequencies
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    // Create co-occurrence matrix
    for (let i = 0; i < words.length - 1; i++) {
      const word1 = words[i];
      const word2 = words[i + 1];
      
      if (!coOccurrence.has(word1)) {
        coOccurrence.set(word1, new Map());
      }
      if (!coOccurrence.has(word2)) {
        coOccurrence.set(word2, new Map());
      }

      coOccurrence.get(word1)!.set(word2, (coOccurrence.get(word1)!.get(word2) || 0) + 1);
      coOccurrence.get(word2)!.set(word1, (coOccurrence.get(word2)!.get(word1) || 0) + 1);
    }

    // Convert to graph data
    const nodes = Array.from(wordFreq.keys());
    const edges: RawEdge[] = [];

    coOccurrence.forEach((matrix, word1) => {
      matrix.forEach((weight, word2) => {
        if (word1 < word2) { // Avoid duplicate edges
          edges.push({ source: word1, target: word2, weight });
        }
      });
    });

    return this.createGraphData(nodes, edges);
  }

  public async analyzeSemantic(text: string): Promise<GraphData> {
    try {
      const response = await fetch('http://localhost:5000/api/generate-graph', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || 
          `Failed to generate knowledge graph: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      
      // Validate response data structure
      if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
        throw new Error('Invalid response format from knowledge graph API');
      }

      return {
        nodes: data.nodes.map((node: { id: string; label: string }) => ({
          id: node.id,
          label: node.label,
          size: 1.5,  // Slightly larger default size
          color: '#2563eb',  // Default blue color
        })),
        edges: data.edges.map((edge: { source: string; target: string; label: string }) => ({
          source: edge.source,
          target: edge.target,
          label: edge.label,
          weight: 1,
        })),
        links: data.edges.map((edge: { source: string; target: string; label: string }) => ({
          source: edge.source,
          target: edge.target,
          label: edge.label,
          weight: 1,
        }))
      };
    } catch (error) {
      console.error('Error generating knowledge graph:', error);
      throw error; // Re-throw to let the component handle the error
    }
  }

  public analyzeTopic(text: string): GraphData {
    // TODO: Implement topic modeling
    // This is a placeholder that uses co-occurrence analysis
    return this.analyzeCoOccurrence(text);
  }
} 