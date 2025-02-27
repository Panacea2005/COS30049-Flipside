import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Area,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  BarChart3,
  Database,
} from "lucide-react";

interface PriceData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface LeaderboardCoin {
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
}

interface GlobalMarketData {
  total_market_cap: { usd: number };
  market_cap_change_percentage_24h: number;
  active_cryptocurrencies: number;
  markets: number;
  total_volume: { usd: number };
}

interface CoinOption {
  id: string;
  name: string;
  icon: string;
}

const COINS: CoinOption[] = [
  { id: "bitcoin", name: "BTC", icon: "/bitcoin.svg" },
  { id: "ethereum", name: "ETH", icon: "/eth.svg" },
  { id: "dogecoin", name: "DOGE", icon: "/dogecoin.svg" },
  { id: "litecoin", name: "LTC", icon: "/litecoin.svg" },
  { id: "ripple", name: "XRP", icon: "/xrp.svg" },
  { id: "cardano", name: "ADA", icon: "/cardano.svg" },
  { id: "tether", name: "USDT", icon: "/usdt.svg" },
  { id: "binancecoin", name: "BNB", icon: "/bnb.svg" },
  { id: "solana", name: "SOL", icon: "/solana.svg" },
  { id: "staked-ether", name: "STETH", icon: "/steth.svg" },
];

export const MarketDashboard: React.FC = () => {
  const [selectedCoin, setSelectedCoin] = useState("bitcoin");
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardCoin[]>([]);
  const [globalData, setGlobalData] = useState<GlobalMarketData | null>(null);
  const [selectedLeaderboardCoin, setSelectedLeaderboardCoin] =
    useState<LeaderboardCoin | null>(null);

  const selectedCoinObj = COINS.find((coin) => coin.id === selectedCoin);

  // Fetch price data every 2 seconds for the selected coin
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const fetchPrice = async () => {
      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${selectedCoin}&vs_currencies=usd`
        );
        const data = await res.json();
        if (!data[selectedCoin]) {
          console.error(`No price data available for ${selectedCoin}`);
          toast({
            title: "Price Data Error",
            description: `No price data available for ${selectedCoin}`,
            variant: "destructive",
          });
          return;
        }
        const currentPrice = data[selectedCoin].usd;

        // Generate random candlestick data for demo purposes
        // In a real app, you would use actual OHLC data from the API
        setPriceData((prev) => {
          const prevPrice =
            prev.length > 0 ? prev[prev.length - 1].close : currentPrice;
          const variance = prevPrice * 0.005; // 0.5% variance for demo
          const open = prevPrice;
          const close = currentPrice;
          const high = Math.max(open, close) + Math.random() * variance;
          const low = Math.min(open, close) - Math.random() * variance;

          return [
            ...prev.slice(-49),
            {
              time: Date.now(),
              open,
              high,
              low,
              close,
            },
          ];
        });
      } catch (error) {
        console.error("Error fetching price:", error);
        toast({
          title: "Price Fetch Error",
          description: "Failed to fetch coin price",
          variant: "destructive",
        });
      }
    };
    setPriceData([]);
    fetchPrice();
    interval = setInterval(fetchPrice, 2000);
    return () => clearInterval(interval);
  }, [selectedCoin]);

  // Fetch leaderboard data every 60 seconds
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false"
        );
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          console.error("No leaderboard data available");
          toast({
            title: "Leaderboard Data Error",
            description: "No leaderboard data available",
            variant: "destructive",
          });
          return;
        }
        setLeaderboardData(data);
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        toast({
          title: "Leaderboard Error",
          description: "Failed to fetch leaderboard data",
          variant: "destructive",
        });
      }
    };
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch global market data every 60 seconds
  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/global");
        const data = await res.json();
        if (!data.data) {
          console.error("No global market data available");
          toast({
            title: "Global Data Error",
            description: "No global market data available",
            variant: "destructive",
          });
          return;
        }
        setGlobalData(data.data);
      } catch (error) {
        console.error("Error fetching global data:", error);
        toast({
          title: "Global Data Error",
          description: "Failed to fetch global market data",
          variant: "destructive",
        });
      }
    };
    fetchGlobalData();
    const interval = setInterval(fetchGlobalData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Format time for the chart's XAxis
  const formatTime = (time: number) =>
    new Date(time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  // Compute sub-board data
  const topUptrend = [...leaderboardData]
    .filter(
      (coin) =>
        coin.price_change_percentage_24h != null &&
        coin.price_change_percentage_24h > 0
    )
    .sort(
      (a, b) => b.price_change_percentage_24h! - a.price_change_percentage_24h!
    )
    .slice(0, 3);
  const topDowntrend = [...leaderboardData]
    .filter(
      (coin) =>
        coin.price_change_percentage_24h != null &&
        coin.price_change_percentage_24h < 0
    )
    .sort(
      (a, b) => a.price_change_percentage_24h! - b.price_change_percentage_24h!
    )
    .slice(0, 3);
  const topPopular = [...leaderboardData]
    .sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0))
    .slice(0, 3);

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header & Coin Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-semibold leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-green-600">
          Crypto Market Dashboard
        </h1>
        <Select value={selectedCoin} onValueChange={setSelectedCoin}>
          <SelectTrigger className="w-full md:w-64 bg-white bg-opacity-90 backdrop-blur-sm border border-gray-200 shadow-sm text-gray-800 hover:bg-gray-100 transition-all">
            <SelectValue>
              <div className="flex items-center gap-2">
                {selectedCoinObj && (
                  <img
                    src={selectedCoinObj.icon}
                    alt={selectedCoinObj.name}
                    className="w-4 h-4"
                  />
                )}
                <span>
                  {selectedCoinObj ? selectedCoinObj.name : "Select a coin"}
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {COINS.map((coin) => (
              <SelectItem key={coin.id} value={coin.id}>
                <div className="flex items-center gap-2">
                  <img src={coin.icon} alt={coin.name} className="w-4 h-4" />
                  <span>{coin.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Global Market Information - Moved to top */}
      {globalData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-white shadow-xl rounded-xl transform hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">
                  Total Market Cap
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  $
                  {(globalData.total_market_cap.usd / 1000000000000).toFixed(2)}
                  T
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <DollarSign size={24} />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white shadow-xl rounded-xl transform hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">
                  24h Trading Volume
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                  $
                  {globalData.total_volume?.usd
                    ? (globalData.total_volume.usd / 1000000000).toFixed(2)
                    : "0"}
                  B
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
                <Activity size={24} />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white shadow-xl rounded-xl transform hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">
                  Active Cryptocurrencies
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                  {globalData.active_cryptocurrencies.toLocaleString()}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg">
                <Database size={24} />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Real-Time Price Chart */}
      <Card className="p-6 bg-white bg-opacity-90 backdrop-blur-sm shadow-xl rounded-lg transform hover:shadow-2xl transition-all duration-300 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <BarChart3 className="text-blue-500" size={20} />
            {selectedCoin.charAt(0).toUpperCase() + selectedCoin.slice(1)} Price
            Chart (USD)
          </h2>
          <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
            Updated in real-time
          </div>
        </div>
        <div className="w-full h-72 bg-gray-50 rounded-lg p-2">
          <ResponsiveContainer>
            <ComposedChart data={priceData}>
              <defs>
                <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0066ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0066ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e0e0e0"
                opacity={0.5}
              />
              <XAxis
                dataKey="time"
                tickFormatter={formatTime}
                stroke="#555"
                tick={{ fontSize: 12 }}
                tickCount={6}
              />
              <YAxis
                domain={["auto", "auto"]}
                stroke="#555"
                tick={{ fontSize: 12 }}
                tickCount={6}
              />
              <Tooltip
                labelFormatter={formatTime}
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  border: "none",
                }}
                itemStyle={{ color: "#333" }}
                formatter={(value: any) =>
                  value != null ? ["$" + value.toFixed(2)] : "N/A"
                }
                cursor={{
                  stroke: "#ccc",
                  strokeWidth: 1,
                  strokeDasharray: "5 5",
                }}
                active={true}
              />

              {/* Area under the line with gradient effect */}
              <Area
                type="monotone"
                dataKey="close"
                stroke="none"
                fillOpacity={1}
                fill="url(#colorClose)"
                isAnimationActive={true}
                animationDuration={500}
              />

              {/* Line chart for close price with enhanced styling */}
              <Line
                type="monotone"
                dataKey="close"
                stroke="#0066ff"
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 6,
                  stroke: "#0066ff",
                  strokeWidth: 2,
                  fill: "white",
                }}
                isAnimationActive={true}
                animationDuration={800}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Leaderboard & Sub-Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Leaderboard (2/3) */}
        <div className="md:col-span-2">
          <Card className="p-6 bg-white bg-opacity-90 backdrop-blur-sm shadow-xl rounded-lg border border-gray-100 h-full">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <Activity className="text-indigo-500" size={20} />
              Top 10 Cryptocurrencies
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <th className="px-4 py-3 rounded-l-lg">Coin</th>
                    <th className="px-4 py-3">Price (USD)</th>
                    <th className="px-4 py-3 rounded-r-lg">Market Cap</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.map((coin, index) => (
                    <tr
                      key={coin.id}
                      className="border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer animate-fadeIn"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => setSelectedLeaderboardCoin(coin)}
                    >
                      <td className="px-4 py-3 flex items-center gap-2">
                        <img
                          src={coin.image}
                          alt={coin.name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-gray-800 font-medium">
                          {coin.name}{" "}
                          <span className="text-gray-500">
                            ({coin.symbol.toUpperCase()})
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-medium">
                        ${coin.current_price.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-800">
                        ${coin.market_cap.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Sub-Board (1/3) */}
        <div className="space-y-6">
          <Card className="p-4 bg-white bg-opacity-90 backdrop-blur-sm shadow-xl rounded-lg border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <TrendingUp className="text-green-500" size={18} />
              Top Uptrend
            </h3>
            {topUptrend.length > 0 ? (
              <ul className="space-y-2">
                {topUptrend.map((coin, index) => (
                  <li
                    key={coin.id}
                    className="flex items-center justify-between py-2 px-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg cursor-pointer transform hover:translate-x-1 transition-all duration-300 animate-fadeIn"
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => setSelectedLeaderboardCoin(coin)}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={coin.image}
                        alt={coin.name}
                        className="w-5 h-5 rounded-full"
                      />
                      <span className="font-medium">{coin.name}</span>
                    </div>
                    <span className="text-green-600 font-bold bg-green-100 px-2 py-1 rounded-full text-sm">
                      +
                      {coin.price_change_percentage_24h != null
                        ? coin.price_change_percentage_24h.toFixed(2)
                        : "N/A"}
                      %
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-6 px-3 bg-gray-50 rounded-lg text-center text-gray-500 animate-fadeIn">
                <p>No coins with positive trends in the last 24h</p>
              </div>
            )}
          </Card>

          <Card className="p-4 bg-white bg-opacity-90 backdrop-blur-sm shadow-xl rounded-lg border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <TrendingDown className="text-red-500" size={18} />
              Top Downtrend
            </h3>
            {topDowntrend.length > 0 ? (
              <ul className="space-y-2">
                {topDowntrend.map((coin, index) => (
                  <li
                    key={coin.id}
                    className="flex items-center justify-between py-2 px-3 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg cursor-pointer transform hover:translate-x-1 transition-all duration-300 animate-fadeIn"
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => setSelectedLeaderboardCoin(coin)}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={coin.image}
                        alt={coin.name}
                        className="w-5 h-5 rounded-full"
                      />
                      <span className="font-medium">{coin.name}</span>
                    </div>
                    <span className="text-red-600 font-bold bg-red-100 px-2 py-1 rounded-full text-sm">
                      {coin.price_change_percentage_24h != null
                        ? coin.price_change_percentage_24h.toFixed(2)
                        : "N/A"}
                      %
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-6 px-3 bg-gray-50 rounded-lg text-center text-gray-500 animate-fadeIn">
                <p>No coins with negative trends in the last 24h</p>
              </div>
            )}
          </Card>

          <Card className="p-4 bg-white bg-opacity-90 backdrop-blur-sm shadow-xl rounded-lg border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <BarChart3 className="text-blue-500" size={18} />
              Top Volume
            </h3>
            {topPopular.length > 0 ? (
              <ul className="space-y-2">
                {topPopular.map((coin, index) => (
                  <li
                    key={coin.id}
                    className="flex items-center justify-between py-2 px-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg cursor-pointer transform hover:translate-x-1 transition-all duration-300 animate-fadeIn"
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => setSelectedLeaderboardCoin(coin)}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={coin.image}
                        alt={coin.name}
                        className="w-5 h-5 rounded-full"
                      />
                      <span className="font-medium">{coin.name}</span>
                    </div>
                    <span className="text-blue-600 font-bold bg-blue-100 px-2 py-1 rounded-full text-sm">
                      ${((coin.total_volume || 0) / 1000000).toFixed(1)}M
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-6 px-3 bg-gray-50 rounded-lg text-center text-gray-500 animate-fadeIn">
                <p>No volume data available</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal for Leaderboard Coin Details */}
      {selectedLeaderboardCoin && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-11/12 md:w-2/5 border border-blue-100 animate-scaleIn">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <img
                  src={selectedLeaderboardCoin.image}
                  alt={selectedLeaderboardCoin.name}
                  className="w-10 h-10 rounded-full"
                />
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {selectedLeaderboardCoin.name}
                  <span className="text-gray-500 text-sm ml-2">
                    ({selectedLeaderboardCoin.symbol.toUpperCase()})
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedLeaderboardCoin(null)}
                className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg">
                <p className="text-gray-500 text-sm">Current Price</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${selectedLeaderboardCoin.current_price.toLocaleString()}
                </p>
              </div>

              <div
                className={`p-4 rounded-lg ${
                  selectedLeaderboardCoin.price_change_percentage_24h != null &&
                  selectedLeaderboardCoin.price_change_percentage_24h >= 0
                    ? "bg-gradient-to-br from-green-50 to-emerald-50"
                    : "bg-gradient-to-br from-red-50 to-rose-50"
                }`}
              >
                <p className="text-gray-500 text-sm">24h Change</p>
                <p
                  className={`text-2xl font-bold ${
                    selectedLeaderboardCoin.price_change_percentage_24h !=
                      null &&
                    selectedLeaderboardCoin.price_change_percentage_24h >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {selectedLeaderboardCoin.price_change_percentage_24h != null
                    ? selectedLeaderboardCoin.price_change_percentage_24h.toFixed(
                        2
                      )
                    : "N/A"}
                  %
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-600">Market Cap</span>
                <span className="font-medium">
                  ${selectedLeaderboardCoin.market_cap.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-600">Trading Volume (24h)</span>
                <span className="font-medium">
                  $
                  {(selectedLeaderboardCoin.total_volume || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-600">Circulating Supply</span>
                <span className="font-medium">
                  {(
                    selectedLeaderboardCoin.circulating_supply || 0
                  ).toLocaleString()}{" "}
                  {selectedLeaderboardCoin.symbol.toUpperCase()}
                </span>
              </div>

              <div className="flex justify-between text-sm text-gray-500">
                <span>Last Updated</span>
                <span>
                  {new Date(
                    selectedLeaderboardCoin.last_updated
                  ).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedLeaderboardCoin(null)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedCoin(selectedLeaderboardCoin.id);
                  setSelectedLeaderboardCoin(null);
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                View Chart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add global CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 5s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default MarketDashboard;
