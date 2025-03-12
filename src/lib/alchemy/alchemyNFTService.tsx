import { JsonRpcProvider, Contract, Signer, parseEther, formatEther } from 'ethers';
import { Key, ReactNode } from 'react';

// Define Alchemy API key
const ALCHEMY_API_KEY = import.meta.env.ALCHEMY_API_KEY || "kxqtC8mSeXeqxvwPpmTfkkKpDflgIb1p";

// Define network RPC URLs
const NETWORK_URLS = {
  mainnet: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  sepolia: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
};

// ERC721 ABI - minimum required for transfers
const ERC721_ABI = [
  "function safeTransferFrom(address from, address to, uint256 tokenId) external",
  "function transferFrom(address from, address to, uint256 tokenId) external",
  "function approve(address to, uint256 tokenId) external",
  "function getApproved(uint256 tokenId) external view returns (address)",
  "function isApprovedForAll(address owner, address operator) external view returns (bool)",
  "function ownerOf(uint256 tokenId) external view returns (address)"
];

// Simple NFT Marketplace ABI
const MARKETPLACE_ABI = [
  "function listItem(address nftAddress, uint256 tokenId, uint256 price) external",
  "function buyItem(address nftAddress, uint256 tokenId) external payable",
  "function cancelListing(address nftAddress, uint256 tokenId) external",
  "function getListing(address nftAddress, uint256 tokenId) external view returns (address seller, uint256 price, bool active)"
];

// Configure marketplace contract addresses
const MARKETPLACE_ADDRESSES = {
  mainnet: "0x00000000006c3852cbEf3e08E8dF289169EdE581", // OpenSea Seaport
  sepolia: "0x677c7604c3717bec6d51c8be5ffa4214582d4d54", // Testnet marketplace
};

// Define interfaces for NFT data
export interface NftItem {
  creator: string;
  tokenId: string;
  contractAddress: string;
  name: string;
  symbol: string;
  tokenURI: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: Array<{ trait_type: string; value: string }>;
  } | null;
  owner: string;
  price: string; // In ETH
  isListed: boolean;
  imageUrl: string;
  collection: NftCollection | null;
}

export interface NftCollection {
  id: Key | null | undefined;
  address: string;
  name: string;
  symbol: string;
  totalSupply: string;
  imageUrl: string;
  description: string;
  itemCount: ReactNode;
  bannerUrl: string;
}

/**
 * Get a provider for the specified network
 */
function getProvider(network: string): JsonRpcProvider {
  return new JsonRpcProvider(NETWORK_URLS[network as keyof typeof NETWORK_URLS]);
}

/**
 * Get an NFT marketplace contract instance
 */
function getMarketplaceContract(network: string, signer?: Signer): Contract {
  const provider = getProvider(network);
  const marketplaceAddress = MARKETPLACE_ADDRESSES[network as keyof typeof MARKETPLACE_ADDRESSES];
  
  return new Contract(
    marketplaceAddress,
    MARKETPLACE_ABI,
    signer || provider
  );
}

/**
 * Get an NFT contract instance
 */
function getNftContract(contractAddress: string, network: string, signer?: Signer): Contract {
  const provider = getProvider(network);
  
  return new Contract(
    contractAddress,
    ERC721_ABI,
    signer || provider
  );
}

/**
 * Normalize IPFS URLs
 */
function normalizeIpfsUrl(url: string): string {
  if (!url) return '';
  
  if (url.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${url.slice(7)}`;
  }
  
  return url;
}

/**
 * Fetch user's NFTs using Alchemy API
 */
export const fetchUserNfts = async (
  address: string,
  network: string = "mainnet"
): Promise<NftItem[]> => {
  try {
    if (!address) {
      console.warn("No address provided to fetchUserNfts");
      return [];
    }

    const endpoint = `${NETWORK_URLS[network as keyof typeof NETWORK_URLS]}/getNFTs/?owner=${address}`;
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Alchemy API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.ownedNfts || !Array.isArray(data.ownedNfts)) {
      console.warn("No NFTs found or invalid response format");
      return [];
    }

    // Get the marketplace contract
    const provider = getProvider(network);
    const marketplaceAddress = MARKETPLACE_ADDRESSES[network as keyof typeof MARKETPLACE_ADDRESSES];
    const marketplace = new Contract(marketplaceAddress, MARKETPLACE_ABI, provider);

    // Map the Alchemy response to our NftItem format
    const nfts: NftItem[] = await Promise.all(
      data.ownedNfts.map(async (nft: any) => {
        try {
          const tokenId = nft.id.tokenId;
          const contractAddress = nft.contract.address;
          
          // Get collection info
          const collectionInfo = await fetchCollectionInfo(contractAddress, network);
          
          // Check if the NFT is listed on the marketplace
          let price = "0";
          let isListed = false;
          
          try {
            const listing = await marketplace.getListing(contractAddress, tokenId);
            isListed = listing.active;
            price = formatEther(listing.price);
          } catch (error) {
            // NFT is not listed or error occurred
            isListed = false;
          }

          // Parse metadata
          const metadata = nft.metadata || null;
          const imageUrl = normalizeIpfsUrl(metadata?.image || nft.media?.[0]?.gateway || "");

          return {
            creator: nft.contract.creator || "Unknown",
            tokenId: tokenId.startsWith('0x') ? tokenId.substring(2) : tokenId,
            contractAddress,
            name: metadata?.name || nft.title || `NFT #${tokenId}`,
            symbol: nft.contract.symbol || "NFT",
            tokenURI: nft.tokenUri?.raw || "",
            metadata,
            owner: address,
            price,
            isListed,
            imageUrl,
            collection: collectionInfo,
          };
        } catch (error) {
          console.error(`Error processing NFT:`, error);
          return null;
        }
      })
    );

    // Filter out null values from errors
    return nfts.filter(Boolean) as NftItem[];
  } catch (err) {
    console.error("Error fetching NFTs from Alchemy:", err);
    throw err; // Re-throw to be caught by the caller
  }
};

/**
 * Fetch NFTs listed on the marketplace
 */
export const fetchListedNfts = async (
  network: string = "mainnet",
  limit: number = 20
): Promise<NftItem[]> => {
  try {
    // Get popular collections
    const collections = await fetchNftCollections(network);
    if (!collections.length) {
      throw new Error("No collections found");
    }

    const allNfts: NftItem[] = [];
    const perCollectionLimit = Math.ceil(limit / collections.length);
    const provider = getProvider(network);
    const marketplaceAddress = MARKETPLACE_ADDRESSES[network as keyof typeof MARKETPLACE_ADDRESSES];
    const marketplace = new Contract(marketplaceAddress, MARKETPLACE_ABI, provider);

    // For each collection, fetch NFTs but only those that are listed
    await Promise.all(
      collections.map(async (collection) => {
        try {
          // Fetch NFTs from collection
          const endpoint = `${NETWORK_URLS[network as keyof typeof NETWORK_URLS]}/getNFTsForCollection?contractAddress=${collection.address}&withMetadata=true&limit=${perCollectionLimit}`;
          const response = await fetch(endpoint);

          if (!response.ok) {
            throw new Error(`Alchemy API error: ${response.statusText}`);
          }

          const data = await response.json();

          if (!data.nfts || !Array.isArray(data.nfts) || data.nfts.length === 0) {
            return;
          }

          // Filter only NFTs that are listed on the marketplace
          const collectionNfts = await Promise.all(
            data.nfts.map(async (nft: any) => {
              const tokenId = nft.id.tokenId;
              const contractAddress = collection.address;

              let price = "0";
              let isListed = false;

              // Fetch listing details from marketplace
              try {
                const listing = await marketplace.getListing(contractAddress, tokenId);
                isListed = listing.active; // Only active listings should appear
                price = formatEther(listing.price);
              } catch (error) {
                // NFT is not listed or error occurred
                isListed = false;
              }

              // Include only listed NFTs
              if (!isListed) {
                return null; // Skip non-listed NFTs
              }

              const imageUrl = normalizeIpfsUrl(nft.metadata?.image || nft.media?.[0]?.gateway || "");

              return {
                creator: nft.contract.creator || "Unknown",
                tokenId: tokenId.startsWith('0x') ? tokenId.substring(2) : tokenId,
                contractAddress,
                name: nft.metadata?.name || nft.title || `NFT #${tokenId}`,
                symbol: collection.symbol,
                tokenURI: nft.tokenUri?.raw || "",
                metadata: nft.metadata,
                owner: nft.owner,
                price,
                isListed,
                imageUrl,
                collection,
              };
            })
          );

          // Filter out null values (non-listed NFTs)
          allNfts.push(...(collectionNfts.filter(Boolean) as NftItem[]));
        } catch (error) {
          console.error(`Error processing collection ${collection.address}:`, error);
        }
      })
    );

    // Limit the number of returned NFTs
    return allNfts.slice(0, limit);
  } catch (err) {
    console.error("Error fetching listed NFTs:", err);
    throw err; // Re-throw to be caught by the caller
  }
};


/**
 * Fetch details for a specific NFT
 */
export const fetchNftDetails = async (
  contractAddress: string,
  tokenId: string,
  network: string = "mainnet"
): Promise<NftItem | null> => {
  try {
    if (!contractAddress || !tokenId) {
      throw new Error("Contract address and tokenId are required");
    }

    // Format tokenId - ensure it has '0x' prefix
    const formattedTokenId = tokenId.startsWith("0x") ? tokenId : `0x${tokenId}`;

    // Get NFT details from Alchemy
    const endpoint = `${NETWORK_URLS[network as keyof typeof NETWORK_URLS]}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${formattedTokenId}`;
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Alchemy API error: ${response.statusText}`);
    }

    const nft = await response.json();

    // Get collection info
    const collection = await fetchCollectionInfo(contractAddress, network);

    // Get the marketplace contract
    const provider = getProvider(network);
    const marketplaceAddress = MARKETPLACE_ADDRESSES[network as keyof typeof MARKETPLACE_ADDRESSES];
    const marketplace = new Contract(marketplaceAddress, MARKETPLACE_ABI, provider);

    // Check if the NFT is listed on the marketplace
    let price = "0";
    let isListed = false;
    let owner = "Unknown";
    
    try {
      const listing = await marketplace.getListing(contractAddress, formattedTokenId);
      isListed = listing.active;
      price = formatEther(listing.price);
      owner = listing.seller;
    } catch (error) {
      // NFT is not listed or error occurred
      isListed = false;
      
      // If not listed, try to get the owner
      try {
        const nftContract = getNftContract(contractAddress, network);
        owner = await nftContract.ownerOf(formattedTokenId);
      } catch (ownerError) {
        console.error("Error getting NFT owner:", ownerError);
      }
    }

    const imageUrl = normalizeIpfsUrl(nft.metadata?.image || nft.media?.[0]?.gateway || "");

    return {
      creator: nft.contract.creator || "Unknown",
      tokenId: nft.id.tokenId.startsWith('0x') ? nft.id.tokenId.substring(2) : nft.id.tokenId,
      contractAddress,
      name: nft.metadata?.name || nft.title || `NFT #${tokenId}`,
      symbol: nft.contract?.symbol || "NFT",
      tokenURI: nft.tokenUri?.raw || "",
      metadata: nft.metadata,
      owner,
      price,
      isListed,
      imageUrl,
      collection,
    };
  } catch (err) {
    console.error("Error fetching NFT details:", err);
    return null;
  }
};

/**
 * Fetch collection information
 */
export const fetchCollectionInfo = async (
  contractAddress: string,
  network: string = "mainnet"
): Promise<NftCollection | null> => {
  try {
    if (!contractAddress) {
      throw new Error("Contract address is required");
    }

    // Get collection metadata from Alchemy
    const endpoint = `${NETWORK_URLS[network as keyof typeof NETWORK_URLS]}/getContractMetadata?contractAddress=${contractAddress}`;
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Alchemy API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract collection data from response
    const collection: NftCollection = {
      id: contractAddress,
      address: contractAddress,
      name: data.contractMetadata?.name || "Unknown Collection",
      symbol: data.contractMetadata?.symbol || "NFT",
      totalSupply: data.contractMetadata?.totalSupply || "0",
      imageUrl: normalizeIpfsUrl(data.contractMetadata?.openSea?.imageUrl || ""),
      description: data.contractMetadata?.openSea?.description || "",
      itemCount: data.contractMetadata?.totalSupply || 0,
      bannerUrl: normalizeIpfsUrl(data.contractMetadata?.openSea?.bannerImageUrl || "")
    };
    
    return collection;
  } catch (err) {
    console.error("Error fetching collection info:", err);
    return null;
  }
};

/**
 * Fetch popular NFT collections
 */
export const fetchNftCollections = async (
  network: string = "mainnet",
  limit: number = 10
): Promise<NftCollection[]> => {
  try {
    const popularCollections = network === "mainnet" ? [
      "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D", // BAYC
      "0x60E4d786628Fea6478F785A6d7e704777c86a7c6", // MAYC
      "0xbd3531da5cf5857e7cfaa92426877b022e612cf8", // Pudgy Penguins
      "0x34d85c9CDeB23FA97cb08333b511ac86E1C4E258", // Otherdeed
      "0xED5AF388653567Af2F388E6224dC7C4b3241C544",  // Azuki
      "0x8a90cab2b38dba80c64b7734e58ee1db38b8992e" //Doodles V4
    ] : [
      "0x5180DB8F5c931aAe63c74266b211F580155ecAC8"
    ];
    
    const collections = await Promise.all(
      popularCollections.slice(0, limit).map(async (address) => {
        try {
          return await fetchCollectionInfo(address, network);
        } catch (error) {
          console.error(`Error fetching collection ${address}:`, error);
          return null;
        }
      })
    );
    
    return collections.filter(Boolean) as NftCollection[];
  } catch (err) {
    console.error("Error fetching NFT collections:", err);
    return [];
  }
};

/**
 * List an NFT on the marketplace
 */
export const listNftForSale = async (
  contractAddress: string,
  tokenId: string,
  price: string,
  signer: Signer,
  network: string = "mainnet"
): Promise<boolean> => {
  try {
    if (!contractAddress || !tokenId || !price) {
      throw new Error("Contract address, tokenId, and price are required");
    }
    
    const nftContract = getNftContract(contractAddress, network, signer);
    const formattedTokenId = tokenId.startsWith("0x") ? tokenId : `0x${tokenId}`;
    const owner = await nftContract.ownerOf(formattedTokenId);
    const signerAddress = await signer.getAddress();
    
    if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
      throw new Error("Only the owner can list this NFT");
    }
    
    const marketplace = getMarketplaceContract(network, signer);
    const marketplaceAddress = MARKETPLACE_ADDRESSES[network as keyof typeof MARKETPLACE_ADDRESSES];
    const approvedAddress = await nftContract.getApproved(formattedTokenId);
    const isApprovedForAll = await nftContract.isApprovedForAll(owner, marketplaceAddress);
    
    if (approvedAddress.toLowerCase() !== marketplaceAddress.toLowerCase() && !isApprovedForAll) {
      console.log("Approving marketplace to transfer NFT...");
      const approveTx = await nftContract.approve(marketplaceAddress, formattedTokenId);
      await approveTx.wait();
      console.log("Marketplace approved");
    }
    
    const priceInWei = parseEther(price);
    console.log("Listing NFT for sale...");
    const listTx = await marketplace.listItem(contractAddress, formattedTokenId, priceInWei);
    await listTx.wait();
    
    console.log("NFT listed successfully");
    return true;
  } catch (err) {
    console.error("Error listing NFT for sale:", err);
    return false;
  }
};

/**
 * Buy an NFT from the marketplace
 */
export const buyNft = async (
  contractAddress: string,
  tokenId: string,
  signer: Signer,
  network: string = "mainnet"
): Promise<boolean> => {
  try {
    if (!contractAddress || !tokenId) {
      throw new Error("Contract address and tokenId are required");
    }

    const formattedTokenId = tokenId.startsWith("0x") ? tokenId : `0x${tokenId}`;
    const marketplace = getMarketplaceContract(network, signer);

    // Fetch the listing information
    const listing = await marketplace.getListing(contractAddress, formattedTokenId);

    // Ensure the NFT is listed for sale
    if (!listing.active) {
      throw new Error("This NFT is not currently listed for sale");
    }

    console.log("Buying NFT...");
    const buyTx = await marketplace.buyItem(contractAddress, formattedTokenId, {
      value: listing.price, // Send the required payment
    });

    await buyTx.wait();
    console.log("NFT purchased successfully");

    return true;
  } catch (err) {
    console.error("Error buying NFT:", err);
    return false;
  }
};

/**
 * Cancel an NFT listing on the marketplace
 */
export const cancelNftListing = async (
  contractAddress: string,
  tokenId: string,
  signer: Signer,
  network: string = "mainnet"
): Promise<boolean> => {
  try {
    if (!contractAddress || !tokenId) {
      throw new Error("Contract address and tokenId are required");
    }
    
    const formattedTokenId = tokenId.startsWith("0x") ? tokenId : `0x${tokenId}`;
    const marketplace = getMarketplaceContract(network, signer);
    const listing = await marketplace.getListing(contractAddress, formattedTokenId);
    
    if (!listing.active) {
      throw new Error("This NFT is not currently listed for sale");
    }
    
    const signerAddress = await signer.getAddress();
    if (listing.seller.toLowerCase() !== signerAddress.toLowerCase()) {
      throw new Error("Only the seller can cancel this listing");
    }
    
    console.log("Cancelling NFT listing...");
    const cancelTx = await marketplace.cancelListing(contractAddress, formattedTokenId);
    await cancelTx.wait();
    
    console.log("Listing cancelled successfully");
    return true;
  } catch (err) {
    console.error("Error cancelling NFT listing:", err);
    return false;
  }
};

/**
 * Fetch NFTs for a specific collection with filtering, sorting, and pagination
 */
export const fetchCollectionNFTs = async (
  collectionAddress: string,
  network: string = "mainnet",
  pageNumber: number = 1,
  pageSize: number = 20,
  sortBy: string = "tokenId",
  sortDir: string = "asc",
  searchQuery: string = "",
  attributeFilters: Record<string, string[]> = {}
): Promise<{ nfts: any[], totalCount: number }> => {
  try {
    if (!collectionAddress) {
      throw new Error("Collection address is required");
    }

    // Format the endpoint URL with pagination parameters
    const pageOffset = (pageNumber - 1) * pageSize;
    let endpoint = `${NETWORK_URLS[network as keyof typeof NETWORK_URLS]}/getNFTsForCollection?contractAddress=${collectionAddress}&withMetadata=true&startToken=${pageOffset}&limit=${pageSize}`;
    
    // Get NFTs from the collection
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Alchemy API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.nfts || !Array.isArray(data.nfts)) {
      return { nfts: [], totalCount: 0 };
    }

    // Apply search filtering if provided
    let filteredNfts = data.nfts;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredNfts = filteredNfts.filter((nft: any) => {
        const name = (nft.metadata?.name || nft.title || `NFT #${nft.id.tokenId}`).toLowerCase();
        const tokenId = parseInt(nft.id.tokenId, 16).toString().toLowerCase();
        return name.includes(query) || tokenId.includes(query);
      });
    }

    // Apply attribute filtering if provided
    if (Object.keys(attributeFilters).length > 0) {
      filteredNfts = filteredNfts.filter((nft: any) => {
        if (!nft.metadata?.attributes) return false;
        
        // Check if NFT has all the required attributes
        return Object.entries(attributeFilters).every(([traitType, values]) => {
          // Skip if no values are specified for this trait type
          if (values.length === 0) return true;
          
          // Find the attribute with matching trait type
          const nftAttribute = nft.metadata.attributes.find(
            (attr: any) => attr.trait_type === traitType
          );
          
          // Check if the NFT has this attribute and if its value is in the filtered values
          return nftAttribute && values.includes(nftAttribute.value);
        });
      });
    }

    // Apply sorting
    filteredNfts.sort((a: any, b: any) => {
      let valueA, valueB;
      
      if (sortBy === 'tokenId') {
        valueA = parseInt(a.id.tokenId, 16);
        valueB = parseInt(b.id.tokenId, 16);
      } else if (sortBy === 'name') {
        valueA = (a.metadata?.name || a.title || `NFT #${a.id.tokenId}`).toLowerCase();
        valueB = (b.metadata?.name || b.title || `NFT #${b.id.tokenId}`).toLowerCase();
      } else {
        valueA = a[sortBy];
        valueB = b[sortBy];
      }
      
      if (sortDir === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    // Format the response
    const nfts = filteredNfts.map((nft: any) => {
      const tokenId = nft.id.tokenId;
      const imageUrl = normalizeIpfsUrl(nft.metadata?.image || nft.media?.[0]?.gateway || "");
      
      return {
        id: tokenId,
        tokenId: tokenId.startsWith('0x') ? tokenId.substring(2) : tokenId,
        name: nft.metadata?.name || nft.title || `NFT #${tokenId}`,
        description: nft.metadata?.description || "",
        imageUrl: imageUrl,
        attributes: nft.metadata?.attributes || []
      };
    });

    // Get the total count from the collection info
    const collectionInfo = await fetchCollectionInfo(collectionAddress, network);
    const totalCount = parseInt(collectionInfo?.totalSupply || "0");

    return {
      nfts: nfts.slice(0, pageSize), // Ensure we only return the requested page size
      totalCount
    };
  } catch (err) {
    console.error("Error fetching NFTs for collection:", err);
    return { nfts: [], totalCount: 0 };
  }
};

/**
 * Fetch collection metadata - alias for fetchCollectionInfo for backward compatibility
 */
export const fetchCollectionMetadata = async (
  contractAddress: string,
  network: string = "mainnet"
): Promise<NftCollection | null> => {
  return fetchCollectionInfo(contractAddress, network);
};

export default {
  fetchUserNfts,
  fetchListedNfts,
  fetchNftDetails,
  fetchCollectionInfo,
  fetchNftCollections,
  listNftForSale,
  buyNft,
  cancelNftListing,
};