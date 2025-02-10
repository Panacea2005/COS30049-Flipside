const FAQ_ITEMS = [
  {
    question: 'Why should I explore blockchain analytics?',
    answer: 'Understanding blockchain data helps you track transactions, detect trends, and make informed decisions in the crypto space.'
  },
  {
    question: 'How does AI help me understand blockchain?',
    answer: 'Our AI breaks down complex data, explaining transaction flows, smart contract behavior, and key trends in an easy-to-digest format.'
  },
  {
    question: 'Do I need technical skills?',
    answer: 'Not at all! Our platform is built for anyone curious about blockchain, offering intuitive visualizations and AI-powered insights.'
  },
  {
    question: 'Can I connect to my own wallet?',
    answer: 'Yes! Simply connect your wallet address for smart contracts audition and deployment.'
  }
];

export const FAQ = () => {
  return (
    <div className="py-32">
      <div className="mb-16">
        <button className="text-orange-400 text-sm font-medium">
          Frequently asked questions
        </button>
      </div>

      <div className="space-y-4">
        {FAQ_ITEMS.map((item, index) => (
          <details key={index} className="group">
            <summary className="flex justify-between items-center cursor-pointer py-6 text-2xl border-t border-gray-800">
              {item.question}
              <span className="transform group-open:rotate-45 transition-transform">+</span>
            </summary>
            <div className="pb-6 text-gray-400">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
};