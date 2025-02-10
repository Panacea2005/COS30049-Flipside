import { useState, useEffect } from 'react';
import { neo4jClient } from '../client';
import * as d3 from 'd3';

interface NodeDatum extends d3.SimulationNodeDatum {
  id: string;
}

interface LinkDatum extends d3.SimulationLinkDatum<NodeDatum> {
  value: number;
  transactions: number;
  direction: 'in' | 'out';
  firstTransaction: string;
  lastTransaction: string;
}

export function useGraphData(address: string | null) {
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState<{ nodes: NodeDatum[]; links: LinkDatum[] }>({
    nodes: [],
    links: [],
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;

    const fetchGraphData = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await neo4jClient.getGraphData(address);
        if (data) {
          setGraphData({
            nodes: data.nodes.map(node => ({ ...node, id: node.id })),
            links: data.links.map(link => ({
              source: link.source,
              target: link.target,
              value: link.value,
              transactions: link.transactions,
              direction: link.direction as 'in' | 'out',
              firstTransaction: link.firstTransaction,
              lastTransaction: link.lastTransaction
            }))
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load graph data');
      } finally {
        setLoading(false);
      }
    };

    fetchGraphData();
  }, [address]);

  return { graphData, loading, error };
}