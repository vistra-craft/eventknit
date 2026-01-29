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
import { CHART_COLORS, CHART_COLOR_ARRAY, CHART_HOVER_COLORS, CHART_FILL_COLORS, CHART_GRID_COLORS } from './chartConstants';

// Custom tooltip component with theme-aware styling
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

// Helper to get hover color based on the main color
const getHoverColor = (color: string): string => {
  if (color === CHART_COLORS.primary) return CHART_HOVER_COLORS.primary;
  if (color === CHART_COLORS.secondary || color === CHART_COLORS.info || color === CHART_COLORS.teal) return CHART_HOVER_COLORS.chart1;
  if (color === CHART_COLORS.purple || color === CHART_COLORS.pink) return CHART_HOVER_COLORS.chart4;
  if (color === CHART_COLORS.orange || color === CHART_COLORS.warning) return CHART_HOVER_COLORS.chart5;
  if (color === CHART_COLORS.success) return CHART_HOVER_COLORS.success;
  if (color === CHART_COLORS.indigo) return CHART_HOVER_COLORS.chart3;
  // Default to a muted green hover
  return CHART_HOVER_COLORS.chart2;
};

// Helper to get fill color for areas
const getFillColor = (color: string): string => {
  if (color === CHART_COLORS.primary) return CHART_FILL_COLORS.primary;
  if (color === CHART_COLORS.secondary || color === CHART_COLORS.info || color === CHART_COLORS.teal) return CHART_FILL_COLORS.chart1;
  if (color === CHART_COLORS.purple || color === CHART_COLORS.pink) return CHART_FILL_COLORS.chart4;
  if (color === CHART_COLORS.orange || color === CHART_COLORS.warning) return CHART_FILL_COLORS.chart5;
  if (color === CHART_COLORS.success) return CHART_FILL_COLORS.success;
  if (color === CHART_COLORS.indigo) return CHART_FILL_COLORS.chart3;
  return CHART_FILL_COLORS.chart2;
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
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLORS.grid} className="opacity-40" />}
        <XAxis
          dataKey={xAxisKey}
          stroke={CHART_GRID_COLORS.axis}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke={CHART_GRID_COLORS.axis}
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
          activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: 'hsl(var(--background))' }}
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
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLORS.grid} className="opacity-40" />}
        <XAxis
          dataKey={xAxisKey}
          stroke={CHART_GRID_COLORS.axis}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke={CHART_GRID_COLORS.axis}
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
          fill={getFillColor(color)}
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
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLORS.grid} className="opacity-40" />}
        <XAxis
          dataKey={xAxisKey}
          stroke={CHART_GRID_COLORS.axis}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke={CHART_GRID_COLORS.axis}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        {showTooltip && (
          <Tooltip
            content={<CustomTooltip formatter={formatter} />}
            cursor={{ fill: getHoverColor(color) }}
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data={data as any[]}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
          outerRadius={80}
          fill={CHART_COLORS.primary}
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
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLORS.grid} className="opacity-40" />}
        <XAxis
          dataKey={xAxisKey}
          stroke={CHART_GRID_COLORS.axis}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke={CHART_GRID_COLORS.axis}
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
            activeDot={{ r: 6, stroke: line.color, strokeWidth: 2, fill: 'hsl(var(--background))' }}
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
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLORS.grid} className="opacity-40" />}
        <XAxis
          dataKey={xAxisKey}
          stroke={CHART_GRID_COLORS.axis}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke={CHART_GRID_COLORS.axis}
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
            activeDot={{ r: 6, stroke: line.color, strokeWidth: 2, fill: 'hsl(var(--background))' }}
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
          fill={CHART_COLORS.primary}
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
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLORS.grid} className="opacity-40" />}
        <XAxis
          dataKey={xDataKey}
          stroke={CHART_GRID_COLORS.axis}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          dataKey={yDataKey}
          stroke={CHART_GRID_COLORS.axis}
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
