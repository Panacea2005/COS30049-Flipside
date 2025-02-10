import { Container } from '../../../components/layout/Container';

const VALUE_PROPS = [
  {
    label: 'AI-Driven Smart Contract Audits',
    title: 'Flide AI automatically scans Move & Sui smart contracts, identifying security vulnerabilities, inefficiencies, and optimization opportunities.',
    image: '/for-chains-1.png',
    cta: {
      text: 'Run an AI Audit',
      href: '/flide'
    }
  },
  {
    label: 'Onchain Intelligence & Security Insights',
    title: 'Our AI models analyze contract interactions, detect anomalous behavior, and provide risk scores to improve security.',
    image: '/for-chains-2.png',
    cta: {
      text: 'Explore AI-Powered Security',
      href: '/flide'
    }
  },
  {
    label: 'Effortless Smart Contract Deployment',
    title: 'Flide AI streamlines the Move & Sui smart contract deployment process, automating deployment while ensuring efficiency and security.',
    image: '/for-chains-3.png',
    cta: {
      text: 'Deploy with Flide AI',
      href: '/flide'
    }
  }
];

export const ValueProposition = () => {
  return (
    <section className="py-32 bg-white">
      <Container>
        <h2 className="text-[6rem] leading-none font-light mb-24 text-gray-900">
          TURN RAW
          <br />
          DATA INTO
          <br />
          REAL VALUE
        </h2>

        <div className="space-y-32">
          {VALUE_PROPS.map((prop, i) => (
            <div key={i} className="grid grid-cols-2 gap-16 items-center">
              <div className={i % 2 === 0 ? 'order-1' : 'order-2'}>
                <img src={prop.image} alt="" className="w-full rounded-lg" />
              </div>
              <div className={i % 2 === 0 ? 'order-2' : 'order-1'}>
                <span className="text-blue-600 text-sm">{prop.label}</span>
                <p className="text-2xl font-light mt-4 mb-8 text-gray-900">{prop.title}</p>
                {prop.cta && (
                  <a 
                    href={prop.cta.href}
                    className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <span>{prop.cta.text}</span>
                    <span>→</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};