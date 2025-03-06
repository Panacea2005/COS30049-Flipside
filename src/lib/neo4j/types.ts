export interface WalletNode {
  addressId: string;
  type: 'eoa' | 'contract';
  firstSeen: string;
  lastSeen: string;
}
export interface Transaction {
  // Core transaction properties
  hash: string;
  fromAddress: string;
  toAddress: string;
  value: string;
  gas: string | number;
  gasUsed: string | number;
  gasPrice: string | number;
  blockNumber: number | string;
  
  // Timestamp handling (supporting both formats)
  timestamp: string;
  timeStamp?: string;  // Alternative property name found in some APIs
  
  // Optional address properties (alternative formats)
  from?: string;
  to?: string;
  
  // Status field used in the component
  status?: 'success' | 'pending' | 'failed';
  
  // Optional nonce field used in the component
  nonce?: number | string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface GraphNode {
  id: string;
  isSearched?: boolean;
  type?: 'eoa' | 'contract';
  // Additional node properties that might be useful
  label?: string;
  balance?: string;
  totalTransactions?: number;
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
  fromAddress?: string;
  to: string;
  toAddress?: string;
  value: string;
  gas: string;
  gasPrice: string;
  timeStamp: string;
  timestamp?: string;
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
  totalTransactions?: number;
  balance?: string;
  // Added fx and fy which are used by D3 for fixed positions during dragging
  fx?: number | null;
  fy?: number | null;
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

// Interface for the hooks and components
export interface GraphDataHook {
  graphData: { nodes: NodeDatum[]; links: LinkDatum[] };
  loading: boolean;
  error: string | null;
  fetchAddressConnections: (address: string) => Promise<{ nodes: NodeDatum[]; links: LinkDatum[] }>;
}