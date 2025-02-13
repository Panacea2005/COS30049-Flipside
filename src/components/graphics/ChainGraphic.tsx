export const ChainGraphic = () => {
  return (
    <div className="absolute inset-0 z-0">
      <div className="relative w-full h-full">
        {/* Grid background */}
        <div className="absolute inset-0">
          <svg width="100%" height="100%" className="opacity-20">
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* 3D Chain graphic */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-48 h-48 sm:w-96 sm:h-96 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-lg transform rotate-45 skew-y-12">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-0 bg-gradient-to-r from-cyan-400/80 to-blue-600/80 rounded-lg transform"
                  style={{
                    transform: `translateZ(${i * 20}px) translateX(${i * 10}px)`,
                    filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.3))',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};