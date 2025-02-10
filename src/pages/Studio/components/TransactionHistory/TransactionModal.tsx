import { Transaction } from '../../../../lib/neo4j/types';

interface TransactionModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const TransactionModal = ({ transaction, onClose }: TransactionModalProps) => {
  if (!transaction) return null;

  const formatValue = (value: string) => Number(value).toExponential(5).replace('e', 'E');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl transform transition-all">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Transaction Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="group">
                <div className="text-sm font-medium text-gray-500 mb-1">Transaction Hash</div>
                <div className="text-gray-900 font-mono text-sm break-all bg-gray-50 p-3 rounded-lg">
                  {transaction.hash}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">From</div>
                  <div className="text-gray-900 font-mono text-sm break-all bg-gray-50 p-3 rounded-lg">
                    {transaction.fromAddress}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">To</div>
                  <div className="text-gray-900 font-mono text-sm break-all bg-gray-50 p-3 rounded-lg">
                    {transaction.toAddress}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Value</div>
                  <div className="text-gray-900 font-mono text-sm bg-gray-50 p-3 rounded-lg">
                    {formatValue(transaction.value)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Block Number</div>
                  <div className="text-gray-900 font-mono text-sm bg-gray-50 p-3 rounded-lg">
                    {transaction.blockNumber}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Timestamp</div>
                <div className="text-gray-900 text-sm bg-gray-50 p-3 rounded-lg">
                  {new Date(transaction.timestamp).toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Gas</div>
                  <div className="text-gray-900 font-mono text-sm bg-gray-50 p-3 rounded-lg">
                    {formatValue(transaction.gas.toString())}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Gas Used</div>
                  <div className="text-gray-900 font-mono text-sm bg-gray-50 p-3 rounded-lg">
                    {formatValue(transaction.gasUsed.toString())}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Gas Price</div>
                  <div className="text-gray-900 font-mono text-sm bg-gray-50 p-3 rounded-lg">
                    {formatValue(transaction.gasPrice.toString())}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-gray-900 text-white py-2.5 px-4 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};