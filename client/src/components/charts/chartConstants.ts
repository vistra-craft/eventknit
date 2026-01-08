// Color palette for consistent theming - using CSS custom properties for theme compatibility
// These will adapt to light/dark themes automatically
export const CHART_COLORS = {
  primary: 'hsl(var(--primary))', // Theme primary color
  secondary: 'hsl(var(--chart-2))', // Chart accent color
  success: 'hsl(var(--success))', // Success color
  warning: 'hsl(var(--warning))', // Warning color
  error: 'hsl(var(--destructive))', // Destructive/error color
  info: 'hsl(var(--chart-1))', // Info/chart color 1
  purple: 'hsl(var(--chart-3))', // Chart color 3
  pink: 'hsl(var(--chart-4))', // Chart color 4
  indigo: 'hsl(var(--chart-5))', // Chart color 5
  teal: 'hsl(var(--chart-1))', // Chart color 1
  orange: 'hsl(var(--chart-2))', // Chart color 2
  gray: 'hsl(var(--muted-foreground))', // Muted text color
};

export const CHART_COLOR_ARRAY = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.info,
  CHART_COLORS.purple,
  CHART_COLORS.pink,
  CHART_COLORS.warning,
];

