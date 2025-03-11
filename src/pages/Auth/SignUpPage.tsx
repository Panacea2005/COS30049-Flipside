import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export const SignUpPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    
    // Set canvas dimensions to match container
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Mouse position tracking with immediate effect
    let mouseX = canvas.width / 2;
    let mouseY = canvas.height / 2;
    let targetX = mouseX;
    let targetY = mouseY;
    let force = 0;
    
    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      // Increase force on mouse movement for more dramatic effect
      force = 30;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    // Original gradient colors from the background
    const colors = {
      pink: [236, 72, 153],    // pink-500
      purple: [147, 51, 234],  // purple-600
      blue: [29, 78, 216]      // blue-700
    };
    
    // More gradient points for richer effect
    const points = Array.from({ length: 15 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: 0,
      vy: 0,
      targetX: Math.random() * canvas.width,
      targetY: Math.random() * canvas.height,
      size: Math.random() * 400 + 300,
      speed: Math.random() * 0.015 + 0.005,
      colorIndex: Math.floor(Math.random() * 3),
      opacity: Math.random() * 0.3 + 0.3
    }));
    
    // Noise texture for grain effect
    const noiseCanvas = document.createElement('canvas');
    const noiseCtx = noiseCanvas.getContext('2d');
    noiseCanvas.width = 256;
    noiseCanvas.height = 256;
    
    if (noiseCtx) {
      const imgData = noiseCtx.createImageData(256, 256);
      const data = imgData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = data[i + 1] = data[i + 2] = v;
        data[i + 3] = Math.random() * 80; // Semi-transparent for subtle effect
      }
      
      noiseCtx.putImageData(imgData, 0, 0);
    }
    
    // Enhanced animation loop
    const animate = () => {
      // Fast approach to target for immediate response
      mouseX += (targetX - mouseX) * 0.2;
      mouseY += (targetY - mouseY) * 0.2;
      
      // Gradually reduce force
      force *= 0.95;
      
      // Clear canvas with base gradient
      const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bgGradient.addColorStop(0, 'rgb(236, 72, 153)'); // pink-500
      bgGradient.addColorStop(0.5, 'rgb(147, 51, 234)'); // purple-600
      bgGradient.addColorStop(1, 'rgb(29, 78, 216)'); // blue-700
      
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw each point with enhanced flow
      for (const point of points) {
        // Generate new target position periodically
        if (Math.random() < 0.005) {
          point.targetX = Math.random() * canvas.width;
          point.targetY = Math.random() * canvas.height;
        }
        
        // Move toward target with some randomness
        point.x += (point.targetX - point.x) * point.speed;
        point.y += (point.targetY - point.y) * point.speed;
        
        // Apply mouse influence with stronger, immediate effect
        const dx = mouseX - point.x;
        const dy = mouseY - point.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const maxDist = 500;
        
        if (dist < maxDist) {
          // Stronger repulsion from mouse
          const pushForce = (1 - dist/maxDist) * force * 0.02;
          point.vx -= dx * pushForce / (dist + 1);
          point.vy -= dy * pushForce / (dist + 1);
        }
        
        // Apply velocity with enhanced effect
        point.x += point.vx;
        point.y += point.vy;
        
        // Damping with less friction for more flow
        point.vx *= 0.95;
        point.vy *= 0.95;
        
        // Get color based on index
        let color;
        switch (point.colorIndex) {
          case 0: color = colors.pink; break;
          case 1: color = colors.purple; break;
          default: color = colors.blue;
        }
        
        // Draw flowing gradient blob with enhanced glow
        const gradient = ctx.createRadialGradient(
          point.x, point.y, 0,
          point.x, point.y, point.size * (1 + 0.2 * Math.sin(Date.now() * 0.001))
        );
        
        gradient.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${point.opacity})`);
        gradient.addColorStop(0.5, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${point.opacity * 0.5})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Apply heavy grain effect
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.15; // Stronger grain effect
      
      for (let i = 0; i < 3; i++) {
        // Tiled noise pattern for performance
        const now = Date.now() * 0.001;
        const offsetX = Math.sin(now * 0.5) * 100;
        const offsetY = Math.cos(now * 0.5) * 100;
        
        for (let x = 0; x < canvas.width; x += 256) {
          for (let y = 0; y < canvas.height; y += 256) {
            ctx.drawImage(
              noiseCanvas, 
              x + (Math.sin(now + x * 0.01) * 10) + offsetX, 
              y + (Math.cos(now + y * 0.01) * 10) + offsetY
            );
          }
        }
      }
      
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      
      // Water ripple effect on mouse move
      if (force > 1) {
        ctx.beginPath();
        const rippleSize = force * 10;
        const gradient = ctx.createRadialGradient(
          mouseX, mouseY, 0,
          mouseX, mouseY, rippleSize
        );
        
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.arc(mouseX, mouseY, rippleSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await signUp(email, password);
      navigate("/studio");
    } catch (err) {
      setError((err as any).message);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen flex items-center justify-center py-16 px-4 relative overflow-hidden font-sans">
      {/* Interactive canvas background */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full z-0"
      />
      
      {/* SVG Filters for enhanced water effect */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="water-distort">
          <feTurbulence 
            type="fractalNoise" 
            baseFrequency="0.015 0.015" 
            numOctaves="2" 
            seed="3" 
            stitchTiles="stitch" 
            result="noise" 
          />
          <feDisplacementMap 
            in="SourceGraphic" 
            in2="noise" 
            scale="20" 
            xChannelSelector="R" 
            yChannelSelector="G" 
          />
        </filter>
        
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </svg>
      
      <div className="w-11/12 max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col sm:flex-row my-10 z-10 relative">
        {/* Form side */}
        <div className="w-full sm:w-1/2 p-8 md:p-12 relative">
          <div className="absolute top-6 left-6">
            <img src="/flipside-logo.svg" alt="Logo" className="h-10" />
          </div>
          
          <div className="mt-20 mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Sign Up</h1>
            <p className="text-gray-600 mt-2">Create your account today</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="••••••••"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Use 8+ characters with a mix of letters, numbers & symbols</p>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 rounded-lg p-3">
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  required
                />
              </div>
              <div className="ml-3">
                <label htmlFor="terms" className="text-xs text-gray-600">
                  I agree to the <a href="#" className="text-purple-600 hover:text-purple-800">Terms of Service</a> and <a href="#" className="text-purple-600 hover:text-purple-800">Privacy Policy</a>
                </label>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-blue-600 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
            >
              Create Account
            </button>
            
            <p className="text-center text-sm text-gray-600 pt-4">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-purple-600 hover:text-purple-800 font-medium"
              >
                Log In
              </Link>
            </p>
          </form>
        </div>
        
        {/* Image side */}
        <div className="hidden sm:block sm:w-1/2 bg-cover bg-center relative overflow-hidden">
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center transform transition-transform duration-500 hover:scale-110"
            style={{ backgroundImage: "url(/default-banner.png)" }}
          >
            <div className="absolute inset-0 bg-gradient-to-l from-black/40 to-transparent" />
          </div>
          <div className="absolute inset-0 flex flex-col justify-center p-10 text-white z-10">
            <h2 className="text-4xl font-bold mb-4">Join Our Community</h2>
            <p className="text-lg opacity-90 mb-6">Start creating amazing content today</p>
            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
              <p className="italic text-sm">"The best way to predict the future is to create it"</p>
              <p className="text-right text-xs mt-2">- Peter Drucker</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};