import React, { useCallback, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { GraphData, Node, Edge, ClusterNode } from '../types/graph';

interface ClusteredForceLayoutProps {
  data: GraphData;
  width?: number;
  height?: number;
  onNodeClick?: (node: Node) => void;
}

interface ForceGraphNode extends Node {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  isCluster?: boolean;
  clusterNodes?: Node[];
  clusterEdges?: Edge[];
}

interface ForceGraphLink extends Edge {
  source: string;
  target: string;
}

export const ClusteredForceLayout: React.FC<ClusteredForceLayoutProps> = ({
  data,
  width = 800,
  height = 600,
  onNodeClick
}) => {
  const graphRef = useRef<any>();

  // Process nodes and links for the force graph
  const graphData = {
    nodes: data.nodes.map(node => ({
      ...node,
      isCluster: (node as ClusterNode).isCluster || false,
      clusterNodes: (node as ClusterNode).clusterNodes || [],
      clusterEdges: (node as ClusterNode).clusterEdges || []
    })) as ForceGraphNode[],
    links: data.edges.map(edge => ({
      ...edge,
      source: typeof edge.source === 'string' ? edge.source : edge.source.id,
      target: typeof edge.target === 'string' ? edge.target : edge.target.id
    })) as ForceGraphLink[]
  };

  const handleNodeClick = useCallback((node: ForceGraphNode) => {
    if (onNodeClick) {
      onNodeClick(node);
    }
  }, [onNodeClick]);

  return (
    <ForceGraph2D
      ref={graphRef}
      width={width}
      height={height}
      graphData={graphData}
      nodeLabel="label"
      linkLabel="label"
      nodeColor={node => (node as ForceGraphNode).isCluster ? '#4f46e5' : '#2563eb'}
      nodeRelSize={6}
      nodeVal={node => (node as ForceGraphNode).isCluster ? 12 : 8}
      linkColor={() => '#9ca3af'}
      linkWidth={1}
      linkDirectionalParticles={2}
      linkDirectionalParticleWidth={2}
      d3AlphaDecay={0.02}
      d3VelocityDecay={0.3}
      cooldownTicks={100}
      onNodeClick={handleNodeClick}
      nodeCanvasObject={(node, ctx, globalScale) => {
        const { x, y, label, isCluster } = node as ForceGraphNode;
        if (!x || !y) return;

        // Node circle
        ctx.beginPath();
        ctx.fillStyle = isCluster ? '#4f46e5' : '#2563eb';
        const size = isCluster ? 12 : 8;
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fill();

        // Node label with background
        const fontSize = isCluster ? 14 / globalScale : 12 / globalScale;
        ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
        const textWidth = ctx.measureText(label).width;
        const padding = 4 / globalScale;

        // Draw label background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(
          x - textWidth / 2 - padding,
          y + size + fontSize / 2 - padding,
          textWidth + padding * 2,
          fontSize + padding * 2
        );

        // Draw label text
        ctx.fillStyle = isCluster ? '#4338ca' : '#1f2937';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y + size + fontSize);
      }}
      nodePointerAreaPaint={(node, color, ctx) => {
        const { x, y, isCluster } = node as ForceGraphNode;
        if (!x || !y) return;
        
        ctx.beginPath();
        const size = (isCluster ? 12 : 8) + 4; // Slightly larger than the node for better hover
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      }}
      linkCanvasObject={(link, ctx, globalScale) => {
        const start = link.source as ForceGraphNode;
        const end = link.target as ForceGraphNode;
        if (!start.x || !start.y || !end.x || !end.y) return;

        // Draw the link
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // Draw the label if it exists
        if (link.label) {
          const label = link.label as string;
          const fontSize = 10 / globalScale;
          ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
          
          // Calculate middle point of the link
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;
          
          // Draw label background
          const textWidth = ctx.measureText(label).width;
          const padding = 3 / globalScale;
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(
            midX - textWidth / 2 - padding,
            midY - fontSize / 2 - padding,
            textWidth + padding * 2,
            fontSize + padding * 2
          );
          
          // Draw label text
          ctx.fillStyle = '#4b5563';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, midX, midY);
        }
      }}
    />
  );
}; 