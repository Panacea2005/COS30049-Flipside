import { Outlet } from 'react-router-dom';
import { SettingsSidebar } from '../../components/settings/SettingsSidebar';

export const SettingsPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="flex flex-col sm:flex-row">
            <SettingsSidebar />
            <div className="flex-1 mt-16 sm:mt-0 sm:pl-8">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};