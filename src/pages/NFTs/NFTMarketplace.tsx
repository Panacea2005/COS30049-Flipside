import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchUserNfts,
  fetchNftCollections,
  fetchCollectionInfo,
  fetchTotalCollectionsCount,
  fetchAllNetworkNfts,
  buyNft,
  listNftForSale,
  NftItem,
  NftCollection,
  mintNFT,
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
import { MARKETPLACE_ADDRESSES } from "../../lib/alchemy/alchemyNFTService";

const NFTMarketplace: React.FC = () => {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [network, setNetwork] = useState<string>("mainnet");
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
  const [listingImage, setListingImage] = useState<File | null>(null);
  const [listingImagePreview, setListingImagePreview] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(20);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [allNfts, setAllNfts] = useState<NftItem[]>([]);
  const [totalNftsCount, setTotalNftsCount] = useState<number>(0);
  const [nftsPage, setNftsPage] = useState<number>(1);
  const [loadingAllNfts, setLoadingAllNfts] = useState<boolean>(false);
  const [nftSearchQuery, setNftSearchQuery] = useState<string>("");
  const [isSearchingNfts, setIsSearchingNfts] = useState<boolean>(false);
  const [minting, setMinting] = useState<boolean>(false);
  const [mintSuccess, setMintSuccess] = useState<boolean>(false);
  const [mintError, setMintError] = useState<string>("");
  const [mintedTokenId, setMintedTokenId] = useState<string>("");

  // Load all NFTs
  useEffect(() => {
    const loadAllNfts = async () => {
      setLoadingAllNfts(true);
      setIsSearchingNfts(true);
      try {
        const { nfts, totalCount } = await fetchAllNetworkNfts(
          network,
          nftsPage,
          itemsPerPage,
          nftSearchQuery
        );
        setAllNfts(nfts);
        setTotalNftsCount(totalCount);
      } catch (error) {
        console.error("Error loading all NFTs:", error);
        toast({
          title: "Error",
          description: "Failed to load network NFTs. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingAllNfts(false);
        setIsSearchingNfts(false);
      }
    };

    loadAllNfts();
  }, [network, nftsPage, itemsPerPage, nftSearchQuery]);

  // Load user NFTs
  useEffect(() => {
    const loadUserNfts = async () => {
      if (!walletAddress) return;

      setLoadingUserNfts(true);
      try {
        const userNftsResult = await fetchUserNfts(walletAddress, network);
        console.log("Loaded user NFTs:", userNftsResult);
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
    const loadCollections = async () => {
      setLoading(true);
      try {
        const collectionsResult = await fetchNftCollections(
          network,
          currentPage,
          itemsPerPage
        );
        setCollections(collectionsResult);
        const total = await fetchTotalCollectionsCount(network);
        setTotalCollections(total);
      } catch (error) {
        console.error("Error loading collections:", error);
        toast({
          title: "Error",
          description: "Failed to load collections. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadCollections();
  }, [network, currentPage, itemsPerPage]);

  // Handle chain changes
  useEffect(() => {
    if (window.ethereum) {
      const handleChainChanged = (chainId: string) => {
        let newNetwork = "mainnet";
        if (chainId === "0xaa36a7") {
          newNetwork = "sepolia";
        }
        setNetwork(newNetwork);
        if (walletAddress) {
          fetchUserNfts(walletAddress, newNetwork).then(setUserNfts);
        }
        fetchNftCollections(newNetwork).then(setCollections); // Keep this
        fetchAllNetworkNfts(newNetwork, 1, itemsPerPage).then(
          ({ nfts, totalCount }) => {
            setAllNfts(nfts);
            setTotalNftsCount(totalCount);
          }
        );
      };

      window.ethereum.on("chainChanged", handleChainChanged);
      return () => {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [walletAddress, itemsPerPage]); // Update dependencies

  // Check MetaMask connection
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
      setNftSearchQuery("");
      toast({
        title: "Network Changed",
        description: `Switched to ${
          newNetwork === "mainnet" ? "Ethereum Mainnet" : "Sepolia Testnet"
        }`,
      });
      if (walletAddress) {
        fetchUserNfts(walletAddress, newNetwork).then(setUserNfts);
      }
      fetchNftCollections(newNetwork).then(setCollections);
      fetchAllNetworkNfts(newNetwork, 1, itemsPerPage).then(
        ({ nfts, totalCount }) => {
          setAllNfts(nfts);
          setTotalNftsCount(totalCount);
        }
      );
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
    console.log("handleListForSale called with NFT:", nft);
    setSelectedNft(nft);
    setListingPrice("0.0001"); // Default value for testing
    setListingName(nft.name || `NFT #${nft.tokenId}`);
    setListingDescription("");
    setListingImage(null);
    setListingImagePreview(nft.image || "");
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

      // Call buyNft and get the detailed result
      const result = await buyNft(selectedNft.tokenId, signer, network);
      if (!result.success) {
        throw new Error(result.error || "Transaction failed.");
      }

      setPurchaseSuccess(true);
      setTxHash(result.txHash || "");

      // Refresh user NFTs after purchase
      const updatedUserNfts = await fetchUserNfts(walletAddress, network);
      setUserNfts(updatedUserNfts);

      toast({
        title: "Purchase Successful",
        description: "You have successfully purchased the NFT!",
      });
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
    console.log("confirmListing called", {
      selectedNft,
      walletAddress,
      listingPrice,
      listingName,
    });
    if (!selectedNft || !walletAddress || !listingPrice) {
      console.log("Exiting early due to missing data");
      return;
    }

    setListing(true);
    setListingSuccess(false);
    setListingError("");

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not found. Please install MetaMask.");
      }

      const priceValue = parseFloat(listingPrice);
      if (isNaN(priceValue) || priceValue <= 0) {
        throw new Error("Please enter a valid price greater than 0");
      }

      if (!listingName.trim()) {
        throw new Error("Please enter a name for your NFT");
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const result = await listNftForSale(
        selectedNft.contractAddress,
        selectedNft.tokenId,
        listingPrice,
        signer,
        network
      );

      if (!result.success) {
        throw new Error(
          result.error || "Transaction failed. Please try again."
        );
      }

      setListingSuccess(true);
      setTxHash(result.txHash || "");

      // Update NFT state immediately
      const updatedUserNfts = userNfts.map((nft) =>
        nft.tokenId === selectedNft.tokenId &&
        nft.contractAddress === selectedNft.contractAddress
          ? { ...nft, isListed: true, price: listingPrice }
          : nft
      );
      setUserNfts(updatedUserNfts);

      // Refresh marketplace and user NFTs
      const [refreshedUserNfts] = await Promise.all([
        fetchUserNfts(walletAddress, network),
      ]);
      setUserNfts(refreshedUserNfts);

      toast({
        title: "NFT Listed Successfully",
        description: `Your NFT has been listed for ${listingPrice} ETH!`,
      });
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
    setListingImage(null);
    setListingImagePreview("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setListingImage(file);
      setListingImagePreview(URL.createObjectURL(file));
    }
  };

  const handleNftsPageChange = (page: number) => {
    setNftsPage(page);
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
      const collectionsResult = await fetchNftCollections(
        network,
        currentPage,
        itemsPerPage
      );
      setCollections(collectionsResult);
    } finally {
      setIsSearching(false);
    }
  };

  const handleMintNFT = () => {
    setSelectedNft(null);
    setListingPrice("");
    setListingName("");
    setListingDescription("");
    setListingImage(null);
    setListingImagePreview("");
    setMintSuccess(false);
    setMintError("");
    setOpenListingDialog(true);
  };

  const confirmMint = async () => {
    if (!walletAddress || !listingName || !listingImage) {
      toast({
        title: "Error",
        description: "Please provide a name and image for your NFT.",
        variant: "destructive",
      });
      return;
    }

    if (listingPrice && parseFloat(listingPrice) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid price greater than 0 ETH.",
        variant: "destructive",
      });
      return;
    }

    setMinting(true);
    setMintSuccess(false);
    setMintError("");

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not found. Please install MetaMask.");
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const metadata = {
        name: listingName,
        description: listingDescription,
        attributes: [],
      };

      const { tokenId, success, txHash } = await mintNFT(
        listingImage,
        metadata,
        signer,
        network,
        listingPrice
      );

      if (success) {
        setTxHash(txHash || "Transaction hash not available");
        setMintedTokenId(tokenId);
        setMintSuccess(true);

        await provider.waitForTransaction(txHash!, 1);
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for Alchemy to index

        // Refresh user NFTs, all NFTs, and collections
        const [updatedUserNfts, updatedAllNftsResult] = await Promise.all([
          fetchUserNfts(walletAddress, network),
          fetchAllNetworkNfts(network, nftsPage, itemsPerPage, nftSearchQuery),
        ]);
        setUserNfts(updatedUserNfts);
        setAllNfts(updatedAllNftsResult.nfts);
        setTotalNftsCount(updatedAllNftsResult.totalCount);

        toast({
          title: "NFT Minted and Listed",
          description: `Your NFT "${listingName}" (Token ID: ${tokenId}) has been minted${
            listingPrice ? ` and listed for ${listingPrice} ETH` : ""
          }!`,
        });
      } else {
        throw new Error("Minting or listing transaction failed.");
      }
    } catch (error) {
      console.error("Error during minting:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setMintError(errorMessage);
      toast({
        title: "Minting Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setMinting(false);
    }
  };

  const handleRefreshNfts = async () => {
    if (!walletAddress) return;

    setLoadingUserNfts(true);
    try {
      const userNftsResult = await fetchUserNfts(walletAddress, network);
      console.log("Refreshed user NFTs:", userNftsResult);
      setUserNfts(userNftsResult);
      if (userNftsResult.length === 0) {
        toast({
          title: "No NFTs Found",
          description:
            "No NFTs were found after refresh. Ensure the network is correct.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error refreshing user NFTs:", error);
      toast({
        title: "Error",
        description: "Failed to refresh your NFTs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingUserNfts(false);
    }
  };

  const renderPagination = (
    totalItems: number,
    currentPage: number,
    onPageChange: (page: number) => void
  ) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pageRange = 2;

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
              className={
                currentPage === 1 ? "pointer-events-none opacity-50" : ""
              }
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
              onClick={() =>
                onPageChange(Math.min(totalPages, currentPage + 1))
              }
              className={
                currentPage === totalPages
                  ? "pointer-events-none opacity-50"
                  : ""
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const renderNftCard = (nft: NftItem) => {
    const displayTokenId = nft.tokenId
      ? isNaN(parseInt(nft.tokenId))
        ? nft.tokenId
        : parseInt(nft.tokenId, 16).toString()
      : "Unknown";
    const displayName =
      nft.name && !nft.name.includes(`#${displayTokenId}`)
        ? `${nft.name} #${displayTokenId}`
        : nft.name || `NFT #${displayTokenId}`;

    const isOwner =
      walletAddress && nft.owner.toLowerCase() === walletAddress.toLowerCase();

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
          <CardTitle className="text-lg truncate">{displayName}</CardTitle>
          <CardDescription className="truncate">
            {nft.collection?.name || "Unknown Collection"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-0">
          <div className="relative aspect-square w-full overflow-hidden">
            {nft.imageUrl ? (
              <img
                src={nft.imageUrl}
                alt={displayName}
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
            <>
              <Button
                onClick={() =>
                  navigate(
                    `/collections/${nft.contractAddress}/nfts/${nft.tokenId}`
                  )
                }
                className="w-full"
                variant="outline"
              >
                View Details
              </Button>
              {isOwner ? (
                nft.isListed ? (
                  <div className="text-center text-sm text-muted-foreground">
                    Listed for Sale
                  </div>
                ) : (
                  <Button
                    onClick={() => handleListForSale(nft)}
                    className="w-full"
                    disabled={listing}
                  >
                    {listing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "List for Sale"
                    )}
                  </Button>
                )
              ) : nft.isListed ? (
                <Button
                  onClick={() => handlePurchase(nft)}
                  className="w-full"
                  disabled={purchasing}
                >
                  {purchasing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    `Purchase (${nft.price} ETH)`
                  )}
                </Button>
              ) : (
                <div className="text-center text-sm text-muted-foreground">
                  Not For Sale
                </div>
              )}
            </>
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

      <Tabs defaultValue="allNfts">
        <TabsList className="mb-6">
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="allNfts">NFTs</TabsTrigger>
          <TabsTrigger value="myNfts">My NFTs</TabsTrigger>
        </TabsList>

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
                    <Skeleton
                      key={index}
                      className="h-[200px] w-full rounded-lg"
                    />
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
                {renderPagination(
                  totalCollections,
                  currentPage,
                  handlePageChange
                )}
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

        <TabsContent value="allNfts">
          <div className="mb-6">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search by contract (0x...), contract + token ID (0x... 123), or name"
                value={nftSearchQuery}
                onChange={(e) => setNftSearchQuery(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setNftsPage(1);
                  }
                }}
              />
              <Button onClick={() => setNftsPage(1)} disabled={isSearchingNfts}>
                {isSearchingNfts ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </Button>
              {nftSearchQuery && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setNftSearchQuery("");
                    setNftsPage(1);
                  }}
                  disabled={isSearchingNfts}
                >
                  Clear
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Examples: "0xBC4CA0..." (contract), "0xBC4CA0... 123" (specific
              NFT), or "Azuki" (name)
            </p>
          </div>
          {loadingAllNfts || isSearchingNfts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {Array(10)
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
          ) : allNfts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {allNfts.map((nft) => (
                  <div key={`${nft.contractAddress}-${nft.tokenId}`}>
                    {renderNftCard(nft)}
                  </div>
                ))}
              </div>
              {renderPagination(totalNftsCount, nftsPage, handleNftsPageChange)}
            </>
          ) : (
            <Alert className="bg-muted">
              <Info className="h-5 w-5" />
              <AlertTitle>No NFTs Found</AlertTitle>
              <AlertDescription>
                {nftSearchQuery
                  ? "No NFTs match your search. Try a contract address (0x...), contract + token ID (0x... 123), or name."
                  : "No NFTs from popular collections are available on this network."}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="myNfts">
          {!walletAddress ? (
            <Alert>
              <AlertTitle>Wallet Not Connected</AlertTitle>
              <AlertDescription>
                Please connect your wallet to view your NFTs.
              </AlertDescription>
            </Alert>
          ) : loadingUserNfts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array(4)
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
                    onClick={handleRefreshNfts}
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
                  <Button onClick={handleMintNFT} size="sm">
                    Mint NFT
                  </Button>
                </div>
              </div>

              {userNfts.length > 0 ? (
                <>
                  <Tabs defaultValue="all" className="w-full">
                    {/* Tabs for filtering user NFTs */}
                  </Tabs>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {userNfts.map((nft) => (
                      <div key={`${nft.contractAddress}-${nft.tokenId}`}>
                        {renderNftCard(nft)}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <Alert className="bg-muted">
                  <Info className="h-5 w-5" />
                  <AlertTitle>No NFTs Found</AlertTitle>
                  <AlertDescription>
                    You don't own any NFTs on the current network. Mint one now!
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Purchase NFT Dialog */}
      <Dialog open={openPurchaseDialog} onOpenChange={setOpenPurchaseDialog}>
        <DialogContent className="max-w-2xl">
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
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
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
                  <pre className="bg-muted p-2 rounded block overflow-x-auto break-words">
                    {txHash}
                  </pre>
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

      <Dialog open={openListingDialog} onOpenChange={setOpenListingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedNft ? "List NFT for Sale" : "Mint New NFT"}
            </DialogTitle>
            <DialogDescription>
              {selectedNft
                ? "Set a price to list your NFT for sale."
                : "Upload an image and fill in details to mint your NFT."}
            </DialogDescription>
          </DialogHeader>

          {mintSuccess ? (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <AlertTitle>Minting Successful!</AlertTitle>
                <AlertDescription>
                  Your NFT "{listingName}" (Token ID:
                  <a
                    href={`/collections/${
                      MARKETPLACE_ADDRESSES[
                        network as keyof typeof MARKETPLACE_ADDRESSES
                      ]
                    }/nfts/${mintedTokenId}`}
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {mintedTokenId}
                  </a>
                  ) has been minted
                  {listingPrice ? ` and listed for ${listingPrice} ETH` : ""}.
                </AlertDescription>
              </Alert>
              {txHash && (
                <div className="text-sm">
                  <p className="font-medium mb-1">Transaction Hash:</p>
                  <pre className="bg-muted p-2 rounded block overflow-x-auto break-words">
                    {txHash}
                  </pre>
                </div>
              )}
            </div>
          ) : listingSuccess ? (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <AlertTitle>Listing Successful!</AlertTitle>
                <AlertDescription>
                  Your NFT has been listed for {listingPrice} ETH!
                </AlertDescription>
              </Alert>
              {txHash && (
                <div className="text-sm">
                  <p className="font-medium mb-1">Transaction Hash:</p>
                  <pre className="bg-muted p-2 rounded block overflow-x-auto break-words">
                    {txHash}
                  </pre>
                </div>
              )}
            </div>
          ) : mintError || listingError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle>
                {mintError ? "Minting Failed" : "Listing Failed"}
              </AlertTitle>
              <AlertDescription>{mintError || listingError}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              {!selectedNft && (
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
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={listingName}
                  onChange={(e) => setListingName(e.target.value)}
                  placeholder="My Awesome NFT"
                  disabled={!!selectedNft}
                />
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="price">
                  {selectedNft
                    ? "List Price (ETH)"
                    : "List Price (ETH, optional)"}
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="0.00"
                  value={listingPrice}
                  onChange={(e) => setListingPrice(e.target.value)}
                />
              </div>

              <Alert>
                <Info className="h-5 w-5" />
                <AlertTitle>
                  {selectedNft ? "Listing" : "Minting"} Information
                </AlertTitle>
                <AlertDescription>
                  Your NFT will be {selectedNft ? "listed" : "minted"} on{" "}
                  {network === "mainnet"
                    ? "Ethereum Mainnet"
                    : "Sepolia Testnet"}
                  . Network fees will apply.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            {mintSuccess || listingSuccess ? (
              <Button onClick={closeListingDialog}>Close</Button>
            ) : mintError || listingError ? (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={closeListingDialog}>
                  Cancel
                </Button>
                <Button onClick={selectedNft ? confirmListing : confirmMint}>
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="flex space-x-2 w-full justify-between sm:justify-end">
                <Button variant="outline" onClick={closeListingDialog}>
                  Cancel
                </Button>
                <Button
                  onClick={selectedNft ? confirmListing : confirmMint}
                  disabled={
                    (selectedNft ? listing : minting) ||
                    !listingName.trim() ||
                    (!selectedNft && !listingImage) ||
                    (selectedNft && !listingPrice) ||
                    false
                  }
                >
                  {selectedNft ? (
                    listing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Listing...
                      </>
                    ) : (
                      "List NFT"
                    )
                  ) : minting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Minting...
                    </>
                  ) : (
                    "Mint NFT"
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
