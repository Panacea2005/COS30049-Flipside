import { useState, useEffect } from 'react';
import { TransactionTable } from './TransactionTable';
import { Pagination } from './Pagination';
import { TransactionModal } from './TransactionModal';
import { neo4jClient } from '../../../../lib/neo4j/client';
import { Transaction } from '../../../../lib/neo4j/types';

export const TransactionHistory = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      const pageSize = 10;
      const data = await neo4jClient.getTransactions(currentPage, pageSize);
      console.log('Fetched transactions:', data);
      setTransactions(data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentPage]);

  const handleTransactionClick = (hash: string) => {
    const transaction = transactions.find(tx => tx.hash === hash);
    setSelectedTransaction(transaction || null);
  };

  const handleCloseModal = () => {
    setSelectedTransaction(null);
  };

  const totalPages = 5;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold leading-tight tracking-tight">Transaction History</h1>
      {error && <div className="text-red-500">{error}</div>}
      {loading ? (
        <div>Loading transactions...</div>
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