import { BarChart2, Share2, History, TrendingUp, DollarSign } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TabType =  'trade' | 'market' | 'overview' | 'visualization' | 'transactions';

interface StudioTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: 'trade', label: 'Trade', icon: DollarSign },
  { id: 'market', label: 'Market', icon: TrendingUp },
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'visualization', label: 'Visualization', icon: Share2 },
  { id: 'transactions', label: 'Transactions', icon: History },
] as const;

export const StudioTabs = ({ activeTab, onTabChange }: StudioTabsProps) => {
  return (
    <div className="border-b">
      <div className="container max-w-screen-2xl mx-auto px-4">
        <Tabs value={activeTab} onValueChange={onTabChange as (value: string) => void}>
          <TabsList className="flex h-12 mt-4 sm:mt-8 overflow-x-auto whitespace-nowrap">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex items-center gap-2 px-4 py-2 sm:py-0"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};

export default StudioTabs;