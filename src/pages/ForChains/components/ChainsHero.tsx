import { Container } from "../../../components/layout/Container";
import { ChainGraphic } from "../../../components/graphics/ChainGraphic";

export const ChainsHero = () => {
  return (
    <div className="relative min-h-screen pt-32">
      <ChainGraphic />
      <Container className="relative z-10">
        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-6xl md:text-8xl leading-none font-light mb-8">
            Ignite 
            <br />
            blockchain
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-white mb-12 max-w-xl">
            Flide AI transforms smart contract security, analytics, and onchain
            growth with powerful AI-driven insights. We help blockchains
            optimize contracts, mitigate risks, and activate the right users for
            long-term adoption.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center space-x-2 bg-white text-black px-8 py-4 rounded-lg group hover:bg-gray-100 transition-colors"
          >
            <span>Reach out</span>
            <span className="transform group-hover:translate-x-1 transition-transform">
              →
            </span>
          </a>
        </div>
      </Container>
    </div>
  );
};