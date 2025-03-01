import { ethers } from "ethers";

// Define interfaces for typed responses
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string; // value in Ether (as string)
  timestamp: number;
  status: "success" | "error";
}

export interface WalletData {
  balance: string; // in Ether
  transactions: Transaction[];
}

// Replace with your actual Etherscan API key or use an environment variable
export const ETHERSCAN_API_KEY = import.meta.env.ETHERSCAN_API_KEY || "K7JPT55R9Q5V3INJZXI7432KGHZ19878ST";

// Etherscan API URLs for different networks
const MAINNET_API_URL = "https://api.etherscan.io/api";
const SEPOLIA_API_URL = "https://api-sepolia.etherscan.io/api";

export const getApiUrlForNetwork = (network: string): string => {
  switch (network) {
    case "sepolia":
      return SEPOLIA_API_URL;
    case "mainnet":
    default:
      return MAINNET_API_URL;
  }
};

/**
 * Fetches the wallet balance in Ether.
 * @param address The Ethereum address.
 * @param network The network ("mainnet" or "sepolia").
 * @returns A promise that resolves to the balance in Ether.
 */
export async function getWalletBalance(
  address: string,
  network: string = "mainnet"
): Promise<string> {
  const url = `${getApiUrlForNetwork(network)}?module=account&action=balance&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== "1") {
    throw new Error(data.message || "Error fetching balance");
  }

  // Convert balance from Wei to Ether
  return ethers.formatEther(data.result);
}

/**
 * Fetches the recent transactions for a wallet.
 * @param address The Ethereum address.
 * @param network The network ("mainnet" or "sepolia").
 * @returns A promise that resolves to an array of transactions.
 */
export async function getWalletTransactions(
  address: string,
  network: string = "mainnet"
): Promise<Transaction[]> {
  const url = `${getApiUrlForNetwork(network)}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== "1") {
    throw new Error(data.message || "Error fetching transactions");
  }

  // Map the response to our Transaction interface
  return data.result.map((tx: any) => ({
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: ethers.formatEther(tx.value),
    timestamp: parseInt(tx.timeStamp) * 1000,
    status: tx.isError === "0" ? "success" : "error",
  }));
}

/**
 * Fetches both the wallet balance and recent transactions.
 * @param address The Ethereum address.
 * @param network The network ("mainnet" or "sepolia").
 * @returns A promise that resolves to a WalletData object.
 */
export async function getWalletData(
  address: string,
  network: string = "mainnet"
): Promise<WalletData> {
  const [balance, transactions] = await Promise.all([
    getWalletBalance(address, network),
    getWalletTransactions(address, network),
  ]);

  return { balance, transactions };
}
