interface WalletAdapter {
    name: string;
    icon: string;
    connected: boolean;
    connecting: boolean;
    publicKey: string | null;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getAccounts(): Promise<string[]>;
    getBalance(): Promise<string>;
  }
  
  class SuiWalletService {
    private wallet: WalletAdapter | null = null;
  
    private async detectWallet(): Promise<boolean> {
      // Check if Sui wallet extension is installed
      return !!(window as any).suiWallet;
    }
  
    private shortenAddress(address: string): string {
      if (!address) return '';
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
  
    private generateAvatarUrl(address: string): string {
      return `https://avatars.dicebear.com/api/identicon/${address}.svg`;
    }
  
    async connectWallet(): Promise<{ 
      address: string; 
      shortAddress: string;
      avatar: string;
    }> {
      try {
        const isWalletAvailable = await this.detectWallet();
        
        if (!isWalletAvailable) {
          throw new Error('Sui Wallet extension is not installed');
        }
  
        // Initialize wallet adapter
        const wallet = (window as any).suiWallet;
        
        try {
          await wallet.connect();
          const accounts = await wallet.getAccounts();
          
          if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found');
          }
  
          const address = accounts[0];
          const shortAddress = this.shortenAddress(address);
          const avatar = this.generateAvatarUrl(address);
  
          // Store wallet instance
          this.wallet = wallet;
  
          return {
            address,
            shortAddress,
            avatar
          };
        } catch (error) {
          throw new Error('Failed to connect to wallet');
        }
      } catch (error) {
        console.error('Wallet connection error:', error);
        throw error;
      }
    }
  
    async disconnect(): Promise<void> {
      if (this.wallet) {
        try {
          await this.wallet.disconnect();
          this.wallet = null;
        } catch (error) {
          console.error('Failed to disconnect wallet:', error);
          throw error;
        }
      }
    }
  
    async getBalance(): Promise<string> {
      if (!this.wallet) {
        throw new Error('Wallet not connected');
      }
  
      try {
        const balance = await this.wallet.getBalance();
        return balance;
      } catch (error) {
        console.error('Failed to get balance:', error);
        throw error;
      }
    }
  }
  
  export const suiWalletService = new SuiWalletService();