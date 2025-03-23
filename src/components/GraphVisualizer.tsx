import React, { useState } from 'react';
import { GraphData, Node, ClusterNode } from '../types/graph';
import { ClusteredForceLayout } from './ClusteredForceLayout';
import { HierarchicalLayout } from './HierarchicalLayout';
import { KnowledgeGraphLog } from './KnowledgeGraphLog';

interface GraphVisualizerProps {
  data: GraphData;
  width?: number;
  height?: number;
  onNodeClick?: (node: Node) => void;
}

type VisualizationType = 'clustered' | 'hierarchical';

export const GraphVisualizer: React.FC<GraphVisualizerProps> = ({
  data,
  width = 800,
  height = 600,
  onNodeClick
}) => {
  const [visualizationType, setVisualizationType] = useState<VisualizationType>('clustered');

  // Extract clusters from nodes
  const clusters = data.nodes.filter((node): node is ClusterNode => 
    (node as ClusterNode).isCluster === true
  );

  return (
    <div className="flex h-full">
      <div className="flex-1">
        <div className="mb-4 flex justify-end">
          <div className="bg-white rounded-lg shadow-sm p-2">
            <button
              onClick={() => setVisualizationType('clustered')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                visualizationType === 'clustered'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Clustered View
            </button>
            <button
              onClick={() => setVisualizationType('hierarchical')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                visualizationType === 'hierarchical'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Hierarchical View
            </button>
          </div>
        </div>
        {visualizationType === 'clustered' ? (
          <ClusteredForceLayout
            data={data}
            width={width}
            height={height}
            onNodeClick={onNodeClick}
          />
        ) : (
          <HierarchicalLayout
            data={data}
            width={width}
            height={height}
            onNodeClick={onNodeClick}
          />
        )}
      </div>
      <KnowledgeGraphLog
        nodes={data.nodes}
        edges={data.edges}
        clusters={clusters}
      />
    </div>
  );
}; 