import { Key, ReactNode } from "react";

// Define Alchemy API key
const ALCHEMY_API_KEY =
  import.meta.env.ALCHEMY_API_KEY || "kxqtC8mSeXeqxvwPpmTfkkKpDflgIb1p";

// Define network RPC URLs
const NETWORK_URLS = {
  mainnet: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  sepolia: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
};

// Define interfaces for NFT data
export interface NftItem {
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

// Function to get NFTs owned by a specific address
export const fetchUserNfts = async (
  address: string,
  network: string = "mainnet"
): Promise<NftItem[]> => {
  try {
    if (!address) {
      console.warn("No address provided to fetchUserNfts");
      return [];
    }

    // Define the Alchemy API endpoint for fetching NFTs
    const endpoint = `${
      NETWORK_URLS[network as keyof typeof NETWORK_URLS]
    }/getNFTs/?owner=${address}`;

    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Alchemy API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.ownedNfts || !Array.isArray(data.ownedNfts)) {
      console.warn("No NFTs found or invalid response format");
      return [];
    }

    // Map the Alchemy response to our NftItem format
    const nfts: NftItem[] = await Promise.all(
      data.ownedNfts.map(async (nft: any) => {
        try {
          const tokenId = nft.id.tokenId;
          const contractAddress = nft.contract.address;

          // Get collection info
          const collectionInfo = await fetchCollectionInfo(
            contractAddress,
            network
          );

          // Parse metadata
          const metadata = nft.metadata || null;

          // Generate a realistic price (in a real app, you would get this from your marketplace contract)
          const mockPrice = (Math.random() * 0.2 + 0.01).toFixed(4);
          const isListed = Math.random() > 0.7; // Random listing status for demo

          return {
            tokenId: tokenId.substring(2), // Remove '0x' prefix
            contractAddress,
            name: metadata?.name || nft.title || "Unknown NFT",
            symbol: nft.contract.symbol || "NFT",
            tokenURI: nft.tokenUri?.raw || "",
            metadata,
            owner: address,
            price: mockPrice,
            isListed,
            imageUrl: metadata?.image || nft.media?.[0]?.gateway || "",
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
    return [];
  }
};

// Function to fetch NFTs listed for sale
export const fetchListedNfts = async (
  network: string = "mainnet",
  limit: number = 20
): Promise<NftItem[]> => {
  try {
    // Get popular collections to simulate listed NFTs
    const collections = await fetchNftCollections(network);
    if (!collections.length) {
      throw new Error("No collections found");
    }

    const allNfts: NftItem[] = [];
    const perCollectionLimit = Math.ceil(limit / collections.length);

    // For each collection, fetch some NFTs
    await Promise.all(
      collections.map(async (collection) => {
        try {
          // Get NFTs from collection
          const endpoint = `${
            NETWORK_URLS[network as keyof typeof NETWORK_URLS]
          }/getNFTsForCollection?contractAddress=${
            collection.address
          }&withMetadata=true&limit=${perCollectionLimit}`;

          const response = await fetch(endpoint);
          if (!response.ok) {
            throw new Error(`Alchemy API error: ${response.statusText}`);
          }

          const data = await response.json();

          if (
            !data.nfts ||
            !Array.isArray(data.nfts) ||
            data.nfts.length === 0
          ) {
            return;
          }

          // Map to our NftItem format
          const collectionNfts = await Promise.all(
            data.nfts.map(async (nft: any) => {
              try {
                const tokenId = nft.id.tokenId;
                // Generate a realistic price
                const price = (Math.random() * 0.5 + 0.05).toFixed(4);

                return {
                  tokenId: tokenId.substring(2), // Remove '0x' prefix
                  contractAddress: collection.address,
                  name:
                    nft.metadata?.name ||
                    nft.title ||
                    `NFT #${tokenId.substring(2)}`,
                  symbol: collection.symbol,
                  tokenURI: nft.tokenUri?.raw || "",
                  metadata: nft.metadata,
                  owner: "Marketplace", // Placeholder
                  price,
                  isListed: true,
                  imageUrl:
                    nft.metadata?.image || nft.media?.[0]?.gateway || "",
                  collection,
                };
              } catch (error) {
                console.error(`Error processing NFT:`, error);
                return null;
              }
            })
          );

          // Add non-null NFTs to result
          allNfts.push(...(collectionNfts.filter(Boolean) as NftItem[]));
        } catch (error) {
          console.error(
            `Error processing collection ${collection.address}:`,
            error
          );
        }
      })
    );

    // Limit the number of returned NFTs
    return allNfts.slice(0, limit);
  } catch (err) {
    console.error("Error fetching listed NFTs:", err);
    return [];
  }
};

// Function to fetch details for a specific NFT
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
    const formattedTokenId = tokenId.startsWith("0x")
      ? tokenId
      : `0x${tokenId}`;

    // Get NFT details from Alchemy
    const endpoint = `${
      NETWORK_URLS[network as keyof typeof NETWORK_URLS]
    }/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${formattedTokenId}`;

    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Alchemy API error: ${response.statusText}`);
    }

    const nft = await response.json();

    // Get collection info
    const collection = await fetchCollectionInfo(contractAddress, network);

    // Generate a realistic price (in a real app, this would come from your marketplace contract)
    const price = (Math.random() * 0.2 + 0.01).toFixed(4);

    return {
      tokenId: nft.id.tokenId.substring(2), // Remove '0x' prefix
      contractAddress,
      name: nft.metadata?.name || nft.title || `NFT #${tokenId}`,
      symbol: nft.contract?.symbol || "NFT",
      tokenURI: nft.tokenUri?.raw || "",
      metadata: nft.metadata,
      owner: nft.contract?.address || "Unknown",
      price,
      isListed: true,
      imageUrl: nft.metadata?.image || nft.media?.[0]?.gateway || "",
      collection,
    };
  } catch (err) {
    console.error("Error fetching NFT details:", err);
    return null;
  }
};

// Function to fetch collection information
export const fetchCollectionInfo = async (
  contractAddress: string,
  network: string = "mainnet"
): Promise<NftCollection | null> => {
  try {
    if (!contractAddress) {
      throw new Error("Contract address is required");
    }

    // Get collection metadata from Alchemy
    const endpoint = `${
      NETWORK_URLS[network as keyof typeof NETWORK_URLS]
    }/getContractMetadata?contractAddress=${contractAddress}`;

    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Alchemy API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Get a sample token to find images
    const sampleNftEndpoint = `${
      NETWORK_URLS[network as keyof typeof NETWORK_URLS]
    }/getNFTsForCollection?contractAddress=${contractAddress}&withMetadata=true&limit=1`;
    const sampleResponse = await fetch(sampleNftEndpoint);
    const sampleData = await sampleResponse.json();

    let imageUrl = "";
    let bannerUrl = "";

    if (sampleData.nfts && sampleData.nfts.length > 0) {
      const sampleNft = sampleData.nfts[0];
      imageUrl =
        sampleNft.metadata?.image || sampleNft.media?.[0]?.gateway || "";
      // Using same image for banner as a fallback
      bannerUrl = imageUrl;
    }

    return {
      id: contractAddress,
      address: contractAddress,
      name: data.contractMetadata?.name || "Unknown Collection",
      symbol: data.contractMetadata?.symbol || "NFT",
      totalSupply: data.contractMetadata?.totalSupply || "???",
      imageUrl,
      description:
        data.contractMetadata?.openSea?.description ||
        `${data.contractMetadata?.name || "Unknown"} Collection`,
      itemCount: data.contractMetadata?.totalSupply || 0,
      bannerUrl,
    };
  } catch (err) {
    console.error("Error fetching collection info:", err);
    return null;
  }
};

// Function to fetch popular NFT collections
export const fetchNftCollections = async (
  network: string = "mainnet",
  limit: number = 5
): Promise<NftCollection[]> => {
  try {
    // Popular collections - you can replace with dynamic data from Alchemy
    const popularCollections: {
      [network: string]: Array<{
        address: string;
        name: string;
        symbol: string;
      }>;
    } = {
      mainnet: [
        {
          address: "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
          name: "Bored Ape Yacht Club",
          symbol: "BAYC",
        },
        {
          address: "0x60e4d786628fea6478f785a6d7e704777c86a7c6",
          name: "Mutant Ape Yacht Club",
          symbol: "MAYC",
        },
        {
          address: "0xed5af388653567af2f388e6224dc7c4b3241c544",
          name: "Azuki",
          symbol: "AZUKI",
        },
        {
          address: "0x8a90cab2b38dba80c64b7734e58ee1db38b8992e",
          name: "Doodles",
          symbol: "DOODLE",
        },
        {
          address: "0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b",
          name: "Clone X",
          symbol: "CLONEX",
        },
      ],
      sepolia: [
        {
          address: "0x5180db8f5c931aae63c74266b211f580155ecac8",
          name: "Test Collection 1",
          symbol: "TEST1",
        },
        {
          address: "0x8a90cab2b38dba80c64b7734e58ee1db38b8992e",
          name: "Test Collection 2",
          symbol: "TEST2",
        },
      ],
    };

    // Get collections for the selected network
    const networkCollections =
      popularCollections[network] || popularCollections["mainnet"];

    // Limit the number of collections
    const selectedCollections = networkCollections.slice(0, limit);

    // Fetch details for each collection
    const collections: NftCollection[] = await Promise.all(
      selectedCollections.map(async (collection) => {
        try {
          const collectionInfo = await fetchCollectionInfo(
            collection.address,
            network
          );

          // If we successfully got collection info, return it
          if (collectionInfo) {
            return collectionInfo;
          }

          // Otherwise, return default info
          return {
            id: collection.address,
            address: collection.address,
            name: collection.name,
            symbol: collection.symbol,
            totalSupply: "???",
            imageUrl: `/api/placeholder/400/400`,
            description: `${collection.name} is an NFT collection on Ethereum.`,
            itemCount: 0,
            bannerUrl: `/api/placeholder/800/400`,
          };
        } catch (err) {
          console.error(
            `Error fetching collection details for ${collection.address}:`,
            err
          );
          return {
            id: collection.address,
            address: collection.address,
            name: collection.name || "Unknown Collection",
            symbol: collection.symbol || "NFT",
            totalSupply: "???",
            imageUrl: `/api/placeholder/400/400`,
            description: "An NFT collection on Ethereum.",
            itemCount: 0,
            bannerUrl: `/api/placeholder/800/400`,
          };
        }
      })
    );

    return collections;
  } catch (err) {
    console.error("Error fetching NFT collections:", err);
    return [];
  }
};

// Function to handle NFT purchase
export const purchaseNft = async (
  tokenId: string,
  contractAddress: string,
  _network: string = "sepolia",
  buyerAddress: string
): Promise<{
  success: boolean;
  txHash: string;
  error?: string;
}> => {
  try {
    if (!contractAddress || !tokenId || !buyerAddress) {
      throw new Error("Missing required parameters for purchase");
    }

    // This is a simulated purchase flow since we don't have actual blockchain integration
    // In a real application, you would:
    // 1. Connect to the user's wallet (e.g., using ethers.js or web3.js)
    // 2. Create a transaction to call the marketplace smart contract
    // 3. Sign and send the transaction
    // 4. Wait for transaction confirmation

    console.log(
      `Simulating purchase of NFT ${tokenId} from contract ${contractAddress}`
    );

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate a fake transaction hash
    const txHash =
      "0x" +
      Array(64)
        .fill(0)
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("");

    return {
      success: true,
      txHash,
    };
  } catch (err) {
    console.error("Error purchasing NFT:", err);
    return {
      success: false,
      txHash: "",
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
};

// Function to simulate NFT listing
export const listNftForSale = async (
  tokenId: string,
  contractAddress: string,
  price: string,
  ownerAddress: string,
  _network: string = "sepolia"
): Promise<{
  success: boolean;
  txHash: string;
  error?: string;
}> => {
  try {
    if (!contractAddress || !tokenId || !price || !ownerAddress) {
      throw new Error("Missing required parameters for listing");
    }

    // Similar to purchase, this is a simulated listing flow
    console.log(
      `Simulating listing of NFT ${tokenId} from contract ${contractAddress} for ${price} ETH`
    );

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate a fake transaction hash
    const txHash =
      "0x" +
      Array(64)
        .fill(0)
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("");

    return {
      success: true,
      txHash,
    };
  } catch (err) {
    console.error("Error listing NFT:", err);
    return {
      success: false,
      txHash: "",
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
};

// Function to search for NFTs
export const searchNfts = async (
  query: string,
  network: string = "mainnet",
  limit: number = 20
): Promise<NftItem[]> => {
  try {
    if (!query) {
      return [];
    }

    // Get collections first
    const collections = await fetchNftCollections(network);

    // Filter collections by name
    const matchingCollections = collections.filter(
      (collection) =>
        collection.name.toLowerCase().includes(query.toLowerCase()) ||
        collection.symbol.toLowerCase().includes(query.toLowerCase())
    );

    if (matchingCollections.length === 0) {
      return [];
    }

    // For each matching collection, fetch some NFTs
    const allNfts: NftItem[] = [];
    const perCollectionLimit = Math.ceil(limit / matchingCollections.length);

    await Promise.all(
      matchingCollections.map(async (collection) => {
        try {
          const endpoint = `${
            NETWORK_URLS[network as keyof typeof NETWORK_URLS]
          }/getNFTsForCollection?contractAddress=${
            collection.address
          }&withMetadata=true&limit=${perCollectionLimit}`;

          const response = await fetch(endpoint);
          if (!response.ok) {
            throw new Error(`Alchemy API error: ${response.statusText}`);
          }

          const data = await response.json();

          if (
            !data.nfts ||
            !Array.isArray(data.nfts) ||
            data.nfts.length === 0
          ) {
            return;
          }

          // Filter NFTs by name if we have metadata
          const filteredNfts = data.nfts.filter(
            (nft: any) =>
              !query ||
              nft.metadata?.name?.toLowerCase().includes(query.toLowerCase()) ||
              nft.title?.toLowerCase().includes(query.toLowerCase())
          );

          // Map to our NftItem format
          const collectionNfts = await Promise.all(
            filteredNfts.map(async (nft: any) => {
              try {
                const tokenId = nft.id.tokenId;
                const price = (Math.random() * 0.5 + 0.05).toFixed(4);

                return {
                  tokenId: tokenId.substring(2),
                  contractAddress: collection.address,
                  name:
                    nft.metadata?.name ||
                    nft.title ||
                    `NFT #${tokenId.substring(2)}`,
                  symbol: collection.symbol,
                  tokenURI: nft.tokenUri?.raw || "",
                  metadata: nft.metadata,
                  owner: "Marketplace", // Placeholder
                  price,
                  isListed: true,
                  imageUrl:
                    nft.metadata?.image || nft.media?.[0]?.gateway || "",
                  collection,
                };
              } catch (error) {
                console.error(`Error processing NFT:`, error);
                return null;
              }
            })
          );

          // Add non-null NFTs to result
          allNfts.push(...(collectionNfts.filter(Boolean) as NftItem[]));
        } catch (error) {
          console.error(
            `Error processing collection ${collection.address}:`,
            error
          );
        }
      })
    );

    // Limit the number of returned NFTs
    return allNfts.slice(0, limit);
  } catch (err) {
    console.error("Error searching NFTs:", err);
    return [];
  }
};
