import React from 'react';
import { GraphData } from '../types/graph';
import ForceGraph2D, { NodeObject, LinkObject } from 'react-force-graph-2d';

interface ClusterGraphVisualizationProps {
  data: GraphData;
}

export const ClusterGraphVisualization: React.FC<ClusterGraphVisualizationProps> = ({ data }) => {
  // Convert data to ForceGraph2D expected format
  const graphData = {
    nodes: data.nodes.map(node => ({ ...node })) as NodeObject[],
    links: data.edges.map(edge => ({
      source: typeof edge.source === 'string' ? edge.source : edge.source.id,
      target: typeof edge.target === 'string' ? edge.target : edge.target.id,
      label: edge.label,
      weight: edge.weight,
      id: edge.id
    })) as LinkObject[]
  };

  return (
    <ForceGraph2D
      graphData={graphData}
      nodeId="id"
      nodeLabel="label"
      linkSource="source"
      linkTarget="target"
      width={800}
      height={600}
      backgroundColor="#fff"
    />
  );
}; 