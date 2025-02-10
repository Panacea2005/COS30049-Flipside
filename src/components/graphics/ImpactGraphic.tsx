export const ImpactGraphic = () => {
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
        
        {/* 3D Impact graphic */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-[600px] h-[600px] relative">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl"
                style={{
                  transform: `translateX(${i * 30}px) translateY(${i * -10}px) rotateY(-20deg)`,
                  opacity: 1 - (i * 0.1),
                  filter: 'brightness(1.2)',
                  boxShadow: '0 0 40px rgba(139, 92, 246, 0.3)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};