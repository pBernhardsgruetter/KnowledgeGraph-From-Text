import networkx as nx
from typing import Dict, List, Tuple, Set, Optional
import math
import logging
from functools import lru_cache

class GraphService:
    def __init__(self):
        """Initialize the graph service with an empty graph."""
        self.graph = nx.Graph()
        self.logger = logging.getLogger(__name__)
        self._metrics_cache = {}

    def build_graph(self, tokens: List[str], cooccurrences: Dict[Tuple[str, str], int]) -> Dict:
        """
        Build a weighted graph from tokens and their co-occurrences.
        
        Args:
            tokens (List[str]): List of processed tokens
            cooccurrences (Dict[Tuple[str, str], int]): Dictionary of token pairs and their counts
            
        Returns:
            Dict: Graph data structure with normalized weights
        """
        try:
            # Clear existing graph and cache
            self.graph.clear()
            self._metrics_cache.clear()
            
            # Add nodes
            unique_tokens = set(tokens)
            self.graph.add_nodes_from(unique_tokens)
            
            # Add edges with weights
            max_weight = max(cooccurrences.values()) if cooccurrences else 1
            
            for (token1, token2), count in cooccurrences.items():
                # Normalize weight between 0 and 1
                normalized_weight = count / max_weight
                
                # Apply logarithmic scaling to prevent extreme differences
                log_weight = math.log1p(normalized_weight)
                
                self.graph.add_edge(token1, token2, 
                                  weight=normalized_weight,
                                  raw_count=count,
                                  log_weight=log_weight)
            
            # Calculate graph metrics
            return self._prepare_graph_data()
            
        except Exception as e:
            self.logger.error(f"Error building graph: {str(e)}")
            raise

    @lru_cache(maxsize=1)
    def calculate_betweenness_centrality(self) -> Dict[str, float]:
        """
        Calculate betweenness centrality for all nodes.
        Uses edge weights for path calculations.
        
        Returns:
            Dict[str, float]: Dictionary of node IDs to centrality scores
        """
        try:
            # Use inverse of weight for shortest path calculation
            # (higher weight = stronger connection = shorter path)
            weight_dict = {(u, v): 1/d['weight'] for u, v, d in self.graph.edges(data=True)}
            nx.set_edge_attributes(self.graph, weight_dict, 'distance')
            
            return nx.betweenness_centrality(
                self.graph,
                weight='distance',
                normalized=True
            )
        except Exception as e:
            self.logger.error(f"Error calculating betweenness centrality: {str(e)}")
            return {}

    @lru_cache(maxsize=1)
    def calculate_graph_metrics(self) -> Dict:
        """
        Calculate various graph metrics.
        
        Returns:
            Dict: Dictionary containing graph metrics
        """
        try:
            metrics = {
                'node_count': self.graph.number_of_nodes(),
                'edge_count': self.graph.number_of_edges(),
                'density': nx.density(self.graph),
                'average_clustering': nx.average_clustering(self.graph, weight='weight'),
                'average_degree': sum(dict(self.graph.degree()).values()) / self.graph.number_of_nodes()
            }
            
            # Calculate connected components
            components = list(nx.connected_components(self.graph))
            metrics['connected_components'] = len(components)
            
            # Calculate largest component size
            if components:
                largest_component = max(components, key=len)
                metrics['largest_component_size'] = len(largest_component)
                metrics['largest_component_ratio'] = len(largest_component) / self.graph.number_of_nodes()
            
            return metrics
            
        except Exception as e:
            self.logger.error(f"Error calculating graph metrics: {str(e)}")
            return {}

    def _prepare_graph_data(self) -> Dict:
        """
        Prepare graph data for frontend visualization.
        Includes node metrics and graph statistics.
        
        Returns:
            Dict: Graph data with nodes, edges, and metrics
        """
        try:
            # Calculate metrics if not in cache
            if not self._metrics_cache.get('betweenness'):
                self._metrics_cache['betweenness'] = self.calculate_betweenness_centrality()
            if not self._metrics_cache.get('metrics'):
                self._metrics_cache['metrics'] = self.calculate_graph_metrics()
            
            nodes = []
            edges = []
            
            # Prepare nodes with metrics
            for node in self.graph.nodes():
                nodes.append({
                    'id': node,
                    'label': node,
                    'degree': self.graph.degree(node),
                    'betweenness': self._metrics_cache['betweenness'].get(node, 0)
                })
            
            # Prepare edges with weights
            for (source, target, data) in self.graph.edges(data=True):
                edges.append({
                    'source': source,
                    'target': target,
                    'weight': data['weight'],
                    'log_weight': data['log_weight'],
                    'raw_count': data['raw_count']
                })
            
            return {
                'nodes': nodes,
                'edges': edges,
                'metrics': self._metrics_cache['metrics']
            }
            
        except Exception as e:
            self.logger.error(f"Error preparing graph data: {str(e)}")
            raise

    def filter_edges_by_weight(self, min_weight: float = 0.0) -> Dict:
        """
        Filter edges based on minimum weight threshold.
        
        Args:
            min_weight (float): Minimum weight threshold (0 to 1)
            
        Returns:
            Dict: Filtered graph data
        """
        try:
            filtered_graph = self.graph.copy()
            
            # Remove edges below threshold
            edges_to_remove = [
                (u, v) for u, v, d in filtered_graph.edges(data=True)
                if d['weight'] < min_weight
            ]
            filtered_graph.remove_edges_from(edges_to_remove)
            
            # Remove isolated nodes
            filtered_graph.remove_nodes_from(list(nx.isolates(filtered_graph)))
            
            # Update graph and clear cache
            self.graph = filtered_graph
            self._metrics_cache.clear()
            
            return self._prepare_graph_data()
            
        except Exception as e:
            self.logger.error(f"Error filtering edges: {str(e)}")
            raise

    def validate_graph(self) -> Tuple[bool, List[str]]:
        """
        Validate graph data structure.
        
        Returns:
            Tuple[bool, List[str]]: (is_valid, list of validation messages)
        """
        messages = []
        is_valid = True
        
        try:
            # Check for empty graph
            if self.graph.number_of_nodes() == 0:
                messages.append("Graph has no nodes")
                is_valid = False
            
            # Check for isolated nodes
            isolated_nodes = list(nx.isolates(self.graph))
            if isolated_nodes:
                messages.append(f"Found {len(isolated_nodes)} isolated nodes")
                is_valid = False
            
            # Check for missing weights
            edges_without_weights = [
                (u, v) for u, v, d in self.graph.edges(data=True)
                if 'weight' not in d
            ]
            if edges_without_weights:
                messages.append(f"Found {len(edges_without_weights)} edges without weights")
                is_valid = False
            
            # Check for invalid weights
            invalid_weights = [
                (u, v) for u, v, d in self.graph.edges(data=True)
                if d.get('weight', 0) <= 0 or d.get('weight', 0) > 1
            ]
            if invalid_weights:
                messages.append(f"Found {len(invalid_weights)} edges with invalid weights")
                is_valid = False
            
            return is_valid, messages
            
        except Exception as e:
            self.logger.error(f"Error validating graph: {str(e)}")
            messages.append(f"Error during validation: {str(e)}")
            return False, messages 