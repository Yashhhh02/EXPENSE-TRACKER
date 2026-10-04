'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface ComparisonItem {
  metric: string;
  thisMonth: number;
  lastMonth: number;
}

interface MonthlyComparisonChartProps {
  data: ComparisonItem[];
  currencySymbol?: string;
}

export function MonthlyComparisonChart({
  data,
  currencySymbol = '₹',
}: MonthlyComparisonChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-zinc-500 text-sm">
        No comparison data available.
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="metric" stroke="#64748b" fontSize={12} tickLine={false} />
          <YAxis
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            tickFormatter={(v) => `${currencySymbol}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '12px',
              color: '#f8fafc',
            }}
            formatter={(value: any) => [`${currencySymbol}${Number(value).toLocaleString()}`, '']}
          />
          <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
          <Bar dataKey="thisMonth" name="This Month" fill="#10b981" radius={[6, 6, 0, 0]} />
          <Bar dataKey="lastMonth" name="Last Month" fill="#3b82f6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
