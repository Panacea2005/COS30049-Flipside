export const Stats = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 py-8 sm:py-16 px-4 sm:px-0">
      <div>
        <div className="text-3xl sm:text-4xl font-light mb-2">200K+</div>
        <div className="text-gray-600">Smart Contract Analyses Completed</div>
      </div>
      <div>
        <div className="text-3xl sm:text-4xl font-light mb-2">$6M+</div>
        <div className="text-gray-600">In Value Secured Through AI Audits</div>
      </div>
      <div>
        <div className="text-3xl sm:text-4xl font-light mb-2">10K+</div>
        <div className="text-gray-600">Active Blockchain Analysts & Developers</div>
      </div>
      <div>
        <div className="text-3xl sm:text-4xl font-light mb-2">20K+</div>
        <div className="text-gray-600">Blockchain Addresses & Contracts Analyzed Monthly</div>
      </div>
    </div>
  );
};