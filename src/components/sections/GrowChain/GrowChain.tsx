import { Container } from "../../layout/Container";
import { SectionTitle } from "../common/SectionTitle";
import { FeatureCard } from "../common/FeatureCard";
import { ExploreButton } from "../../common/ExploreButton/ExploreButton";
import { ChainGraphic } from "../../graphics/ChainGraphic";

export const GrowChain = () => {
  return (
    <section className="relative min-h-screen bg-black text-white overflow-hidden">
      <ChainGraphic />
      <Container className="relative z-10">
        <div className="pt-32 pb-16">
          <SectionTitle className="text-4xl sm:text-6xl md:text-8xl">
            <span className="bg-gradient-to-r from-sky-400 to-blue-500 text-transparent bg-clip-text">
              GROW
            </span>
            <br />
            YOUR
            <br />
            CHAIN
          </SectionTitle>

          <p className="text-lg mb-24 max-w-md">
            Unlock the full potential of your blockchain with data-driven
            insights and AI-powered automation.
          </p>

          <div className="grid grid-cols-1 gap-8 mb-12">
            <div className="grid grid-cols-2 gap-8">
              <FeatureCard
                label="AI Contract Analysis"
                title="Audit & optimize Move & Sui contracts with AI."
                ctaText="Analyze Contracts"
                ctaHref="/flide"
                className="backdrop-blur-2xl"
              />
              <div className="col-start-2" /> {/* Empty space for layout */}
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="col-start-2">
                <FeatureCard
                  label="Seamless Onchain Deployment "
                  title="Deploy contracts with confidence."
                  ctaText="Deploy with AI"
                  ctaHref="/flide"
                  className="backdrop-blur-2xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <FeatureCard
                label="Smart Wallet Activation"
                title="Identify & engage key blockchain participants."
                ctaText="Discover Chain Analytics"
                ctaHref="/flide"
                className="backdrop-blur-2xl"
              />
              <div className="col-start-2" /> {/* Empty space for layout */}
            </div>
          </div>

          <div className="mt-12">
            <ExploreButton href="/for-chains" variant="chain">
              Explore Flipside for Chains
            </ExploreButton>
          </div>
        </div>
      </Container>
    </section>
  );
};