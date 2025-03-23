import React, { useState } from 'react';

interface ClusterInfoPanelProps {
  className?: string;
}

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => (
  <div className="group relative inline-block">
    {children}
    <div className="invisible group-hover:visible absolute z-50 w-64 p-2 bg-gray-900 text-white text-xs rounded-md shadow-lg -left-1/2 transform -translate-x-1/4 mt-1">
      {content}
    </div>
  </div>
);

export const ClusterInfoPanel: React.FC<ClusterInfoPanelProps> = ({
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`${className} transition-all duration-300`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute top-2 right-2 w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors z-20"
      >
        {isExpanded ? '×' : 'ℹ'}
      </button>

      <div className={`
        bg-white/90 rounded-lg shadow-lg overflow-hidden transition-all duration-300
        ${isExpanded ? 'max-h-[600px] p-4' : 'max-h-0 p-0'}
      `}>
        <Tooltip content="Learn how to interact with and interpret the cluster visualization">
          <h3 className="text-sm font-semibold mb-3 border-b pb-2 cursor-help">
            Cluster View Guide
          </h3>
        </Tooltip>

        <div className="space-y-4">
          <div>
            <Tooltip content="Clusters are groups of related concepts that share strong connections">
              <div className="text-xs font-medium text-gray-700 mb-1 cursor-help">
                Understanding Clusters
              </div>
            </Tooltip>
            <div className="flex items-start space-x-2">
              <div className="w-4 h-4 rounded-full bg-indigo-500 mt-1 flex-shrink-0" />
              <div className="text-xs text-gray-600">
                <span className="font-medium">Larger Nodes</span> represent clusters of related concepts. 
                The size indicates the number of concepts within.
              </div>
            </div>
            <div className="flex items-start space-x-2 mt-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
              <div className="text-xs text-gray-600">
                <span className="font-medium">Smaller Nodes</span> are individual concepts. 
                Their connections show relationships to other concepts or clusters.
              </div>
            </div>
          </div>

          <div>
            <Tooltip content="Different ways to explore and analyze the clustered knowledge graph">
              <div className="text-xs font-medium text-gray-700 mb-1 cursor-help">
                Interaction Guide
              </div>
            </Tooltip>
            <ul className="space-y-2 text-xs text-gray-600">
              <li className="flex items-start space-x-2">
                <span className="font-medium text-base leading-none mt-0.5">👆</span>
                <span><span className="font-medium">Click a cluster</span> to expand it and see the detailed connections within</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-medium text-base leading-none mt-0.5">🔍</span>
                <span><span className="font-medium">Scroll to zoom</span> in/out for different levels of detail</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-medium text-base leading-none mt-0.5">✋</span>
                <span><span className="font-medium">Drag nodes</span> to rearrange the layout</span>
              </li>
            </ul>
          </div>

          <div>
            <Tooltip content="Visual indicators that provide information about the clusters and their relationships">
              <div className="text-xs font-medium text-gray-700 mb-1 cursor-help">
                Visual Elements
              </div>
            </Tooltip>
            <ul className="space-y-2 text-xs text-gray-600">
              <li className="flex items-start space-x-2">
                <div className="w-4 border-2 border-indigo-500 rounded-full mt-1 flex-shrink-0" />
                <span>Outer ring indicates a cluster that can be expanded</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-8 h-1 bg-gray-400 mt-2 flex-shrink-0" />
                <span>Lines show relationships between concepts</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="bg-white/80 px-1 text-xs border border-gray-300 rounded">Label</div>
                <span>Hover over nodes or connections to see detailed labels</span>
              </li>
            </ul>
          </div>

          <div className="text-xs text-gray-500 mt-2 pt-3 border-t">
            <Tooltip content="Tips for getting the most out of the cluster visualization">
              <div className="font-medium text-gray-700 mb-1 cursor-help">Pro Tips</div>
            </Tooltip>
            <ul className="space-y-1">
              <li>• Look for clusters with many connections to identify key themes</li>
              <li>• Expand multiple related clusters to discover broader patterns</li>
              <li>• Use the zoom feature to switch between overview and detail</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}; 