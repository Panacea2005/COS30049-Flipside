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
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  BarChart3,
  Database,
} from "lucide-react";
import { CryptoBubbles } from "./CryptoBubbles";

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

interface CryptoBubble extends LeaderboardCoin {
  x: number;
  y: number;
  size: number;
}

export const MarketDashboard: React.FC = () => {
  const [selectedCoin, setSelectedCoin] = useState("bitcoin");
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardCoin[]>([]);
  const [globalData, setGlobalData] = useState<GlobalMarketData | null>(null);
  const [selectedLeaderboardCoin, setSelectedLeaderboardCoin] =
    useState<LeaderboardCoin | null>(null);

  const [timeRange, setTimeRange] = useState("1D"); // Default to daily view
  const timeRanges = ["1H", "4H", "1D", "1W", "1M", "3M", "ALL"];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const fetchInitialPrice = async () => {
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

        // Generate historical data based on selected time range
        const historicalData = generateHistoricalData(currentPrice, timeRange);
        setPriceData(historicalData);

        // Setup interval for real-time updates
        startRealTimeUpdates(currentPrice);
      } catch (error) {
        console.error("Error fetching initial price:", error);
        toast({
          title: "Price Fetch Error",
          description: "Failed to fetch coin price",
          variant: "destructive",
        });
      }
    };

    const startRealTimeUpdates = (initialPrice: number) => {
      // Clear any existing interval
      if (interval) clearInterval(interval);

      // Set update frequency based on time range
      const updateFrequency =
        timeRange === "1H"
          ? 1000 // 1 second
          : timeRange === "4H"
          ? 2000 // 2 seconds
          : timeRange === "1D"
          ? 3000 // 3 seconds
          : 5000; // 5 seconds for longer timeframes

      let currentPrice = initialPrice;

      interval = setInterval(() => {
        // Simulate price movement
        const volatilityFactor = 0.0005; // 0.05% base volatility for real-time updates
        const priceChange =
          currentPrice * volatilityFactor * (Math.random() * 2 - 1);
        currentPrice = currentPrice + priceChange;

        // Add new data point
        setPriceData((prev) => {
          const variance = currentPrice * 0.0002;
          const newPoint = {
            time: Date.now(),
            open: prev.length
              ? prev[prev.length - 1].close
              : currentPrice - variance,
            close: currentPrice,
            high: currentPrice + Math.random() * variance,
            low: currentPrice - Math.random() * variance,
          };

          // Remove oldest data point if we're at the maximum for this timeframe
          let maxPoints: number;
          switch (timeRange) {
            case "1H":
              maxPoints = 60;
              break;
            case "4H":
              maxPoints = 48;
              break;
            case "1D":
              maxPoints = 48;
              break;
            case "1W":
              maxPoints = 42;
              break;
            case "1M":
              maxPoints = 30;
              break;
            case "3M":
              maxPoints = 45;
              break;
            case "ALL":
              maxPoints = 52;
              break;
            default:
              maxPoints = 60;
          }

          return [...prev.slice(-maxPoints + 1), newPoint];
        });
      }, updateFrequency);
    };

    fetchInitialPrice();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedCoin, timeRange]);

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

  // This function generates synthetic historical data based on the selected time range
  const generateHistoricalData = (currentPrice: number, range: string) => {
    const now = Date.now();
    let dataPoints: PriceData[] = [];
    let timespan: number;
    let intervals: number;

    // Set timespan and number of intervals based on range
    switch (range) {
      case "1H":
        timespan = 60 * 60 * 1000; // 1 hour in ms
        intervals = 60; // One data point per minute
        break;
      case "4H":
        timespan = 4 * 60 * 60 * 1000; // 4 hours in ms
        intervals = 48; // One data point per 5 minutes
        break;
      case "1D":
        timespan = 24 * 60 * 60 * 1000; // 1 day in ms
        intervals = 48; // One data point per 30 minutes
        break;
      case "1W":
        timespan = 7 * 24 * 60 * 60 * 1000; // 1 week in ms
        intervals = 42; // One data point per 4 hours
        break;
      case "1M":
        timespan = 30 * 24 * 60 * 60 * 1000; // 1 month in ms
        intervals = 30; // One data point per day
        break;
      case "3M":
        timespan = 90 * 24 * 60 * 60 * 1000; // 3 months in ms
        intervals = 45; // One data point per 2 days
        break;
      case "ALL":
        timespan = 365 * 24 * 60 * 60 * 1000; // 1 year in ms
        intervals = 52; // One data point per week
        break;
      default:
        timespan = 60 * 60 * 1000; // Default to 1 hour
        intervals = 60;
    }

    // Starting price (slightly randomized)
    let price = currentPrice * (1 + (Math.random() * 0.1 - 0.05)); // ±5% variation

    // Generate data points from past to present
    for (let i = 0; i < intervals; i++) {
      // More realistic price movements with some trend continuity
      const trend = Math.random() > 0.5 ? 1 : -1;
      const volatility = currentPrice * 0.005; // 0.5% base volatility

      // Scale volatility based on timeframe (longer timeframes = more potential price change)
      const timeScaleFactor =
        range === "1H"
          ? 1
          : range === "4H"
          ? 1.5
          : range === "1D"
          ? 2
          : range === "1W"
          ? 3
          : range === "1M"
          ? 4
          : range === "3M"
          ? 5
          : 6;

      // Previous price affects next price (trend continuity)
      const prevTrend =
        i > 0 ? (price > dataPoints[i - 1].close ? 0.6 : -0.6) : 0;
      price =
        price +
        (trend + prevTrend) * volatility * timeScaleFactor * Math.random();

      // Add some randomness to prevent too smooth curves
      const variance = volatility * 0.5;

      const timestamp = now - timespan + (i / intervals) * timespan;
      dataPoints.push({
        time: timestamp,
        open: price - Math.random() * variance,
        close: price,
        high: price + Math.random() * variance,
        low: price - Math.random() * variance,
      });
    }

    return dataPoints;
  };

  const formatTime = (time: number) => {
    const date = new Date(time);

    switch (timeRange) {
      case "1H":
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      case "4H":
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      case "1D":
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      case "1W":
        return `${date.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        })}`;
      case "1M":
        return date.toLocaleDateString([], {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      case "3M":
        return date.toLocaleDateString([], {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      case "ALL":
        return date.toLocaleDateString([], {
          month: "short",
          year: "numeric",
        });
      default:
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
    }
  };

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

  const handleBubbleClick = (bubble: CryptoBubble) => {
    // Convert bubble to LeaderboardCoin format
    const coinData: LeaderboardCoin = {
      id: bubble.id,
      symbol: bubble.symbol,
      name: bubble.name,
      current_price: bubble.current_price,
      market_cap: bubble.market_cap,
      image: bubble.image,
      price_change_percentage_24h: bubble.price_change_percentage_24h,
      total_volume: bubble.total_volume,
      circulating_supply: bubble.circulating_supply,
      last_updated: bubble.last_updated,
    };

    setSelectedLeaderboardCoin(coinData);
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header & Coin Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-semibold leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-green-600">
          Crypto Market Dashboard
        </h1>
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
          <div className="flex items-center gap-1">
            {/* Time range selector */}
            <div className="bg-gray-100 rounded-lg p-1 flex">
              {timeRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    timeRange === range
                      ? "bg-blue-500 text-white"
                      : "hover:bg-gray-200 text-gray-600"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full ml-2">
              Updated in real-time
            </div>
          </div>
        </div>
        <div className="w-full h-72 bg-gray-50 rounded-lg p-2">
          <ResponsiveContainer>
            <ComposedChart
              data={priceData}
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            >
              <defs>
                <filter id="shadow" height="200%">
                  <feDropShadow
                    dx="0"
                    dy="2"
                    stdDeviation="2"
                    floodColor="#3b82f6"
                    floodOpacity="0.3"
                  />
                </filter>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e0e0e0"
                opacity={0.3}
                vertical={false}
              />

              <XAxis
                dataKey="time"
                tickFormatter={formatTime}
                stroke="#94a3b8"
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickCount={6}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={{ stroke: "#e2e8f0" }}
                padding={{ left: 10, right: 10 }}
              />

              <YAxis
                domain={["auto", "auto"]}
                stroke="#94a3b8"
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickCount={6}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={{ stroke: "#e2e8f0" }}
                width={70}
              />

              <Tooltip
                labelFormatter={formatTime}
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.98)",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  border: "1px solid rgba(226, 232, 240, 0.8)",
                  padding: "12px",
                }}
                itemStyle={{ color: "#334155", fontWeight: "500" }}
                formatter={(value: any) =>
                  value != null
                    ? [`$${value.toFixed(2).toLocaleString()}`]
                    : "N/A"
                }
                cursor={{
                  stroke: "#cbd5e1",
                  strokeWidth: 1,
                  strokeDasharray: "5 5",
                }}
                active={true}
              />

              {/* Line chart for close price with enhanced styling */}
              <Line
                type="monotone"
                dataKey="close"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 7,
                  stroke: "#3b82f6",
                  strokeWidth: 2,
                  fill: "white",
                  filter: "url(#shadow)",
                }}
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-in-out"
                style={{ filter: "url(#shadow)" }}
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

      <CryptoBubbles onBubbleClick={handleBubbleClick} />

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
