import { NavLink } from './NavLink';
import { useState } from 'react';

export const NavLinks = () => {
  const [activeLink, setActiveLink] = useState<string | null>(null);

  return (
    <div className="lg:flex items-center space-x-8 lg:space-x-8">
      <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-8">
        <div className="relative group">
          <NavLink 
            href="/flide"
            label="FLIDE"
            onMouseEnter={() => setActiveLink('FLIDE')}
            onMouseLeave={() => setActiveLink(null)}
            activeLink={activeLink}
          >
            Flide
          </NavLink>
        </div>
        <div className="relative group">
          <NavLink 
            href="/studio"
            label="STUDIO"
            onMouseEnter={() => setActiveLink('STUDIO')}
            onMouseLeave={() => setActiveLink(null)}
            activeLink={activeLink}
          >
            Studio
          </NavLink>
        </div>
        <div className="relative group">
          <NavLink 
            href="/exchange"
            label="EXCHANGE"
            onMouseEnter={() => setActiveLink('EXCHANGE')}
            onMouseLeave={() => setActiveLink(null)}
            activeLink={activeLink}
          >
            Exchange
          </NavLink>
        </div>
        <div className="relative group">
          <NavLink 
            href="/nfts"
            label="NFTS"
            onMouseEnter={() => setActiveLink('NFTS')}
            onMouseLeave={() => setActiveLink(null)}
            activeLink={activeLink}
          >
            NFTs
          </NavLink>
        </div>
      </div>
    </div>
  );
};