"use client"

import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { neo4jClient } from '../../../../lib/neo4j/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"

const chartConfig = {
  volume: {
    label: "Volume (ETH)",
    color: "hsl(var(--chart-1))",
  },
  transactions: {
    label: "Transactions",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export const CombinedChart = () => {
  const [data, setData] = useState<{ timestamp: string; volume: number; transactions: number }[]>([]);
  const [activeChart, setActiveChart] = useState<keyof typeof chartConfig>("volume");
  const [totals, setTotals] = useState({ volume: 0, transactions: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const volumes = await neo4jClient.getVolumeData();
        const transactions = await neo4jClient.getTransactionsByTimeRange();
        console.log('Fetched volume data:', volumes);
        console.log('Fetched transaction data:', transactions);

        const combinedData = volumes.map((vol: any) => {
          const tx = transactions.find((tx: any) => tx.year === vol.year && tx.month === vol.month);
          return {
            timestamp: `${vol.year}-${vol.month}`,
            volume: parseFloat(vol.totalVolume) / 1e18, // Convert to ETH
            transactions: tx ? tx.totalTransactions : 0,
          };
        });

        const totalVolume = combinedData.reduce((acc, curr) => acc + curr.volume, 0);
        const totalTransactions = combinedData.reduce((acc, curr) => acc + curr.transactions, 0);

        setData(combinedData);
        setTotals({ volume: totalVolume, transactions: totalTransactions });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const formatValue = (value: number) => Number(value).toExponential(2).replace('e', 'E'); // Convert to exponential notation

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Total Volume and Transactions</CardTitle>
          <CardDescription>
            Showing total volume and transactions by months
          </CardDescription>
        </div>
        <div className="flex">
          {["volume", "transactions"].map((key) => {
            const chart = key as keyof typeof chartConfig
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg font-bold leading-none sm:text-3xl">
                  {chart === 'volume' ? formatValue(totals.volume) : totals.transactions.toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 20, bottom: 30, left: 40 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="timestamp" tickFormatter={(value) => {
                const [year, month] = value.split('-');
                return `${month}/${year}`;
              }} />
              <YAxis tickFormatter={(value) => activeChart === 'volume' ? `${formatValue(value)}` : value.toString()} /> {/* Format Y-axis */}
              <Tooltip
                formatter={(value: number | string) => {
                  if (typeof value === 'number') {
                    return [`${activeChart === 'volume' ? formatValue(value) : value}`, activeChart === 'volume' ? 'Volume (ETH)' : 'Transactions'];
                  }
                  return [value, activeChart === 'volume' ? 'Volume (ETH)' : 'Transactions'];
                }}
              />
              <Legend />
              <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};