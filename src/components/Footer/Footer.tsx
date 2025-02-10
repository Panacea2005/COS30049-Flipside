import { Twitter, Linkedin, Facebook } from 'lucide-react';
import { Container } from '../layout/Container';

const LINKS = {
  Offering: ['For Chains', 'For Analysts', 'For Explorers'],
  About: ['Company', 'Resources', 'Documentation', 'Careers'],
  Data: ['Insights', 'Studio', 'LiveQuery', 'API'],
  Quests: ['Quests', 'Grail']
};

export const Footer = () => {
  return (
    <footer className="bg-gray-50 py-16">
      <Container>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-16">
          <div>
            <a href="/">
              <img src="/flipside-logo.svg" alt="Flipside" className="h-8 w-auto" />
            </a>
            <div className="flex space-x-4 mt-8">
              <a href="">
                <Twitter className="h-6 w-6 text-gray-600 hover:text-gray-900" />
              </a>
              <a href="">
                <Facebook className="h-6 w-6 text-gray-600 hover:text-gray-900" />
              </a>
              <a href="">
                <Linkedin className="h-6 w-6 text-gray-600 hover:text-gray-900" />
              </a>
            </div>
          </div>
          
          {Object.entries(LINKS).map(([category, items]) => (
            <div key={category}>
              <h3 className="font-medium mb-4">{category}</h3>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-600 hover:text-gray-900">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-center mt-16 pt-8 border-t">
          <p className="text-gray-600 mb-4 sm:mb-0">© 2025 Flipside Crypto</p>
          <div className="flex space-x-8">
            <a href="/terms" className="text-gray-600 hover:text-gray-900">
              Terms & Privacy
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
};