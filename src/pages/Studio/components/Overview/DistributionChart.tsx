"use client"

import { useEffect, useState } from 'react';
import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { neo4jClient } from '../../../../lib/neo4j/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent } from "@/components/ui/chart"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#00A6B4', '#A3A1FB', '#FF6361', '#BC5090'];

export const DistributionChart = () => {
  const [data, setData] = useState<{ address: string; value: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await neo4jClient.getDistributionData();
        console.log('Fetched distribution data:', result);
        setData(result.map((item: any) => ({
          address: item.address,
          value: parseFloat(item.totalValue),
        })));
      } catch (error) {
        console.error('Error fetching distribution data:', error);
      }
    };

    fetchData();
  }, []);

  const chartConfig = {
    value: {
      label: "Value",
    },
    ...data.reduce((acc, item, index) => {
      acc[item.address] = {
        label: item.address,
        color: COLORS[index % COLORS.length],
      };
      return acc;
    }, {} as ChartConfig),
  };

  return (
    <Card className="flex-1 min-w-[300px]">
      <CardHeader className="items-center pb-0">
        <CardTitle>Most Contributing Addresses</CardTitle>
        <CardDescription>All Time</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[400px]" // Adjusted max height to make the chart smaller
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="address" cx="50%" cy="50%" outerRadius={80} label> {/* Adjusted outerRadius to make the pie smaller */}
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <ChartLegend
                content={<ChartLegendContent nameKey="address" />}
                className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};