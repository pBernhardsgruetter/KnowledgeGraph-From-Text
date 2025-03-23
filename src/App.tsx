import React, { useState } from 'react';
import { Button } from './components/ui/button';
import { Textarea } from './components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { TextAnalysisService } from './services/textAnalysis';
import { GraphVisualization } from './components/GraphVisualization';
import { GraphData } from './types/graph';

function App() {
  const [text, setText] = useState('');
  const [analysisType, setAnalysisType] = useState('co-occurrence');
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">InsightGraph</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Help</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>How to use InsightGraph</DialogTitle>
                <DialogDescription className="space-y-4">
                  <p>
                    Enter your text and choose an analysis type to generate a knowledge graph.
                    The graph will show relationships between concepts in your text.
                  </p>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Analysis Types:</h4>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><span className="font-medium">Semantic Analysis:</span> Uses AI to identify meaningful relationships between concepts</li>
                      <li><span className="font-medium">Co-occurrence:</span> Shows words that frequently appear together</li>
                      <li><span className="font-medium">Topic Modeling:</span> Groups related concepts into topics</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Interacting with the Graph:</h4>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Click nodes to focus on them</li>
                      <li>Click edges to highlight connections</li>
                      <li>Scroll to zoom in/out</li>
                      <li>Drag to pan around</li>
                    </ul>
                  </div>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Text Input</CardTitle>
            <CardDescription>
              Enter the text you want to analyze. For best results, use clear and well-structured text.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-4">
              <Select value={analysisType} onValueChange={handleAnalysisTypeChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select analysis type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semantic">Semantic Analysis</SelectItem>
                  <SelectItem value="co-occurrence">Co-occurrence</SelectItem>
                  <SelectItem value="topic">Topic Modeling</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing}
                className={isAnalyzing ? 'animate-pulse' : ''}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>
            <Textarea
              placeholder="Enter your text here..."
              value={text}
              onChange={handleTextChange}
              className="min-h-[200px]"
              disabled={isAnalyzing}
            />
            {error && (
              <div className="text-red-500 text-sm p-2 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {graphData && (
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Graph</CardTitle>
              <CardDescription>
                Interactive visualization of the text analysis results.
                Click nodes or edges to explore relationships.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] border rounded-md bg-white">
                <GraphVisualization data={graphData} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App; 