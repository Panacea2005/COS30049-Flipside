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
import { ArrowDownUp, Wallet, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        symbol: "DAI",
        address: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6",
        decimals: 18,
        name: "Dai Stablecoin",
      },
      {
        symbol: "LINK",
        address: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
        decimals: 18,
        name: "Chainlink",
      },
    ],
  },
};

interface Token {
  symbol: string;
  address: string;
  decimals: number;
  name: string;
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

      const approveTx = await tokenContract.approve(CUSTOM_SWAP_ADDRESS, amount);
      await approveTx.wait();

      const depositTx = await customSwapContract.deposit(tokenAddress, amount);
      await depositTx.wait();

      alert("Successfully deposited tokens to CustomSwap contract!");
    } catch (error: any) {
      console.error("Deposit failed:", error);
      setError(error.message || "Failed to deposit tokens");
    }
  };

  const checkContractBalance = async (tokenAddress: string): Promise<bigint> => {
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
        console.warn("Network changed during exchange rate call. Aborting update.");
        return;
      }
      console.error("Error getting exchange rate:", error);
      setError("Failed to get exchange rate. Likely no liquidity available for this pair.");
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
        const amountInParsed = ethers.parseUnits(fromAmount, fromToken.decimals);
        const outputAmountNumber = Number(fromAmount) * rate;
        const expectedOutput = ethers.parseUnits(
          outputAmountNumber.toString(),
          toToken.decimals
        );
        const minAmountOut = (expectedOutput * 95n) / 100n;

        // Check contract balance first
        const contractBalance = await checkContractBalance(toToken.address);
        if (contractBalance < expectedOutput) {
          const formattedBalance = ethers.formatUnits(contractBalance, toToken.decimals);
          setError(
            `Contract balance too low. Current: ${formattedBalance} ${toToken.symbol}. Please fund the contract first.`
          );
          return;
        }

        const tokenContract = new Contract(fromToken.address, ERC20_ABI, signer);
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
        const tokenContract = new Contract(fromToken.address, ERC20_ABI, signer);
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

  const getTokenIcon = (token: Token): string => {
    // Common token symbols
    const TOKEN_ICONS: { [key: string]: string } = {
      // Native Tokens
      'ETH': '/eth.svg', // Ethereum logo placeholder
      'SepoliaETH': '/sepolia.svg', // Sepolia ETH logo placeholder
      
      // Stablecoins
      'USDT': '/usdt.svg', // Tether logo placeholder
      'USDC': '/usdc.svg', // USDC logo placeholder
      'DAI': '/dai.svg', // DAI logo placeholder
      
      // Other major tokens
      'WBTC': '/wbtc.png', // Wrapped BTC logo placeholder
      'LINK': '/link.svg', // Chainlink logo placeholder
      'WETH': '/eth.svg', // Wrapped ETH logo placeholder
    };
  
    // Add network-specific icons
    if (token.symbol === 'ETH') {
      // Check if it's a testnet ETH by looking at the token name
      if (token.name.includes('Sepolia')) {
        return TOKEN_ICONS['SepoliaETH'];
      }
    }
  
    // Return the matching icon or a default icon for custom/unknown tokens
    return TOKEN_ICONS[token.symbol] || '/api/placeholder/24/24';
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
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white" 
               title="Custom Token" />
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
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white" 
               title="Custom Token" />
        )}
      </div>
      <span>{token.symbol}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 py-16">
      <Card className="w-full max-w-2xl mx-auto shadow-lg mt-16">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Crypto Exchange</CardTitle>
          {connected ? (
            <div className="text-sm text-gray-500 mt-2">
              Connected: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
              <div>Network: {currentNetwork.name}</div>
            </div>
          ) : (
            <Button onClick={connectWallet} className="mt-4" variant="outline">
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          )}
        </CardHeader>

        <CardContent className="space-y-6 p-8 bg-white rounded-lg">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="sepolia" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="mainnet"
                onClick={() => switchNetwork(NETWORKS.MAINNET)}
              >
                Mainnet
              </TabsTrigger>
              <TabsTrigger
                value="sepolia"
                onClick={() => switchNetwork(NETWORKS.SEPOLIA)}
              >
                Sepolia
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-4">
            <label className="text-sm font-medium">From</label>
            <div className="flex gap-2">
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
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select token">
                    {fromToken && <TokenDisplay token={fromToken} />}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
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
                className="flex-1"
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
              className="rounded-full"
              disabled={!fromToken || !toToken}
            >
              <ArrowDownUp className="h-6 w-6" />
            </Button>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium">To</label>
            <div className="flex gap-2">
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
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select token">
                    {toToken && <TokenDisplay token={toToken} />}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
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
                className="flex-1 bg-gray-50"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">
              Custom Exchange Rate (for custom tokens)
            </label>
            <Input
              type="number"
              placeholder="Enter exchange rate (e.g. 1.23)"
              value={customExchangeRate}
              onChange={(e) => setCustomExchangeRate(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Button
              className="w-full"
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
              <div className="text-sm text-gray-500 text-center">
                Rate: 1 {fromToken.symbol} ={" "}
                {(Number(toAmount) / Number(fromAmount)).toFixed(6)}{" "}
                {toToken.symbol}
              </div>
            )}
          </div>

          <div className="mt-6 border-t pt-4">
            <label className="block text-sm font-medium mb-2">
              Fund Contract (for custom tokens)
            </label>
            <div className="flex gap-2">
              <Select
                value={selectedDepositToken?.symbol}
                onValueChange={(value) => {
                  const token = tokens.find((t) => t.symbol === value);
                  setSelectedDepositToken(token || null);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select token">
                    {selectedDepositToken && <TokenDisplay token={selectedDepositToken} />}
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
                className="flex-1"
              />
              <Button
                onClick={async () => {
                  if (!selectedDepositToken || !depositAmount) return;

                  const amount = ethers.parseUnits(
                    depositAmount,
                    selectedDepositToken.decimals
                  );
                  await depositToContract(selectedDepositToken.address, amount);
                  setDepositAmount("");
                }}
                disabled={!selectedDepositToken || !depositAmount || loading}
              >
                Deposit
              </Button>
            </div>
          </div>

          <div className="mt-6 border-t pt-4">
            <label className="block text-sm font-medium mb-2">
              Add Custom Token
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Token contract address"
                value={customTokenAddress}
                onChange={(e) => setCustomTokenAddress(e.target.value)}
                className="flex-1"
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
                    let symbol: string;
                    let decimals: number;
                    let name: string;

                    try {
                      symbol = await tokenContract.symbol();
                    } catch (e) {
                      throw new Error(
                        "Token contract does not implement symbol()"
                      );
                    }

                    try {
                      decimals = await tokenContract.decimals();
                    } catch (e) {
                      decimals = 18;
                    }

                    try {
                      name = await tokenContract.name();
                    } catch (e) {
                      name = symbol;
                    }

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
              >
                {loading ? "Adding..." : "Add Token"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CryptoExchangePage;
