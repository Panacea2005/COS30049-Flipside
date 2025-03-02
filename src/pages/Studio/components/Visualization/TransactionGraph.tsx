import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useGraphData } from '../../../../lib/neo4j/hooks/useGraphData';
import { Transaction, NodeDatum, LinkDatum } from '../../../../lib/neo4j/types';

interface TransactionGraphProps {
  address: string;
  onNodeClick: (address: string) => void;
  onTransactionSelect: (transaction: Transaction | null) => void;
}

export const TransactionGraph = ({ address, onNodeClick, onTransactionSelect }: TransactionGraphProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { graphData, loading, error } = useGraphData(address);

  useEffect(() => {
    if (!svgRef.current || loading || !graphData.nodes.length || !graphData.links.length) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Create SVG container with white background
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .style('background', 'white')
      .style('border-radius', '8px')
      .style('box-shadow', '0 4px 6px -1px rgb(0 0 0 / 0.1)');

    // Add zoom functionality
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Create main group for graph elements
    const g = svg.append('g');

    // Calculate link strength based on value
    const linkScale = d3.scaleLinear()
      .domain([0, d3.max(graphData.links, d => d.value) || 1])
      .range([1, 3]);

    // Create forces
    const simulation = d3.forceSimulation<NodeDatum>(graphData.nodes)
      .force('link', d3.forceLink<NodeDatum, LinkDatum>(graphData.links)
        .id(d => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Create arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-10 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M-10,-5L0,0L-10,5')
      .attr('fill', '#CBD5E1');

    // Create links with click handling
    const link = g.append('g')
      .selectAll('line')
      .data(graphData.links)
      .join('line')
      .attr('stroke', '#CBD5E1')
      .attr('stroke-width', d => linkScale(d.value))
      .attr('marker-end', 'url(#arrowhead)')
      .style('cursor', 'pointer')
      .on('click', (event, d: LinkDatum) => {
        if (d.transaction) {
          onTransactionSelect(d.transaction);
        }
      })
      .on('mouseover', function(event: MouseEvent, d: LinkDatum) {
        d3.select(this)
          .attr('stroke', '#8B5CF6')
          .attr('stroke-width', linkScale(d.value) + 1);

        // Display transaction hash tooltip if available
        if (d.hash) {
          const [x, y] = [
            ((d.source as NodeDatum).x! + (d.target as NodeDatum).x!) / 2,
            ((d.source as NodeDatum).y! + (d.target as NodeDatum).y!) / 2
          ];

          g.append('text')
            .attr('class', 'tooltip')
            .attr('x', x)
            .attr('y', y - 10)
            .attr('text-anchor', 'middle')
            .attr('fill', '#4B5563')
            .attr('background', 'white')
            .attr('padding', '4px')
            .text(`Transaction: ${d.hash.substring(0, 10)}...`);
        }
      })
      .on('mouseout', function(event: MouseEvent, d: LinkDatum) {
        d3.select(this)
          .attr('stroke', '#CBD5E1')
          .attr('stroke-width', linkScale(d.value));

        // Remove tooltip
        g.selectAll('.tooltip').remove();
      });

    // Create nodes
    const node = g.append('g')
      .selectAll('g')
      .data(graphData.nodes)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer');

    // Add circles for nodes with different colors based on type
    node.append('circle')
      .attr('r', 12)
      .attr('fill', d => {
        // If this is the searched address
        if (d.id === address || d.isSearched) {
          return '#8B5CF6'; // Purple for the searched address
        }

        // Check if this node is from Etherscan data
        const hasDbConnection = graphData.links.some(link =>
          ((link.source as NodeDatum).id === d.id || (link.target as NodeDatum).id === d.id) &&
          !link.hash
        );

        return hasDbConnection ? '#E5E7EB' : '#93C5FD'; // Grey for DB nodes, light blue for Etherscan-only nodes
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add labels
    node.append('text')
      .text(d => `${d.id.substring(0, 6)}...`)
      .attr('dy', 25)
      .attr('text-anchor', 'middle')
      .attr('fill', '#4B5563')
      .style('font-size', '12px');

    // Add interactivity
    node.on('click', (_, d: NodeDatum) => onNodeClick(d.id))
      .on('mouseover', function(event: MouseEvent, d: NodeDatum) {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', 15);

        // Add full address tooltip on hover
        g.append('text')
          .attr('class', 'address-tooltip')
          .attr('x', d.x!)
          .attr('y', d.y! - 20)
          .attr('text-anchor', 'middle')
          .attr('fill', '#4B5563')
          .style('font-size', '10px')
          .style('background', 'white')
          .style('padding', '2px')
          .text(d.id);
      })
      .on('mouseout', function() {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', 12);

        // Remove tooltip
        g.selectAll('.address-tooltip').remove();
      });

    // Add drag behavior
    node.call(drag(simulation) as any);

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 150}, 20)`);

    // Legend items
    const legendItems = [
      { color: '#8B5CF6', label: 'Searched Address' },
      { color: '#E5E7EB', label: 'DB Address' },
      { color: '#93C5FD', label: 'Etherscan Address' }
    ];

    legendItems.forEach((item, i) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendItem.append('rect')
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', item.color);

      legendItem.append('text')
        .attr('x', 15)
        .attr('y', 9)
        .attr('font-size', '10px')
        .attr('fill', '#4B5563')
        .text(item.label);
    });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as NodeDatum).x!)
        .attr('y1', d => (d.source as NodeDatum).y!)
        .attr('x2', d => (d.target as NodeDatum).x!)
        .attr('y2', d => (d.target as NodeDatum).y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [graphData, address, loading, onNodeClick, onTransactionSelect]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg">
        <div className="text-gray-500">Loading graph...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg">
        <div className="text-red-500">Error loading graph data: {error}</div>
      </div>
    );
  }

  if (!graphData.nodes.length || !graphData.links.length) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg">
        <div className="text-gray-500">No transaction data found. Try searching for a different address.</div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <svg ref={svgRef} className="w-full h-full" />
      <div className="absolute bottom-4 right-4 bg-white p-2 rounded shadow-md text-xs">
        <p>Showing {graphData.nodes.length} addresses and {graphData.links.length} transactions</p>
        <p className="text-purple-600">Click on nodes to explore their transactions</p>
      </div>
    </div>
  );
};

const drag = (simulation: d3.Simulation<NodeDatum, undefined>) => {
  const dragstarted = (event: d3.D3DragEvent<SVGGElement, NodeDatum, NodeDatum>) => {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  };

  const dragged = (event: d3.D3DragEvent<SVGGElement, NodeDatum, NodeDatum>) => {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  };

  const dragended = (event: d3.D3DragEvent<SVGGElement, NodeDatum, NodeDatum>) => {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  };

  return d3.drag<SVGGElement, NodeDatum>()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
};
