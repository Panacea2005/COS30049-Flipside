import { useEffect, useState } from "react";
import { neo4jClient } from "../../../../lib/neo4j/client";
import { AddressInfo, BalanceData, GasData } from "../../../../lib/neo4j/types";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Sector,
  Label,
  LineChart,
  Line,
  XAxis,
  CartesianGrid,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart, Bar, Legend } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface AddressInfoSectionProps {
  address: string;
}

const COLORS = ["#4F46E5", "#818CF8"];

export const AddressInfoSection = ({ address }: AddressInfoSectionProps) => {
  const [addressInfo, setAddressInfo] = useState<AddressInfo | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [balanceData, setBalanceData] = useState<BalanceData[]>([]);
  const [gasData, setGasData] = useState<GasData[]>([]);
  const [activeChart, setActiveChart] = useState<"balance" | "gas">("balance");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<"database" | "etherscan">(
    "database"
  );
  const [dateRange, setDateRange] = useState<{firstDate: string, lastDate: string} | null>(null);

  const [totals, setTotals] = useState({
    balance: 0,
    totalTransactionFee: 0,
  });

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Check which data source is being used
    const isUsingEtherscan = neo4jClient.isUsingEtherscan();
    setDataSource(isUsingEtherscan ? "etherscan" : "database");

    async function fetchData() {
      try {
        const info = await neo4jClient.getAddressInfo(address);
        if (!info) {
          throw new Error("Address information not found");
        }
        setAddressInfo(info);

        await fetchBalanceData();
        await fetchGasData();

        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching address data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch address data"
        );
        setIsLoading(false);
      }
    }

    fetchData();
  }, [address]);

  useEffect(() => {
    if (addressInfo) {
      setTotals((prevTotals) => ({
        ...prevTotals,
        balance: parseFloat(addressInfo.balance) / 1e18,
      }));
    }
  }, [addressInfo]);

  const fetchBalanceData = async () => {
    try {
      const result = await neo4jClient.getBalanceOverTime(address);
      console.log("Fetched Balance Data:", result);
      setBalanceData(result);
      updateDateRange(result, gasData);
    } catch (err) {
      console.error("Error fetching balance data:", err);
    }
  };

  const fetchGasData = async () => {
    try {
      const gasData = await neo4jClient.getGasDataOverTime(address);
      console.log("Fetched Gas Data:", gasData);
      setGasData(gasData);
      updateDateRange(balanceData, gasData);
      setTotals((prevTotals) => ({
        ...prevTotals,
        totalTransactionFee: gasData.reduce(
          (acc, curr) => acc + curr.transactionFee,
          0
        ),
      }));
    } catch (err) {
      console.error("Error fetching gas data:", err);
    }
  };

  // Calculate the date range from both datasets
  const updateDateRange = (balanceData: BalanceData[], gasData: GasData[]) => {
    if (!balanceData.length && !gasData.length) return;
    
    // Combine dates from both datasets
    const allDates: string[] = [
      ...balanceData.map(item => item.date),
      ...gasData.map(item => item.date)
    ].filter(Boolean);
    
    if (allDates.length === 0) return;
    
    // Convert to Date objects for comparison
    const dateDates = allDates.map(date => new Date(date));
    
    // Find min and max dates
    const firstDate = new Date(Math.min(...dateDates.map(d => d.getTime()))).toISOString();
    const lastDate = new Date(Math.max(...dateDates.map(d => d.getTime()))).toISOString();
    
    setDateRange({ firstDate, lastDate });
  };

  useEffect(() => {
    console.log("Updated Totals:", totals);
  }, [totals]);

  if (isLoading) {
    return (
      <Card className="bg-background">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Loading Address Details...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !addressInfo) {
    return (
      <Card className="bg-background">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-red-600">
            Error Loading Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error || "Failed to load address information. Please try again."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const pieData = [
    { label: "Sent", value: addressInfo.sentTransactions },
    { label: "Received", value: addressInfo.receivedTransactions },
  ];

  const volumeData = [
    { label: "Sent", value: parseFloat(addressInfo.totalSentValue) / 1e18 },
    {
      label: "Received",
      value: parseFloat(addressInfo.totalReceivedValue) / 1e18,
    },
  ];

  const totalTransactions = addressInfo.totalTransactions;

  const chartConfig = {
    value: {
      label: "Value",
    },
    ...pieData.reduce((acc, item, index) => {
      acc[item.label] = {
        label: item.label,
        color: COLORS[index % COLORS.length],
      };
      return acc;
    }, {} as ChartConfig),
  };

  const lineChartConfig = {
    views: {
      label: "Values",
    },
    balance: {
      label: "Balance",
      color: "hsl(var(--chart-1))",
    },
    gas: {
      label: "Transaction Fee",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  // Format value based on size - use scientific notation for very small values
  const formatValue = (value: number | undefined) => {
    if (value === undefined) return "0.0000";
    
    if (value === 0) return "0.0000";
    
    // If value is very small (less than 0.0001), use scientific notation
    if (value < 0.0001) {
      return value.toExponential(4);
    }
    
    return value.toFixed(4);
  };
  
  // Get the appropriate domain for the Y axis based on the active chart
  const getYAxisDomain = () => {
    if (activeChart === "balance") {
      return undefined; // Use default auto-scaling for balance
    } else {
      // For gas data, find the max value to set appropriate scale
      const maxGasFee = Math.max(...gasData.map(d => d.transactionFee), 0.000001);
      return [0, maxGasFee * 1.1]; // Add 10% padding at the top
    }
  };

  // Get the current dataset based on active chart
  const getCurrentData = () => {
    return activeChart === "balance" ? balanceData : gasData;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <Card className="bg-background">
      <ChartStyle id="transaction-chart" config={chartConfig} />
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              Address Details
            </CardTitle>
            <CardDescription>
              <div className="flex items-center gap-2">
                <span
                  className="text-sm text-muted-foreground truncate max-w-[150px] md:max-w-none"
                  title={addressInfo.addressId}
                >
                  {addressInfo.addressId}
                </span>
                <Badge variant="secondary">{addressInfo.type}</Badge>
              </div>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card className="p-6 bg-background shadow-none border">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">
                Balance
              </span>
              <span className="text-2xl font-bold">
                {(parseFloat(addressInfo.balance) / 1e18).toFixed(4)} ETH
              </span>
            </div>
          </Card>
          <Card className="p-6 bg-background shadow-none border">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">
                First Active
              </span>
              <span className="text-2xl font-bold">
                {new Date(addressInfo.firstSeen).toLocaleDateString()}
              </span>
            </div>
          </Card>
          <Card className="p-6 bg-background shadow-none border">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">
                Last Active
              </span>
              <span className="text-2xl font-bold">
                {new Date(addressInfo.lastSeen).toLocaleDateString()}
              </span>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-background shadow-none border">
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Volume Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={volumeData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="label" />
                    <YAxis />
                    <ChartTooltip
                      content={({ payload }) => {
                        if (payload && payload[0]) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-md">
                              <div className="grid grid-cols-2 gap-2">
                                <span className="text-sm font-medium">
                                  {payload[0].name}
                                </span>
                                <span className="text-sm font-medium">{`${payload[0].value} ETH`}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="value" fill={COLORS[0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background shadow-none border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-medium">
                Transaction Distribution
              </CardTitle>
              <Select
                value={pieData[activeIndex].label}
                onValueChange={(value) =>
                  setActiveIndex(pieData.findIndex((d) => d.label === value))
                }
              >
                <SelectTrigger className="h-8 w-[120px]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {pieData.map((data, index) => (
                    <SelectItem key={index} value={data.label}>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: COLORS[index] }}
                        />
                        {data.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <ChartContainer
                id="transaction-chart"
                config={chartConfig}
                className="aspect-square w-full max-w-[300px] mx-auto"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={60}
                      outerRadius={80}
                      strokeWidth={5}
                      activeIndex={activeIndex}
                      activeShape={({ outerRadius = 0, ...props }) => (
                        <g>
                          <Sector {...props} outerRadius={outerRadius + 10} />
                          <Sector
                            {...props}
                            outerRadius={outerRadius + 25}
                            innerRadius={outerRadius + 12}
                          />
                        </g>
                      )}
                    >
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  className="fill-foreground text-2xl font-bold"
                                >
                                  {totalTransactions.toLocaleString()}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 20}
                                  className="fill-muted-foreground text-sm"
                                >
                                  Transactions
                                </tspan>
                              </text>
                            );
                          }
                        }}
                      />
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
              <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                <CardTitle>Historical Data</CardTitle>
                <CardDescription>
                  Balance and transaction fee over time
                  {dateRange && (
                    <span className="block text-xs mt-1">
                      {formatDate(dateRange.firstDate)} - {formatDate(dateRange.lastDate)}
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex">
                {["balance", "gas"].map((key) => {
                  const chart = key as keyof typeof lineChartConfig;
                  return (
                    <button
                      key={chart}
                      data-active={activeChart === chart}
                      className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                      onClick={() => setActiveChart(chart as "balance" | "gas")}
                    >
                      <span className="text-xs text-muted-foreground">
                        {lineChartConfig[chart].label}
                      </span>
                      <span className="text-lg font-bold leading-none sm:text-3xl">
                        {chart === "balance"
                          ? formatValue(totals.balance)
                          : formatValue(totals.totalTransactionFee)}{" "}
                        ETH
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:p-6">
              <ChartContainer
                config={lineChartConfig}
                className="aspect-auto h-[250px] w-full"
              >
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={getCurrentData()}
                    margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      // Show all data points with appropriate label spacing
                      interval="preserveStartEnd"
                      // Include the start and end dates explicitly
                      domain={dateRange ? [dateRange.firstDate, dateRange.lastDate] : ['auto', 'auto']}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                      // Ensure labels don't overlap
                      allowDataOverflow={true}
                    />
                    <YAxis 
                      domain={getYAxisDomain()}
                      tickFormatter={(value) => {
                        if (activeChart === "gas" && value < 0.0001) {
                          return value.toExponential(2);
                        }
                        return value.toFixed(4);
                      }} 
                    />
                    <RechartsTooltip
                      formatter={(value, name, props) => {
                        return [
                          `${formatValue(value as number)} ETH`, 
                          activeChart === "balance" ? "Balance" : "Transaction Fee"
                        ];
                      }}
                      labelFormatter={(label) => {
                        return formatDate(label as string);
                      }}
                    />
                    {activeChart === "balance" ? (
                      <Line
                        type="monotone"
                        dataKey="balance"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={true}
                        activeDot={{ r: 6 }}
                      />
                    ) : (
                      <Line
                        type="monotone"
                        dataKey="transactionFee"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={true}
                        activeDot={{ r: 6 }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};