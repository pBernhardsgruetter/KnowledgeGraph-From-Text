import React, { useState } from 'react';
import { Button } from './components/ui/button';
import { Textarea } from './components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { TextAnalysisService } from './services/textAnalysis';
import GraphVisualization from './components/GraphVisualization';
import { GraphData } from './types/graph';
import { LLMLog } from './components/LLMLog';

function App() {
  const [text, setText] = useState('');
  const [analysisType, setAnalysisType] = useState('co-occurrence');
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [llmLogs, setLlmLogs] = useState<string[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleAnalysisTypeChange = (value: string) => {
    setAnalysisType(value);
  };

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setGraphData(null);
    setLlmLogs([]);

    try {
      const analysisService = TextAnalysisService.getInstance();
      analysisService.setLogCallback((message) => {
        setLlmLogs(prev => [...prev, message]);
      });

      let result: GraphData;
      setLlmLogs(prev => [...prev, `Starting ${analysisType} analysis...`]);

      switch (analysisType) {
        case 'co-occurrence':
          result = analysisService.analyzeCoOccurrence(text);
          break;
        case 'semantic':
          result = await analysisService.analyzeSemantic(text);
          break;
        case 'topic':
          result = analysisService.analyzeTopic(text);
          break;
        default:
          result = analysisService.analyzeCoOccurrence(text);
      }

      setGraphData(result);
      setLlmLogs(prev => [...prev, 'Analysis completed successfully.']);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
      setGraphData(null);
      setLlmLogs(prev => [...prev, `Error: ${err instanceof Error ? err.message : 'An error occurred'}`]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFilterChange = async (minWeight: number) => {
    if (!graphData) return;
    
    try {
      setIsFiltering(true);
      const response = await fetch('http://localhost:5000/api/filter-edges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ min_weight: minWeight }),
      });

      if (!response.ok) {
        throw new Error('Failed to filter edges');
      }

      const filteredData = await response.json();
      setGraphData(filteredData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while filtering');
    } finally {
      setIsFiltering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-full mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
            Knowledge Graph Explorer
          </h1>
          <p className="text-gray-400 mt-2">
            Analyze and visualize text relationships
          </p>
        </div>

        <div className="flex gap-8 h-[calc(100vh-200px)]">
          <div className="flex-1 min-w-0 space-y-8 overflow-y-auto">
            {/* Input Section */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Text Analysis</CardTitle>
                <CardDescription>
                  Enter text to analyze and select the analysis type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter text to analyze..."
                  value={text}
                  onChange={handleTextChange}
                  className="w-full bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  rows={4}
                />
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <Select value={analysisType} onValueChange={handleAnalysisTypeChange}>
                    <SelectTrigger className="w-full sm:w-64 bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select analysis type" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="co-occurrence">Co-occurrence Analysis</SelectItem>
                      <SelectItem value="semantic">Semantic Analysis</SelectItem>
                      <SelectItem value="topic">Topic Modeling</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                  </Button>
                </div>
                {error && (
                  <div className="text-red-500 text-sm mt-2">{error}</div>
                )}
              </CardContent>
            </Card>

            {/* Visualization Section */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Knowledge Graph</CardTitle>
                <CardDescription>
                  Interactive visualization of the text analysis results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] border rounded-md bg-white">
                  {graphData && (
                    <GraphVisualization 
                      data={graphData}
                      onFilterChange={handleFilterChange}
                      isFiltering={isFiltering}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* LLM Log Section - Fixed width */}
          <div className="w-96 shrink-0">
            <LLMLog logs={llmLogs} isLoading={isAnalyzing} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 