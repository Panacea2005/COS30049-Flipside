import { useState, useEffect } from "react";
import { TransactionTable } from "./TransactionTable";
import { Pagination } from "./Pagination";
import { TransactionModal } from "./TransactionModal";
import { Transaction } from "../../../../lib/neo4j/types";
import {
  fetchEtherscanTransactions,
  getTransactionCount,
} from "../../../../lib/etherscan/etherscanTransactionService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Database } from "lucide-react";
import { neo4jClient } from "../../../../lib/neo4j/client";

export const TransactionHistory = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [totalPages, setTotalPages] = useState(5);
  const [addressInput, setAddressInput] = useState("");
  const [searchAddress, setSearchAddress] = useState("");
  const [network, setNetwork] = useState("mainnet");
  const [useEtherscan, setUseEtherscan] = useState(false);  // Default is Neo4j
  const pageSize = 10;

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Set the data source before fetching
      neo4jClient.setUseEtherscan(useEtherscan);

      let data;
      if (useEtherscan) {
        // Fetch from Etherscan
        data = await fetchEtherscanTransactions(currentPage, pageSize, searchAddress, network);
      } else {
        // Fetch from Neo4j
        data = await neo4jClient.getTransactions(currentPage, pageSize, searchAddress);
      }
      
      setTransactions(data);

      if (searchAddress) {
        const count = await getTransactionCount(searchAddress, network);
        setTotalPages(Math.max(1, Math.ceil(count / pageSize)));
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError("Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, searchAddress, network, useEtherscan]);

  const handleTransactionClick = (hash: string) => {
    const transaction = transactions.find((tx) => tx.hash === hash);
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
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-xl shadow-sm">
      <div className="mb-8 border-b pb-4">
        <div className="flex items-center gap-3 mb-2">
          <Database className="h-7 w-7 text-indigo-600" />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-500">
            Transaction History
          </h1>
        </div>
        <p className="text-gray-500">
          Search and view Ethereum transaction history across networks
        </p>
      </div>

      <div className="bg-gray-50 p-5 rounded-lg mb-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1 w-full">
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Ethereum Address
            </label>
            <div className="flex">
              <Input
                id="address"
                placeholder="0x..."
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                className="rounded-r-none border-r-0 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <Button
                onClick={handleSearch}
                className="rounded-l-none bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          <div className="w-full md:w-auto mt-4 md:mt-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Source
            </label>
            <div className="flex rounded-md shadow-sm overflow-hidden border border-gray-200">
              <Button
                variant={!useEtherscan ? "default" : "outline"}
                onClick={() => {
                  setUseEtherscan(false);
                  neo4jClient.setUseEtherscan(false);
                  setCurrentPage(1); // Reset to first page on data source change
                }}
                className={`rounded-r-none flex-1 ${
                  !useEtherscan
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "border-r-0"
                }`}
              >
                Neo4j DB
              </Button>
              <Button
                variant={useEtherscan ? "default" : "outline"}
                onClick={() => {
                  setUseEtherscan(true);
                  neo4jClient.setUseEtherscan(true);
                  setCurrentPage(1); // Reset to first page on data source change
                }}
                className={`rounded-l-none flex-1 ${
                  useEtherscan
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : ""
                }`}
              >
                Etherscan
              </Button>
            </div>
          </div>

          {/* Show network selection only if Etherscan is selected */}
          {useEtherscan && (
            <div className="w-full md:w-auto mt-4 md:mt-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Network
              </label>
              <div className="flex rounded-md shadow-sm overflow-hidden border border-gray-200">
                <Button
                  variant={network === "mainnet" ? "default" : "outline"}
                  onClick={() => handleNetworkChange("mainnet")}
                  className={`rounded-r-none flex-1 ${
                    network === "mainnet"
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                      : "border-r-0"
                  }`}
                >
                  Mainnet
                </Button>
                <Button
                  variant={network === "sepolia" ? "default" : "outline"}
                  onClick={() => handleNetworkChange("sepolia")}
                  className={`rounded-l-none flex-1 ${
                    network === "sepolia"
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                      : ""
                  }`}
                >
                  Sepolia
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {searchAddress && (
        <div className="bg-indigo-50 text-indigo-800 p-3 rounded-md mb-6 border border-indigo-100 flex items-center">
          <span className="mr-2">Showing transactions for:</span>
          <code className="font-mono bg-white px-2 py-1 rounded text-indigo-600 border border-indigo-100">
            {searchAddress}
          </code>
        </div>
      )}

      {error && (
        <div className="text-red-600 p-4 mb-6 border border-red-200 rounded-md bg-red-50 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <TransactionTable
            transactions={transactions}
            onTransactionClick={handleTransactionClick}
          />
        </div>
      )}

      <div className="mt-6">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      {selectedTransaction && (
        <TransactionModal
          transaction={selectedTransaction}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};
