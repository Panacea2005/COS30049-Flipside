import { type NavLinkProps } from './types';
import clsx from 'clsx';

interface ExtendedNavLinkProps extends NavLinkProps {
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  activeLink?: string | null;
  label?: string;
}

export const NavLink = ({
  href,
  children,
  className,
  onMouseEnter,
  onMouseLeave,
  activeLink,
  label,
}: ExtendedNavLinkProps) => {
  const isActive = activeLink === label;

  return (
    <a
      href={href}
      className={clsx(
        'relative text-gray-700 font-medium transition-all duration-300 ease-out hover:text-gray-900',
        isActive ? 'text-transparent' : '',
        className
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        ...(isActive && {
          background: 'linear-gradient(90deg,rgb(170, 37, 223),rgb(240, 68, 215))',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }),
      }}
    >
      {children}
      <span 
        className={clsx(
          'absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-300 ease-out group-hover:w-full',
          isActive ? 'w-full' : ''
        )}
        style={{
          transformOrigin: 'left',
          transition: 'width 0.3s ease-out',
          ...(isActive ? { width: '100%' } : {}),
        }}
      />
    </a>
  );
};