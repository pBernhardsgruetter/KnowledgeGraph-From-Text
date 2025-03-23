import React, { useState } from 'react';
import { Button } from './components/ui/button';
import { Textarea } from './components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { TextAnalysisService } from './services/textAnalysis';
import { GraphVisualization } from './components/GraphVisualization';
import { ClusterGraphVisualization } from './components/ClusterGraphVisualization';
import { GraphData } from './types/graph';

function App() {
  const [text, setText] = useState('');
  const [analysisType, setAnalysisType] = useState('co-occurrence');
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visualizationMode, setVisualizationMode] = useState<'standard' | 'cluster'>('standard');

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleAnalysisTypeChange = (value: string) => {
    setAnalysisType(value);
  };

  const handleVisualizationModeChange = (value: string) => {
    setVisualizationMode(value as 'standard' | 'cluster');
  };

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setGraphData(null);

    try {
      const analysisService = TextAnalysisService.getInstance();
      let result: GraphData;

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
      setGraphData(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
            Knowledge Graph Explorer
          </h1>
          <p className="text-gray-400 mt-2">
            Analyze and visualize text relationships
          </p>
        </div>

        {/* Input Section */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Text Analysis</CardTitle>
            <CardDescription>
              Enter text to analyze and select the analysis type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter text to analyze..."
              value={text}
              onChange={handleTextChange}
              className="w-full bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              rows={4}
            />
            <div className="flex flex-col sm:flex-row gap-4">
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
              <div className="text-red-500 text-sm">{error}</div>
            )}
          </CardContent>
        </Card>

        {/* Visualization Section */}
        {graphData && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Knowledge Graph</CardTitle>
                  <CardDescription>
                    Interactive visualization of the text analysis results
                  </CardDescription>
                </div>
                <Select value={visualizationMode} onValueChange={handleVisualizationModeChange}>
                  <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select visualization mode" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="standard">Standard View</SelectItem>
                    <SelectItem value="cluster">Cluster View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] border rounded-md bg-white">
                {visualizationMode === 'standard' ? (
                  <GraphVisualization data={graphData} />
                ) : (
                  <ClusterGraphVisualization data={graphData} />
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App; 