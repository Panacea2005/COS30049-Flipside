import { useEffect, useState } from 'react';
import { useTabsContext } from './TabsContext';

export const TabsNav = () => {
  const { activeTab, setActiveTab } = useTabsContext();
  const [isVisible, setIsVisible] = useState(false);
  const [fontColor, setFontColor] = useState('text-black');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const chainsSection = document.getElementById('chains');
      const analystsSection = document.getElementById('analysts');
      const explorersSection = document.getElementById('explorers');

      // Update visibility and font color based on scroll position
      const sections = [chainsSection, analystsSection, explorersSection];
      const sectionIds = ['chains', 'analysts', 'explorers'];
      let isInSection = false;

      sections.forEach((section, index) => {
        if (section && scrollPosition >= section.offsetTop - 300 && 
            scrollPosition < (section.offsetTop + section.offsetHeight - 300)) {
          setActiveTab(sectionIds[index] as 'chains' | 'analysts' | 'explorers');
          isInSection = true;
          setFontColor(sectionIds[index] === 'analysts' ? 'text-black' : 'text-white');
        }
      });

      setIsVisible(isInSection);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setActiveTab]);

  if (!isVisible) return null;

  return (
    <nav 
      className={`hidden lg:flex fixed top-24 right-8 z-50 flex-col space-y-1 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } ${fontColor}`}
    >
      <TabLink href="#chains" active={activeTab === 'chains'} fontColor={fontColor}>For Chains</TabLink>
      <TabLink href="#analysts" active={activeTab === 'analysts'} fontColor={fontColor}>For Analysts</TabLink>
      <TabLink href="#explorers" active={activeTab === 'explorers'} fontColor={fontColor}>For Explorers</TabLink>
    </nav>
  );
};

const TabLink = ({ href, active, children, fontColor }: { href: string; active: boolean; children: React.ReactNode; fontColor: string }) => (
  <a
    href={href}
    className={`relative py-2 pl-4 pr-8 text-sm transition-all duration-300 ${
      active ? fontColor : 'text-gray-400 hover:text-gray-600'
    }`}
  >
    {children}
    <div 
      className={`absolute bottom-0 left-0 w-full h-px transition-transform duration-300 ${
        active ? (fontColor === 'text-white' ? 'bg-white' : 'bg-black') : 'scale-x-0'
      }`} 
    />
  </a>
);