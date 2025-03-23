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

type LogCallback = (message: string) => void;

const defaultOptions: TextAnalysisOptions = {
  minWordLength: 3,
  maxWords: 100,
  stopWords: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at']
};

export class TextAnalysisService {
  private static instance: TextAnalysisService;
  private options: TextAnalysisOptions;
  private logCallback?: LogCallback;

  private constructor(options: TextAnalysisOptions = {}) {
    this.options = { ...defaultOptions, ...options };
  }

  public static getInstance(options?: TextAnalysisOptions): TextAnalysisService {
    if (!TextAnalysisService.instance) {
      TextAnalysisService.instance = new TextAnalysisService(options);
    }
    return TextAnalysisService.instance;
  }

  public setLogCallback(callback: LogCallback) {
    this.logCallback = callback;
  }

  private log(message: string) {
    if (this.logCallback) {
      this.logCallback(message);
    }
  }

  private preprocessText(text: string): string[] {
    this.log('Preprocessing text...');
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => 
        word.length >= this.options.minWordLength! && 
        !this.options.stopWords!.includes(word)
      );
    this.log(`Found ${words.length} valid words after preprocessing`);
    return words;
  }

  private createGraphData(nodes: string[], edges: RawEdge[]): GraphData {
    this.log(`Creating graph with ${nodes.length} nodes and ${edges.length} edges`);
    return {
      nodes: nodes.map(node => ({
        id: node,
        label: node,
        size: 1,
        keyTerms: [node]
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
    this.log('Starting co-occurrence analysis...');
    const words = this.preprocessText(text);
    const wordFreq = new Map<string, number>();
    const coOccurrence = new Map<string, Map<string, number>>();

    this.log('Calculating word frequencies...');
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    this.log('Building co-occurrence matrix...');
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

    this.log('Generating graph data...');
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
    this.log('Initializing semantic analysis...');
    try {
      this.log('Sending request to semantic analysis service...');
      const response = await fetch('http://localhost:5000/api/generate-graph', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Semantic analysis error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error,
          traceback: errorData.traceback
        });
        throw new Error(`Semantic analysis failed: ${response.status} ${response.statusText}\n${errorData.error || ''}`);
      }

      this.log('Processing semantic analysis results...');
      return await response.json();
    } catch (error) {
      this.log('Error occurred during semantic analysis');
      console.error('Error in semantic analysis:', error);
      throw error;
    }
  }

  public analyzeTopic(text: string): GraphData {
    this.log('Starting topic analysis...');
    // TODO: Implement topic modeling
    // This is a placeholder that uses co-occurrence analysis
    return this.analyzeCoOccurrence(text);
  }
} 