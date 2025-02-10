import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

export const UserMenu = () => {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center"
      >
        {user.user_metadata.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt="Avatar"
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <span className="text-violet-600">{user.email?.[0].toUpperCase()}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
          <div className="px-4 py-2 border-b">
            <p className="text-sm font-medium text-black truncate">{user.user_metadata.username}</p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>

          <Link
            to="/settings/profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            Settings
          </Link>

          <button
            onClick={() => {
              signOut();
              setIsOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};