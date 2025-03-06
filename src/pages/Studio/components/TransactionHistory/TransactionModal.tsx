import { Transaction } from '../../../../lib/neo4j/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeftRight, Calendar, Layers, Cpu, X, Copy, CheckCircle, 
  ExternalLink, Info, ArrowDown, ArrowUp, Clock, Database 
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TransactionModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const TransactionModal = ({ transaction, onClose }: TransactionModalProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [transactionStatus, setTransactionStatus] = useState<'success' | 'pending' | 'failed'>('success');

  useEffect(() => {
    // Reset state when transaction changes
    setCopiedField(null);
    setActiveTab('overview');
    
    // Simulate determining transaction status (in a real app, this would be from the transaction data)
    if (transaction) {
      setTransactionStatus(transaction.status as any || 'success');
    }
  }, [transaction]);

  if (!transaction) return null;

  const formatValue = (value: string) => Number(value).toExponential(5).replace('e', 'E');
  
  const formatEth = (value: string) => {
    const etherValue = Number(value) / 1e18;
    return etherValue < 0.001 
      ? etherValue.toExponential(5).replace('e', 'E') 
      : etherValue.toFixed(6);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const openExternalLink = (hash: string) => {
    window.open(`https://etherscan.io/tx/${hash}`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <X className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const truncateAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;
  
  const formatTimeAgo = (timestamp: string) => {
    const txDate = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - txDate.getTime()) / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minutes ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`;
    return `${Math.floor(diffSeconds / 86400)} days ago`;
  };

  return (
    <TooltipProvider>
      <Dialog open={!!transaction} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-xl">
          <DialogHeader className="p-6 border-b sticky top-0 bg-white z-10 flex flex-row justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className={`rounded-full p-2 ${transactionStatus === 'success' ? 'bg-green-100' : transactionStatus === 'pending' ? 'bg-yellow-100' : 'bg-red-100'}`}>
                {getStatusIcon(transactionStatus)}
              </div>
              <div>
                <DialogTitle className="text-xl">Transaction Details</DialogTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {formatTimeAgo(transaction.timestamp)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-full h-8 w-8 border-gray-200"
                    onClick={() => openExternalLink(transaction.hash)}
                  >
                    <ExternalLink className="h-4 w-4 text-gray-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View on Etherscan</TooltipContent>
              </Tooltip>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Value & Status Summary */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
            <div className="flex flex-col items-center justify-center">
              <Badge className={`mb-2 px-3 py-1 ${getStatusColor(transactionStatus)}`}>
                {transactionStatus.charAt(0).toUpperCase() + transactionStatus.slice(1)}
              </Badge>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {formatEth(transaction.value)} ETH
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <span className="font-mono">{truncateAddress(transaction.fromAddress)}</span>
                  {transaction.value !== '0' ? (
                    <ArrowRight className="h-4 w-4 mx-1" />
                  ) : (
                    <ArrowsUpDown className="h-4 w-4 mx-1" />
                  )}
                  <span className="font-mono">{truncateAddress(transaction.toAddress)}</span>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full" value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b">
              <TabsList className="w-full justify-start bg-transparent p-0">
                <TabsTrigger value="overview" className="py-3 px-6 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="details" className="py-3 px-6 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none">
                  Details
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="p-6 space-y-6 focus-visible:outline-none focus-visible:ring-0">
              {/* Transaction Hash Card */}
              <Card className="overflow-hidden border border-gray-200 shadow-sm rounded-lg">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-gray-500">Transaction Hash</div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => copyToClipboard(transaction.hash, 'hash')}
                    >
                      {copiedField === 'hash' ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" /> Copied
                        </span>
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="mt-1 font-mono text-sm break-all text-gray-900">
                    {transaction.hash}
                  </div>
                </CardContent>
              </Card>

              {/* Block & Time Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="overflow-hidden border border-gray-200 shadow-sm rounded-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Layers className="h-4 w-4 text-gray-500 mr-2" />
                      <div className="text-sm font-medium text-gray-500">Block Number</div>
                    </div>
                    <div className="mt-1 font-mono text-lg font-semibold text-gray-900">
                      {transaction.blockNumber}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="overflow-hidden border border-gray-200 shadow-sm rounded-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                      <div className="text-sm font-medium text-gray-500">Timestamp</div>
                    </div>
                    <div className="mt-1 text-gray-900">
                      {new Date(transaction.timestamp).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* From/To Addresses */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <ArrowUp className="h-4 w-4 text-gray-500 mr-2" />
                      <div className="text-sm font-medium text-gray-700">From</div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs"
                      onClick={() => copyToClipboard(transaction.fromAddress, 'from')}
                    >
                      {copiedField === 'from' ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" /> Copied
                        </span>
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div className="text-gray-900 font-mono text-sm break-all p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                    {transaction.fromAddress}
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <ArrowDown className="h-4 w-4 text-gray-500 mr-2" />
                      <div className="text-sm font-medium text-gray-700">To</div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs"
                      onClick={() => copyToClipboard(transaction.toAddress, 'to')}
                    >
                      {copiedField === 'to' ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" /> Copied
                        </span>
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div className="text-gray-900 font-mono text-sm break-all p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                    {transaction.toAddress}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="p-6 space-y-6 focus-visible:outline-none focus-visible:ring-0">
              {/* Value */}
              <Card className="overflow-hidden border border-gray-200 shadow-sm rounded-lg">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <ArrowLeftRight className="h-4 w-4 text-gray-600 mr-2" />
                    <div className="text-sm font-medium text-gray-700">Value</div>
                  </div>
                  <div className="mt-1 flex items-baseline">
                    <div className="font-mono text-xl font-semibold text-gray-900 mr-2">
                      {formatEth(transaction.value)} ETH
                    </div>
                    <div className="text-sm text-gray-500">
                      (${(Number(formatEth(transaction.value)) * 3500).toFixed(2)})
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gas Information */}
              <div>
                <div className="flex items-center mb-3">
                  <Cpu className="h-4 w-4 text-gray-600 mr-2" />
                  <div className="text-sm font-medium text-gray-700">Gas Information</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Card className="border border-gray-200 shadow-sm rounded-lg">
                    <CardContent className="p-4">
                      <div className="text-xs font-medium text-gray-500 mb-1">Gas Limit</div>
                      <div className="text-gray-900 font-mono text-sm">
                        {formatValue(transaction.gas.toString())}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-gray-200 shadow-sm rounded-lg">
                    <CardContent className="p-4">
                      <div className="text-xs font-medium text-gray-500 mb-1">Gas Used</div>
                      <div className="text-gray-900 font-mono text-sm">
                        {formatValue(transaction.gasUsed.toString())}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-gray-200 shadow-sm rounded-lg">
                    <CardContent className="p-4">
                      <div className="text-xs font-medium text-gray-500 mb-1">Gas Price</div>
                      <div className="text-gray-900 font-mono text-sm">
                        {formatValue(transaction.gasPrice.toString())} Gwei
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Additional Transaction Data */}
              <div>
                <div className="flex items-center mb-3">
                  <Database className="h-4 w-4 text-gray-600 mr-2" />
                  <div className="text-sm font-medium text-gray-700">Additional Data</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="border border-gray-200 shadow-sm rounded-lg">
                    <CardContent className="p-4">
                      <div className="text-xs font-medium text-gray-500 mb-1">Nonce</div>
                      <div className="text-gray-900 font-mono text-sm">
                        {transaction.nonce || '0'}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-gray-200 shadow-sm rounded-lg">
                    <CardContent className="p-4">
                      <div className="text-xs font-medium text-gray-500 mb-1">Transaction Fee</div>
                      <div className="text-gray-900 font-mono text-sm">
                        {formatEth((BigInt(transaction.gasUsed) * BigInt(transaction.gasPrice)).toString())} ETH
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="p-6 border-t bg-gray-50 sticky bottom-0 flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => openExternalLink(transaction.hash)} 
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Etherscan
            </Button>
            <Button onClick={onClose} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

// Additional icon components
const ArrowRight = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 12h14"></path>
    <path d="m12 5 7 7-7 7"></path>
  </svg>
);

const ArrowsUpDown = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m21 16-4 4-4-4"></path>
    <path d="M17 20V4"></path>
    <path d="m3 8 4-4 4 4"></path>
    <path d="M7 4v16"></path>
  </svg>
);