const FAQ_ITEMS = [
  {
    question: 'How secure is Flipside’s authentication and data storage?',
    answer: 'Flipside uses Supabase Auth for secure login, RBAC policies for controlled access, and data encryption to protect user and transaction data. Blockchain immutability ensures stored transaction integrity.'
  },
  {
    question: 'How do I connect my Sui Wallet?',
    answer: 'Users can connect their Sui Wallet by clicking "Connect Wallet," selecting the provider, and approving the connection. Once linked, users can track balances, view transactions, and interact with the blockchain securely.'
  },
  {
    question: 'What future enhancements are planned?',
    answer: 'Upcoming features include multi-chain support, AI-powered fraud detection, real-time transaction alerts, and smart contract risk assessment to enhance blockchain analysis capabilities.'
  },
  {
    question: 'How can I get support or provide feedback?',
    answer: 'Users can access the Help Center for documentation, join the community forum for discussions, or contact the support team via email or live chat for direct assistance.'
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