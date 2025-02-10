import { motion } from 'framer-motion';

const STEPS = [
  {
    number: '01.',
    title: 'Search & Explore',
    description: 'Simply enter a wallet address to visualize activity in real-time.'
  },
  {
    number: '02.',
    title: 'Learn with AI-Powered Insights',
    description: 'Our AI helps you break down transaction details, showing who sent what, where, and why.'
  },
  {
    number: '03.',
    title: 'Track Market & Network Trends',
    description: 'Understand token flows, DeFi interactions, and onchain behaviors—all in one place.'
  },
  {
    number: '04.',
    title: 'Master the Basics & Go Deeper',
    description: 'Learn step-by-step how smart contracts and transactions shape the blockchain world.'
  }
];

const stepVariants = {
  hidden: { opacity: 0, x: 100 },
  visible: { opacity: 1, x: 0 }
};

export const HowItWorks = () => {
  return (
    <div className="py-32 relative overflow-hidden bg-white">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-96 h-96 bg-gradient-to-br from-orange-400 via-pink-300 to-transparent rounded-full blur-3xl"></div>
      </div>
      <div className="relative z-10">
        <div className="mb-16">
          <h2 className="text-[8rem] leading-none font-light">
            YOUR  
            <br />
              JOURNEY
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-pink-500 text-transparent bg-clip-text">
              INTO BLOCKCHAIN ANALYTICS
            </span>
          </h2>
          <button className="text-orange-400 text-sm font-medium mt-8">
            How it works
          </button>
        </div>

        <div className="mb-8">
          <p className="text-2xl text-black">
            Gain experience and grow your wallet as
            <br />
            you journey through Flipside analytics.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-8">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.number}
              style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              variants={stepVariants}
            >
              <div className="text-xl mb-4 text-black">{step.number}</div>
              <h3 className="text-xl font-medium mb-4 text-black">{step.title}</h3>
              <p className="text-gray-700">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};