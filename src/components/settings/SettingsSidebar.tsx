import { NavLink } from 'react-router-dom';
import { User, Wallet } from 'lucide-react';

const links = [
  { to: '/settings/profile', label: 'Profile', icon: User },
  { to: '/settings/addresses', label: 'Wallet Addresses', icon: Wallet },
];

export const SettingsSidebar = () => {
  return (
    <nav className="w-full sm:w-64 border-r h-full">
      <div className="p-4 mt-16">
        <h2 className="text-lg font-medium">Settings</h2>
      </div>
      <div className="space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-sm ${
                isActive
                  ? 'bg-violet-50 text-violet-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <Icon className="w-4 h-4 mr-3" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};