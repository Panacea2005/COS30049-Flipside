import { Container } from '../../layout/Container';
import { SectionTitle } from '../common/SectionTitle';
import { FeatureCard } from '../common/FeatureCard';
import { ExploreButton } from '../../common/ExploreButton/ExploreButton';
import { WalletGraphic } from '../../graphics/WalletGraphic';

export const GrowWallet = () => {
  return (
    <section className="relative min-h-screen bg-black text-white overflow-hidden">
      <WalletGraphic />
      <Container className="relative z-10">
        <div className="pt-32 pb-16">
          <SectionTitle className="text-4xl sm:text-6xl md:text-8xl">
            GROW
            <br />
            YOUR
            <br />
            <span className="bg-gradient-to-r from-orange-400 to-pink-500 text-transparent bg-clip-text">
              WALLET
            </span>
          </SectionTitle>

          <p className="text-lg mb-24 max-w-md">
            Deep dive into blockchain activity, smart contract interactions, and transaction patterns.
          </p>

          <div className="grid grid-cols-1 gap-8 mb-12">
            <div className="grid grid-cols-2 gap-8">
              <FeatureCard
                label="Explorer Dashboards"
                title="Track key metrics and blockchain activity in real time."
                ctaText="Browse Dashboards"
                ctaHref="/studio"
                className="backdrop-blur-2xl"
              />
              <div className="col-start-2" />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="col-start-2">
                <FeatureCard
                  label="Transaction Insights"
                  title="Understand token movements, wallet behavior, and contract usage."
                  ctaText="Analyze Transactions"
                  ctaHref="/studio"
                  className="backdrop-blur-2xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <FeatureCard
                label="Network Trends & Patterns"
                title="Discover emerging trends shaping the blockchain ecosystem."
                ctaText="Explore Network Trends"
                ctaHref="/studio"
                className="backdrop-blur-2xl"
              />
              <div className="col-start-2" />
            </div>
          </div>

          <ExploreButton href="/for-explorers" variant="wallet">
            Explore Flipside for Explorers
          </ExploreButton>
        </div>
      </Container>
    </section>
  );
};