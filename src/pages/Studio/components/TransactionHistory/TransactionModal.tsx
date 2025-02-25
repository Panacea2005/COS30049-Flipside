import { Transaction } from '../../../../lib/neo4j/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeftRight, Calendar, Layers, Cpu, X, Copy } from 'lucide-react';
import { useState } from 'react';

interface TransactionModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const TransactionModal = ({ transaction, onClose }: TransactionModalProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  return (
    <Dialog open={!!transaction} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 border-b sticky top-0 bg-white z-10 flex flex-row justify-between items-center">
          <div className="flex items-center space-x-2">
            <DialogTitle className="text-xl">Transaction Details</DialogTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Transaction Hash Card */}
          <Card className="overflow-hidden border-0 shadow-sm">
            <CardContent className="p-4 bg-gradient-to-r from-violet-50 to-indigo-50">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-gray-500">Transaction Hash</div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2"
                  onClick={() => copyToClipboard(transaction.hash, 'hash')}
                >
                  {copiedField === 'hash' ? 'Copied!' : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="mt-1 font-mono text-sm break-all text-violet-900">
                {transaction.hash}
              </div>
            </CardContent>
          </Card>

          {/* Block & Time Information */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="overflow-hidden border-0 shadow-sm">
              <CardContent className="p-4 bg-gray-50">
                <div className="flex items-center">
                  <Layers className="h-4 w-4 text-gray-500 mr-2" />
                  <div className="text-sm font-medium text-gray-500">Block</div>
                </div>
                <div className="mt-1 font-mono text-lg font-semibold">
                  {transaction.blockNumber}
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden border-0 shadow-sm">
              <CardContent className="p-4 bg-gray-50">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                  <div className="text-sm font-medium text-gray-500">Time</div>
                </div>
                <div className="mt-1 text-sm">
                  {new Date(transaction.timestamp).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* From/To Addresses */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm font-medium text-gray-500">From</div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={() => copyToClipboard(transaction.fromAddress, 'from')}
                >
                  {copiedField === 'from' ? 'Copied!' : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="text-gray-900 font-mono text-sm break-all p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                {transaction.fromAddress}
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm font-medium text-gray-500">To</div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={() => copyToClipboard(transaction.toAddress, 'to')}
                >
                  {copiedField === 'to' ? 'Copied!' : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="text-gray-900 font-mono text-sm break-all p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                {transaction.toAddress}
              </div>
            </div>
          </div>

          {/* Value */}
          <Card className="overflow-hidden border-0 shadow-sm">
            <CardContent className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex items-center">
                <ArrowLeftRight className="h-4 w-4 text-emerald-600 mr-2" />
                <div className="text-sm font-medium text-emerald-700">Value</div>
              </div>
              <div className="mt-1 font-mono text-xl font-semibold text-emerald-700">
                {formatEth(transaction.value)} ETH
              </div>
            </CardContent>
          </Card>

          {/* Gas Information */}
          <div>
            <div className="flex items-center mb-2">
              <Cpu className="h-4 w-4 text-gray-500 mr-2" />
              <div className="text-sm font-medium text-gray-700">Gas Details</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 bg-gray-50">
                  <div className="text-xs font-medium text-gray-500 mb-1">Gas Limit</div>
                  <div className="text-gray-900 font-mono text-sm">
                    {formatValue(transaction.gas.toString())}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 bg-gray-50">
                  <div className="text-xs font-medium text-gray-500 mb-1">Gas Used</div>
                  <div className="text-gray-900 font-mono text-sm">
                    {formatValue(transaction.gasUsed.toString())}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 bg-gray-50">
                  <div className="text-xs font-medium text-gray-500 mb-1">Gas Price</div>
                  <div className="text-gray-900 font-mono text-sm">
                    {formatValue(transaction.gasPrice.toString())}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t bg-gray-50 sticky bottom-0">
          <Button onClick={onClose} className="w-full bg-violet-600 hover:bg-violet-700">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};