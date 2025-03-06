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

    // Create SVG container with gradient background for better aesthetics
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .style('background', 'linear-gradient(to bottom right, #ffffff, #f8fafc)')
      .style('border-radius', '8px')
      .style('box-shadow', '0 4px 15px -1px rgb(0 0 0 / 0.1)');

    // Add defs for patterns and filters
    const defs = svg.append('defs');

    // Create improved glow filter for highlighted elements
    const filter = defs.append('filter')
      .attr('id', 'glow-effect')
      .attr('height', '200%')
      .attr('width', '200%')
      .attr('x', '-50%')
      .attr('y', '-50%');
    
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');
    
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode')
      .attr('in', 'coloredBlur');
    feMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic');

    // Add zoom functionality with smoother transitions
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 5])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr('transform', event.transform.toString());
      });

    svg.call(zoom);

    // Double-click to reset zoom with smoother animation
    svg.on('dblclick.zoom', () => {
      svg.transition()
        .duration(950)
        .call(zoom.transform, d3.zoomIdentity);
    });

    // Create main group for graph elements
    const g = svg.append('g');

    // Calculate link strength based on value
    const linkScale = d3.scaleLinear()
      .domain([0, d3.max(graphData.links, d => d.value) || 1])
      .range([1, 4]);

    // Create forces with improved parameters for better spacing
    const simulation = d3.forceSimulation<NodeDatum>(graphData.nodes)
      .force('link', d3.forceLink<NodeDatum, LinkDatum>(graphData.links)
        .id(d => d.id)
        .distance(150))
      .force('charge', d3.forceManyBody()
        .strength(-400)
        .distanceMax(600))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40))
      .force('x', d3.forceX(width / 2).strength(0.07))
      .force('y', d3.forceY(height / 2).strength(0.07));

    // Create improved arrow marker with cleaner design
    const arrowMarker = defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-5 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto');
    
    arrowMarker.append('path')
      .attr('d', 'M-4,-4L1,0L-4,4Z')
      .attr('fill', '#94a3b8');

    // Highlighted arrow for hover states
    defs.append('marker')
      .attr('id', 'arrowhead-highlighted')
      .attr('viewBox', '-5 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M-4,-4L1,0L-4,4Z')
      .attr('fill', '#8b5cf6');

    // Create link group
    const linkGroup = g.append('g').attr('class', 'links');

    // Create links with STRAIGHT PATHS instead of curves
    const link = linkGroup.selectAll('line')
      .data(graphData.links)
      .join('line')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', d => linkScale(d.value))
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', 'url(#arrowhead)')
      .style('cursor', 'pointer')
      .on('click', (event: MouseEvent, d: LinkDatum) => {
        if (d.transaction) {
          onTransactionSelect(d.transaction);
          
          // Highlight the selected link
          link.attr('stroke', '#cbd5e1')
            .attr('marker-end', 'url(#arrowhead)')
            .attr('filter', null)
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', (d: LinkDatum) => linkScale(d.value));
          
          d3.select(event.currentTarget as Element)
            .attr('stroke', '#8b5cf6')
            .attr('stroke-width', linkScale(d.value) + 1.5)
            .attr('stroke-opacity', 1)
            .attr('marker-end', 'url(#arrowhead-highlighted)')
            .attr('filter', 'url(#glow-effect)');
        }
      })
      .on('mouseover', function(event: MouseEvent, d: LinkDatum) {
        d3.select(this)
          .attr('stroke', '#8b5cf6')
          .attr('stroke-width', linkScale(d.value) + 1.5)
          .attr('stroke-opacity', 1)
          .attr('marker-end', 'url(#arrowhead-highlighted)');

        // Create improved tooltip
        if (d.hash) {
          const sourceNode = d.source as NodeDatum;
          const targetNode = d.target as NodeDatum;
          const x = (sourceNode.x ?? 0) + (targetNode.x ?? 0) / 2;
          const y = (sourceNode.y ?? 0) + (targetNode.y ?? 0) / 2;

          const tooltip = g.append('g')
            .attr('class', 'tooltip')
            .attr('transform', `translate(${x}, ${y - 25})`);

          // Tooltip background with improved style
          tooltip.append('rect')
            .attr('x', -85)
            .attr('y', -18)
            .attr('width', 170)
            .attr('height', 28)
            .attr('rx', 6)
            .attr('fill', 'white')
            .attr('stroke', '#e2e8f0')
            .attr('stroke-width', 1)
            .attr('filter', 'url(#glow-effect)');

          // Tooltip text
          tooltip.append('text')
            .attr('text-anchor', 'middle')
            .attr('fill', '#64748b')
            .attr('font-size', '12px')
            .attr('dy', '-2')
            .text(`TX: ${d.hash.substring(0, 10)}...`);
        }
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('stroke', '#cbd5e1')
          .attr('marker-end', 'url(#arrowhead)')
          .attr('filter', null)
          .attr('stroke-opacity', 0.6)
          .attr('stroke-width', (d: LinkDatum) => linkScale(d.value) as number);

        // Remove tooltip
        g.selectAll('.tooltip').remove();
      });

    // Create animated particles for transaction flow with enhanced appearance
    const particleGroup = g.append('g').attr('class', 'particles');

    // Create nodes group
    const nodeGroup = g.append('g').attr('class', 'nodes');

    // Create nodes with enhanced appearance
    const node = nodeGroup.selectAll('g')
      .data(graphData.nodes)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer');

    // Define node colors with improved palette
    const getNodeColor = (d: NodeDatum) => {
      // If this is the searched address
      if (d.id === address || d.isSearched) {
        return '#8b5cf6'; // Purple for the searched address
      }

      // Check if this node is from Etherscan data
      const hasDbConnection = graphData.links.some(link =>
        ((link.source as NodeDatum).id === d.id || (link.target as NodeDatum).id === d.id) &&
        !link.hash
      );

      return hasDbConnection ? '#475569' : '#3b82f6'; // Darker slate for DB nodes, brighter blue for Etherscan-only nodes
    };

    // Enhanced pulse effect for searched address with multiple rings
    node.filter(d => d.id === address || d.isSearched === true)
      .append('circle')
      .attr('r', 22)
      .attr('fill', 'none')
      .attr('stroke', '#8b5cf6')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0.6)
      .attr('class', 'pulse-ring-outer');

    node.filter(d => d.id === address || d.isSearched === true)
      .append('circle')
      .attr('r', 18)
      .attr('fill', 'none')
      .attr('stroke', '#8b5cf6')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2')
      .attr('opacity', 0.4)
      .attr('class', 'pulse-ring-inner');

    // Add improved animation for the pulsing effect
    const pulseAnimation = () => {
      d3.selectAll('.pulse-ring-outer')
        .attr('r', 22)
        .attr('opacity', 0.6)
        .transition()
        .duration(2000)
        .attr('r', 32)
        .attr('opacity', 0)
        .on('end', pulseAnimation);

      d3.selectAll('.pulse-ring-inner')
        .attr('r', 18)
        .attr('opacity', 0.4)
        .transition()
        .duration(2000)
        .delay(500)
        .attr('r', 28)
        .attr('opacity', 0);
    };

    pulseAnimation();

    // Add node circles with improved styling
    node.append('circle')
      .attr('r', 14)
      .attr('fill', d => getNodeColor(d))
      .attr('stroke', 'white')
      .attr('stroke-width', 2.5)
      .attr('filter', 'url(#glow-effect)');

    // Add gradient for more attractive nodes
    graphData.nodes.forEach((d, i) => {
      const color = getNodeColor(d);
      const gradientId = `gradient-${i}`;
      
      const gradient = defs.append('radialGradient')
        .attr('id', gradientId)
        .attr('cx', '30%')
        .attr('cy', '30%')
        .attr('r', '70%');
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d3.rgb(color).brighter(0.5).toString());
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', color);
      
      node.filter(node => node.id === d.id)
        .select('circle')
        .attr('fill', `url(#${gradientId})`);
    });

    // Add address labels with better styling
    node.append('text')
      .text(d => `${d.id.substring(0, 6)}...`)
      .attr('dy', 30)
      .attr('text-anchor', 'middle')
      .attr('fill', '#1e293b')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold');

    // Add highlight circle for interactive feedback
    node.append('circle')
      .attr('r', 18)
      .attr('fill', 'transparent')
      .attr('stroke', 'transparent')
      .attr('stroke-width', 8)
      .attr('class', 'highlight-circle');

    // Add enhanced interactivity for nodes
    node.on('click', (_: MouseEvent, d: NodeDatum) => onNodeClick(d.id))
      .on('mouseover', function(_: MouseEvent, d: NodeDatum) {
        // Highlight the hovered node
        d3.select(this).select('circle')
          .transition()
          .duration(300)
          .attr('r', 18);
          
        d3.select(this).select('.highlight-circle')
          .transition()
          .duration(300)
          .attr('stroke', d3.rgb(getNodeColor(d)).brighter(0.3).toString())
          .attr('stroke-opacity', 0.3);

        // Create enhanced address tooltip
        const tooltip = g.append('g')
          .attr('class', 'address-tooltip')
          .attr('transform', `translate(${d.x ?? 0}, ${(d.y ?? 0) - 35})`);

        // Tooltip background with improved style
        tooltip.append('rect')
          .attr('x', -100)
          .attr('y', -18)
          .attr('width', 200)
          .attr('height', 28)
          .attr('rx', 6)
          .attr('fill', 'white')
          .attr('stroke', '#e2e8f0')
          .attr('stroke-width', 1)
          .attr('filter', 'url(#glow-effect)');

        // Tooltip address text
        tooltip.append('text')
          .attr('text-anchor', 'middle')
          .attr('fill', '#1e293b')
          .attr('font-size', '12px')
          .attr('font-weight', 'medium')
          .attr('dy', '-2')
          .text(d.id);
      })
      .on('mouseout', function() {
        // Reset the node size
        d3.select(this).select('circle')
          .transition()
          .duration(300)
          .attr('r', 14);
          
        d3.select(this).select('.highlight-circle')
          .transition()
          .duration(300)
          .attr('stroke', 'transparent');

        // Remove tooltip
        g.selectAll('.address-tooltip').remove();
      });

    // Update STRAIGHT link positions
    const updateLinkPositions = () => {
      link
        .attr('x1', d => (d.source as NodeDatum).x ?? 0)
        .attr('y1', d => (d.source as NodeDatum).y ?? 0)
        .attr('x2', d => (d.target as NodeDatum).x ?? 0)
        .attr('y2', d => (d.target as NodeDatum).y ?? 0);
    };    

    // Create enhanced animated particles for transaction flow
    const createParticles = () => {
      // Remove old particles
      particleGroup.selectAll('.particle').remove();
      
      // Create new particles for each link
      graphData.links.forEach((d: LinkDatum) => {
        if (Math.random() > 0.7) return; // Only animate some links for performance
        
        const sourceNode = d.source as NodeDatum;
        const targetNode = d.target as NodeDatum;
        
        if (!sourceNode.x || !targetNode.x) return; // Skip if positions aren't set
        
        // Create multiple particles per link for cooler effect
        const particleCount = Math.floor(Math.random() * 2) + 1;
        
        for (let j = 0; j < particleCount; j++) {
          // Add particle with randomized delay
          const particle = particleGroup.append('circle')
            .attr('class', 'particle')
            .attr('r', 3 + Math.random() * 2)
            .attr('cx', sourceNode.x)
            .attr('cy', sourceNode.y)
            .attr('fill', getNodeColor(targetNode))
            .attr('filter', 'url(#glow-effect)')
            .attr('opacity', 0.7);

          // Get link length for animation timing
          const dx = targetNode.x - sourceNode.x;
          const dy = (targetNode.y ?? 0) - (sourceNode.y ?? 0);
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Animate particle along straight path
          particle
            .transition()
            .delay(j * 200 + Math.random() * 500)  // Staggered start for multiple particles
            .duration(1500 + distance) // Duration based on distance
            .attr('cx', targetNode.x)
            .attr('cy', targetNode.y ?? 0)
            .on('end', function() {
              // Add "splash" effect at target node
              const splash = particleGroup.append('circle')
                .attr('cx', targetNode.x)
                .attr('cy', targetNode.y)
                .attr('r', 5)
                .attr('fill', 'none')
                .attr('stroke', getNodeColor(targetNode))
                .attr('stroke-width', 2)
                .attr('opacity', 0.7);
                
              // Animate splash and remove
              splash.transition()
                .duration(500)
                .attr('r', 15)
                .attr('opacity', 0)
                .remove();
                
              // Remove particle
              d3.select(this).remove();
            });
        }
      });
    };

    // Add drag behavior
    node.call(drag(simulation) as any);

    // Add modern legend with improved styling
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 180}, 20)`);
    
    // Legend background for better visibility
    legend.append('rect')
      .attr('x', -10)
      .attr('y', -10)
      .attr('width', 170)
      .attr('height', 90)
      .attr('rx', 6)
      .attr('fill', 'white')
      .attr('opacity', 0.8)
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1);
    
    // Legend title
    legend.append('text')
      .attr('x', 0)
      .attr('y', 5)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#1e293b')
      .text('Network Legend');
    
    // Legend items
    const legendItems = [
      { color: '#8b5cf6', label: 'Searched Address' },
      { color: '#475569', label: 'Neo4j Address' },
      { color: '#3b82f6', label: 'Etherscan Address' }
    ];

    legendItems.forEach((item, i) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${i * 20 + 25})`);

      // Create gradient for legend items too
      const gradientId = `legend-gradient-${i}`;
      const gradient = defs.append('radialGradient')
        .attr('id', gradientId)
        .attr('cx', '30%')
        .attr('cy', '30%')
        .attr('r', '70%');
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d3.rgb(item.color).brighter(0.5).toString());
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', item.color);

      legendItem.append('circle')
        .attr('r', 6)
        .attr('fill', `url(#${gradientId})`)
        .attr('stroke', 'white')
        .attr('stroke-width', 1);

      legendItem.append('text')
        .attr('x', 15)
        .attr('y', 4)
        .attr('font-size', '11px')
        .attr('fill', '#475569')
        .text(item.label);
    });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      // Update link positions (STRAIGHT LINKS)
      updateLinkPositions();
      
      // Update node positions
      node.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    // Start particle animations more frequently for cooler effect
    simulation.on('end', () => {
      createParticles();
      setInterval(createParticles, 3000);
    });

    return () => {
      simulation.stop();
    };
  }, [graphData, address, loading, onNodeClick, onTransactionSelect]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-white to-slate-50 rounded-lg">
        <div className="text-gray-500 flex flex-col items-center">
          <svg className="animate-spin h-8 w-8 mb-3 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div className="text-lg">Loading transaction graph...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg">
        <div className="text-red-500 p-4 bg-red-50 rounded-lg border border-red-200">
          Error loading graph data: {error}
        </div>
      </div>
    );
  }

  if (!graphData.nodes.length || !graphData.links.length) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg">
        <div className="text-gray-500 p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium">No transaction data found</p>
          <p className="mt-1">Try searching for a different address with more transaction history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <svg ref={svgRef} className="w-full h-full" />
      <div className="absolute bottom-4 right-4 bg-white/90 p-3 rounded-lg shadow-lg text-sm">
        <div className="flex items-center space-x-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-purple-600"></div>
          <p className="font-medium">Showing {graphData.nodes.length} addresses and {graphData.links.length} transactions</p>
        </div>
        <p className="text-purple-700 font-medium flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Click on nodes to explore their transactions
        </p>
      </div>
    </div>
  );
};

// Helper function for drag behavior
function drag(simulation: d3.Simulation<NodeDatum, undefined>) {
  function dragstarted(event: d3.D3DragEvent<SVGGElement, NodeDatum, NodeDatum>) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event: d3.D3DragEvent<SVGGElement, NodeDatum, NodeDatum>) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event: d3.D3DragEvent<SVGGElement, NodeDatum, NodeDatum>) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  return d3.drag<SVGGElement, NodeDatum>()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
}