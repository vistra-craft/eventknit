// Color palette for consistent theming - using CSS custom properties for theme compatibility
// These will adapt to light/dark themes automatically

// Raw CSS variable names (without hsl wrapper) - use these for creating opacity variants
export const CHART_COLOR_VARS = {
  chart1: 'var(--chart-1)',
  chart2: 'var(--chart-2)',
  chart3: 'var(--chart-3)',
  chart4: 'var(--chart-4)',
  chart5: 'var(--chart-5)',
  primary: 'var(--primary)',
  success: 'var(--success)',
  destructive: 'var(--destructive)',
  muted: 'var(--muted-foreground)',
};

// Full HSL colors - use these for solid fills and strokes
export const CHART_COLORS = {
  primary: 'hsl(var(--primary))', // Theme primary color (blue)
  secondary: 'hsl(var(--chart-2))', // Chart accent color (green)
  success: 'hsl(var(--success))', // Success color (green)
  warning: 'hsl(var(--chart-5))', // Warning color (orange)
  error: 'hsl(var(--destructive))', // Destructive/error color (red)
  info: 'hsl(var(--chart-1))', // Info/chart color 1 (green)
  purple: 'hsl(var(--chart-4))', // Chart color 4 (purple)
  pink: 'hsl(var(--chart-4))', // Chart color 4 (purple)
  indigo: 'hsl(var(--chart-3))', // Chart color 3 (blue)
  teal: 'hsl(var(--chart-1))', // Chart color 1 (green)
  orange: 'hsl(var(--chart-5))', // Chart color 5 (orange)
  gray: 'hsl(var(--muted-foreground))', // Muted text color
};

// Colors with opacity for hover states and fills
export const CHART_HOVER_COLORS = {
  primary: 'hsl(var(--primary) / 0.15)',
  chart1: 'hsl(var(--chart-1) / 0.15)',
  chart2: 'hsl(var(--chart-2) / 0.15)',
  chart3: 'hsl(var(--chart-3) / 0.15)',
  chart4: 'hsl(var(--chart-4) / 0.15)',
  chart5: 'hsl(var(--chart-5) / 0.15)',
  success: 'hsl(var(--success) / 0.15)',
};

// Area fill colors (more transparent)
export const CHART_FILL_COLORS = {
  primary: 'hsl(var(--primary) / 0.1)',
  chart1: 'hsl(var(--chart-1) / 0.1)',
  chart2: 'hsl(var(--chart-2) / 0.1)',
  chart3: 'hsl(var(--chart-3) / 0.1)',
  chart4: 'hsl(var(--chart-4) / 0.1)',
  chart5: 'hsl(var(--chart-5) / 0.1)',
  success: 'hsl(var(--success) / 0.1)',
};

// Theme-aware grid and axis colors
export const CHART_GRID_COLORS = {
  grid: 'hsl(var(--border))',
  axis: 'hsl(var(--muted-foreground))',
  text: 'hsl(var(--muted-foreground))',
};

export const CHART_COLOR_ARRAY = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.info,
  CHART_COLORS.purple,
  CHART_COLORS.orange,
  CHART_COLORS.warning,
];
