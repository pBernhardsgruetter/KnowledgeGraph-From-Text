import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Graph from '../Graph';

const mockGraphData = {
  nodes: [
    { id: 'node1', label: 'Node 1', centrality: 0.5 },
    { id: 'node2', label: 'Node 2', centrality: 0.3 }
  ],
  edges: [
    { source: 'node1', target: 'node2', weight: 1 }
  ]
};

describe('Graph Component', () => {
  test('renders graph with provided data', () => {
    render(<Graph data={mockGraphData} />);
    
    // Check if nodes are rendered
    expect(screen.getByTestId('graph-container')).toBeInTheDocument();
    expect(screen.getByText('Node 1')).toBeInTheDocument();
    expect(screen.getByText('Node 2')).toBeInTheDocument();
  });

  test('handles empty graph data', () => {
    const emptyData = { nodes: [], edges: [] };
    render(<Graph data={emptyData} />);
    
    expect(screen.getByTestId('graph-container')).toBeInTheDocument();
    expect(screen.getByText('No data to display')).toBeInTheDocument();
  });

  test('responds to node click events', () => {
    const onNodeClick = jest.fn();
    render(<Graph data={mockGraphData} onNodeClick={onNodeClick} />);
    
    const node = screen.getByText('Node 1');
    fireEvent.click(node);
    
    expect(onNodeClick).toHaveBeenCalledWith('node1');
  });

  test('updates when graph data changes', () => {
    const { rerender } = render(<Graph data={mockGraphData} />);
    
    const newData = {
      nodes: [...mockGraphData.nodes, { id: 'node3', label: 'Node 3', centrality: 0.2 }],
      edges: [...mockGraphData.edges]
    };
    
    rerender(<Graph data={newData} />);
    expect(screen.getByText('Node 3')).toBeInTheDocument();
  });

  test('applies correct styling based on node centrality', () => {
    render(<Graph data={mockGraphData} />);
    
    const node1 = screen.getByText('Node 1').closest('g');
    const node2 = screen.getByText('Node 2').closest('g');
    
    expect(node1).toHaveAttribute('data-centrality', '0.5');
    expect(node2).toHaveAttribute('data-centrality', '0.3');
  });
}); 