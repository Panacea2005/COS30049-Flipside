import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PriceData {
  time: number;
  price: number;
}

interface LeaderboardCoin {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  image: string;
  price_change_percentage_24h: number;
  total_volume: number;
  circulating_supply: number;
  last_updated: string;
}

interface GlobalMarketData {
  total_market_cap: { usd: number };
  market_cap_change_percentage_24h: number;
  active_cryptocurrencies: number;
  markets: number;
}

interface CoinOption {
  id: string;
  name: string;
  icon: string;
}

const COINS: CoinOption[] = [
  { id: "bitcoin", name: "Bitcoin", icon: "/icons/bitcoin.svg" },
  { id: "ethereum", name: "Ethereum", icon: "/icons/ethereum.svg" },
  { id: "dogecoin", name: "Dogecoin", icon: "/icons/dogecoin.svg" },
  { id: "litecoin", name: "Litecoin", icon: "/icons/litecoin.svg" },
  { id: "ripple", name: "Ripple", icon: "/icons/ripple.svg" },
  { id: "cardano", name: "Cardano", icon: "/icons/cardano.svg" },
];

export const MarketDashboard: React.FC = () => {
  const [selectedCoin, setSelectedCoin] = useState("bitcoin");
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardCoin[]>([]);
  const [globalData, setGlobalData] = useState<GlobalMarketData | null>(null);
  const [selectedLeaderboardCoin, setSelectedLeaderboardCoin] = useState<LeaderboardCoin | null>(null);

  // Fetch price for the selected coin every 2 seconds
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const fetchPrice = async () => {
      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${selectedCoin}&vs_currencies=usd`
        );
        const data = await res.json();
        const price = data[selectedCoin]?.usd || 0;
        setPriceData((prev) => [...prev.slice(-49), { time: Date.now(), price }]);
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

  // Format time for chart's XAxis
  const formatTime = (time: number) =>
    new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  // Determine line color based on price movement
  const getStrokeColor = () => {
    if (priceData.length < 2) return "#007bff";
    const [prev, current] = priceData.slice(-2);
    return current.price >= prev.price ? "#28a745" : "#dc3545";
  };

  // Compute sub-board data from leaderboardData
  const topUptrend = [...leaderboardData]
    .filter((coin) => coin.price_change_percentage_24h > 0)
    .sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0))
    .slice(0, 3);
  const topDowntrend = [...leaderboardData]
    .filter((coin) => coin.price_change_percentage_24h < 0)
    .sort((a, b) => (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0))
    .slice(0, 3);
  const topPopular = [...leaderboardData]
    .sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0))
    .slice(0, 3);

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* Header & Coin Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-wide text-gray-800">
          Crypto Market Dashboard
        </h1>
        <Select value={selectedCoin} onValueChange={setSelectedCoin}>
          <SelectTrigger className="w-full md:w-64 bg-white border border-gray-300 shadow-sm text-gray-800 hover:bg-gray-100">
            <SelectValue placeholder="Select a coin" />
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

      {/* Real-Time Price Chart */}
      <Card className="p-4 bg-white shadow-lg rounded-lg transform hover:scale-105 transition-transform duration-300">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          {selectedCoin.charAt(0).toUpperCase() + selectedCoin.slice(1)} Price (USD)
        </h2>
        <div className="w-full h-72">
          <ResponsiveContainer>
            <LineChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="time" tickFormatter={formatTime} stroke="#555" tick={{ fontSize: 12 }} />
              <YAxis domain={["auto", "auto"]} stroke="#555" tick={{ fontSize: 12 }} />
              <Tooltip
                labelFormatter={formatTime}
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: "4px" }}
                itemStyle={{ color: "#333" }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={getStrokeColor()}
                strokeWidth={2}
                activeDot={{ r: 6 }}
                dot={false}
                isAnimationActive={true}
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Leaderboard & Sub Board */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Main Leaderboard (70%) */}
        <div className="md:w-7/10 w-full">
          <Card className="p-4 bg-white shadow-lg rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Top 10 Cryptocurrencies by Market Cap
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2">Coin</th>
                    <th className="px-4 py-2">Price (USD)</th>
                    <th className="px-4 py-2">Market Cap</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.map((coin) => (
                    <tr
                      key={coin.id}
                      className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedLeaderboardCoin(coin)}
                    >
                      <td className="px-4 py-2 flex items-center gap-2">
                        <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />
                        <span className="text-gray-800">
                          {coin.name} ({coin.symbol.toUpperCase()})
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-800">
                        ${coin.current_price.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-gray-800">
                        ${coin.market_cap.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        {/* Sub Board (30%) */}
        <div className="md:w-3/10 w-full space-y-4">
          <Card className="p-4 bg-white shadow-lg rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Top Uptrend</h3>
            <ul>
              {topUptrend.map((coin) => (
                <li
                  key={coin.id}
                  className="flex items-center justify-between py-1 hover:bg-green-50 transition-colors cursor-pointer rounded p-1"
                  onClick={() => setSelectedLeaderboardCoin(coin)}
                >
                  <span>{coin.name}</span>
                  <span className="text-green-600">{coin.price_change_percentage_24h.toFixed(2)}%</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-4 bg-white shadow-lg rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Top Downtrend</h3>
            <ul>
              {topDowntrend.map((coin) => (
                <li
                  key={coin.id}
                  className="flex items-center justify-between py-1 hover:bg-red-50 transition-colors cursor-pointer rounded p-1"
                  onClick={() => setSelectedLeaderboardCoin(coin)}
                >
                  <span>{coin.name}</span>
                  <span className="text-red-600">{coin.price_change_percentage_24h.toFixed(2)}%</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-4 bg-white shadow-lg rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Top Popular</h3>
            <ul>
              {topPopular.map((coin) => (
                <li
                  key={coin.id}
                  className="flex items-center justify-between py-1 hover:bg-blue-50 transition-colors cursor-pointer rounded p-1"
                  onClick={() => setSelectedLeaderboardCoin(coin)}
                >
                  <span>{coin.name}</span>
                  <span>${coin.total_volume.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* Global Market Information */}
      {globalData && (
        <Card className="p-4 bg-white shadow-lg rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Global Market Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-gray-600">Total Market Cap (USD)</p>
              <p className="text-2xl font-bold text-gray-800">
                ${globalData.total_market_cap.usd.toLocaleString()}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-gray-600">Market Cap Change (24h)</p>
              <p className="text-2xl font-bold text-gray-800">
                {globalData.market_cap_change_percentage_24h.toFixed(2)}%
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-gray-600">Active Cryptocurrencies</p>
              <p className="text-2xl font-bold text-gray-800">
                {globalData.active_cryptocurrencies}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Modal for Leaderboard Coin Details */}
      {selectedLeaderboardCoin && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-11/12 md:w-1/2 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800">
                {selectedLeaderboardCoin.name} ({selectedLeaderboardCoin.symbol.toUpperCase()})
              </h3>
              <button
                onClick={() => setSelectedLeaderboardCoin(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <img
                src={selectedLeaderboardCoin.image}
                alt={selectedLeaderboardCoin.name}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="text-gray-800 text-lg">
                  Price: ${selectedLeaderboardCoin.current_price.toLocaleString()}
                </p>
                <p className="text-gray-600">
                  Market Cap: ${selectedLeaderboardCoin.market_cap.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-gray-700">
                24h Change:{" "}
                <span className={selectedLeaderboardCoin.price_change_percentage_24h >= 0 ? "text-green-600" : "text-red-600"}>
                  {selectedLeaderboardCoin.price_change_percentage_24h.toFixed(2)}%
                </span>
              </p>
              <p className="text-gray-700">
                Total Volume: ${selectedLeaderboardCoin.total_volume.toLocaleString()}
              </p>
              <p className="text-gray-700">
                Circulating Supply: {selectedLeaderboardCoin.circulating_supply.toLocaleString()}
              </p>
              <p className="text-gray-600 text-sm">
                Last Updated: {new Date(selectedLeaderboardCoin.last_updated).toLocaleString()}
              </p>
            </div>
            <div className="mt-6 text-right">
              <button
                onClick={() => setSelectedLeaderboardCoin(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketDashboard;
