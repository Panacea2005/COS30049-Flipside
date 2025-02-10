export interface WalletNode {
  addressId: string;
  type: 'eoa' | 'contract';
  firstSeen: string;
  lastSeen: string;
}

export interface Transaction {
  hash: string;
  fromAddress: string;
  toAddress: string;
  value: string;
  timestamp: string;
  formattedDate: string;
  blockNumber: number;
  gas: number;
  gasUsed: number;
  gasPrice: number;
}

export interface GraphData {
  nodes: { id: string }[];
  links: GraphLink[];
}

export interface GraphLink {
  source: string;
  target: string;
  value: number;
  transactions: number;
  direction: 'in' | 'out';
  firstTransaction: string;
  lastTransaction: string;
}

export interface AddressInfo {
  addressId: string;
  type: 'eoa' | 'contract';
  balance: string;
  firstSeen: string;
  lastSeen: string;
  totalTransactions: number;
  sentTransactions: number;
  receivedTransactions: number;
  totalSentValue: string;
  totalReceivedValue: string;
}

export interface BalanceData {
  date: string;
  balance: number;
}

export interface GasData {
  date: string;
  transactionFee: number;
  totalTransactionFee: number; 
}