import { useState, useEffect } from "react";
import { ethers, BrowserProvider, Contract, JsonRpcSigner } from "ethers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowDownUp,
  Wallet,
  AlertCircle,
  ExternalLink,
  Coins,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

declare global {
  interface Window {
    ethereum: any;
  }
}

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function name() external view returns (string)",
];

const UNISWAP_ROUTER_ABI = [
  "function WETH() external pure returns (address)",
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
];

// Define your custom swap contract address (update this with your deployed address)
const CUSTOM_SWAP_ADDRESS = "0x3b0eb889996c27d11218baf0e918e4c63699fcda";

// Define the ABI for your custom swap contract. We assume it has a function:
// swapCustomTokens(address fromToken, address toToken, uint256 amountIn, uint256 minAmountOut)
// Update the CUSTOM_SWAP_ABI to match the new contract
const CUSTOM_SWAP_ABI = [
  "function deposit(address token, uint256 amount) external",
  "function getContractBalance(address token) public view returns (uint256)",
  "function swapCustomTokens(address fromToken, address toToken, uint256 amountIn, uint256 minAmountOut) external",
  "event Deposit(address indexed token, address indexed depositor, uint256 amount)",
  "event Swap(address indexed fromToken, address indexed toToken, address indexed user, uint256 amountIn, uint256 amountOut)",
];

const NETWORKS = {
  MAINNET: {
    name: "Ethereum Mainnet",
    chainId: "0x1",
    routerAddress: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2 Router
    wethAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    tokens: [
      {
        symbol: "ETH",
        address: "0x0000000000000000000000000000000000000000",
        decimals: 18,
        name: "Ethereum",
      },
      {
        symbol: "USDT",
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        decimals: 6,
        name: "Tether USD",
      },
      {
        symbol: "USDC",
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        decimals: 6,
        name: "USD Coin",
      },
      {
        symbol: "DAI",
        address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        decimals: 18,
        name: "Dai Stablecoin",
      },
      {
        symbol: "WBTC",
        address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        decimals: 8,
        name: "Wrapped BTC",
      },
    ],
  },
  SEPOLIA: {
    name: "Sepolia Testnet",
    chainId: "0xaa36a7",
    routerAddress: "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008", // Sepolia UniswapV2 Router
    wethAddress: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9",
    tokens: [
      {
        symbol: "ETH",
        address: "0x0000000000000000000000000000000000000000",
        decimals: 18,
        name: "Ethereum",
      },
      {
        symbol: "USDT",
        address: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06",
        decimals: 6,
        name: "Tether USD",
      },
      {
        symbol: "USDC",
        address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
        decimals: 6,
        name: "USD Coin",
      },
      {
        symbol: "LINK",
        address: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
        decimals: 18,
        name: "Chainlink",
      },
      {
        symbol: "UNI",
        address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
        decimals: 18,
        name: "Uniswap",
      },
    ],
  },
};

interface Token {
  symbol: string;
  address: string;
  decimals: number;
  name: string;
  chainId?: number;
  custom?: boolean; // optional flag, true if user-added custom token
}

interface Network {
  name: string;
  chainId: string;
  routerAddress: string;
  wethAddress: string;
  tokens: Token[];
}

const CryptoExchangePage = () => {
  const [currentNetwork, setCurrentNetwork] = useState<Network>(
    NETWORKS.SEPOLIA
  );
  const [tokens, setTokens] = useState<Token[]>([]);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [userAddress, setUserAddress] = useState<string>("");
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const [customTokenAddress, setCustomTokenAddress] = useState<string>("");
  const [customExchangeRate, setCustomExchangeRate] = useState<string>("");
  const [selectedDepositToken, setSelectedDepositToken] =
    useState<Token | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [error, setError] = useState<string>("");

  const depositToContract = async (tokenAddress: string, amount: bigint) => {
    if (!signer) return;

    try {
      const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
      const customSwapContract = new Contract(
        CUSTOM_SWAP_ADDRESS,
        CUSTOM_SWAP_ABI,
        signer
      );

      const approveTx = await tokenContract.approve(
        CUSTOM_SWAP_ADDRESS,
        amount
      );
      await approveTx.wait();

      const depositTx = await customSwapContract.deposit(tokenAddress, amount);
      await depositTx.wait();

      alert("Successfully deposited tokens to CustomSwap contract!");
    } catch (error: any) {
      console.error("Deposit failed:", error);
      setError(error.message || "Failed to deposit tokens");
    }
  };

  const checkContractBalance = async (
    tokenAddress: string
  ): Promise<bigint> => {
    if (!provider) return 0n;

    const customSwapContract = new Contract(
      CUSTOM_SWAP_ADDRESS,
      CUSTOM_SWAP_ABI,
      provider
    );
    try {
      const balance = await customSwapContract.getContractBalance(tokenAddress);
      return balance;
    } catch (error) {
      console.error("Error checking contract balance:", error);
      return 0n;
    }
  };

  const getExchangeRate = async () => {
    if (!provider || !fromAmount || !fromToken || !toToken) return;

    // Handle custom token exchange rate
    if (fromToken.custom && toToken.custom) {
      const rate = customExchangeRate ? Number(customExchangeRate) : 1;
      const simulatedToAmount = (Number(fromAmount) * rate).toFixed(6);
      setToAmount(simulatedToAmount);
      return;
    }

    try {
      const router = new Contract(
        currentNetwork.routerAddress,
        UNISWAP_ROUTER_ABI,
        provider
      );
      const amountIn = ethers.parseUnits(fromAmount, fromToken.decimals);
      let path: string[];

      if (fromToken.symbol === "ETH") {
        path = [currentNetwork.wethAddress, toToken.address];
      } else if (toToken.symbol === "ETH") {
        path = [fromToken.address, currentNetwork.wethAddress];
      } else {
        path = [fromToken.address, currentNetwork.wethAddress, toToken.address];
      }

      const amounts = await router.getAmountsOut(amountIn, path);
      const output = amounts[amounts.length - 1];

      if (output === 0n) {
        setError("Insufficient liquidity for this swap.");
        setToAmount("0");
      } else {
        setError("");
        const outputAmount = ethers.formatUnits(output, toToken.decimals);
        setToAmount(outputAmount);
      }
    } catch (error: any) {
      if (error.message.includes("network changed")) {
        console.warn(
          "Network changed during exchange rate call. Aborting update."
        );
        return;
      }
      console.error("Error getting exchange rate:", error);
      setError(
        "Failed to get exchange rate. Likely no liquidity available for this pair."
      );
      setToAmount("0");
    }
  };

  const switchNetwork = async (network: Network) => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: network.chainId }],
      });
      setCurrentNetwork(network);
      setTokens(network.tokens);
      if (network.tokens.length >= 2) {
        setFromToken(network.tokens[0]);
        setToToken(network.tokens[1]);
      } else {
        setFromToken(null);
        setToToken(null);
      }
      setFromAmount("");
      setToAmount("");
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          // Different configuration based on network
          let networkConfig;
          if (network.chainId === "0xe705") {
            // Linea Sepolia
            networkConfig = {
              chainId: network.chainId,
              chainName: "Linea Sepolia",
              nativeCurrency: {
                name: "LineaETH",
                symbol: "LineaETH",
                decimals: 18,
              },
              rpcUrls: ["https://linea-sepolia.infura.io"],
              blockExplorerUrls: ["https://sepolia.lineascan.build"],
            };
          } else {
            networkConfig = {
              chainId: network.chainId,
              chainName: network.name,
              nativeCurrency: {
                name: "ETH",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: [
                `https://${network.name
                  .toLowerCase()
                  .replace(" ", "-")}.infura.io/v3/your-infura-key`,
              ],
              blockExplorerUrls: [
                `https://${network.name
                  .toLowerCase()
                  .replace(" ", "-")}.etherscan.io`,
              ],
            };
          }

          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [networkConfig],
          });

          // After adding the network, try to switch to it
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: network.chainId }],
          });

          setCurrentNetwork(network);
          setTokens(network.tokens);
          if (network.tokens.length >= 2) {
            setFromToken(network.tokens[0]);
            setToToken(network.tokens[1]);
          }
          setFromAmount("");
          setToAmount("");
        } catch (addError) {
          console.error("Failed to add network", addError);
          setError(
            `Failed to add ${network.name}. Please make sure you're connected to your wallet and try again.`
          );
        }
      } else {
        console.error("Failed to switch network", error);
        setError(
          `Failed to switch to ${network.name}. Please make sure you're connected to your wallet and try again.`
        );
      }
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const browserProvider = new BrowserProvider(window.ethereum);
        setProvider(browserProvider);

        await window.ethereum.request({ method: "eth_requestAccounts" });
        const signer = await browserProvider.getSigner();
        setSigner(signer);
        const address = await signer.getAddress();
        setUserAddress(address);
        setConnected(true);

        // Get current network and set appropriate tokens
        const networkData = await browserProvider.getNetwork();
        const chainId = "0x" + networkData.chainId.toString(16);
        const selectedNetwork =
          Object.values(NETWORKS).find((n) => n.chainId === chainId) ||
          NETWORKS.SEPOLIA;
        setCurrentNetwork(selectedNetwork);
        setTokens(selectedNetwork.tokens);
        if (selectedNetwork.tokens.length >= 2) {
          setFromToken(selectedNetwork.tokens[0]);
          setToToken(selectedNetwork.tokens[1]);
        }

        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", handleChainChanged);
      } catch (error) {
        console.error("User denied account access", error);
        setError("Failed to connect wallet");
      }
    } else {
      setError("Please install MetaMask!");
    }
  };

  const handleChainChanged = async (chainId: string) => {
    const network = Object.values(NETWORKS).find((n) => n.chainId === chainId);
    if (network) {
      setCurrentNetwork(network);
      setTokens(network.tokens);
      if (network.tokens.length >= 2) {
        setFromToken(network.tokens[0]);
        setToToken(network.tokens[1]);
      } else {
        setFromToken(null);
        setToToken(null);
      }
      setFromAmount("");
      setToAmount("");
    }
  };

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      setConnected(false);
      setUserAddress("");
      setSigner(null);
    } else {
      setUserAddress(accounts[0]);
    }
  };

  const handleSwap = async () => {
    if (!signer || !fromToken || !toToken || !fromAmount || !userAddress) {
      setError("Please connect wallet and select tokens");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Handle custom token swap
      if (fromToken.custom && toToken.custom) {
        const rate = customExchangeRate ? Number(customExchangeRate) : 1;
        const amountInParsed = ethers.parseUnits(
          fromAmount,
          fromToken.decimals
        );
        const outputAmountNumber = Number(fromAmount) * rate;
        const expectedOutput = ethers.parseUnits(
          outputAmountNumber.toString(),
          toToken.decimals
        );
        const minAmountOut = (expectedOutput * 95n) / 100n;

        // Check contract balance first
        const contractBalance = await checkContractBalance(toToken.address);
        if (contractBalance < expectedOutput) {
          const formattedBalance = ethers.formatUnits(
            contractBalance,
            toToken.decimals
          );
          setError(
            `Contract balance too low. Current: ${formattedBalance} ${toToken.symbol}. Please fund the contract first.`
          );
          return;
        }

        const tokenContract = new Contract(
          fromToken.address,
          ERC20_ABI,
          signer
        );
        const approveTx = await tokenContract.approve(
          CUSTOM_SWAP_ADDRESS,
          amountInParsed
        );
        await approveTx.wait();

        const customSwapContract = new Contract(
          CUSTOM_SWAP_ADDRESS,
          CUSTOM_SWAP_ABI,
          signer
        );
        const tx = await customSwapContract.swapCustomTokens(
          fromToken.address,
          toToken.address,
          amountInParsed,
          minAmountOut
        );
        await tx.wait();

        setFromAmount("");
        setToAmount("");
        alert("Custom token swap successful!");
        return;
      }

      // Handle regular swap
      const router = new Contract(
        currentNetwork.routerAddress,
        UNISWAP_ROUTER_ABI,
        signer
      );
      const amountIn = ethers.parseUnits(fromAmount, fromToken.decimals);
      const path =
        fromToken.symbol === "ETH"
          ? [currentNetwork.wethAddress, toToken.address]
          : toToken.symbol === "ETH"
          ? [fromToken.address, currentNetwork.wethAddress]
          : [fromToken.address, currentNetwork.wethAddress, toToken.address];

      const amounts = await router.getAmountsOut(amountIn, path);
      const amountOutMin = (amounts[amounts.length - 1] * 95n) / 100n;
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      let tx;
      if (fromToken.symbol === "ETH") {
        tx = await router.swapExactETHForTokens(
          amountOutMin,
          path,
          userAddress,
          deadline,
          { value: amountIn }
        );
      } else {
        const tokenContract = new Contract(
          fromToken.address,
          ERC20_ABI,
          signer
        );
        const allowance = await tokenContract.allowance(
          userAddress,
          currentNetwork.routerAddress
        );
        if (allowance < amountIn) {
          const approveTx = await tokenContract.approve(
            currentNetwork.routerAddress,
            amountIn
          );
          await approveTx.wait();
        }

        if (toToken.symbol === "ETH") {
          tx = await router.swapExactTokensForETH(
            amountIn,
            amountOutMin,
            path,
            userAddress,
            deadline
          );
        } else {
          tx = await router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            userAddress,
            deadline
          );
        }
      }

      await tx.wait();
      setFromAmount("");
      setToAmount("");
      setError("");
      alert("Swap successful!");
    } catch (error: any) {
      console.error("Swap failed:", error);
      setError(error.message || "Swap failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fromAmount && fromToken && toToken) {
      getExchangeRate();
    }
  }, [fromAmount, fromToken, toToken]);

  const getTokenIcon = (token: Token, currentNetwork?: Network): string => {
    // Pre-defined icons for known tokens
    const TOKEN_ICONS: { [key: string]: string } = {
      ETH: "/eth.svg",
      SepoliaETH: "/sepolia.svg",
      USDT: "/usdt.svg",
      USDC: "/usdc.svg",
      UNI: "/uni.svg",
      DAI: "/dai.svg",
      WBTC: "/wbtc.png",
      LINK: "/link.svg",
      WETH: "/eth.svg",
    };

    // If it's a custom token, auto-generate the icon URL
    if (token.custom) {
      // Use the TrustWallet repository for Ethereum tokens
      // (Ensure token.address is in checksum or lower-case format as needed)
      return `/hero-image.svg`;
    }

    // Special handling for network-specific tokens (e.g., Sepolia ETH)
    if (token.symbol === "ETH" && currentNetwork) {
      if (currentNetwork.chainId === "0xaa36a7") {
        return TOKEN_ICONS["SepoliaETH"];
      }
    }

    // Fallback to the pre-defined icon or a default placeholder
    return TOKEN_ICONS[token.symbol] || "/api/placeholder/24/24";
  };

  // Token display components
  const TokenOption = ({ token }: { token: Token }) => (
    <div className="flex items-center gap-2">
      <div className="relative w-6 h-6">
        <img
          src={getTokenIcon(token)}
          alt={token.symbol}
          className="w-6 h-6 rounded-full"
        />
        {token.custom && (
          <div
            className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white"
            title="Custom Token"
          />
        )}
      </div>
      <span className="flex items-center gap-1">
        {token.symbol}
        {token.custom && (
          <span className="text-xs text-gray-400">(Custom)</span>
        )}
      </span>
    </div>
  );

  const TokenDisplay = ({ token }: { token: Token }) => (
    <div className="flex items-center gap-2">
      <div className="relative w-6 h-6">
        <img
          src={getTokenIcon(token)}
          alt={token.symbol}
          className="w-6 h-6 rounded-full"
        />
        {token.custom && (
          <div
            className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white"
            title="Custom Token"
          />
        )}
      </div>
      <span>{token.symbol}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto mt-12 sm:mt-16 px-4">
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-4 sm:space-y-6 pb-4 sm:pb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <CardTitle className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Crypto Exchange
              </CardTitle>
              {connected ? (
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mt-4 sm:mt-0">
                  <Badge
                    variant="outline"
                    className="py-1 sm:py-2 px-2 sm:px-4"
                  >
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs sm:text-base font-medium">
                        {currentNetwork.name}
                      </span>
                    </div>
                  </Badge>
                  <Button
                    variant="outline"
                    className="group relative overflow-hidden border-2 hover:border-purple-500 transition-colors duration-300"
                    onClick={() =>
                      window.open(
                        `https://etherscan.io/address/${userAddress}`,
                        "_blank"
                      )
                    }
                  >
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                      <span className="font-medium text-xs sm:text-sm">
                        {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                      </span>
                      <ExternalLink className="w-4 h-4" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={connectWallet}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                >
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect Wallet
                </Button>
              )}
            </div>

            <Tabs defaultValue="sepolia" className="w-full">
              <TabsList className="grid w-full grid-cols-2 p-1 bg-gray-100 rounded-lg">
                <TabsTrigger
                  value="mainnet"
                  onClick={() => switchNetwork(NETWORKS.MAINNET)}
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                >
                  Mainnet
                </TabsTrigger>
                <TabsTrigger
                  value="sepolia"
                  onClick={() => switchNetwork(NETWORKS.SEPOLIA)}
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
                >
                  Sepolia
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="space-y-4 sm:space-y-8 p-4 sm:p-8">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 bg-gray-50 p-4 sm:p-6 rounded-xl shadow-inner">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  From
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select
                    value={fromToken?.symbol}
                    onValueChange={(value) => {
                      const token = tokens.find((t) => t.symbol === value);
                      setFromToken(token || null);
                      if (token?.symbol === toToken?.symbol) {
                        setToToken(null);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[160px] bg-white">
                      <SelectValue placeholder="Select token">
                        {fromToken && <TokenDisplay token={fromToken} />}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {tokens.map((token) => (
                        <SelectItem
                          key={token.symbol + token.address}
                          value={token.symbol}
                          disabled={token.symbol === toToken?.symbol}
                        >
                          <TokenOption token={token} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="flex-1 bg-white border-2 focus:border-purple-500 transition-colors duration-300"
                    min="0"
                    step="0.000000000000000001"
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const tempToken = fromToken;
                    setFromToken(toToken);
                    setToToken(tempToken);
                    setFromAmount("");
                    setToAmount("");
                  }}
                  className="rounded-full w-12 h-12 border-2 hover:border-purple-500 hover:bg-purple-50 transition-all duration-300"
                  disabled={!fromToken || !toToken}
                >
                  <ArrowDownUp className="h-6 w-6" />
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">To</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select
                    value={toToken?.symbol}
                    onValueChange={(value) => {
                      const token = tokens.find((t) => t.symbol === value);
                      setToToken(token || null);
                      if (token?.symbol === fromToken?.symbol) {
                        setFromToken(null);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[160px] bg-white">
                      <SelectValue placeholder="Select token">
                        {toToken && <TokenDisplay token={toToken} />}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {tokens.map((token) => (
                        <SelectItem
                          key={token.symbol + token.address}
                          value={token.symbol}
                          disabled={token.symbol === fromToken?.symbol}
                        >
                          <TokenOption token={token} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={toAmount}
                    readOnly
                    className="flex-1 bg-gray-50 border-2"
                  />
                </div>
              </div>
            </div>

            <Button
              className="w-full h-12 text-lg font-medium bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:shadow-lg"
              onClick={handleSwap}
              disabled={
                !connected || !fromAmount || loading || !fromToken || !toToken
              }
            >
              {!connected
                ? "Connect Wallet to Swap"
                : loading
                ? "Swapping..."
                : "Swap"}
            </Button>

            {fromToken && toToken && fromAmount && toAmount && (
              <div className="text-sm text-gray-600 text-center bg-gray-50 p-2 sm:p-3 rounded-lg">
                <span className="font-medium">Rate:</span> 1 {fromToken.symbol}{" "}
                = {(Number(toAmount) / Number(fromAmount)).toFixed(6)}{" "}
                {toToken.symbol}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-4 bg-gray-50 p-4 sm:p-6 rounded-xl">
                <div className="flex flex-col sm:flex-row items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Fund Contract
                  </h3>
                  <Badge variant="outline" className="bg-purple-50">
                    Custom Tokens Only
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    value={selectedDepositToken?.symbol}
                    onValueChange={(value) => {
                      const token = tokens.find((t) => t.symbol === value);
                      setSelectedDepositToken(token || null);
                    }}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Select token">
                        {selectedDepositToken && (
                          <TokenDisplay token={selectedDepositToken} />
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {tokens
                        .filter((t) => t.custom)
                        .map((token) => (
                          <SelectItem key={token.symbol} value={token.symbol}>
                            <TokenOption token={token} />
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    placeholder="Amount to deposit"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-white"
                  />

                  <Button
                    onClick={async () => {
                      if (!selectedDepositToken || !depositAmount) return;
                      const amount = ethers.parseUnits(
                        depositAmount,
                        selectedDepositToken.decimals
                      );
                      await depositToContract(
                        selectedDepositToken.address,
                        amount
                      );
                      setDepositAmount("");
                    }}
                    disabled={
                      !selectedDepositToken || !depositAmount || loading
                    }
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Coins className="mr-2 h-4 w-4" />
                    Deposit
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4 bg-gray-50 p-4 sm:p-6 rounded-xl">
                  <h3 className="font-semibold text-gray-700">
                    Add Custom Token
                  </h3>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Token contract address"
                      value={customTokenAddress}
                      onChange={(e) => setCustomTokenAddress(e.target.value)}
                      className="flex-1 bg-white"
                    />
                    <Button
                      onClick={async () => {
                        if (!ethers.isAddress(customTokenAddress)) {
                          setError("Invalid token address");
                          return;
                        }
                        setLoading(true);
                        try {
                          const tokenContract = new Contract(
                            customTokenAddress,
                            ERC20_ABI,
                            provider
                          );
                          const [symbol, decimals, name] = await Promise.all([
                            tokenContract.symbol(),
                            tokenContract.decimals(),
                            tokenContract.name(),
                          ]);

                          const newToken = {
                            symbol,
                            address: customTokenAddress,
                            decimals,
                            name,
                            custom: true,
                          };

                          setTokens((prev) => [...prev, newToken]);
                          setCustomTokenAddress("");
                          setError("");
                        } catch (error) {
                          console.error("Error adding token:", error);
                          setError("Failed to add token");
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading || !customTokenAddress}
                      className="bg-gradient-to-r from-purple-500 to-pink-500"
                    >
                      {loading ? "Adding..." : "Add Token"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 bg-gray-50 p-4 sm:p-6 rounded-xl">
                  <h3 className="font-semibold text-gray-700">
                    Custom Exchange Rate
                  </h3>
                  <Input
                    type="number"
                    placeholder="Enter rate (e.g. 1.23)"
                    value={customExchangeRate}
                    onChange={(e) => setCustomExchangeRate(e.target.value)}
                    className="w-full bg-white"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CryptoExchangePage;
