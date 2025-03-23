import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';

interface LLMLogProps {
  logs: string[];
  isLoading: boolean;
}

export const LLMLog: React.FC<LLMLogProps> = ({ logs, isLoading }) => {
  return (
    <Card className="w-96 bg-gray-800 border-gray-700 h-full">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          LLM Output
          {isLoading && (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div
                key={index}
                className="text-sm text-gray-300 font-mono bg-gray-900 p-2 rounded"
              >
                {log}
              </div>
            ))}
            {isLoading && (
              <div className="text-sm text-gray-400 animate-pulse">
                Processing...
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}; 