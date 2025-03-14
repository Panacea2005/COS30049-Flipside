import axios from "axios";
import {
  JsonRpcProvider,
  Contract,
  Signer,
  parseEther,
  formatEther,
  ethers,
} from "ethers";
import { Key, ReactNode } from "react";

// Pinata credentials
const PINATA_API_KEY = import.meta.env.PINATA_API_KEY || "b092bdaa484e7c0bb041";
const PINATA_API_SECRET =
  import.meta.env.PINATA_API_SECRET ||
  "dc57a574e73839f356790fca3d2cd82d805a1152ee4c450a5278bd3d65cdc3de";

// Define Alchemy API key
const ALCHEMY_API_KEY =
  import.meta.env.ALCHEMY_API_KEY || "kxqtC8mSeXeqxvwPpmTfkkKpDflgIb1p";

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
  "function ownerOf(uint256 tokenId) external view returns (address)",
];

// Simple NFT Marketplace ABI
const MARKETPLACE_ABI = [
  "function mintNFT(address to, string memory uri) external returns (uint256)",
  "function listItem(uint256 tokenId, uint256 price) external",
  "function buyItem(uint256 tokenId) external payable",
  "function cancelListing(uint256 tokenId) external",
  "function getListing(uint256 tokenId) external view returns (address seller, uint256 price, bool active)",
  "function tokenURI(uint256 tokenId) public view returns (string)",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function approve(address to, uint256 tokenId) external",
  "function getApproved(uint256 tokenId) external view returns (address)",
  "event NFTMinted(uint256 indexed tokenId, address indexed to, string uri)",
  "event ItemListed(uint256 indexed tokenId, address indexed seller, uint256 price)",
  // Add ERC721 errors for debugging
  "error ERC721InvalidOwner(address owner)",
  "error ERC721NonexistentToken(uint256 tokenId)",
  "error ERC721IncorrectOwner(address sender, uint256 tokenId, address owner)",
  "error ERC721InsufficientApproval(address operator, uint256 tokenId)",
];

// Configure marketplace contract addresses
export const MARKETPLACE_ADDRESSES = {
  mainnet: "0x00000000006c3852cbEf3e08E8dF289169EdE581", // OpenSea Seaport
  sepolia: "0x816001d49e7e88e214da7fbb689e309e0c536476", // Testnet marketplace
};

// Define interfaces for NFT data
export interface NftItem {
  image: any;
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
  banner: any;
  image: string;
  nftCount: ReactNode;
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
  return new JsonRpcProvider(
    NETWORK_URLS[network as keyof typeof NETWORK_URLS]
  );
}

/**
 * Get an NFT marketplace contract instance
 */
function getMarketplaceContract(network: string, signer?: Signer): Contract {
  if (!NETWORK_URLS[network as keyof typeof NETWORK_URLS]) {
    throw new Error(`Unsupported network: ${network}`);
  }
  const marketplaceAddress =
    MARKETPLACE_ADDRESSES[network as keyof typeof MARKETPLACE_ADDRESSES];
  if (!ethers.isAddress(marketplaceAddress)) {
    throw new Error(`Invalid marketplace address: ${marketplaceAddress}`);
  }
  const provider = signer ? undefined : getProvider(network);
  const contract = new Contract(
    marketplaceAddress,
    MARKETPLACE_ABI,
    signer || provider
  );
  console.log(
    `Marketplace contract instantiated at ${marketplaceAddress} on ${network}`
  );
  return contract;
}

/**
 * Get an NFT contract instance
 */
function getNftContract(
  contractAddress: string,
  network: string,
  signer?: Signer
): Contract {
  const provider = getProvider(network);

  return new Contract(contractAddress, ERC721_ABI, signer || provider);
}

/**
 * Normalize IPFS URLs
 */
function normalizeIpfsUrl(url: string): string {
  if (!url) return "";

  if (url.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${url.slice(7)}`;
  }

  return url;
}

/**
 * Fetch user's NFTs using Alchemy API
 */
// Updated fetchUserNfts
export const fetchUserNfts = async (
  address: string,
  network: string = "mainnet"
): Promise<NftItem[]> => {
  try {
    if (!address) {
      console.warn("No address provided to fetchUserNfts");
      return [];
    }

    const provider = getProvider(network);
    const marketplaceAddress =
      MARKETPLACE_ADDRESSES[network as keyof typeof MARKETPLACE_ADDRESSES];
    const marketplace = new Contract(
      marketplaceAddress,
      MARKETPLACE_ABI,
      provider
    );

    // Fetch all NFTs owned by the address from Alchemy
    const endpoint = `${
      NETWORK_URLS[network as keyof typeof NETWORK_URLS]
    }/getNFTs/?owner=${address}&contractAddresses[]=${marketplaceAddress}&withMetadata=true`;
    const response = await fetch(endpoint);
    if (!response.ok) {
      console.error(`Alchemy API error: ${response.statusText}`);
      throw new Error(`Alchemy API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Alchemy ownedNfts response:", data);

    let nfts: NftItem[] = [];
    if (data.ownedNfts && Array.isArray(data.ownedNfts)) {
      nfts = await Promise.all(
        data.ownedNfts.map(async (nft: any) => {
          try {
            const tokenId = BigInt(nft.id.tokenId).toString();
            const contractAddress = nft.contract.address;

            if (
              contractAddress.toLowerCase() !== marketplaceAddress.toLowerCase()
            ) {
              return null; // Skip non-marketplace NFTs
            }

            const tokenURI = await marketplace.tokenURI(tokenId);
            const owner = await marketplace.ownerOf(tokenId);

            let price = "0";
            let isListed = false;
            try {
              const listing = await marketplace.getListing(tokenId);
              isListed = listing.active;
              price = formatEther(listing.price);
            } catch (error) {
              console.log(`NFT ${tokenId} not listed:`, error);
            }

            const metadataUrl = normalizeIpfsUrl(tokenURI);
            let metadata;
            try {
              const metadataResponse = await fetch(metadataUrl);
              metadata = await metadataResponse.json();
            } catch (error) {
              console.warn(
                `Failed to fetch metadata for token ${tokenId}:`,
                error
              );
              metadata = { name: `NFT #${tokenId}`, image: "" };
            }
            const imageUrl = normalizeIpfsUrl(metadata.image || "");

            return {
              image: imageUrl,
              creator: address,
              tokenId,
              contractAddress,
              name: metadata.name || `NFT #${tokenId}`,
              symbol: "NFT",
              tokenURI,
              metadata,
              owner,
              price,
              isListed,
              imageUrl,
              collection: null,
            };
          } catch (error) {
            console.error(`Error processing NFT ${nft.id.tokenId}:`, error);
            return null;
          }
        })
      );
    }

    // Fallback: Check recent mints with a larger block range
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, latestBlock - 5000); // Increase block range
    const recentTokenId = await checkRecentMints(
      address,
      marketplace,
      fromBlock
    );
    if (recentTokenId && !nfts.some((nft) => nft?.tokenId === recentTokenId)) {
      const tokenURI = await marketplace.tokenURI(recentTokenId);
      const owner = await marketplace.ownerOf(recentTokenId);
      const listing = await marketplace.getListing(recentTokenId);
      const metadataUrl = normalizeIpfsUrl(tokenURI);
      const metadataResponse = await fetch(metadataUrl);
      const metadata = await metadataResponse.json();
      const imageUrl = normalizeIpfsUrl(metadata.image || "");

      nfts.push({
        image: imageUrl,
        creator: address,
        tokenId: recentTokenId,
        contractAddress: marketplaceAddress,
        name: metadata.name || `NFT #${recentTokenId}`,
        symbol: "NFT",
        tokenURI,
        metadata,
        owner,
        price: formatEther(listing.price),
        isListed: listing.active,
        imageUrl,
        collection: null,
      });
    }

    return nfts.filter(Boolean) as NftItem[];
  } catch (err) {
    console.error("Error fetching user NFTs:", err);
    return [];
  }
};

// Updated checkRecentMints
async function checkRecentMints(
  address: string,
  marketplace: Contract,
  fromBlock: number
): Promise<string | null> {
  try {
    const filter = marketplace.filters.NFTMinted(null, address, null);
    const events = await fetchEventsInChunks(
      marketplace,
      filter,
      fromBlock,
      "latest"
    );
    if (events.length > 0) {
      const latestEvent = events[events.length - 1];
      const eventArgs = latestEvent.args;
      return BigInt(eventArgs.tokenId).toString();
    }
    return null;
  } catch (error) {
    console.warn("Failed to fetch recent mint events:", error);
    return null;
  }
}

async function fetchEventsInChunks(
  contract: Contract,
  filter: any,
  fromBlock: number,
  toBlock: string | number,
  chunkSize: number = 100
): Promise<any[]> {
  const provider = contract.runner?.provider;
  if (!provider) throw new Error("Provider not available");

  const latestBlock =
    typeof toBlock === "string" ? await provider.getBlockNumber() : toBlock;
  if (fromBlock > latestBlock) return [];

  const events: any[] = [];
  let currentFrom = fromBlock;
  const maxRetries = 3;
  const delayMs = 1000;

  while (currentFrom <= latestBlock) {
    const currentTo = Math.min(currentFrom + chunkSize - 1, latestBlock);
    let retries = 0;
    let success = false;

    while (retries <= maxRetries && !success) {
      try {
        const chunkEvents = await contract.queryFilter(filter, currentFrom, currentTo);
        events.push(...chunkEvents);
        success = true;
      } catch (error: any) {
        const errorCode = error?.error?.code || error.code;
        if (errorCode === 429 && retries < maxRetries) {
          console.warn(
            `Rate limit (429) hit for blocks ${currentFrom} to ${currentTo}, retrying (${retries + 1}/${maxRetries})`
          );
          await new Promise(resolve => setTimeout(resolve, delayMs));
          retries++;
        } else {
          console.warn(`Failed to fetch events from ${currentFrom} to ${currentTo}:`, error);
          break;
        }
      }
    }

    currentFrom = currentTo + 1;
    if (currentFrom <= latestBlock && success) {
      await new Promise(resolve => setTimeout(resolve, delayMs / 2));
    }
  }

  console.log(`Fetched ${events.length} events from ${fromBlock} to ${latestBlock}`);
  return events;
}

/**
 * Fetch NFTs listed on the marketplace
 */
export const fetchListedNfts = async (
  network: string = "mainnet",
  limit: number = 20
): Promise<NftItem[]> => {
  try {
    const provider = getProvider(network);
    const marketplaceAddress = MARKETPLACE_ADDRESSES[network as keyof typeof MARKETPLACE_ADDRESSES];
    const marketplace = new Contract(marketplaceAddress, MARKETPLACE_ABI, provider);

    const latestBlock = await provider.getBlockNumber();
    const fromBlock = network === "sepolia" ? 0 : Math.max(0, latestBlock - 10000);
    const filter = marketplace.filters.ItemListed(null, null, null);
    const events = await fetchEventsInChunks(
      marketplace,
      filter,
      fromBlock,
      "latest"
    );

    console.log("Listing events:", events);

    const listedTokenIds = events
      .map((event) => BigInt(event.args.tokenId).toString())
      .slice(0, limit);

    const nfts = await Promise.all(
      listedTokenIds.map(async (tokenId) => {
        try {
          const listing = await marketplace.getListing(tokenId);
          if (!listing.active) return null;

          const tokenURI = await marketplace.tokenURI(tokenId);
          const owner = await marketplace.ownerOf(tokenId); // Should be marketplaceAddress if listed
          const metadataUrl = normalizeIpfsUrl(tokenURI);
          const metadataResponse = await fetch(metadataUrl);
          const metadata = await metadataResponse.json();
          const imageUrl = normalizeIpfsUrl(metadata.image || "");

          return {
            creator: listing.seller, // Seller is the original owner
            tokenId,
            contractAddress: marketplaceAddress,
            name: metadata.name || `NFT #${tokenId}`,
            symbol: "MKT",
            tokenURI,
            metadata,
            owner, // Should be marketplace contract
            price: formatEther(listing.price),
            isListed: true,
            imageUrl,
            collection: {
              address: marketplaceAddress,
              name: "NFT Marketplace Collection",
              symbol: "MKT",
              totalSupply: "0",
              imageUrl: "",
              description: "NFTs minted and listed via the marketplace",
              itemCount: 0,
              bannerUrl: "",
              banner: undefined,
              image: "",
              nftCount: undefined,
              id: marketplaceAddress,
            },
          };
        } catch (error) {
          console.error(`Error processing token ${tokenId}:`, error);
          return null;
        }
      })
    );

    const validNfts = nfts.filter(Boolean) as NftItem[];
    console.log("Fetched listed NFTs:", validNfts);
    return validNfts;
  } catch (err) {
    console.error("Error fetching listed NFTs:", err);
    return [];
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

    const formattedTokenId = tokenId.startsWith("0x") ? tokenId : `0x${tokenId}`;
    if (!/^0x[0-9a-fA-F]+$/.test(formattedTokenId)) {
      throw new Error(`Invalid tokenId format: ${tokenId}`);
    }

    console.log(`Fetching NFT details - contractAddress: ${contractAddress}, tokenId: ${formattedTokenId}, network: ${network}`);

    const endpoint = `${NETWORK_URLS[network as keyof typeof NETWORK_URLS]}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${formattedTokenId}`;
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Alchemy API error: ${response.statusText}`);
    }

    const nft = await response.json();
    console.log("Alchemy NFT metadata:", nft);

    const collection = await fetchCollectionInfo(contractAddress, network);

    const provider = getProvider(network);
    console.log("Provider instantiated for network:", network);

    const nftContract = getNftContract(contractAddress, network);
    console.log("NFT contract instantiated at:", contractAddress);

    // Fetch owner
    let owner = "Unknown";
    try {
      const rawOwner = await nftContract.ownerOf(formattedTokenId);
      console.log(`Raw ownerOf response for tokenId ${formattedTokenId}:`, rawOwner);
      if (rawOwner === "0x" || !rawOwner.startsWith("0x") || rawOwner.length !== 42) {
        console.warn(`Invalid owner address returned: ${rawOwner}`);
        owner = "Non-existent or invalid token";
      } else {
        owner = rawOwner;
      }
    } catch (error) {
      console.error("Error fetching owner from NFT contract:", error);
      owner = "Unknown (fetch failed)";
    }

    const marketplaceAddress = MARKETPLACE_ADDRESSES[network as keyof typeof MARKETPLACE_ADDRESSES];
    const marketplace = new Contract(marketplaceAddress, MARKETPLACE_ABI, provider);

    let price = "0";
    let isListed = false;
    try {
      const listing = await marketplace.getListing(formattedTokenId);
      isListed = listing.active;
      price = formatEther(listing.price);
    } catch (error) {
      console.log(`NFT ${tokenId} not listed on marketplace:`, error);
    }

    const imageUrl = normalizeIpfsUrl(nft.metadata?.image || nft.media?.[0]?.gateway || "");

    const result: NftItem = {
      image: nft.metadata?.image || nft.media?.[0]?.gateway || "",
      creator: nft.contract?.creator || "Unknown",
      tokenId: nft.id.tokenId.startsWith("0x") ? nft.id.tokenId.substring(2) : nft.id.tokenId,
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
    console.log("Fetched NFT details:", result);
    return result;
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

    const endpoint = `${
      NETWORK_URLS[network as keyof typeof NETWORK_URLS]
    }/getContractMetadata?contractAddress=${contractAddress}`;
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`Alchemy API error: ${response.statusText}`);
    }

    const data = await response.json();

    let collectionName = data.contractMetadata?.name || "Unknown Collection";
    if (
      contractAddress.toLowerCase() ===
      "0x816001d49e7e88e214da7fbb689e309e0c536476".toLowerCase()
    ) {
      collectionName = "NFT Marketplace Collection";
    }

    const collection: NftCollection = {
      id: contractAddress,
      address: contractAddress,
      name: collectionName,
      symbol: data.contractMetadata?.symbol || "MKT",
      totalSupply: data.contractMetadata?.totalSupply || "0",
      imageUrl: normalizeIpfsUrl(
        data.contractMetadata?.openSea?.imageUrl || ""
      ),
      description:
        data.contractMetadata?.openSea?.description ||
        "Collection of NFTs minted via the marketplace",
      itemCount: data.contractMetadata?.totalSupply || 0,
      bannerUrl: normalizeIpfsUrl(
        data.contractMetadata?.openSea?.bannerImageUrl || ""
      ),
      banner: undefined,
      image: "",
      nftCount: undefined,
    };

    return collection;
  } catch (err) {
    console.error("Error fetching collection info:", err);
    return null;
  }
};

/**
 * Fetch NFT collections with pagination from a broader set of known contracts
 */
export const fetchNftCollections = async (
  network: string = "mainnet",
  pageNumber: number = 1,
  pageSize: number = 10
): Promise<NftCollection[]> => {
  try {
    // Expanded list of known contract addresses (replace with an API call in production)
    const knownCollections =
      network === "mainnet"
        ? [
            "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D", // BAYC
            "0x60E4d786628Fea6478F785A6d7e704777c86a7c6", // MAYC
            "0xbd3531da5cf5857e7cfaa92426877b022e612cf8", // Pudgy Penguins
            "0x34d85c9CDeB23FA97cb08333b511ac86E1C4E258", // Otherdeed
            "0xED5AF388653567Af2F388E6224dC7C4b3241C544", // Azuki
            "0x8a90cab2b38dba80c64b7734e58ee1db38b8992e", // Doodles V4
            "0x49cF6f5d44E70224e2E23fDcdd2C053F30aDA28B", // CloneX
            "0x1A92f7381B9F03921564a437210bB9396471050C", // Cool Cats
            "0x7Bd29408f11D2bFC23c34f18275bBf23bB716Bc7", // Meebits
            "0xb6a37b5d14d502c3ab0ae6f3a0e058bc9517786e", // Elemental
            "0x6339e5e072086621540d0362c4e3cea0d643e114", // Opepen Edition
            "0x524cab2ec69124574082676e6f654a18df49a048", // Lil Pudgys
          ]
        : ["0x816001d49e7e88e214da7fbb689e309e0c536476"];

    // Pagination
    const startIndex = (pageNumber - 1) * pageSize;
    const paginatedAddresses = knownCollections.slice(
      startIndex,
      startIndex + pageSize
    );

    // Fetch collection info for paginated addresses using fetchCollectionInfo
    const collections = await Promise.all(
      paginatedAddresses.map(async (address) => {
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
 * Fetch the total number of known collections
 */
export const fetchTotalCollectionsCount = async (
  network: string = "mainnet"
): Promise<number> => {
  try {
    const knownCollections =
      network === "mainnet"
        ? [
            "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
            "0x60E4d786628Fea6478F785A6d7e704777c86a7c6",
            "0xbd3531da5cf5857e7cfaa92426877b022e612cf8",
            "0x34d85c9CDeB23FA97cb08333b511ac86E1C4E258",
            "0xED5AF388653567Af2F388E6224dC7C4b3241C544",
            "0x8a90cab2b38dba80c64b7734e58ee1db38b8992e",
            "0x49cF6f5d44E70224e2E23fDcdd2C053F30aDA28B",
            "0x1A92f7381B9F03921564a437210bB9396471050C",
            "0x7Bd29408f11D2bFC23c34f18275bBf23bB716Bc7",
            "0x23581767a106ae21c074b2276D25e5C3e136a68b",
          ]
        : ["0x816001d49e7e88e214da7fbb689e309e0c536476"];
    return knownCollections.length;
  } catch (err) {
    console.error("Error fetching total collections count:", err);
    return 0;
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
  network: string
): Promise<boolean> => {
  try {
    console.log("listNftForSale called", {
      contractAddress,
      tokenId,
      price,
      network,
    });
    if (!contractAddress || !tokenId || !price) {
      throw new Error("Contract address, tokenId, and price are required");
    }

    const nftContract = getNftContract(contractAddress, network, signer);
    const formattedTokenId = tokenId.startsWith("0x")
      ? tokenId
      : `0x${tokenId}`;
    const owner = await nftContract.ownerOf(formattedTokenId);
    const signerAddress = await signer.getAddress();

    console.log("Checking ownership", { owner, signerAddress });
    if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
      throw new Error("Only the owner can list this NFT");
    }

    const marketplace = getMarketplaceContract(network, signer);
    const marketplaceAddress =
      MARKETPLACE_ADDRESSES[network as keyof typeof MARKETPLACE_ADDRESSES];
    const approvedAddress = await nftContract.getApproved(formattedTokenId);
    const isApprovedForAll = await nftContract.isApprovedForAll(
      owner,
      marketplaceAddress
    );

    console.log("Checking approval", {
      approvedAddress,
      isApprovedForAll,
      marketplaceAddress,
    });
    if (
      approvedAddress.toLowerCase() !== marketplaceAddress.toLowerCase() &&
      !isApprovedForAll
    ) {
      console.log("Approving marketplace to transfer NFT...");
      const approveTx = await nftContract.approve(
        marketplaceAddress,
        formattedTokenId
      );
      await approveTx.wait();
      console.log("Marketplace approved");
    }

    const priceInWei = parseEther(price);
    console.log("Listing NFT...", { priceInWei });
    const listTx = await marketplace.listItem(
      contractAddress,
      formattedTokenId,
      priceInWei
    );
    console.log("Listing tx sent:", listTx.hash);
    await listTx.wait();
    console.log("Listing confirmed");

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
    if (!tokenId) {
      throw new Error("Token ID is required");
    }

    const marketplace = getMarketplaceContract(network, signer);
    const marketplaceAddress = MARKETPLACE_ADDRESSES[network as keyof typeof MARKETPLACE_ADDRESSES];

    // Ensure tokenId is a decimal string, not hex
    const formattedTokenId = tokenId.startsWith("0x")
      ? BigInt(tokenId).toString()
      : tokenId;

    console.log(`Fetching listing for token ${formattedTokenId} on ${marketplaceAddress}`);

    let listing;
    try {
      listing = await marketplace.getListing(formattedTokenId);
      console.log("Listing fetched:", listing);
    } catch (error) {
      console.error("Error fetching listing:", error);
      throw new Error("Failed to fetch listing data for this NFT.");
    }

    if (!listing.active) {
      throw new Error("This NFT is not currently listed for sale");
    }

    console.log(`Buying NFT ${formattedTokenId} for ${formatEther(listing.price)} ETH`);
    const buyTx = await marketplace.buyItem(formattedTokenId, {
      value: listing.price,
    });

    const receipt = await buyTx.wait();
    console.log("NFT purchased successfully, tx hash:", buyTx.hash);

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

    const formattedTokenId = tokenId.startsWith("0x")
      ? tokenId
      : `0x${tokenId}`;
    const marketplace = getMarketplaceContract(network, signer);
    const listing = await marketplace.getListing(
      contractAddress,
      formattedTokenId
    );

    if (!listing.active) {
      throw new Error("This NFT is not currently listed for sale");
    }

    const signerAddress = await signer.getAddress();
    if (listing.seller.toLowerCase() !== signerAddress.toLowerCase()) {
      throw new Error("Only the seller can cancel this listing");
    }

    console.log("Cancelling NFT listing...");
    const cancelTx = await marketplace.cancelListing(
      contractAddress,
      formattedTokenId
    );
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
): Promise<{ nfts: any[]; totalCount: number }> => {
  try {
    if (!collectionAddress) {
      throw new Error("Collection address is required");
    }

    // Format the endpoint URL with pagination parameters
    const pageOffset = (pageNumber - 1) * pageSize;
    let endpoint = `${
      NETWORK_URLS[network as keyof typeof NETWORK_URLS]
    }/getNFTsForCollection?contractAddress=${collectionAddress}&withMetadata=true&startToken=${pageOffset}&limit=${pageSize}`;

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
        const name = (
          nft.metadata?.name ||
          nft.title ||
          `NFT #${nft.id.tokenId}`
        ).toLowerCase();
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

      if (sortBy === "tokenId") {
        valueA = parseInt(a.id.tokenId, 16);
        valueB = parseInt(b.id.tokenId, 16);
      } else if (sortBy === "name") {
        valueA = (
          a.metadata?.name ||
          a.title ||
          `NFT #${a.id.tokenId}`
        ).toLowerCase();
        valueB = (
          b.metadata?.name ||
          b.title ||
          `NFT #${b.id.tokenId}`
        ).toLowerCase();
      } else {
        valueA = a[sortBy];
        valueB = b[sortBy];
      }

      if (sortDir === "asc") {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    // Format the response
    const nfts = filteredNfts.map((nft: any) => {
      const tokenId = nft.id.tokenId;
      const imageUrl = normalizeIpfsUrl(
        nft.metadata?.image || nft.media?.[0]?.gateway || ""
      );

      return {
        id: tokenId,
        tokenId: tokenId.startsWith("0x") ? tokenId.substring(2) : tokenId,
        name: nft.metadata?.name || nft.title || `NFT #${tokenId}`,
        description: nft.metadata?.description || "",
        imageUrl: imageUrl,
        attributes: nft.metadata?.attributes || [],
      };
    });

    // Get the total count from the collection info
    const collectionInfo = await fetchCollectionInfo(
      collectionAddress,
      network
    );
    const totalCount = parseInt(collectionInfo?.totalSupply || "0");

    return {
      nfts: nfts.slice(0, pageSize), // Ensure we only return the requested page size
      totalCount,
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

/**
 * Fetch all NFTs on the network with pagination
 */
export const fetchAllNetworkNfts = async (
  network: string = "mainnet",
  pageNumber: number = 1,
  pageSize: number = 20,
  searchQuery: string = "" // Search parameter
): Promise<{ nfts: NftItem[]; totalCount: number }> => {
  try {
    const provider = getProvider(network);
    const marketplaceAddress =
      MARKETPLACE_ADDRESSES[network as keyof typeof MARKETPLACE_ADDRESSES];
    const marketplace = new Contract(
      marketplaceAddress,
      MARKETPLACE_ABI,
      provider
    );

    if (searchQuery) {
      const query = searchQuery.trim().toLowerCase();

      // Case 1: Search by contract address (e.g., "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D")
      if (query.startsWith("0x") && query.length === 42) {
        const endpoint = `${
          NETWORK_URLS[network as keyof typeof NETWORK_URLS]
        }/getNFTsForCollection?contractAddress=${query}&withMetadata=true&limit=${pageSize}&startToken=${
          (pageNumber - 1) * pageSize
        }`;
        const response = await fetch(endpoint);
        if (!response.ok)
          throw new Error(`Alchemy API error: ${response.statusText}`);
        const data = await response.json();

        if (!data.nfts || !Array.isArray(data.nfts)) {
          return { nfts: [], totalCount: 0 };
        }

        const collection = await fetchCollectionInfo(query, network);
        const totalCount = parseInt(collection?.totalSupply || "0");

        const nfts = await Promise.all(
          data.nfts.map(async (nft: any) => {
            const tokenId = nft.id.tokenId;
            const contractAddress = query;

            let price = "0";
            let isListed = false;
            try {
              const listing = await marketplace.getListing(
                contractAddress,
                tokenId
              );
              isListed = listing.active;
              price = formatEther(listing.price);
            } catch (error) {
              isListed = false;
            }

            const imageUrl = normalizeIpfsUrl(
              nft.metadata?.image || nft.media?.[0]?.gateway || ""
            );

            return {
              creator: nft.contract?.creator || "Unknown",
              tokenId: tokenId.startsWith("0x")
                ? tokenId.substring(2)
                : tokenId,
              contractAddress,
              name: nft.metadata?.name || nft.title || `NFT #${tokenId}`,
              symbol: collection?.symbol || "NFT",
              tokenURI: nft.tokenUri?.raw || "",
              metadata: nft.metadata || null,
              owner: nft.owner || "Unknown",
              price,
              isListed,
              imageUrl,
              collection: collection || null,
              image: imageUrl,
            };
          })
        );

        return {
          nfts: nfts.filter(Boolean) as NftItem[],
          totalCount,
        };
      }

      // Case 2: Search by contract address and token ID (e.g., "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D 123")
      const [contractPart, tokenPart] = query.split(" ");
      if (
        contractPart?.startsWith("0x") &&
        contractPart.length === 42 &&
        tokenPart &&
        !isNaN(parseInt(tokenPart))
      ) {
        const tokenId = parseInt(tokenPart).toString(16); // Convert to hex
        const formattedTokenId = tokenId.startsWith("0x")
          ? tokenId
          : `0x${tokenId}`;
        const nft = await fetchNftDetails(
          contractPart,
          formattedTokenId,
          network
        );
        return {
          nfts: nft ? [nft] : [],
          totalCount: nft ? 1 : 0,
        };
      }

      // Case 3: Search by name (client-side filtering from popular collections or external API)
      // Since Alchemy doesn't support name search, we'll fetch from popular collections and filter
      const collections = await fetchNftCollections(network, 1, 1000);
      const allNfts: NftItem[] = [];
      const perCollectionLimit = 50;

      await Promise.all(
        collections.map(async (collection) => {
          const endpoint = `${
            NETWORK_URLS[network as keyof typeof NETWORK_URLS]
          }/getNFTsForCollection?contractAddress=${
            collection.address
          }&withMetadata=true&limit=${perCollectionLimit}`;
          const response = await fetch(endpoint);
          if (!response.ok) return;

          const data = await response.json();
          if (!data.nfts || !Array.isArray(data.nfts)) return;

          const collectionNfts = await Promise.all(
            data.nfts.map(async (nft: any) => {
              const tokenId = nft.id.tokenId;
              const contractAddress = collection.address;

              let price = "0";
              let isListed = false;
              try {
                const listing = await marketplace.getListing(
                  contractAddress,
                  tokenId
                );
                isListed = listing.active;
                price = formatEther(listing.price);
              } catch (error) {
                isListed = false;
              }

              const imageUrl = normalizeIpfsUrl(
                nft.metadata?.image || nft.media?.[0]?.gateway || ""
              );

              const nftItem: NftItem = {
                creator: nft.contract?.creator || "Unknown",
                tokenId: tokenId.startsWith("0x")
                  ? tokenId.substring(2)
                  : tokenId,
                contractAddress,
                name: nft.metadata?.name || nft.title || `NFT #${tokenId}`,
                symbol: collection.symbol || "NFT",
                tokenURI: nft.tokenUri?.raw || "",
                metadata: nft.metadata || null,
                owner: nft.owner || "Unknown",
                price,
                isListed,
                imageUrl,
                collection,
                image: imageUrl,
              };

              // Filter by name or token ID
              const nameMatch = nftItem.name.toLowerCase().includes(query);
              const tokenIdMatch = parseInt(nftItem.tokenId, 16)
                .toString()
                .includes(query);
              return nameMatch || tokenIdMatch ? nftItem : null;
            })
          );

          allNfts.push(...(collectionNfts.filter(Boolean) as NftItem[]));
        })
      );

      const startIndex = (pageNumber - 1) * pageSize;
      const paginatedNfts = allNfts.slice(startIndex, startIndex + pageSize);

      return {
        nfts: paginatedNfts,
        totalCount: allNfts.length,
      };
    } else {
      // Default mode: Fetch NFTs from popular collections
      const collections = await fetchNftCollections(network, 1, 1000);
      const allNfts: NftItem[] = [];
      const perCollectionLimit = 50;

      await Promise.all(
        collections.map(async (collection) => {
          try {
            const endpoint = `${
              NETWORK_URLS[network as keyof typeof NETWORK_URLS]
            }/getNFTsForCollection?contractAddress=${
              collection.address
            }&withMetadata=true&limit=${perCollectionLimit}`;
            const response = await fetch(endpoint);
            if (!response.ok)
              throw new Error(`Alchemy API error: ${response.statusText}`);
            const data = await response.json();

            if (!data.nfts || !Array.isArray(data.nfts)) return;

            const collectionNfts = await Promise.all(
              data.nfts.map(async (nft: any) => {
                const tokenId = nft.id.tokenId;
                const contractAddress = collection.address;

                let price = "0";
                let isListed = false;
                try {
                  const listing = await marketplace.getListing(
                    contractAddress,
                    tokenId
                  );
                  isListed = listing.active;
                  price = formatEther(listing.price);
                } catch (error) {
                  isListed = false;
                }

                const imageUrl = normalizeIpfsUrl(
                  nft.metadata?.image || nft.media?.[0]?.gateway || ""
                );

                return {
                  creator: nft.contract?.creator || "Unknown",
                  tokenId: tokenId.startsWith("0x")
                    ? tokenId.substring(2)
                    : tokenId,
                  contractAddress,
                  name: nft.metadata?.name || nft.title || `NFT #${tokenId}`,
                  symbol: collection.symbol || "NFT",
                  tokenURI: nft.tokenUri?.raw || "",
                  metadata: nft.metadata || null,
                  owner: nft.owner || "Unknown",
                  price,
                  isListed,
                  imageUrl,
                  collection,
                  image: imageUrl,
                };
              })
            );

            allNfts.push(...(collectionNfts.filter(Boolean) as NftItem[]));
          } catch (error) {
            console.error(
              `Error processing collection ${collection.address}:`,
              error
            );
          }
        })
      );

      let totalCount = 0;
      for (const collection of collections) {
        totalCount += parseInt(collection.totalSupply || "0");
      }

      const startIndex = (pageNumber - 1) * pageSize;
      const paginatedNfts = allNfts.slice(startIndex, startIndex + pageSize);

      return {
        nfts: paginatedNfts,
        totalCount,
      };
    }
  } catch (err) {
    console.error("Error fetching all network NFTs:", err);
    return { nfts: [], totalCount: 0 };
  }
};

/**
 * Upload file to Pinata
 */
async function uploadToPinata(file: File): Promise<string> {
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_API_SECRET,
    },
  });

  const responseData = response.data as { IpfsHash: string };
  if (responseData.IpfsHash) {
    const responseData = response.data as { IpfsHash: string };
    return `ipfs://${responseData.IpfsHash}`;
  } else {
    throw new Error("Failed to upload file to Pinata");
  }
}

/**
 * Upload metadata to Pinata
 */
async function uploadMetadataToPinata(metadata: {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}): Promise<string> {
  const url = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

  const response = await axios.post(url, metadata, {
    headers: {
      "Content-Type": "application/json",
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_API_SECRET,
    },
  });

  const responseData = response.data as { IpfsHash: string };
  if (responseData.IpfsHash) {
    const responseData = response.data as { IpfsHash: string };
    return `ipfs://${responseData.IpfsHash}`;
  } else {
    throw new Error("Failed to upload metadata to Pinata");
  }
}

/**
 * Mint a new NFT with image and metadata
 */
export const mintNFT = async (
  image: File,
  metadata: {
    name: string;
    description: string;
    attributes?: Array<{ trait_type: string; value: string }>;
  },
  signer: Signer,
  network: string,
  listPrice?: string
): Promise<{ tokenId: string; success: boolean; txHash?: string }> => {
  try {
    const marketplace = getMarketplaceContract(network, signer);
    const signerAddress = await signer.getAddress();
    const marketplaceAddress = MARKETPLACE_ADDRESSES[network as keyof typeof MARKETPLACE_ADDRESSES];

    const imageUrl = await uploadToPinata(image);
    const fullMetadata = { name: metadata.name, description: metadata.description, image: imageUrl, attributes: metadata.attributes || [] };
    const tokenURI = await uploadMetadataToPinata(fullMetadata);

    const tx = await marketplace.mintNFT(signerAddress, tokenURI);
    const receipt = await tx.wait();
    const nftMintedEvent = receipt.logs.find(
      (log: any) => log.topics[0] === ethers.id("NFTMinted(uint256,address,string)")
    );
    if (!nftMintedEvent) throw new Error("NFTMinted event not found");
    const tokenId = BigInt(nftMintedEvent.topics[1]).toString();

    let listTxHash: string | undefined;
    if (listPrice && parseFloat(listPrice) > 0) {
      const priceInWei = parseEther(listPrice);

      const approvedAddress = await marketplace.getApproved(tokenId);
      if (approvedAddress.toLowerCase() !== marketplaceAddress.toLowerCase()) {
        const approveTx = await marketplace.approve(marketplaceAddress, tokenId);
        await approveTx.wait();
      }

      const listTx = await marketplace.listItem(tokenId, priceInWei);
      const listReceipt = await listTx.wait();
      listTxHash = listTx.hash;

      // Verify listing
      const listing = await marketplace.getListing(tokenId);
      if (!listing.active) {
        throw new Error("Failed to list NFT after minting");
      }
    }

    return { tokenId, success: true, txHash: listTxHash || tx.hash };
  } catch (err) {
    console.error("Error minting and listing NFT:", err);
    return { tokenId: "0", success: false };
  }
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
  fetchAllNetworkNfts,
  uploadToPinata,
  uploadMetadataToPinata,
  mintNFT,
};
