import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",     // 16px on mobile
        sm: "1.5rem",        // 24px on small screens
        md: "2rem",          // 32px on medium screens
        lg: "2rem",          // 32px on large screens
        xl: "2rem",          // 32px on xl screens
        "2xl": "2rem",       // 32px on 2xl screens
      },
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
        'mono': ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      fontWeight: {
        'thin': '100',
        'extralight': '200',
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extrabold': '800',
        'black': '900',
      },
      colors: {
        // ── Issues / Kanban color palette ─────────────────────────────────────
        issues: {
          // Priority card backgrounds
          'dk-low':        '#263e30',  // dark mode (user-provided)
          'dk-med':        '#4b2f18',
          'dk-hi':         '#502c29',
          'dk-urg':        '#4a1f1f',  // derived — follows intensity pattern
          'lt-low':        '#e8f5ec',  // light mode (derived)
          'lt-med':        '#fdecd8',
          'lt-hi':         '#fde0dd',
          'lt-urg':        '#fdd0d0',
          // Priority card borders
          'dk-low-bd':     '#3d6148',
          'dk-med-bd':     '#7a4f2c',
          'dk-hi-bd':      '#7f4842',
          'dk-urg-bd':     '#7a3030',
          'lt-low-bd':     '#c4dfcb',
          'lt-med-bd':     '#f5c8a0',
          'lt-hi-bd':      '#f5afaa',
          'lt-urg-bd':     '#f5a0a0',
          // Column backgrounds
          'dk-col-ns':     '#1e1e20',  // not-started — derived (neutral)
          'dk-col-bl':     '#241d1d',  // user-provided
          'dk-col-ip':     '#1b2027',
          'dk-col-ur':     '#23221b',
          'dk-col-dn':     '#1c211d',
          'lt-col-ns':     '#f5f5f7',
          'lt-col-bl':     '#fdf5f4',
          'lt-col-ip':     '#f2f6fd',
          'lt-col-ur':     '#fdf9ed',
          'lt-col-dn':     '#f0f8f2',
          // Column borders
          'dk-col-ns-bd':  '#2e2e32',
          'dk-col-bl-bd':  '#3d2828',
          'dk-col-ip-bd':  '#26303e',
          'dk-col-ur-bd':  '#3a3622',
          'dk-col-dn-bd':  '#283428',
          'lt-col-ns-bd':  '#e2e2e6',
          'lt-col-bl-bd':  '#f0dbd8',
          'lt-col-ip-bd':  '#d8e5f0',
          'lt-col-ur-bd':  '#f0e6c8',
          'lt-col-dn-bd':  '#d0e8d8',
          // Column hover / drag-over backgrounds
          'dk-hv-ns':      '#252527',
          'dk-hv-bl':      '#2d2222',
          'dk-hv-ip':      '#20272f',
          'dk-hv-ur':      '#2b2a22',
          'dk-hv-dn':      '#222a24',
          'lt-hv-ns':      '#ebebee',
          'lt-hv-bl':      '#faeae8',
          'lt-hv-ip':      '#e5eff8',
          'lt-hv-ur':      '#faf3de',
          'lt-hv-dn':      '#e5f5ea',
          // Column header pills (user-provided)
          'pill-ns':       '#61605c',
          'pill-bl':       '#984b45',
          'pill-ip':       '#376292',
          'pill-ur':       '#88692a',
          'pill-dn':       '#3c6d50',
          'pill-txt':      '#e7e6e4',
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: "hsl(var(--surface))",
        // Custom EventKnit Colors (X/Twitter Inspired)
        "eventknit": {
          DEFAULT: "hsl(var(--eventknit-brand))",
          foreground: "hsl(var(--eventknit-brand-foreground))",
          "bg": "#F9FAFB",
          "card": "#FFFFFF",
          "text": "#0F1419",
          "accent": "#1D9BF0",
          "primary": "#1D9BF0",
          "primary-light": "#E8F5FD"
        },
        // Navigation Hover Color
        "nav-hover": "hsl(var(--nav-hover))",
        "essential-cookie": "hsl(var(--primary) / 0.05)", // Light primary background for essential cookies
        "functional-cookie": "#E8F5FD", // Light blue background for functional cookies (X/Twitter blue tint)
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
          dark: "hsl(var(--primary-dark))",
        },
        "accent-electric": "hsl(var(--accent-electric))",
        "accent-neon": "hsl(var(--accent-neon))", 
        "accent-coral": "hsl(var(--accent-coral))",
        "card-surface": "hsl(var(--card-surface))",
        "card-border": "hsl(var(--card-border))",
        "card-hover": "hsl(var(--card-hover))",
        "glass-bg": "var(--glass-bg)",
        "glass-border": "var(--glass-border)",
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          light: "hsl(var(--success-light))",
        },
        info: {
          DEFAULT: "hsl(var(--info) / <alpha-value>)",
          foreground: "hsl(var(--info-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning) / <alpha-value>)",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        footer: {
          DEFAULT: "hsl(var(--footer-background))",
          foreground: "hsl(var(--footer-foreground))",
          muted: "hsl(var(--footer-foreground-muted))",
          border: "hsl(var(--footer-border))",
          hover: "hsl(var(--footer-link-hover))",
        },
      },
      backgroundImage: {
        "gradient-primary": "var(--gradient-primary)",
        "gradient-card": "var(--gradient-card)",
      },
      boxShadow: {
        "primary": "var(--shadow-primary)",
        "card": "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        "glow": "var(--shadow-glow)",
        "elevated": "var(--shadow-elevated)",
      },
      transitionTimingFunction: {
        "smooth": "cubic-bezier(0.23, 1, 0.32, 1)",
        "spring": "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
      },
    },
  },
  plugins: [animate],
} satisfies Config;