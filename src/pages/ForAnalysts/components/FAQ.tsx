const FAQ_ITEMS = [
  {
    question: 'What blockchain statistics can I track?',
    answer: 'You can explore real-time statistics on blockchain activity, including contract executions, gas fees, and transaction counts.'
  },
  {
    question: 'How do I search for an address or contract?',
    answer: 'Simply enter a wallet address, smart contract, or transaction hash, and our AI will generate graphs and transaction history.'
  },
  {
    question: 'Can I download or share my findings?',
    answer: 'Yes! You can export transaction history, save dashboards, or share insights with your team.'
  },
  {
    question: 'Is there a way to compare different addresses?',
    answer: 'Yes, our platform lets you compare multiple wallet addresses or contracts side by side to analyze interactions.'
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