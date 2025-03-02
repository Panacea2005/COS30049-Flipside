import { useState, useEffect } from 'react';
import { TransactionTable } from './TransactionTable';
import { Pagination } from './Pagination';
import { TransactionModal } from './TransactionModal';
import { Transaction } from '../../../../lib/neo4j/types';
import { fetchEtherscanTransactions, getTransactionCount } from '../../../../lib/etherscan/etherscanTransactionService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export const TransactionHistory = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [totalPages, setTotalPages] = useState(5);
  const [addressInput, setAddressInput] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [network, setNetwork] = useState('mainnet');
  const pageSize = 10;

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch transactions from Etherscan
      const data = await fetchEtherscanTransactions(currentPage, pageSize, searchAddress, network);
      setTransactions(data);
      
      // Update total pages if we have an address to search
      if (searchAddress) {
        const count = await getTransactionCount(searchAddress, network);
        setTotalPages(Math.max(1, Math.ceil(count / pageSize)));
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions from Etherscan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, searchAddress, network]);

  const handleTransactionClick = (hash: string) => {
    const transaction = transactions.find(tx => tx.hash === hash);
    setSelectedTransaction(transaction || null);
  };

  const handleCloseModal = () => {
    setSelectedTransaction(null);
  };

  const handleSearch = () => {
    setSearchAddress(addressInput);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleNetworkChange = (net: string) => {
    setNetwork(net);
    setCurrentPage(1); // Reset to first page on network change
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-400">
        Transaction History
      </h1>
      
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
        <div className="flex-1">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Ethereum Address (optional)
          </label>
          <div className="flex">
            <Input
              id="address"
              placeholder="0x..."
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              className="ml-2 bg-violet-600 hover:bg-violet-700"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant={network === 'mainnet' ? 'default' : 'outline'} 
            onClick={() => handleNetworkChange('mainnet')}
            className={network === 'mainnet' ? 'bg-violet-600 hover:bg-violet-700' : ''}
          >
            Mainnet
          </Button>
          <Button 
            variant={network === 'sepolia' ? 'default' : 'outline'} 
            onClick={() => handleNetworkChange('sepolia')}
            className={network === 'sepolia' ? 'bg-violet-600 hover:bg-violet-700' : ''}
          >
            Sepolia
          </Button>
        </div>
      </div>

      {searchAddress && (
        <div className="text-sm text-gray-600">
          Showing transactions for: <span className="font-mono">{searchAddress}</span>
        </div>
      )}
      
      {error && <div className="text-red-500 p-4 border border-red-200 rounded-md bg-red-50">{error}</div>}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-700"></div>
        </div>
      ) : (
        <TransactionTable transactions={transactions} onTransactionClick={handleTransactionClick} />
      )}
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />
      
      {selectedTransaction && (
        <TransactionModal transaction={selectedTransaction} onClose={handleCloseModal} />
      )}
    </div>
  );
};