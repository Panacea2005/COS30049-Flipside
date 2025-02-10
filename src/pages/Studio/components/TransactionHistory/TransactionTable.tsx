import { Transaction } from '../../../../lib/neo4j/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TransactionTableProps {
  transactions: Transaction[];
  onTransactionClick: (hash: string) => void;
}

export const TransactionTable = ({ transactions, onTransactionClick }: TransactionTableProps) => {
  const formatHash = (hash: string) => `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;
  const formatValue = (value: string) => (Number(value) / 1e18).toExponential(2).replace('e', 'E');

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-full divide-y divide-gray-200">
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hash
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              From
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              To
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Value (ETH)
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Block Number
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Gas
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Gas Used
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Gas Price
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white divide-y divide-gray-200">
          {transactions.map((tx) => (
            <TableRow
              key={tx.hash}
              onClick={() => onTransactionClick(tx.hash)}
              className="hover:bg-gray-50 cursor-pointer"
            >
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-violet-600">
                {formatHash(tx.hash)}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatAddress(tx.fromAddress)}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatAddress(tx.toAddress)}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatValue(tx.value)}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(tx.timestamp).toLocaleString()}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {tx.blockNumber}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatValue(tx.gas.toString())}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatValue(tx.gasUsed.toString())}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatValue(tx.gasPrice.toString())}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};