"use client"

import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { neo4jClient } from '../../../../lib/neo4j/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const BiggestTransactionsChart = () => {
  const [data, setData] = useState<{ hash: string; value: number; fromAddress: string; toAddress: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const transactions = await neo4jClient.getBiggestTransactions();
        console.log('Fetched biggest transactions:', transactions);

        const formattedData = transactions.map((tx: any) => ({
          hash: tx.hash,
          value: tx.value / 1e18, // Convert to ETH
          fromAddress: tx.fromAddress,
          toAddress: tx.toAddress,
        }));

        setData(formattedData);
      } catch (error) {
        console.error('Error fetching biggest transactions:', error);
      }
    };

    fetchData();
  }, []);

  const formatValue = (value: number) => Number(value).toExponential(2).replace('e', 'E'); // Convert to exponential notation
  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`; // Summarize address

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Biggest Transactions</CardTitle>
          <CardDescription>
            Showing the 3 biggest single transactions
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart layout="vertical" data={data} margin={{ top: 10, right: 10, bottom: 10, left: 100 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickFormatter={(value) => `${formatValue(value)}`} /> {/* Format X-axis as ETH */}
            <YAxis type="category" dataKey="hash" tickFormatter={(value) => `${value.slice(0, 6)}...${value.slice(-4)}`} width={50} /> {/* Format Y-axis */}
            <Tooltip
              formatter={(value: number | string) => {
                if (typeof value === 'number') {
                  return [`${formatValue(value)}`, 'Value (ETH)'];
                }
                return [value, 'Value (ETH)'];
              }}
              labelFormatter={(label) => {
                const transaction = data.find((tx) => tx.hash === label);
                return transaction ? `From: ${formatAddress(transaction.fromAddress)}\nTo: ${formatAddress(transaction.toAddress)}` : label;
              }}
            />
            <Bar dataKey="value" fill="#FF4560" radius={[4, 4, 0, 0]} /> {/* Modern red color */}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};