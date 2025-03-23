export interface Node {
  id: string;
  label: string;
  size?: number;
  color?: string;
  cluster?: string;
  [key: string]: any;
}

export interface Edge {
  source: string;
  target: string;
  label: string;
  weight?: number;
  [key: string]: any;
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
  links?: Edge[];
} 