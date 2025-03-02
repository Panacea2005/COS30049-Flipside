import { useState, useEffect } from 'react';
import { WalletSearch } from '../common/WalletSearch';
import { TransactionGraph } from './TransactionGraph';
import { TransactionModal } from '../TransactionHistory/TransactionModal';
import { AddressInfoSection } from './AddressInfoSection';
import { Transaction } from '../../../../lib/neo4j/types';
import { neo4jClient } from '../../../../lib/neo4j/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fetchEtherscanTransactions } from '../../../../lib/etherscan/etherscanTransactionService';

const formatAddress = (address: string) => {
  return `${address.slice(0, 4)}...${address.slice(-3)}`;
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

              {/* Transactions Section */}
              <div className="w-full lg:w-5/12 bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <h2 className="text-2xl font-semibold leading-tight tracking-tight mb-4">
                    Recent Transactions
                    {isLoading && <span className="ml-2 text-sm text-gray-400">(Loading...)</span>}
                  </h2>
                  <div className="h-[600px]"> {/* Fixed height for transactions container */}
                    <ScrollArea className="h-full">
                      {transactions.length > 0 ? (
                        <div className="space-y-4 pr-4">
                          {transactions.map((transaction) => (
                            <div 
                              key={transaction.hash}
                              className="p-4 hover:bg-gray-50 border border-gray-100 rounded-lg cursor-pointer transition-colors"
                              onClick={() => setSelectedTransaction(transaction)}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-gray-600">
                                  {formatAddress(transaction.hash)}
                                </span>
                                <span className="text-gray-900 font-medium">
                                  {formatValue(transaction.value)} ETH
                                </span>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    {formatAddress(transaction.fromAddress)}
                                    <svg className="w-4 h-4 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                    {formatAddress(transaction.toAddress)}
                                  </div>
                                  <div className="mt-1">
                                    {formatTimestamp(transaction.timestamp)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center text-gray-500">
                            {isLoading ? (
                              <p>Loading transactions...</p>
                            ) : (
                              <p>No transactions found for this address</p>
                            )}
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