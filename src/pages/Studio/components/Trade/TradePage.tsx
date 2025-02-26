import { useState, useEffect } from "react";
import {
  BrowserProvider,
  parseUnits,
  formatUnits,
  Contract,
  isAddress,
} from "ethers";
import { Loader2, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY", // Replace with your Infura key
    blockExplorer: "https://etherscan.io",
  },
  sepolia: {
    name: "Sepolia Testnet",
    chainId: 11155111,
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY", // Replace with your Infura key
    blockExplorer: "https://sepolia.etherscan.io",
  },
};

// Popular tokens with their addresses and decimals
const POPULAR_TOKENS = {
  mainnet: [
    {
      symbol: "USDC",
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      decimals: 6,
    },
    {
      symbol: "USDT",
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      decimals: 6,
    },
    {
      symbol: "DAI",
      address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      decimals: 18,
    },
    {
      symbol: "WETH",
      address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      decimals: 18,
    },
  ],
  sepolia: [
    {
      symbol: "TEST USDC",
      address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      decimals: 6,
    }, // Example address - replace with actual Sepolia token addresses
    {
      symbol: "TEST DAI",
      address: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6",
      decimals: 18,
    },
  ],
};

export default function EnhancedTradePage() {
  // State variables
  const [tokenAddress, setTokenAddress] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [network, setNetwork] = useState("mainnet");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [txStatus, setTxStatus] = useState<
    "pending" | "success" | "error" | null
  >(null);
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState("");
  const [tokenInfo, setTokenInfo] = useState<{
    name: string;
    symbol: string;
    decimals: number;
    balance: string;
  } | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<
    Array<{
      hash: string;
      to: string;
      amount: string;
      symbol: string;
      status: "pending" | "success" | "error";
      timestamp: number;
    }>
  >([]);

  // Connect wallet on component mount
  useEffect(() => {
    checkIfWalletIsConnected();

    // Setup wallet event listeners
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    }

    // Cleanup listeners
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

  // Check token info when address or account changes
  useEffect(() => {
    if (isAddress(tokenAddress) && connected && account) {
      fetchTokenInfo();
    } else {
      setTokenInfo(null);
    }
  }, [tokenAddress, account, connected, network]);

  // Load transactions from localStorage
  useEffect(() => {
    const savedTransactions = localStorage.getItem(`transactions_${account}`);
    if (savedTransactions) {
      setTransactionHistory(JSON.parse(savedTransactions));
    }
  }, [account]);

  // Save transactions to localStorage when they change
  useEffect(() => {
    if (account && transactionHistory.length > 0) {
      localStorage.setItem(
        `transactions_${account}`,
        JSON.stringify(transactionHistory)
      );
    }
  }, [transactionHistory, account]);

  // Handle wallet connection
  const checkIfWalletIsConnected = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setConnected(true);
        }
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
    }
  };

  // Handle account changes
  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setConnected(false);
      setAccount("");
    } else {
      setAccount(accounts[0]);
      setConnected(true);
    }
  };

  // Handle network changes
  const handleChainChanged = () => {
    window.location.reload();
  };

  // Connect wallet
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
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  // Switch network
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
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
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
              },
            ],
          });
          setNetwork(networkId);
        } catch (addError) {
          console.error("Failed to add network:", addError);
        }
      }
      console.error("Failed to switch network:", switchError);
    } finally {
      setLoading(false);
    }
  };

  // Fetch token information
  const fetchTokenInfo = async () => {
    if (!isAddress(tokenAddress) || !connected) return;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(tokenAddress, ERC20_ABI, provider);

      const [name, symbol, decimalsValue, balance] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.balanceOf(account),
      ]);

      setTokenInfo({
        name,
        symbol,
        decimals: decimalsValue,
        balance: formatUnits(balance, decimalsValue),
      });
    } catch (error) {
      console.error("Error fetching token info:", error);
      setTokenInfo(null);
    }
  };

  // Handle token selection from popular tokens
  const handleSelectToken = (address: string) => {
    setTokenAddress(address);
  };

  // Handle sending tokens
  const handleSend = async () => {
    if (
      !window.ethereum ||
      !isAddress(tokenAddress) ||
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
      // Ensure user is connected
      if (!connected) {
        await connectWallet();
      }

      // Check and switch network if needed
      const provider = new BrowserProvider(window.ethereum);
      const currentNetwork = await provider.getNetwork();
      const currentChainId = Number(currentNetwork.chainId);
      const targetChainId = NETWORKS[network as keyof typeof NETWORKS].chainId;

      if (currentChainId !== targetChainId) {
        await switchNetwork(network);
      }

      // Get signer
      const signer = await provider.getSigner();

      // Create contract instance
      const contract = new Contract(tokenAddress, ERC20_ABI, signer);

      // Get token decimals if not already fetched
      const decimalsValue = tokenInfo
        ? tokenInfo.decimals
        : await contract.decimals();

      // Parse amount with appropriate decimals
      const parsedAmount = parseUnits(amount, decimalsValue);

      // Send transaction
      const txResponse = await contract.transfer(recipient, parsedAmount);

      setTxHash(txResponse.hash);
      setTxStatus("pending");

      // Add to transaction history
      const newTx = {
        hash: txResponse.hash,
        to: recipient,
        amount,
        symbol: tokenInfo?.symbol || "Unknown",
        status: "pending" as const,
        timestamp: Date.now(),
      };

      setTransactionHistory((prev) => [newTx, ...prev.slice(0, 9)]);

      // Wait for transaction confirmation
      await txResponse.wait(); // Fixed: Removed the unused txReceipt variable

      // Update transaction status
      setTxStatus("success");
      setTransactionHistory((prev) =>
        prev.map((tx) =>
          tx.hash === txResponse.hash
            ? { ...tx, status: "success" as const }
            : tx
        )
      );

      // Refresh token balance
      fetchTokenInfo();
    } catch (error: any) {
      console.error("Transaction failed:", error);
      setTxStatus("error");

      // Update transaction in history if it exists
      if (txHash) {
        setTransactionHistory((prev) =>
          prev.map((tx) =>
            tx.hash === txHash ? { ...tx, status: "error" as const } : tx
          )
        );
      }

      alert("Transaction failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Get transaction status component
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-purple-600">
            TokenSwift
          </h1>

          <div className="mt-4 md:mt-0">
            {connected ? (
              <div className="flex items-center space-x-2 bg-white rounded-lg shadow px-4 py-2 border border-gray-200">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">
                  {account.substring(0, 6)}...
                  {account.substring(account.length - 4)}
                </span>
              </div>
            ) : (
              <Button
                onClick={connectWallet}
                disabled={loading}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white"
              >
                {loading ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card className="border-gray-200 shadow-md">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-xl text-gray-800">
                  Trade Tokens
                </CardTitle>
                <CardDescription>
                  Send tokens to any address on{" "}
                  {network === "mainnet"
                    ? "Ethereum Mainnet"
                    : "Sepolia Testnet"}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-6">
                <Tabs defaultValue="transfer" className="w-full">
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="transfer">Transfer</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>

                  <TabsContent value="transfer" className="space-y-6">
                    <div>
                      <Label htmlFor="network" className="mb-2 block text-sm">
                        Network
                      </Label>
                      <Select
                        value={network}
                        onValueChange={(value) => {
                          setNetwork(value);
                          setTokenAddress("");
                          setTokenInfo(null);
                        }}
                      >
                        <SelectTrigger className="border-gray-300 focus:ring-cyan-500">
                          <SelectValue placeholder="Select Network" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mainnet">
                            Ethereum Mainnet
                          </SelectItem>
                          <SelectItem value="sepolia">
                            Sepolia Testnet
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="tokenAddress" className="text-sm">
                          Token Address
                        </Label>
                        <span className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          Popular Tokens
                        </span>
                      </div>

                      <div className="flex mb-2 gap-2 overflow-x-auto pb-2">
                        {POPULAR_TOKENS[
                          network as keyof typeof POPULAR_TOKENS
                        ].map((token) => (
                          <Button
                            key={token.address}
                            variant="outline"
                            size="sm"
                            className="border-gray-300 hover:bg-gray-100 text-xs"
                            onClick={() => handleSelectToken(token.address)}
                          >
                            {token.symbol}
                          </Button>
                        ))}
                      </div>

                      <Input
                        id="tokenAddress"
                        value={tokenAddress}
                        onChange={(e) => setTokenAddress(e.target.value)}
                        placeholder="0x..."
                        className="border-gray-300 focus:ring-cyan-500"
                      />

                      {tokenInfo && (
                        <div className="mt-2 p-2 rounded bg-gray-50 border border-gray-200 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-700">
                              {tokenInfo.name} ({tokenInfo.symbol})
                            </span>
                            <span className="text-gray-700">
                              Balance:{" "}
                              {parseFloat(tokenInfo.balance).toFixed(4)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="recipient" className="mb-2 block text-sm">
                        Recipient Address
                      </Label>
                      <Input
                        id="recipient"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        placeholder="0x..."
                        className="border-gray-300 focus:ring-cyan-500"
                      />
                      <div className="text-xs mt-1 text-gray-500">
                        {isAddress(recipient) ? (
                          <span className="text-green-600">
                            ✓ Valid address
                          </span>
                        ) : (
                          <span>Enter a valid Ethereum address</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="amount" className="text-sm">
                          Amount
                        </Label>
                        {tokenInfo && (
                          <button
                            className="text-xs text-cyan-600 hover:text-cyan-700"
                            onClick={() => setAmount(tokenInfo.balance)}
                          >
                            Max
                          </button>
                        )}
                      </div>
                      <Input
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.0"
                        type="number"
                        min="0"
                        step="0.001"
                        className="border-gray-300 focus:ring-cyan-500"
                      />
                    </div>

                    <Button
                      onClick={handleSend}
                      disabled={
                        loading ||
                        !connected ||
                        !isAddress(tokenAddress) ||
                        !isAddress(recipient) ||
                        !amount
                      }
                      className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white"
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <Loader2 className="animate-spin mr-2 h-4 w-4" />
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          Send Tokens
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </span>
                      )}
                    </Button>

                    {getTxStatusComponent()}
                  </TabsContent>

                  <TabsContent value="history">
                    {transactionHistory.length > 0 ? (
                      <div className="space-y-4">
                        {transactionHistory.map((tx) => (
                          <div
                            key={tx.hash}
                            className="p-3 rounded-lg bg-white border border-gray-200 shadow-sm"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-gray-700">
                                {tx.amount} {tx.symbol}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  tx.status === "success"
                                    ? "bg-green-100 text-green-700"
                                    : tx.status === "pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {tx.status.charAt(0).toUpperCase() +
                                  tx.status.slice(1)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mb-1">
                              To: {tx.to.substring(0, 8)}...
                              {tx.to.substring(tx.to.length - 8)}
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-xs text-gray-500">
                                {new Date(tx.timestamp).toLocaleString()}
                              </div>
                              <a
                                href={`${
                                  NETWORKS[network as keyof typeof NETWORKS]
                                    .blockExplorer
                                }/tx/${tx.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-purple-600 hover:text-purple-700"
                              >
                                View Transaction
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <p>No transaction history available</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-gray-200 shadow-md h-full">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-xl text-gray-800">
                  Network Info
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4 pt-6">
                <div>
                  <h3 className="text-md font-medium mb-2 text-gray-800">
                    {network === "mainnet"
                      ? "Ethereum Mainnet"
                      : "Sepolia Testnet"}
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      Chain ID:{" "}
                      {NETWORKS[network as keyof typeof NETWORKS].chainId}
                    </p>
                    <p>
                      <a
                        href={
                          NETWORKS[network as keyof typeof NETWORKS]
                            .blockExplorer
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-600 hover:text-cyan-700"
                      >
                        Block Explorer
                      </a>
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-medium mb-2 text-gray-800">
                    Popular Tokens
                  </h3>
                  <div className="space-y-2">
                    {POPULAR_TOKENS[network as keyof typeof POPULAR_TOKENS].map(
                      (token) => (
                        <div
                          key={token.address}
                          className="p-2 rounded bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors border border-gray-200"
                          onClick={() => handleSelectToken(token.address)}
                        >
                          <div className="font-medium text-gray-700">
                            {token.symbol}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {token.address}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <h3 className="text-md font-medium mb-2 text-gray-800">
                    Need Help?
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Make sure your wallet is connected and you're on the correct
                    network.
                  </p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full border-gray-300 hover:bg-gray-100"
                        >
                          View Documentation
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Documentation coming soon</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
