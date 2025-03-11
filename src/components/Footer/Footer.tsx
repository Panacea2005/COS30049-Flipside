import { Twitter, Linkedin, Facebook, ArrowUpRight } from 'lucide-react';
import { Container } from '../layout/Container';

// Define links with their URLs
const LINKS = {
  AI: [
    { name: 'Flide', url: '/flide' }
  ],
  Data: [
    { name: 'Trade', url: '/studio?tab=trade' },
    { name: 'Market', url: '/studio?tab=market' },
    { name: 'Overview', url: '/studio?tab=overview' },
    { name: 'Visualization', url: '/studio?tab=visualization' },
    { name: 'Transactions', url: '/studio?tab=transactions' }
  ],
  Swap: [
    { name: 'Exchange', url: '/exchange' }
  ],
  Offering: [
    { name: 'For Chains', url: '/for-chains' },
    { name: 'For Analysts', url: '/for-analysts' },
    { name: 'For Explorers', url: '/for-explorers' },
    { name: 'About', url: '/about' }
  ],
};

// Social media links
const SOCIAL_LINKS = [
  { icon: Twitter, url: 'https://twitter.com/flipsidecrypto', label: 'Twitter' },
  { icon: Facebook, url: 'https://facebook.com/flipsidecrypto', label: 'Facebook' },
  { icon: Linkedin, url: 'https://linkedin.com/company/flipside-crypto', label: 'LinkedIn' }
];

export const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-br from-gray-50 to-gray-100 py-24 overflow-hidden">
      {/* Blockchain-themed background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
        {/* Network nodes */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-pink-500 shadow-lg shadow-pink-500/30"></div>
        <div className="absolute top-1/3 left-1/2 w-3 h-3 rounded-full bg-purple-600 shadow-lg shadow-purple-500/30"></div>
        <div className="absolute top-2/3 left-1/3 w-2 h-2 rounded-full bg-pink-400 shadow-lg shadow-pink-400/30"></div>
        <div className="absolute top-1/5 right-1/4 w-2 h-2 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/30"></div>
        <div className="absolute bottom-1/4 right-1/3 w-3 h-3 rounded-full bg-pink-500 shadow-lg shadow-pink-500/30"></div>
        
        {/* Connection lines */}
        <div className="absolute top-0 left-0 w-full h-full">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <path d="M200,150 Q400,50 600,200 T800,300" stroke="url(#gradient1)" strokeWidth="1" fill="none" />
            <path d="M100,300 Q300,400 500,350 T900,200" stroke="url(#gradient2)" strokeWidth="1" fill="none" />
            <path d="M300,100 Q400,300 700,250 T800,400" stroke="url(#gradient1)" strokeWidth="1" fill="none" />
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="gradient2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.5" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        {/* Particle clusters */}
        <div className="absolute w-full h-full">
          <div className="absolute top-10 left-10 w-40 h-40 opacity-20 rounded-full bg-gradient-radial from-pink-500/40 to-transparent"></div>
          <div className="absolute bottom-20 right-20 w-60 h-60 opacity-20 rounded-full bg-gradient-radial from-purple-600/40 to-transparent"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 opacity-20 rounded-full bg-gradient-radial from-indigo-500/40 to-transparent transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>

      <Container className="relative z-10">
        {/* Main links section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 lg:gap-16">
          <div>
            <a href="/" className="block mb-8">
              <img
                src="/flipside-logo.svg"
                alt="Flipside"
                className="h-10 w-auto"
              />
            </a>
            <p className="text-gray-600 text-sm mb-8 leading-relaxed">
              Empowering the future of blockchain analytics with comprehensive data solutions for the modern crypto ecosystem.
            </p>
            <div className="flex space-x-5">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.url}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white p-3 rounded-full shadow-sm hover:shadow-md hover:shadow-pink-500/20 transition-all duration-300 group border border-gray-200 hover:border-pink-500/50"
                >
                  <social.icon className="h-5 w-5 text-gray-600 group-hover:bg-clip-text group-hover:bg-gradient-to-r from-pink-500 to-purple-600 transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(LINKS).map(([category, items]) => (
            <div key={category}>
              <h3 className="font-semibold text-gray-800 mb-6 text-lg">{category}</h3>
              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.url}
                      className="text-gray-600 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r from-pink-500 to-purple-600 hover:translate-x-1 transition-all duration-200 flex items-center group"
                    >
                      {item.name}
                      <ArrowUpRight className="h-0 w-0 opacity-0 ml-0 group-hover:h-3.5 group-hover:w-3.5 group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-200" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-16 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm mb-4 sm:mb-0">
            © 2025 Flipside Crypto. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center sm:justify-end gap-6 sm:gap-8">
            <a
              href="/terms"
              className="text-gray-600 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r from-pink-500 to-purple-600 text-sm transition-colors"
            >
              Terms & Privacy
            </a>
            <a
              href="/contact"
              className="text-gray-600 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r from-pink-500 to-purple-600 text-sm transition-colors"
            >
              Contact Us
            </a>
            <a
              href="/careers"
              className="text-gray-600 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r from-pink-500 to-purple-600 text-sm transition-colors"
            >
              Careers
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
};