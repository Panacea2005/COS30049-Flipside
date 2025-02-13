export const GrowthBanner = () => {
  return (
    <div className="mt-32 relative overflow-hidden rounded-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
        {/* Decorative lines */}
        <div className="absolute inset-0">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-full border-t border-white/10"
              style={{
                transform: `scale(${1 + i * 0.1}) rotate(${i * 2}deg)`,
                transformOrigin: 'center',
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative p-8 sm:p-16">
        <div className="max-w-2xl">
          <h3 className="text-2xl sm:text-3xl text-white font-light mb-4">
            The path to measurable, sustained growth is just ahead.
            <br />
            Are you ready to begin your ascent?
          </h3>
          
          <a 
            href="/contact"
            className="inline-flex items-center space-x-2 text-white/80 hover:text-white mt-8 group"
          >
            <span>Let's talk</span>
            <span className="transform group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </div>
      </div>
    </div>
  );
};