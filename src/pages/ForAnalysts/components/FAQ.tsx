const FAQ_ITEMS = [
  {
    question: 'What blockchain data can I explore using Flipside?',
    answer: 'Flipside allows users to track wallet interactions, smart contract activity, transaction history, and blockchain trends. Users can explore transaction flows, gas fees, and historical data to gain insights into blockchain activity.'
  },
  {
    question: 'How does the transaction visualization feature work?',
    answer: 'Users can search for a wallet address or contract, and the system will generate an interactive graph. Nodes represent wallets or contracts, while edges indicate transactions. Clicking on nodes allows users to explore connected transactions dynamically.'
  },
  {
    question: 'What data sources does Flipside use?',
    answer: 'Flipside retrieves blockchain data from the Neo4j Graph Database for stored transaction history and integrates with Etherscan API and Sui SDK to fetch real-time blockchain data when needed.'
  },
  {
    question: 'How does Flide AI assist in blockchain analysis?',
    answer: 'Flide AI, powered by Groq API, provides AI-driven insights on transaction patterns, analyzes Move contracts for risks and optimizations, and answers general blockchain-related queries.'
  },
];

export const FAQ = () => {
  return (
    <section className="py-32">
      <div className="mb-16">
        <span className="text-violet-600 text-sm">Frequently Asked Questions</span>
      </div>

      <div className="space-y-8">
        {FAQ_ITEMS.map((item, index) => (
          <details key={index} className="group">
            <summary className="flex justify-between items-center cursor-pointer py-6 text-2xl">
              {item.question}
              <span className="transform group-open:rotate-45 transition-transform">+</span>
            </summary>
            <div className="pb-6 text-gray-600">
              {item.answer}
            </div>
          </details>
        ))}
      </div>

      <div className="mt-32 bg-violet-600 rounded-lg p-16">
        <h3 className="text-3xl text-white font-light mb-4">
          To go fast, go alone. To go far, go together.
          <br />
          Join our fast-growing global community.
        </h3>
        
        <a 
          href="https://discord.gg/flipside"
          className="inline-flex items-center space-x-2 text-white/80 hover:text-white mt-8 group"
        >
          <img src="/discord-white.png" alt="" className="w-7 h-6" />
          <span>Join Discord</span>
          <span className="transform group-hover:translate-x-1 transition-transform">→</span>
        </a>
      </div>
    </section>
  );
};