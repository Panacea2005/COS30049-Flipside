import { useState } from 'react'
import {
  BrowserProvider,
  parseUnits,
  Contract,
  // You can import other utilities as needed:
  // parseEther, formatEther, getAddress, isAddress, etc.
} from 'ethers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Minimal ERC-20 ABI for transfer
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) external returns (bool)',
]

export default function TradePage() {
  const [tokenAddress, setTokenAddress] = useState('')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [network, setNetwork] = useState<'mainnet' | 'sepolia'>('mainnet')
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState('')

  const handleSend = async () => {
    if (!window.ethereum) {
      alert('MetaMask not detected!')
      return
    }

    setLoading(true)

    try {
      // Ask user to connect if not already
      await window.ethereum.request({ method: 'eth_requestAccounts' })

      // ethers v6 uses BrowserProvider
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      // Check current chain
      const currentNetwork = await provider.getNetwork()
      const currentChainId = Number(currentNetwork.chainId) // chainId is a BigInt in v6

      // Desired chain IDs
      const desiredChainId = network === 'mainnet' ? 1 : 11155111 // 11155111 = Sepolia

      // If not on desired network, prompt user to switch
      if (currentChainId !== desiredChainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x' + desiredChainId.toString(16) }],
          })
        } catch (switchError: any) {
          alert('Failed to switch network. Please switch manually.')
          setLoading(false)
          return
        }
      }

      // Re-check chain after switching
      const newProvider = new BrowserProvider(window.ethereum)
      const newSigner = await newProvider.getSigner()

      // Create contract instance
      const contract = new Contract(tokenAddress, ERC20_ABI, newSigner)

      // Parse amount with 18 decimals (adjust if your token uses different decimals)
      const parsedAmount = parseUnits(amount, 18)

      // Send transaction
      const txResponse = await contract.transfer(recipient, parsedAmount)
      const receipt = await txResponse.wait()

      // Transaction hash is on the txResponse or the receipt
      setTxHash(receipt.transactionHash)
    } catch (error: any) {
      console.error(error)
      alert('Transaction failed: ' + error.message)
    }

    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Token Trading</h1>
        <div className="space-y-4">
          <div>
            <Label htmlFor="tokenAddress">Token Contract Address</Label>
            <Input
              id="tokenAddress"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              placeholder="0x..."
            />
          </div>
          <div>
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
            />
          </div>
          <div>
            <Label htmlFor="network">Network</Label>
            <select
              id="network"
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm
                         focus:ring-blue-500 focus:border-blue-500"
              value={network}
              onChange={(e) => setNetwork(e.target.value as 'mainnet' | 'sepolia')}
            >
              <option value="mainnet">Mainnet</option>
              <option value="sepolia">Sepolia Testnet</option>
            </select>
          </div>
          <Button onClick={handleSend} disabled={loading}>
            {loading ? 'Sending...' : 'Send Tokens'}
          </Button>
          {txHash && (
            <div className="mt-4">
              <p className="text-sm text-green-600">Transaction sent!</p>
              <p className="text-sm break-all">Tx Hash: {txHash}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
