import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { StudioTabs } from './components/StudioTabs';
import { OverviewPage } from './components/Overview/OverviewPage';
import { VisualizationPage } from './components/Visualization/VisualizationPage';
import { TransactionHistory } from './components/TransactionHistory/TransactionHistory';
import { MarketDashboard } from './components/Market/MarketDashboard';

type TabType = 'overview' | 'visualization' | 'transactions' | 'market';

export const StudioPage = () => {
  const { isLoggedIn, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('market');

  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPage />;
      case 'visualization':
        return <VisualizationPage />;
      case 'transactions':
        return <TransactionHistory />;
      case 'market':
        return <MarketDashboard />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-12 sm:pt-8">
      <StudioTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="container max-w-screen-2xl mx-auto px-4 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default StudioPage;