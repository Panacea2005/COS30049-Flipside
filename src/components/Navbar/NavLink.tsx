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
        'text-gray-700 font-medium transition-all duration-500 ease-in-out',
        className
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        transitionProperty: 'filter, color, text-shadow, -webkit-background-clip',
        transitionDuration: '0.5s',
        transitionTimingFunction: 'ease-in-out',
        ...(isActive && {
          filter: 'brightness(1.2)',
          WebkitFilter: 'brightness(1.2)',
          imageRendering: 'pixelated',
          background: 'linear-gradient(45deg, #FF69B4,rgb(7, 135, 177))',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          textShadow: '0 0 5px #FF69B4',
          transform: 'scale(1.1)', // Slight zoom effect to enhance the pixelation effect
        }),
      }}
    >
      {children}
    </a>
  );
};
