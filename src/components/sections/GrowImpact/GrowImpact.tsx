import { Container } from '../../layout/Container';
import { SectionTitle } from '../common/SectionTitle';
import { FeatureCard } from '../common/FeatureCard';
import { ExploreButton } from '../../common/ExploreButton/ExploreButton';
import { ImpactGraphic } from '../../graphics/ImpactGraphic';
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

export const GrowImpact = () => {
  return (
    <section className="relative min-h-screen bg-white overflow-hidden">
      <ImpactGraphic />
      <Container className="relative z-10">
        <div className="pt-32 pb-16">
          <SectionTitle className="text-4xl sm:text-6xl md:text-8xl">
            GROW
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-violet-500 text-transparent bg-clip-text">
              WALLET
            </span>
            <br />
            INSIGHTS
          </SectionTitle>

          <p className="text-lg mb-24 max-w-md">
            Transform blockchain data into interactive dashboards & analytics.
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
                  label="Onchain Transaction Dashboard"
                  title="Visualize real-time transaction statistics."
                  ctaText="Launch Studio"
                  ctaHref="/studio"
                  theme="light"
                  className="backdrop-blur-2xl"
                />
              </motion.div>
              <div className="col-start-2" />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="col-start-2">
                <motion.div
                  custom="right"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={cardVariants}
                >
                  <FeatureCard
                    label="Transaction History"
                    title="Transactions in Tabular Format."
                    ctaText="View History"
                    ctaHref="/studio"
                    theme="light"
                    className="backdrop-blur-2xl"
                  />
                </motion.div>
              </div>
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
                  label=" Graph-Based Data Exploration"
                  title="Explore blockchain connections dynamically."
                  ctaText="Explore Blockchain Graphs"
                  ctaHref="/studio"
                  theme="light"
                  className="backdrop-blur-2xl"
                />
              </motion.div>
              <div className="col-start-2" />
            </div>
          </div>

          <ExploreButton href="/for-analysts" variant="impact">
            Explore Flipside for Analysts
          </ExploreButton>
        </div>
      </Container>
    </section>
  );
};