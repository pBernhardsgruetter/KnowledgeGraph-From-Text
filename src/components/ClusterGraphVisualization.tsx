import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Node, Edge, ClusterNode } from '../types/graph';
import { ClusterAnalysisService } from '../services/clusterAnalysis';
import { ClusterInfoPanel } from './ClusterInfoPanel';

interface ClusterGraphVisualizationProps {
  data: {
    nodes: (Node | ClusterNode)[];
    edges: Edge[];
  };
  width?: number;
  height?: number;
  onNodeClick?: (node: Node | ClusterNode) => void;
}

interface Dimensions {
  width: number;
  height: number;
}

interface SimulationNode extends Node {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
}

interface SimulationLink {
  source: SimulationNode;
  target: SimulationNode;
  label?: string;
  weight: number;
  id: string;
}

export const ClusterGraphVisualization: React.FC<ClusterGraphVisualizationProps> = ({
  data,
  width = 800,
  height = 600,
  onNodeClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState<Dimensions>({ width, height });
  const [processedData, setProcessedData] = useState<{
    nodes: SimulationNode[];
    links: SimulationLink[];
  }>({ nodes: [], links: [] });
  const [simulation, setSimulation] = useState<d3.Simulation<SimulationNode, SimulationLink>>();
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Process data to create nodes and links
  useEffect(() => {
    const nodes = data.nodes.map(node => ({
      ...node,
      x: node.x || Math.random() * dimensions.width,
      y: node.y || Math.random() * dimensions.height,
      fx: null,
      fy: null,
      vx: 0,
      vy: 0
    })) as SimulationNode[];

    const links = data.edges.map(edge => ({
      source: nodes.find(n => n.id === (typeof edge.source === 'string' ? edge.source : edge.source.id)) as SimulationNode,
      target: nodes.find(n => n.id === (typeof edge.target === 'string' ? edge.target : edge.target.id)) as SimulationNode,
      label: edge.label,
      weight: edge.weight || 1,
      id: edge.id || `${edge.source}-${edge.target}`
    }));

    setProcessedData({ nodes, links });
  }, [data, dimensions.width, dimensions.height]);

  // Initialize force simulation
  useEffect(() => {
    if (!processedData.nodes.length) return;

    const sim = d3.forceSimulation<SimulationNode>(processedData.nodes)
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide().radius(50))
      .force('link', d3.forceLink<SimulationNode, SimulationLink>(processedData.links)
        .id(d => d.id)
        .distance(100)
      );

    sim.on('tick', () => {
      if (!svgRef.current) return;

      // Update node positions
      d3.select(svgRef.current)
        .selectAll<SVGCircleElement, SimulationNode>('.node')
        .attr('cx', d => d.x || 0)
        .attr('cy', d => d.y || 0);

      // Update link positions
      d3.select(svgRef.current)
        .selectAll<SVGLineElement, SimulationLink>('.link')
        .attr('x1', d => d.source.x || 0)
        .attr('y1', d => d.source.y || 0)
        .attr('x2', d => d.target.x || 0)
        .attr('y2', d => d.target.y || 0);

      // Update label positions
      d3.select(svgRef.current)
        .selectAll<SVGTextElement, SimulationNode>('.label')
        .attr('x', d => (d.x || 0) + 15)
        .attr('y', d => (d.y || 0) + 5);
    });

    setSimulation(sim);

    return () => {
      sim.stop();
    };
  }, [processedData.nodes, processedData.links, dimensions]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const bbox = containerRef.current.getBoundingClientRect();
      setDimensions({
        width: bbox.width,
        height: bbox.height
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: SimulationNode) => {
    event.stopPropagation();
    if (onNodeClick) {
      onNodeClick(node);
    }
  }, [onNodeClick]);

  // Render graph
  useEffect(() => {
    if (!svgRef.current || !processedData.nodes.length) return;

    const svg = d3.select(svgRef.current);

    // Clear previous elements
    svg.selectAll('*').remove();

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create container for zoom
    const container = svg.append('g');

    // Draw links
    container.selectAll('.link')
      .data(processedData.links)
      .join('line')
      .attr('class', 'link')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.weight || 1));

    // Draw nodes
    const nodes = container.selectAll<SVGCircleElement, SimulationNode>('.node')
      .data(processedData.nodes)
      .join('circle')
      .attr('class', 'node')
      .attr('r', d => ('isCluster' in d && d.isCluster) ? 12 : 8)
      .attr('fill', d => ('isCluster' in d && d.isCluster) ? '#4f46e5' : '#2563eb')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .on('click', handleNodeClick);

    // Add drag behavior
    const drag = d3.drag<SVGCircleElement, SimulationNode>()
      .on('start', (event, d) => {
        if (!event.active && simulation) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active && simulation) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodes.call(drag as any); // Type assertion needed due to d3 typing limitations

    // Add labels
    container.selectAll('.label')
      .data(processedData.nodes)
      .join('text')
      .attr('class', 'label')
      .attr('font-size', '12px')
      .attr('pointer-events', 'none')
      .text(d => d.label);

  }, [processedData, handleNodeClick, simulation]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}; 