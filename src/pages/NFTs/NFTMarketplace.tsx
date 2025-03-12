import React, { useState, useEffect } from "react";
import {
  fetchListedNfts,
  fetchUserNfts,
  fetchNftCollections,
  purchaseNft,
  NftItem,
  NftCollection,
} from "../../lib/alchemy/alchemyNFTService";

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
  // State management
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

  // Load marketplace NFTs on initial render and when network changes
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

  // Load user NFTs when wallet is connected
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

  // Handle network change
  const handleNetworkChange = async (newNetwork: string) => {
    try {
      setNetwork(newNetwork);
      toast({
        title: "Network Changed",
        description: `Switched to ${
          newNetwork === "mainnet" ? "Ethereum Mainnet" : "Sepolia Testnet"
        }`,
      });
    } catch (error) {
      console.error("Failed to switch network:", error);
      toast({
        title: "Error",
        description: "Failed to switch networks. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle wallet connection
  const handleConnectWallet = async () => {
    try {
      // This is a simplified mock for wallet connection
      // In a real application, you would use something like MetaMask's ethereum.request
      const mockAddress =
        "0x" +
        Array(40)
          .fill(0)
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join("");

      setWalletAddress(mockAddress);
      toast({
        title: "Wallet Connected",
        description: `Connected to ${mockAddress.substring(
          0,
          6
        )}...${mockAddress.substring(38)}`,
      });
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast({
        title: "Error",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle NFT purchase
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
      const result = await purchaseNft(
        selectedNft.tokenId,
        selectedNft.contractAddress,
        network,
        walletAddress
      );

      if (result.success) {
        setPurchaseSuccess(true);
        setTxHash(result.txHash || "");

        // Refresh the marketplace after successful purchase
        const updatedNfts = await fetchListedNfts(network, 12);
        setListedNfts(updatedNfts);

        // Refresh user NFTs
        const updatedUserNfts = await fetchUserNfts(walletAddress, network);
        setUserNfts(updatedUserNfts);

        toast({
          title: "Purchase Successful",
          description: "You have successfully purchased the NFT!",
        });
      } else {
        setPurchaseError(result.error || "Transaction failed");
        toast({
          title: "Purchase Failed",
          description:
            result.error ||
            "Failed to complete the purchase. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error during purchase:", error);
      setPurchaseError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );

      toast({
        title: "Error",
        description:
          "An unexpected error occurred during purchase. Please try again.",
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

  // Render loading skeletons
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

  // Render NFT card
  const renderNftCard = (nft: NftItem, isUserNft: boolean = false) => {
    return (
      <Card
        key={nft.tokenId}
        className="overflow-hidden transition-all hover:shadow-md"
      >
        <CardHeader className="p-0">
          <div className="relative h-48 w-full">
            {nft.imageUrl ? (
              <img
                src={nft.imageUrl}
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
          ) : (
            <Button
              className="w-full"
              onClick={() => handlePurchase(nft)}
              disabled={!walletAddress || !nft.price}
            >
              {!walletAddress ? "Connect Wallet to Buy" : "Purchase"}
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
            <Button variant="outline">
              {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
            </Button>
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
                        (window.location.href = `/collections/${collection.id}`)
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

      {/* Purchase Dialog */}
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
