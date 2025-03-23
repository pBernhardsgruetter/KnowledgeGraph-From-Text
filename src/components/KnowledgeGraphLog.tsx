import React from 'react';
import { Node, Edge, ClusterNode } from '../types/graph';

interface KnowledgeGraphLogProps {
  nodes: Node[];
  edges: Edge[];
  clusters: ClusterNode[];
}

export const KnowledgeGraphLog: React.FC<KnowledgeGraphLogProps> = ({
  nodes,
  edges,
  clusters
}) => {
  return (
    <div className="w-80 h-full bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Knowledge Graph Log</h2>
        
        {/* Clusters Section */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Clusters</h3>
          <div className="space-y-2">
            {clusters.map(cluster => (
              <div key={cluster.id} className="p-2 bg-indigo-50 rounded-md">
                <div className="font-medium text-indigo-700">{cluster.label}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {cluster.clusterNodes.length} nodes
                </div>
                {cluster.summary && (
                  <div className="text-sm text-gray-500 mt-1">{cluster.summary}</div>
                )}
                {cluster.keyTerms.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {cluster.keyTerms.map(term => (
                      <span
                        key={term}
                        className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full"
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Nodes Section */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Nodes</h3>
          <div className="space-y-2">
            {nodes.map(node => (
              <div key={node.id} className="p-2 bg-blue-50 rounded-md">
                <div className="font-medium text-blue-700">{node.label}</div>
                {node.summary && (
                  <div className="text-sm text-gray-500 mt-1">{node.summary}</div>
                )}
                {node.keyTerms.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {node.keyTerms.map(term => (
                      <span
                        key={term}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Edges Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Relationships</h3>
          <div className="space-y-2">
            {edges.map(edge => (
              <div key={`${edge.source}-${edge.target}`} className="p-2 bg-gray-50 rounded-md">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">
                    {typeof edge.source === 'string' ? edge.source : edge.source.label}
                  </span>
                  <span className="mx-2 text-gray-400">→</span>
                  <span className="font-medium">
                    {typeof edge.target === 'string' ? edge.target : edge.target.label}
                  </span>
                </div>
                {edge.label && (
                  <div className="text-xs text-gray-500 mt-1">{edge.label}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 