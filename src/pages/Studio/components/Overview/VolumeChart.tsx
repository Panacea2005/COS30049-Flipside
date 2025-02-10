import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { neo4jClient } from '../../../../lib/neo4j/client';

export const VolumeChart = () => {
  const [data, setData] = useState<{ timestamp: string; totalVolume: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const volumes = await neo4jClient.getVolumeData();
        console.log('Fetched volume data:', volumes);

        const formattedData = volumes.map((vol: any) => ({
          timestamp: vol.timestamp,
          totalVolume: parseFloat(vol.totalVolume) / 1e18, // Convert to ETH
        }));
        setData(formattedData);
      } catch (error) {
        console.error('Error fetching volume data:', error);
      }
    };

    fetchData();
  }, []);

  const formatValue = (value: number) => Number(value).toExponential(2).replace('e', 'E'); // Convert to exponential notation

  return (
    <div className="w-full h-[400px] mb-8">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 20, bottom: 30, left: 40 }}>
          <XAxis dataKey="timestamp" />
          <YAxis tickFormatter={(value) => `${formatValue(value)}`} /> {/* Format Y-axis as ETH */}
          <Tooltip
            formatter={(value) => [`${typeof value === 'number' ? formatValue(value) : value}`]} // Removed 'Total Volume' label
          />
          <Bar dataKey="totalVolume" fill="url(#bar-gradient)" radius={[4, 4, 0, 0]} />
          <defs>
            <linearGradient id="bar-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};