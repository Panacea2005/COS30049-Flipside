import { CombinedChart } from './CombinedChart';
import { DistributionChart } from './DistributionChart';
import { BiggestTransactionsChart } from './BiggestTransactionsChart';
import { AddressTypesChart } from './AddressTypesChart';

export const OverviewPage = () => {
  return (
    <div className="space-y-6"> {/* Increased spacing between sections */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold leading-tight tracking-tight">Transaction Dashboard</h1>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md"> {/* Increased padding */}
        <CombinedChart />
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md"> {/* Increased padding */}
        <BiggestTransactionsChart />
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md flex flex-col lg:flex-row gap-4"> {/* Increased padding and added flex layout */}
        <div className="flex-1 min-w-[300px]">
          <DistributionChart />
        </div>
        <div className="flex-1 min-w-[300px]">
          <AddressTypesChart />
        </div>
      </div>
    </div>
  );
};