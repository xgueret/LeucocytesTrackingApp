import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';

export const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const moisNom = MONTHS[payload[0].payload.mois - 1];
    return (
      <div className="bg-white p-4 border-2 border-gray-300 rounded-lg shadow-xl">
        <p className="font-bold text-lg mb-2">{`${moisNom} ${payload[0].payload.annee}`}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm font-semibold">
            {`${entry.name}: ${entry.value.toLocaleString()} /mm³`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const LeucocytesAreaChart = ({ chartData }) => (
  <ResponsiveContainer width="100%" height={600}>
    <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 60, bottom: 60 }}>
      <defs>
        <linearGradient id="colorLeuco" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
      <XAxis
        dataKey="dateLabel"
        label={{ value: 'Date (mois/année)', position: 'insideBottom', offset: -5 }}
        stroke="#666"
        style={{ fontSize: '12px', fontWeight: 'bold' }}
        angle={-45}
        textAnchor="end"
        height={80}
      />
      <YAxis
        label={{ value: 'Leucocytes (/mm³)', angle: -90, position: 'insideLeft', style: { fontSize: '14px', fontWeight: 'bold' } }}
        domain={[0, 15000]}
        stroke="#666"
        tickFormatter={(value) => value.toLocaleString()}
      />
      <Tooltip content={<CustomTooltip />} />
      <Legend wrapperStyle={{ paddingTop: '20px' }} />

      <ReferenceLine y={4000} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={3} label={{ value: 'Min normal (4000)', position: 'insideTopRight', fill: '#ef4444', fontWeight: 'bold' }} />
      <ReferenceLine y={11000} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={3} label={{ value: 'Max normal (11000)', position: 'insideBottomRight', fill: '#ef4444', fontWeight: 'bold' }} />

      <Area
        type="monotone"
        dataKey="leucocytes"
        stroke="#3b82f6"
        strokeWidth={4}
        fill="url(#colorLeuco)"
        dot={{ fill: '#3b82f6', r: 6, strokeWidth: 2, stroke: '#fff' }}
        activeDot={{ r: 10 }}
        name="Leucocytes totaux"
      />
    </AreaChart>
  </ResponsiveContainer>
);

const LinesChart = ({ chartData }) => (
  <ResponsiveContainer width="100%" height={600}>
    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 60, bottom: 60 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
      <XAxis
        dataKey="dateLabel"
        label={{ value: 'Date (mois/année)', position: 'insideBottom', offset: -5 }}
        stroke="#666"
        style={{ fontSize: '12px' }}
        angle={-45}
        textAnchor="end"
        height={80}
      />
      <YAxis
        label={{ value: 'Nombre de cellules (/mm³)', angle: -90, position: 'insideLeft' }}
        domain={[0, 12000]}
        stroke="#666"
        tickFormatter={(value) => value.toLocaleString()}
      />
      <Tooltip content={<CustomTooltip />} />
      <Legend wrapperStyle={{ paddingTop: '20px' }} />

      <ReferenceLine y={4000} stroke="#f87171" strokeDasharray="5 5" strokeWidth={2} />
      <ReferenceLine y={11000} stroke="#f87171" strokeDasharray="5 5" strokeWidth={2} />

      <Line type="monotone" dataKey="leucocytes" stroke="#3b82f6" strokeWidth={4} dot={{ fill: '#3b82f6', r: 5 }} name="Leucocytes totaux" />
      <Line type="monotone" dataKey="neutrophiles" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} name="Neutrophiles" />
      <Line type="monotone" dataKey="lymphocytes" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 4 }} name="Lymphocytes" />
      <Line type="monotone" dataKey="eosinophiles" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} name="Éosinophiles" />
    </LineChart>
  </ResponsiveContainer>
);

const StackedChart = ({ chartData }) => (
  <ResponsiveContainer width="100%" height={600}>
    <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 60, bottom: 60 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
      <XAxis dataKey="dateLabel" stroke="#666" style={{ fontSize: '12px' }} angle={-45} textAnchor="end" height={80} />
      <YAxis domain={[0, 12000]} stroke="#666" tickFormatter={(value) => value.toLocaleString()} />
      <Tooltip content={<CustomTooltip />} />
      <Legend wrapperStyle={{ paddingTop: '20px' }} />

      <Area type="monotone" dataKey="neutrophiles" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Neutrophiles" />
      <Area type="monotone" dataKey="lymphocytes" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Lymphocytes" />
      <Area type="monotone" dataKey="eosinophiles" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Éosinophiles" />

      <Line type="monotone" dataKey="leucocytes" stroke="#3b82f6" strokeWidth={4} dot={{ fill: '#3b82f6', r: 5 }} name="Leucocytes totaux" />
    </AreaChart>
  </ResponsiveContainer>
);

/**
 * Affiche le graphique correspondant au mode de vue demandé.
 * Partagé entre le dashboard principal et le dashboard partagé.
 */
const MeasuresChart = ({ data, viewMode }) => {
  const chartData = data.map((d) => ({ ...d, dateLabel: `${d.mois}/${d.annee}` }));

  switch (viewMode) {
    case 'lines':
      return <LinesChart chartData={chartData} />;
    case 'stacked':
      return <StackedChart chartData={chartData} />;
    default:
      return <LeucocytesAreaChart chartData={chartData} />;
  }
};

export default MeasuresChart;
