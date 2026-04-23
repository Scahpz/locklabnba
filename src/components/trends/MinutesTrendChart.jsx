import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MinutesTrendChart({ minutes }) {
  if (!minutes || minutes.length === 0) return null;

  // minutes is already chronological (oldest first) after backend reversal
  const data = minutes.map((val, i) => ({
    game: i === minutes.length - 1 ? 'Last' : `G${i + 1}`,
    minutes: val,
  }));

  return (
    <div className="w-full">
      <div className="h-36 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 20%)" />
            <XAxis dataKey="game" tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: 'hsl(222 47% 9%)',
                border: '1px solid hsl(217 33% 20%)',
                borderRadius: '8px',
                color: 'hsl(210 40% 98%)',
                fontSize: 12,
              }}
              formatter={(value) => [`${value} min`, 'Minutes']}
            />
            <Bar dataKey="minutes" fill="hsl(199 89% 48%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-muted-foreground text-right mt-1 pr-1">older ← → most recent</p>
    </div>
  );
}
