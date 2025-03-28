export interface Node {
  id: string;
  label: string;
  summary?: string;
  keyTerms: string[];
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  index?: number;
  weight?: number;
  centrality?: number;
  group?: string;
  size?: number;
  color?: string;
  degree?: number;
  betweenness?: number;
}

export interface Edge {
  source: string | Node;
  target: string | Node;
  label?: string;
  weight?: number;
  id?: string;
}

export interface GraphMetrics {
  node_count: number;
  density: number;
  average_clustering: number;
  average_degree: number;
  connected_components: number;
  largest_component_ratio: number;
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
  links?: Edge[];
  metrics?: GraphMetrics;
}

export interface ProcessedGraphData {
  nodes: (Node | ClusterNode)[];
  links: {
    source: Node;
    target: Node;
    label?: string;
    weight?: number;
    id?: string;
  }[];
}

export interface NetworkMetrics {
  density: number;
  averageCentrality: number;
  centrality: { [key: string]: number };
  modularity: number;
  influenceDistribution: number;
  structureType: 'Biased' | 'Balanced' | 'Dispersed';
}

export interface ClusterNode extends Node {
  isCluster: boolean;
  clusterNodes: Node[];
  clusterEdges: Edge[];
  level?: number;
  children?: ClusterNode[];
  color?: string;
}

export interface ClusterEdge extends Omit<Edge, 'source' | 'target'> {
  source: string | ClusterNode;
  target: string | ClusterNode;
}

export interface ClusterGraphData extends Omit<GraphData, 'edges'> {
  nodes: ClusterNode[];
  edges: ClusterEdge[];
  clusters: Map<string, ClusterNode>;
} 