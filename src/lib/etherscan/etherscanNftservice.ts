// lib/etherscan/etherscanNftService.ts
import { ETHERSCAN_API_KEY, getApiUrlForNetwork } from './etherscanService';

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
}

export interface NftCollection {
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
    // Fetch ERC-721 tokens (NFTs) owned by the address
    const nftUrl = `${getApiUrlForNetwork(network)}?module=account&action=tokennfttx&address=${address}&page=1&offset=100&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
    const nftResponse = await fetch(nftUrl);
    const nftData = await nftResponse.json();

    if (nftData.status !== "1" && !nftData.result) {
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
    const nfts: NftItem[] = await Promise.all(
      Array.from(nftMap.values()).map(async (tx) => {
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
                const metadataResponse = await fetch(tokenURI);
                metadata = await metadataResponse.json();
              } catch (e) {
                console.warn(`Failed to fetch metadata for ${tokenURI}:`, e);
              }
            }
          } catch (e) {
            console.warn('Failed to decode token URI:', e);
          }
        }
        
        // Mock listing data (in a real app, this would come from your marketplace contract)
        const mockPrice = (Math.random() * 0.2 + 0.01).toFixed(4);
        const isListed = Math.random() > 0.5;

        return {
          tokenId: tx.tokenID,
          contractAddress: tx.contractAddress,
          name: tx.tokenName || 'Unknown NFT',
          symbol: tx.tokenSymbol || 'NFT',
          tokenURI,
          metadata,
          owner: address,
          price: mockPrice,
          isListed
        };
      })
    );

    return nfts;
  } catch (err) {
    console.error('Error fetching NFTs from Etherscan:', err);
    return [];
  }
};

// Get listed NFTs on the marketplace - modified to fetch real data
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
      // Get recently transferred NFTs in this collection
      // This simulates "listed" NFTs since we don't have direct access to marketplace data
      const recentTxUrl = `${getApiUrlForNetwork(network)}?module=account&action=tokennfttx&address=${collection.address}&page=1&offset=${perCollectionLimit}&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
      const recentTxResponse = await fetch(recentTxUrl);
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
          const nftDetails = await fetchNftDetails(tx.contractAddress, tx.tokenID, network);
          if (nftDetails) {
            // For demonstration, we'll set isListed to true for all these NFTs
            // In a real app, you would check your marketplace contract
            return {
              ...nftDetails,
              isListed: true,
              // Generate a somewhat realistic price (this would come from your marketplace contract)
              price: (Math.random() * 0.5 + 0.05).toFixed(4)
            };
          }
          return null;
        })
      );
      
      // Add non-null NFTs to the result array
      allNfts.push(...collectionNfts.filter(Boolean) as NftItem[]);
    }));
    
    // Limit the number of returned NFTs
    return allNfts.slice(0, limit);
  } catch (err) {
    console.error('Error fetching listed NFTs:', err);
    return [];
  }
};

// Get details for a specific NFT
export const fetchNftDetails = async (
  contractAddress: string,
  tokenId: string,
  network: string = 'mainnet'
): Promise<NftItem | null> => {
  try {
    // Get owner of token
    const ownerUrl = `${getApiUrlForNetwork(network)}?module=proxy&action=eth_call&to=${contractAddress}&data=0x6352211e${padTokenId(tokenId)}&apikey=${ETHERSCAN_API_KEY}`;
    const ownerResponse = await fetch(ownerUrl);
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
            const metadataResponse = await fetch(tokenURI);
            metadata = await metadataResponse.json();
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
    
    let name = 'Unknown NFT';
    let symbol = 'NFT';
    
    if (nameData.result && nameData.result !== '0x') {
      try {
        name = decodeURIComponent(
          nameData.result.slice(2).replace(/[0-9a-f]{2}/g, '%$&')
        ).replace(/\0/g, '');
      } catch (e) {
        console.warn('Failed to decode token name:', e);
      }
    }
    
    if (symbolData.result && symbolData.result !== '0x') {
      try {
        symbol = decodeURIComponent(
          symbolData.result.slice(2).replace(/[0-9a-f]{2}/g, '%$&')
        ).replace(/\0/g, '');
      } catch (e) {
        console.warn('Failed to decode token symbol:', e);
      }
    }
    
    // Mock listing price (in a real app, this would come from your marketplace contract)
    const price = (Math.random() * 0.2 + 0.01).toFixed(4);
    const isListed = Math.random() > 0.5;
    
    return {
      tokenId,
      contractAddress,
      name,
      symbol,
      tokenURI,
      metadata,
      owner,
      price,
      isListed
    };
  } catch (err) {
    console.error('Error fetching NFT details:', err);
    return null;
  }
};

// Get real NFT collections instead of mock data
export const fetchNftCollections = async (
  network: string = 'mainnet',
  limit: number = 5
): Promise<NftCollection[]> => {
  try {
    // For now, we'll use a list of known popular collections
    // In a real implementation, you might have a database of collections or use an API
    const popularCollections: { [network: string]: Array<{ address: string }> } = {
      'mainnet': [
        { address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d' }, // BAYC
        { address: '0x60e4d786628fea6478f785a6d7e704777c86a7c6' }, // MAYC
        { address: '0xed5af388653567af2f388e6224dc7c4b3241c544' }, // Azuki
        { address: '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e' }, // Doodles
        { address: '0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b' }  // Clone X
      ],
      'sepolia': [
        // Add some known Sepolia NFT collections here if available
        // For testing, if you have deployed your own NFT contract on Sepolia, add it here
        { address: '0x5180db8f5c931aae63c74266b211f580155ecac8' }, // Example - replace with real Sepolia contracts
        { address: '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e' }, // Example - replace with real Sepolia contracts
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
          // Get collection name
          const nameUrl = `${getApiUrlForNetwork(network)}?module=proxy&action=eth_call&to=${collection.address}&data=0x06fdde03&apikey=${ETHERSCAN_API_KEY}`;
          
          // Get collection symbol
          const symbolUrl = `${getApiUrlForNetwork(network)}?module=proxy&action=eth_call&to=${collection.address}&data=0x95d89b41&apikey=${ETHERSCAN_API_KEY}`;
          
          // Get total supply (if ERC721Enumerable)
          const supplyUrl = `${getApiUrlForNetwork(network)}?module=proxy&action=eth_call&to=${collection.address}&data=0x18160ddd&apikey=${ETHERSCAN_API_KEY}`;
          
          const [nameResponse, symbolResponse, supplyResponse] = await Promise.all([
            fetch(nameUrl),
            fetch(symbolUrl),
            fetch(supplyUrl)
          ]);
          
          const [nameData, symbolData, supplyData] = await Promise.all([
            nameResponse.json(),
            symbolResponse.json(),
            supplyResponse.json()
          ]);
          
          let name = 'Unknown Collection';
          let symbol = 'NFT';
          let totalSupply = '0';
          
          if (nameData.result && nameData.result !== '0x') {
            try {
              name = decodeURIComponent(
                nameData.result.slice(2).replace(/[0-9a-f]{2}/g, '%$&')
              ).replace(/\0/g, '');
            } catch (e) {
              console.warn('Failed to decode collection name:', e);
            }
          }
          
          if (symbolData.result && symbolData.result !== '0x') {
            try {
              symbol = decodeURIComponent(
                symbolData.result.slice(2).replace(/[0-9a-f]{2}/g, '%$&')
              ).replace(/\0/g, '');
            } catch (e) {
              console.warn('Failed to decode collection symbol:', e);
            }
          }
          
          if (supplyData.result && supplyData.result !== '0x') {
            try {
              totalSupply = parseInt(supplyData.result, 16).toString();
            } catch (e) {
              console.warn('Failed to decode total supply:', e);
              totalSupply = '???';
            }
          }
          
          // For collection image and description, we'll try to fetch a token from the collection
          // and use its metadata (a better approach would be to use a database or API)
          let imageUrl = `/api/placeholder/400/400`;
          let description = `${name} is an NFT collection on Ethereum.`;
          
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
            address: collection.address,
            name,
            symbol,
            totalSupply,
            imageUrl,
            description
          };
        } catch (err) {
          console.error(`Error fetching collection details for ${collection.address}:`, err);
          // Return a default collection object if we fail to get details
          return {
            address: collection.address,
            name: 'Unknown Collection',
            symbol: 'NFT',
            totalSupply: '???',
            imageUrl: `/api/placeholder/400/400`,
            description: 'An NFT collection on Ethereum.'
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
  // Convert to hex if it's a decimal number
  let hexTokenId = BigInt(tokenId).toString(16);
  // Pad to 64 characters
  while (hexTokenId.length < 64) {
    hexTokenId = '0' + hexTokenId;
  }
  return hexTokenId;
}

// NFT purchase function (in a real app, this would interact with a smart contract)
export const purchaseNft = async (
  contractAddress: string,
  tokenId: string,
  price: string,
  buyerAddress: string,
  network: string = 'sepolia'
): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
  try {
    // In a real implementation, we would call the marketplace smart contract
    // For demo purposes, we'll simulate a successful purchase
    
    // Mock successful transaction hash
    const transactionHash = `0x${Array.from({length: 64}, () => 
      Math.floor(Math.random() * 16).toString(16)).join('')}`;
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      transactionHash
    };
  } catch (err) {
    console.error('Error purchasing NFT:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred'
    };
  }
};