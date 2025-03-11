import { CombinedChart } from "./CombinedChart";
import { DistributionChart } from "./DistributionChart";
import { BiggestTransactionsChart } from "./BiggestTransactionsChart";
import { AddressTypesChart } from "./AddressTypesChart";

export const OverviewPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-semibold leading-tight tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-600">
        Transaction Dashboard
      </h1>
      
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Main Featured Chart - Spans 2 columns */}
        <div className="bg-white p-6 rounded-xl shadow-sm md:col-span-2 border border-gray-100">
          <h2 className="text-lg font-medium mb-4 text-gray-800">Transaction Overview</h2>
          <CombinedChart />
        </div>
        
        {/* Address Types - 1 column */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-medium mb-4 text-gray-800">Address Types</h2>
          <AddressTypesChart />
        </div>
        
        {/* Biggest Transactions - Spans full width on larger screens */}
        <div className="bg-white p-6 rounded-xl shadow-sm lg:col-span-2 border border-gray-100">
          <h2 className="text-lg font-medium mb-4 text-gray-800">Biggest Transactions</h2>
          <BiggestTransactionsChart />
        </div>
        
        {/* Distribution Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-medium mb-4 text-gray-800">Distribution</h2>
          <DistributionChart />
        </div>
      </div>
    </div>
  );
};