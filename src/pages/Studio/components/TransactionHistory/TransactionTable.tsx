import { useState } from 'react';
import { Transaction } from '../../../../lib/neo4j/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  ArrowDownUp, 
  CalendarDays, 
  Hash, 
  CreditCard, 
  User, 
  ArrowUpDown,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface TransactionTableProps {
  transactions: Transaction[];
  onTransactionClick: (hash: string) => void;
}

type SortField = 'timestamp' | 'value' | 'blockNumber' | 'fromAddress' | 'toAddress';
type SortDirection = 'asc' | 'desc';

export const TransactionTable = ({ transactions, onTransactionClick }: TransactionTableProps) => {
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [addressFilter, setAddressFilter] = useState('');
  
  const formatHash = (hash: string) => `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;
  const formatValue = (value: string) => (Number(value) / 1e18).toExponential(2).replace('e', 'E');

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      toggleSortDirection();
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to descending for new fields
    }
  };

  const sortedTransactions = [...transactions]
    .filter(tx => {
      if (!addressFilter) return true;
      const filter = addressFilter.toLowerCase();
      return tx.fromAddress.toLowerCase().includes(filter) || 
             tx.toAddress.toLowerCase().includes(filter);
    })
    .sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'timestamp':
          return direction * (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        case 'value':
          return direction * (Number(a.value) - Number(b.value));
        case 'blockNumber':
          return direction * (Number(a.blockNumber) - Number(b.blockNumber));
        case 'fromAddress':
          return direction * a.fromAddress.localeCompare(b.fromAddress);
        case 'toAddress':
          return direction * a.toAddress.localeCompare(b.toAddress);
        default:
          return 0;
      }
    });

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortDirection === 'asc' ? 
      <ChevronUp className="ml-2 h-4 w-4" /> : 
      <ChevronDown className="ml-2 h-4 w-4" />;
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-2">
        <div className="flex-1">
          <Input
            placeholder="Filter by address..."
            value={addressFilter}
            onChange={(e) => setAddressFilter(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              <ArrowDownUp className="mr-2 h-4 w-4" />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Sort Transactions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => handleSort('timestamp')}>
                <CalendarDays className="mr-2 h-4 w-4" />
                Time
                {getSortIcon('timestamp')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('value')}>
                <CreditCard className="mr-2 h-4 w-4" />
                Value
                {getSortIcon('value')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('blockNumber')}>
                <Hash className="mr-2 h-4 w-4" />
                Block Number
                {getSortIcon('blockNumber')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('fromAddress')}>
                <User className="mr-2 h-4 w-4" />
                From Address
                {getSortIcon('fromAddress')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('toAddress')}>
                <User className="mr-2 h-4 w-4" />
                To Address
                {getSortIcon('toAddress')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
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
            {sortedTransactions.map((tx) => (
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
    </div>
  );
};