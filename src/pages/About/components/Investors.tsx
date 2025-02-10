import { Container } from '../../../components/layout/Container';
import './Investors.css';

const INVESTORS = [
  { name: 'Collab Currency', logo: '/collab.png' },
  { name: 'Hashkey Capital', logo: '/hashkey.png' },
  { name: 'Tribe Capital', logo: '/tribe.png' },
  { name: 'Republic Capital', logo: '/republic.png' },
  { name: 'Coinbase Ventures', logo: '/coinbase.png' },
  { name: 'True Ventures', logo: '/true.png' },
  { name: 'Founder Collective', logo: '/fc.png' },
  { name: 'Digital Currency Group', logo: '/dcg.png' },
  { name: 'Gaingels', logo: '/gaingels.png' },
  { name: 'CMT Digitals', logo: '/c.png' },
  { name: 'Blockchain Coinvestors', logo: '/bcc.png' },
  { name: 'Galaxy Digital', logo: '/galaxy.png' },
];

export const Investors = () => {
  return (
    <section className="py-16 bg-white">
      <Container>
        <span className="text-violet-600 text-sm">Backed by many of crypto's leading investors</span>
        <div className="overflow-hidden mt-8">
          <div className="flex items-center space-x-24 animate-scroll">
            {[...INVESTORS, ...INVESTORS].map((investor, i) => (
              <div key={`${investor.name}-${i}`} className="flex items-center space-x-2 whitespace-nowrap">
                <img src={investor.logo} alt={investor.name} className="h-8 w-8" />
                <span className="text-gray-900">{investor.name}</span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};