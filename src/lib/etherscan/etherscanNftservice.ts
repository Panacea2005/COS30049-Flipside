// lib/etherscan/etherscanNftService.ts
import { Key, ReactNode } from 'react';
import { ETHERSCAN_API_KEY, getApiUrlForNetwork } from './etherscanService';

export interface NftItem {
  collection: any;
  imageUrl: any;
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
}

export interface NftCollection {
  itemCount: ReactNode;
  bannerUrl: any;
  id: Key | null | undefined;
  address: string;
  name: string;
  symbol: string;
  totalSupply: string;
  imageUrl: string;
  description: string;
}

// Get all NFTs owned by an address
export const fetchUserNfts = async (
  address: string,
  network: string = 'mainnet'
): Promise<NftItem[]> => {
  try {
    if (!address) {
      console.warn("No address provided to fetchUserNfts");
      return [];
    }

    // Fetch ERC-721 tokens (NFTs) owned by the address
    const nftUrl = `${getApiUrlForNetwork(network)}?module=account&action=tokennfttx&address=${address}&page=1&offset=100&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
    const nftResponse = await fetch(nftUrl);
    
    if (!nftResponse.ok) {
      throw new Error(`Etherscan API error: ${nftResponse.statusText}`);
    }
    
    const nftData = await nftResponse.json();

    if (nftData.status !== "1" || !nftData.result) {
      console.warn("No NFT data found or error:", nftData.message);
      return [];
    }

    // Process and deduplicate NFTs (keep only tokens still owned by the address)
    const nftMap = new Map<string, any>();
    
    for (const tx of nftData.result) {
      const key = `${tx.contractAddress}-${tx.tokenID}`;
      
      // If the transaction is sending TO this address, they received the NFT
      if (tx.to.toLowerCase() === address.toLowerCase()) {
        nftMap.set(key, tx);
      } 
      // If the transaction is FROM this address, they sent the NFT away
      else if (tx.from.toLowerCase() === address.toLowerCase()) {
        nftMap.delete(key);
      }
    }

    // Fetch additional details for each NFT
    const nfts: NftItem[] = (await Promise.all(
      Array.from(nftMap.values()).map(async (tx) => {
        try {
          // Get token metadata URI from contract
          const tokenURIUrl = `${getApiUrlForNetwork(network)}?module=proxy&action=eth_call&to=${tx.contractAddress}&data=0x0e89341c${padTokenId(tx.tokenID)}&apikey=${ETHERSCAN_API_KEY}`;
          const tokenURIResponse = await fetch(tokenURIUrl);
          const tokenURIData = await tokenURIResponse.json();
          
          let tokenURI = '';
          let metadata = null;
          
          if (tokenURIData.result && tokenURIData.result !== '0x') {
            // Decode the result (remove 0x prefix and convert hex to string)
            try {
              const decoded = decodeURIComponent(
                tokenURIData.result.slice(2).replace(/[0-9a-f]{2}/g, '%$&')
              ).replace(/\0/g, '');
              
              tokenURI = decoded.replace(/^.*?(https?:\/\/[^"]*|ipfs:\/\/[^"]*).*$/s, '$1');
              
              // If it's an IPFS URI, use a gateway
              if (tokenURI.startsWith('ipfs://')) {
                tokenURI = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
              }
              
              // Fetch metadata if we have a valid URI
              if (tokenURI) {
                try {
                  const metadataResponse = await fetch(tokenURI, { 
                    headers: { Accept: 'application/json' },
                  });
                  if (metadataResponse.ok) {
                    metadata = await metadataResponse.json();
                  }
                } catch (e) {
                  console.warn(`Failed to fetch metadata for ${tokenURI}:`, e);
                }
              }
            } catch (e) {
              console.warn('Failed to decode token URI:', e);
            }
          }
          
          // Generate realistic listing data - in a real app, you would fetch this from your marketplace contract
          const mockPrice = (Math.random() * 0.2 + 0.01).toFixed(4);
          const isListed = Math.random() > 0.7; // Make most NFTs not listed by default

          return {
            tokenId: tx.tokenID,
            contractAddress: tx.contractAddress,
            name: metadata?.name || tx.tokenName || 'Unknown NFT',
            symbol: tx.tokenSymbol || 'NFT',
            tokenURI,
            metadata,
            owner: address,
            price: mockPrice,
            isListed
          };
        } catch (error) {
          console.error(`Error processing NFT ${tx.contractAddress}-${tx.tokenID}:`, error);
          return null;
        }
      })
    )).filter((nft): nft is NftItem => nft !== null);

    // Filter out any null values from errors
    return nfts.filter(Boolean) as NftItem[];
  } catch (err) {
    console.error('Error fetching NFTs from Etherscan:', err);
    return [];
  }
};

// Get listed NFTs on the marketplace with better error handling and caching
export const fetchListedNfts = async (
  network: string = 'mainnet',
  limit: number = 20
): Promise<NftItem[]> => {
  try {
    // Get popular NFT collections first
    const collections = await fetchNftCollections(network);
    if (!collections.length) {
      throw new Error('No collections found');
    }
    
    const allNfts: NftItem[] = [];
    
    // For each collection, fetch some NFTs
    const perCollectionLimit = Math.ceil(limit / collections.length);
    
    await Promise.all(collections.map(async (collection) => {
      try {
        // Get recently transferred NFTs in this collection
        const recentTxUrl = `${getApiUrlForNetwork(network)}?module=account&action=tokennfttx&address=${collection.address}&page=1&offset=${perCollectionLimit}&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
        const recentTxResponse = await fetch(recentTxUrl);
        
        if (!recentTxResponse.ok) {
          throw new Error(`Etherscan API error: ${recentTxResponse.statusText}`);
        }
        
        const recentTxData = await recentTxResponse.json();
        
        if (recentTxData.status !== "1" || !recentTxData.result || !recentTxData.result.length) {
          return;
        }
        
        // Get unique tokenIDs from recent transactions
        const uniqueTokens = new Map();
        for (const tx of recentTxData.result) {
          if (!uniqueTokens.has(tx.tokenID)) {
            uniqueTokens.set(tx.tokenID, tx);
            if (uniqueTokens.size >= perCollectionLimit) break;
          }
        }
        
        // Fetch details for each token
        const collectionNfts = await Promise.all(
          Array.from(uniqueTokens.values()).map(async (tx) => {
            try {
              const nftDetails = await fetchNftDetails(tx.contractAddress, tx.tokenID, network);
              if (nftDetails) {
                // For demonstration, we'll set isListed to true for all these NFTs
                // In a real app, you would check your marketplace contract
                return {
                  ...nftDetails,
                  isListed: true,
                  // Generate a somewhat realistic price
                  price: (Math.random() * 0.5 + 0.05).toFixed(4)
                };
              }
              return null;
            } catch (error) {
              console.error(`Error fetching NFT details for ${tx.contractAddress}-${tx.tokenID}:`, error);
              return null;
            }
          })
        );
        
        // Add non-null NFTs to the result array
        allNfts.push(...collectionNfts.filter(Boolean) as NftItem[]);
      } catch (error) {
        console.error(`Error processing collection ${collection.address}:`, error);
      }
    }));
    
    // Limit the number of returned NFTs
    return allNfts.slice(0, limit);
  } catch (err) {
    console.error('Error fetching listed NFTs:', err);
    return [];
  }
};

// Get details for a specific NFT with improved error handling
export const fetchNftDetails = async (
  contractAddress: string,
  tokenId: string,
  network: string = 'mainnet'
): Promise<NftItem | null> => {
  try {
    if (!contractAddress || !tokenId) {
      throw new Error('Contract address and tokenId are required');
    }

    // Get owner of token
    const ownerUrl = `${getApiUrlForNetwork(network)}?module=proxy&action=eth_call&to=${contractAddress}&data=0x6352211e${padTokenId(tokenId)}&apikey=${ETHERSCAN_API_KEY}`;
    const ownerResponse = await fetch(ownerUrl);
    
    if (!ownerResponse.ok) {
      throw new Error(`Etherscan API error: ${ownerResponse.statusText}`);
    }
    
    const ownerData = await ownerResponse.json();
    
    let owner = 'Unknown';
    if (ownerData.result && ownerData.result !== '0x') {
      owner = '0x' + ownerData.result.slice(-40);
    }
    
    // Get token URI
    const tokenURIUrl = `${getApiUrlForNetwork(network)}?module=proxy&action=eth_call&to=${contractAddress}&data=0x0e89341c${padTokenId(tokenId)}&apikey=${ETHERSCAN_API_KEY}`;
    const tokenURIResponse = await fetch(tokenURIUrl);
    const tokenURIData = await tokenURIResponse.json();
    
    let tokenURI = '';
    let metadata = null;
    
    if (tokenURIData.result && tokenURIData.result !== '0x') {
      try {
        const decoded = decodeURIComponent(
          tokenURIData.result.slice(2).replace(/[0-9a-f]{2}/g, '%$&')
        ).replace(/\0/g, '');
        
        tokenURI = decoded.replace(/^.*?(https?:\/\/[^"]*|ipfs:\/\/[^"]*).*$/s, '$1');
        
        // If it's an IPFS URI, use a gateway
        if (tokenURI.startsWith('ipfs://')) {
          tokenURI = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
        }
        
        // Fetch metadata if we have a valid URI
        if (tokenURI) {
          try {
            const metadataResponse = await fetch(tokenURI, { 
              headers: { Accept: 'application/json' },
            });
            if (metadataResponse.ok) {
              metadata = await metadataResponse.json();
            }
          } catch (e) {
            console.warn(`Failed to fetch metadata for ${tokenURI}:`, e);
          }
        }
      } catch (e) {
        console.warn('Failed to decode token URI:', e);
      }
    }
    
    // Get token name and symbol
    const tokenNameUrl = `${getApiUrlForNetwork(network)}?module=proxy&action=eth_call&to=${contractAddress}&data=0x06fdde03&apikey=${ETHERSCAN_API_KEY}`;
    const tokenSymbolUrl = `${getApiUrlForNetwork(network)}?module=proxy&action=eth_call&to=${contractAddress}&data=0x95d89b41&apikey=${ETHERSCAN_API_KEY}`;
    
    const [nameResponse, symbolResponse] = await Promise.all([
      fetch(tokenNameUrl),
      fetch(tokenSymbolUrl)
    ]);
    
    const [nameData, symbolData] = await Promise.all([
      nameResponse.json(),
      symbolResponse.json()
    ]);
    
    let name = metadata?.name || 'Unknown NFT';
    let symbol = 'NFT';
    
    if (nameData.result && nameData.result !== '0x') {
      try {
        const decodedName = decodeURIComponent(
          nameData.result.slice(2).replace(/[0-9a-f]{2}/g, '%$&')
        ).replace(/\0/g, '');
        
        if (decodedName) {
          name = decodedName;
        }
      } catch (e) {
        console.warn('Failed to decode token name:', e);
      }
    }
    
    if (symbolData.result && symbolData.result !== '0x') {
      try {
        const decodedSymbol = decodeURIComponent(
          symbolData.result.slice(2).replace(/[0-9a-f]{2}/g, '%$&')
        ).replace(/\0/g, '');
        
        if (decodedSymbol) {
          symbol = decodedSymbol;
        }
      } catch (e) {
        console.warn('Failed to decode token symbol:', e);
      }
    }
    
    // Generate realistic price (in a real app, this would come from your marketplace contract)
    const price = (Math.random() * 0.2 + 0.01).toFixed(4);
    const isListed = Math.random() > 0.7;
    
    return {
      tokenId,
      contractAddress,
      name,
      symbol,
      tokenURI,
      metadata,
      owner,
      price,
      isListed,
      collection: null, // Add appropriate collection data here
      imageUrl: metadata?.image || '' // Use metadata image or an empty string
    };
  } catch (err) {
    console.error('Error fetching NFT details:', err);
    return null;
  }
};

// Improved collection fetching with better caching and error handling
export const fetchNftCollections = async (
  network: string = 'mainnet',
  limit: number = 5
): Promise<NftCollection[]> => {
  try {
    // Popular collections with verified contracts
    const popularCollections: { [network: string]: Array<{ address: string, name: string, symbol: string }> } = {
      'mainnet': [
        { address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d', name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
        { address: '0x60e4d786628fea6478f785a6d7e704777c86a7c6', name: 'Mutant Ape Yacht Club', symbol: 'MAYC' },
        { address: '0xed5af388653567af2f388e6224dc7c4b3241c544', name: 'Azuki', symbol: 'AZUKI' },
        { address: '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e', name: 'Doodles', symbol: 'DOODLE' },
        { address: '0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b', name: 'Clone X', symbol: 'CLONEX' }
      ],
      'sepolia': [
        // For Sepolia testnet, you might want to deploy your own test NFT collections
        // These are just placeholder values
        { address: '0x5180db8f5c931aae63c74266b211f580155ecac8', name: 'Test Collection 1', symbol: 'TEST1' },
        { address: '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e', name: 'Test Collection 2', symbol: 'TEST2' },
      ]
    };
    
    // Get collections for the selected network or default to mainnet
    const networkCollections = popularCollections[network] || popularCollections['mainnet'];
    
    // Limit the number of collections
    const selectedCollections = networkCollections.slice(0, limit);
    
    // Fetch details for each collection
    const collections: NftCollection[] = await Promise.all(
      selectedCollections.map(async (collection) => {
        try {
          // Get total supply (if ERC721Enumerable)
          const supplyUrl = `${getApiUrlForNetwork(network)}?module=proxy&action=eth_call&to=${collection.address}&data=0x18160ddd&apikey=${ETHERSCAN_API_KEY}`;
          const supplyResponse = await fetch(supplyUrl);
          const supplyData = await supplyResponse.json();
          
          let totalSupply = '0';
          
          if (supplyData.result && supplyData.result !== '0x') {
            try {
              totalSupply = parseInt(supplyData.result, 16).toString();
            } catch (e) {
              console.warn('Failed to decode total supply:', e);
              totalSupply = '???';
            }
          }
          
          // Try to get collection image and description from a token
          let imageUrl = `/api/placeholder/400/400`;
          let description = `${collection.name} is an NFT collection on Ethereum.`;
          
          // Try to get metadata from a token in the collection
          try {
            // Get a recent transaction to find a token ID
            const txUrl = `${getApiUrlForNetwork(network)}?module=account&action=tokennfttx&address=${collection.address}&page=1&offset=1&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
            const txResponse = await fetch(txUrl);
            const txData = await txResponse.json();
            
            if (txData.status === "1" && txData.result && txData.result.length > 0) {
              const tokenId = txData.result[0].tokenID;
              
              // Get token metadata
              const nftDetails = await fetchNftDetails(collection.address, tokenId, network);
              
              if (nftDetails && nftDetails.metadata) {
                // Use collection image from the token metadata if available
                if (nftDetails.metadata.image) {
                  imageUrl = nftDetails.metadata.image;
                  
                  // Fix for IPFS URLs
                  if (imageUrl.startsWith('ipfs://')) {
                    imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
                  }
                }
                
                // Use description from token metadata if available
                if (nftDetails.metadata.description) {
                  description = nftDetails.metadata.description;
                }
              }
            }
          } catch (e) {
            console.warn('Failed to get collection metadata from token:', e);
          }
          
          return {
            id: collection.address, // or any unique identifier
            address: collection.address,
            name: collection.name,
            symbol: collection.symbol,
            totalSupply,
            imageUrl,
            description,
            itemCount: 0, // Placeholder value, replace with actual item count if available
            bannerUrl: '' // Placeholder value, replace with actual banner URL if available
          };
        } catch (err) {
          console.error(`Error fetching collection details for ${collection.address}:`, err);
          // Return a default collection object if we fail to get details
          return {
            id: collection.address,
            address: collection.address,
            name: collection.name || 'Unknown Collection',
            symbol: collection.symbol || 'NFT',
            totalSupply: '???',
            imageUrl: `/api/placeholder/400/400`,
            description: 'An NFT collection on Ethereum.',
            itemCount: 0,
            bannerUrl: ''
          };
        }
      })
    );
    
    return collections;
  } catch (err) {
    console.error('Error fetching NFT collections:', err);
    return [];
  }
};

// Helper function to pad token ID to 64 chars for Etherscan API calls
function padTokenId(tokenId: string): string {
  try {
    // Convert to hex if it's a decimal number
    let hexTokenId = BigInt(tokenId).toString(16);
    // Pad to 64 characters
    while (hexTokenId.length < 64) {
      hexTokenId = '0' + hexTokenId;
    }
    return hexTokenId;
  } catch (error) {
    console.error(`Error padding token ID ${tokenId}:`, error);
    // Return a safe fallback
    return '0'.repeat(64);
  }
}

// NFT purchase function that would connect to your marketplace smart contract
export const purchaseNft = async (
  contractAddress: string,
  tokenId: string,
  price: string,
  buyerAddress: string,
  network: string = 'sepolia'
): Promise<{
  txHash: string; success: boolean; transactionHash?: string; error?: string 
}> => {
  try {
    if (!contractAddress || !tokenId || !price || !buyerAddress) {
      throw new Error('Missing required parameters for purchase');
    }
    
    console.log(`Purchasing NFT ${contractAddress}:${tokenId} for ${price} ETH from address ${buyerAddress} on ${network}`);
    
    // In a real implementation, you would:
    // 1. Connect to web3 provider (MetaMask)
    // 2. Get the marketplace contract
    // 3. Call the buy function with the required parameters
    // 4. Wait for transaction confirmation
    
    // For demo purposes, we'll simulate a successful purchase
    const transactionHash = `0x${Array.from({length: 64}, () => 
      Math.floor(Math.random() * 16).toString(16)).join('')}`;
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      txHash: transactionHash,
      success: true,
      transactionHash
    };
  } catch (err) {
    console.error('Error purchasing NFT:', err);
    return {
      txHash: '',
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred'
    };
  }
};

// Add a function to check if user has MetaMask installed
export const checkForMetaMask = (): boolean => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

// Connect to MetaMask wallet
export const connectWallet = async (): Promise<{ success: boolean; address?: string; error?: string }> => {
  try {
    if (!checkForMetaMask()) {
      throw new Error('MetaMask is not installed');
    }
    
    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }
    
    return {
      success: true,
      address: accounts[0]
    };
  } catch (err) {
    console.error('Error connecting to wallet:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred'
    };
  }
};

// Switch network function
export const switchNetwork = async (networkName: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!checkForMetaMask()) {
      throw new Error('MetaMask is not installed');
    }
    
    const networkParams: { [key: string]: any } = {
      'mainnet': {
        chainId: '0x1', // 1 in hex
        chainName: 'Ethereum Mainnet',
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18
        },
        rpcUrls: ['https://mainnet.infura.io/v3/'],
        blockExplorerUrls: ['https://etherscan.io']
      },
      'sepolia': {
        chainId: '0xaa36a7', // 11155111 in hex
        chainName: 'Sepolia Testnet',
        nativeCurrency: {
          name: 'Sepolia Ether',
          symbol: 'ETH',
          decimals: 18
        },
        rpcUrls: ['https://sepolia.infura.io/v3/'],
        blockExplorerUrls: ['https://sepolia.etherscan.io']
      }
    };
    
    const params = networkParams[networkName];
    if (!params) {
      throw new Error(`Network ${networkName} not supported`);
    }
    
    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: params.chainId }]
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [params]
        });
      } else {
        throw switchError;
      }
    }
    
    return { success: true };
  } catch (err) {
    console.error('Error switching network:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred'
    };
  }
};