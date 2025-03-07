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
  ChevronDown,
  Search,
  X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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

  const clearFilter = () => {
    setAddressFilter('');
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
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    return sortDirection === 'asc' ? 
      <ChevronUp className="ml-2 h-4 w-4 text-indigo-600" /> : 
      <ChevronDown className="ml-2 h-4 w-4 text-indigo-600" />;
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-gray-100 gap-4">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Filter by address..."
            value={addressFilter}
            onChange={(e) => setAddressFilter(e.target.value)}
            className="pl-10 pr-10 py-2 bg-gray-50 border-gray-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
          />
          {addressFilter && (
            <button 
              onClick={clearFilter}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700"
              aria-label="Clear filter"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {sortField && (
            <Badge variant="outline" className="bg-gray-50 text-gray-700 gap-1 flex items-center px-3 py-1 border">
              <span>Sorted by: <span className="font-semibold capitalize">{sortField}</span></span>
              <span className="text-xs text-gray-500">({sortDirection === 'asc' ? 'ascending' : 'descending'})</span>
            </Badge>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50">
                <ArrowDownUp className="mr-2 h-4 w-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border border-gray-200 shadow-lg rounded-md">
              <DropdownMenuLabel className="text-gray-800">Sort Transactions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => handleSort('timestamp')} className="cursor-pointer">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  <span className="flex-1">Time</span>
                  {getSortIcon('timestamp')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('value')} className="cursor-pointer">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span className="flex-1">Value</span>
                  {getSortIcon('value')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('blockNumber')} className="cursor-pointer">
                  <Hash className="mr-2 h-4 w-4" />
                  <span className="flex-1">Block Number</span>
                  {getSortIcon('blockNumber')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('fromAddress')} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span className="flex-1">From Address</span>
                  {getSortIcon('fromAddress')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('toAddress')} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span className="flex-1">To Address</span>
                  {getSortIcon('toAddress')}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Hash
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                From
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                To
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Value (ETH)
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Time
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Block
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Gas
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Gas Used
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Gas Price
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTransactions.length > 0 ? (
              sortedTransactions.map((tx, index) => (
                <TableRow
                  key={tx.hash}
                  onClick={() => onTransactionClick(tx.hash)}
                  className={`hover:bg-indigo-50 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                    {formatHash(tx.hash)}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                    {formatAddress(tx.fromAddress)}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                    {formatAddress(tx.toAddress)}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                    <Badge variant="outline" className={`bg-gray-50 px-2 py-1 ${Number(tx.value) > 0 ? 'text-green-700' : 'text-gray-700'}`}>
                      {formatValue(tx.value)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {new Date(tx.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {tx.blockNumber}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatValue(tx.gas.toString())}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatValue(tx.gasUsed.toString())}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatValue(tx.gasPrice.toString())}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="px-6 py-12 text-center text-gray-500 italic">
                  {addressFilter ? (
                    <div>
                      <p className="mb-2">No transactions match your filter.</p>
                      <Button variant="outline" onClick={clearFilter} size="sm" className="text-indigo-600 hover:text-indigo-800">
                        Clear filter
                      </Button>
                    </div>
                  ) : (
                    'No transactions found'
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};