import React, { useCallback, useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { GraphData, Node, Edge } from '../types/graph';
import * as d3 from 'd3';
import { ClusterAnalysisService } from '../services/clusterAnalysis';

interface ClusterNode extends Node, d3.SimulationNodeDatum {
  isCluster: boolean;
  clusterNodes: Node[];
  clusterEdges: Edge[];
  summary: string;
  keyTerms: string[];
  level: number;
  size?: number;
  color?: string;
  __highlighted?: boolean;
}

interface ClusterLink extends d3.SimulationLinkDatum<ClusterNode> {
  label?: string;
  weight?: number;
  __highlighted?: boolean;
}

interface ProcessedGraphData {
  nodes: ClusterNode[];
  links: ClusterLink[];
}

interface ClusterGraphVisualizationProps {
  data: GraphData;
  width?: number;
  height?: number;
}

export const ClusterGraphVisualization: React.FC<ClusterGraphVisualizationProps> = ({
  data,
  width: propWidth,
  height: propHeight
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>();
  const simulationRef = useRef<d3.Simulation<ClusterNode, ClusterLink> | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [processedData, setProcessedData] = useState<ProcessedGraphData>({ nodes: [], links: [] });
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Initialize cluster analysis when data changes
  useEffect(() => {
    const analyzeClusters = async () => {
      if (!data.nodes.length) return;

      setIsAnalyzing(true);
      setError(null);

      try {
        const clusterService = ClusterAnalysisService.getInstance();
        const clusterResult = await clusterService.analyzeClusters(data);
        
        // Convert cluster result to processed data
        const nodes = clusterResult.nodes.map(node => ({
          ...node,
          size: node.isCluster ? 2 : 1.5,
          color: node.isCluster ? node.color : '#2563eb',
          x: node.x || Math.random() * dimensions.width,
          y: node.y || Math.random() * dimensions.height,
          vx: 0,
          vy: 0
        })) as ClusterNode[];

        const links = clusterResult.edges.map(edge => ({
          ...edge,
          source: nodes.find(n => n.id === edge.source) || nodes[0],
          target: nodes.find(n => n.id === edge.target) || nodes[0]
        })) as ClusterLink[];

        setProcessedData({ nodes, links });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to analyze clusters');
      } finally {
        setIsAnalyzing(false);
      }
    };

    analyzeClusters();
  }, [data, dimensions]);

  // Initialize and update graph layout
  useEffect(() => {
    if (processedData.nodes.length > 0) {
      // Stop existing simulation if any
      if (simulationRef.current) {
        simulationRef.current.stop();
      }

      const nodes = processedData.nodes.map(node => ({...node}));
      const links = processedData.links.map(link => ({...link}));

      // Create new simulation
      simulationRef.current = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links)
          .id((d: any) => d.id)
          .distance(80)
          .strength(0.7))
        .force('charge', d3.forceManyBody()
          .strength(d => (d as ClusterNode).isCluster ? -400 : -200)
          .distanceMax(300))
        .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
        .force('collision', d3.forceCollide()
          .radius((d: any) => ((d.size || 1.5) * 15) + 5)
          .strength(0.9))
        .force('radial', d3.forceRadial(0, dimensions.width / 2, dimensions.height / 2).strength(0.05))
        .alphaMin(0.001)
        .alphaDecay(0.02)
        .velocityDecay(0.4)
        .force('cluster', (alpha: number) => {
          const centroids = new Map<string, { x: number; y: number; count: number }>();
          
          nodes.forEach(d => {
            if (d.isCluster && d.x !== undefined && d.y !== undefined) {
              if (!centroids.has(d.id)) {
                centroids.set(d.id, { x: 0, y: 0, count: 0 });
              }
              const centroid = centroids.get(d.id)!;
              centroid.x += d.x;
              centroid.y += d.y;
              centroid.count += 1;
            }
          });

          centroids.forEach(centroid => {
            centroid.x /= centroid.count;
            centroid.y /= centroid.count;
          });

          const clusterStrength = 0.2;
          nodes.forEach(d => {
            if (d.isCluster && centroids.has(d.id) && d.x !== undefined && d.y !== undefined) {
              const centroid = centroids.get(d.id)!;
              d.vx = ((d.vx || 0) + (centroid.x - d.x) * alpha * clusterStrength);
              d.vy = ((d.vy || 0) + (centroid.y - d.y) * alpha * clusterStrength);
            }
          });
        });

      // Anti-spin force
      let lastAngle = 0;
      let spinCount = 0;
      const maxSpinCount = 5;

      simulationRef.current.on('tick', () => {
        // Calculate average angular velocity
        let avgAngle = 0;
        nodes.forEach(node => {
          if (node.x !== undefined && node.y !== undefined) {
            const angle = Math.atan2(
              node.y - dimensions.height / 2,
              node.x - dimensions.width / 2
            );
            avgAngle += angle;
          }
        });
        avgAngle /= nodes.length;

        // Detect and counter spinning
        if (Math.abs(avgAngle - lastAngle) > 0.01) {
          spinCount++;
          if (spinCount > maxSpinCount) {
            nodes.forEach(node => {
              if (node.vx !== undefined && node.vy !== undefined) {
                node.vx *= 0.7;
                node.vy *= 0.7;
              }
            });
          }
        } else {
          spinCount = 0;
        }
        lastAngle = avgAngle;

        // Update state less frequently
        setProcessedData(current => {
          if (JSON.stringify(current.nodes) === JSON.stringify(nodes)) {
            return current;
          }
          return { nodes: [...nodes], links };
        });
      });

      // Cleanup simulation on unmount
      return () => {
        if (simulationRef.current) {
          simulationRef.current.stop();
        }
      };
    }
  }, [dimensions]);

  // Handle cluster expansion
  const handleClusterClick = useCallback(async (node: ClusterNode) => {
    if (!node.isCluster) return;

    try {
      setIsAnalyzing(true);
      setError(null);

      const clusterService = ClusterAnalysisService.getInstance();
      const expandedData = await clusterService.expandCluster(node.id, data);

      // Update the graph with expanded cluster data
      const updatedNodes = processedData.nodes.filter(n => !n.isCluster || n.id !== node.id);
      const updatedLinks = processedData.links.filter(l => 
        l.source !== node && l.target !== node
      );

      // Add expanded nodes and links
      const newNodes = expandedData.nodes.map(n => ({
        ...n,
        isCluster: false,
        size: 1.5,
        color: '#2563eb',
        x: node.x || Math.random() * dimensions.width,
        y: node.y || Math.random() * dimensions.height,
        vx: 0,
        vy: 0
      })) as ClusterNode[];

      const newLinks = expandedData.edges.map(e => ({
        ...e,
        source: newNodes.find(n => n.id === e.source) || newNodes[0],
        target: newNodes.find(n => n.id === e.target) || newNodes[0]
      })) as ClusterLink[];

      setProcessedData({
        nodes: [...updatedNodes, ...newNodes],
        links: [...updatedLinks, ...newLinks]
      });

      setExpandedCluster(node.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to expand cluster');
    } finally {
      setIsAnalyzing(false);
    }
  }, [data, processedData, dimensions]);

  // Center graph after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      if (graphRef.current && processedData.nodes.length > 0) {
        graphRef.current.zoomToFit(400);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [processedData]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {isAnalyzing && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="text-white">Analyzing clusters...</div>
        </div>
      )}
      {error && (
        <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md z-10">
          {error}
        </div>
      )}
      <ForceGraph2D
        ref={graphRef}
        graphData={processedData as any}
        width={dimensions.width}
        height={dimensions.height}
        nodeLabel="label"
        linkLabel="label"
        nodeRelSize={6}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.4}
        cooldownTicks={100}
        warmupTicks={50}
        onEngineStop={() => {
          if (graphRef.current) {
            graphRef.current.zoomToFit(400);
          }
        }}
        nodeColor={(node: ClusterNode) => node.__highlighted ? '#f97316' : (node.color || '#2563eb')}
        linkColor={(link: ClusterLink) => link.__highlighted ? '#f97316' : '#9ca3af'}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.005}
        onNodeClick={handleClusterClick}
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

          // Draw cluster indicator
          if (node.isCluster) {
            ctx.beginPath();
            ctx.arc(x, y, size + 2, 0, 2 * Math.PI);
            ctx.strokeStyle = '#4f46e5';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
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