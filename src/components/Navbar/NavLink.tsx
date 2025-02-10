import { type NavLinkProps } from './types';
import clsx from 'clsx';

export const NavLink = ({ href, children, className }: NavLinkProps) => {
  return (
    <a
      href={href}
      className={clsx(
        'text-gray-700 hover:text-gray-900 font-medium',
        className
      )}
    >
      {children}
    </a>
  );
};