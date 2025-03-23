# InsightGraph

InsightGraph is a web application that generates interactive knowledge graphs from text input. It analyzes text using different methods (co-occurrence analysis, semantic analysis, and topic modeling) to visualize relationships between words and concepts.

## Features

- Text input with support for direct text entry
- Multiple analysis types:
  - Co-occurrence analysis
  - Semantic analysis (coming soon)
  - Topic modeling (coming soon)
- Interactive graph visualization
- Modern, responsive UI built with React and Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/insightgraph.git
cd insightgraph
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Enter or paste your text into the input area
2. Select an analysis type from the dropdown menu
3. Click "Analyze" to generate the knowledge graph
4. Interact with the graph by:
   - Dragging nodes to rearrange the layout
   - Hovering over nodes to see details
   - Clicking nodes or edges to explore relationships
   - Zooming in/out using the mouse wheel

## Project Structure

```
insightgraph/
├── src/
│   ├── components/
│   │   ├── ui/           # UI components (button, input, etc.)
│   │   └── GraphVisualization.tsx
│   │   
│   ├── services/
│   │   └── textAnalysis.ts
│   │   
│   ├── types/
│   │   └── graph.ts
│   │   
│   ├── App.tsx
│   │   
│   └── index.tsx
│   
├── public/
│   
├── package.json
│   
└── README.md
```

## Technologies Used

- React
- TypeScript
- Tailwind CSS
- Radix UI
- React Force Graph
- Framer Motion

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 