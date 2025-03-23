import React from 'react';
import { NetworkMetrics } from '../types/graph';

interface NetworkMetricsPanelProps {
  metrics: NetworkMetrics | null;
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

export const NetworkMetricsPanel: React.FC<NetworkMetricsPanelProps> = ({
  metrics,
  className = ''
}) => {
  if (!metrics) return null;

  const getModularityColor = (value: number) => {
    if (value >= 0.7) return 'text-green-600';
    if (value >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStructureIcon = (type: 'Biased' | 'Balanced' | 'Dispersed') => {
    switch (type) {
      case 'Biased':
        return '⚠️';
      case 'Balanced':
        return '✓';
      case 'Dispersed':
        return '↔️';
    }
  };

  const getStructureDescription = (type: 'Biased' | 'Balanced' | 'Dispersed') => {
    switch (type) {
      case 'Biased':
        return 'Network has dominant nodes that control most connections';
      case 'Balanced':
        return 'Network has evenly distributed influence among nodes';
      case 'Dispersed':
        return 'Network has loosely connected nodes with similar importance';
    }
  };

  return (
    <div className={`bg-white/90 p-4 rounded-lg shadow-lg ${className}`}>
      <Tooltip content="These metrics help understand how your knowledge graph is structured and connected">
        <h3 className="text-sm font-semibold mb-3 border-b pb-2 cursor-help">
          Network Structure Analysis
        </h3>
      </Tooltip>
      
      <div className="space-y-4">
        <div>
          <Tooltip content="Measures how well-defined the communities or clusters are in your network. Higher values indicate clearer groupings of related concepts.">
            <div className="text-xs text-gray-500 mb-1 cursor-help">Modularity Score</div>
          </Tooltip>
          <div className="flex items-center">
            <div className={`text-lg font-medium ${getModularityColor(metrics.modularity)}`}>
              {metrics.modularity.toFixed(2)}
            </div>
            <div className="ml-2 text-xs text-gray-500">
              {metrics.modularity >= 0.7 ? 'Well structured' :
               metrics.modularity >= 0.4 ? 'Moderately structured' :
               'Loosely structured'}
            </div>
          </div>
        </div>

        <div>
          <Tooltip content="Shows how evenly distributed the connections are across nodes. Lower values indicate more balanced networks, while higher values suggest some nodes dominate the connections.">
            <div className="text-xs text-gray-500 mb-1 cursor-help">Influence Distribution</div>
          </Tooltip>
          <div className="flex items-center">
            <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(metrics.influenceDistribution * 100, 100)}%` }}
              />
            </div>
            <div className="ml-2 text-sm">
              {(metrics.influenceDistribution * 100).toFixed(0)}%
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {metrics.influenceDistribution > 0.7 ? 'High concentration of influence' :
             metrics.influenceDistribution > 0.4 ? 'Moderate distribution' :
             'Even distribution'}
          </div>
        </div>

        <div>
          <Tooltip content="Classifies your network based on how information or influence flows through it. This helps understand the overall structure and behavior of your knowledge graph.">
            <div className="text-xs text-gray-500 mb-1 cursor-help">Network Type</div>
          </Tooltip>
          <div className="flex items-center">
            <span className="mr-2 text-lg">{getStructureIcon(metrics.structureType)}</span>
            <div>
              <span className="text-sm font-medium">{metrics.structureType}</span>
              <div className="text-xs text-gray-500">
                {getStructureDescription(metrics.structureType)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t">
        <Tooltip content="Overall health score based on modularity, influence distribution, and network type. More green dots indicate a healthier, more balanced network structure.">
          <div className="flex justify-between items-center cursor-help">
            <span className="text-xs text-gray-500">Network Health</span>
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ml-1 transition-colors duration-300 ${
                    i < Math.ceil(metrics.modularity * 5)
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </Tooltip>
        <div className="text-xs text-gray-500 mt-2">
          {metrics.modularity >= 0.8 ? 'Excellent network structure' :
           metrics.modularity >= 0.6 ? 'Good network structure' :
           metrics.modularity >= 0.4 ? 'Fair network structure' :
           'Network structure needs improvement'}
        </div>
      </div>
    </div>
  );
}; 