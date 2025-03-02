// New file: lib/etherscan/etherscanTransactionService.ts
import { Transaction } from '../neo4j/types'; // Reusing your existing Transaction type
import { ETHERSCAN_API_KEY, getApiUrlForNetwork } from './etherscanService';

// Function to convert etherscan transactions to your app's Transaction format
export const fetchEtherscanTransactions = async (
  page: number = 1,
  pageSize: number = 10,
  address?: string,
  network: string = 'mainnet'
): Promise<Transaction[]> => {
  try {
    // Default query gets transactions for the entire network
    let url = `${getApiUrlForNetwork(network)}?module=proxy&action=eth_getBlockByNumber&tag=latest&boolean=true&apikey=${ETHERSCAN_API_KEY}`;
    
    // If address is provided, get transactions for that specific address
    if (address) {
      url = `${getApiUrlForNetwork(network)}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=${page}&offset=${pageSize}&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "1" && !data.result) {
      throw new Error(data.message || "Error fetching transactions");
    }

    // If we're getting data for a specific address
    if (address) {
      return data.result.map((tx: any) => ({
        hash: tx.hash,
        fromAddress: tx.from,
        toAddress: tx.to,
        value: tx.value,
        gas: tx.gas,
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        blockNumber: parseInt(tx.blockNumber, 16) || tx.blockNumber,
        timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
      }));
    } 
    // If we're getting general network transactions
    else {
      // Extract transactions from the latest block
      const transactions = data.result.transactions || [];
      
      return transactions.slice(0, pageSize).map((tx: any) => ({
        hash: tx.hash,
        fromAddress: tx.from,
        toAddress: tx.to,
        value: tx.value,
        gas: tx.gas,
        gasUsed: '0', // Block data doesn't include gasUsed, would need another call
        gasPrice: tx.gasPrice,
        blockNumber: parseInt(data.result.number, 16),
        timestamp: new Date(parseInt(data.result.timestamp, 16) * 1000).toISOString(),
      }));
    }
  } catch (err) {
    console.error('Error fetching transactions from Etherscan:', err);
    throw err;
  }
};

// Get total number of transactions (for pagination)
export const getTransactionCount = async (
  address?: string,
  network: string = 'mainnet'
): Promise<number> => {
  try {
    if (!address) {
      // Without a specific address, we can't get a meaningful count
      // Just return a high number to allow pagination
      return 1000;
    }
    
    const url = `${getApiUrlForNetwork(network)}?module=proxy&action=eth_getTransactionCount&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data.result) {
      throw new Error(data.message || "Error fetching transaction count");
    }

    return parseInt(data.result, 16);
  } catch (err) {
    console.error('Error fetching transaction count:', err);
    return 0;
  }
};