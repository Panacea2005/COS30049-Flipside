import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserMenu } from '../auth/UserMenu';

export const AuthButtons = () => {
  const { user } = useAuth();

  if (user) {
    return <UserMenu />;
  }

  return (
    <div className="flex items-center space-x-4">
      <Link 
        to="/login"
        className="text-gray-700 hover:text-gray-900 font-medium"
      >
        Log in
      </Link>
      <Link
        to="/signup"
        className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-900"
      >
        Sign up
      </Link>
    </div>
  );
};