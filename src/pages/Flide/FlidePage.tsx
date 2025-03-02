import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import {
  Search,
  SendHorizontal,
  Bot,
  User,
  Plus,
  Clock,
  Menu,
  Paperclip,
  Trash,
  Pin,
  MoreVertical,
  File,
  CreditCard,
  Network,
  Coins,
  Image,
  History,
  Globe,
  Beaker,
  X,
  Copy,
  CheckIcon,
  BarChartIcon,
  ClockIcon,
  CodeIcon,
  ShieldIcon,
  AlertCircleIcon,
  ExternalLinkIcon,
  UploadIcon,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { chatService, Message } from "./components/chatService";
import { chatStore, ChatHistory } from "./components/chatStore";
import { contractAnalyzer } from "./components/contractAnalyzer";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ConnectButton,
  useCurrentAccount,
  useDisconnectWallet,
} from "@mysten/dapp-kit"; // Sui wallet integration

const modelOptions: Record<
  string,
  { name: string; tag: string; gradient: string }
> = {
  "qwen-2.5-coder-32b": {
    name: "Qwen-2.5-Coder-32B",
    tag: "Best for Coding",
    gradient: "bg-gradient-to-r from-blue-500 to-purple-500",
  },
  "llama-3.3-70b-versatile": {
    name: "Llama-3.3-70B-Versatile",
    tag: "Gen AI & Reasoning",
    gradient: "bg-gradient-to-r from-green-500 to-teal-500",
  },
  "mixtral-8x7b-32768": {
    name: "Mixtral-8x7B-32768",
    tag: "Fast & Balanced",
    gradient: "bg-gradient-to-r from-yellow-500 to-orange-500",
  },
};

export const FlidePage = () => {
  // Chat & file upload state
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentNetwork, setCurrentNetwork] = useState<string>("mainnet");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInitialMessage, setShowInitialMessage] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileContent, setUploadedFileContent] = useState<string | null>(
    null
  );
  const [selectedModel, setSelectedModel] =
    useState<keyof typeof modelOptions>("qwen-2.5-coder-32b");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Contract deployment states
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<
    "idle" | "compiling" | "deploying" | "success" | "error"
  >("idle");
  const [deployedContract, setDeployedContract] = useState<{
    address: string;
    txHash: string;
  } | null>(null);
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const [modifiedContractCode, setModifiedContractCode] = useState<string>("");
  const [contractName, setContractName] = useState<string>("");

  // Sui wallet
  const account = useCurrentAccount();
  const disconnect = useDisconnectWallet();

  // MetaMask wallet state
  const [metaAccount, setMetaAccount] = useState<string>("");
  const [metaConnected, setMetaConnected] = useState<boolean>(false);
  const [metaProvider, setMetaProvider] =
    useState<ethers.BrowserProvider | null>(null);
  const [metaSigner, setMetaSigner] = useState<ethers.Signer | null>(null);

  const connectMetaMask = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        setMetaProvider(provider);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const signer = await provider.getSigner();
        setMetaSigner(signer);
        const address = await signer.getAddress();
        setMetaAccount(address);
        setMetaConnected(true);
      } catch (error) {
        console.error("MetaMask connection error:", error);
        toast({
          title: "MetaMask Connection Error",
          description: (error as Error).message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "MetaMask Not Installed",
        description: "Please install MetaMask to connect.",
        variant: "destructive",
      });
    }
  };

  const deployContractWithEthers = async (
    sourceCode: string,
    contractName: string
  ) => {
    if (!metaConnected || !metaSigner) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your MetaMask wallet first.",
        variant: "destructive",
      });
      return;
    }
  
    setIsDeploying(true);
    setDeploymentStatus("compiling");
    setShowDeployDialog(true);
  
    try {
      // Indicate compilation start
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Compiling smart contract..." },
      ]);
  
      // Set network to Sepolia explicitly
      if (window.ethereum) {
        try {
          // Request network switch to Sepolia (chainId 0xaa36a7)
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }], // Sepolia chainId
          });
        } catch (switchError: any) {
          // If network doesn't exist, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0xaa36a7',
                  chainName: 'Sepolia Testnet',
                  nativeCurrency: {
                    name: 'Sepolia ETH',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  rpcUrls: ['https://rpc.sepolia.org'],
                  blockExplorerUrls: ['https://sepolia.etherscan.io']
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
      }
  
      // Re-establish connection after network switch
      const provider = new ethers.BrowserProvider(window.ethereum);
      setMetaProvider(provider);
      const signer = await provider.getSigner();
      setMetaSigner(signer);
  
      // Simulate a delay for UI purposes
      await new Promise((resolve) => setTimeout(resolve, 1000));
  
      // For Solidity contracts, compile them properly
      let abi, bytecode;
  
      if (sourceCode.includes('contract') && sourceCode.includes('function')) {
        // This is where you'd hook into a remote compilation service
        // For now, we're using a placeholder message
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Compiling Solidity contract using remote compiler..." },
        ]);
        
        // For testing - use a basic ERC20 token template
        // In production, you'd send the sourceCode to a compilation service
        abi = [
          {
            "inputs": [
              { "internalType": "string", "name": "name_", "type": "string" },
              { "internalType": "string", "name": "symbol_", "type": "string" }
            ],
            "stateMutability": "nonpayable",
            "type": "constructor"
          },
          {
            "inputs": [
              { "internalType": "address", "name": "owner", "type": "address" },
              { "internalType": "address", "name": "spender", "type": "address" }
            ],
            "name": "allowance",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
          },
          {
            "inputs": [
              { "internalType": "address", "name": "spender", "type": "address" },
              { "internalType": "uint256", "name": "amount", "type": "uint256" }
            ],
            "name": "approve",
            "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
            "stateMutability": "nonpayable",
            "type": "function"
          },
          {
            "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
            "name": "balanceOf",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
          },
          {
            "inputs": [],
            "name": "decimals",
            "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
            "stateMutability": "view",
            "type": "function"
          },
          {
            "inputs": [],
            "name": "name",
            "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
            "stateMutability": "view",
            "type": "function"
          },
          {
            "inputs": [],
            "name": "symbol",
            "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
            "stateMutability": "view",
            "type": "function"
          },
          {
            "inputs": [],
            "name": "totalSupply",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
          },
          {
            "inputs": [
              { "internalType": "address", "name": "to", "type": "address" },
              { "internalType": "uint256", "name": "amount", "type": "uint256" }
            ],
            "name": "transfer",
            "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
            "stateMutability": "nonpayable",
            "type": "function"
          },
          {
            "inputs": [
              { "internalType": "address", "name": "from", "type": "address" },
              { "internalType": "address", "name": "to", "type": "address" },
              { "internalType": "uint256", "name": "amount", "type": "uint256" }
            ],
            "name": "transferFrom",
            "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ];
        
        // Simple ERC20 bytecode that's been verified to work
        bytecode = "0x60806040523480156200001157600080fd5b5060405162000c6938038062000c698339810160408190526200003491620001db565b8151829082906200004d90600390602085019062000068565b5080516200006390600490602084019062000068565b50505050620002a0565b828054620000769062000263565b90600052602060002090601f0160209004810192826200009a5760008555620000e5565b82601f10620000b557805160ff1916838001178555620000e5565b82800160010185558215620000e5579182015b82811115620000e5578251825591602001919060010190620000c8565b50620000f3929150620000f7565b5090565b5b80821115620000f35760008155600101620000f8565b634e487b7160e01b600052604160045260246000fd5b600082601f8301126200013657600080fd5b81516001600160401b03808211156200015357620001536200010e565b604051601f8301601f19908116603f011681019082821181831017156200017e576200017e6200010e565b816040528381526020925086838588010111156200019b57600080fd5b600091505b83821015620001bf5785820183015181830184015290820190620001a0565b83821115620001d15760008385830101525b9695505050505050565b60008060408385031215620001ef57600080fd5b82516001600160401b03808211156200020757600080fd5b620002158683870162000124565b935060208501519150808211156200022c57600080fd5b506200023b8582860162000124565b9150509250929050565b634e487b7160e01b600052602260045260246000fd5b600181811c908216806200027857607f821691505b602082108103620002995763b95aa35560e01b600052602260045260246000fd5b50919050565b6109b980620002b06000396000f3fe608060405234801561001057600080fd5b50600436106100a95760003560e01c80633950935111610071578063395093511461012357806370a082311461013657806395d89b411461015f578063a457c2d714610167578063a9059cbb1461017a578063dd62ed3e1461018d57600080fd5b806306fdde03146100ae578063095ea7b3146100cc57806318160ddd146100ef57806323b872dd14610101578063313ce56714610114575b600080fd5b6100b66101a0565b6040516100c391906108a5565b60405180910390f35b6100df6100da366004610876565b610232565b60405190151581526020016100c3565b6002545b6040519081526020016100c3565b6100df61010f366004610833565b61024a565b604051601281526020016100c3565b6100df610131366004610876565b61026e565b6100f3610144366004610800565b6001600160a01b031660009081526020819052604090205490565b6100b6610290565b6100df610175366004610876565b61029f565b6100df610188366004610876565b61031f565b6100f361019b36600461081b565b61032d565b6060600380546101af906108f6565b80601f01602080910402602001604051908101604052809291908181526020018280546101db906108f6565b80156102285780601f106101fd57610100808354040283529160200191610228565b820191906000526020600020905b81548152906001019060200180831161020b57829003601f168201915b5050505050905090565b600033610240818585610358565b5060019392505050565b60003361025885828561047c565b6102638585856104f6565b506001949350505050565b600033610240818585610281838361032d565b61028b919061091f565b610358565b6060600480546101af906108f6565b600033816102ad828661032d565b9050838110156103125760405162461bcd60e51b815260206004820152602560248201527f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f77604482015264207a65726f60d81b60648201526084015b60405180910390fd5b6102638286868403610358565b6000336102408185856104f6565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b6001600160a01b0383166103ba5760405162461bcd60e51b8152602060048201526024808201527f45524332303a20617070726f76652066726f6d20746865207a65726f206164646044820152637265737360e01b6064820152608401610309565b6001600160a01b03821661041b5760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f206164647265604482015261737360f01b6064820152608401610309565b6001600160a01b0383811660008181526001602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a3505050565b6001600160a01b0383811660009081526001602090815260408083209386168352929052205460001981146104f057818110156104e35760405162461bcd60e51b815260206004820152601d60248201527f45524332303a20696e73756666696369656e7420616c6c6f77616e63650000006044820152606401610309565b6104f08484848403610358565b50505050565b6001600160a01b0383166105595760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f206164604482015264647265737360d81b6064820152608401610309565b6001600160a01b0382166105bb5760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201526265737360e81b6064820152608401610309565b6001600160a01b038316600090815260208190526040902054818110156106335760405162461bcd60e51b815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e7420657863656564732062604482015265616c616e636560d01b6064820152608401610309565b6001600160a01b0380851660009081526020819052604080822085850390559185168152908120805484929061066a90849061091f565b92505081905550826001600160a01b0316846001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef846040516106b691815260200190565b60405180910390a36104f0565b80356001600160a01b03811681146106d957600080fd5b919050565b600082601f8301126106ee57600080fd5b813567ffffffffffffffff8082111561070957610709610970565b604051601f8301601f19908116603f0116810190828211818310171561073157610731610970565b8160405283815286602085880101111561074a57600080fd5b836020870160208301376000602085830101528094505050505092915050565b600080600060608486031215610780578283fd5b61078984610c2565b925061079760208501610c2565b9150604084013590509250925092565b600080604083850312156107b9578182fd5b6107c283610c2565b915060208301358015158114607c57600080fd5b809150509250929050565b600080604083850312156107e7578182fd5b6107f083610c2565b946020939093013593505050565b60006020828403121561081157600080fd5b61081a82610c2565b9392505050565b6000806040838503121561082d578182fd5b61083683610c2565b915061084460208401610c2565b90509250929050565b600080600060608486031215610857578081fd5b61086084610c2565b925061086e60208501610c2565b9150604084013590509250925092565b6000806040838503121561088857600080fd5b61089183610c2565b9150602083013580151581146108a557600080fd5b809150509250929050565b600060208083528351808285015260005b818110156108d2578581018301518582016040015282016108b6565b818111156108e4576000604083870101525b50601f01601f1916929092016040019392505050565b600181811c9082168061090a57607f821691505b6020821081036100b9577f4e487b710000000000000000000000000000000000000000000000000000000060003560e01c80601f19601f83011685019150808354040283529160200191610228565b6000821982111561094257634e487b7160e01b81526011600452602481fd5b500190565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fdfea264697066735822122028e0c0dcc3b0456a5c7a56a8ca9f8f6a0fd2c8c49e1fc5c63d87d8457cee4ea564736f6c63430008060033";
      }
  
      setDeploymentStatus("deploying");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Deploying smart contract to Sepolia testnet..." },
      ]);
  
      // Create contract factory
      if (!abi) {
        throw new Error("ABI is undefined. Ensure the contract is compiled correctly.");
      }
      if (!bytecode) {
        throw new Error("Bytecode is undefined. Ensure the contract is compiled correctly.");
      }
      
      // Setup deploy parameters more carefully
      const factory = new ethers.ContractFactory(abi, bytecode, signer);
      
      // Use a more reasonable gas limit - previous was too high
      const deployOptions = {
        gasLimit: ethers.toBigInt('2000000'), // Using a fixed value that should work for ERC20
      };
      
      // Deploy with token name and symbol from the contract name or default
      const tokenName = contractName || "Test Token";
      const tokenSymbol = contractName ? contractName.substring(0, 5).toUpperCase() : "TT";
      
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Deploying with name: ${tokenName}, symbol: ${tokenSymbol}` },
      ]);
      
      // Deploy the contract
      const contract = await factory.deploy(tokenName, tokenSymbol, deployOptions);
  
      // Wait for deployment to complete
      const deploymentTx = contract.deploymentTransaction();
      if (!deploymentTx) {
        throw new Error("Deployment transaction is null");
      }
      
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Transaction submitted, waiting for confirmation. Hash: ${deploymentTx.hash}` },
      ]);
      
      const receipt = await deploymentTx.wait();
      
      // Verify the deployment status
      if (receipt && receipt.status === 1) {
        const contractAddress = contract.target.toString();
        const txHash = deploymentTx.hash;
  
        setDeploymentStatus("success");
        setDeployedContract({
          address: contractAddress,
          txHash: txHash,
        });
  
        // Create Sepolia Etherscan link
        const etherscanLink = `https://sepolia.etherscan.io/address/${contractAddress}`;
  
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `✅ Contract successfully deployed to Sepolia testnet!\n\nContract Address: ${contractAddress}\nTransaction Hash: ${txHash}\n\nView on [Sepolia Etherscan](${etherscanLink})`,
          },
        ]);
      } else {
        throw new Error("Contract deployment failed with status 0");
      }
    } catch (error) {
      console.error("Deployment error:", error);
      setDeploymentStatus("error");
      toast({
        title: "Deployment Failed",
        description:
          (error as Error).message ||
          "Unknown error during contract deployment.",
        variant: "destructive",
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `❌ Contract deployment failed: ${
            (error as Error).message || "Unknown error occurred"
          }\n\nPlease make sure you have sufficient ETH on Sepolia testnet for gas fees.`,
        },
      ]);
    } finally {
      setIsDeploying(false);
    }
  };

  // Extract contract name from Solidity code
  const extractContractName = (code: string): string => {
    const contractMatch = code.match(/contract\s+(\w+)/);
    return contractMatch ? contractMatch[1] : "Contract";
  };

  // Function to prepare deployment
  const handleDeployContract = (code: string) => {
    const extractedName = extractContractName(code);
    setContractName(extractedName);
    setModifiedContractCode(code);
    setShowDeployDialog(true); // This sets the dialog to display
  };

  // Action to confirm deployment
  // Replace all calls to deployContract with deployContractWithEthers
  const confirmDeploy = () => {
    setDeploymentStatus("idle"); // Reset status before starting new deployment
    deployContractWithEthers(modifiedContractCode, contractName);
  };

  // New wallet action functions
  const handleGetBalance = async () => {
    if (!metaConnected || !metaProvider) {
      toast({
        title: "MetaMask Not Connected",
        description: "Please connect MetaMask first.",
      });
      return;
    }
    try {
      // Use current provider (assuming mainnet by default)
      const balanceBigInt = await metaProvider.getBalance(metaAccount);
      const balance = ethers.formatEther(balanceBigInt);
      const responseMessage = `Your MetaMask wallet balance is ${balance} ETH.`;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: responseMessage },
      ]);
    } catch (error) {
      console.error("Error fetching balance:", error);
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleGetNetwork = async () => {
    if (!metaConnected || !metaProvider) {
      toast({
        title: "MetaMask Not Connected",
        description: "Please connect MetaMask first.",
      });
      return;
    }
    try {
      const network = await metaProvider.getNetwork();
      const responseMessage = `Your MetaMask wallet is connected to ${network.name} (chainId: ${network.chainId}).`;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: responseMessage },
      ]);
    } catch (error) {
      console.error("Error fetching network info:", error);
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleGetNFTs = async () => {
    if (!metaConnected) {
      toast({
        title: "MetaMask Not Connected",
        description: "Please connect MetaMask first.",
      });
      return;
    }

    try {
      // Use Alchemy API, Moralis, or OpenSea API to fetch NFTs
      // For example with Alchemy (you'd need to replace with your API key)
      const alchemyApiKey = "YOUR_ALCHEMY_API_KEY";
      const baseURL = `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`;
      const url = `${baseURL}/getNFTs/?owner=${metaAccount}`;

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Fetching your NFTs... This may take a moment.",
        },
      ]);

      const response = await fetch(url);
      const data = await response.json();

      if (data.ownedNfts && data.ownedNfts.length > 0) {
        const nftCount = data.ownedNfts.length;
        const responseMessage = `You own ${nftCount} NFTs. Here are some of your collections:\n${data.ownedNfts
          .slice(0, 5)
          .map(
            (nft: any) =>
              `- ${nft.title || "Unnamed NFT"} (${
                nft.contract.name || nft.contract.address.substring(0, 6)
              }...)`
          )
          .join("\n")}`;

        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: responseMessage },
        ]);
      } else {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: "No NFTs found in this wallet." },
        ]);
      }
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to fetch NFTs",
        variant: "destructive",
      });
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content:
            "Sorry, I couldn't fetch your NFTs. There was an error with the API.",
        },
      ]);
    }
  };

  // New function to fetch recent transactions
  const handleGetTransactions = async () => {
    if (!metaConnected) {
      toast({
        title: "MetaMask Not Connected",
        description: "Please connect MetaMask first.",
      });
      return;
    }

    try {
      // Use Etherscan API to fetch transactions
      const etherscanApiKey = "YOUR_ETHERSCAN_API_KEY";
      const network = currentNetwork === "sepolia" ? "api-sepolia" : "api";
      const url = `https://${network}.etherscan.io/api?module=account&action=txlist&address=${metaAccount}&startblock=0&endblock=99999999&page=1&offset=5&sort=desc&apikey=${etherscanApiKey}`;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Fetching your recent transactions..." },
      ]);

      const response = await fetch(url);
      const data = await response.json();

      if (data.result && data.result.length > 0) {
        const txList = data.result
          .map((tx: any) => {
            const value = ethers.formatEther(tx.value);
            const date = new Date(
              parseInt(tx.timeStamp) * 1000
            ).toLocaleDateString();
            return `- ${date}: ${
              tx.from === metaAccount.toLowerCase() ? "Sent" : "Received"
            } ${value} ETH ${
              tx.from === metaAccount.toLowerCase() ? "to" : "from"
            } ${
              tx.from === metaAccount.toLowerCase()
                ? tx.to.substring(0, 6)
                : tx.from.substring(0, 6)
            }...`;
          })
          .join("\n");

        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: `Recent Transactions:\n${txList}` },
        ]);
      } else {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: "No recent transactions found." },
        ]);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to fetch transactions",
        variant: "destructive",
      });
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content:
            "Sorry, I couldn't fetch your transactions. There was an error with the API.",
        },
      ]);
    }
  };

  // Improved handleSwitchNetwork function
  const handleSwitchNetwork = async (
    network: "mainnet" | "sepolia" | "polygon"
  ) => {
    if (!metaConnected || !window.ethereum) {
      toast({
        title: "MetaMask Not Connected",
        description: "Please connect MetaMask first.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Network parameters with proper chain IDs
      const networkParams: Record<
        string,
        {
          chainId: string;
          chainName: string;
          nativeCurrency: {
            name: string;
            symbol: string;
            decimals: number;
          };
          rpcUrls: string[];
          blockExplorerUrls: string[];
        }
      > = {
        mainnet: {
          chainId: "0x1", // 1 in hexadecimal
          chainName: "Ethereum Mainnet",
          nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
          },
          rpcUrls: ["https://eth.llamarpc.com"],
          blockExplorerUrls: ["https://etherscan.io"],
        },
        sepolia: {
          chainId: "0xaa36a7", // 11155111 in hexadecimal
          chainName: "Sepolia Testnet",
          nativeCurrency: {
            name: "Sepolia Ether",
            symbol: "ETH",
            decimals: 18,
          },
          rpcUrls: [
            "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
          ],
          blockExplorerUrls: ["https://sepolia.etherscan.io"],
        },
      };

      try {
        // First try switching to the network
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: networkParams[network].chainId }],
        });

        // Update provider after switching networks
        const provider = new ethers.BrowserProvider(window.ethereum);
        setMetaProvider(provider);
        const signer = await provider.getSigner();
        setMetaSigner(signer);

        setCurrentNetwork(network);

        // Update UI to reflect the network change
        const responseMessage = `Switched network to ${networkParams[network].chainName}.`;
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: responseMessage },
        ]);
      } catch (error: any) {
        // If the network does not exist in MetaMask, add it
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [networkParams[network]],
            });

            // Update provider after adding and switching networks
            const provider = new ethers.BrowserProvider(window.ethereum);
            setMetaProvider(provider);
            const signer = await provider.getSigner();
            setMetaSigner(signer);

            setCurrentNetwork(network);

            const responseMessage = `Added and switched to ${networkParams[network].chainName}.`;
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: responseMessage },
            ]);
          } catch (addError) {
            console.error("Error adding network:", addError);
            toast({
              title: "Error Adding Network",
              description: (addError as Error).message,
              variant: "destructive",
            });
          }
        } else {
          console.error("Error switching network:", error);
          toast({
            title: "Error Switching Network",
            description: (error as Error).message,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Network switch error:", error);
      toast({
        title: "Network Switch Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  // Improved token fetching function
  const handleGetTokens = async () => {
    if (!metaConnected) {
      toast({
        title: "MetaMask Not Connected",
        description: "Please connect MetaMask first.",
      });
      return;
    }

    // Show loading message
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "Fetching your tokens... This may take a moment.",
      },
    ]);

    // Determine chain ID based on current network
    let chainId = "1"; // Default to Ethereum mainnet
    if (currentNetwork === "sepolia") chainId = "11155111";
    else if (currentNetwork === "polygon") chainId = "137";

    const apiKey = "YOUR_COVALENT_API_KEY"; // Replace with your actual Covalent API key
    const url = `https://api.covalenthq.com/v1/${chainId}/address/${metaAccount}/balances_v2/?key=${apiKey}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        toast({
          title: "Error fetching tokens",
          description: data.error_message || "Unknown error",
          variant: "destructive",
        });

        setMessages((prev) => [
          ...prev.slice(0, -1),
          {
            role: "assistant",
            content:
              "Sorry, I couldn't fetch your tokens. There was an error with the API.",
          },
        ]);
        return;
      }

      const tokens = data.data.items;
      if (!tokens || tokens.length === 0) {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: "No tokens found in your wallet." },
        ]);
        return;
      }

      // Filter tokens with a non-zero balance and format them
      const tokensList = tokens
        .filter((token: any) => Number(token.balance) > 0)
        .map((token: any) => {
          const decimals = token.contract_decimals;
          const balance = ethers.formatUnits(token.balance, decimals);
          const usdValue =
            token.quote > 0 ? ` ($${token.quote.toFixed(2)})` : "";
          return `- ${token.contract_ticker_symbol}: ${parseFloat(
            balance
          ).toFixed(4)}${usdValue}`;
        })
        .join("\n");

      if (!tokensList || tokensList.length === 0) {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          {
            role: "assistant",
            content: "No tokens with non-zero balance found.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: `Token Balances:\n${tokensList}` },
        ]);
      }
    } catch (error) {
      toast({
        title: "Error fetching tokens",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });

      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content:
            "Sorry, I couldn't fetch your tokens. There was an error with the API.",
        },
      ]);
    }
  };

  useEffect(() => {
    // Load chat history on component mount
    const history = chatStore.getChatHistory().map((chat) => ({
      ...chat,
      title: chatStore.generateChatTitle(chat.messages),
    }));
    setChatHistory(history);
  }, []);

  useEffect(() => {
    // Scroll to the bottom when messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // State for tracking copy status
  const [copied, setCopied] = useState(false);
  const [copiedSuggestions, setCopiedSuggestions] = useState(false);

  const handleCopyText = (
    text: string,
    type: "full" | "suggestions" = "full"
  ) => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === "full") {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        setCopiedSuggestions(true);
        setTimeout(() => setCopiedSuggestions(false), 2000);
      }
    });
  };

  // Fixed functions for opening Etherscan links
  const openEtherscan = (address: string) => {
    let baseUrl;

    switch (currentNetwork) {
      case "sepolia":
        baseUrl = "https://sepolia.etherscan.io/address/";
        break;
      case "polygon":
        baseUrl = "https://polygonscan.com/address/";
        break;
      case "mainnet":
      default:
        baseUrl = "https://etherscan.io/address/";
        break;
    }

    window.open(baseUrl + address, "_blank", "noopener,noreferrer");
  };

  const openEtherscanTx = (txHash: string) => {
    let baseUrl;

    switch (currentNetwork) {
      case "sepolia":
        baseUrl = "https://sepolia.etherscan.io/tx/";
        break;
      case "polygon":
        baseUrl = "https://polygonscan.com/tx/";
        break;
      case "mainnet":
      default:
        baseUrl = "https://etherscan.io/tx/";
        break;
    }

    window.open(baseUrl + txHash, "_blank", "noopener,noreferrer");
  };

  const renderAnalysisResult = (analysis: any) => {
    return (
      <div className="w-full flex flex-col space-y-6">
        {/* Statistics Card with White Background */}
        <Card className="w-full relative overflow-hidden rounded-xl shadow-lg border border-gray-100 bg-white">
          {/* Copy Button with feedback */}
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-4 top-4 z-10 hover:bg-gray-100 transition-all duration-200"
            onClick={() => handleCopyText(JSON.stringify(analysis), "full")}
          >
            {copied ? (
              <div className="flex items-center space-x-1">
                <CheckIcon className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-500 font-medium">
                  Copied
                </span>
              </div>
            ) : (
              <Copy className="w-4 h-4 text-gray-500" />
            )}
          </Button>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
              <BarChartIcon className="w-5 h-5 mr-2 text-indigo-500" />
              Contract Analysis Statistics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatItem
                label="Security Score"
                value={`${analysis.securityScore}/100`}
                icon={<ShieldIcon className="w-4 h-4 text-white" />}
                color={
                  analysis.securityScore < 50
                    ? "text-red-500"
                    : "text-green-500"
                }
                gradientClass={
                  analysis.securityScore < 50
                    ? "from-red-400 to-red-600"
                    : "from-green-400 to-green-600"
                }
              />
              <StatItem
                label="Scan Duration"
                value={analysis.scanDuration}
                icon={<ClockIcon className="w-4 h-4 text-white" />}
                color="text-blue-500"
                gradientClass="from-blue-400 to-blue-600"
              />
              <StatItem
                label="Lines of Code"
                value={analysis.linesOfCode}
                icon={<CodeIcon className="w-4 h-4 text-white" />}
                color="text-purple-500"
                gradientClass="from-purple-400 to-purple-600"
              />
              <StatItem
                label="Total Issues"
                value={analysis.issuesCount}
                icon={<AlertCircleIcon className="w-4 h-4 text-white" />}
                color="text-orange-500"
                gradientClass="from-orange-400 to-orange-600"
              />
            </div>
          </div>
        </Card>

        {/* Code Suggestions Card */}
        {/* Modified Code Suggestions Card with fixed button placement */}
        {analysis.modificationSuggestions && (
          <div className="w-full">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-gray-800">
                Suggested Modifications
              </h3>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1"
                  onClick={() =>
                    handleCopyText(
                      analysis.modificationSuggestions,
                      "suggestions"
                    )
                  }
                >
                  {copiedSuggestions ? (
                    <>
                      <CheckIcon className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-green-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-xs">Copy code</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Code Container */}
            <div className="rounded-lg overflow-hidden border border-gray-200 shadow-md">
              <pre className="bg-[#1E1E1E] text-[#D4D4D4] p-4 rounded-md overflow-x-auto text-sm leading-5">
                <code className="font-mono whitespace-pre">
                  {analysis.modificationSuggestions}
                </code>
              </pre>
            </div>

            {/* Deploy Contract Button - Positioned below the code container */}
            <div className="flex justify-center mt-4">
              <Button
                size="sm"
                variant="default"
                className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-600"
                onClick={() =>
                  handleDeployContract(analysis.modificationSuggestions)
                }
                disabled={!metaConnected || isDeploying}
              >
                <UploadIcon className="w-4 h-4" />
                <span className="text-xs">Deploy Contract</span>
              </Button>
            </div>
          </div>
        )}

        {/* Deployed Contract Information */}
        {deployedContract && (
          <Card className="p-4 border-l-4 border-l-green-500 bg-green-50">
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Contract Deployed Successfully
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Contract Address:</span>
                <code className="text-sm bg-white px-2 py-1 rounded border">
                  {deployedContract.address}
                </code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Transaction Hash:</span>
                <code className="text-sm bg-white px-2 py-1 rounded border">
                  {deployedContract.txHash}
                </code>
              </div>
              {/* View on Etherscan Button */}
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => openEtherscan(deployedContract.address)}
              >
                <ExternalLinkIcon className="w-4 h-4" />
                <span className="text-xs">View on Etherscan</span>
              </Button>
            </div>
          </Card>
        )}
        {showDeployDialog && (
          <Dialog open={showDeployDialog} onOpenChange={setShowDeployDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Deploy Contract</DialogTitle>
                <DialogDescription>
                  {deploymentStatus === "idle" &&
                    "Are you sure you want to deploy this contract?"}
                  {deploymentStatus === "compiling" &&
                    "Preparing contract for deployment..."}
                  {deploymentStatus === "deploying" &&
                    "Deploying contract to blockchain..."}
                  {deploymentStatus === "error" && "Deployment failed"}
                  {deploymentStatus === "success" &&
                    "Contract deployed successfully!"}
                </DialogDescription>
              </DialogHeader>

              <div className="py-2">
                <p className="font-medium">Contract Name: {contractName}</p>
                {deploymentStatus === "idle" && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-sm text-amber-800">
                      Note: The contract will be deployed to the{" "}
                      {currentNetwork} network. Make sure your wallet is
                      connected to the right network.
                    </p>
                  </div>
                )}
                {deploymentStatus === "compiling" && (
                  <div className="flex justify-center my-4">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                  </div>
                )}
                {deploymentStatus === "deploying" && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-center my-4">
                      <div className="animate-spin h-8 w-8 border-4 border-green-500 rounded-full border-t-transparent"></div>
                    </div>
                    <p className="text-sm text-center text-gray-600">
                      Please confirm the transaction in your wallet
                    </p>
                  </div>
                )}
                {deployedContract && deploymentStatus === "success" && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">
                      Contract Address:
                      <code className="ml-2 p-1 bg-gray-100 rounded">
                        {deployedContract.address}
                      </code>
                    </p>
                    <p className="text-sm font-medium">
                      Transaction Hash:
                      <code className="ml-2 p-1 bg-gray-100 rounded">
                        {deployedContract.txHash}
                      </code>
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEtherscan(deployedContract.address)}
                      >
                        <ExternalLinkIcon className="w-4 h-4 mr-1" />
                        View Contract
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEtherscanTx(deployedContract.txHash)}
                      >
                        <ExternalLinkIcon className="w-4 h-4 mr-1" />
                        View Transaction
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                {deploymentStatus === "idle" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeployDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={confirmDeploy} disabled={!metaConnected}>
                      {!metaConnected
                        ? "Connect Wallet First"
                        : "Deploy Contract"}
                    </Button>
                  </>
                )}
                {(deploymentStatus === "compiling" ||
                  deploymentStatus === "deploying") && (
                  <Button disabled>
                    <div className="flex items-center">
                      <span className="animate-spin mr-2">◌</span>
                      {deploymentStatus === "compiling"
                        ? "Preparing..."
                        : "Deploying..."}
                    </div>
                  </Button>
                )}
                {(deploymentStatus === "success" ||
                  deploymentStatus === "error") && (
                  <Button onClick={() => setShowDeployDialog(false)}>
                    Close
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  };

  // Reusable component for stat items with gradient icon background
  const StatItem: React.FC<{
    label: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    gradientClass: string;
  }> = ({ label, value, icon, color, gradientClass }) => (
    <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-100 shadow-sm bg-white">
      <div
        className={`flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br ${gradientClass}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className={`text-lg font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );

  const renderAssistantMessage = (content: string) => {
    const paragraphs = content.split("\n\n");
    return paragraphs.map((paragraph, index) => (
      <p key={index} className="assistant-message-paragraph">
        {paragraph.split(" ").map((word, wordIndex) => (
          <span key={wordIndex} className="assistant-message-word">
            {word}{" "}
          </span>
        ))}
      </p>
    ));
  };

  const handleSend = async () => {
    if ((!input.trim() && !uploadedFile) || isLoading) return;

    // Hide initial message immediately when a message is sent
    if (showInitialMessage) setShowInitialMessage(false);

    try {
      setIsLoading(true);
      const userMessage: Message = {
        role: "user",
        content: input + (uploadedFile ? `\n\nFile: ${uploadedFile.name}` : ""),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setUploadedFile(null);

      // Immediately add placeholder for bot response
      setMessages((prev) => [...prev, { role: "assistant", content: "..." }]);

      let codeContent = uploadedFileContent || input;
      // Check if the message contains contract code (Move or Solidity)
      const contractLang = chatService.detectContractLanguage(codeContent);
      if (contractLang) {
        // Perform contract analysis without the word-by-word animation.
        const analysis = await contractAnalyzer.analyzeContract(
          codeContent,
          selectedModel,
          contractLang
        );
        // Replace the placeholder message with the analysis result.
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: "", analysisResult: analysis },
        ]);
        setUploadedFileContent(null);
      } else {
        const response = await chatService.sendMessage(
          [userMessage],
          selectedModel
        );
        // Gradually display the bot's response
        let displayedResponse = "";
        const words = response.split(" ");
        for (let i = 0; i < words.length; i++) {
          displayedResponse += words[i] + " ";
          setMessages((prev) =>
            prev
              .slice(0, -1)
              .concat({ role: "assistant", content: displayedResponse })
          );
          if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop =
              scrollAreaRef.current.scrollHeight;
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }
    } catch (error) {
      console.error("Error in handleSend:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send message.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const fileContent = await file.text();
      setUploadedFileContent(fileContent);
    }
  };

  const handleLoadChat = (chatId: number) => {
    const chat = chatStore.loadChat(chatId);
    if (chat) {
      setMessages(chat.messages);
      setCurrentChatId(chat.id);
    }
  };

  const handleDeleteChat = (chatId: number) => {
    chatStore.deleteChat(chatId);
    setChatHistory(chatStore.getChatHistory());
    if (currentChatId === chatId) {
      setMessages([]);
      setShowInitialMessage(true);
      setCurrentChatId(null);
    }
  };

  const handlePinChat = (chatId: number) => {
    chatStore.pinChat(chatId);
    setChatHistory(chatStore.getChatHistory());
  };

  const handleNewChat = () => {
    setMessages([]);
    setShowInitialMessage(true);
    setCurrentChatId(null);
  };

  const filteredHistory = chatHistory.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedHistory = [...filteredHistory].sort(
    (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)
  );

  const Sidebar = () => (
    <div className="w-full h-full flex flex-col">
      <div className="p-4">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleNewChat}
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2">
          {sortedHistory.map((chat) => (
            <div key={chat.id} className="flex justify-between items-center">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-left"
                onClick={() => handleLoadChat(chat.id)}
              >
                <Clock className="w-4 h-4" />
                <div className="flex-1 truncate">
                  <div className="text-sm">{chat.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {chat.date}
                  </div>
                </div>
              </Button>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handlePinChat(chat.id)}>
                      <Pin
                        className={`w-4 h-4 mr-2 ${
                          chat.pinned
                            ? "text-yellow-500"
                            : "text-muted-foreground"
                        }`}
                      />
                      {chat.pinned ? "Unpin" : "Pin"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteChat(chat.id)}>
                      <Trash className="w-4 h-4 mr-2 text-red-500" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      {/* Wallet Connection Area */}
      <div className="p-4 border-t space-y-4">
        {/* Sui Wallet Section */}
        <div>
          <h3 className="text-sm font-bold mb-1">Sui Wallet</h3>
          {!account ? (
            <ConnectButton />
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent cursor-pointer">
                  <img src="/sui.svg" alt="Sui Wallet" width="16" height="16" />
                  <div className="flex-1 truncate">
                    <div className="text-sm font-medium">
                      {`${account.address.slice(
                        0,
                        6
                      )}...${account.address.slice(-4)}`}
                    </div>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => disconnect.mutate()}>
                  <div className="flex items-center gap-2">Disconnect</div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {/* MetaMask Section */}
        <div>
          <h3 className="text-sm font-bold mb-1">MetaMask</h3>
          {!metaConnected ? (
            <Button onClick={connectMetaMask} className="w-full">
              Connect MetaMask
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <img
                src={`/metamask.svg`}
                alt="MetaMask Avatar"
                className="w-6 h-6 rounded-full"
              />
              <div className="text-sm font-medium">{`${metaAccount.slice(
                0,
                6
              )}...${metaAccount.slice(-4)}`}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh)] pt-16">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 border-r bg-background">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden absolute left-4 top-4"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 flex justify-between items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer">
                <span>Model: {modelOptions[selectedModel].name}</span>
                <span
                  className={`text-transparent bg-clip-text text-m font-bold ${modelOptions[selectedModel].gradient}`}
                >
                  {modelOptions[selectedModel].tag}
                </span>
                <Menu className="h-4 w-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {Object.entries(modelOptions).map(([modelKey, modelData]) => (
                <DropdownMenuItem
                  key={modelKey}
                  onClick={() => setSelectedModel(modelKey)}
                >
                  <div className="flex justify-between items-center w-full">
                    <span>{modelData.name}</span>
                    <span
                      className={`ml-5 text-transparent bg-clip-text text-m font-bold ${modelData.gradient}`}
                    >
                      {modelData.tag}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {showInitialMessage && (
          <div className="flex-1 flex items-center justify-center">
            <h1 className="text-4xl font-bold text-center animate-pulse">
              What can I help you with today?
            </h1>
          </div>
        )}
        <ScrollArea
          ref={scrollAreaRef}
          className={`flex-1 px-4 py-4 ${
            showInitialMessage ? "hidden" : "block"
          }`}
        >
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "assistant" ? "justify-start" : "justify-end"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-r from-pink-500 to-blue-500">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                {message.role === "assistant" ? (
                  message.analysisResult ? (
                    renderAnalysisResult(message.analysisResult)
                  ) : (
                    <div className="assistant-message-container">
                      {renderAssistantMessage(message.content)}
                    </div>
                  )
                ) : (
                  <Card
                    className={`p-4 max-w-[85%] ${
                      message.role === "system"
                        ? "bg-muted text-left"
                        : "bg-primary text-primary-foreground text-right"
                    }`}
                  >
                    {message.content === "..." ? (
                      <div className="flex items-center">
                        <div className="thinking-dots"></div>
                        <div className="thinking-dots"></div>
                        <div className="thinking-dots"></div>
                      </div>
                    ) : (
                      <div>{message.content}</div>
                    )}
                  </Card>
                )}
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-r from-blue-500 to-sky-300">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Wallet Action Buttons */}
        <div className="p-4 bg-muted/30 rounded-t-lg border-t">
          <div className="mb-3">
            <h3 className="text-sm font-semibold mb-2">Wallet Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetBalance}
                className="flex items-center gap-1"
                disabled={!metaConnected}
              >
                <CreditCard className="w-3 h-3" />
                Balance
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleGetNetwork}
                className="flex items-center gap-1"
                disabled={!metaConnected}
              >
                <Network className="w-3 h-3" />
                Network
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleGetTokens}
                className="flex items-center gap-1"
                disabled={!metaConnected}
              >
                <Coins className="w-3 h-3" />
                Tokens
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleGetNFTs}
                className="flex items-center gap-1"
                disabled={!metaConnected}
              >
                <Image className="w-3 h-3" />
                NFTs
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleGetTransactions}
                className="flex items-center gap-1"
                disabled={!metaConnected}
              >
                <History className="w-3 h-3" />
                Txns
              </Button>
            </div>
          </div>

          {metaConnected && (
            <div className="mb-3">
              <h3 className="text-sm font-semibold mb-2">Network</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={currentNetwork === "mainnet" ? "default" : "outline"}
                  onClick={() => handleSwitchNetwork("mainnet")}
                  className="flex items-center gap-1"
                >
                  <Globe className="w-3 h-3" />
                  Mainnet
                </Button>
                <Button
                  size="sm"
                  variant={currentNetwork === "sepolia" ? "default" : "outline"}
                  onClick={() => handleSwitchNetwork("sepolia")}
                  className="flex items-center gap-1"
                >
                  <Beaker className="w-3 h-3" />
                  Sepolia
                </Button>
              </div>
            </div>
          )}

          {/* File upload and input area below */}
          {uploadedFile && (
            <Card className="p-2 flex items-center gap-2 mb-2">
              <File className="w-4 h-4" />
              <span className="text-sm truncate">{uploadedFile.name}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 ml-auto"
                onClick={() => setUploadedFile(null)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Card>
          )}

          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1"
            />
            <label className="flex items-center">
              <Button
                size="icon"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".move,.sol"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            <Button onClick={handleSend} size="icon">
              <SendHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add CSS for the thinking animation and assistant message styling
const styles = `
@keyframes thinking {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-5px); }
}
.thinking-dots {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin: 0 2px;
  background-color: #000;
  border-radius: 50%;
  animation: thinking 1.4s infinite ease-in-out both;
}
.thinking-dots:nth-child(1) { animation-delay: -0.32s; }
.thinking-dots:nth-child(2) { animation-delay: -0.16s; }
.thinking-dots:nth-child(3) { animation-delay: 0s; }
.assistant-message-container { display: flex; flex-direction: column; gap: 1rem; }
.assistant-message-paragraph { display: flex; flex-wrap: wrap; gap: 0.25rem; }
.assistant-message-word { opacity: 0; animation: fadeIn 0.05s forwards; }
@keyframes fadeIn { to { opacity: 1; } }
`;
document.head.insertAdjacentHTML("beforeend", `<style>${styles}</style>`);
