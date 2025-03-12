import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchListedNfts,
  fetchUserNfts,
  fetchNftCollections,
  buyNft,
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
import { Loader2, Info, AlertTriangle, CheckCircle2 } from "lucide-react";

const NFTMarketplace: React.FC = () => {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [network, setNetwork] = useState<string>("mainnet");
  const [listedNfts, setListedNfts] = useState<NftItem[]>([]);
  const [userNfts, setUserNfts] = useState<NftItem[]>([]);
  const [collections, setCollections] = useState<NftCollection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingUserNfts, setLoadingUserNfts] = useState<boolean>(false);
  const [purchasing, setPurchasing] = useState<boolean>(false);
  const [selectedNft, setSelectedNft] = useState<NftItem | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string>("");
  const [purchaseError, setPurchaseError] = useState<string>("");
  const [openDialog, setOpenDialog] = useState<boolean>(false);

  useEffect(() => {
    const loadMarketplace = async () => {
      setLoading(true);
      try {
        const [nftsResult, collectionsResult] = await Promise.all([
          fetchListedNfts(network, 12),
          fetchNftCollections(network),
        ]);

        setListedNfts(nftsResult);
        setCollections(collectionsResult);
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
  }, [network]);

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
    setOpenDialog(true);
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
      const provider = new BrowserProvider(window.ethereum); // Updated to Web3Provider
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

  const closeDialog = () => {
    setOpenDialog(false);
    setPurchaseSuccess(false);
    setPurchaseError("");
    setSelectedNft(null);
    setTxHash("");
  };

  const renderSkeletons = () => {
    return Array(4)
      .fill(0)
      .map((_, index) => (
        <div key={index} className="flex flex-col space-y-3">
          <Skeleton className="h-[250px] w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex justify-between">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      ));
  };

  const renderNftCard = (nft: NftItem, isUserNft: boolean = false) => {
    let imageUrl = nft.imageUrl;
    if (imageUrl && imageUrl.startsWith("ipfs://")) {
      imageUrl = `https://ipfs.io/ipfs/${imageUrl.slice(7)}`;
    }
    return (
      <Card
        key={`${nft.contractAddress}-${nft.tokenId}`}
        className="overflow-hidden transition-all hover:shadow-md"
      >
        <CardHeader className="p-0">
          <div className="relative h-48 w-full">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={nft.name || `NFT ${nft.tokenId}`}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100">
                <Info className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {nft.name || `NFT #${nft.tokenId}`}
              </CardTitle>
              <CardDescription className="mt-1 truncate">
                {nft.collection?.name || "Unknown Collection"}
              </CardDescription>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarImage src={nft.collection?.imageUrl} />
              <AvatarFallback>
                {nft.collection?.name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Badge variant="outline" className="px-2 py-1">
              #{nft.tokenId?.substring(0, 8)}
            </Badge>
            <p className="font-medium">
              {nft.price ? `${nft.price} ETH` : "Not for sale"}
            </p>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          {isUserNft ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => (window.location.href = `/nfts/${nft.tokenId}`)}
            >
              View Details
            </Button>
          ) : nft.isListed ? (
            <Button
              className="w-full"
              onClick={() => handlePurchase(nft)}
              disabled={!walletAddress || !nft.price}
            >
              {!walletAddress ? "Connect Wallet to Buy" : "Purchase"}
            </Button>
          ) : (
            <Button className="w-full" disabled>
              Not Listed for Sale
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };  

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 mt-16 flex flex-col items-start justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">NFT Marketplace</h1>
          <p className="mt-2 text-gray-500">
            Discover, collect, and sell extraordinary NFTs
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0">
          <Select value={network} onValueChange={handleNetworkChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Network" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mainnet">Ethereum Mainnet</SelectItem>
              <SelectItem value="sepolia">Sepolia Testnet</SelectItem>
            </SelectContent>
          </Select>
          {!walletAddress ? (
            <Button onClick={handleConnectWallet}>Connect Wallet</Button>
          ) : (
            <div className="flex space-x-2">
              <Button variant="outline">
                {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
              </Button>
              <Button variant="destructive" onClick={handleDisconnectWallet}>
                Disconnect
              </Button>
            </div>
          )}
        </div>
      </div>
      <Tabs defaultValue="marketplace" className="w-full">
        <TabsList>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="my-nfts" disabled={!walletAddress}>
            My NFTs
          </TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
        </TabsList>
        <TabsContent value="marketplace" className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {renderSkeletons()}
            </div>
          ) : listedNfts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listedNfts.map((nft) => renderNftCard(nft))}
            </div>
          ) : (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No NFTs Available</AlertTitle>
              <AlertDescription>
                There are currently no NFTs listed on the marketplace. Check
                back later!
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        <TabsContent value="my-nfts" className="mt-6">
          {!walletAddress ? (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Wallet Not Connected</AlertTitle>
              <AlertDescription>
                Connect your wallet to view your NFTs.
              </AlertDescription>
            </Alert>
          ) : loadingUserNfts ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {renderSkeletons()}
            </div>
          ) : userNfts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {userNfts.map((nft) => renderNftCard(nft, true))}
            </div>
          ) : (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertTitle>No NFTs Found</AlertTitle>
              <AlertDescription>
                You don't own any NFTs in your connected wallet. Purchase NFTs
                from the marketplace to see them here.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        <TabsContent value="collections" className="mt-6">
          {loading ? (
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
          ) : (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No Collections Available</AlertTitle>
              <AlertDescription>
                There are currently no NFT collections available. Check back
                later!
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {purchaseSuccess ? "Purchase Successful" : "Confirm Purchase"}
            </DialogTitle>
            <DialogDescription>
              {purchaseSuccess
                ? "Your NFT purchase has been completed successfully!"
                : "Please confirm that you want to purchase this NFT."}
            </DialogDescription>
          </DialogHeader>
          {!purchaseSuccess && selectedNft && (
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="relative h-32 w-32 overflow-hidden rounded-lg">
                {selectedNft.imageUrl ? (
                  <img
                    src={selectedNft.imageUrl}
                    alt={selectedNft.name || `NFT ${selectedNft.tokenId}`}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100">
                    <Info className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium">
                  {selectedNft.name || `NFT #${selectedNft.tokenId}`}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedNft.collection?.name || "Unknown Collection"}
                </p>
                <p className="mt-2 text-lg font-bold">
                  {selectedNft.price} ETH
                </p>
              </div>
              {purchaseError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{purchaseError}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
          {purchaseSuccess && (
            <div className="flex flex-col items-center space-y-4 py-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              {txHash && (
                <div className="text-center">
                  <p className="text-sm text-gray-500">Transaction Hash:</p>
                  <p className="break-all text-xs">{txHash}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
            {purchaseSuccess ? (
              <Button onClick={closeDialog}>Close</Button>
            ) : (
              <>
                <Button variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button
                  onClick={confirmPurchase}
                  disabled={purchasing || !selectedNft}
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Buy Now (${selectedNft?.price} ETH)`
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NFTMarketplace;