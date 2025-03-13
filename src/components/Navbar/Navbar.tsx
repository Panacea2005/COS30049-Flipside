import { useState, useEffect } from 'react';
import { Container } from '../layout/Container';
import { Logo } from './Logo';
import { NavLinks } from './NavLinks';
import { AudienceLinks } from './AudienceLinks';
import { AuthButtons } from './AuthButtons';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserMenu } from '../auth/UserMenu';

// Pixel Animation Component
const PixelAnimation = ({ isActive }: { isActive: boolean }) => {
  const [pixels, setPixels] = useState<Array<{ x: number, y: number, opacity: number }>>([]);

  useEffect(() => {
    if (isActive) {
      const newPixels = [];
      for (let i = 0; i < 50; i++) {
        newPixels.push({
          x: Math.random() * 100,
          y: Math.random() * 100,
          opacity: Math.random() * 0.7 + 0.3
        });
      }
      setPixels(newPixels);
    } else {
      setPixels([]);
    }
  }, [isActive]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pixels.map((pixel, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-gray-800"
          style={{
            left: `${pixel.x}%`,
            top: `${pixel.y}%`,
            opacity: pixel.opacity,
            transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
            transform: isActive ? 'scale(1)' : 'scale(0)'
          }}
        />
      ))}
    </div>
  );
};

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState<string | null>(null);
  const { user } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="fixed w-full bg-white/90 backdrop-blur-sm z-50">
      <Container>
        {/* Desktop Layout */}
        <div className="hidden lg:flex justify-between items-center h-16">
          <Logo />
          <div className="flex items-center space-x-12">
            <NavLinks />
            <AudienceLinks />
          </div>
          <div className="flex items-center space-x-4">
            {user ? <UserMenu /> : <AuthButtons />}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden flex h-16 px-4 justify-between items-center">
          {/* Left section - Menu Button */}
          <div className="w-16 flex items-center">
            <button onClick={toggleMobileMenu} className="p-2">
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Center section - Logo */}
          <div className="flex-1 flex justify-center items-center">
            <Logo />
          </div>

          {/* Right section - UserMenu or empty space */}
          <div className="w-16 flex items-center justify-end">
            {user && <UserMenu />}
          </div>
        </div>
      </Container>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={toggleMobileMenu} />
          <div className="fixed top-16 left-0 w-full bg-white h-[calc(100vh-4rem)] overflow-y-auto flex flex-col items-center justify-center text-center space-y-8 p-6">
            {/* Big Typography Links */}
            <div className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 space-y-8">
              <div className="relative">
                <a
                  href="/flide"
                  className="relative"
                  onMouseEnter={() => setActiveLink('FLIDE')}
                  onMouseLeave={() => setActiveLink(null)}
                >
                  FLIDE
                  <PixelAnimation isActive={activeLink === 'FLIDE'} />
                </a>
              </div>
              <div className="relative">
                <a
                  href="/studio"
                  className="relative"
                  onMouseEnter={() => setActiveLink('STUDIO')}
                  onMouseLeave={() => setActiveLink(null)}
                >
                  STUDIO
                  <PixelAnimation isActive={activeLink === 'STUDIO'} />
                </a>
              </div>
              <div className="relative">
                <a
                  href="/exchange"
                  className="relative"
                  onMouseEnter={() => setActiveLink('EXCHANGE')}
                  onMouseLeave={() => setActiveLink(null)}
                >
                  EXCHANGE
                  <PixelAnimation isActive={activeLink === 'EXCHANGE'} />
                </a>
              </div>
              <div className="relative">
                <a
                  href="/nfts"
                  className="relative"
                  onMouseEnter={() => setActiveLink('NFTs')}
                  onMouseLeave={() => setActiveLink(null)}
                >
                  NFTs
                  <PixelAnimation isActive={activeLink === 'NFTs'} />
                </a>
              </div>
              <div className="relative">
                <a
                  href="/about"
                  className="relative"
                  onMouseEnter={() => setActiveLink('ABOUT')}
                  onMouseLeave={() => setActiveLink(null)}
                >
                  ABOUT
                  <PixelAnimation isActive={activeLink === 'ABOUT'} />
                </a>
              </div>
              <div className="relative">
                <a
                  href="/for-chains"
                  className="relative"
                  onMouseEnter={() => setActiveLink('FOR-CHAINS')}
                  onMouseLeave={() => setActiveLink(null)}
                >
                  FOR-CHAINS
                  <PixelAnimation isActive={activeLink === 'FOR-CHAINS'} />
                </a>
              </div>
              <div className="relative">
                <a
                  href="/for-analysts"
                  className="relative"
                  onMouseEnter={() => setActiveLink('FOR-ANALYSTS')}
                  onMouseLeave={() => setActiveLink(null)}
                >
                  FOR-ANALYSTS
                  <PixelAnimation isActive={activeLink === 'FOR-ANALYSTS'} />
                </a>
              </div>
              <div className="relative">
                <a
                  href="/for-explorers"
                  className="relative"
                  onMouseEnter={() => setActiveLink('FOR-EXPLORERS')}
                  onMouseLeave={() => setActiveLink(null)}
                >
                  FOR-EXPLORERS
                  <PixelAnimation isActive={activeLink === 'FOR-EXPLORERS'} />
                </a>
              </div>
            </div>

            {/* Auth Buttons - Sign Up / Log In */}
            {!user && (
              <div className="pt-4 border-t">
                <AuthButtons />
              </div>
            )}

            {/* Bottom Bar */}
            <div className="py-6 flex justify-between border-t border-gray-200 w-full">
              <div className="text-sm text-gray-500">© 2025</div>
              <div className="flex space-x-4">
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Twitter</a>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Instagram</a>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Discord</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
