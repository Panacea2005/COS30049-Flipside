import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { neo4jClient } from '../../../../lib/neo4j/client';

export const TransactionChart = () => {
  const [data, setData] = useState<{ timestamp: string; totalTransactions: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const transactions = await neo4jClient.getTransactionsByTimeRange();
        console.log('Fetched transaction data:', transactions);
        const formattedData = transactions.map((tx: any) => ({
          timestamp: tx.timestamp,
          totalTransactions: tx.totalTransactions,
        }));
        setData(formattedData);
      } catch (error) {
        console.error('Error fetching transaction data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="w-full h-[400px] mb-8">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 20, bottom: 30, left: 40 }}>
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="totalTransactions" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};