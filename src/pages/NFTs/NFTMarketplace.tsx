import React, { useState, useEffect } from 'react';
import { Search, Wallet, ArrowRightLeft, Loader, Grid, Package, ShoppingCart, User, X } from 'lucide-react';
import { 
  fetchListedNfts, 
  fetchUserNfts,
  fetchNftCollections,
  purchaseNft, 
  NftItem, 
  NftCollection 
} from '../../lib/etherscan/etherscanNftservice';

export default function NFTMarketplace() {
  const [network, setNetwork] = useState<'mainnet' | 'sepolia'>('mainnet');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState('marketplace');
  const [isLoading, setIsLoading] = useState(true);
  const [listedNfts, setListedNfts] = useState<NftItem[]>([]);
  const [userNfts, setUserNfts] = useState<NftItem[]>([]);
  const [collections, setCollections] = useState<NftCollection[]>([]);
  const [selectedNft, setSelectedNft] = useState<NftItem | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<{
    success: boolean;
    message: string;
    txHash?: string;
  } | null>(null);

  const switchNetwork = (newNetwork: 'mainnet' | 'sepolia') => {
    setNetwork(newNetwork);
    setIsLoading(true);
    loadMarketplaceData(newNetwork);
  };

  const connectWallet = async () => {
    setIsWalletConnecting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const address = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"; 
      setWalletAddress(address);
      if (activeTab === 'myNfts') {
        loadUserNfts(address, network);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      alert("Failed to connect wallet. Please try again.");
    } finally {
      setIsWalletConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress('');
    setUserNfts([]);
  };

  const loadMarketplaceData = async (currentNetwork: 'mainnet' | 'sepolia' = network) => {
    setIsLoading(true);
    try {
      const [nfts, collections] = await Promise.all([
        fetchListedNfts(currentNetwork, 12),
        fetchNftCollections(currentNetwork, 6)
      ]);
      setListedNfts(nfts);
      setCollections(collections);
    } catch (error) {
      console.error("Failed to load marketplace data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserNfts = async (address: string, currentNetwork: 'mainnet' | 'sepolia' = network) => {
    if (!address) return;
    setIsLoading(true);
    try {
      const nfts = await fetchUserNfts(address, currentNetwork);
      setUserNfts(nfts);
    } catch (error) {
      console.error("Failed to load user NFTs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchaseNft = async () => {
    if (!selectedNft || !walletAddress) return;
    setIsPurchasing(true);
    setPurchaseStatus(null);
    try {
      const result = await purchaseNft(
        selectedNft.contractAddress,
        selectedNft.tokenId,
        selectedNft.price,
        walletAddress,
        network
      );
      if (result.success) {
        setPurchaseStatus({
          success: true,
          message: 'NFT purchased successfully!',
          txHash: result.transactionHash
        });
        setListedNfts(prev => prev.filter(nft => nft.tokenId !== selectedNft.tokenId));
      } else {
        setPurchaseStatus({
          success: false,
          message: result.error || 'Purchase failed. Please try again.'
        });
      }
    } catch (error) {
      console.error("Error purchasing NFT:", error);
      setPurchaseStatus({
        success: false,
        message: 'An error occurred during purchase.'
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  useEffect(() => {
    if (activeTab === 'myNfts' && walletAddress) {
      loadUserNfts(walletAddress, network);
    }
  }, [activeTab, walletAddress, network]);

  useEffect(() => {
    setSelectedNft(null);
    setPurchaseStatus(null);
  }, [activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleNftClick = (nft: NftItem) => {
    setSelectedNft(nft);
    setPurchaseStatus(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white shadow-sm py-4 mt-16">
        <div className="container mx-auto px-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Package className="h-6 w-6 text-indigo-500" />
            <h1 className="text-xl font-bold text-gray-800">NFT Marketplace</h1>
          </div>
          
          {/* Network toggle and wallet connection */}
          <div className="flex items-center space-x-4">
            {/* Network toggle */}
            <div className="flex items-center p-1 bg-gray-100 rounded-lg">
              <button 
                onClick={() => switchNetwork('mainnet')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${network === 'mainnet' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Mainnet
              </button>
              <button 
                onClick={() => switchNetwork('sepolia')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${network === 'sepolia' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Sepolia
              </button>
            </div>

            {/* Wallet button */}
            {walletAddress ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors">
                  <User className="h-5 w-5" />
                  <span>{`${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`}</span>
                </button>
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg hidden group-hover:block">
                  <button 
                    onClick={disconnectWallet}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={connectWallet}
                disabled={isWalletConnecting}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:bg-indigo-300"
              >
                {isWalletConnecting ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="h-5 w-5" />
                    <span>Connect Wallet</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          <button 
            onClick={() => handleTabChange('marketplace')}
            className={`mr-6 py-2 px-1 font-medium ${activeTab === 'marketplace' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Marketplace
          </button>
          <button 
            onClick={() => handleTabChange('collections')}
            className={`mr-6 py-2 px-1 font-medium ${activeTab === 'collections' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Collections
          </button>
          <button 
            onClick={() => handleTabChange('myNfts')}
            className={`mr-6 py-2 px-1 font-medium ${activeTab === 'myNfts' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            My NFTs
          </button>
          <button 
            onClick={() => handleTabChange('activity')}
            className={`py-2 px-1 font-medium ${activeTab === 'activity' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Activity
          </button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
              <p className="text-gray-500">Loading NFTs on {network}...</p>
            </div>
          </div>
        )}

        {/* Marketplace Tab */}
        {!isLoading && activeTab === 'marketplace' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Available NFTs on {network === 'mainnet' ? 'Ethereum Mainnet' : 'Sepolia Testnet'}
              </h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => loadMarketplaceData()}
                  className="flex items-center space-x-1 px-3 py-1 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
            
            {listedNfts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">No NFTs currently listed for sale on {network}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {listedNfts.map((nft) => (
                  <div 
                    key={`${nft.contractAddress}-${nft.tokenId}`}
                    onClick={() => handleNftClick(nft)}
                    className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="h-48 w-full bg-gray-200 overflow-hidden">
                      <img 
                        src={nft.metadata?.image || `/api/placeholder/400/400`} 
                        alt={nft.metadata?.name || nft.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 truncate">{nft.metadata?.name || nft.name}</h3>
                      <p className="text-sm text-gray-500 truncate">Collection: {nft.symbol}</p>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-indigo-500 font-bold">{nft.price} ETH</span>
                        <div className="flex items-center text-sm bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          <span>Buy Now</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
