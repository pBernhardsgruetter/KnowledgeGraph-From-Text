import React from 'react';
import { NetworkMetrics } from '../types/graph';

interface NetworkMetricsPanelProps {
  metrics: NetworkMetrics | null;
  className?: string;
}

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

  return (
    <div className={`bg-white/90 p-4 rounded-lg shadow-lg ${className}`}>
      <h3 className="text-sm font-semibold mb-3 border-b pb-2">Network Structure</h3>
      
      <div className="space-y-3">
        <div>
          <div className="text-xs text-gray-500 mb-1">Modularity Score</div>
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
          <div className="text-xs text-gray-500 mb-1">Influence Distribution</div>
          <div className="flex items-center">
            <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${Math.min(metrics.influenceDistribution * 100, 100)}%` }}
              />
            </div>
            <div className="ml-2 text-sm">
              {(metrics.influenceDistribution * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-1">Network Type</div>
          <div className="flex items-center">
            <span className="mr-2 text-lg">{getStructureIcon(metrics.structureType)}</span>
            <span className="text-sm">{metrics.structureType}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t text-xs text-gray-500">
        <div className="flex justify-between items-center">
          <span>Network Health</span>
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ml-1 ${
                  i < Math.ceil(metrics.modularity * 5)
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 