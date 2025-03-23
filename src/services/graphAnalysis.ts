import { Node, Edge, GraphData, NetworkMetrics } from '../types/graph';

export class GraphAnalysisService {
  private static instance: GraphAnalysisService;

  private constructor() {}

  public static getInstance(): GraphAnalysisService {
    if (!GraphAnalysisService.instance) {
      GraphAnalysisService.instance = new GraphAnalysisService();
    }
    return GraphAnalysisService.instance;
  }

  /**
   * Calculate size of node based on its connections
   */
  private calculateNodeSize(nodeId: string, edges: Edge[]): number {
    const connections = edges.filter(
      edge => edge.source === nodeId || edge.target === nodeId
    );
    // Base size is 1, increase by 0.5 for each connection, max size is 5
    return Math.min(1 + (connections.length * 0.5), 5);
  }

  /**
   * Calculate node centrality (importance in the network)
   */
  private calculateCentrality(nodeId: string, edges: Edge[]): number {
    const directConnections = edges.filter(
      edge => edge.source === nodeId || edge.target === nodeId
    ).length;

    // Get indirect connections (nodes connected to direct connections)
    const connectedNodes = edges
      .filter(edge => edge.source === nodeId || edge.target === nodeId)
      .map(edge => edge.source === nodeId ? edge.target : edge.source);

    const indirectConnections = edges
      .filter(edge => 
        !connectedNodes.includes(edge.source as string) && 
        !connectedNodes.includes(edge.target as string) &&
        edge.source !== nodeId &&
        edge.target !== nodeId
      ).length;

    // Weighted sum of direct and indirect connections
    return (directConnections * 1.0 + indirectConnections * 0.5) / edges.length;
  }

  /**
   * Calculate modularity of the network
   */
  private calculateModularity(nodes: Node[], edges: Edge[]): number {
    // Simple modularity calculation based on clustering coefficient
    const totalPossibleConnections = (nodes.length * (nodes.length - 1)) / 2;
    const actualConnections = edges.length;
    return actualConnections / totalPossibleConnections;
  }

  /**
   * Calculate influence distribution in the network
   */
  private calculateInfluence(nodes: Node[], edges: Edge[]): number {
    const nodeDegrees = nodes.map(node => ({
      id: node.id,
      degree: edges.filter(edge => edge.source === node.id || edge.target === node.id).length
    }));

    // Calculate standard deviation of degrees
    const avgDegree = nodeDegrees.reduce((sum, node) => sum + node.degree, 0) / nodes.length;
    const variance = nodeDegrees.reduce((sum, node) => sum + Math.pow(node.degree - avgDegree, 2), 0) / nodes.length;
    return Math.sqrt(variance) / avgDegree; // Normalized standard deviation
  }

  /**
   * Determine the structure type of the network
   */
  private determineStructureType(nodes: Node[], edges: Edge[]): 'Biased' | 'Balanced' | 'Dispersed' {
    const influence = this.calculateInfluence(nodes, edges);
    const modularity = this.calculateModularity(nodes, edges);

    if (influence > 0.7) return 'Biased';
    if (influence > 0.3) return 'Balanced';
    return 'Dispersed';
  }

  /**
   * Calculate all metrics for the graph
   */
  public calculateNetworkMetrics(nodes: Node[], edges: Edge[]): NetworkMetrics {
    return {
      modularity: this.calculateModularity(nodes, edges),
      influenceDistribution: this.calculateInfluence(nodes, edges),
      structureType: this.determineStructureType(nodes, edges)
    };
  }

  /**
   * Enhance nodes with calculated metrics
   */
  public enhanceNodes(nodes: Node[], edges: Edge[]): Node[] {
    return nodes.map(node => ({
      ...node,
      size: this.calculateNodeSize(node.id, edges),
      centrality: this.calculateCentrality(node.id, edges)
    }));
  }

  /**
   * Process graph data with all enhancements
   */
  public processGraph(graphData: GraphData): {
    enhancedData: GraphData;
    metrics: NetworkMetrics;
  } {
    const enhancedNodes = this.enhanceNodes(graphData.nodes, graphData.edges);
    const metrics = this.calculateNetworkMetrics(graphData.nodes, graphData.edges);

    return {
      enhancedData: {
        nodes: enhancedNodes,
        edges: graphData.edges
      },
      metrics
    };
  }
} 