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
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8">
      <div className="max-w-full mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">
            Knowledge Graph Explorer
          </h1>
          <p className="text-gray-300 mt-2">
            Analyze and visualize text relationships
          </p>
        </div>

        <div className="flex gap-8 h-[calc(100vh-200px)]">
          <div className="flex-1 min-w-0 space-y-8 overflow-y-auto">
            {/* Input Section */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-xl">Text Analysis</CardTitle>
                <CardDescription className="text-gray-300">
                  Enter text to analyze and select the analysis type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter text to analyze..."
                  value={text}
                  onChange={handleTextChange}
                  className="w-full bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  rows={6}
                />
                <div className="flex flex-col sm:flex-row gap-4">
                  <Select value={analysisType} onValueChange={handleAnalysisTypeChange}>
                    <SelectTrigger className="w-full sm:w-64 bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-700">
                      <SelectValue placeholder="Select analysis type" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="co-occurrence" className="hover:bg-gray-700">Co-occurrence Analysis</SelectItem>
                      <SelectItem value="semantic" className="hover:bg-gray-700">Semantic Analysis</SelectItem>
                      <SelectItem value="topic" className="hover:bg-gray-700">Topic Modeling</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md transition-colors duration-200"
                  >
                    {isAnalyzing ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                      </span>
                    ) : 'Analyze'}
                  </Button>
                </div>
                {error && (
                  <div className="text-red-500 text-sm mt-2">{error}</div>
                )}
              </CardContent>
            </Card>

            {/* Visualization Section */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-xl">Knowledge Graph</CardTitle>
                <CardDescription className="text-gray-300">
                  Interactive visualization of the text analysis results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] border border-gray-700 rounded-lg overflow-hidden">
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
