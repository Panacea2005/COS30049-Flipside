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
    <nav className="fixed w-full bg-white/80 backdrop-blur-sm z-50">
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
        <div className="lg:hidden flex h-16">
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
          <div className="fixed top-16 left-0 w-full max-w-sm bg-white h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="flex flex-col p-6 space-y-6">
              <div className="flex flex-col space-y-4">
                <NavLinks />
                <AudienceLinks />
              </div>
              {!user && (
                <div className="pt-4 border-t">
                  <AuthButtons />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};