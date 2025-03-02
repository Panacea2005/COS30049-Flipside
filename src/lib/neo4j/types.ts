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
  from?: string; 
  to?: string; 
  value: string;
  gas: string | number;
  gasUsed?: string | number;
  gasPrice: string | number;
  blockNumber: number | string;
  timestamp: string; 
  timeStamp?: string; 
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface GraphNode {
  id: string;
  isSearched?: boolean;
  type?: 'eoa' | 'contract';
}

export interface GraphLink {
  source: string;
  target: string;
  value: number;
  transactions: number;
  direction: 'in' | 'out';
  firstTransaction: string;
  lastTransaction: string;
  hash?: string;
  transaction?: Transaction;
}

export interface EtherscanTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  timeStamp: string;
  blockNumber: string;
  gasUsed?: string;
  isError?: string;
  txreceipt_status?: string;
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

// D3 specific types for better type checking
export interface NodeDatum extends d3.SimulationNodeDatum {
  id: string;
  value?: number;
  isSearched?: boolean;
  type?: 'eoa' | 'contract';
}

export interface LinkDatum extends d3.SimulationLinkDatum<NodeDatum> {
  value: number;
  transactions?: number;
  direction?: 'in' | 'out';
  firstTransaction?: string;
  lastTransaction?: string;
  hash?: string;
  transaction?: Transaction;
}