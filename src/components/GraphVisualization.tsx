import React, { useCallback, useRef, useEffect, useState } from 'react';
import ForceGraph2D, { GraphData as ForceGraphData, NodeObject } from 'react-force-graph-2d';
import { GraphData, Node, Edge } from '../types/graph';
import * as d3 from 'd3';

interface GraphVisualizationProps {
  data: GraphData;
  width?: number;
  height?: number;
}

interface ClusterNode extends NodeObject {
  id: string;
  label: string;
  cluster?: string;
  size?: number;
  color?: string;
  __highlighted?: boolean;
}

interface ClusterLink {
  source: ClusterNode;
  target: ClusterNode;
  label?: string;
  weight?: number;
  __highlighted?: boolean;
}

interface ProcessedGraphData {
  nodes: ClusterNode[];
  links: ClusterLink[];
}

export const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  data,
  width: propWidth,
  height: propHeight
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>();
  const simulationRef = useRef<d3.Simulation<any, undefined> | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [processedData, setProcessedData] = useState<ProcessedGraphData>({ nodes: [], links: [] });

  // Cluster the nodes using modularity-based community detection
  const updateClusters = useCallback((nodes: ClusterNode[], links: ClusterLink[]) => {
    // Create an undirected graph for community detection
    const graph = new Map<string, Set<string>>();
    nodes.forEach(node => graph.set(node.id, new Set()));
    links.forEach(link => {
      const source = typeof link.source === 'object' ? link.source.id : link.source;
      const target = typeof link.target === 'object' ? link.target.id : link.target;
      graph.get(source)?.add(target);
      graph.get(target)?.add(source);
    });

    // Implement Louvain method for community detection
    const communities = new Map<string, string>();
    let changed = true;
    let iteration = 0;

    while (changed && iteration < 10) {
      changed = false;
      iteration++;

      nodes.forEach(node => {
        const currentCommunity = communities.get(node.id) || node.id;
        const neighborCommunities = new Map<string, number>();

        // Get neighbor communities and their weights
        Array.from(graph.get(node.id) || []).forEach(neighborId => {
          const neighborCommunity = communities.get(neighborId) || neighborId;
          neighborCommunities.set(
            neighborCommunity,
            (neighborCommunities.get(neighborCommunity) || 0) + 1
          );
        });

        // Find the community with maximum modularity gain
        let bestCommunity = currentCommunity;
        let maxGain = 0;

        neighborCommunities.forEach((weight, community) => {
          if (weight > maxGain) {
            maxGain = weight;
            bestCommunity = community;
          }
        });

        // Update community if better one found
        if (bestCommunity !== currentCommunity) {
          communities.set(node.id, bestCommunity);
          changed = true;
        }
      });
    }

    // Update node clusters
    const newClusters = new Map<string, ClusterNode[]>();
    nodes.forEach(node => {
      const cluster = communities.get(node.id) || node.id;
      node.cluster = cluster;
      if (!newClusters.has(cluster)) {
        newClusters.set(cluster, []);
      }
      newClusters.get(cluster)?.push(node);
    });

    return communities;
  }, []);

  // Update dimensions when container size changes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Initialize and update graph layout
  useEffect(() => {
    if (data.nodes.length > 0) {
      // Convert data to correct types
      const nodes = data.nodes.map(node => ({
        ...node,
        size: node.size || 1.5,
        color: node.color || '#2563eb',
        x: node.x || Math.random() * dimensions.width,
        y: node.y || Math.random() * dimensions.height,
        vx: 0,
        vy: 0
      })) as ClusterNode[];
      
      const links = (data.links || data.edges).map(link => ({
        ...link,
        weight: link.weight || 1,
        source: nodes.find(n => n.id === link.source) || nodes[0],
        target: nodes.find(n => n.id === link.target) || nodes[0]
      })).filter(link => link.source && link.target) as ClusterLink[];

      // Update clusters
      const communities = updateClusters(nodes, links);

      // Create color scale for clusters
      const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

      // Update node colors based on clusters
      nodes.forEach(node => {
        const cluster = communities.get(node.id) || node.id;
        node.color = colorScale(cluster);
      });

      // Stop existing simulation if any
      if (simulationRef.current) {
        simulationRef.current.stop();
      }

      // Create new simulation
      simulationRef.current = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id((d: any) => d.id))
        .force('charge', d3.forceManyBody().strength(-100))
        .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
        .force('collision', d3.forceCollide().radius((d: any) => (d.size || 1.5) * 10))
        .force('cluster', (alpha: number) => {
          const centroids = new Map<string, { x: number; y: number; count: number }>();
          
          nodes.forEach(d => {
            if (d.cluster && d.x !== undefined && d.y !== undefined) {
              if (!centroids.has(d.cluster)) {
                centroids.set(d.cluster, { x: 0, y: 0, count: 0 });
              }
              const centroid = centroids.get(d.cluster)!;
              centroid.x += d.x;
              centroid.y += d.y;
              centroid.count += 1;
            }
          });

          centroids.forEach(centroid => {
            centroid.x /= centroid.count;
            centroid.y /= centroid.count;
          });

          const clusterStrength = 0.5;
          nodes.forEach(d => {
            if (d.cluster && centroids.has(d.cluster) && d.x !== undefined && d.y !== undefined) {
              const centroid = centroids.get(d.cluster)!;
              d.vx = ((d.vx || 0) + (centroid.x - d.x) * alpha * clusterStrength);
              d.vy = ((d.vy || 0) + (centroid.y - d.y) * alpha * clusterStrength);
            }
          });
        });

      // Update positions on each tick
      simulationRef.current.on('tick', () => {
        setProcessedData({ nodes: [...nodes], links });
      });

      // Set initial data
      setProcessedData({ nodes, links });

      // Cleanup simulation on unmount
      return () => {
        if (simulationRef.current) {
          simulationRef.current.stop();
        }
      };
    }
  }, [data, dimensions, updateClusters]);

  // Center graph after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      if (graphRef.current && processedData.nodes.length > 0) {
        graphRef.current.zoomToFit(400);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [processedData]);

  const handleNodeClick = useCallback((node: ClusterNode) => {
    if (graphRef.current) {
      const x = node.x || 0;
      const y = node.y || 0;
      graphRef.current.centerAt(x, y, 1000);
      graphRef.current.zoom(2, 1000);
    }
  }, []);

  const handleLinkClick = useCallback((link: ClusterLink) => {
    if (graphRef.current) {
      const graphData = processedData;
      const highlightNodes = new Set([link.source, link.target]);
      const highlightLinks = new Set([link]);

      const updatedNodes = graphData.nodes.map(node => ({
        ...node,
        __highlighted: highlightNodes.has(node)
      }));

      const updatedLinks = graphData.links.map(l => ({
        ...l,
        __highlighted: highlightLinks.has(l)
      }));

      setProcessedData({ nodes: updatedNodes, links: updatedLinks });
    }
  }, [processedData]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <ForceGraph2D<ClusterNode, ClusterLink>
        ref={graphRef}
        graphData={processedData}
        width={dimensions.width}
        height={dimensions.height}
        nodeLabel="label"
        linkLabel="label"
        nodeRelSize={6}
        d3AlphaDecay={0.01}
        d3VelocityDecay={0.08}
        cooldownTicks={100}
        nodeColor={(node: ClusterNode) => node.__highlighted ? '#f97316' : (node.color || '#2563eb')}
        linkColor={(link: ClusterLink) => link.__highlighted ? '#f97316' : '#9ca3af'}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.005}
        onNodeClick={handleNodeClick}
        onLinkClick={handleLinkClick}
        nodeCanvasObject={(node: ClusterNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const label = node.label;
          const fontSize = 14 / globalScale;
          const x = node.x || 0;
          const y = node.y || 0;
          const size = (node.size || 1.5) * 4;
          
          ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
          ctx.fillStyle = node.__highlighted ? '#f97316' : '#1f2937';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Draw node circle
          ctx.beginPath();
          ctx.arc(x, y, size, 0, 2 * Math.PI);
          ctx.fillStyle = node.__highlighted ? '#f97316' : (node.color || '#2563eb');
          ctx.fill();
          
          // Draw label with background
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(
            x - bckgDimensions[0] / 2,
            y - bckgDimensions[1] / 2,
            bckgDimensions[0],
            bckgDimensions[1]
          );
          
          ctx.fillStyle = node.__highlighted ? '#f97316' : '#1f2937';
          ctx.fillText(label, x, y);
        }}
        linkCanvasObject={(link: ClusterLink, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const start = link.source as ClusterNode;
          const end = link.target as ClusterNode;
          const startX = start.x || 0;
          const startY = start.y || 0;
          const endX = end.x || 0;
          const endY = end.y || 0;
          
          // Draw the link
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.strokeStyle = link.__highlighted ? '#f97316' : '#9ca3af';
          ctx.lineWidth = link.__highlighted ? 2 : 1;
          ctx.stroke();

          // Draw the label if zoomed in enough
          if (globalScale >= 1.5 && link.label) {
            const label = link.label;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
            
            const midX = startX + (endX - startX) / 2;
            const midY = startY + (endY - startY) / 2;
            
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(
              midX - bckgDimensions[0] / 2,
              midY - bckgDimensions[1] / 2,
              bckgDimensions[0],
              bckgDimensions[1]
            );
            
            ctx.fillStyle = link.__highlighted ? '#f97316' : '#4b5563';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, midX, midY);
          }
        }}
      />
    </div>
  );
}; 