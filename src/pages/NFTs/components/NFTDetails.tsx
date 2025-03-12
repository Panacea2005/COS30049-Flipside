import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchNftDetails } from "../../../lib/alchemy/alchemyNFTService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, ArrowLeft, ExternalLink, Copy, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface NFTAttribute {
  trait_type: string;
  value: string;
  trait_count?: number;
  rarity?: number;
}

interface NFTHistory {
  event: string;
  price?: string;
  from: string;
  to: string;
  date: string;
  txHash?: string;
}

interface NFTDetails {
  id: string;
  tokenId: string;
  name: string;
  description: string;
  imageUrl: string;
  tokenStandard: string;
  owner: string;
  creator: string;
  collection: {
    name: string;
    address: string;
  };
  attributes: NFTAttribute[];
  history: NFTHistory[];
  acquiredAt: string;
  lastUpdated: string;
  royalties: string;
}

const NFTDetails: React.FC = () => {
  const { collectionId, tokenId } = useParams<{
    collectionId: string;
    tokenId: string;
  }>();
  const navigate = useNavigate();
  const [nft, setNft] = useState<NFTDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [network, setNetwork] = useState<string>("mainnet");
  const [copied, setCopied] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const checkNetwork = async () => {
      if (window.ethereum) {
        try {
          const chainId = await window.ethereum.request({
            method: "eth_chainId",
          });
          if (chainId === "0x1") {
            setNetwork("mainnet");
          } else if (chainId === "0xaa36a7") {
            setNetwork("sepolia");
          }
        } catch (error) {
          console.error("Error checking network:", error);
        }
      }
    };
    checkNetwork();
  }, []);

  useEffect(() => {
    const loadNftData = async () => {
      if (!collectionId || !tokenId) return;
  
      setLoading(true);
      try {
        const nftItem = await fetchNftDetails(collectionId, tokenId, network);
  
        if (nftItem) {
          // Map NftItem to NFTDetails
          const nftDetails: NFTDetails = {
            id: nftItem.tokenId, // or other mapping logic
            tokenId: nftItem.tokenId,
            name: nftItem.name,
            description: nftItem.metadata?.description || "",
            imageUrl: nftItem.imageUrl,
            tokenStandard: "ERC721", // or whichever standard you need
            owner: nftItem.owner,
            creator: nftItem.creator,
            collection: nftItem.collection || { name: "Unknown", address: "" },
            attributes: nftItem.metadata?.attributes || [],
            history: [], // Map history data if available
            acquiredAt: "", // Add appropriate field
            lastUpdated: "", // Add appropriate field
            royalties: "", // Add royalties logic
          };
  
          setNft(nftDetails);
        }
      } catch (error) {
        console.error("Error loading NFT details:", error);
        toast({
          title: "Error",
          description: "Failed to load NFT details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
  
    loadNftData();
  }, [collectionId, tokenId, network]);
  

  const handleCopyAddress = (address: string, key: string) => {
    navigator.clipboard.writeText(address);
    setCopied({ ...copied, [key]: true });
    setTimeout(() => setCopied({ ...copied, [key]: false }), 2000);
    toast({
      title: "Address copied",
      description: "The address has been copied to your clipboard.",
    });
  };

  const renderSkeleton = () => (
    <div className="flex flex-col lg:flex-row gap-8">
      <Skeleton className="h-[500px] w-full lg:w-1/2 rounded-lg" />
      <div className="w-full lg:w-1/2 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  );

  const renderAttributes = (attributes: NFTAttribute[]) => {
    if (!attributes || attributes.length === 0)
      return (
        <p className="text-gray-500">No attributes available for this NFT.</p>
      );

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {attributes.map((attribute, index) => (
          <div
            key={index}
            className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800"
          >
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {attribute.trait_type}
            </div>
            <div className="font-medium truncate">{attribute.value}</div>
            {attribute.trait_count && (
              <div className="text-xs text-gray-400 mt-1">
                {attribute.trait_count} NFTs have this trait
                {attribute.rarity &&
                  ` (${(attribute.rarity * 100).toFixed(1)}% rarity)`}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const formatAddress = (address: string) => {
    if (!address) return "Unknown";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  const getEtherscanLink = (address: string, isToken: boolean = false) => {
    const baseUrl =
      network === "mainnet"
        ? "https://etherscan.io"
        : "https://sepolia.etherscan.io";
    return isToken
      ? `${baseUrl}/token/${collectionId}?a=${tokenId}`
      : `${baseUrl}/address/${address}`;
  };

  const getEtherscanTxLink = (txHash: string) => {
    const baseUrl =
      network === "mainnet"
        ? "https://etherscan.io"
        : "https://sepolia.etherscan.io";
    return `${baseUrl}/tx/${txHash}`;
  };

  if (loading)
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          className="mb-4 flex items-center mt-16"
          onClick={() => navigate(`/collections/${collectionId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Collection
        </Button>
        {renderSkeleton()}
      </div>
    );

  if (!nft)
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          className="mb-4 flex items-center mt-16"
          onClick={() => navigate(`/collections/${collectionId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Collection
        </Button>
        <div className="rounded-lg border border-gray-200 p-8 text-center">
          <Info className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">NFT Not Found</h3>
          <p className="mt-2 text-gray-500">
            This NFT could not be found. It may have been removed or the address
            is incorrect.
          </p>
        </div>
      </div>
    );

  let imageUrl = nft.imageUrl;
  if (imageUrl && imageUrl.startsWith("ipfs://")) {
    imageUrl = `https://ipfs.io/ipfs/${imageUrl.slice(7)}`;
  }

  // Format token ID for display
  const displayTokenId = tokenId
    ? isNaN(parseInt(tokenId))
      ? tokenId
      : parseInt(tokenId, 16).toString()
    : "Unknown";

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="outline"
        className="mb-4 flex items-center mt-16"
        onClick={() => navigate(`/collections/${collectionId}`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Collection
      </Button>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left column - NFT Image */}
        <div className="w-full lg:w-1/2">
          <Card className="overflow-hidden shadow-md">
            <div className="relative aspect-square">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={nft.name || `NFT #${displayTokenId}`}
                  className="object-contain w-full h-full"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100">
                  <Info className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>
          </Card>

          {/* Mobile view attributes preview */}
          <div className="mt-4 lg:hidden">
            <Card>
              <CardHeader>
                <CardTitle>Attributes</CardTitle>
              </CardHeader>
              <CardContent>
                {renderAttributes(nft.attributes || [])}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right column - NFT Info */}
        <div className="w-full lg:w-1/2">
          <Card className="overflow-hidden shadow-md h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    {nft.name || `NFT #${displayTokenId}`}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {nft.collection?.name || "Unknown Collection"}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="px-2 py-1 text-sm">
                  #{displayTokenId}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="details">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="attributes">Attributes</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="ownership">Ownership</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div>
                    <h3 className="text-lg font-semibold">Description</h3>
                    <p className="text-gray-700 mt-2">
                      {nft.description || "No description available."}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      NFT Information
                    </h3>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">
                            Token ID
                          </TableCell>
                          <TableCell className="flex items-center space-x-2">
                            <span>{displayTokenId}</span>
                            {tokenId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() =>
                                  handleCopyAddress(tokenId, "tokenId")
                                }
                              >
                                {copied["tokenId"] ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            Token Standard
                          </TableCell>
                          <TableCell>{nft.tokenStandard || "ERC721"}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            Contract Address
                          </TableCell>
                          <TableCell className="flex items-center space-x-2">
                            <span>{formatAddress(collectionId || "")}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() =>
                                handleCopyAddress(
                                  collectionId || "",
                                  "contract"
                                )
                              }
                            >
                              {copied["contract"] ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            Blockchain
                          </TableCell>
                          <TableCell>
                            Ethereum{" "}
                            {network === "mainnet" ? "Mainnet" : "Sepolia"}
                          </TableCell>
                        </TableRow>
                        {nft.lastUpdated && (
                          <TableRow>
                            <TableCell className="font-medium">
                              Last Updated
                            </TableCell>
                            <TableCell>{nft.lastUpdated}</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <Separator />

                <TabsContent value="attributes" className="mt-4">
                  {renderAttributes(nft.attributes || [])}
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  {nft.history && nft.history.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Transaction</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {nft.history.map((event, index) => (
                          <TableRow key={index}>
                            <TableCell>{event.event}</TableCell>
                            <TableCell>{event.price || "—"}</TableCell>
                            <TableCell>
                              <a
                                href={getEtherscanLink(event.from)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {formatAddress(event.from)}
                              </a>
                            </TableCell>
                            <TableCell>
                              <a
                                href={getEtherscanLink(event.to)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {formatAddress(event.to)}
                              </a>
                            </TableCell>
                            <TableCell>{event.date}</TableCell>
                            <TableCell>
                              {event.txHash ? (
                                <a
                                  href={getEtherscanTxLink(event.txHash)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline flex items-center"
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  View
                                </a>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-gray-500">
                      No history available for this NFT.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="ownership" className="space-y-4 mt-4">
                  {/* Current Owner Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Current Owner
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span>{formatAddress(nft.owner || "Unknown")}</span>
                      {nft.owner && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() =>
                              handleCopyAddress(nft.owner, "owner")
                            }
                          >
                            {copied["owner"] ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <a
                            href={getEtherscanLink(nft.owner)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                  <Separator />

                  {/* Creator Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Creator</h3>
                    <div className="flex items-center space-x-2">
                      <span>{formatAddress(nft.creator || "Unknown")}</span>
                      {nft.creator && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() =>
                              handleCopyAddress(nft.creator, "creator")
                            }
                          >
                            {copied["creator"] ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <a
                            href={getEtherscanLink(nft.creator)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                  <Separator />

                  {/* Acquired Date Section */}
                  {nft.acquiredAt && (
                    <>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">
                          Acquired Date
                        </h3>
                        <p>{nft.acquiredAt}</p>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Creator Royalties Section */}
                  {nft.royalties && (
                    <>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">
                          Creator Royalties
                        </h3>
                        <p>{nft.royalties}%</p>
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NFTDetails;
