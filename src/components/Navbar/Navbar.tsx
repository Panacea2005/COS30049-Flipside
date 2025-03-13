import { useState } from 'react';
import { Container } from '../layout/Container';
import { Logo } from './Logo';
import { NavLinks } from './NavLinks';
import { AudienceLinks } from './AudienceLinks';
import { AuthButtons } from './AuthButtons';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserMenu } from '../auth/UserMenu';

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
          <div className="w-16 flex items-center">
            <button onClick={toggleMobileMenu} className="p-2">
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
          <div className="flex-1 flex justify-center items-center">
            <Logo />
          </div>
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
              {[
                { href: '/flide', label: 'FLIDE' },
                { href: '/studio', label: 'STUDIO' },
                { href: '/exchange', label: 'EXCHANGE' },
                { href: '/nfts', label: 'NFTs' },
                { href: '/about', label: 'ABOUT' },
                { href: '/for-chains', label: 'FOR-CHAINS' },
                { href: '/for-analysts', label: 'FOR-ANALYSTS' },
                { href: '/for-explorers', label: 'FOR-EXPLORERS' },
              ].map((link) => (
                <div key={link.href} className="relative group">
                  <a
                    href={link.href}
                    className="relative block transition-all duration-300
                      group-hover:[filter:blur(2px)_brightness(1.2)] 
                      group-hover:[image-rendering:pixelated]
                      group-hover:[background:linear-gradient(45deg,_#FF69B4,_#8A2BE2)]
                      group-hover:[background-clip:text]
                      group-hover:[color:transparent]
                      group-hover:[text-shadow:_0_0_5px_#FF69B4]
                      "
                    style={{
                      transitionProperty: 'filter, background, color, text-shadow',
                      transitionDuration: '0.5s',
                      transitionTimingFunction: 'ease-in-out',
                    }}
                  >
                    {link.label}
                  </a>
                </div>
              ))}
            </div>

            {/* Auth Buttons - Sign Up / Log In */}
            {!user && (
              <div className="pt-4 border-t text-2xl md:text-3xl">
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