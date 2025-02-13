import { Container } from '../../../components/layout/Container';

export const WhatWeDo = () => {
  return (
    <section className="py-32 bg-black text-white overflow-hidden">
      <Container>
        <div className="relative">
          <h2 className="text-4xl sm:text-6xl md:text-8xl leading-none font-light mb-16 sm:mb-32">
            WHAT WE DO
          </h2>

          <div className="relative">
            {/* Angled panels graphic */}
            <div className="absolute inset-0">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 w-full h-[300px] sm:h-[600px] bg-gradient-to-r from-violet-600 to-blue-600"
                  style={{
                    transform: `translateX(${i * 5}%) translateY(${i * 2}%) rotate(${15}deg)`,
                    opacity: 1 - (i * 0.1),
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 max-w-2xl ml-auto">
              <p className="text-xl sm:text-2xl mb-8 sm:mb-16">
                Flipside is a Web3 intelligence platform.
                We empower developers, analysts, and explorers with AI-driven smart contract analysis, blockchain data visualization, and real-time transaction insights—helping the ecosystem grow through cutting-edge analytics and automation.
              </p>

              <div className="space-y-8 sm:space-y-16">
                <div className="bg-black/80 backdrop-blur-sm rounded-lg p-8">
                  <h3 className="text-xl sm:text-2xl mb-4">AI-Powered Smart Contract Analysis</h3>
                  <p className="text-gray-400 mb-4">
                    We leverage cutting-edge AI models to analyze, optimize, and secure Move & Sui smart contracts, ensuring safer, more efficient blockchain interactions.
                  </p>
                  <a href="/flide" className="text-white/80 hover:text-white inline-flex items-center">
                    <span>Explore Flide AI</span>
                    <span className="ml-2">→</span>
                  </a>
                </div>

                <div className="bg-black/80 backdrop-blur-sm rounded-lg p-8">
                  <h3 className="text-xl sm:text-2xl mb-4">Visualizing Blockchain Data</h3>
                  <p className="text-gray-400 mb-4">
                    We transform complex blockchain transactions into intuitive dashboards and interactive graphs, making it easy to track wallets, contracts, and ecosystem trends.
                  </p>
                  <a href="/studio" className="text-white/80 hover:text-white inline-flex items-center">
                    <span>Launch Data Studio</span>
                    <span className="ml-2">→</span>
                  </a>
                </div>

                <div className="bg-black/80 backdrop-blur-sm rounded-lg p-8">
                  <h3 className="text-xl sm:text-2xl mb-4">Making Blockchain Intelligence Accessible</h3>
                  <p className="text-gray-400 mb-4">
                    Our tools help developers and analysts gain deeper insights into contract behavior, wallet activity, and onchain movements—without complex coding.
                  </p>
                  <a href="/studio" className="text-white/80 hover:text-white inline-flex items-center">
                    <span>Start Exploring Data</span>
                    <span className="ml-2">→</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};