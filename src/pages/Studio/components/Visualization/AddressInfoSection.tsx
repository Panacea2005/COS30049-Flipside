import { useEffect, useState } from 'react';
import { neo4jClient } from '../../../../lib/neo4j/client';
import { AddressInfo, BalanceData, GasData } from '../../../../lib/neo4j/types';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector, Label, LineChart, Line, XAxis, CartesianGrid, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, Legend } from 'recharts';
import { ChartConfig, ChartContainer, ChartStyle, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface AddressInfoSectionProps {
  address: string;
}

const COLORS = ['#4F46E5', '#818CF8'];

export const AddressInfoSection = ({ address }: AddressInfoSectionProps) => {
  const [addressInfo, setAddressInfo] = useState<AddressInfo | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [balanceData, setBalanceData] = useState<BalanceData[]>([]);
  const [gasData, setGasData] = useState<GasData[]>([]);
  const [activeChart, setActiveChart] = useState<'balance' | 'gas'>('balance');

  const [totals, setTotals] = useState({
    balance: 0,
    totalTransactionFee: 0
  });

  useEffect(() => {
    neo4jClient.getAddressInfo(address).then(setAddressInfo);
    fetchBalanceData();
    fetchGasData();
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
    const result = await neo4jClient.getBalanceOverTime(address);
    setBalanceData(result);
  };

  const fetchGasData = async () => {
    const gasData = await neo4jClient.getGasDataOverTime(address);
    console.log("Fetched Gas Data:", gasData); // Log the fetched gas data
    setGasData(gasData);
    setTotals((prevTotals) => ({
      ...prevTotals,
      totalTransactionFee: gasData.reduce((acc, curr) => acc + curr.transactionFee, 0)
    }));
  };

  useEffect(() => {
    console.log("Updated Totals:", totals); // Log the updated totals
  }, [totals]);

  if (!addressInfo) return null;

  const pieData = [
    { label: 'Sent', value: addressInfo.sentTransactions },
    { label: 'Received', value: addressInfo.receivedTransactions },
  ];

  const volumeData = [
    { label: 'Sent', value: parseFloat(addressInfo.totalSentValue) / 1e18 },
    { label: 'Received', value: parseFloat(addressInfo.totalReceivedValue) / 1e18 },
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
      }
      return acc
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

  const formatValue = (value: number | undefined) => (value ?? 0).toFixed(4);

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
                <span className="text-sm text-muted-foreground">{addressInfo.addressId}</span>
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
              <span className="text-sm font-medium text-muted-foreground">Balance</span>
              <span className="text-2xl font-bold">{(parseFloat(addressInfo.balance) / 1e18).toFixed(4)} ETH</span>
            </div>
          </Card>
          <Card className="p-6 bg-background shadow-none border">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">First Active</span>
              <span className="text-2xl font-bold">{new Date(addressInfo.firstSeen).toLocaleDateString()}</span>
            </div>
          </Card>
          <Card className="p-6 bg-background shadow-none border">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Last Active</span>
              <span className="text-2xl font-bold">{new Date(addressInfo.lastSeen).toLocaleDateString()}</span>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-background shadow-none border">
            <CardHeader>
              <CardTitle className="text-base font-medium">Volume Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <XAxis dataKey="label" />
                    <YAxis />
                    <ChartTooltip
                      content={({ payload }) => {
                        if (payload && payload[0]) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-md">
                              <div className="grid grid-cols-2 gap-2">
                                <span className="text-sm font-medium">{payload[0].name}</span>
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
              <CardTitle className="text-base font-medium">Transaction Distribution</CardTitle>
              <Select 
                value={pieData[activeIndex].label} 
                onValueChange={(value) => setActiveIndex(pieData.findIndex(d => d.label === value))}
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
                </CardDescription>
              </div>
              <div className="flex">
                {["balance", "gas"].map((key) => {
                  const chart = key as keyof typeof lineChartConfig
                  return (
                    <button
                      key={chart}
                      data-active={activeChart === chart}
                      className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                      onClick={() => setActiveChart(chart as 'balance' | 'gas')}
                    >
                      <span className="text-xs text-muted-foreground">
                        {lineChartConfig[chart].label}
                      </span>
                      <span className="text-lg font-bold leading-none sm:text-3xl">
                        {chart === 'balance' ? formatValue(totals.balance) : totals.totalTransactionFee.toFixed(4)} ETH
                      </span>
                    </button>
                  )
                })}
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:p-6">
              <ChartContainer
                config={lineChartConfig}
                className="aspect-auto h-[250px] w-full"
              >
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={activeChart === 'balance' ? balanceData : gasData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={32}
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }}
                    />
                    <YAxis tickFormatter={(value) => (value).toFixed(4)} />
                    <RechartsTooltip />
                    {activeChart === 'balance' ? (
                      <Line type="monotone" dataKey="balance" stroke="#8884d8" strokeWidth={2} dot={false} />
                    ) : (
                      <Line type="monotone" dataKey="transactionFee" stroke="#8884d8" strokeWidth={2} dot={false} />
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