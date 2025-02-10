import { Outlet } from 'react-router-dom';
import { TabsProvider } from '../components/navigation/TabsContext';
import { Navbar } from '../components/Navbar/Navbar';
import { Footer } from '../components/Footer/Footer';
import { TabsNav } from '../components/navigation/TabsNav';

export const RootLayout = () => {
  return (
    <TabsProvider>
      <div className="min-h-screen bg-white">
        <Navbar />
        <TabsNav />
        <main>
          <Outlet />
        </main>
        <Footer />
      </div>
    </TabsProvider>
  );
};