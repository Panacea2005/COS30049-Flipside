import { Container } from "../../layout/Container";
import { SectionTitle } from "../common/SectionTitle";
import { FeatureCard } from "../common/FeatureCard";
import { ExploreButton } from "../../common/ExploreButton/ExploreButton";
import { ChainGraphic } from "../../graphics/ChainGraphic";
import { motion } from "framer-motion";

const cardVariants = {
  hidden: (direction: 'left' | 'right') => ({
    opacity: 0,
    x: direction === "left" ? -100 : 100,
  }),
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

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
              <motion.div
                custom="left"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
              >
                <FeatureCard
                  label="AI Contract Analysis"
                  title="Audit & optimize Move & Sui contracts with AI."
                  ctaText="Analyze Contracts"
                  ctaHref="/flide"
                  className="backdrop-blur-2xl"
                />
              </motion.div>
              <div className="col-start-2" />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <motion.div
                custom="right"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
                style={{ gridColumnStart: 2 }}
              >
                <FeatureCard
                  label="Seamless Onchain Deployment"
                  title="Deploy contracts with confidence."
                  ctaText="Deploy with AI"
                  ctaHref="/flide"
                  className="backdrop-blur-2xl"
                />
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <motion.div
                custom="left"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
              >
                <FeatureCard
                  label="Smart Wallet Activation"
                  title="Identify & engage key blockchain participants."
                  ctaText="Discover Chain Analytics"
                  ctaHref="/flide"
                  className="backdrop-blur-2xl"
                />
              </motion.div>
              <div className="col-start-2" />
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
