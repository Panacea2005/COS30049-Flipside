import { NavLink } from './NavLink';

export const NavLinks = () => {
  return (
    <div className="lg:flex items-center space-x-8 lg:space-x-8">
      <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-8">
        <NavLink href="/flide">Flide</NavLink>
        <NavLink href="/studio">Studio</NavLink>
        <NavLink href="/exchange">Exchange</NavLink>
        <NavLink href="/about">About</NavLink>
      </div>
    </div>
  );
};