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

// Network configurations
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
  GOERLI: {
    name: "Goerli Testnet",
    chainId: "0x5",
    routerAddress: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    wethAddress: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    tokens: [
      {
        symbol: "ETH",
        address: "0x0000000000000000000000000000000000000000",
        decimals: 18,
        name: "Ethereum",
      },
      {
        symbol: "USDC",
        address: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F",
        decimals: 6,
        name: "USD Coin",
      },
      {
        symbol: "LINK",
        address: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
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
  const [error, setError] = useState<string>("");

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
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: network.chainId,
                chainName: network.name,
                nativeToken: {
                  name: "ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: [
                  `https://${network.name.toLowerCase()}.infura.io/v3/your-infura-key`,
                ],
                blockExplorerUrls: [
                  `https://${network.name.toLowerCase()}.etherscan.io`,
                ],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add network", addError);
          setError(`Failed to add ${network.name}`);
        }
      }
      console.error("Failed to switch network", error);
      setError(`Failed to switch to ${network.name}`);
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

  const getExchangeRate = async () => {
    if (!provider || !fromAmount || !fromToken || !toToken) return;
  
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
      const output = amounts[amounts.length - 1]; // BigInt
  
      if (output === 0n) {
        setError("Insufficient liquidity for this swap.");
        setToAmount("0");
      } else {
        setError("");
        const outputAmount = ethers.formatUnits(output, toToken.decimals);
        setToAmount(outputAmount);
      }
    } catch (error: any) {
      // Check if the error is due to a network change.
      if (error.message.includes("network changed")) {
        console.warn("Network changed during exchange rate call. Aborting this update.");
        return;
      }
      console.error("Error getting exchange rate:", error);
      setError("Failed to get exchange rate. Likely no liquidity available for this pair.");
      setToAmount("0");
    }
  };
  
  const handleSwap = async () => {
    if (!signer || !fromToken || !toToken || !fromAmount) return;
    setLoading(true);
    setError("");
  
    try {
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
      const amountOutMin = (amounts[amounts.length - 1] * 95n) / 100n; // 5% slippage
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
  
      let tx;
      if (fromToken.symbol === "ETH") {
        tx = await router.swapExactETHForTokens(
          amountOutMin,
          path,
          userAddress,
          deadline,
          { value: amountIn }
        );
      } else if (toToken.symbol === "ETH") {
        const tokenContract = new Contract(fromToken.address, ERC20_ABI, signer);
        const allowance = await tokenContract.allowance(userAddress, currentNetwork.routerAddress);
        if (allowance < amountIn) {
          const approveTx = await tokenContract.approve(currentNetwork.routerAddress, amountIn);
          await approveTx.wait();
        }
        tx = await router.swapExactTokensForETH(
          amountIn,
          amountOutMin,
          path,
          userAddress,
          deadline
        );
      } else {
        const tokenContract = new Contract(fromToken.address, ERC20_ABI, signer);
        const allowance = await tokenContract.allowance(userAddress, currentNetwork.routerAddress);
        if (allowance < amountIn) {
          const approveTx = await tokenContract.approve(currentNetwork.routerAddress, amountIn);
          await approveTx.wait();
        }
        tx = await router.swapExactTokensForTokens(
          amountIn,
          amountOutMin,
          path,
          userAddress,
          deadline
        );
      }
  
      await tx.wait();
      setFromAmount("");
      setToAmount("");
      setError("");
      alert("Swap successful!");
    } catch (error: any) {
      // Handle network change errors gracefully
      if (error.message.includes("network changed")) {
        console.warn("Network changed during swap call. Please try again after the switch completes.");
        setError("Network changed. Please try again.");
      } else {
        console.error("Swap failed:", error);
        setError(error.message || "Swap failed");
      }
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    if (fromAmount && fromToken && toToken) {
      getExchangeRate();
    }
  }, [fromAmount, fromToken, toToken]);

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
            <TabsList className="grid w-full grid-cols-3">
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
              <TabsTrigger
                value="goerli"
                onClick={() => switchNetwork(NETWORKS.GOERLI)}
              >
                Goerli
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
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  {tokens.map((token) => (
                    <SelectItem
                      key={token.symbol + token.address}
                      value={token.symbol}
                      disabled={token.symbol === toToken?.symbol}
                    >
                      {token.symbol}
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
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  {tokens.map((token) => (
                    <SelectItem
                      key={token.symbol + token.address}
                      value={token.symbol}
                      disabled={token.symbol === fromToken?.symbol}
                    >
                      {token.symbol}
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
                    };

                    setTokens((prev) => [...prev, newToken]);
                    setCustomTokenAddress("");
                    setError("");
                  } catch (error) {
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
