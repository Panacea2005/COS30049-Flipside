import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchCollectionInfo, fetchCollectionNFTs } from "../../../lib/alchemy/alchemyNFTService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Info, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  Grid, 
  List, 
  Search, 
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

interface NFT {
  id: string;
  tokenId: string;
  name: string;
  description: string;
  imageUrl: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

const CollectionView: React.FC = () => {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<any | null>(null);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [network, setNetwork] = useState<string>("mainnet");
  const [copied, setCopied] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);
  const [sortBy, setSortBy] = useState<string>("tokenId");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>({});
  const [attributeFilters, setAttributeFilters] = useState<Record<string, string[]>>({});

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
    const loadCollectionData = async () => {
      if (!collectionId) return;

      setLoading(true);
      try {
        // Fetch collection metadata
        const metadata = await fetchCollectionInfo(collectionId, network);
        setCollection(metadata);

        // Fetch NFTs for the collection
        const nftData = await fetchCollectionNFTs(collectionId, network, currentPage, pageSize, sortBy, sortDir, searchQuery, selectedAttributes);
        setNfts(nftData.nfts);
        setTotalPages(Math.ceil(nftData.totalCount / pageSize));
        
        // Extract all possible attributes for filtering
        const attributeMap: Record<string, string[]> = {};
        nftData.nfts.forEach((nft: NFT) => {
          if (nft.attributes) {
            nft.attributes.forEach(attr => {
              if (!attributeMap[attr.trait_type]) {
                attributeMap[attr.trait_type] = [];
              }
              if (!attributeMap[attr.trait_type].includes(attr.value)) {
                attributeMap[attr.trait_type].push(attr.value);
              }
            });
          }
        });
        setAttributeFilters(attributeMap);
      } catch (error) {
        console.error("Error loading collection data:", error);
        toast({
          title: "Error",
          description: "Failed to load collection data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadCollectionData();
  }, [collectionId, network, currentPage, pageSize, sortBy, sortDir, searchQuery, selectedAttributes]);

  const handleCopyAddress = () => {
    if (!collectionId) return;
    navigator.clipboard.writeText(collectionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Address copied",
      description: "The collection address has been copied to your clipboard.",
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleSortChange = (value: string) => {
    const [field, direction] = value.split("-");
    setSortBy(field);
    setSortDir(direction as "asc" | "desc");
    setCurrentPage(1);
  };

  const handleAttributeFilter = (traitType: string, value: string) => {
    setSelectedAttributes(prev => {
      const newFilters = { ...prev };
      if (!newFilters[traitType]) {
        newFilters[traitType] = [];
      }
      
      if (newFilters[traitType].includes(value)) {
        newFilters[traitType] = newFilters[traitType].filter(v => v !== value);
      } else {
        newFilters[traitType].push(value);
      }
      
      if (newFilters[traitType].length === 0) {
        delete newFilters[traitType];
      }
      
      return newFilters;
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedAttributes({});
    setSearchQuery("");
    setCurrentPage(1);
  };

  const isAttributeSelected = (traitType: string, value: string) => {
    return selectedAttributes[traitType]?.includes(value) || false;
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getEtherscanLink = (address: string) => {
    const baseUrl = network === "mainnet" ? "https://etherscan.io" : "https://sepolia.etherscan.io";
    return `${baseUrl}/address/${address}`;
  };

  const getOpenSeaLink = (address: string) => {
    const baseUrl = network === "mainnet" ? "https://opensea.io" : "https://testnets.opensea.io";
    return `${baseUrl}/collection/${address}`;
  };

  const renderSkeleton = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6">
        <Skeleton className="h-40 w-40 rounded-lg" />
        <div className="space-y-4 flex-1">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-72 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );

  const renderNFTCard = (nft: NFT) => {
    let imageUrl = nft.imageUrl;
    if (imageUrl && imageUrl.startsWith('ipfs://')) {
      imageUrl = `https://ipfs.io/ipfs/${imageUrl.slice(7)}`;
    }
    
    return (
      <Card 
        key={nft.id} 
        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => navigate(`/collections/${collectionId}/nfts/${nft.tokenId}`)}
      >
        <div className="aspect-square relative">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={nft.name || `NFT #${nft.tokenId}`} 
              className="object-cover w-full h-full"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <Info className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-medium text-lg truncate">{nft.name || `NFT #${nft.tokenId}`}</h3>
          <p className="text-sm text-gray-500 truncate">ID: {parseInt(nft.tokenId, 16).toString()}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between">
          <div className="flex flex-wrap gap-1">
            {nft.attributes?.slice(0, 3).map((attr, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {attr.trait_type}: {attr.value}
              </Badge>
            ))}
            {nft.attributes?.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{nft.attributes.length - 3} more
              </Badge>
            )}
          </div>
        </CardFooter>
      </Card>
    );
  };

  const renderNFTList = (nft: NFT) => {
    let imageUrl = nft.imageUrl;
    if (imageUrl && imageUrl.startsWith('ipfs://')) {
      imageUrl = `https://ipfs.io/ipfs/${imageUrl.slice(7)}`;
    }
    
    return (
      <Card 
        key={nft.id} 
        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex"
        onClick={() => navigate(`/collections/${collectionId}/${nft.tokenId}`)}
      >
        <div className="w-24 h-24">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={nft.name || `NFT #${nft.tokenId}`} 
              className="object-cover w-full h-full"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <Info className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-lg truncate">{nft.name || `NFT #${nft.tokenId}`}</h3>
              <p className="text-sm text-gray-500">ID: {parseInt(nft.tokenId, 16).toString()}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {nft.attributes?.slice(0, 3).map((attr, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {attr.trait_type}: {attr.value}
                </Badge>
              ))}
              {nft.attributes?.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{nft.attributes.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  if (loading) return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="outline"
        className="mb-4 flex items-center mt-16"
        onClick={() => navigate("/nfts")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Collections
      </Button>
      {renderSkeleton()}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="outline"
        className="mb-4 flex items-center mt-16"
        onClick={() => navigate("/nfts")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Collections
      </Button>

      {collection && (
        <>
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            {collection.image ? (
              <img 
                src={collection.image} 
                alt={collection.name} 
                className="h-40 w-40 rounded-lg object-cover"
              />
            ) : (
              <div className="h-40 w-40 rounded-lg bg-gray-100 flex items-center justify-center">
                <Info className="h-12 w-12 text-gray-400" />
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{collection.name}</h1>
                <Badge variant="secondary" className="text-sm">
                  {network === "mainnet" ? "Ethereum" : "Sepolia"}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-0 h-auto font-normal text-gray-500 hover:text-gray-900" 
                    onClick={handleCopyAddress}
                  >
                    {formatAddress(collectionId || "")}
                    {copied ? (
                      <CheckCircle className="ml-1 h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="ml-1 h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <a 
                  href={getEtherscanLink(collectionId || "")} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-gray-900"
                >
                  Etherscan <ExternalLink className="ml-1 h-3 w-3" />
                </a>
                
                <a 
                  href={getOpenSeaLink(collectionId || "")} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-gray-900"
                >
                  OpenSea <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
              
              <p className="text-gray-700 mb-4">{collection.description}</p>
              
              <div className="flex flex-wrap gap-2">
                {collection.totalSupply && (
                  <Badge variant="outline">
                    Total Items: {collection.totalSupply}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 mb-8">
            <div className="lg:w-64 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Filters</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-auto py-1" 
                  onClick={clearFilters}
                >
                  Clear all
                </Button>
              </div>
              
              <div className="space-y-4">
                {Object.entries(attributeFilters).map(([traitType, values]) => (
                  <div key={traitType} className="space-y-2">
                    <h3 className="font-medium">{traitType}</h3>
                    {values.sort().map(value => (
                      <div key={value} className="flex items-center">
                        <Button
                          variant={isAttributeSelected(traitType, value) ? "secondary" : "ghost"}
                          size="sm"
                          className="text-xs h-auto py-1 px-2 justify-start w-full"
                          onClick={() => handleAttributeFilter(traitType, value)}
                        >
                          {value}
                        </Button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <div className="w-full sm:w-auto flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or ID..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto">
                  <Select
                    value={`${sortBy}-${sortDir}`}
                    onValueChange={handleSortChange}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tokenId-asc">ID (Ascending)</SelectItem>
                      <SelectItem value="tokenId-desc">ID (Descending)</SelectItem>
                      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex bg-gray-100 rounded-md p-1">
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="sm"
                      className="px-2"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="sm"
                      className="px-2"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {nfts.length === 0 ? (
                <div className="text-center py-12 border rounded-lg">
                  <p className="text-gray-500">No NFTs found for this collection.</p>
                  {(searchQuery || Object.keys(selectedAttributes).length > 0) && (
                    <Button 
                      variant="link" 
                      onClick={clearFilters}
                      className="mt-2"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className={viewMode === "grid" 
                    ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4" 
                    : "space-y-4"
                  }>
                    {nfts.map(nft => (
                      viewMode === "grid" ? renderNFTCard(nft) : renderNFTList(nft)
                    ))}
                  </div>
                  
                  {totalPages > 1 && (
                    <Pagination className="mt-8">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage > 1) setCurrentPage(currentPage - 1);
                            }}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                        
                        {[...Array(totalPages)].map((_, i) => {
                          const pageNumber = i + 1;
                          // Show first page, last page, and pages around current page
                          if (
                            pageNumber === 1 || 
                            pageNumber === totalPages || 
                            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={pageNumber}>
                                <PaginationLink 
                                  href="#" 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentPage(pageNumber);
                                  }}
                                  isActive={pageNumber === currentPage}
                                >
                                  {pageNumber}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                          
                          // Show ellipsis for gaps
                          if (
                            (pageNumber === 2 && currentPage > 3) || 
                            (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
                          ) {
                            return (
                              <PaginationItem key={pageNumber}>
                                <span className="px-2">...</span>
                              </PaginationItem>
                            );
                          }
                          
                          return null;
                        })}
                        
                        <PaginationItem>
                          <PaginationNext 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                            }}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CollectionView;