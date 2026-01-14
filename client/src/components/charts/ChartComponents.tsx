import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  Scatter,
  ScatterChart,
} from 'recharts';
import { CHART_COLORS, CHART_COLOR_ARRAY } from './chartConstants';

// Custom tooltip component
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: unknown;
    name: string;
    color: string;
  }>;
  label?: string;
  formatter?: (value: unknown, name: string) => string;
}

const CustomTooltip = ({ active, payload, label, formatter }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-muted-foreground">{entry.name}:</span>
            <span className="text-sm font-medium text-foreground">
              {formatter ? String(formatter(entry.value as number, entry.name as string)) : String(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Line Chart Component
interface LineChartProps {
  data: unknown[];
  dataKey: string;
  xAxisKey: string;
  height?: number;
  color?: string;
  strokeWidth?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  formatter?: (value: unknown, name: string) => string;
}

export const CustomLineChart: React.FC<LineChartProps> = ({
  data,
  dataKey,
  xAxisKey,
  height = 300,
  color = CHART_COLORS.primary,
  strokeWidth = 2,
  showGrid = true,
  showTooltip = true,
  showLegend = false,
  formatter,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
        <XAxis 
          dataKey={xAxisKey} 
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        {showTooltip && (
          <Tooltip 
            content={<CustomTooltip formatter={formatter} />}
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '5 5' }}
          />
        )}
        {showLegend && <Legend />}
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={strokeWidth}
          dot={{ fill: color, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Area Chart Component
interface AreaChartProps {
  data: unknown[];
  dataKey: string;
  xAxisKey: string;
  height?: number;
  color?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  formatter?: (value: unknown, name: string) => string;
}

export const CustomAreaChart: React.FC<AreaChartProps> = ({
  data,
  dataKey,
  xAxisKey,
  height = 300,
  color = CHART_COLORS.primary,
  showGrid = true,
  showTooltip = true,
  showLegend = false,
  formatter,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
        <XAxis 
          dataKey={xAxisKey} 
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        {showTooltip && (
          <Tooltip 
            content={<CustomTooltip formatter={formatter} />}
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '5 5' }}
          />
        )}
        {showLegend && <Legend />}
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          fill={`${color}20`}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// Bar Chart Component
interface BarChartProps {
  data: unknown[];
  dataKey: string;
  xAxisKey: string;
  height?: number;
  color?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  formatter?: (value: unknown, name: string) => string;
}

export const CustomBarChart: React.FC<BarChartProps> = ({
  data,
  dataKey,
  xAxisKey,
  height = 300,
  color = CHART_COLORS.primary,
  showGrid = true,
  showTooltip = true,
  showLegend = false,
  formatter,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
        <XAxis 
          dataKey={xAxisKey} 
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        {showTooltip && (
          <Tooltip 
            content={<CustomTooltip formatter={formatter} />}
            cursor={{ fill: `${color}20` }}
          />
        )}
        {showLegend && <Legend />}
        <Bar 
          dataKey={dataKey} 
          fill={color}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Pie Chart Component
interface PieChartProps {
  data: Array<Record<string, unknown>>;
  dataKey: string;
  nameKey: string;
  height?: number;
  colors?: string[];
  showTooltip?: boolean;
  showLegend?: boolean;
  formatter?: (value: unknown, name: string) => string;
}

export const CustomPieChart: React.FC<PieChartProps> = ({
  data,
  dataKey,
  height = 300,
  colors = CHART_COLOR_ARRAY,
  showTooltip = true,
  showLegend = true,
  formatter,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        {/* Casting to unknown here because Recharts expects its internal ChartDataInput[] type */}
        <Pie
          data={data as unknown}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey={dataKey}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        {showTooltip && (
          <Tooltip 
            content={<CustomTooltip formatter={formatter} />}
          />
        )}
        {showLegend && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  );
};

// Multi-line Chart Component
interface MultiLineChartProps {
  data: unknown[];
  lines: Array<{
    dataKey: string;
    name: string;
    color: string;
    strokeWidth?: number;
  }>;
  xAxisKey: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  formatter?: (value: unknown, name: string) => string;
}

export const CustomMultiLineChart: React.FC<MultiLineChartProps> = ({
  data,
  lines,
  xAxisKey,
  height = 300,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  formatter,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
        <XAxis 
          dataKey={xAxisKey} 
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        {showTooltip && (
          <Tooltip 
            content={<CustomTooltip formatter={formatter} />}
          />
        )}
        {showLegend && <Legend />}
        {lines.map((line, index) => (
          <Line
            key={index}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={line.color}
            strokeWidth={line.strokeWidth || 2}
            dot={{ fill: line.color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: line.color, strokeWidth: 2 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

// Composed Chart Component (Bar + Line)
interface ComposedChartProps {
  data: unknown[];
  bars: Array<{
    dataKey: string;
    name: string;
    color: string;
  }>;
  lines: Array<{
    dataKey: string;
    name: string;
    color: string;
    strokeWidth?: number;
  }>;
  xAxisKey: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  formatter?: (value: unknown, name: string) => string;
}

export const CustomComposedChart: React.FC<ComposedChartProps> = ({
  data,
  bars,
  lines,
  xAxisKey,
  height = 300,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  formatter,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
        <XAxis 
          dataKey={xAxisKey} 
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        {showTooltip && (
          <Tooltip 
            content={<CustomTooltip formatter={formatter} />}
          />
        )}
        {showLegend && <Legend />}
        {bars.map((bar, index) => (
          <Bar
            key={`bar-${index}`}
            dataKey={bar.dataKey}
            name={bar.name}
            fill={bar.color}
            radius={[4, 4, 0, 0]}
          />
        ))}
        {lines.map((line, index) => (
          <Line
            key={`line-${index}`}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={line.color}
            strokeWidth={line.strokeWidth || 2}
            dot={{ fill: line.color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: line.color, strokeWidth: 2 }}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
};

// Radial Bar Chart Component
interface RadialBarChartProps {
  data: unknown[];
  dataKey: string;
  nameKey: string;
  height?: number;
  colors?: string[];
  showTooltip?: boolean;
  showLegend?: boolean;
  formatter?: (value: unknown, name: string) => string;
}

export const CustomRadialBarChart: React.FC<RadialBarChartProps> = ({
  data,
  dataKey,
  height = 300,
  colors = CHART_COLOR_ARRAY,
  showTooltip = true,
  showLegend = true,
  formatter,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={data}>
        <RadialBar
          dataKey={dataKey}
          cornerRadius={10}
          fill="#8884d8"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </RadialBar>
        {showTooltip && (
          <Tooltip 
            content={<CustomTooltip formatter={formatter} />}
          />
        )}
        {showLegend && <Legend />}
      </RadialBarChart>
    </ResponsiveContainer>
  );
};

// Scatter Chart Component
interface ScatterChartProps {
  data: unknown[];
  xDataKey: string;
  yDataKey: string;
  height?: number;
  color?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  formatter?: (value: unknown, name: string) => string;
}

export const CustomScatterChart: React.FC<ScatterChartProps> = ({
  data,
  xDataKey,
  yDataKey,
  height = 300,
  color = CHART_COLORS.primary,
  showGrid = true,
  showTooltip = true,
  showLegend = false,
  formatter,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
        <XAxis 
          dataKey={xDataKey} 
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          dataKey={yDataKey}
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        {showTooltip && (
          <Tooltip 
            content={<CustomTooltip formatter={formatter} />}
          />
        )}
        {showLegend && <Legend />}
        <Scatter 
          dataKey={yDataKey} 
          fill={color}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
};
