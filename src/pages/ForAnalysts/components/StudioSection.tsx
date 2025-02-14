export const StudioSection = () => {
  return (
    <section className="py-32">
      <h2 className="text-4xl sm:text-6xl md:text-8xl leading-none font-light mb-32">
        DATA STARTS
        <br />
        IN THE
        <br />
        <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 text-transparent bg-clip-text">
          STUDIO
        </span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-16">
        {/* About Studio */}
        <div className="col-span-1 sm:col-span-2">
          <span className="text-violet-600 text-sm">About Studio</span>
          <p className="text-2xl mt-4">
            Unlock blockchain intelligence with our three core features:
          </p>
        </div>

        {/* Query Builder */}
        <div className="bg-gray-50 rounded-2xl p-8">
          <div className="mb-8">
            <code className="text-pink-500">Overview Statistics Dashboard</code>
          </div>
          <div className="rounded-lg overflow-hidden mt-4">
            <img
              src="./overview.png"
              alt="Overview Statistics Dashboard"
              className="w-full h-auto"
            />
          </div>
          <div className="mt-8">
            <div className="text-sm text-gray-600 mb-2">Overview Tab</div>
            <p className="text-xl">
              Get a high-level view of blockchain activity, including contract
              interactions, gas usage, and top addresses.
            </p>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="bg-gray-50 rounded-2xl p-8">
          <div className="mb-8">
            <code className="text-pink-500">Address Statistics & Graphs</code>
          </div>
          <div className="rounded-lg overflow-hidden mt-4">
            <img
              src="./visualization.png"
              alt="Overview Statistics Dashboard"
              className="w-full h-auto"
            />
          </div>
          <div className="mt-8">
            <div className="text-sm text-gray-600 mb-2">Visualization Tab</div>
            <p className="text-xl">
              Search any wallet address to generate a graph-based visualization
              of onchain transactions.
            </p>
          </div>
        </div>

        {/* Share to Earn */}
        <div className="col-span-1 sm:col-span-2">
          <div className="bg-gray-50 rounded-2xl p-8">
            <div className="mb-8">
              <code className="text-pink-500">Full Transaction History</code>
            </div>
            <div className="rounded-lg overflow-hidden mt-4">
              <img
                src="./transaction.png"
                alt="Overview Statistics Dashboard"
                className="w-full h-auto"
              />
            </div>
            <div className="mt-8">
              <div className="text-sm text-gray-600 mb-2">Transaction Tab</div>
              <p className="text-xl">
                Explore detailed transaction logs, including timestamps,
                amounts, and counterparties, to track fund movements.
              </p>
            </div>
          </div>
        </div>
      </div>

      <a
        href="/studio"
        className="inline-flex items-center space-x-2 bg-black text-white px-8 py-4 rounded-lg mt-16 group hover:bg-gray-900"
      >
        <span>Enter Studio</span>
        <span className="transform group-hover:translate-x-1 transition-transform">
          →
        </span>
      </a>
    </section>
  );
};
