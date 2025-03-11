import { createBrowserRouter } from 'react-router-dom';
import { HomePage } from '../pages/Home/HomePage';
import { LoginPage } from '../pages/Auth/LoginPage';
import { SignUpPage } from '../pages/Auth/SignUpPage';
import { FlidePage } from '../pages/Flide/FlidePage';
import { StudioPage } from '../pages/Studio/StudioPage';
import CryptoExchangePage from '../pages/Exchange/CryptoExchangePage';
import { ForChainsPage } from '../pages/ForChains/ForChainsPage';
import { ForAnalystsPage } from '../pages/ForAnalysts/ForAnalystsPage';
import { ForExplorersPage } from '../pages/ForExplorers/ForExplorersPage';
import { AboutPage } from '../pages/About/AboutPage';
import { RootLayout } from '../layouts/RootLayout';
import { SettingsPage } from '../pages/Settings/SettingsPage';
import { ProfileSettings } from '../components/settings/ProfileSettings';
import { AddressSettings } from '@/components/settings/AddressSettings';
import NFTMarketplace from '@/pages/NFTs/NFTMarketPlace';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignUpPage /> },
      { path: 'flide', element: <FlidePage /> },
      { path: 'studio', element: <StudioPage /> },
      { path: 'exchange', element: <CryptoExchangePage /> },
      { path: 'nfts', element: <NFTMarketplace /> },
      { path: 'for-chains', element: <ForChainsPage /> },
      { path: 'for-analysts', element: <ForAnalystsPage /> },
      { path: 'for-explorers', element: <ForExplorersPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'settings', element: <SettingsPage />, children: [
        { path: 'profile', element: <ProfileSettings /> },
        { path: 'addresses', element: <AddressSettings /> },
      ]},
    ],
  },
]);