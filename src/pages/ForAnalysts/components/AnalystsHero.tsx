import { Container } from "../../../components/layout/Container";
import { ImpactGraphic } from "../../../components/graphics/ImpactGraphic";

export const AnalystsHero = () => {
  return (
    <div className="relative min-h-screen pt-32 bg-gradient-to-br from-violet-50 to-blue-50">
      <ImpactGraphic />
      <Container className="relative z-10">
        <div className="max-w-3xl">
          <h1 className="text-[8rem] leading-none font-light mb-8">
            Discover data power
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-xl">
            Gain deep insights with AI-powered analytics, interactive
            dashboards, and transaction history tracking. Explore address
            analytics, and onchain activity—all in one
            place.
          </p>
          <a
            href="/studio"
            className="inline-flex items-center space-x-2 bg-black text-white px-8 py-4 rounded-lg group hover:bg-gray-900"
          >
            <span>Launch Studio</span>
            <span className="transform group-hover:translate-x-1 transition-transform">
              →
            </span>
          </a>
        </div>
      </Container>
    </div>
  );
};
