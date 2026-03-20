import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function PlayerTrendChart({ games, line, propType, gameLogs }) {
  const data = games.map((val, i) => {
    const log = gameLogs?.[i];
    return {
      game: log ? `${log.date}\n${log.opp}` : `G${i + 1}`,
      label: log ? `${log.date} vs ${log.opp}` : `Game ${i + 1}`,
      value: val,
      hit: val > line,
    };
  });

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
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
          />
          <ReferenceLine y={line} stroke="hsl(263 70% 58%)" strokeDasharray="5 5" label={{ value: `Line: ${line}`, fill: 'hsl(263 70% 58%)', fontSize: 10, position: 'right' }} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(142 71% 45%)"
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, payload } = props;
              const color = payload.hit ? 'hsl(142 71% 45%)' : 'hsl(0 84% 60%)';
              return <circle cx={cx} cy={cy} r={4} fill={color} stroke={color} strokeWidth={2} />;
            }}
            activeDot={{ r: 6, fill: 'hsl(142 71% 45%)', stroke: 'hsl(142 71% 45%)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}