import React, { useCallback, useRef, useMemo } from 'react';
import ForceGraph2D, { ForceGraphProps, NodeObject, LinkObject } from 'react-force-graph-2d';
import { GraphData, Node, Edge, ClusterNode } from '../types/graph';
import * as d3 from 'd3';

interface HierarchicalLayoutProps {
  data: GraphData;
  width?: number;
  height?: number;
  onNodeClick?: (node: Node) => void;
}

interface HierarchicalNode extends Node {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  isCluster?: boolean;
  clusterNodes?: Node[];
  clusterEdges?: Edge[];
  level?: number;
  parent?: string;
  children?: string[];
}

interface HierarchicalLink extends Edge {
  source: string;
  target: string;
  isHierarchical?: boolean;
}

export const HierarchicalLayout: React.FC<HierarchicalLayoutProps> = ({
  data,
  width = 800,
  height = 600,
  onNodeClick
}) => {
  const graphRef = useRef<any>();

  // Process data to create hierarchical structure
  const { nodes, links } = useMemo(() => {
    const processedNodes: HierarchicalNode[] = [];
    const processedLinks: HierarchicalLink[] = [];
    const clusterMap = new Map<string, ClusterNode>();

    // First pass: collect all clusters
    data.nodes.forEach(node => {
      if ((node as ClusterNode).isCluster) {
        clusterMap.set(node.id, node as ClusterNode);
      }
    });

    // Second pass: create hierarchical nodes
    data.nodes.forEach(node => {
      const isCluster = (node as ClusterNode).isCluster;
      const processedNode: HierarchicalNode = {
        ...node,
        isCluster,
        level: isCluster ? 1 : 2,
        children: isCluster ? (node as ClusterNode).clusterNodes.map((n: Node) => n.id) : undefined
      };

      if (isCluster) {
        processedNode.clusterNodes = (node as ClusterNode).clusterNodes;
        processedNode.clusterEdges = (node as ClusterNode).clusterEdges;
      } else {
        // Find parent cluster
        Array.from(clusterMap.entries()).forEach(([clusterId, cluster]) => {
          if (cluster.clusterNodes.some((n: Node) => n.id === node.id)) {
            processedNode.parent = clusterId;
          }
        });
      }

      processedNodes.push(processedNode);
    });

    // Create links including hierarchical relationships
    data.edges.forEach(edge => {
      processedLinks.push({
        ...edge,
        source: typeof edge.source === 'string' ? edge.source : edge.source.id,
        target: typeof edge.target === 'string' ? edge.target : edge.target.id
      });
    });

    // Add hierarchical links
    processedNodes.forEach(node => {
      if (node.parent) {
        processedLinks.push({
          source: node.parent,
          target: node.id,
          label: 'contains',
          isHierarchical: true
        });
      }
    });

    return { nodes: processedNodes, links: processedLinks };
  }, [data]);

  // Custom force simulation
  const forceRef = useRef<any>();
  const initializeForces = useCallback(() => {
    const fg = graphRef.current;
    if (!fg) return;
    
    // Add custom forces
    fg.d3Force('charge')?.strength(-200);
    fg.d3Force('link')?.distance((d: HierarchicalLink) => d.isHierarchical ? 80 : 40);
    
    // Add hierarchical positioning force
    fg.d3Force('y', d3.forceY<HierarchicalNode>(d => {
      const levelHeight = height / 3;
      return d.level === 1 ? levelHeight : 2 * levelHeight;
    }).strength(1));

    // Add clustering force
    fg.d3Force('cluster', (alpha: number) => {
      nodes.forEach(node => {
        if (node.parent) {
          const parent = nodes.find(n => n.id === node.parent);
          if (parent && parent.x !== undefined && parent.y !== undefined) {
            const k = alpha * 0.3;
            node.vx = (node.vx || 0) + (parent.x - (node.x || 0)) * k;
            node.vy = (node.vy || 0) + (parent.y - (node.y || 0)) * k;
          }
        }
      });
    });
  }, [height, nodes]);

  const handleNodeClick = useCallback((node: HierarchicalNode) => {
    if (onNodeClick) {
      onNodeClick(node);
    }
  }, [onNodeClick]);

  return (
    <ForceGraph2D
      ref={graphRef}
      width={width}
      height={height}
      graphData={{ nodes, links }}
      nodeLabel="label"
      linkLabel="label"
      nodeColor={node => ((node as unknown) as HierarchicalNode).isCluster ? '#4f46e5' : '#2563eb'}
      nodeRelSize={6}
      nodeVal={node => ((node as unknown) as HierarchicalNode).isCluster ? 12 : 8}
      linkColor={link => ((link as unknown) as HierarchicalLink).isHierarchical ? '#4f46e5' : '#9ca3af'}
      linkWidth={link => ((link as unknown) as HierarchicalLink).isHierarchical ? 2 : 1}
      linkDirectionalParticles={2}
      linkDirectionalParticleWidth={2}
      d3AlphaDecay={0.02}
      d3VelocityDecay={0.3}
      cooldownTicks={100}
      onNodeClick={handleNodeClick}
      onEngineStop={() => {
        if (graphRef.current) {
          graphRef.current.zoomToFit(400);
        }
      }}
      nodeCanvasObject={(node, ctx, globalScale) => {
        const { x, y, label, isCluster } = (node as unknown) as HierarchicalNode;
        if (!x || !y) return;

        // Node circle
        ctx.beginPath();
        ctx.fillStyle = isCluster ? '#4f46e5' : '#2563eb';
        const size = isCluster ? 12 : 8;
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fill();

        // Node label
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = '#1f2937';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y + size + fontSize);
      }}
      nodePointerAreaPaint={(node, color, ctx) => {
        const { x, y, isCluster } = (node as unknown) as HierarchicalNode;
        if (!x || !y) return;
        
        ctx.beginPath();
        const size = (isCluster ? 12 : 8) + 4; // Slightly larger than the node for better hover
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      }}
      onEngineTick={initializeForces}
    />
  );
}; 