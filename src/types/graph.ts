export interface Node {
  id: string;
  label: string;
  size?: number;
  color?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  centrality?: number;
  group?: string;
}

export interface Edge {
  source: string | Node;
  target: string | Node;
  label?: string;
  weight?: number;
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
  links?: Edge[];  // For compatibility with ForceGraph2D
}

export interface NetworkMetrics {
  modularity: number;
  influenceDistribution: number;
  structureType: 'Biased' | 'Balanced' | 'Dispersed';
}

export interface ClusterNode extends Node {
  isCluster: boolean;
  clusterNodes: Node[];
  clusterEdges: Edge[];
  summary: string;
  keyTerms: string[];
  level: number;
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