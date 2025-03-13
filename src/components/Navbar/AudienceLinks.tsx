import { NavLink } from './NavLink';
import { useState } from 'react';

export const AudienceLinks = () => {
  const [activeLink, setActiveLink] = useState<string | null>(null);

  return (
    <div className="lg:flex items-center space-x-8 lg:space-x-8">
      <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-8">
        <div className="relative group">
          <NavLink 
            href="/for-chains"
            label="FOR-CHAINS"
            onMouseEnter={() => setActiveLink('FOR-CHAINS')}
            onMouseLeave={() => setActiveLink(null)}
            activeLink={activeLink}
          >
            For Chains
          </NavLink>
        </div>
        <div className="relative group">
          <NavLink 
            href="/for-analysts"
            label="FOR-ANALYSTS"
            onMouseEnter={() => setActiveLink('FOR-ANALYSTS')}
            onMouseLeave={() => setActiveLink(null)}
            activeLink={activeLink}
          >
            For Analysts
          </NavLink>
        </div>
        <div className="relative group">
          <NavLink 
            href="/for-explorers"
            label="FOR-EXPLORERS"
            onMouseEnter={() => setActiveLink('FOR-EXPLORERS')}
            onMouseLeave={() => setActiveLink(null)}
            activeLink={activeLink}
          >
            For Explorers
          </NavLink>
        </div>
        <div className="relative group">
          <NavLink 
            href="/about"
            label="ABOUT"
            onMouseEnter={() => setActiveLink('ABOUT')}
            onMouseLeave={() => setActiveLink(null)}
            activeLink={activeLink}
          >
            About
          </NavLink>
        </div>
      </div>
    </div>
  );
};