import React, { useCallback, useRef, useState } from 'react';
import ForceGraph2D, { ForceGraphMethods, NodeObject, LinkObject } from 'react-force-graph-2d';
import { Node as GraphNode, Edge as GraphEdge, GraphData as BaseGraphData, GraphMetrics } from '../types/graph';

interface GraphData extends BaseGraphData {
  metrics?: GraphMetrics;
}

interface GraphVisualizationProps {
  data: GraphData;
  onFilterChange?: (minWeight: number) => void;
  isFiltering?: boolean;
}

type ForceGraphNode = NodeObject<GraphNode>;
type ForceGraphLink = LinkObject<GraphNode, GraphEdge>;

const GraphVisualization: React.FC<GraphVisualizationProps> = ({ data, onFilterChange, isFiltering = false }) => {
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

  // Center graph when data changes
  React.useEffect(() => {
    if (graphRef.current) {
      // Wait for the force simulation to settle
      setTimeout(() => {
        handleCenterGraph();
      }, 500);
    }
  }, [data]);

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

  const handleCenterGraph = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 40); // Reduced padding to 40px
    }
  }, []);

  // Calculate node size based on betweenness centrality
  const getNodeSize = (node: ForceGraphNode) => {
    const minSize = 6;
    const maxSize = 16;
    const scale = (node.betweenness || 0) * (maxSize - minSize) + minSize;
    return scale;
  };

  // Calculate node color based on degree
  const getNodeColor = (node: ForceGraphNode) => {
    const maxDegree = Math.max(...data.nodes.map(n => n.degree || 0));
    const normalizedDegree = (node.degree || 0) / maxDegree;
    
    // Color scale from indigo (low degree) to purple (high degree)
    return `hsla(${280 - normalizedDegree * 40}, 80%, 60%, 0.9)`;
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <label className="flex items-center space-x-4">
          <span className="text-gray-700 font-medium">Edge Weight Filter:</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={minWeight}
              onChange={(e) => handleFilterChange(parseFloat(e.target.value))}
              className="w-48"
              disabled={isFiltering}
            />
            <span className="text-gray-600 min-w-[3rem]">{minWeight.toFixed(2)}</span>
          </div>
          {isFiltering && (
            <span className="text-blue-500 text-sm animate-pulse">
              Filtering...
            </span>
          )}
        </label>
        <button
          onClick={handleCenterGraph}
          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 3L3 21M21 21L3 3M12 12m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0" />
          </svg>
          Center Graph
        </button>
      </div>
      <div className="border rounded-lg overflow-hidden" style={{ height: '500px' }}>
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeId="id"
          nodeLabel="label"
          nodeVal={getNodeSize}
          nodeColor={getNodeColor}
          linkSource="source"
          linkTarget="target"
          linkWidth={link => (link.weight || 0) * 3}
          linkColor={() => 'rgba(155, 89, 182, 0.2)'}
          backgroundColor="#ffffff"
          nodeCanvasObject={(node, ctx, globalScale) => {
            const { x, y, label } = node;
            if (!x || !y) return;

            // Node circle
            ctx.beginPath();
            ctx.fillStyle = getNodeColor(node);
            const size = getNodeSize(node);
            ctx.arc(x, y, size, 0, 2 * Math.PI);
            ctx.fill();

            // Add a subtle shadow/glow effect
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            // Node label
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Draw label background for better readability
            const textWidth = ctx.measureText(label).width;
            const padding = 4 / globalScale;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(
              x - textWidth / 2 - padding,
              y + size + padding,
              textWidth + padding * 2,
              fontSize + padding * 2
            );

            // Draw label text
            ctx.fillStyle = '#2d3748';
            ctx.fillText(label, x, y + size + fontSize / 2 + padding * 2);
          }}
          cooldownTicks={100}
          d3AlphaDecay={0.1}
          d3VelocityDecay={0.4}
          onEngineStop={handleCenterGraph}
          width={800}
          height={500}
        />
      </div>
      {data.metrics && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2 text-gray-800">Graph Metrics</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
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