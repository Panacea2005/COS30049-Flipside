import { useState, useEffect } from 'react';
import { neo4jClient } from '../client';
import { Transaction, GraphData, GraphNode, GraphLink, EtherscanTransaction, NodeDatum, LinkDatum } from '../types';

export function useGraphData(address: string | null) {
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState<{ nodes: NodeDatum[]; links: LinkDatum[] }>({ nodes: [], links: [] });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;

    const fetchGraphData = async () => {
      setLoading(true);
      setError(null);

      try {
        let data = await neo4jClient.getGraphData(address);
        
        // If no data is found or we want to supplement with Etherscan data
        if (!data || data.nodes.length === 0 || data.links.length === 0) {
          const etherscanData = await fetchEtherscanTransactions(address);
          
          if (etherscanData) {
            // Merge database and Etherscan data
            if (!data) {
              data = etherscanData;
            } else {
              data.nodes = [...data.nodes, ...etherscanData.nodes.filter(node => !data.nodes.some(existingNode => existingNode.id === node.id))];
              data.links = [...data.links, ...etherscanData.links];
            }
          }
        }

        if (data) {
          setGraphData({
            nodes: data.nodes.map(node => ({
              ...node,
              id: node.id,
              isSearched: node.id === address
            })),
            links: data.links.map(link => ({
              source: link.source,
              target: link.target,
              value: link.value,
              transactions: link.transactions || 1,
              direction: link.direction as 'in' | 'out',
              firstTransaction: link.firstTransaction,
              lastTransaction: link.lastTransaction,
              hash: link.hash,
              transaction: link.transaction
            }))
          });
        } else {
          setGraphData({ nodes: [], links: [] });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load graph data');
      } finally {
        setLoading(false);
      }
    };

    fetchGraphData();
  }, [address]);

  const fetchEtherscanTransactions = async (address: string): Promise<GraphData | null> => {
    try {
      const response = await fetch(`/api/etherscan/transactions?address=${address}`);
      if (!response.ok) throw new Error('Failed to fetch from Etherscan');
      
      const data = await response.json();

      if (!data || !data.transactions || !Array.isArray(data.transactions)) {
        console.error('Invalid data format from Etherscan', data);
        return null;
      }

      const nodes: GraphNode[] = [{ id: address, isSearched: true }];
      const links: GraphLink[] = [];

      data.transactions.forEach((tx: EtherscanTransaction) => {
        const isOutgoing = tx.from.toLowerCase() === address.toLowerCase();
        const otherAddress = isOutgoing ? tx.to : tx.from;
        
        // Add node if not already added
        if (!nodes.some(node => node.id === otherAddress)) {
          nodes.push({ id: otherAddress });
        }

        const transaction: Transaction = {
          hash: tx.hash,
          fromAddress: tx.from,
          toAddress: tx.to,
          from: tx.from,
          to: tx.to,
          value: tx.value,
          gas: tx.gas,
          gasUsed: tx.gasUsed || "0",
          gasPrice: tx.gasPrice,
          timeStamp: tx.timeStamp,
          timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
          blockNumber: tx.blockNumber
        };

        links.push({
          source: isOutgoing ? address : otherAddress,
          target: isOutgoing ? otherAddress : address,
          value: parseFloat(tx.value) || 0.1,
          transactions: 1,
          direction: isOutgoing ? 'out' : 'in',
          firstTransaction: transaction.timestamp,
          lastTransaction: transaction.timestamp,
          hash: tx.hash,
          transaction: transaction
        });
      });

      return { nodes, links };
    } catch (error) {
      console.error('Error fetching Etherscan data:', error);
      return null;
    }
  };

  return { graphData, loading, error };
}
