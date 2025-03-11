import { NavLink } from './NavLink';

export const AudienceLinks = () => {
  return (
    <div className="lg:flex items-center space-x-8 lg:space-x-8">
      <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-8">
        <NavLink href="/for-chains">For Chains</NavLink>
        <NavLink href="/for-analysts">For Analysts</NavLink>
        <NavLink href="/for-explorers">For Explorers</NavLink>
        <NavLink href="/about">About</NavLink>
      </div>
    </div>
  );
};