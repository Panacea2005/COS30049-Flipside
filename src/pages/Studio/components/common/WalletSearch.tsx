import { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
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
  const [address, setAddress] = useState("");
  const [inputError, setInputError] = useState("");
  const [showErrorCard, setShowErrorCard] = useState(false);
  const [errorReason, setErrorReason] = useState("");

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
    setAddress("");
    setInputError("");
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
                "Search"
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
              position: "fixed",
              inset: 0,
              background:
                "linear-gradient(to bottom right, rgba(0,0,0,0.4), rgba(0,0,0,0.7))",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50,
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
              style={{ position: "relative" }}
            >
              {/* Outer rotating ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, ease: "linear", repeat: Infinity }}
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "10rem",
                    height: "10rem",
                    borderRadius: "50%",
                    border: "4px solid transparent",
                    borderTopColor: "rgba(255, 255, 255, 0.2)",
                    borderLeftColor: "rgba(255, 255, 255, 0.2)",
                    borderRightColor: "rgba(255, 255, 255, 0.6)",
                    borderBottomColor: "rgba(255, 255, 255, 0.2)",
                  }}
                />
              </motion.div>

              {/* Middle pulsing ring */}
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "8rem",
                    height: "8rem",
                    borderRadius: "50%",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                  }}
                />
              </motion.div>

              {/* Logo container */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 20, ease: "linear", repeat: Infinity }}
                style={{
                  position: "relative",
                  background: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                  width: "6rem",
                  height: "6rem",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 20px rgba(0, 0, 0, 0.5)",
                }}
              >
                {/* Replace with your actual logo */}
                <img
                  src='"/flipside-logo.svg"'
                  alt="Logo"
                  style={{ width: "4rem", height: "4rem" }}
                />
              </motion.div>

              {/* Particles effect */}
              <div style={{ position: "absolute", inset: 0 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, opacity: 0 }}
                    animate={{
                      x: [0, 20, -20, 0],
                      y: [0, -20, 20, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                    style={{
                      position: "absolute",
                      width: "1rem",
                      height: "1rem",
                      background: "rgba(255, 255, 255, 0.5)",
                      borderRadius: "50%",
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 40,
              padding: "1rem",
              backdropFilter: "blur(8px)",
              background: "rgba(0, 0, 0, 0.2)",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              style={{
                width: "100%",
                maxWidth: "36rem",
                background: "linear-gradient(145deg, #ffffff, #f7f9ff)",
                borderRadius: "1.5rem",
                overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
                position: "relative",
              }}
            >
              {/* Cool gradient graphics for background */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ zIndex: -1 }}
              >
                {/* Main background gradient */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(145deg, #ffffff, #f0f7ff)",
                  }}
                />

                {/* Abstract gradients */}
                <div
                  className="absolute -top-20 -right-20 w-64 h-64 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(59, 130, 246, 0.07), transparent 70%)",
                    filter: "blur(8px)",
                  }}
                />

                <div
                  className="absolute top-40 -left-12 w-40 h-40 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(239, 68, 68, 0.05), transparent 70%)",
                    filter: "blur(10px)",
                  }}
                />

                <div
                  className="absolute -bottom-20 right-20 w-52 h-52 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(16, 185, 129, 0.06), transparent 70%)",
                    filter: "blur(15px)",
                  }}
                />

                {/* Decorative elements */}
                <div className="absolute top-10 right-10 w-40 h-40">
                  <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    className="w-full h-full opacity-5"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="url(#grad1)"
                      strokeWidth="0.5"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="35"
                      stroke="url(#grad1)"
                      strokeWidth="0.5"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="30"
                      stroke="url(#grad1)"
                      strokeWidth="0.5"
                    />
                    <defs>
                      <linearGradient
                        id="grad1"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#EC4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <div className="absolute bottom-10 left-10 w-32 h-32">
                  <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    className="w-full h-full opacity-5"
                  >
                    <path
                      d="M10,10 L90,10 L90,90 L10,90 Z"
                      stroke="url(#grad2)"
                      strokeWidth="0.5"
                    />
                    <path
                      d="M20,20 L80,20 L80,80 L20,80 Z"
                      stroke="url(#grad2)"
                      strokeWidth="0.5"
                    />
                    <path
                      d="M30,30 L70,30 L70,70 L30,70 Z"
                      stroke="url(#grad2)"
                      strokeWidth="0.5"
                    />
                    <defs>
                      <linearGradient
                        id="grad2"
                        x1="0%"
                        y1="100%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#10B981" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              <div className="relative p-8">
                <div className="flex items-start">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-pink-600">
                    <AlertTriangle className="h-7 w-7 text-white" />
                  </div>
                  <div className="ml-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      Data Not Available
                    </h3>
                    <p className="text-gray-600">
                      We couldn't find information for this wallet
                    </p>
                  </div>
                </div>

                <div className="mt-7 space-y-4">
                  <div className="p-5 rounded-xl bg-white/70 backdrop-blur-sm border border-gray-100 shadow-sm">
                    <p className="font-medium text-gray-900 mb-3">
                      Possible reasons:
                    </p>
                    <ul className="space-y-3 pl-5">
                      <li className="flex items-center">
                        <span className="w-3 h-3 bg-gradient-to-br from-red-400 to-red-600 rounded-full mr-3 flex-shrink-0" />
                        <p className="text-gray-700">
                          {errorReason || "Invalid wallet address format"}
                        </p>
                      </li>

                      <li className="flex items-center">
                        <span className="w-3 h-3 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full mr-3 flex-shrink-0" />
                        <p className="text-gray-700">
                          The wallet doesn't exist on the blockchain
                        </p>
                      </li>

                      <li className="flex items-center">
                        <span className="w-3 h-3 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full mr-3 flex-shrink-0" />
                        <p className="text-gray-700">
                          No transaction history available
                        </p>
                      </li>

                      <li className="flex items-center">
                        <span className="w-3 h-3 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full mr-3 flex-shrink-0" />
                        <p className="text-gray-700">
                          Network connectivity issues
                        </p>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    onClick={handleTryAgain}
                    className="bg-white hover:bg-gray-50 text-gray-800 py-6 border border-gray-200 shadow-sm transition-all duration-200"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-6 shadow-md transition-all duration-200">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Learn More
                  </Button>
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
