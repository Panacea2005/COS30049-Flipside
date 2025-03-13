import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchListedNfts,
  fetchUserNfts,
  fetchNftCollections,
  fetchCollectionInfo,
  fetchTotalCollectionsCount,
  buyNft,
  listNftForSale,
  NftItem,
  NftCollection,
} from "../../lib/alchemy/alchemyNFTService";
import { BrowserProvider } from "ethers";

// Import shadcn UI components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Loader2, Info, AlertTriangle, CheckCircle2, Tag } from "lucide-react";

const NFTMarketplace: React.FC = () => {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [network, setNetwork] = useState<string>("mainnet");
  const [listedNfts, setListedNfts] = useState<NftItem[]>([]);
  const [userNfts, setUserNfts] = useState<NftItem[]>([]);
  const [collections, setCollections] = useState<NftCollection[]>([]);
  const [totalCollections, setTotalCollections] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingUserNfts, setLoadingUserNfts] = useState<boolean>(false);
  const [purchasing, setPurchasing] = useState<boolean>(false);
  const [listing, setListing] = useState<boolean>(false);
  const [selectedNft, setSelectedNft] = useState<NftItem | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<boolean>(false);
  const [listingSuccess, setListingSuccess] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string>("");
  const [purchaseError, setPurchaseError] = useState<string>("");
  const [listingError, setListingError] = useState<string>("");
  const [openPurchaseDialog, setOpenPurchaseDialog] = useState<boolean>(false);
  const [openListingDialog, setOpenListingDialog] = useState<boolean>(false);
  const [listingPrice, setListingPrice] = useState<string>("");
  const [listingName, setListingName] = useState<string>("");
  const [listingDescription, setListingDescription] = useState<string>("");
  const [listingCollection, setListingCollection] = useState<string>("");
  const [listingImage, setListingImage] = useState<File | null>(null);
  const [listingImagePreview, setListingImagePreview] = useState<string>("");
  const [isNewCollection, setIsNewCollection] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(6);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [marketplacePage, setMarketplacePage] = useState<number>(1);

  useEffect(() => {
    const loadMarketplace = async () => {
      setLoading(true);
      try {
        const listedNftsResult = await fetchListedNfts(network, itemsPerPage);
        setListedNfts(listedNftsResult);
        const collectionsResult = await fetchNftCollections(network, currentPage, itemsPerPage);
        setCollections(collectionsResult);
        const total = await fetchTotalCollectionsCount(network);
        setTotalCollections(total);
      } catch (error) {
        console.error("Error loading marketplace data:", error);
        toast({
          title: "Error",
          description: "Failed to load marketplace data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadMarketplace();
  }, [network, currentPage, itemsPerPage]);

  useEffect(() => {
    const loadUserNfts = async () => {
      if (!walletAddress) return;

      setLoadingUserNfts(true);
      try {
        const userNftsResult = await fetchUserNfts(walletAddress, network);
        setUserNfts(userNftsResult);
      } catch (error) {
        console.error("Error loading user NFTs:", error);
        toast({
          title: "Error",
          description: "Failed to load your NFTs. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingUserNfts(false);
      }
    };

    loadUserNfts();
  }, [walletAddress, network]);

  useEffect(() => {
    if (window.ethereum) {
      const handleChainChanged = (chainId: string) => {
        let newNetwork = "mainnet";
        if (chainId === "0xaa36a7") {
          newNetwork = "sepolia";
        }
        setNetwork(newNetwork);
        fetchListedNfts(newNetwork, 12).then(setListedNfts);
        fetchNftCollections(newNetwork).then(setCollections);
        if (walletAddress) {
          fetchUserNfts(walletAddress, newNetwork).then(setUserNfts);
        }
      };

      window.ethereum.on("chainChanged", handleChainChanged);
      return () => {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [walletAddress]);

  useEffect(() => {
    const checkMetaMask = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
          const chainId = await window.ethereum.request({
            method: "eth_chainId",
          });
          if (chainId === "0x1") {
            setNetwork("mainnet");
          } else if (chainId === "0xaa36a7") {
            setNetwork("sepolia");
          }
        } catch (error) {
          console.error("Error checking MetaMask connection:", error);
        }
      }
    };
    checkMetaMask();
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleMarketplacePageChange = (page: number) => {
    setMarketplacePage(page);
    fetchListedNfts(network, itemsPerPage).then(setListedNfts);
  };

  const handleNetworkChange = async (newNetwork: string) => {
    try {
      if (!window.ethereum) {
        toast({
          title: "MetaMask Not Found",
          description: "Please install MetaMask to use this feature.",
          variant: "destructive",
        });
        return;
      }
      const chainIds = {
        mainnet: "0x1",
        sepolia: "0xaa36a7",
      };
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIds[newNetwork as keyof typeof chainIds] }],
      });
      setNetwork(newNetwork);
      toast({
        title: "Network Changed",
        description: `Switched to ${
          newNetwork === "mainnet" ? "Ethereum Mainnet" : "Sepolia Testnet"
        }`,
      });
      if (walletAddress) {
        fetchUserNfts(walletAddress, newNetwork).then(setUserNfts);
      }
      fetchListedNfts(newNetwork, 12).then(setListedNfts);
      fetchNftCollections(newNetwork).then(setCollections);
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          const networkParams = {
            sepolia: {
              chainId: "0xaa36a7",
              chainName: "Sepolia Testnet",
              nativeCurrency: {
                name: "Sepolia Ether",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: ["https://sepolia.infura.io/v3/"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          };
          if (newNetwork === "sepolia") {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [networkParams.sepolia],
            });
            setNetwork(newNetwork);
          }
        } catch (addError) {
          console.error("Failed to add network:", addError);
        }
      }
      console.error("Failed to switch network:", error);
      toast({
        title: "Error",
        description: "Failed to switch networks. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConnectWallet = async () => {
    try {
      if (!window.ethereum) {
        toast({
          title: "MetaMask Not Found",
          description: "Please install MetaMask to use this feature.",
          variant: "destructive",
        });
        return;
      }
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setWalletAddress(accounts[0]);
      window.ethereum.on("accountsChanged", (newAccounts: string[]) => {
        setWalletAddress(newAccounts[0] || "");
      });
      toast({
        title: "Wallet Connected",
        description: `Connected to ${accounts[0].substring(
          0,
          6
        )}...${accounts[0].substring(38)}`,
      });
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnectWallet = () => {
    setWalletAddress("");
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    });
  };

  const handlePurchase = async (nft: NftItem) => {
    setSelectedNft(nft);
    setOpenPurchaseDialog(true);
  };

  const handleListForSale = async (nft: NftItem) => {
    setSelectedNft(nft);
    setListingPrice("");
    setListingName(nft.name || `NFT #${nft.tokenId}`);
    setListingDescription("");
    setListingCollection(
      typeof nft.collection === "string" ? nft.collection : ""
    );
    setListingImage(null);
    setListingImagePreview(nft.image || "");
    setIsNewCollection(false);
    setListingSuccess(false);
    setListingError("");
    setOpenListingDialog(true);
  };

  const confirmPurchase = async () => {
    if (!selectedNft || !walletAddress) return;

    setPurchasing(true);
    setPurchaseSuccess(false);
    setPurchaseError("");

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not found. Please install MetaMask.");
      }
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const success = await buyNft(
        selectedNft.contractAddress,
        selectedNft.tokenId,
        signer,
        network
      );

      if (success) {
        const transactionCount = await provider.getTransactionCount(
          walletAddress
        );
        const tx = await provider.getTransaction(
          (transactionCount - 1).toString(16)
        );
        const transactionHash = tx ? tx.hash : "";

        setPurchaseSuccess(true);
        setTxHash(transactionHash);

        // Refresh NFT lists
        const updatedNfts = await fetchListedNfts(network, 12);
        setListedNfts(updatedNfts);
        const updatedUserNfts = await fetchUserNfts(walletAddress, network);
        setUserNfts(updatedUserNfts);

        toast({
          title: "Purchase Successful",
          description: "You have successfully purchased the NFT!",
        });
      } else {
        setPurchaseError("Transaction failed. Please try again.");
        toast({
          title: "Purchase Failed",
          description: "Transaction failed. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error during purchase:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setPurchaseError(errorMessage);
      toast({
        title: "Purchase Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setPurchasing(false);
    }
  };

  const confirmListing = async () => {
    if (!selectedNft || !walletAddress || !listingPrice) return;

    setListing(true);
    setListingSuccess(false);
    setListingError("");

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not found. Please install MetaMask.");
      }

      // Validate price input
      const priceValue = parseFloat(listingPrice);
      if (isNaN(priceValue) || priceValue <= 0) {
        throw new Error("Please enter a valid price greater than 0");
      }

      // Validate other required fields
      if (!listingName.trim()) {
        throw new Error("Please enter a name for your NFT");
      }

      // Here you would upload the image if a new one was selected
      // This would typically involve uploading to IPFS or another storage solution
      // For now, we'll just simulate this step
      let imageUrl = listingImagePreview;
      if (listingImage) {
        // Simulating image upload - in a real app you'd upload to IPFS or similar
        // imageUrl = await uploadImageToStorage(listingImage);
        console.log("Would upload image:", listingImage.name);
        // For now, we'll create a local object URL as a preview
        imageUrl = URL.createObjectURL(listingImage);
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // You would need to modify your listNftForSale function to accept the new parameters
      // For now, we'll continue with the existing function
      const success = await listNftForSale(
        selectedNft.contractAddress,
        selectedNft.tokenId,
        listingPrice,
        signer,
        network
      );

      if (success) {
        const transactionCount = await provider.getTransactionCount(
          walletAddress
        );
        const tx = await provider.getTransaction(
          (transactionCount - 1).toString(16)
        );
        const transactionHash = tx ? tx.hash : "";

        setListingSuccess(true);
        setTxHash(transactionHash);

        // Update the NFT with new metadata
        const updatedUserNft = {
          ...selectedNft,
          isListed: true,
          price: listingPrice,
          name: listingName,
          description: listingDescription,
          collection: listingCollection,
          image: imageUrl,
        };

        // Update the NFT lists - refresh data from blockchain
        const updatedListedNfts = await fetchListedNfts(network, 12);
        setListedNfts(updatedListedNfts);
        const updatedUserNfts = await fetchUserNfts(walletAddress, network);
        setUserNfts(updatedUserNfts);

        toast({
          title: "NFT Listed Successfully",
          description: `Your NFT has been listed for ${listingPrice} ETH!`,
        });
      } else {
        setListingError("Transaction failed. Please try again.");
        toast({
          title: "Listing Failed",
          description: "Transaction failed. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error during listing:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setListingError(errorMessage);
      toast({
        title: "Listing Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setListing(false);
    }
  };

  const closePurchaseDialog = () => {
    setOpenPurchaseDialog(false);
    setPurchaseSuccess(false);
    setPurchaseError("");
    setSelectedNft(null);
  };

  const closeListingDialog = () => {
    setOpenListingDialog(false);
    setListingSuccess(false);
    setListingError("");
    setSelectedNft(null);
    setListingPrice("");
    setListingName("");
    setListingDescription("");
    setListingCollection("");
    setListingImage(null);
    setListingImagePreview("");
    setIsNewCollection(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setListingImage(file);
      setListingImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCollectionSearch = async () => {
    if (!searchQuery.trim()) return;
  
    setIsSearching(true);
    try {
      const collection = await fetchCollectionInfo(searchQuery.trim(), network);
      if (collection) {
        setCollections([collection]);
      } else {
        toast({
          title: "Collection Not Found",
          description:
            "No collection found with that address. Please check and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error searching collection:", error);
      toast({
        title: "Search Error",
        description: "Failed to search for collection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };  

  const clearCollectionSearch = async () => {
    setSearchQuery("");
    setIsSearching(true);
    try {
      const collectionsResult = await fetchNftCollections(network, currentPage, itemsPerPage);
      setCollections(collectionsResult);
    } finally {
      setIsSearching(false);
    }
  };

  const renderPagination = (totalItems: number, currentPage: number, onPageChange: (page: number) => void) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pageRange = 2; // Show 2 pages on either side of current page

    const pages = [];
    const startPage = Math.max(1, currentPage - pageRange);
    const endPage = Math.min(totalPages, currentPage + pageRange);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          {pages.map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => onPageChange(page)}
                isActive={page === currentPage}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const renderNftCard = (nft: NftItem, isUserNft: boolean = false) => {
    return (
      <Card className="overflow-hidden h-full flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start mb-2">
            <Badge variant={nft.isListed ? "secondary" : "outline"}>
              {nft.isListed ? `${nft.price} ETH` : "Not Listed"}
            </Badge>
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={nft.collection ? nft.collection.toString() : ""}
                alt={nft.collection ? nft.collection.toString() : ""}
              />
              <AvatarFallback>
                {nft.collection?.name?.substring(0, 2) || "NFT"}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-lg truncate">
            {nft.name || `NFT #${nft.tokenId}`}
          </CardTitle>
          <CardDescription className="truncate">
            {typeof nft.collection === "string"
              ? nft.collection
              : "Unknown Collection"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-0">
          <div className="relative aspect-square w-full overflow-hidden">
            {nft.image ? (
              <img
                src={nft.image}
                alt={nft.name || `NFT #${nft.tokenId}`}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                <Info className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-4 flex flex-col gap-2">
          {walletAddress ? (
            isUserNft ? (
              // Enhanced buttons for user's NFTs
              <>
                <Button
                  onClick={() => handleListForSale(nft)}
                  className="w-full"
                  disabled={nft.isListed}
                  variant={nft.isListed ? "outline" : "default"}
                >
                  {nft.isListed ? "Listed for Sale" : "List for Sale"}
                </Button>
                {nft.isListed && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      // Here you would add a function to cancel listing
                      // For now we'll just inform the user
                      toast({
                        title: "Feature Coming Soon",
                        description:
                          "Cancel listing feature will be available in the next update.",
                      });
                    }}
                  >
                    Cancel Listing
                  </Button>
                )}
              </>
            ) : (
              // For marketplace NFTs (not owned by user)
              <Button onClick={() => handlePurchase(nft)} className="w-full">
                Buy Now
              </Button>
            )
          ) : (
            <Button onClick={handleConnectWallet} className="w-full">
              Connect Wallet
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 mt-16 gap-4">
        <h1 className="text-3xl font-bold">NFT Marketplace</h1>
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={network} onValueChange={handleNetworkChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Network" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mainnet">Ethereum Mainnet</SelectItem>
              <SelectItem value="sepolia">Sepolia Testnet</SelectItem>
            </SelectContent>
          </Select>

          {walletAddress ? (
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {walletAddress.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline">
                  {walletAddress.substring(0, 6)}...
                  {walletAddress.substring(38)}
                </span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDisconnectWallet}
              >
                <span className="sr-only">Disconnect wallet</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </Button>
            </div>
          ) : (
            <Button onClick={handleConnectWallet}>Connect Wallet</Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="marketplace">
        <TabsList className="mb-6">
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="myNfts">My NFTs</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array(8)
                .fill(0)
                .map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-full mt-2" />
                      <Skeleton className="h-4 w-3/4 mt-2" />
                    </CardHeader>
                    <CardContent className="p-0">
                      <Skeleton className="h-[200px] w-full" />
                    </CardContent>
                    <CardFooter className="pt-4">
                      <Skeleton className="h-10 w-full" />
                    </CardFooter>
                  </Card>
                ))}
            </div>
          ) : listedNfts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {listedNfts.map((nft) => (
                  <div key={`${nft.contractAddress}-${nft.tokenId}`}>
                    {renderNftCard(nft)}
                  </div>
                ))}
              </div>
              {renderPagination(listedNfts.length, marketplacePage, handleMarketplacePageChange)}
            </>
          ) : (
            <Alert className="bg-muted">
              <Info className="h-5 w-5" />
              <AlertTitle>No NFTs Listed</AlertTitle>
              <AlertDescription>
                There are currently no NFTs listed for sale on this network.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="collections" className="mt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-1 items-center space-x-2">
                <Input
                  placeholder="Search collection by address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCollectionSearch();
                  }}
                />
                <Button
                  onClick={handleCollectionSearch}
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Search"
                  )}
                </Button>
                {searchQuery && (
                  <Button
                    variant="ghost"
                    onClick={clearCollectionSearch}
                    disabled={isSearching}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {loading || isSearching ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array(3)
                  .fill(0)
                  .map((_, index) => (
                    <Skeleton key={index} className="h-[200px] w-full rounded-lg" />
                  ))}
              </div>
            ) : collections.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {collections.map((collection) => (
                    <Card
                      key={collection.id}
                      className="overflow-hidden transition-all hover:shadow-md"
                    >
                      <div className="relative h-32 w-full">
                        {collection.bannerUrl ? (
                          <img
                            src={collection.bannerUrl}
                            alt={collection.name}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-100">
                            <Info className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                            <AvatarImage src={collection.imageUrl} />
                            <AvatarFallback>
                              {collection.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle>{collection.name}</CardTitle>
                            <CardDescription>
                              {collection.itemCount} items
                            </CardDescription>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-0">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            navigate(`/collections/${collection.address}`)
                          }
                        >
                          View Collection
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                {renderPagination(totalCollections, currentPage, handlePageChange)}
              </>
            ) : (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No Collections Available</AlertTitle>
                <AlertDescription>
                  {searchQuery
                    ? "No collection found with that address."
                    : "There are currently no NFT collections available. Check back later!"}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>

        <TabsContent value="myNfts">
          {!walletAddress ? (
            <Alert>
              <Info className="h-5 w-5" />
              <AlertTitle>Wallet Not Connected</AlertTitle>
              <AlertDescription>
                Please connect your wallet to view your NFTs.
                <Button
                  variant="link"
                  className="p-0 h-auto ml-2"
                  onClick={handleConnectWallet}
                >
                  Connect Wallet
                </Button>
              </AlertDescription>
            </Alert>
          ) : loadingUserNfts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-[300px] w-full" />
                ))}
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Your NFTs</h2>
                  <p className="text-sm text-muted-foreground">
                    Manage your NFT collection
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setLoadingUserNfts(true);
                      fetchUserNfts(walletAddress, network)
                        .then(setUserNfts)
                        .finally(() => setLoadingUserNfts(false));
                    }}
                    disabled={loadingUserNfts}
                  >
                    {loadingUserNfts ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      "Refresh NFTs"
                    )}
                  </Button>
                  <Button onClick={() => setOpenListingDialog(true)} size="sm">
                    List NFT for Sale
                  </Button>
                </div>
              </div>

              {userNfts.length > 0 ? (
                <>
                  {/* Filter tabs to separate listed vs unlisted NFTs */}
                  <div className="mb-6">
                    <Tabs defaultValue="all" className="w-full">
                      <TabsList className="w-full max-w-md">
                        <TabsTrigger value="all" className="flex-1">
                          All NFTs ({userNfts.length})
                        </TabsTrigger>
                        <TabsTrigger value="listed" className="flex-1">
                          Listed (
                          {userNfts.filter((nft) => nft.isListed).length})
                        </TabsTrigger>
                        <TabsTrigger value="unlisted" className="flex-1">
                          Not Listed (
                          {userNfts.filter((nft) => !nft.isListed).length})
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="all" className="pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                          {userNfts.map((nft) => (
                            <div key={`${nft.contractAddress}-${nft.tokenId}`}>
                              {renderNftCard(nft, true)}
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="listed" className="pt-4">
                        {userNfts.filter((nft) => nft.isListed).length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {userNfts
                              .filter((nft) => nft.isListed)
                              .map((nft) => (
                                <div
                                  key={`${nft.contractAddress}-${nft.tokenId}`}
                                >
                                  {renderNftCard(nft, true)}
                                </div>
                              ))}
                          </div>
                        ) : (
                          <Alert>
                            <AlertTitle>No Listed NFTs</AlertTitle>
                            <AlertDescription>
                              You haven't listed any NFTs for sale yet.
                            </AlertDescription>
                          </Alert>
                        )}
                      </TabsContent>

                      <TabsContent value="unlisted" className="pt-4">
                        {userNfts.filter((nft) => !nft.isListed).length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {userNfts
                              .filter((nft) => !nft.isListed)
                              .map((nft) => (
                                <div
                                  key={`${nft.contractAddress}-${nft.tokenId}`}
                                >
                                  {renderNftCard(nft, true)}
                                </div>
                              ))}
                          </div>
                        ) : (
                          <Alert>
                            <AlertTitle>All NFTs Listed</AlertTitle>
                            <AlertDescription>
                              All your NFTs are currently listed for sale.
                            </AlertDescription>
                          </Alert>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </>
              ) : (
                <Alert className="bg-muted">
                  <Info className="h-5 w-5" />
                  <AlertTitle>No NFTs Found</AlertTitle>
                  <AlertDescription>
                    You don't own any NFTs on the current network.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Purchase NFT Dialog */}
      <Dialog open={openPurchaseDialog} onOpenChange={setOpenPurchaseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Purchase NFT</DialogTitle>
            <DialogDescription>
              You are about to purchase{" "}
              <span className="font-bold">
                {selectedNft?.name || `NFT #${selectedNft?.tokenId}`}
              </span>
            </DialogDescription>
          </DialogHeader>

          {purchaseSuccess ? (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <AlertTitle>Purchase Successful!</AlertTitle>
                <AlertDescription>
                  You have successfully purchased this NFT.
                </AlertDescription>
              </Alert>
              {txHash && (
                <div className="text-sm">
                  <p className="font-medium mb-1">Transaction Hash:</p>
                  <code className="bg-muted p-2 rounded block overflow-x-auto">
                    {txHash}
                  </code>
                </div>
              )}
            </div>
          ) : purchaseError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle>Purchase Failed</AlertTitle>
              <AlertDescription>{purchaseError}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="rounded-lg overflow-hidden w-24 h-24">
                  {selectedNft?.image ? (
                    <img
                      src={selectedNft.image}
                      alt={selectedNft.name || `NFT #${selectedNft.tokenId}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                      <Info className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium">
                    {selectedNft?.name || `NFT #${selectedNft?.tokenId}`}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {typeof selectedNft?.collection === "string"
                      ? selectedNft.collection
                      : "Unknown Collection"}
                  </p>
                  <div className="flex items-center mt-1">
                    <Tag className="h-4 w-4 mr-1" />
                    <span className="font-medium text-primary">
                      {selectedNft?.price} ETH
                    </span>
                  </div>
                </div>
              </div>

              <Alert>
                <Info className="h-5 w-5" />
                <AlertTitle>Transaction Information</AlertTitle>
                <AlertDescription>
                  You will be asked to confirm this transaction in your wallet.
                  Network fees will apply.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            {purchaseSuccess ? (
              <Button onClick={closePurchaseDialog}>Close</Button>
            ) : purchaseError ? (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={closePurchaseDialog}>
                  Cancel
                </Button>
                <Button onClick={confirmPurchase}>Try Again</Button>
              </div>
            ) : (
              <div className="flex space-x-2 w-full justify-between sm:justify-end">
                <Button variant="outline" onClick={closePurchaseDialog}>
                  Cancel
                </Button>
                <Button onClick={confirmPurchase} disabled={purchasing}>
                  {purchasing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Buy for ${selectedNft?.price} ETH`
                  )}
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* List NFT for Sale Dialog */}
      {/* List NFT for Sale Dialog */}
      <Dialog open={openListingDialog} onOpenChange={setOpenListingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>List NFT for Sale</DialogTitle>
            <DialogDescription>
              Configure your NFT and set a price to list it on the marketplace.
            </DialogDescription>
          </DialogHeader>

          {listingSuccess ? (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <AlertTitle>Listing Successful!</AlertTitle>
                <AlertDescription>
                  Your NFT has been listed for {listingPrice} ETH.
                </AlertDescription>
              </Alert>
              {txHash && (
                <div className="text-sm">
                  <p className="font-medium mb-1">Transaction Hash:</p>
                  <code className="bg-muted p-2 rounded block overflow-x-auto">
                    {txHash}
                  </code>
                </div>
              )}
            </div>
          ) : listingError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle>Listing Failed</AlertTitle>
              <AlertDescription>{listingError}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
              {/* NFT Image Upload/Preview */}
              <div className="flex flex-col items-center space-y-3">
                <div className="rounded-lg overflow-hidden w-32 h-32 border">
                  {listingImagePreview ? (
                    <img
                      src={listingImagePreview}
                      alt="NFT Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                      <Info className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <Label htmlFor="nft-image" className="cursor-pointer">
                  <div className="flex items-center space-x-2 text-sm text-primary">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
                      <line x1="16" y1="5" x2="22" y2="5" />
                      <line x1="19" y1="2" x2="19" y2="8" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                    <span>Upload Image</span>
                  </div>
                </Label>
                <input
                  id="nft-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              {/* NFT Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={listingName}
                  onChange={(e) => setListingName(e.target.value)}
                  placeholder="My Awesome NFT"
                />
              </div>

              {/* NFT Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={listingDescription}
                  onChange={(e) => setListingDescription(e.target.value)}
                  placeholder="Describe your NFT..."
                  className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {/* Collection Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="collection">Collection</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => setIsNewCollection(!isNewCollection)}
                  >
                    {isNewCollection ? "Select Existing" : "Create New"}
                  </Button>
                </div>

                {isNewCollection ? (
                  <Input
                    id="new-collection"
                    value={listingCollection}
                    onChange={(e) => setListingCollection(e.target.value)}
                    placeholder="New Collection Name"
                  />
                ) : (
                  <Select
                    value={listingCollection}
                    onValueChange={setListingCollection}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a collection" />
                    </SelectTrigger>
                    <SelectContent>
                      {collections.map((collection) => (
                        <SelectItem key={collection.id} value={collection.name}>
                          {collection.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">Price (ETH)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="0.00"
                  value={listingPrice}
                  onChange={(e) => setListingPrice(e.target.value)}
                />
              </div>

              <Alert>
                <Info className="h-5 w-5" />
                <AlertTitle>Listing Information</AlertTitle>
                <AlertDescription>
                  You will need to approve the marketplace contract to transfer
                  your NFT when it sells. Network fees will apply for the
                  approval transaction.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            {listingSuccess ? (
              <Button onClick={closeListingDialog}>Close</Button>
            ) : listingError ? (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={closeListingDialog}>
                  Cancel
                </Button>
                <Button onClick={confirmListing}>Try Again</Button>
              </div>
            ) : (
              <div className="flex space-x-2 w-full justify-between sm:justify-end">
                <Button variant="outline" onClick={closeListingDialog}>
                  Cancel
                </Button>
                <Button
                  onClick={confirmListing}
                  disabled={
                    listing ||
                    !listingPrice ||
                    parseFloat(listingPrice) <= 0 ||
                    !listingName.trim()
                  }
                >
                  {listing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "List for Sale"
                  )}
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NFTMarketplace;
