import { Container } from '../../../components/layout/Container';

export const DevSection = () => {
  return (
    <section className="py-32 bg-black text-white overflow-hidden">
      <Container>
        <div className="relative">
          <h2 className="text-[8rem] leading-none font-light mb-32">
            GOOD DEVS
            <br />
            USE GOOD
            <br />
            DATA
          </h2>

          <div className="relative">
            {/* Angled panels graphic */}
            <div className="absolute inset-0">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 w-full h-[600px] bg-gradient-to-r from-violet-600 to-blue-600"
                  style={{
                    transform: `translateX(${i * 5}%) translateY(${i * 2}%) rotate(${15}deg)`,
                    opacity: 1 - (i * 0.1),
                  }}
                />
              ))}
            </div>

            {/* Content overlays */}
            <div className="relative z-10">
              <div className="bg-violet-900/80 backdrop-blur-sm rounded-lg p-8">
                <div className="text-l mb-4">
                  Visualizing blockchain interactions is critical for developers, researchers, and analysts. Use our graph-based analytics and real-time dashboards to stay ahead of the curve.
                </div>
                <div className="rounded-lg overflow-hidden mb-4">
                  <img src="./graph.png" alt="Blockchain Visualization" className="w-full h-auto" />
                </div>
                <a href="/studio" className="inline-flex items-center mt-4 text-white/80 hover:text-white">
                  <span>Explore Visual Analytics</span>
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