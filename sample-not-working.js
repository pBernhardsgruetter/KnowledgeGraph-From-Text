import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Search, AlertTriangle, CheckCircle, Info, Link, Github } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Define the interfaces
interface Node {
  id: string;
  label: string;
  group?: string;
  [key: string]: any;
}

interface Edge {
  source: string;
  target: string;
  label: string;
  [key: string]: any;
}

interface KnowledgeGraphData {
  nodes: Node[];
  edges: Edge[];
}

// ===============================
// Sub-Components
// ===============================

/**
 * Displays a single node in the knowledge graph.  Enhanced with styling.
 */
const NodeDisplay = ({ node }: { node: Node }) => (
  <motion.div
    whileHover={{ scale: 1.1, boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}
    transition={{ type: 'spring', stiffness: 300 }}
    className="rounded-full flex items-center justify-center text-white font-medium shadow-lg"
    style={{
      backgroundColor:
        node.group === 'Person'
          ? '#60a5fa'
          : node.group === 'Location'
            ? '#f97316'
            : '#8b5cf6', // Default color
      width: '80px',
      height: '80px',
    }}
  >
    {node.label}
  </motion.div>
);

/**
 * Displays a single edge (connection) in the knowledge graph.
 */
const EdgeDisplay = ({ edge }: { edge: Edge }) => (
  <div className="text-gray-300 text-sm">
    {edge.source} -- {edge.label} -- {edge.target}
  </div>
);

/**
 * Interactive Knowledge Graph Visualization.
 */
const KnowledgeGraphVisualization = ({ data }: { data: KnowledgeGraphData }) => {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    setNodes(data.nodes);
    setEdges(data.edges);
  }, [data]);

  // Basic layout for demonstration.
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';

      const nodeElements: HTMLElement[] = nodes.map((node, index) => {
        const nodeDiv = document.createElement('div');
        nodeDiv.style.position = 'absolute';
        nodeDiv.style.left = `${(index % 3) * 150 + 50}px`;
        nodeDiv.style.top = `${Math.floor(index / 3) * 150 + 50}px`;

        const root = document.createElement('div');
        nodeDiv.appendChild(root);
        // @ts-ignore
        ReactDOM.render(<NodeDisplay node={node} />, root);

        nodeDiv.addEventListener('click', () => {
          setSelectedNode(node);
          setSelectedEdge(null);
        });
        containerRef.current?.appendChild(nodeDiv);
        return nodeDiv;
      });

      // Display edges (very basic representation)
      edges.forEach((edge) => {
        const edgeDiv = document.createElement('div');
        edgeDiv.textContent = `${edge.source} -- ${edge.label} -- ${edge.target}`;
        edgeDiv.style.position = 'relative';
        edgeDiv.style.marginTop = '20px';
        edgeDiv.style.color = 'gray';
        edgeDiv.addEventListener('click', () => {
          setSelectedEdge(edge);
          setSelectedNode(null);
        });
        containerRef.current?.appendChild(edgeDiv);
      });
    }
  }, [nodes, edges]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-gray-900 border border-gray-700 rounded-lg relative overflow-auto"
      style={{ minHeight: '400px' }}
    >
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute top-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700 text-white z-10 w-72"
          >
            <h3 className="text-lg font-semibold mb-2">Node Details</h3>
            <p>
              <strong>ID:</strong> {selectedNode.id}
            </p>
            <p>
              <strong>Label:</strong> {selectedNode.label}
            </p>
            {selectedNode.group && (
              <p>
                <strong>Group:</strong> {selectedNode.group}
              </p>
            )}
            {selectedNode.type && (
              <p>
                <strong>Type:</strong> {selectedNode.type}
              </p>
            )}
            {Object.entries(selectedNode)
              .filter(
                ([key]) => key !== 'id' && key !== 'label' && key !== 'group' && key !== 'type'
              )
              .map(([key, value]) => (
                <p key={key}>
                  <strong>{key}:</strong> {String(value)}
                </p>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedEdge && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute top-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700 text-white z-10 w-72"
          >
            <h3 className="text-lg font-semibold mb-2">Edge Details</h3>
            <p>
              <strong>Source:</strong> {selectedEdge.source}
            </p>
            <p>
              <strong>Target:</strong> {selectedEdge.target}
            </p>
            <p>
              <strong>Label:</strong> {selectedEdge.label}
            </p>
            {Object.entries(selectedEdge)
              .filter(([key]) => key !== 'source' && key !== 'target' && key !== 'label')
              .map(([key, value]) => (
                <p key={key}>
                  <strong>{key}:</strong> {String(value)}
                </p>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ===============================
// Main Application Component
// ===============================

const KnowledgeGraphApp = () => {
  const [kgData, setKgData] = useState<KnowledgeGraphData | null>(null);
  const [rawOutput, setRawOutput] = useState<string | null>(null); // State to store raw output
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [generationType, setGenerationType] = useState<'text' | 'file'>('text');
  const [inputText, setInputText] = useState('');
  const [inputFilePath, setInputFilePath] = useState<string>(''); // For file input
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isVisualizationEnabled, setIsVisualizationEnabled] = useState(true); // Toggle visualization

  // Knowledge Graph Extraction Functions
  const extractEntities = (text) => {
    // Basic entity extraction using regex patterns
    const personPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    const locationPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b(?:\s+(?:City|Country|State|Province|Region|Continent))\b/g;
    
    const persons = text.match(personPattern) || [];
    const locations = text.match(locationPattern) || [];
    
    // Remove duplicates and filter out locations from persons
    const uniquePersons = [...new Set(persons)].filter(person => !locations.includes(person));
    
    return {
      persons: uniquePersons,
      locations: locations
    };
  };

  const extractRelations = (text, entities) => {
    const relations = [];
    const sentences = text.split(/[.!?]+/);
    
    // Common relationship patterns
    const patterns = [
      {
        regex: /(\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b)\s+(?:is|was|were|are)\s+(?:a|an|the)\s+(\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b)/gi,
        label: 'is a'
      },
      {
        regex: /(\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b)\s+(?:lives|lived)\s+(?:in|at)\s+(\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b(?:\s+(?:City|Country|State|Province|Region|Continent))\b)/gi,
        label: 'lives in'
      },
      {
        regex: /(\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b)\s+(?:works|worked)\s+(?:at|for)\s+(\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b)/gi,
        label: 'works at'
      }
    ];

    sentences.forEach(sentence => {
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.regex.exec(sentence)) !== null) {
          const [_, source, target] = match;
          if (entities.persons.includes(source) || entities.locations.includes(source)) {
            if (entities.persons.includes(target) || entities.locations.includes(target)) {
              relations.push({
                source,
                target,
                label: pattern.label
              });
            }
          }
        }
      });
    });

    return relations;
  };

  // Update the generateKnowledgeGraph function
  const generateKnowledgeGraph = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Process the input text
      const processedText = inputText;
      
      // Extract entities and relations
      const entities = extractEntities(processedText);
      const relations = extractRelations(processedText, entities);
      
      // Convert to the KnowledgeGraphData format
      const nodes = [
        ...entities.persons.map((person, index) => ({
          id: `person-${index + 1}`,
          label: person,
          group: 'Person',
          type: 'Person'
        })),
        ...entities.locations.map((location, index) => ({
          id: `location-${index + 1}`,
          label: location,
          group: 'Location',
          type: 'Location'
        }))
      ];

      const edges = relations.map((rel, index) => ({
        id: `edge-${index + 1}`,
        source: nodes.find(n => n.label === rel.source)?.id || '',
        target: nodes.find(n => n.label === rel.target)?.id || '',
        label: rel.label
      }));

      const kgData = { nodes, edges };

      // Set the state
      setKgData(kgData);
      setRawOutput(JSON.stringify(kgData, null, 2));
    } catch (err) {
      setError(err.message || 'Failed to generate knowledge graph.');
      setKgData(null);
      setRawOutput(null);
    } finally {
      setIsLoading(false);
    }
  }, [inputText]);

  // Handle query input change
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  // Handle input text change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setInputFilePath(e.target.files[0].name);
    } else {
      setInputFilePath('');
    }
  };

  // Handle form submission (KG generation)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (generationType === 'text' && !inputText.trim()) {
      setError('Please enter text to generate the knowledge graph.');
      return;
    }
    if (generationType === 'file' && !inputFilePath) {
      setError('Please select a file to generate the knowledge graph.');
      return;
    }
    generateKnowledgeGraph();
  };

  // Handle search (basic filtering of the current KG data)
  const handleSearch = () => {
    if (!kgData) return;
    if (!query) {
      setKgData(kgData);
      return;
    }

    const filteredNodes = kgData.nodes.filter((node) =>
      node.label.toLowerCase().includes(query.toLowerCase())
    );
    const filteredEdges = kgData.edges.filter(
      (edge) =>
        edge.label.toLowerCase().includes(query.toLowerCase()) ||
        filteredNodes.some((node) => node.id === edge.source || node.id === edge.target)
    );

    setKgData({ nodes: filteredNodes, edges: filteredEdges });
  };

  const clearData = () => {
    setKgData(null);
    setQuery('');
    setInputText('');
    setInputFilePath('');
    setError(null);
    setIsDialogOpen(false);
    setRawOutput(null); // Clear raw output
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
            KG-Booster: Interactive Knowledge Graph Platform
          </h1>
          <p className="text-gray-400 mt-2">
            Generate, visualize, and explore knowledge graphs
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <a
              href="https://github.com/stair-lab/kg-gen"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              <Github className="w-4 h-4" />
              kg-gen Repository
            </a>
            <a
              href="https://github.com/your-repo/your-app" // Replace with your app's repo
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              <Github className="w-4 h-4" />
              App Repository
            </a>
          </div>
        </div>

        {/* Input and Control Section */}
        <Card className="bg-gray-800 border-gray-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Generate Knowledge Graph</CardTitle>
            <CardDescription className="text-gray-400">
              Generate a knowledge graph from text or a file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Select
                  value={generationType}
                  onValueChange={(value) => setGenerationType(value as 'text' | 'file')}
                >
                  <SelectTrigger className="w-full sm:w-64 bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select input type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="text" className="hover:bg-gray-700 text-white">
                      Text Input
                    </SelectItem>
                    <SelectItem value="file" className="hover:bg-gray-700 text-white">
                      File Input
                    </SelectItem>
                  </SelectContent>
                </Select>

                {generationType === 'text' && (
                  <Textarea
                    placeholder="Enter text to generate knowledge graph..."
                    value={inputText}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                    rows={4}
                  />
                )}
                {generationType === 'file' && (
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      onChange={handleFileChange}
                      className="w-full sm:w-auto bg-gray-700 border-gray-600 text-white file:bg-gray-600 file:border-gray-500 file:text-white file:mr-4"
                    />
                    {inputFilePath && (
                      <span className="text-gray-400 truncate max-w-[200px]">{inputFilePath}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-md transition-colors duration-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Graph'
                  )}
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                    >
                      Clear Data
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-800 border-gray-700 text-white">
                    <DialogHeader>
                      <DialogTitle className="text-lg text-white">Clear Data</DialogTitle>
                      <DialogDescription className="text-gray-400">
                        Are you sure you want to clear the generated knowledge graph and input
                        data?
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="destructive"
                        onClick={clearData}
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        Confirm Clear
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                      >
                        Cancel
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </form>
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-md flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search and Visualization Section */}
        <Card className="bg-gray-800 border-gray-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-white">
              {isVisualizationEnabled ? 'Visualize and Explore Knowledge Graph' : 'Explore Knowledge Graph Data'}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {isVisualizationEnabled
                ? 'Interact with the generated knowledge graph.'
                : 'View the knowledge graph data.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                type="text"
                placeholder="Search nodes and edges..."
                value={query}
                onChange={handleQueryChange}
                className="w-full sm:w-80 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              />
              <Button
                onClick={handleSearch}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-md transition-colors duration-200"
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsVisualizationEnabled((prev) => !prev)}
                className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
              >
                {isVisualizationEnabled ? 'Disable Visualization' : 'Enable Visualization'}
              </Button>
            </div>

            {kgData ? (
              isVisualizationEnabled ? (
                <KnowledgeGraphVisualization data={kgData} />
              ) : (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-auto max-h-[500px]">
                  <h3 className="text-lg font-semibold mb-4">Nodes</h3>
                  {kgData.nodes.length > 0 ? (
                    kgData.nodes.map((node) => (
                      <div
                        key={node.id}
                        className="mb-2 p-2 bg-gray-800 rounded-md border border-gray-700"
                      >
                        <NodeDisplay node={node} />
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">No nodes found.</p>
                  )}
                  <h3 className="text-lg font-semibold mt-6 mb-4">Edges</h3>
                  {kgData.edges.length > 0 ? (
                    kgData.edges.map((edge, index) => (
                      <div
                        key={index}
                        className="mb-2 p-2 bg-gray-800 rounded-md border border-gray-700"
                      >
                        <EdgeDisplay edge={edge} />
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">No edges found.</p>
                  )}
                </div>
              )
            ) : (
              <div className="bg-gray-900 border border-dashed border-gray-500 rounded-lg p-8 text-center">
                <Info className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400">
                  Generate a knowledge graph to visualize and explore it here.
                </p>
              </div>
            )}
            {/* Display Raw Output */}
            {rawOutput && (
              <div className="mt-8 bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-auto max-h-[300px]">
                <h3 className="text-lg font-semibold mb-2">Raw Output (kg-gen)</h3>
                <pre className="text-gray-300 font-mono text-sm whitespace-pre-wrap">
                  {rawOutput}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KnowledgeGraphApp;

