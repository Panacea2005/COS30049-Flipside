import { useState, useEffect } from 'react';
import { neo4jClient } from '../client';
import { GraphData, GraphNode, GraphLink, NodeDatum, LinkDatum } from '../types';

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
      // Import the service directly
      const { fetchEtherscanTransactions } = await import('../../../lib/etherscan/etherscanTransactionService');
      
      // Use the service directly
      const transactions = await fetchEtherscanTransactions(1, 100, address);
      
      if (!transactions || transactions.length === 0) {
        return null;
      }
      
      // Convert the transactions to graph format
      const nodes: GraphNode[] = [{ id: address, isSearched: true }];
      const processedAddresses = new Set<string>([address]);
      
      const links: GraphLink[] = [];
      
      transactions.forEach(tx => {
        // Process nodes (addresses)
        if (tx.toAddress && !processedAddresses.has(tx.toAddress)) {
          nodes.push({ id: tx.toAddress, isSearched: false });
          processedAddresses.add(tx.toAddress);
        }
        
        if (tx.fromAddress && !processedAddresses.has(tx.fromAddress)) {
          nodes.push({ id: tx.fromAddress, isSearched: false });
          processedAddresses.add(tx.fromAddress);
        }
        
        // Process links (transactions)
        if (tx.fromAddress && tx.toAddress) {
          const direction = tx.fromAddress.toLowerCase() === address.toLowerCase() ? 'out' : 'in';
          
          // Fix 1: Convert value from string to number
          const valueAsNumber = parseFloat(tx.value) || 0;
          
          links.push({
            source: tx.fromAddress,
            target: tx.toAddress,
            value: valueAsNumber, // Now a number instead of string
            transactions: 1,
            direction,
            firstTransaction: tx.timestamp,
            lastTransaction: tx.timestamp,
            hash: tx.hash,
            // Fix 2: Include all required Transaction properties
            transaction: {
              hash: tx.hash,
              fromAddress: tx.fromAddress,
              toAddress: tx.toAddress,
              value: tx.value,
              gas: tx.gas,
              gasPrice: tx.gasPrice,
              blockNumber: tx.blockNumber,
              timestamp: tx.timestamp,
              gasUsed: ''
            }
          });
        }
      });
      
      return { nodes, links };
    } catch (error) {
      console.error('Error fetching Etherscan data:', error);
      return null;
    }
  };

  return { graphData, loading, error };
}
