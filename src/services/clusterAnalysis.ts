import { GraphData, Node, Edge, ClusterNode } from '../types/graph';

interface ClusterAnalysisResult {
  nodes: ClusterNode[];
  edges: Edge[];
  clusters: Map<string, ClusterNode>;
}

export class ClusterAnalysisService {
  private static instance: ClusterAnalysisService;

  private constructor() {}

  public static getInstance(): ClusterAnalysisService {
    if (!ClusterAnalysisService.instance) {
      ClusterAnalysisService.instance = new ClusterAnalysisService();
    }
    return ClusterAnalysisService.instance;
  }

  public async analyzeClusters(graphData: GraphData): Promise<ClusterAnalysisResult> {
    try {
      // First, use the LLM to analyze the graph and identify clusters
      const response = await fetch('http://localhost:5000/api/analyze-clusters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(graphData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Cluster analysis error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error,
          traceback: errorData.traceback
        });
        throw new Error(`Cluster analysis failed: ${response.status} ${response.statusText}\n${errorData.error || ''}`);
      }

      const clusterData = await response.json();
      
      // Convert the cluster data into our internal format
      const clusters = new Map<string, ClusterNode>();
      const nodes: ClusterNode[] = graphData.nodes.map(node => ({
        ...node,
        isCluster: false,
        clusterNodes: [],
        clusterEdges: [],
        summary: '',
        keyTerms: [],
        level: 0
      }));
      const edges: Edge[] = [...graphData.edges];

      // Process each cluster
      clusterData.clusters.forEach((cluster: any) => {
        const clusterNode: ClusterNode = {
          id: `cluster-${cluster.id}`,
          label: cluster.label,
          isCluster: true,
          clusterNodes: cluster.nodes.map((nodeId: string) => 
            graphData.nodes.find(n => n.id === nodeId)
          ).filter(Boolean),
          clusterEdges: cluster.edges.map((edgeId: string) => 
            graphData.edges.find(e => `${e.source}-${e.target}` === edgeId)
          ).filter(Boolean),
          summary: cluster.summary,
          keyTerms: cluster.keyTerms,
          level: cluster.level,
          size: 2, // Larger size for cluster nodes
          color: cluster.color || '#4f46e5', // Default indigo color for clusters
        };

        clusters.set(clusterNode.id, clusterNode);
        nodes.push(clusterNode);

        // Add edges between clusters and their nodes
        clusterNode.clusterNodes.forEach(node => {
          edges.push({
            source: clusterNode.id,
            target: node.id,
            label: 'contains',
            weight: 1,
          });
        });
      });

      return { nodes, edges, clusters };
    } catch (error) {
      console.error('Error analyzing clusters:', error);
      throw error;
    }
  }

  public async expandCluster(clusterId: string, graphData: GraphData): Promise<GraphData> {
    try {
      const response = await fetch('http://localhost:5000/api/expand-cluster', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clusterId, graphData }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Cluster expansion error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error,
          traceback: errorData.traceback
        });
        throw new Error(`Cluster expansion failed: ${response.status} ${response.statusText}\n${errorData.error || ''}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error expanding cluster:', error);
      throw error;
    }
  }
} 