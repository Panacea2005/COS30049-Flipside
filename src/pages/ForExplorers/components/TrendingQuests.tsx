export const TrendingQuests = () => {
  return (
    <div className="py-16">
      <div className="mb-8">
        <p className="text-2xl text-gray-900">
          Track blockchain movements with 
          <br />
          interactive graphs and dashboards.
        </p>
      </div>
      <a href="/studio" className="block mt-8 bg-black text-white py-4 px-6 rounded-lg flex justify-between items-center group hover:bg-gray-900">
        <span>View dashboards</span>
        <span className="transform group-hover:translate-x-1 transition-transform">→</span>
      </a>
    </div>
  );
};