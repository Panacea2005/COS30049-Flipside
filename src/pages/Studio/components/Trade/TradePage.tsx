import { useState, useEffect } from "react";
import {
  BrowserProvider,
  parseUnits,
  formatUnits,
  Contract,
  isAddress,
} from "ethers";
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  Wallet,
  RefreshCw,
  Search,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Minimal ERC-20 ABI for transfer and balance checking
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function name() external view returns (string)",
];

// Network configurations
const NETWORKS = {
  mainnet: {
    name: "Ethereum Mainnet",
    chainId: 1,
    rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
    blockExplorer: "https://etherscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  sepolia: {
    name: "Sepolia Testnet",
    chainId: 11155111,
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
    blockExplorer: "https://sepolia.etherscan.io",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
};

// Popular tokens with their addresses and decimals
const POPULAR_TOKENS = {
  mainnet: [
    {
      symbol: "ETH",
      address: "NATIVE",
      decimals: 18,
      name: "Ethereum",
      logoURI: "/eth.svg",
    },
    {
      symbol: "USDC",
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      decimals: 6,
      name: "USD Coin",
      logoURI: "usdc.svg",
    },
    {
      symbol: "USDT",
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      decimals: 6,
      name: "Tether USD",
      logoURI: "usdt.svg",
    },
  ],
  sepolia: [
    {
      symbol: "ETH",
      address: "NATIVE",
      decimals: 18,
      name: "Sepolia Ether",
      logoURI: "/eth.svg",
    },
    {
      symbol: "TEST USDC",
      address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      decimals: 6,
      name: "Test USD Coin",
      logoURI: "/usdc.svg",
    },
    {
      symbol: "TEST USDT",
      address: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06",
      decimals: 6,
      name: "Test Tether USD",
      logoURI: "/usdt.svg",
    },
    {
      symbol: "TEST UNI",
      address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      decimals: 6,
      name: "Test Uniswap",
      logoURI: "/uni.svg",
    },
    {
      symbol: "TEST LINK",
      address: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
      decimals: 18,
      name: "Test Chainlink",
      logoURI: "/link.svg",
    },
  ],
};

// Common ERC-20 token addresses to check on Sepolia
const COMMON_SEPOLIA_TOKENS = [
  "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // TEST USDC
];

const TOKEN_ICONS: { [key: string]: string } = {
  NATIVE: "/eth.svg",
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": "/usdc.svg", // Mainnet USDC
  "0xdAC17F958D2ee523a2206206994597C13D831ec7": "/usdt.svg", // Mainnet USDT
  "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238": "/usdc.svg", // Test USDC on Sepolia
  "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06": "/usdt.svg", // Test USDT on Sepolia
  "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984": "/uni.svg", // Test UNI
  "0x779877A7B0D9E8603169DdbD7836e478b4624789": "/link.svg", // Test LINK
};

interface TokenData {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  logoURI: string;
  isNative?: boolean;
}

interface Transaction {
  hash: string;
  to: string;
  amount: string;
  symbol: string;
  status: "pending" | "success" | "error";
  timestamp: number;
  tokenAddress: string;
}

export default function EnhancedTradePage() {
  // State variables
  const [tokenAddress, setTokenAddress] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [network, setNetwork] = useState("sepolia");
  const [loading, setLoading] = useState(false);
  const [scanningTokens, setScanningTokens] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [txStatus, setTxStatus] = useState<
    "pending" | "success" | "error" | null
  >(null);
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState("");
  const [ethBalance, setEthBalance] = useState("");
  const [tokenInfo, setTokenInfo] = useState<TokenData | null>(null);
  const [walletTokens, setWalletTokens] = useState<TokenData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>(
    []
  );
  const [showTokenSelector, setShowTokenSelector] = useState(false);

  // Connect wallet on mount and setup listeners
  useEffect(() => {
    checkIfWalletIsConnected();
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  // Fetch token info when tokenAddress or account changes
  useEffect(() => {
    if (tokenAddress === "NATIVE") {
      fetchNativeTokenInfo();
    } else if (isAddress(tokenAddress) && connected && account) {
      fetchTokenInfo(tokenAddress);
    } else {
      setTokenInfo(null);
    }
  }, [tokenAddress, account, connected, network]);

  // Load transactions from localStorage
  useEffect(() => {
    if (account) {
      const savedTransactions = localStorage.getItem(
        `transactions_${account}_${network}`
      );
      if (savedTransactions) {
        setTransactionHistory(JSON.parse(savedTransactions));
      } else {
        setTransactionHistory([]);
      }
    }
  }, [account, network]);

  // Save transactions to localStorage when they change
  useEffect(() => {
    if (account && transactionHistory.length > 0) {
      localStorage.setItem(
        `transactions_${account}_${network}`,
        JSON.stringify(transactionHistory)
      );
    }
  }, [transactionHistory, account, network]);

  // Wallet connection
  const checkIfWalletIsConnected = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setConnected(true);
          const provider = new BrowserProvider(window.ethereum);
          const networkInfo = await provider.getNetwork();
          const chainId = Number(networkInfo.chainId);
          if (chainId === NETWORKS.mainnet.chainId) {
            setNetwork("mainnet");
          } else if (chainId === NETWORKS.sepolia.chainId) {
            setNetwork("sepolia");
          }
          fetchNativeBalance();
          scanForTokens();
        }
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
    }
  };

  // Function to get token icon
  const getTokenIcon = (address: string) => {
    return TOKEN_ICONS[address] || "/eth.svg";
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setConnected(false);
      setAccount("");
      setWalletTokens([]);
    } else {
      setAccount(accounts[0]);
      setConnected(true);
      fetchNativeBalance();
      scanForTokens();
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  // Disconnect the wallet
  const disconnectWallet = () => {
    setConnected(false);
    setAccount("");
    setEthBalance("");
    setWalletTokens([]);
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask to use this application");
      return;
    }
    try {
      setLoading(true);
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
      setConnected(true);
      const provider = new BrowserProvider(window.ethereum);
      const networkInfo = await provider.getNetwork();
      const chainId = Number(networkInfo.chainId);
      if (chainId === NETWORKS.mainnet.chainId) {
        setNetwork("mainnet");
      } else if (chainId === NETWORKS.sepolia.chainId) {
        setNetwork("sepolia");
      }
      fetchNativeBalance();
      scanForTokens();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNativeBalance = async () => {
    if (!connected || !window.ethereum) return;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(account);
      const formattedBalance = formatUnits(balance, 18);
      setEthBalance(formattedBalance);
      const ethToken: TokenData = {
        address: "NATIVE",
        symbol:
          NETWORKS[network as keyof typeof NETWORKS].nativeCurrency.symbol,
        name: NETWORKS[network as keyof typeof NETWORKS].nativeCurrency.name,
        decimals:
          NETWORKS[network as keyof typeof NETWORKS].nativeCurrency.decimals,
        balance: formattedBalance,
        logoURI: "/eth.svg",
        isNative: true,
      };
      setWalletTokens((prev) => {
        const existing = prev.findIndex((t) => t.isNative);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = ethToken;
          return updated;
        } else {
          return [ethToken, ...prev];
        }
      });
    } catch (error) {
      console.error("Error fetching native balance:", error);
    }
  };

  const fetchNativeTokenInfo = async () => {
    if (!connected) return;
    try {
      const nativeCurrency =
        NETWORKS[network as keyof typeof NETWORKS].nativeCurrency;
      setTokenInfo({
        address: "NATIVE",
        symbol: nativeCurrency.symbol,
        name: nativeCurrency.name,
        decimals: nativeCurrency.decimals,
        balance: ethBalance,
        logoURI: "/eth.svg",
        isNative: true,
      });
    } catch (error) {
      console.error("Error setting native token info:", error);
    }
  };

  const scanForTokens = async () => {
    if (!connected || !account) return;
    try {
      setScanningTokens(true);

      // First fetch native balance to ensure it's always present
      await fetchNativeBalance();

      // Create a map to store token data by address (lowercase for case-insensitive comparison)
      const tokenMap = new Map<string, TokenData>();

      // Add tokens we find to this map
      const addToken = (token: TokenData) => {
        if (token && token.address) {
          const lowerAddress = token.address.toLowerCase();
          // Only update if not exists or if we have a better balance value
          if (
            !tokenMap.has(lowerAddress) ||
            (parseFloat(token.balance) > 0 &&
              parseFloat(tokenMap.get(lowerAddress)!.balance) === 0)
          ) {
            tokenMap.set(lowerAddress, token);
          }
        }
      };

      // Method 1: Try Etherscan API
      try {
        await fetchTokensFromEtherscan(addToken);
      } catch (error) {
        console.error("Error fetching from Etherscan:", error);
      }

      // Method 3: Check popular tokens for this network
      await checkPopularTokens(addToken);

      // Method 4: If on Sepolia, check common test tokens
      if (network === "sepolia") {
        await checkCommonSepoliaTokens(addToken);
      }

      // Method 5 (Last resort): Check local storage for previously seen tokens
      checkLocalStorageTokens(addToken);

      // Convert map back to array (excluding the native token which we handle separately)
      const tokensList = Array.from(tokenMap.values()).filter(
        (token) => !token.isNative
      );

      // Update wallet tokens but preserve the native token at the beginning
      setWalletTokens((prev) => {
        const nativeToken = prev.find((t) => t.isNative);
        return nativeToken ? [nativeToken, ...tokensList] : tokensList;
      });

      // If a token is currently selected, refresh its info
      if (tokenAddress && tokenAddress !== "NATIVE") {
        await fetchTokenInfo(tokenAddress);
      }
    } catch (error) {
      console.error("Error scanning for tokens:", error);
    } finally {
      setScanningTokens(false);
    }
  };

  const fetchTokensFromEtherscan = async (
    addToken: (token: TokenData) => void
  ) => {
    // Different API endpoints based on network
    const apiKey = "K7JPT55R9Q5V3INJZXI7432KGHZ19878ST"; // Consider rotating keys or using environment variables
    const apiDomain =
      network === "mainnet" ? "api.etherscan.io" : "api-sepolia.etherscan.io";

    const response = await fetch(
      `https://${apiDomain}/api?module=account&action=tokenlist&address=${account}&apikey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Etherscan API error: ${response.status}`);
    }

    const data = await response.json();

    // If Etherscan returns valid data
    if (data.status === "1" && data.result && data.result.length > 0) {
      await Promise.all(
        data.result.map(async (token: any) => {
          try {
            // Convert token decimals to a number
            const decimals = parseInt(token.tokenDecimal);

            // Format the balance with the correct number of decimals
            const formattedBalance = formatUnits(token.balance, decimals);

            addToken({
              address: token.contractAddress,
              symbol: token.symbol,
              name: token.tokenName,
              decimals: decimals,
              balance: formattedBalance,
              logoURI: getTokenIcon(token.contractAddress),
            });
          } catch (error) {
            console.error(
              `Error processing token ${token.contractAddress}:`,
              error
            );
          }
        })
      );
    } else {
      throw new Error("Etherscan returned no tokens or invalid data");
    }
  };

  // Method 3: Check popular tokens for the current network
  const checkPopularTokens = async (addToken: (token: TokenData) => void) => {
    if (!connected || !account) return;

    try {
      const provider = new BrowserProvider(window.ethereum);

      // Get the tokens list for the current network
      const popularTokens =
        POPULAR_TOKENS[network as keyof typeof POPULAR_TOKENS] || [];

      // Check each token in the popular list that isn't native
      await Promise.all(
        popularTokens
          .filter((token) => token.address !== "NATIVE")
          .map(async (token) => {
            try {
              const contract = new Contract(token.address, ERC20_ABI, provider);
              const balance = await contract.balanceOf(account);

              // Add all tokens, even with zero balance
              const formattedBalance = formatUnits(balance, token.decimals);

              addToken({
                address: token.address,
                symbol: token.symbol,
                name: token.name,
                decimals: token.decimals,
                balance: formattedBalance,
                logoURI: token.logoURI || "/eth.svg",
              });
            } catch (error) {
              console.error(
                `Error checking popular token ${token.address}:`,
                error
              );
            }
          })
      );
    } catch (error) {
      console.error("Error checking popular tokens:", error);
    }
  };

  // Method 4: Enhanced Sepolia token detection with more tokens
  const checkCommonSepoliaTokens = async (
    addToken: (token: TokenData) => void
  ) => {
    if (!connected || !account) return;

    // Expanded list of common token addresses on Sepolia
    const EXPANDED_SEPOLIA_TOKENS = [
      ...COMMON_SEPOLIA_TOKENS,
      // Add more known Sepolia token addresses here
      "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", // Test UNI
      "0x779877A7B0D9E8603169DdbD7836e478b4624789", // Test LINK (official)
      "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06", // Test USDT
    ];

    try {
      const provider = new BrowserProvider(window.ethereum);

      // Check each token in our expanded list
      await Promise.all(
        EXPANDED_SEPOLIA_TOKENS.map(async (address) => {
          try {
            const contract = new Contract(address, ERC20_ABI, provider);

            // Get token details and balance
            const [name, symbol, decimals, balance] = await Promise.all([
              contract.name().catch(() => "Unknown Token"),
              contract.symbol().catch(() => "???"),
              contract.decimals().catch(() => 18),
              contract.balanceOf(account),
            ]);

            const formattedBalance = formatUnits(balance, decimals);

            addToken({
              address,
              symbol,
              name,
              decimals,
              balance: formattedBalance,
              logoURI: "/eth.svg",
            });
          } catch (error) {
            console.error(`Error checking Sepolia token ${address}:`, error);
          }
        })
      );
    } catch (error) {
      console.error("Error checking common Sepolia tokens:", error);
    }
  };

  // Method 5: Check local storage for previously seen tokens
  const checkLocalStorageTokens = (addToken: (token: TokenData) => void) => {
    try {
      // Get previously seen tokens from localStorage
      const storageKey = `seen_tokens_${account}_${network}`;
      const savedTokens = localStorage.getItem(storageKey);

      if (savedTokens) {
        const tokens = JSON.parse(savedTokens) as TokenData[];
        tokens.forEach((token) => {
          if (token && token.address && !token.isNative) {
            addToken(token);
          }
        });
      }
    } catch (error) {
      console.error("Error checking localStorage tokens:", error);
    }
  };

  // Save seen tokens to localStorage when they are found
  const saveSeenTokensToStorage = (tokens: TokenData[]) => {
    if (!account || !network) return;

    try {
      // Convert the BigInt balance to string
      const tokensToSave = tokens.map((token) => ({
        ...token,
        balance: token.balance.toString(), // Convert BigInt to string
      }));

      const storageKey = `seen_tokens_${account}_${network}`;
      localStorage.setItem(storageKey, JSON.stringify(tokensToSave));
    } catch (error) {
      console.error("Error saving tokens to localStorage:", error);
    }
  };

  // When loading tokens, convert string back to BigInt
  const loadTokensFromStorage = () => {
    try {
      const storageKey = `seen_tokens_${account}_${network}`;
      const savedTokens = localStorage.getItem(storageKey);

      if (savedTokens) {
        const tokens = JSON.parse(savedTokens) as TokenData[];
        const tokensWithBigInt = tokens.map((token) => ({
          ...token,
          balance: token.balance.toString(), // Convert BigInt to string
        }));
        setWalletTokens(tokensWithBigInt);
      }
    } catch (error) {
      console.error("Error loading tokens from localStorage:", error);
    }
  };

  // Call this function to save tokens to storage
  useEffect(() => {
    if (walletTokens.length > 0) {
      saveSeenTokensToStorage(walletTokens);
    }
  }, [walletTokens, account, network]);

  // Call this function to load tokens from storage when the page loads
  useEffect(() => {
    if (account && network) {
      loadTokensFromStorage();
    }
  }, [account, network]);

  const switchNetwork = async (networkId: string) => {
    if (!window.ethereum) return;
    const targetNetwork = NETWORKS[networkId as keyof typeof NETWORKS];
    try {
      setLoading(true);
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + targetNetwork.chainId.toString(16) }],
      });
      setNetwork(networkId);
      setTokenAddress("");
      setTokenInfo(null);
      setWalletTokens([]);
      setTimeout(() => {
        fetchNativeBalance();
        scanForTokens();
      }, 1000);
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x" + targetNetwork.chainId.toString(16),
                chainName: targetNetwork.name,
                rpcUrls: [targetNetwork.rpcUrl],
                blockExplorerUrls: [targetNetwork.blockExplorer],
                nativeCurrency: targetNetwork.nativeCurrency,
              },
            ],
          });
          setNetwork(networkId);
          setTokenAddress("");
          setTokenInfo(null);
          setWalletTokens([]);
          setTimeout(() => {
            fetchNativeBalance();
            scanForTokens();
          }, 1000);
        } catch (addError) {
          console.error("Failed to add network:", addError);
        }
      }
      console.error("Failed to switch network:", switchError);
    } finally {
      setLoading(false);
    }
  };

  const fetchTokenInfo = async (address: string) => {
    if (!isAddress(address) || !connected) return;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(address, ERC20_ABI, provider);
      const [name, symbol, decimalsValue, balance] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.balanceOf(account),
      ]);
      setTokenInfo({
        address,
        name,
        symbol,
        decimals: decimalsValue,
        balance: formatUnits(balance, decimalsValue),
        logoURI: "/api/placeholder/32/32",
      });
    } catch (error) {
      console.error("Error fetching token info:", error);
      setTokenInfo(null);
    }
  };

  const handleSelectToken = (token: TokenData) => {
    setTokenAddress(token.address);
    setTokenInfo(token);
    setShowTokenSelector(false);
  };

  const handleSend = async () => {
    if (
      !window.ethereum ||
      (!isAddress(tokenAddress) && tokenAddress !== "NATIVE") ||
      !isAddress(recipient) ||
      !amount
    ) {
      alert("Please fill all fields with valid values");
      return;
    }
    setLoading(true);
    setTxStatus(null);
    setTxHash("");
    try {
      if (!connected) {
        await connectWallet();
      }
      const provider = new BrowserProvider(window.ethereum);
      const currentNetwork = await provider.getNetwork();
      const currentChainId = Number(currentNetwork.chainId);
      const targetChainId = NETWORKS[network as keyof typeof NETWORKS].chainId;
      if (currentChainId !== targetChainId) {
        await switchNetwork(network);
      }
      const signer = await provider.getSigner();
      let txResponse;
      if (tokenAddress === "NATIVE") {
        const parsedAmount = parseUnits(amount, 18);
        txResponse = await signer.sendTransaction({
          to: recipient,
          value: parsedAmount,
        });
      } else {
        const contract = new Contract(tokenAddress, ERC20_ABI, signer);
        const decimalsValue = tokenInfo
          ? tokenInfo.decimals
          : await contract.decimals();
        const parsedAmount = parseUnits(amount, decimalsValue);
        txResponse = await contract.transfer(recipient, parsedAmount);
      }
      setTxHash(txResponse.hash);
      setTxStatus("pending");
      const newTx: Transaction = {
        hash: txResponse.hash,
        to: recipient,
        amount,
        symbol: tokenInfo?.symbol || "Unknown",
        status: "pending",
        timestamp: Date.now(),
        tokenAddress: tokenAddress,
      };
      setTransactionHistory((prev) => [newTx, ...prev.slice(0, 19)]);
      await txResponse.wait();
      setTxStatus("success");
      setTransactionHistory((prev) =>
        prev.map((tx) =>
          tx.hash === txResponse.hash ? { ...tx, status: "success" } : tx
        )
      );
      if (tokenAddress === "NATIVE") {
        fetchNativeBalance();
      } else {
        fetchTokenInfo(tokenAddress);
      }
      scanForTokens();
      setAmount("");
    } catch (error: any) {
      console.error("Transaction failed:", error);
      setTxStatus("error");
      alert("Transaction failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredTokens = walletTokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTxStatusComponent = () => {
    if (!txStatus) return null;
    const blockExplorer =
      NETWORKS[network as keyof typeof NETWORKS].blockExplorer;
    const txUrl = `${blockExplorer}/tx/${txHash}`;
    switch (txStatus) {
      case "pending":
        return (
          <Alert className="mt-4 bg-yellow-50 border-yellow-200">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            <AlertTitle>Transaction Pending</AlertTitle>
            <AlertDescription>
              Your transaction is being processed.{" "}
              <a
                href={txUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View on block explorer
              </a>
            </AlertDescription>
          </Alert>
        );
      case "success":
        return (
          <Alert className="mt-4 bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
            <AlertTitle>Transaction Successful</AlertTitle>
            <AlertDescription>
              Your tokens have been sent successfully.{" "}
              <a
                href={txUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View on block explorer
              </a>
            </AlertDescription>
          </Alert>
        );
      case "error":
        return (
          <Alert className="mt-4 bg-red-50 border-red-200">
            <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
            <AlertTitle>Transaction Failed</AlertTitle>
            <AlertDescription>
              There was an error processing your transaction.{" "}
              {txHash && (
                <a
                  href={txUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View on block explorer
                </a>
              )}
            </AlertDescription>
          </Alert>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              TS
            </div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
              TokenSwift
            </h1>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <Select
              value={network}
              onValueChange={(value) => switchNetwork(value)}
              disabled={!connected || loading}
            >
              <SelectTrigger className="w-40 bg-white/50 backdrop-blur-sm border border-gray-200 hover:border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 shadow-sm transition-all">
                <SelectValue placeholder="Select Network" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
                <SelectItem value="mainnet" className="hover:bg-purple-50">
                  Ethereum Mainnet
                </SelectItem>
                <SelectItem value="sepolia" className="hover:bg-purple-50">
                  Sepolia Testnet
                </SelectItem>
              </SelectContent>
            </Select>

            {connected ? (
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-lg shadow-sm px-4 py-2 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm font-medium">
                      {account.substring(0, 6)}...
                      {account.substring(account.length - 4)}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={disconnectWallet}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Disconnect</span>
                </Button>
              </div>
            ) : (
              <Button
                onClick={connectWallet}
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
              >
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Connect Wallet</span>
              </Button>
            )}
          </div>
        </header>

        {connected && (
          <div className="mb-6">
            <Card className="border-none shadow-md bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-blue-100 mb-1">
                      Account Balance
                    </p>
                    <h2 className="text-2xl font-bold">
                      {parseFloat(ethBalance).toFixed(4)} ETH
                    </h2>
                    <p className="text-sm text-blue-100 mt-1">
                      {NETWORKS[network as keyof typeof NETWORKS].name}
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0 flex flex-col md:flex-row gap-3">
                    <Button
                      onClick={() => scanForTokens()}
                      variant="outline"
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Tokens
                    </Button>
                    <a
                      href={`${
                        NETWORKS[network as keyof typeof NETWORKS].blockExplorer
                      }/address/${account}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        className="bg-white/10 hover:bg-white/20 text-white border-white/20 w-full"
                      >
                        View on Explorer
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card className="border-none shadow-md bg-white">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-xl font-bold text-gray-800">
                  Send Tokens
                </CardTitle>
                <CardDescription>
                  Transfer your tokens to any Ethereum address
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Tabs defaultValue="transfer" className="w-full">
                  <TabsList className="grid grid-cols-2 mb-4 bg-gray-100">
                    <TabsTrigger
                      value="transfer"
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      Transfer
                    </TabsTrigger>
                    <TabsTrigger
                      value="history"
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      Transaction History
                    </TabsTrigger>
                  </TabsList>
                  {/* Transfer Tab */}
                  <TabsContent value="transfer" className="space-y-6">
                    <div className="flex justify-between items-center">
                      <Label
                        htmlFor="tokenAddress"
                        className="text-sm font-medium"
                      >
                        Select Token
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => scanForTokens()}
                        disabled={scanningTokens}
                        className="h-8 px-2 text-xs text-blue-600"
                      >
                        {scanningTokens ? (
                          <Loader2 className="mr-1 animate-spin h-4 w-4" />
                        ) : (
                          <Search className="mr-1 h-4 w-4" />
                        )}
                        Scan Tokens
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      {tokenInfo ? (
                        <Button
                          variant="outline"
                          onClick={() => setShowTokenSelector(true)}
                          className="flex items-center gap-2"
                        >
                          <img
                            src={tokenInfo.logoURI}
                            alt={tokenInfo.symbol}
                            className="w-5 h-5"
                          />
                          <span>{tokenInfo.symbol}</span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => setShowTokenSelector(true)}
                          className="flex items-center gap-2"
                        >
                          <Search className="h-4 w-4" />
                          <span>Select Token</span>
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label
                        htmlFor="recipient"
                        className="text-sm font-medium"
                      >
                        Recipient Address
                      </Label>
                      <Input
                        id="recipient"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        placeholder="0x..."
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="amount" className="text-sm font-medium">
                        Amount
                      </Label>
                      <Input
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.0"
                      />
                    </div>
                    <Button
                      onClick={handleSend}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <Loader2 className="animate-spin mr-2 h-4 w-4" />
                          Sending...
                        </span>
                      ) : (
                        "Send Tokens"
                      )}
                    </Button>
                    {getTxStatusComponent()}
                  </TabsContent>
                  {/* Transaction History Tab */}
                  <TabsContent value="history" className="space-y-4">
                    {transactionHistory.length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        No transactions found.
                      </p>
                    ) : (
                      transactionHistory.map((tx) => (
                        <Card
                          key={tx.hash}
                          className="border border-gray-100 shadow-sm"
                        >
                          <CardContent className="p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm font-medium">
                                  {tx.symbol}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(tx.timestamp).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm">
                                  {!isNaN(parseFloat(tx.amount))
                                    ? parseFloat(tx.amount).toFixed(4)
                                    : "0.00"}{" "}
                                  {tx.symbol}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2">
                              <a
                                href={`${
                                  NETWORKS[network as keyof typeof NETWORKS]
                                    .blockExplorer
                                }/tx/${tx.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                              >
                                {tx.hash.substring(0, 10)}...
                              </a>
                            </div>
                            <div className="mt-1">
                              <p
                                className={`text-xs font-medium ${
                                  tx.status === "success"
                                    ? "text-green-600"
                                    : tx.status === "error"
                                    ? "text-red-600"
                                    : "text-yellow-600"
                                }`}
                              >
                                {tx.status.toUpperCase()}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          {/* Right Column: Token List */}
          <div className="space-y-4">
            <Card className="border-none shadow-md bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-bold">
                  Wallet Tokens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {walletTokens.length === 0 ? (
                  <p className="text-sm text-gray-500">No tokens found.</p>
                ) : (
                  walletTokens.map((token) => (
                    <div
                      key={token.address}
                      className="flex items-center gap-3 p-2 border-b border-gray-100"
                    >
                      <img
                        src={token.logoURI}
                        alt={token.symbol}
                        className="w-6 h-6"
                      />
                      <div>
                        <p className="text-sm font-medium">{token.symbol}</p>
                        <p className="text-xs text-gray-500">
                          {token.balance && !isNaN(parseFloat(token.balance))
                            ? parseFloat(token.balance).toFixed(4)
                            : "0.00"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Token Selector Dialog */}
        {showTokenSelector && (
          <Dialog open={showTokenSelector} onOpenChange={setShowTokenSelector}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Select a Token</DialogTitle>
                <DialogDescription>
                  Search and select a token from your wallet.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <Input
                  placeholder="Search token..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-4"
                />
                {filteredTokens.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No matching tokens found.
                  </p>
                ) : (
                  filteredTokens.map((token) => (
                    <div
                      key={token.address}
                      onClick={() => handleSelectToken(token)}
                      className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <img
                        src={token.logoURI}
                        alt={token.symbol}
                        className="w-6 h-6"
                      />
                      <div>
                        <p className="text-sm font-medium">{token.symbol}</p>
                        <p className="text-xs text-gray-500">{token.name}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Button
                onClick={() => setShowTokenSelector(false)}
                className="mt-4 w-full"
              >
                Close
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
