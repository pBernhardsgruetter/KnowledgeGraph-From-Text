import React, { useCallback, useRef, useState } from 'react';
import ForceGraph2D, { ForceGraphMethods, NodeObject, LinkObject } from 'react-force-graph-2d';
import { Node as GraphNode, Edge as GraphEdge, GraphData as BaseGraphData, GraphMetrics } from '../types/graph';

interface GraphData extends BaseGraphData {
  metrics?: GraphMetrics;
}

interface GraphVisualizationProps {
  data: GraphData;
  onFilterChange?: (minWeight: number) => void;
}

type ForceGraphNode = NodeObject<GraphNode>;
type ForceGraphLink = LinkObject<GraphNode, GraphEdge>;

const GraphVisualization: React.FC<GraphVisualizationProps> = ({ data, onFilterChange }) => {
  const [minWeight, setMinWeight] = useState(0);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const graphRef = useRef<ForceGraphMethods<ForceGraphNode, ForceGraphLink>>();

  // Convert edges array to match ForceGraph format
  const graphData = {
    nodes: data.nodes.map(node => ({
      ...node,
      id: node.id,
      label: node.label,
      degree: node.degree || 0,
      betweenness: node.betweenness || 0
    })) as ForceGraphNode[],
    links: data.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      weight: edge.weight || 0
    })) as ForceGraphLink[]
  };

  const handleFilterChange = (value: number) => {
    setMinWeight(value);
    onFilterChange?.(value);
  };

  const handleNodeClick = useCallback((node: ForceGraphNode) => {
    if (graphRef.current && node.x != null && node.y != null) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(2.5, 1000);
      setSelectedNode(node as unknown as GraphNode);
    }
  }, []);

  // Calculate node size based on betweenness centrality
  const getNodeSize = (node: ForceGraphNode) => {
    const minSize = 4;
    const maxSize = 12;
    const scale = (node.betweenness || 0) * (maxSize - minSize) + minSize;
    return scale;
  };

  // Calculate node color based on degree
  const getNodeColor = (node: ForceGraphNode) => {
    const maxDegree = Math.max(...data.nodes.map(n => n.degree || 0));
    const normalizedDegree = (node.degree || 0) / maxDegree;
    
    // Color scale from blue (low degree) to red (high degree)
    const hue = (1 - normalizedDegree) * 240; // 240 for blue, 0 for red
    return `hsl(${hue}, 70%, 50%)`;
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2">
          <span>Min Edge Weight:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={minWeight}
            onChange={(e) => handleFilterChange(parseFloat(e.target.value))}
            className="w-48"
          />
        </label>
      </div>
      <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeId="id"
          nodeLabel="label"
          nodeVal={getNodeSize}
          nodeColor={getNodeColor}
          linkSource="source"
          linkTarget="target"
          linkWidth={link => (link.weight || 0) * 5}
          onNodeClick={handleNodeClick}
          backgroundColor="#ffffff"
        />
      </div>
      {data.metrics && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Graph Metrics</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Nodes: {data.metrics.node_count}</div>
            <div>Density: {data.metrics.density.toFixed(3)}</div>
            <div>Avg. Clustering: {data.metrics.average_clustering.toFixed(3)}</div>
            <div>Avg. Degree: {data.metrics.average_degree.toFixed(2)}</div>
            <div>Components: {data.metrics.connected_components}</div>
            <div>Largest Component: {(data.metrics.largest_component_ratio * 100).toFixed(1)}%</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphVisualization; 