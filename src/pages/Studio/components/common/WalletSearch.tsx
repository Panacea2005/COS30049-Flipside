import { useState, useEffect } from 'react';
import { Search, Loader2, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface WalletSearchProps {
  onSearch: (address: string) => void;
  isLoading: boolean;
  searchPerformed?: boolean;
  isError?: boolean;
}

export const WalletSearch = ({ 
  onSearch, 
  isLoading, 
  searchPerformed = false,
  isError = false,
}: WalletSearchProps) => {
  const [address, setAddress] = useState('');
  const [inputError, setInputError] = useState('');
  const [showErrorCard, setShowErrorCard] = useState(false);
  const [errorReason, setErrorReason] = useState('');

  useEffect(() => {
    if (searchPerformed && isError) {
      setShowErrorCard(true);
    } else {
      setShowErrorCard(false);
    }
  }, [searchPerformed, isError]);

  const validateAddress = (address: string) => {
    if (!address.trim()) {
      return "Please enter a wallet address";
    }

    if (!address.startsWith("0x")) {
      return 'Ethereum addresses must start with "0x"';
    }

    if (address.length !== 42) {
      return "Ethereum addresses must be 42 characters long (including 0x)";
    }

    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
      return "Ethereum addresses can only contain hexadecimal characters (0-9, a-f)";
    }

    return ""; // No error
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateAddress(address);

    if (error) {
      setInputError(error);
      setErrorReason(error);
      setShowErrorCard(true);
      return;
    }

    onSearch(address);
  };

  const handleTryAgain = () => {
    setShowErrorCard(false);
    setAddress('');
    setInputError('');
  };

  return (
    <div className="relative w-full">
      <Card className="w-full max-w-2xl bg-white/50 backdrop-blur-sm border-none shadow-lg mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setShowErrorCard(false); // Hide error card when user is typing
                }}
                placeholder="Search wallet address..."
                className={cn(
                  "w-full pl-10 pr-4 py-6 bg-transparent",
                  "border-none focus-visible:ring-2 focus-visible:ring-black/50",
                  "placeholder:text-gray-400 text-gray-900",
                  "transition-all duration-200"
                )}
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className={cn(
                "ml-2 px-6 py-6 bg-black hover:bg-gray-800",
                "text-white font-medium rounded-lg",
                "transition-all duration-200",
                "flex items-center gap-2"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </Button>
          </div>
          {inputError && (
            <div className="absolute -bottom-6 left-0 right-0">
              <p className="text-sm text-red-500 mt-1.5 px-3">{inputError}</p>
            </div>
          )}
        </form>
      </Card>
      
      {/* Creative Loading Animation Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'linear-gradient(to bottom right, rgba(0,0,0,0.4), rgba(0,0,0,0.7))',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50
            }}
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
              style={{ position: 'relative' }}
            >
              {/* Outer rotating ring */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 8, ease: "linear", repeat: Infinity }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div style={{
                  width: '10rem',
                  height: '10rem',
                  borderRadius: '50%',
                  border: '4px solid transparent',
                  borderTopColor: 'rgba(255, 255, 255, 0.2)',
                  borderLeftColor: 'rgba(255, 255, 255, 0.2)',
                  borderRightColor: 'rgba(255, 255, 255, 0.6)',
                  borderBottomColor: 'rgba(255, 255, 255, 0.2)'
                }} />
              </motion.div>
              
              {/* Middle pulsing ring */}
              <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div style={{
                  width: '8rem',
                  height: '8rem',
                  borderRadius: '50%',
                  border: '2px solid rgba(255, 255, 255, 0.3)'
                }} />
              </motion.div>
              
              {/* Logo container */}
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 20, ease: "linear", repeat: Infinity }}
                style={{
                  position: 'relative',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  width: '6rem',
                  height: '6rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)'
                }}
              >
                {/* Replace with your actual logo */}
                <img src='"/flipside-logo.svg"' alt="Logo" style={{ width: '4rem', height: '4rem' }} />
              </motion.div>
              
              {/* Particles effect */}
              <div style={{ position: 'absolute', inset: 0 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, opacity: 0 }}
                    animate={{ x: [0, 20, -20, 0], y: [0, -20, 20, 0], opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                    style={{
                      position: 'absolute',
                      width: '1rem',
                      height: '1rem',
                      background: 'rgba(255, 255, 255, 0.5)',
                      borderRadius: '50%'
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Creative Error Card */}
      <AnimatePresence>
        {showErrorCard && !isLoading && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 40,
              padding: '1rem'
            }}
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              style={{
                width: '100%',
                maxWidth: '36rem',
                background: 'linear-gradient(to bottom right, #ffffff, #f3f4f6)',
                borderRadius: '1rem',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                border: '1px solid #e5e7eb'
              }}
            >
              <div className="relative p-6 sm:p-8">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full -ml-12 -mb-12" />
                
                <div className="relative">
                  <div className="flex items-start">
                    <div className="bg-red-500/20 p-3 rounded-full">
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                    <div className="ml-6">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Data Not Available</h3>
                      <p className="text-gray-600">We couldn't find information for this wallet</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-4 text-gray-600">
                    <div className="bg-gray-100 p-4 rounded-lg backdrop-blur-sm">
                      <p className="font-medium text-gray-900 mb-2">Possible reasons:</p>
                      <ul className="space-y-2 pl-5">
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-red-400 rounded-full mr-2" />
                          {errorReason || "Invalid wallet address format"}
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2" />
                          The wallet doesn't exist on the blockchain
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
                          No transaction history available
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                          Network connectivity issues
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={handleTryAgain}
                      className="bg-gray-300 hover:bg-gray-200 text-gray-900 flex-1 py-6"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Try Again
                    </Button>
                    <Button 
                      className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white flex-1 py-6"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WalletSearch;