import { Container } from "../../../components/layout/Container";
import { WalletGraphic } from "../../../components/graphics/WalletGraphic";

export const ExplorersHero = () => {
  return (
    <div className="relative min-h-screen pt-32">
      <WalletGraphic />
      <Container className="relative z-10">
        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-6xl md:text-8xl leading-none font-light mb-8">
            Power of
            <br />
            Analytics
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-white mb-12 max-w-xl">
            Blockchain can be complex—but we make it simple. Our AI-powered
            tools help you explore transactions, understand smart contracts, and
            uncover insights without needing deep technical knowledge.
          </p>
          <a
            href="/studio"
            className="inline-flex items-center space-x-2 bg-white text-black px-8 py-4 rounded-lg group hover:bg-gray-100 transition-colors"
          >
            <span>Start Exploring</span>
            <span className="transform group-hover:translate-x-1 transition-transform">
              →
            </span>
          </a>
        </div>
      </Container>
    </div>
  );
};
