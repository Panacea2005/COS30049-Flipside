import { Container } from '../../../components/layout/Container';
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: -50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};

export const WhatWeDo = () => {
  return (
    <section className="py-32 bg-black text-white overflow-hidden">
      <Container>
        <div className="relative">
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-6xl md:text-8xl leading-none font-light mb-16 sm:mb-32">
              WHAT WE DO
            </h2>
          </div>

          <div className="relative">
            {/* Angled panels graphic */}
            <div className="absolute inset-0">
              {Array.from({ length: 10 }).map((_, i) => (
                <motion.div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: 0,
                    width: '100%',
                    height: window.matchMedia('(min-width: 640px)').matches ? '600px' : '300px', // Responsive height
                    background: 'linear-gradient(to right, #ec4899, #8b5cf6)',
                    transform: `translateX(${i * 5}%) translateY(${i * 2}%) rotate(${15 + i * 10}deg) scale(${1 - i * 0.05})`,
                    opacity: 1 - i * 0.1,
                    borderRadius: `${i * 5}px`,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 max-w-2xl ml-auto">
              <p className="text-xl sm:text-2xl mb-8 sm:mb-16">
                Flipside is a Web3 intelligence platform. We empower developers, analysts, and explorers with AI-driven smart contract analysis, blockchain data visualization, and real-time transaction insights—helping the ecosystem grow through cutting-edge analytics and automation.
              </p>

              <div className="space-y-8 sm:space-y-16">
                {[
                  {
                    title: 'AI-Powered Smart Contract Analysis',
                    description: 'We leverage cutting-edge AI models to analyze, optimize, and secure Move & Sui smart contracts, ensuring safer, more efficient blockchain interactions.',
                    href: '/flide',
                    linkText: 'Explore Flide AI',
                  },
                  {
                    title: 'Visualizing Blockchain Data',
                    description: 'We transform complex blockchain transactions into intuitive dashboards and interactive graphs, making it easy to track wallets, contracts, and ecosystem trends.',
                    href: '/studio',
                    linkText: 'Launch Data Studio',
                  },
                  {
                    title: 'Making Blockchain Intelligence Accessible',
                    description: 'Our tools help developers and analysts gain deeper insights into contract behavior, wallet activity, and onchain movements—without complex coding.',
                    href: '/studio',
                    linkText: 'Start Exploring Data',
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={cardVariants}
                    custom={index}
                    style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)', borderRadius: '0.5rem', padding: '2rem' }}
                  >
                    <h3 className="text-xl sm:text-2xl mb-4">{item.title}</h3>
                    <p className="text-gray-400 mb-4">{item.description}</p>
                    <a href={item.href} className="text-white/80 hover:text-white inline-flex items-center">
                      <span>{item.linkText}</span>
                      <span className="ml-2">→</span>
                    </a>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
