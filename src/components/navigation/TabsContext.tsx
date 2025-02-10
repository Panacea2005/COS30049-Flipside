import { createContext, useContext, useState } from 'react';

type TabType = 'chains' | 'analysts' | 'explorers';

interface TabsContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export const TabsProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeTab, setActiveTab] = useState<TabType>('chains');

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
};

export const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabsContext must be used within a TabsProvider');
  }
  return context;
};