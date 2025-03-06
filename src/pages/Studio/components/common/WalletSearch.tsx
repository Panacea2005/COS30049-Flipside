import { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Database, 
  Globe
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { neo4jClient } from '../../../../lib/neo4j/client';


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
  const [useEtherscan, setUseEtherscan] = useState(false);

  useEffect(() => {
    if (searchPerformed && isError) {
      setShowErrorCard(true);
    } else {
      setShowErrorCard(false);
    }
  }, [searchPerformed, isError]);

  // Update the Neo4j client when the Etherscan toggle is changed
  useEffect(() => {
    neo4jClient.setUseEtherscan(useEtherscan);
  }, [useEtherscan]);

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
        
        {/* Data source toggle */}
        <div className="flex items-center space-x-2 mt-4 px-4 pb-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="etherscan-toggle"
              checked={useEtherscan}
              onCheckedChange={setUseEtherscan}
            />
            <Label htmlFor="etherscan-toggle" className="flex items-center gap-2">
              {useEtherscan ? (
                <>
                  <Globe className="h-4 w-4" /> Using Etherscan
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" /> Using Database
                </>
              )}
            </Label>
          </div>
        </div>
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
                  src='/eth.svg'
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
              backdropFilter: "blur(12px)",
              background: "rgba(0, 0, 0, 0.15)",
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
                background: "linear-gradient(135deg, #ffffff, #f5f7ff)",
                borderRadius: "1.5rem",
                overflow: "hidden",
                boxShadow:
                  "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 40px rgba(0, 0, 0, 0.1)",
                position: "relative",
                border: "1px solid rgba(255, 255, 255, 0.7)",
              }}
            >
              {/* Enhanced background graphics */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  overflow: "hidden",
                  zIndex: -1,
                }}
              >
                {/* Main background with mesh gradient */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(135deg, #ffffff, #f0f7ff, #f8f0ff)",
                    opacity: 0.9,
                  }}
                />

                {/* Flowing blob gradients */}
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    rotate: [0, 2, 0],
                    opacity: [0.6, 0.7, 0.6],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    position: "absolute",
                    top: "-10%",
                    right: "-10%",
                    width: "80%",
                    height: "80%",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(59, 130, 246, 0.08), rgba(99, 102, 241, 0.04), transparent 70%)",
                    filter: "blur(30px)",
                  }}
                />

                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, -3, 0],
                    opacity: [0.5, 0.6, 0.5],
                  }}
                  transition={{
                    duration: 10,
                    delay: 0.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    position: "absolute",
                    top: "40%",
                    left: "-20%",
                    width: "60%",
                    height: "60%",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(236, 72, 153, 0.06), rgba(239, 68, 68, 0.03), transparent 70%)",
                    filter: "blur(35px)",
                  }}
                />

                <motion.div
                  animate={{
                    scale: [1, 1.08, 1],
                    rotate: [0, 3, 0],
                    opacity: [0.4, 0.5, 0.4],
                  }}
                  transition={{
                    duration: 12,
                    delay: 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    position: "absolute",
                    bottom: "-20%",
                    right: "10%",
                    width: "72%",
                    height: "72%",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(16, 185, 129, 0.06), rgba(5, 150, 105, 0.03), transparent 70%)",
                    filter: "blur(40px)",
                  }}
                />

                {/* Animated geometric patterns */}
                <div
                  style={{
                    position: "absolute",
                    top: "5%",
                    right: "20%",
                    width: "40%",
                    height: "40%",
                    opacity: 0.2,
                  }}
                >
                  <motion.svg
                    viewBox="0 0 100 100"
                    fill="none"
                    style={{ width: "100%", height: "100%" }}
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 120,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="url(#grad1)"
                      strokeWidth="0.8"
                      strokeDasharray="15,8,5,3"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="32"
                      stroke="url(#grad1)"
                      strokeWidth="0.6"
                      strokeDasharray="18,12"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="24"
                      stroke="url(#grad1)"
                      strokeWidth="0.4"
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
                        <stop offset="50%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#EC4899" />
                      </linearGradient>
                    </defs>
                  </motion.svg>
                </div>

                <div
                  style={{
                    position: "absolute",
                    bottom: "10%",
                    left: "10%",
                    width: "32%",
                    height: "32%",
                    opacity: 0.2,
                  }}
                >
                  <motion.svg
                    viewBox="0 0 100 100"
                    fill="none"
                    style={{ width: "100%", height: "100%" }}
                    animate={{ rotate: -360 }}
                    transition={{
                      duration: 150,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <motion.path
                      d="M10,10 L90,10 L90,90 L10,90 Z"
                      stroke="url(#grad2)"
                      strokeWidth="0.5"
                      animate={{ opacity: [0.8, 0.4, 0.8] }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    <motion.path
                      d="M20,20 L80,20 L80,80 L20,80 Z"
                      stroke="url(#grad2)"
                      strokeWidth="0.5"
                      animate={{ opacity: [0.5, 0.9, 0.5] }}
                      transition={{
                        duration: 7,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    <motion.path
                      d="M30,30 L70,30 L70,70 L30,70 Z"
                      stroke="url(#grad2)"
                      strokeWidth="0.5"
                      animate={{ opacity: [0.7, 0.3, 0.7] }}
                      transition={{
                        duration: 9,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
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
                        <stop offset="50%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#10B981" />
                      </linearGradient>
                    </defs>
                  </motion.svg>
                </div>

                {/* Subtle floating dots pattern */}
                {Array.from({ length: 30 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      x: Math.random() * 400 - 200,
                      y: Math.random() * 400 - 200,
                      opacity: Math.random() * 0.3 + 0.1,
                    }}
                    animate={{
                      x: [null, Math.random() * 10 - 5 + "px"],
                      y: [null, Math.random() * 10 - 5 + "px"],
                      opacity: [null, Math.random() * 0.2 + 0.1],
                    }}
                    transition={{
                      duration: Math.random() * 4 + 6,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    }}
                    style={{
                      position: "absolute",
                      width: Math.random() * 3 + 1 + "px",
                      height: Math.random() * 3 + 1 + "px",
                      borderRadius: "50%",
                      background: `rgba(${Math.floor(
                        Math.random() * 100 + 100
                      )}, ${Math.floor(
                        Math.random() * 100 + 100
                      )}, ${Math.floor(Math.random() * 200 + 55)}, ${
                        Math.random() * 0.5 + 0.2
                      })`,
                    }}
                  />
                ))}
              </div>

              {/* Card content with improved gradients */}
              <div style={{ position: "relative", padding: "2rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "4rem",
                      height: "4rem",
                      borderRadius: "1rem",
                      background:
                        "linear-gradient(to bottom right, #ef4444, #dc2626, #db2777)",
                      boxShadow:
                        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                      transform: "perspective(1000px)",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, 0, -10, 0] }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        repeatType: "loop",
                        ease: "easeInOut",
                        times: [0, 0.2, 0.5, 0.8, 1],
                      }}
                    >
                      <AlertTriangle
                        style={{
                          height: "2rem",
                          width: "2rem",
                          color: "white",
                          filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))",
                        }}
                      />
                    </motion.div>
                  </div>
                  <div style={{ marginLeft: "1.5rem" }}>
                    <h3
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: "bold",
                        background:
                          "linear-gradient(to right, #111827, #4b5563)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Data Not Available
                    </h3>
                    <p style={{ color: "#4b5563" }}>
                      We couldn't find information for this wallet
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "1.75rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  <motion.div
                    style={{
                      padding: "1.5rem",
                      borderRadius: "0.75rem",
                      background: "rgba(255, 255, 255, 0.6)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255, 255, 255, 0.8)",
                      boxShadow:
                        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                    }}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    whileHover={{
                      boxShadow:
                        "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    }}
                  >
                    <p
                      style={{
                        fontWeight: 500,
                        color: "#111827",
                        marginBottom: "0.75rem",
                      }}
                    >
                      Possible reasons:
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                        paddingLeft: "0.5rem",
                      }}
                    >
                      <motion.div
                        style={{ display: "flex", alignItems: "center" }}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                      >
                        <div
                          style={{
                            flexShrink: 0,
                            width: "1.5rem",
                            height: "1.5rem",
                            borderRadius: "9999px",
                            background:
                              "linear-gradient(to top right, #ef4444, #f43f5e)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                            marginRight: "0.75rem",
                          }}
                        >
                          <div
                            style={{
                              width: "0.5rem",
                              height: "0.5rem",
                              background: "white",
                              borderRadius: "9999px",
                            }}
                          ></div>
                        </div>
                        <p style={{ color: "#374151" }}>
                          {errorReason || "Invalid wallet address format"}
                        </p>
                      </motion.div>

                      <motion.div
                        style={{ display: "flex", alignItems: "center" }}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                      >
                        <div
                          style={{
                            flexShrink: 0,
                            width: "1.5rem",
                            height: "1.5rem",
                            borderRadius: "9999px",
                            background:
                              "linear-gradient(to top right, #f59e0b, #fbbf24)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                            marginRight: "0.75rem",
                          }}
                        >
                          <div
                            style={{
                              width: "0.5rem",
                              height: "0.5rem",
                              background: "white",
                              borderRadius: "9999px",
                            }}
                          ></div>
                        </div>
                        <p style={{ color: "#374151" }}>
                          The wallet doesn't exist on the blockchain
                        </p>
                      </motion.div>

                      <motion.div
                        style={{ display: "flex", alignItems: "center" }}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                      >
                        <div
                          style={{
                            flexShrink: 0,
                            width: "1.5rem",
                            height: "1.5rem",
                            borderRadius: "9999px",
                            background:
                              "linear-gradient(to top right, #3b82f6, #6366f1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                            marginRight: "0.75rem",
                          }}
                        >
                          <div
                            style={{
                              width: "0.5rem",
                              height: "0.5rem",
                              background: "white",
                              borderRadius: "9999px",
                            }}
                          ></div>
                        </div>
                        <p style={{ color: "#374151" }}>
                          No transaction history available
                        </p>
                      </motion.div>

                      <motion.div
                        style={{ display: "flex", alignItems: "center" }}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                      >
                        <div
                          style={{
                            flexShrink: 0,
                            width: "1.5rem",
                            height: "1.5rem",
                            borderRadius: "9999px",
                            background:
                              "linear-gradient(to top right, #10b981, #34d399)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                            marginRight: "0.75rem",
                          }}
                        >
                          <div
                            style={{
                              width: "0.5rem",
                              height: "0.5rem",
                              background: "white",
                              borderRadius: "9999px",
                            }}
                          ></div>
                        </div>
                        <p style={{ color: "#374151" }}>
                          Network connectivity issues
                        </p>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>

                <div
                  style={{
                    marginTop: "2rem",
                    display: "grid",
                    gap: "1rem",
                    gridTemplateColumns: "1fr 1fr",
                  }}
                >
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    style={{ width: "100%" }}
                  >
                    <Button
                      onClick={handleTryAgain}
                      className="w-full bg-white hover:bg-gray-50 text-gray-800 py-6 border border-gray-100 shadow-md transition-all duration-200 rounded-xl"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "loop",
                          ease: "linear",
                        }}
                        style={{ marginRight: "0.5rem" }}
                      >
                        <RefreshCw style={{ height: "1rem", width: "1rem" }} />
                      </motion.div>
                      Try Again
                    </Button>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    style={{ width: "100%" }}
                  >
                    <Button className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white py-6 shadow-lg transition-all duration-200 rounded-xl">
                      <ExternalLink
                        style={{
                          marginRight: "0.5rem",
                          height: "1rem",
                          width: "1rem",
                        }}
                      />
                      Learn More
                    </Button>
                  </motion.div>
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
