import React, { useCallback, useRef, useEffect, useState } from 'react';
import ForceGraph2D, { NodeObject, LinkObject } from 'react-force-graph-2d';
import { GraphData, Node, Edge, NetworkMetrics } from '../types/graph';
import * as d3 from 'd3';
import { GraphAnalysisService } from '../services/graphAnalysis';
import { NetworkMetricsPanel } from './NetworkMetricsPanel';

interface GraphVisualizationProps {
  data: GraphData;
  width?: number;
  height?: number;
  onNodeClick?: (node: Node) => void;
}

interface ForceGraphData {
  nodes: NodeObject[];
  links: LinkObject[];
}

export const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  data,
  width: propWidth,
  height: propHeight,
  onNodeClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [processedData, setProcessedData] = useState<ForceGraphData>({
    nodes: data.nodes.map(node => ({ ...node })),
    links: data.edges.map(edge => ({ 
      source: edge.source,
      target: edge.target,
      label: edge.label,
      weight: edge.weight
    }))
  });
  const [metrics, setMetrics] = useState<NetworkMetrics | null>(null);

  // Process graph data with metrics
  useEffect(() => {
    const graphAnalysis = GraphAnalysisService.getInstance();
    const { enhancedData, metrics } = graphAnalysis.processGraph(data);
    
    setProcessedData({
      nodes: enhancedData.nodes.map(node => ({ ...node })),
      links: enhancedData.edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        label: edge.label,
        weight: edge.weight
      }))
    });
    setMetrics(metrics);
  }, [data]);

  // Update dimensions on container resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: propWidth || width,
          height: propHeight || height
        });
      }
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, [propWidth, propHeight]);

  // Handle node click
  const handleNodeClick = useCallback((node: NodeObject) => {
    if (onNodeClick) {
      onNodeClick(node as Node);
    }
  }, [onNodeClick]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <NetworkMetricsPanel 
        metrics={metrics}
        className="absolute top-4 right-4 z-10"
      />
      <ForceGraph2D
        ref={graphRef}
        graphData={processedData}
        width={dimensions.width}
        height={dimensions.height}
        nodeLabel="label"
        linkLabel="label"
        nodeRelSize={6}
        nodeVal={(node: NodeObject) => (node as Node).size || 1}
        nodeColor={(node: NodeObject) => (node as Node).color || '#2563eb'}
        linkColor={() => '#9ca3af'}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.005}
        d3AlphaDecay={0.01}
        d3VelocityDecay={0.08}
        cooldownTicks={100}
        onNodeClick={handleNodeClick}
        nodeCanvasObject={(node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const typedNode = node as Node;
          const label = typedNode.label;
          const fontSize = 14 / globalScale;
          const size = ((typedNode.size || 1) * 5) / globalScale;
          
          ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
          ctx.fillStyle = typedNode.color || '#2563eb';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Draw node circle
          ctx.beginPath();
          ctx.arc(node.x || 0, node.y || 0, size, 0, 2 * Math.PI);
          ctx.fill();
          
          // Draw label with background
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(
            (node.x || 0) - bckgDimensions[0] / 2,
            (node.y || 0) - bckgDimensions[1] / 2,
            bckgDimensions[0],
            bckgDimensions[1]
          );
          
          ctx.fillStyle = '#1f2937';
          ctx.fillText(label, node.x || 0, node.y || 0);

          // Draw centrality indicator if high centrality
          if ((typedNode.centrality || 0) > 0.5) {
            ctx.beginPath();
            ctx.arc(node.x || 0, node.y || 0, size + 2, 0, 2 * Math.PI);
            ctx.strokeStyle = '#4f46e5';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }}
      />
    </div>
  );
}; 