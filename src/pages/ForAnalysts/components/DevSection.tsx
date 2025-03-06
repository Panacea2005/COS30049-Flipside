import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Container } from "../../../components/layout/Container";

const mockData = {
  nodes: [
    { id: "0x1234...", value: 50, x: 0, y: 0, vx: 0, vy: 0, isSearched: true }, // Central node
    { id: "0x2345...", value: 10, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "0x3456...", value: 20, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "0x4567...", value: 30, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "0x5678...", value: 40, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "0x6789...", value: 50, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "0x7890...", value: 60, x: 0, y: 0, vx: 0, vy: 0 },
  ],
  links: [
    { source: "0x1234...", target: "0x2345...", value: 1, hash: "0xa1b2c3..." },
    { source: "0x1234...", target: "0x3456...", value: 2, hash: "0xd4e5f6..." },
    { source: "0x1234...", target: "0x4567...", value: 3, hash: "0xg7h8i9..." },
    { source: "0x1234...", target: "0x5678...", value: 4, hash: "0xj1k2l3..." },
    { source: "0x1234...", target: "0x6789...", value: 5, hash: "0xm4n5o6..." },
    { source: "0x1234...", target: "0x7890...", value: 6, hash: "0xp7q8r9..." },
  ],
};

export const DevSection = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Create SVG container with gradient background
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("background", "linear-gradient(to bottom right, #ffffff, #f8fafc)")
      .style("border-radius", "8px")
      .style("box-shadow", "0 4px 15px -1px rgb(0 0 0 / 0.1)");

    // Add defs for patterns and filters
    const defs = svg.append("defs");

    // Create improved glow filter for highlighted elements
    const filter = defs
      .append("filter")
      .attr("id", "glow-effect")
      .attr("height", "200%")
      .attr("width", "200%")
      .attr("x", "-50%")
      .attr("y", "-50%");

    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Add zoom functionality with smoother transitions
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 5])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr("transform", event.transform.toString());
      });

    svg.call(zoom);

    // Double-click to reset zoom with smoother animation
    svg.on("dblclick.zoom", () => {
      svg.transition().duration(950).call(zoom.transform, d3.zoomIdentity);
    });

    // Create main group for graph elements
    const g = svg.append("g");

    // Calculate link strength based on value
    const linkScale = d3
      .scaleLinear()
      .domain([0, d3.max(mockData.links, (d) => d.value) || 1])
      .range([1, 4]);

    // Create forces with improved parameters for better spacing
    const simulation = d3
      .forceSimulation(mockData.nodes)
      .force(
        "link",
        d3
          .forceLink(mockData.links)
          .id((d) => (d as any).id)
          .distance(150)
      )
      .force("charge", d3.forceManyBody().strength(-400).distanceMax(600))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40))
      .force("x", d3.forceX(width / 2).strength(0.07))
      .force("y", d3.forceY(height / 2).strength(0.07));

    // Create improved arrow marker with cleaner design
    const arrowMarker = defs
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-5 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 7)
      .attr("markerHeight", 7)
      .attr("orient", "auto");

    arrowMarker
      .append("path")
      .attr("d", "M-4,-4L1,0L-4,4Z")
      .attr("fill", "#94a3b8");

    // Highlighted arrow for hover states
    defs
      .append("marker")
      .attr("id", "arrowhead-highlighted")
      .attr("viewBox", "-5 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 7)
      .attr("markerHeight", 7)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M-4,-4L1,0L-4,4Z")
      .attr("fill", "#8b5cf6");

    // Create link group
    const linkGroup = g.append("g").attr("class", "links");

    // Create links with straight paths
    const link = linkGroup
      .selectAll("line")
      .data(mockData.links)
      .join("line")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", (d) => linkScale(d.value))
      .attr("stroke-opacity", 0.6)
      .attr("marker-end", "url(#arrowhead)")
      .style("cursor", "pointer")
      .on("click", function (event: MouseEvent, d: any) {
        // Highlight the selected link
        link
          .attr("stroke", "#cbd5e1")
          .attr("marker-end", "url(#arrowhead)")
          .attr("filter", null)
          .attr("stroke-opacity", 0.6)
          .attr("stroke-width", (d: any) => linkScale(d.value));

        d3.select(this)
          .attr("stroke", "#8b5cf6")
          .attr("stroke-width", linkScale(d.value) + 1.5)
          .attr("stroke-opacity", 1)
          .attr("marker-end", "url(#arrowhead-highlighted)")
          .attr("filter", "url(#glow-effect)");
      })
      .on("mouseover", function (event: MouseEvent, d: any) {
        d3.select(this)
          .attr("stroke", "#8b5cf6")
          .attr("stroke-width", linkScale(d.value) + 1.5)
          .attr("stroke-opacity", 1)
          .attr("marker-end", "url(#arrowhead-highlighted)");

        // Create improved tooltip
        if (d.hash) {
          const sourceNode = d.source as any;
          const targetNode = d.target as any;
          const x = (sourceNode.x || 0) + (targetNode.x || 0) / 2;
          const y = (sourceNode.y || 0) + (targetNode.y || 0) / 2;

          const tooltip = g
            .append("g")
            .attr("class", "tooltip")
            .attr("transform", `translate(${x}, ${y - 25})`);

          // Tooltip background with improved style
          tooltip
            .append("rect")
            .attr("x", -85)
            .attr("y", -18)
            .attr("width", 170)
            .attr("height", 28)
            .attr("rx", 6)
            .attr("fill", "white")
            .attr("stroke", "#e2e8f0")
            .attr("stroke-width", 1)
            .attr("filter", "url(#glow-effect)");

          // Tooltip text
          tooltip
            .append("text")
            .attr("text-anchor", "middle")
            .attr("fill", "#64748b")
            .attr("font-size", "12px")
            .attr("dy", "-2")
            .text(`TX: ${d.hash.substring(0, 10)}...`);
        }
      })
      .on("mouseout", function () {
        d3.select(this)
          .attr("stroke", "#cbd5e1")
          .attr("marker-end", "url(#arrowhead)")
          .attr("filter", null)
          .attr("stroke-opacity", 0.6)
          .attr("stroke-width", (d: any) => linkScale(d.value));

        // Remove tooltip
        g.selectAll(".tooltip").remove();
      });

    // Create animated particles for transaction flow
    const particleGroup = g.append("g").attr("class", "particles");

    // Create nodes group
    const nodeGroup = g.append("g").attr("class", "nodes");

    // Create nodes with enhanced appearance
    const node = nodeGroup
      .selectAll("g")
      .data(mockData.nodes)
      .join("g")
      .attr("class", "node")
      .style("cursor", "pointer");

    // Define node colors
    const getNodeColor = (d: any) => {
      // If this is the central node
      if (d.id === "0x1234..." || d.isSearched) {
        return "#8b5cf6"; // Purple for the central address
      }

      // Alternate between styles
      return d.value % 20 === 0 ? "#475569" : "#3b82f6";
    };

    // Enhanced pulse effect for central address with multiple rings
    node
      .filter((d) => d.id === "0x1234..." || d.isSearched === true)
      .append("circle")
      .attr("r", 22)
      .attr("fill", "none")
      .attr("stroke", "#8b5cf6")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "3,3")
      .attr("opacity", 0.6)
      .attr("class", "pulse-ring-outer");

    node
      .filter((d) => d.id === "0x1234..." || d.isSearched === true)
      .append("circle")
      .attr("r", 18)
      .attr("fill", "none")
      .attr("stroke", "#8b5cf6")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "2,2")
      .attr("opacity", 0.4)
      .attr("class", "pulse-ring-inner");

    // Add animation for the pulsing effect
    const pulseAnimation = () => {
      d3.selectAll(".pulse-ring-outer")
        .attr("r", 22)
        .attr("opacity", 0.6)
        .transition()
        .duration(2000)
        .attr("r", 32)
        .attr("opacity", 0)
        .on("end", pulseAnimation);

      d3.selectAll(".pulse-ring-inner")
        .attr("r", 18)
        .attr("opacity", 0.4)
        .transition()
        .duration(2000)
        .delay(500)
        .attr("r", 28)
        .attr("opacity", 0);
    };

    pulseAnimation();

    // Add node circles with improved styling
    node
      .append("circle")
      .attr("r", 14)
      .attr("fill", (d) => getNodeColor(d))
      .attr("stroke", "white")
      .attr("stroke-width", 2.5)
      .attr("filter", "url(#glow-effect)");

    // Add gradient for more attractive nodes
    mockData.nodes.forEach((d, i) => {
      const color = getNodeColor(d);
      const gradientId = `gradient-${i}`;

      const gradient = defs
        .append("radialGradient")
        .attr("id", gradientId)
        .attr("cx", "30%")
        .attr("cy", "30%")
        .attr("r", "70%");

      gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", d3.rgb(color).brighter(0.5).toString());

      gradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", color);

      node
        .filter((node) => node.id === d.id)
        .select("circle")
        .attr("fill", `url(#${gradientId})`);
    });

    // Add address labels with better styling
    node
      .append("text")
      .text((d) => `${d.id.substring(0, 6)}...`)
      .attr("dy", 30)
      .attr("text-anchor", "middle")
      .attr("fill", "#1e293b")
      .attr("font-size", "12px")
      .attr("font-weight", "bold");

    // Add highlight circle for interactive feedback
    node
      .append("circle")
      .attr("r", 18)
      .attr("fill", "transparent")
      .attr("stroke", "transparent")
      .attr("stroke-width", 8)
      .attr("class", "highlight-circle");

    // Add enhanced interactivity for nodes
    node
      .on("click", function (_, d: any) {
        // Highlight the selected node
        nodeGroup.selectAll("circle").attr("r", 14);
        d3.select(this).select("circle").attr("r", 18);

        // Highlight links connected to this node
        link
          .attr("stroke", "#cbd5e1")
          .attr("stroke-opacity", 0.3)
          .attr("marker-end", "url(#arrowhead)");

        link
          .filter(
            (l: any) =>
              (l.source.id || l.source) === d.id ||
              (l.target.id || l.target) === d.id
          )
          .attr("stroke", "#8b5cf6")
          .attr("stroke-opacity", 1)
          .attr("marker-end", "url(#arrowhead-highlighted)");
      })
      .on("mouseover", function (_: MouseEvent, d: any) {
        // Highlight the hovered node
        d3.select(this)
          .select("circle")
          .transition()
          .duration(300)
          .attr("r", 18);

        d3.select(this)
          .select(".highlight-circle")
          .transition()
          .duration(300)
          .attr("stroke", d3.rgb(getNodeColor(d)).brighter(0.3).toString())
          .attr("stroke-opacity", 0.3);

        // Create enhanced address tooltip
        const tooltip = g
          .append("g")
          .attr("class", "address-tooltip")
          .attr("transform", `translate(${d.x || 0}, ${(d.y || 0) - 35})`);

        // Tooltip background with improved style
        tooltip
          .append("rect")
          .attr("x", -100)
          .attr("y", -18)
          .attr("width", 200)
          .attr("height", 28)
          .attr("rx", 6)
          .attr("fill", "white")
          .attr("stroke", "#e2e8f0")
          .attr("stroke-width", 1)
          .attr("filter", "url(#glow-effect)");

        // Tooltip address text
        tooltip
          .append("text")
          .attr("text-anchor", "middle")
          .attr("fill", "#1e293b")
          .attr("font-size", "12px")
          .attr("font-weight", "medium")
          .attr("dy", "-2")
          .text(d.id);
      })
      .on("mouseout", function () {
        // Reset the node size
        d3.select(this).select("circle").transition().duration(300).attr("r", 14);

        d3.select(this)
          .select(".highlight-circle")
          .transition()
          .duration(300)
          .attr("stroke", "transparent");

        // Remove tooltip
        g.selectAll(".address-tooltip").remove();
      });

    // Update straight link positions
    const updateLinkPositions = () => {
      link
        .attr("x1", (d) => ((d.source as any).x || (d.source as any).x))
        .attr("y1", (d) => ((d.source as any).y || (d.source as any).y))
        .attr("x2", (d) => ((d.target as any).x || (d.target as any).x))
        .attr("y2", (d) => ((d.target as any).y || (d.target as any).y));
    };

    // Create enhanced animated particles for transaction flow
    const createParticles = () => {
      // Remove old particles
      particleGroup.selectAll(".particle").remove();

      // Create new particles for each link
      mockData.links.forEach((d: any) => {
        if (Math.random() > 0.7) return; // Only animate some links for performance

        const sourceNode = d.source as any;
        const targetNode = d.target as any;

        if (!sourceNode.x || !targetNode.x) return; // Skip if positions aren't set

        // Create multiple particles per link for cooler effect
        const particleCount = Math.floor(Math.random() * 2) + 1;

        for (let j = 0; j < particleCount; j++) {
          // Add particle with randomized delay
          const particle = particleGroup
            .append("circle")
            .attr("class", "particle")
            .attr("r", 3 + Math.random() * 2)
            .attr("cx", sourceNode.x)
            .attr("cy", sourceNode.y)
            .attr("fill", getNodeColor(targetNode))
            .attr("filter", "url(#glow-effect)")
            .attr("opacity", 0.7);

          // Get link length for animation timing
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Animate particle along straight path
          particle
            .transition()
            .delay(j * 200 + Math.random() * 500) // Staggered start for multiple particles
            .duration(1500 + distance) // Duration based on distance
            .attr("cx", targetNode.x)
            .attr("cy", targetNode.y)
            .on("end", function () {
              // Add "splash" effect at target node
              const splash = particleGroup
                .append("circle")
                .attr("cx", targetNode.x)
                .attr("cy", targetNode.y)
                .attr("r", 5)
                .attr("fill", "none")
                .attr("stroke", getNodeColor(targetNode))
                .attr("stroke-width", 2)
                .attr("opacity", 0.7);

              // Animate splash and remove
              splash
                .transition()
                .duration(500)
                .attr("r", 15)
                .attr("opacity", 0)
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
    const legend = svg
      .append("g")
      .attr("transform", `translate(${width - 180}, 20)`);

    // Legend background for better visibility
    legend
      .append("rect")
      .attr("x", -10)
      .attr("y", -10)
      .attr("width", 170)
      .attr("height", 90)
      .attr("rx", 6)
      .attr("fill", "white")
      .attr("opacity", 0.8)
      .attr("stroke", "#e2e8f0")
      .attr("stroke-width", 1);

    // Legend title
    legend
      .append("text")
      .attr("x", 0)
      .attr("y", 5)
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "#1e293b")
      .text("Network Legend");

    // Legend items
    const legendItems = [
      { color: "#8b5cf6", label: "Central Address" },
      { color: "#475569", label: "Connected Address" },
      { color: "#3b82f6", label: "Transaction Node" },
    ];

    legendItems.forEach((item, i) => {
      const legendItem = legend
        .append("g")
        .attr("transform", `translate(0, ${i * 20 + 25})`);

      // Create gradient for legend items too
      const gradientId = `legend-gradient-${i}`;
      const gradient = defs
        .append("radialGradient")
        .attr("id", gradientId)
        .attr("cx", "30%")
        .attr("cy", "30%")
        .attr("r", "70%");

      gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", d3.rgb(item.color).brighter(0.5).toString());

      gradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", item.color);

      legendItem
        .append("circle")
        .attr("r", 6)
        .attr("fill", `url(#${gradientId})`)
        .attr("stroke", "white")
        .attr("stroke-width", 1);

      legendItem
        .append("text")
        .attr("x", 15)
        .attr("y", 4)
        .attr("font-size", "11px")
        .attr("fill", "#475569")
        .text(item.label);
    });

    // Update positions on simulation tick
    simulation.on("tick", () => {
      // Update link positions
      updateLinkPositions();

      // Update node positions
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // Start particle animations
    simulation.on("end", () => {
      createParticles();
      setInterval(createParticles, 3000);
    });

    return () => {
      simulation.stop();
    };
  }, []);

  return (
    <section className="py-16 sm:py-32 bg-black text-white overflow-hidden">
      <Container>
        <div className="relative">
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl md:text-6xl leading-none font-light mb-16 sm:mb-32">
              <span className="bg-gradient-to-r from-purple-600 via-purple-700 to-blue-900 text-transparent bg-clip-text">
                GOOD DEVS
              </span>
              <br />
              USE GOOD
              <br />
              DATA
            </h2>
          </div>

          <div className="relative">
            {/* Angled panels graphic */}
            <div className="absolute inset-0">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 w-full h-[300px] sm:h-[600px] bg-gradient-to-r from-purple-600 to-blue-900"
                  style={{
                    transform: `translateX(${i * 5}%) translateY(${
                      i * 2
                    }%) rotate(${15 + i * 5}deg)`,
                    opacity: 1 - i * 0.1,
                  }}
                />
              ))}
            </div>

            {/* Content overlays */}
            <div className="relative z-10">
              <div className="bg-violet-900/80 backdrop-blur-sm rounded-lg p-4 sm:p-8 hover:bg-gradient-to-r hover:from-violet-600 hover:to-blue-600 transition duration-300 ease-in-out">
                <div className="rounded-lg overflow-hidden mb-4">
                  <div className="w-full h-48 sm:h-96">
                    <svg ref={svgRef} className="w-full h-full" />
                  </div>
                </div>
                <a
                  href="/studio"
                  className="inline-flex items-center mt-4 text-white/80 hover:text-white"
                >
                  <span>Explore Visualization Graph</span>
                  <span className="ml-2">→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

const drag = (simulation: d3.Simulation<any, undefined>) => {
  const dragstarted = (event: d3.D3DragEvent<SVGGElement, any, any>) => {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  };

  const dragged = (event: d3.D3DragEvent<SVGGElement, any, any>) => {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  };

  const dragended = (event: d3.D3DragEvent<SVGGElement, any, any>) => {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  };

  return d3
    .drag<SVGGElement, any>()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
};