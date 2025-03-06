import { useState, useEffect } from 'react';
import { WalletSearch } from '../common/WalletSearch';
import { TransactionGraph } from './TransactionGraph';
import { TransactionModal } from '../TransactionHistory/TransactionModal';
import { AddressInfoSection } from './AddressInfoSection';
import { Transaction } from '../../../../lib/neo4j/types';
import { neo4jClient } from '../../../../lib/neo4j/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Clock, ExternalLink } from 'lucide-react';
import { fetchEtherscanTransactions } from '../../../../lib/etherscan/etherscanTransactionService';

const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const formatValue = (value: string) => {
  return (parseFloat(value) / 1e18).toFixed(5);
};

const getTransactionTypeColor = (transaction: Transaction, currentAddress?: string | null) => {
  // Determine if transaction is incoming or outgoing based on current address
  if (currentAddress) {
    const isOutgoing = transaction.fromAddress.toLowerCase() === currentAddress.toLowerCase();
    const isIncoming = transaction.toAddress.toLowerCase() === currentAddress.toLowerCase();
    
    if (isOutgoing) return "bg-orange-100 text-orange-800";
    if (isIncoming) return "bg-green-100 text-green-800";
  }
  
  // Fallback based on value
  const value = parseFloat(transaction.value);
  if (value === 0) return "bg-purple-100 text-purple-800"; // Contract interaction
  if (value > 1e18) return "bg-blue-100 text-blue-800"; // High value
  return "bg-gray-100 text-gray-800"; // Normal transfer
};

export const VisualizationPage = () => {
  const [searchedAddress, setSearchedAddress] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<'neo4j' | 'etherscan'>('neo4j');

  useEffect(() => {
    async function fetchTransactions() {
      if (!searchedAddress) return;
      
      setIsLoading(true);
      
      try {
        // First try to get transactions from Neo4j
        const neo4jTransactions = await neo4jClient.getTransactionsForAddress(searchedAddress);
        
        if (neo4jTransactions && neo4jTransactions.length > 0) {
          setTransactions(neo4jTransactions);
          setDataSource('neo4j');
        } else {
          // If no Neo4j data, fetch from Etherscan
          const etherscanTransactions = await fetchEtherscanTransactions(1, 100, searchedAddress);
          
          if (etherscanTransactions && etherscanTransactions.length > 0) {
            setTransactions(etherscanTransactions);
            setDataSource('etherscan');
          } else {
            setTransactions([]);
          }
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        
        // Fallback to Etherscan if Neo4j fails
        try {
          const etherscanTransactions = await fetchEtherscanTransactions(1, 100, searchedAddress);
          
          if (etherscanTransactions && etherscanTransactions.length > 0) {
            setTransactions(etherscanTransactions);
            setDataSource('etherscan');
          } else {
            setTransactions([]);
          }
        } catch (etherscanError) {
          console.error('Error fetching from Etherscan:', etherscanError);
          setTransactions([]);
        }
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchTransactions();
  }, [searchedAddress]);

  return (
    <div className="min-h-screen bg-gray-50">
      <h1 className="text-3xl font-semibold leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-sky-800">Transaction Visualization</h1>
      <div className="p-6">
        {/* Search Bar */}
        <div className="mb-6">
          <WalletSearch onSearch={setSearchedAddress} isLoading={isLoading} />
        </div>

        {/* Address Info Section - Only shown when address is searched */}
        {searchedAddress && (
          <>
            <div className="mb-6">
              <AddressInfoSection address={searchedAddress} />
              {dataSource === 'etherscan' && (
                <div className="mt-2 text-xs text-gray-500 italic">
                  Data source: Etherscan
                </div>
              )}
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Graph Section */}
              <div className="w-full lg:w-7/12 bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <h2 className="text-2xl font-semibold leading-tight tracking-tight mb-4">Transaction Graph</h2>
                  <div className="h-[600px]"> {/* Fixed height for graph container */}
                    <TransactionGraph
                      address={searchedAddress}
                      onNodeClick={setSearchedAddress}
                      onTransactionSelect={setSelectedTransaction}
                    />
                  </div>
                </div>
              </div>

              {/* Enhanced Transactions Section */}
              <div className="w-full lg:w-5/12 bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  <h2 className="text-2xl font-semibold leading-tight tracking-tight mb-4 flex items-center">
                    Recent Transactions
                    {isLoading && (
                      <span className="ml-2">
                        <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                    )}
                  </h2>
                  <div className="h-[600px]"> {/* Fixed height for transactions container */}
                    <ScrollArea className="h-full">
                      {isLoading ? (
                        // Loading skeletons
                        <div className="space-y-3 pr-4">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="p-4 border border-gray-100 rounded-lg">
                              <div className="flex justify-between mb-3">
                                <Skeleton className="h-5 w-24 bg-gray-100 rounded" />
                                <Skeleton className="h-5 w-20 bg-gray-100 rounded" />
                              </div>
                              <div className="flex items-center space-x-2 mb-2">
                                <Skeleton className="h-4 w-28 bg-gray-100 rounded" />
                                <Skeleton className="h-3 w-3 rounded-full bg-gray-100" />
                                <Skeleton className="h-4 w-28 bg-gray-100 rounded" />
                              </div>
                              <Skeleton className="h-3 w-32 bg-gray-100 rounded" />
                            </div>
                          ))}
                        </div>
                      ) : transactions.length > 0 ? (
                        <div className="space-y-3 pr-4">
                          {transactions.map((transaction) => {
                            const isOutgoing = searchedAddress && transaction.fromAddress.toLowerCase() === searchedAddress.toLowerCase();
                            const isIncoming = searchedAddress && transaction.toAddress.toLowerCase() === searchedAddress.toLowerCase();
                            
                            return (
                              <Card 
                                key={transaction.hash}
                                className="border border-gray-100 hover:border-blue-200 transition-all duration-300 hover:shadow-md group cursor-pointer"
                                onClick={() => setSelectedTransaction(transaction)}
                              >
                                <CardContent className="p-4">
                                  {/* Transaction header with hash and value */}
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <Badge className={getTransactionTypeColor(transaction, searchedAddress)}>
                                        {isOutgoing ? "Sent" : isIncoming ? "Received" : "Transfer"}
                                      </Badge>
                                      <span className="text-gray-500 text-sm font-mono">
                                        {formatAddress(transaction.hash)}
                                      </span>
                                    </div>
                                    <span className={`font-semibold text-base ${isOutgoing ? "text-red-600" : isIncoming ? "text-green-600" : "text-gray-800"}`}>
                                      {formatValue(transaction.value)} ETH
                                    </span>
                                  </div>
                                  
                                  {/* From/To addresses */}
                                  <div className="flex items-center gap-1 text-sm mb-2">
                                    <div className={`font-mono ${isOutgoing ? "text-gray-900 font-medium" : "text-gray-600"}`}>
                                      {formatAddress(transaction.fromAddress)}
                                    </div>
                                    <ArrowRight className="h-3 w-3 text-gray-400" />
                                    <div className={`font-mono ${isIncoming ? "text-gray-900 font-medium" : "text-gray-600"}`}>
                                      {formatAddress(transaction.toAddress)}
                                    </div>
                                  </div>
                                  
                                  {/* Timestamp */}
                                  <div className="flex items-center text-xs text-gray-500 mt-1">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatTimestamp(transaction.timestamp)}
                                    <ExternalLink className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center text-gray-500 p-8">
                            <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-lg font-medium">No transactions found</p>
                            <p className="text-sm mt-1">Try searching for a different address</p>
                          </div>
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Transaction Modal */}
      {selectedTransaction && (
        <TransactionModal 
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
};