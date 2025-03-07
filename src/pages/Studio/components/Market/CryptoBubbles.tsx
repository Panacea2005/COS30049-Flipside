import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useSprings, animated } from "react-spring";
import { useDrag } from "@use-gesture/react";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import debounce from "lodash/debounce";

interface CryptoBubble {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  image: string;
  price_change_percentage_24h?: number;
  total_volume?: number;
  circulating_supply?: number;
  last_updated: string;
  x: number;
  y: number;
  size: number;
  floatOffset: number;
  floatSpeed: number;
  floatDelay: number;
}

interface CryptoBubblesProps {
  onBubbleClick: (coin: CryptoBubble) => void;
}

export const CryptoBubbles: React.FC<CryptoBubblesProps> = ({ onBubbleClick }) => {
  const [bubbles, setBubbles] = useState<CryptoBubble[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const rafRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  
  // Calculate bubble size based on price change percentage
  const calculateBubbleSize = useCallback((priceChange: number | undefined) => {
    // Default size for undefined price change
    if (priceChange === undefined) return 50;
    
    // Use absolute value to make size reflect magnitude of change
    const absChange = Math.abs(priceChange);
    
    // Minimum and maximum bubble sizes
    const minSize = 40;
    const maxSize = 120;
    
    // Size scale:
    // - Small changes (0-3%): small bubbles
    // - Medium changes (3-10%): medium bubbles
    // - Large changes (10%+): large bubbles
    // Using a non-linear scale to emphasize significant changes
    if (absChange < 1) return minSize;
    if (absChange < 3) return minSize + (absChange / 3) * 20;
    if (absChange < 10) return minSize + 20 + ((absChange - 3) / 7) * 30;
    
    // Cap at maxSize for very large changes
    return Math.min(minSize + 50 + ((absChange - 10) / 5) * 20, maxSize);
  }, []);

  // Check if two bubbles overlap
  const checkOverlap = useCallback((b1: CryptoBubble, b2: CryptoBubble) => {
    const dx = b1.x - b2.x;
    const dy = b1.y - b2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = (b1.size + b2.size) / 2;
    return distance < minDistance;
  }, []);

  // Position bubbles without overlap
  const positionBubblesWithoutOverlap = useCallback((bubblesArray: CryptoBubble[], width: number, height: number) => {
    // Sort by size (largest first) to prioritize placing bigger bubbles
    const sortedBubbles = [...bubblesArray].sort((a, b) => b.size - a.size);
    const positionedBubbles: CryptoBubble[] = [];

    for (const bubble of sortedBubbles) {
      let validPosition = false;
      let newBubble = { ...bubble };
      let bestDistance = 0;
      let bestPosition = { x: 0, y: 0 };
      
      // Try multiple positions and pick the one with maximum distance from other bubbles
      for (let attempt = 0; attempt < 30; attempt++) {
        const margin = bubble.size / 2;
        const testX = Math.random() * (width - 2 * margin) + margin;
        const testY = Math.random() * (height - 2 * margin) + margin;
        
        let minDistToOthers = Number.MAX_VALUE;
        let valid = true;
        
        // Check against all already positioned bubbles
        for (const positioned of positionedBubbles) {
          const dx = testX - positioned.x;
          const dy = testY - positioned.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = (bubble.size + positioned.size) / 2 + 5; // 5px extra margin
          
          if (distance < minDistance) {
            valid = false;
            break;
          }
          
          minDistToOthers = Math.min(minDistToOthers, distance - minDistance);
        }
        
        if (valid && minDistToOthers > bestDistance) {
          bestDistance = minDistToOthers;
          bestPosition = { x: testX, y: testY };
          validPosition = true;
        }
      }
      
      if (validPosition) {
        newBubble.x = bestPosition.x;
        newBubble.y = bestPosition.y;
      } else {
        // If we couldn't find a perfect spot, position it with some basic spacing
        const margin = bubble.size / 2;
        newBubble.x = Math.random() * (width - 2 * margin) + margin;
        newBubble.y = Math.random() * (height - 2 * margin) + margin;
      }
      
      positionedBubbles.push(newBubble);
    }

    return positionedBubbles;
  }, []);

  // Get color based on price change - unchanged from previous version
  const getBubbleColor = useMemo(() => (priceChange: number | undefined) => {
    if (priceChange === undefined) return { main: '#6B7280', gradient: 'rgba(107, 114, 128, 0.8)' };
    
    if (priceChange >= 15) return { main: '#059669', gradient: '#10B981' };      // Very strong positive
    if (priceChange >= 8) return { main: '#10B981', gradient: '#34D399' };       // Strong positive
    if (priceChange >= 3) return { main: '#34D399', gradient: '#6EE7AF' };       // Medium positive
    if (priceChange >= 0) return { main: '#6EE7AF', gradient: '#A7F3D0' };       // Slight positive
    if (priceChange >= -3) return { main: '#FCA5A5', gradient: '#FECACA' };      // Slight negative
    if (priceChange >= -8) return { main: '#F87171', gradient: '#FCA5A5' };      // Medium negative
    if (priceChange >= -15) return { main: '#EF4444', gradient: '#F87171' };     // Strong negative
    return { main: '#DC2626', gradient: '#EF4444' };                            // Very strong negative
  }, []);

  // Fetch cryptocurrency data
  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=45&page=1&sparkline=false"
        );
        const data = await res.json();
        
        if (!Array.isArray(data) || data.length === 0) {
          console.error("No cryptocurrency data available");
          toast({
            title: "Data Error",
            description: "No cryptocurrency data available",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        // Wait for container to be sized
        setTimeout(() => {
          if (containerRef.current) {
            const { width, height } = containerRef.current.getBoundingClientRect();
            setContainerDimensions({ width, height });
            
            // Initialize bubbles with sizes based on price change percentage
            const initializedBubbles = data.map((coin) => {
              // Calculate size based on price change percentage
              const size = calculateBubbleSize(coin.price_change_percentage_24h);
              
              // Adjust float parameters based on size
              // Smaller bubbles will float more, larger ones less
              const floatOffset = Math.max(3, 12 - size / 15);
              const floatSpeed = 0.3 + (Math.random() * 0.3); 
              const floatDelay = Math.random() * Math.PI * 2; // Random phase offset
              
              return {
                ...coin,
                x: width / 2, // Initial position (will be repositioned)
                y: height / 2,
                size,
                floatOffset,
                floatSpeed,
                floatDelay
              };
            });
            
            // Position bubbles to avoid overlaps
            const positionedBubbles = positionBubblesWithoutOverlap(
              initializedBubbles,
              width,
              height
            );
            
            setBubbles(positionedBubbles);
            setLoading(false);
          }
        }, 200);
        
      } catch (error) {
        console.error("Error fetching cryptocurrency data:", error);
        toast({
          title: "Data Fetch Error",
          description: "Failed to fetch cryptocurrency data",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchCryptoData();
    
    // Debounced resize handler
    const handleResize = debounce(() => {
      if (containerRef.current && bubbles.length > 0) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width, height });
        
        // Reposition bubbles on resize if we have data
        setBubbles(prevBubbles => {
          // Keep existing properties but recalculate positions
          const bubblesWithSameProperties = prevBubbles.map(bubble => ({
            ...bubble
          }));
          return positionBubblesWithoutOverlap(bubblesWithSameProperties, width, height);
        });
      }
    }, 250);
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      handleResize.cancel();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [calculateBubbleSize, positionBubblesWithoutOverlap]);

  // Apply spring physics to bubbles
  const [springs, api] = useSprings(
    bubbles.length, 
    (i) => ({
      x: bubbles[i]?.x || 0,
      y: bubbles[i]?.y || 0,
      scale: 1,
      config: {
        mass: 1 + (bubbles[i]?.size || 50) / 100, // Bigger bubbles have more mass
        tension: 120,
        friction: 14,
      },
    }),
    [bubbles] // Re-initialize springs when bubbles array changes
  );

  // Animation loop using requestAnimationFrame - more efficient than setInterval
  useEffect(() => {
    if (bubbles.length === 0) return;
    
    const animate = () => {
      timeRef.current += 0.01;
      const time = timeRef.current;
      
      api.start(i => {
        if (!bubbles[i]) return {};
        const bubble = bubbles[i];
        const floatingY = Math.sin(time * bubble.floatSpeed + bubble.floatDelay) * bubble.floatOffset;
        const floatingX = Math.cos(time * bubble.floatSpeed * 0.6 + bubble.floatDelay) * (bubble.floatOffset * 0.3);
        
        return {
          x: bubble.x + floatingX,
          y: bubble.y + floatingY,
          immediate: false,
        };
      });
      
      rafRef.current = requestAnimationFrame(animate);
    };
    
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [bubbles, api]);

  // Handle drag interactions
  const bindDrag = useDrag(({ args: [index], active, movement: [mx, my], first, last, memo }) => {
    if (first) {
      // Capture initial positions
      return { initialX: bubbles[index].x, initialY: bubbles[index].y };
    }
    
    const initialMemo = memo || { initialX: bubbles[index].x, initialY: bubbles[index].y };
    
    // Update spring immediately for smooth interaction
    api.start((i) => {
      if (i === index) {
        return {
          x: initialMemo.initialX + mx,
          y: initialMemo.initialY + my,
          scale: active ? 1.1 : 1, // Scale up slightly while dragging
          immediate: active,
        };
      }
      return {};
    });
    
    if (last) {
      // Update bubble positions when drag ends
      setBubbles((prev) => 
        prev.map((bubble, i) => {
          if (i === index) {
            // Keep bubble within bounds with padding for the bubble size
            const padding = bubble.size / 2;
            const newX = Math.max(padding, Math.min(containerDimensions.width - padding, initialMemo.initialX + mx));
            const newY = Math.max(padding, Math.min(containerDimensions.height - padding, initialMemo.initialY + my));
            return { ...bubble, x: newX, y: newY };
          }
          return bubble;
        })
      );
    }
    
    return memo;
  });

  // Handle bubble click
  const handleBubbleClick = useCallback((e: React.MouseEvent, bubble: CryptoBubble) => {
    e.stopPropagation();
    onBubbleClick(bubble);
  }, [onBubbleClick]);

  return (
    <Card className="p-6 bg-white bg-opacity-90 backdrop-blur-sm shadow-xl rounded-lg border border-gray-100 w-full mt-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Interactive Crypto Volatility Map
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Drag bubbles to interact
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="relative w-full h-[600px] bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          springs.map((style, i) => {
            const bubble = bubbles[i];
            if (!bubble) return null;
            
            const sizeScale = bubble.size;
            const priceChange = bubble.price_change_percentage_24h || 0;
            const colors = getBubbleColor(priceChange);
            
            return (
              <animated.div
                key={bubble.id}
                {...bindDrag(i)}
                onClick={(e: React.MouseEvent) => handleBubbleClick(e, bubble)}
                style={{
                  x: style.x,
                  y: style.y,
                  scale: style.scale,
                  position: 'absolute',
                  width: sizeScale,
                  height: sizeScale,
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  // Enhanced gradient for more depth and visual appeal
                  background: `radial-gradient(circle at 30% 30%, ${colors.gradient}, ${colors.main} 70%, rgba(0,0,0,0.4))`,
                  // More sophisticated shadow effect
                  boxShadow: `
                    0 4px 12px rgba(0,0,0,0.15), 
                    0 0 ${Math.abs(priceChange) + 5}px ${colors.main},
                    inset 0 -5px 15px rgba(0,0,0,0.3),
                    inset 0 5px 15px rgba(255,255,255,0.4)
                  `,
                  border: '2px solid rgba(255,255,255,0.8)',
                  color: 'white',
                  userSelect: 'none',
                  // Larger bubbles (higher price change) appear on top
                  zIndex: Math.floor(sizeScale), 
                  transition: 'box-shadow 0.3s, border 0.3s',
                  overflow: 'hidden',
                }}
                onMouseOver={(e: { currentTarget: { style: { boxShadow: string; border: string; }; }; }) => {
                  e.currentTarget.style.boxShadow = `
                    0 8px 25px rgba(0,0,0,0.2), 
                    0 0 ${Math.abs(priceChange) + 10}px ${colors.main},
                    inset 0 -5px 15px rgba(0,0,0,0.3),
                    inset 0 5px 15px rgba(255,255,255,0.6)
                  `;
                  e.currentTarget.style.border = '2px solid rgba(255,255,255,1)';
                }}
                onMouseOut={(e: { currentTarget: { style: { boxShadow: string; border: string; }; }; }) => {
                  e.currentTarget.style.boxShadow = `
                    0 4px 12px rgba(0,0,0,0.15), 
                    0 0 ${Math.abs(priceChange) + 5}px ${colors.main},
                    inset 0 -5px 15px rgba(0,0,0,0.3),
                    inset 0 5px 15px rgba(255,255,255,0.4)
                  `;
                  e.currentTarget.style.border = '2px solid rgba(255,255,255,0.8)';
                }}
              >
                {/* Logo with enhanced shadow for better pop */}
                <div className="relative w-1/2 h-1/2 flex items-center justify-center mb-1">
                  <div 
                    className="absolute inset-0 rounded-full bg-white bg-opacity-20 filter blur-sm"
                    style={{ transform: 'scale(0.85)' }}
                  ></div>
                  <img 
                    src={bubble.image} 
                    alt={bubble.name} 
                    className="w-full h-full object-contain drop-shadow-md relative z-10" 
                  />
                </div>
                
                {/* Text content with better scaling for different bubble sizes */}
                {sizeScale > 50 && (
                  <div className="text-center px-1 z-10">
                    <div 
                      className="font-bold truncate max-w-full"
                      style={{ 
                        fontSize: Math.max(10, Math.min(14, sizeScale / 5)),
                        textShadow: '0 1px 3px rgba(0,0,0,0.6)'
                      }}
                    >
                      {bubble.symbol.toUpperCase()}
                    </div>
                    {sizeScale > 60 && (
                      <div 
                        className="font-medium mt-1 bg-black bg-opacity-30 rounded-full px-2 py-0.5"
                        style={{ 
                          fontSize: Math.max(9, Math.min(12, sizeScale / 6))
                        }}
                      >
                        {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}%
                      </div>
                    )}
                  </div>
                )}
              </animated.div>
            );
          })
        )}
      </div>
      
      {/* Updated legend to explain bubble size */}
      <div className="flex flex-col sm:flex-row justify-between mt-4 text-xs sm:text-sm gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: 'linear-gradient(to bottom, #10B981, #059669)' }}></span>
            <span className="text-gray-600">Rising</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: 'linear-gradient(to bottom, #F87171, #EF4444)' }}></span>
            <span className="text-gray-600">Falling</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 border-l border-gray-200 pl-2 ml-1">
            <span className="w-2 h-2 rounded-full bg-gray-300"></span>
            <span className="w-3 h-3 rounded-full bg-gray-400"></span>
            <span className="w-4 h-4 rounded-full bg-gray-500"></span>
            <span className="text-gray-600 ml-1">Size = Volatility</span>
          </div>
        </div>
        <div className="flex justify-between sm:justify-end w-full sm:w-auto gap-4">
          <div className="text-gray-500 flex items-center gap-1 sm:hidden">
            <span className="w-2 h-2 rounded-full bg-gray-300"></span>
            <span className="w-3 h-3 rounded-full bg-gray-400"></span>
            <span className="w-4 h-4 rounded-full bg-gray-500"></span>
            <span>Size = Volatility</span>
          </div>
          <div className="text-gray-500 flex items-center">
            <span>Larger = Higher % Change</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CryptoBubbles;