import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Container } from "../../../components/layout/Container";

const mockData = {
  nodes: [
    { id: "0x1234...", value: 50, x: 0, y: 0, vx: 0, vy: 0 }, // Central node
    { id: "0x2345...", value: 10, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "0x3456...", value: 20, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "0x4567...", value: 30, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "0x5678...", value: 40, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "0x6789...", value: 50, x: 0, y: 0, vx: 0, vy: 0 },
    { id: "0x7890...", value: 60, x: 0, y: 0, vx: 0, vy: 0 },
  ],
  links: [
    { source: "0x1234...", target: "0x2345...", value: 1 },
    { source: "0x1234...", target: "0x3456...", value: 2 },
    { source: "0x1234...", target: "0x4567...", value: 3 },
    { source: "0x1234...", target: "0x5678...", value: 4 },
    { source: "0x1234...", target: "0x6789...", value: 5 },
    { source: "0x1234...", target: "0x7890...", value: 6 },
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

    // Create SVG container with white background
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("background", "white")
      .style("border-radius", "8px")
      .style("box-shadow", "0 4px 6px -1px rgb(0 0 0 / 0.1)");

    // Add zoom functionality
    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    // Create main group for graph elements
    const g = svg.append("g");

    // Calculate link strength based on value
    const linkScale = d3
      .scaleLinear()
      .domain([0, d3.max(mockData.links, (d) => d.value) || 1])
      .range([1, 3]);

    // Create forces
    const simulation = d3
      .forceSimulation(mockData.nodes)
      .force(
        "link",
        d3
          .forceLink(mockData.links)
          .id((d) => (d as any).id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    // Create arrow marker
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-10 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M-10,-5L0,0L-10,5")
      .attr("fill", "#CBD5E1");

    // Create links with click handling
    const link = g
      .append("g")
      .selectAll("line")
      .data(mockData.links)
      .join("line")
      .attr("stroke", "#CBD5E1")
      .attr("stroke-width", (d) => linkScale(d.value))
      .attr("marker-end", "url(#arrowhead)")
      .style("cursor", "pointer");

    // Create nodes
    const node = g
      .append("g")
      .selectAll("g")
      .data(mockData.nodes)
      .join("g")
      .attr("class", "node")
      .style("cursor", "pointer");

    // Add circles for nodes
    node
      .append("circle")
      .attr("r", 12)
      .attr("fill", (d) => (d.id === "0x1234..." ? "#8B5CF6" : "#E5E7EB")) // Central node in purple
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // Add labels
    node
      .append("text")
      .text((d) => `${d.id}`)
      .attr("dy", 25)
      .attr("text-anchor", "middle")
      .attr("fill", "#4B5563")
      .style("font-size", "12px");

    // Add interactivity
    node
      .on("mouseover", function () {
        d3.select(this)
          .select("circle")
          .transition()
          .duration(200)
          .attr("r", 15);
      })
      .on("mouseout", function () {
        d3.select(this)
          .select("circle")
          .transition()
          .duration(200)
          .attr("r", 12);
      });

    // Add drag behavior
    node.call(drag(simulation) as any);

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as any).x)
        .attr("y1", (d) => (d.source as any).y)
        .attr("x2", (d) => (d.target as any).x)
        .attr("y2", (d) => (d.target as any).y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, []);

  return (
    <section className="py-32 bg-black text-white overflow-hidden">
      <Container>
        <div className="relative">
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-6xl md:text-8xl leading-none font-light mb-32">
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
                  className="absolute left-0 w-full h-[600px] bg-gradient-to-r from-purple-600 to-blue-900"
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
              <div className="bg-violet-900/80 backdrop-blur-sm rounded-lg p-8 hover:bg-gradient-to-r hover:from-violet-600 hover:to-blue-600 transition duration-300 ease-in-out">
                <div className="rounded-lg overflow-hidden mb-4">
                  <div className="w-full h-96">
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
