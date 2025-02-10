import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useGraphData } from '../../../../lib/neo4j/hooks/useGraphData';
import { Transaction } from '../../../../lib/neo4j/types';

interface TransactionGraphProps {
  address: string;
  onNodeClick: (address: string) => void;
  onTransactionSelect: (transaction: Transaction | null) => void;
}

interface NodeDatum extends d3.SimulationNodeDatum {
  id: string;
  value?: number;
}

interface LinkDatum extends d3.SimulationLinkDatum<NodeDatum> {
  value: number;
  hash?: string;
  transaction?: Transaction;
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
      .on('mouseover', function(event, d: LinkDatum) {
        d3.select(this)
          .attr('stroke', '#8B5CF6')
          .attr('stroke-width', linkScale(d.value) + 1);
      })
      .on('mouseout', function(event, d: LinkDatum) {
        d3.select(this)
          .attr('stroke', '#CBD5E1')
          .attr('stroke-width', linkScale(d.value));
      });

    // Create nodes
    const node = g.append('g')
      .selectAll('g')
      .data(graphData.nodes)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer');

    // Add circles for nodes
    node.append('circle')
      .attr('r', 12)
      .attr('fill', d => d.id === address ? '#8B5CF6' : '#E5E7EB')
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
    node.on('click', (_, d) => onNodeClick(d.id))
      .on('mouseover', function() {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', 15);
      })
      .on('mouseout', function() {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', 12);
      });

    // Add drag behavior
    node.call(drag(simulation) as any);

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
        <div className="text-gray-500">No transaction data to display</div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <svg ref={svgRef} className="w-full h-full" />
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