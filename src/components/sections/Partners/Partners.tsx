import { Container } from '../../layout/Container';
import './Partners.css';

const PARTNERS = [
  { name: 'Aptos', logo: '/aptos.svg' },
  { name: 'Avalanche', logo: '/avalanche.svg' },
  { name: 'Flow', logo: '/flow.svg' },
  { name: 'Solana', logo: '/solana.svg' },
  { name: 'Olas', logo: '/olas.svg' },
  { name: 'Blast', logo: '/blast.webp' },
  { name: 'Kaia', logo: 'kaia.svg' },
  { name: 'Sei', logo: '/sei.svg' },
  { name: 'Near', logo: '/near.svg' },
  { name: 'Sui', logo: '/sui.svg' },
];

export const Partners = () => {
  return (
    <section className="py-16">
      <Container>
        <p className="text-sm mb-8">
          Flipside powers growth for these world-changing blockchains
        </p>
        <div className="overflow-hidden">
          <div className="flex space-x-12 animate-scroll">
            {[...PARTNERS, ...PARTNERS, ...PARTNERS, ...PARTNERS].map((partner, i) => (
              <img
                key={`${partner.name}-${i}`}
                src={partner.logo}
                alt={partner.name}
                className="h-8 w-auto"
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};