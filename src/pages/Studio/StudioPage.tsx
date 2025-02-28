import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { StudioTabs } from "./components/StudioTabs";
import { OverviewPage } from "./components/Overview/OverviewPage";
import { VisualizationPage } from "./components/Visualization/VisualizationPage";
import { TransactionHistory } from "./components/TransactionHistory/TransactionHistory";
import { MarketDashboard } from "./components/Market/MarketDashboard";
import TradePage from "./components/Trade/TradePage";

type TabType =
  | "trade"
  | "overview"
  | "visualization"
  | "transactions"
  | "market";

export const StudioPage = () => {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Get the tab from the URL (either from query params or hash)
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  useEffect(() => {
    const urlTab = new URLSearchParams(location.search).get("tab") as TabType;
    if (urlTab) {
      setActiveTab(urlTab);
    }
  }, [location.search]);

  useEffect(() => {
    // Update the URL when the active tab changes
    navigate(`?tab=${activeTab}`, { replace: true });
  }, [activeTab, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewPage />;
      case "visualization":
        return <VisualizationPage />;
      case "transactions":
        return <TransactionHistory />;
      case "market":
        return <MarketDashboard />;
      case "trade":
        return <TradePage />;
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
