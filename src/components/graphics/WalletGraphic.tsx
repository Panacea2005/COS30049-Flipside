import { useEffect, useRef } from 'react';

export const WalletGraphic = () => {
  const graphicRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          graphicRef.current?.classList.add('animate-appear');
        } else {
          graphicRef.current?.classList.remove('animate-appear');
        }
      },
      { threshold: 0.1 }
    );

    if (graphicRef.current) {
      observer.observe(graphicRef.current);
    }

    return () => {
      if (graphicRef.current) {
        observer.unobserve(graphicRef.current);
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 flex items-center justify-center">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Grid background */}
        <div className="absolute inset-0">
          <svg width="100%" height="100%" className="opacity-20">
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* 3D Wallet graphic */}
        <div ref={graphicRef} className="opacity-0 transition-opacity duration-1000 ease-out">
          <div className="w-48 h-48 sm:w-96 sm:h-96 relative">
            <div className="absolute inset-0">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(45deg, rgba(251, 113, 133, ${1 - i * 0.1}) 0%, rgba(244, 63, 94, ${1 - i * 0.1}) 100%)`,
                    transform: `rotateX(60deg) translateY(${i * 20}px)`,
                    borderRadius: '50%',
                    boxShadow: '0 0 40px rgba(244, 63, 94, 0.3)',
                    filter: 'brightness(1.2)',
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