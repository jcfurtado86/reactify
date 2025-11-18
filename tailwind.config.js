import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
    './storage/framework/views/*.php',
    './resources/views/**/*.blade.php',
    './resources/js/**/*.jsx',
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background:
          'color-mix(in srgb, var(--background) calc(100% * <alpha-value>), transparent)',
        foreground:
          'color-mix(in srgb, var(--foreground) calc(100% * <alpha-value>), transparent)',
        border:
          'color-mix(in srgb, var(--border) calc(100% * <alpha-value>), transparent)',
        input:
          'color-mix(in srgb, var(--input) calc(100% * <alpha-value>), transparent)',
        ring: 'color-mix(in srgb, var(--ring) calc(100% * <alpha-value>), transparent)',
        card: {
          DEFAULT:
            'color-mix(in srgb, var(--card) calc(100% * <alpha-value>), transparent)',
          foreground:
            'color-mix(in srgb, var(--card-foreground) calc(100% * <alpha-value>), transparent)',
        },
        popover: {
          DEFAULT:
            'color-mix(in srgb, var(--popover) calc(100% * <alpha-value>), transparent)',
          foreground:
            'color-mix(in srgb, var(--popover-foreground) calc(100% * <alpha-value>), transparent)',
        },
        primary: {
          DEFAULT:
            'color-mix(in srgb, var(--primary) calc(100% * <alpha-value>), transparent)',
          foreground:
            'color-mix(in srgb, var(--primary-foreground) calc(100% * <alpha-value>), transparent)',
        },
        secondary: {
          DEFAULT:
            'color-mix(in srgb, var(--secondary) calc(100% * <alpha-value>), transparent)',
          foreground:
            'color-mix(in srgb, var(--secondary-foreground) calc(100% * <alpha-value>), transparent)',
        },
        muted: {
          DEFAULT:
            'color-mix(in srgb, var(--muted) calc(100% * <alpha-value>), transparent)',
          foreground:
            'color-mix(in srgb, var(--muted-foreground) calc(100% * <alpha-value>), transparent)',
        },
        accent: {
          DEFAULT:
            'color-mix(in srgb, var(--accent) calc(100% * <alpha-value>), transparent)',
          foreground:
            'color-mix(in srgb, var(--accent-foreground) calc(100% * <alpha-value>), transparent)',
        },
        destructive: {
          DEFAULT:
            'color-mix(in srgb, var(--destructive) calc(100% * <alpha-value>), transparent)',
          foreground:
            'color-mix(in srgb, var(--destructive-foreground) calc(100% * <alpha-value>), transparent)',
        },
        chart: {
          1: 'color-mix(in srgb, var(--chart-1) calc(100% * <alpha-value>), transparent)',
          2: 'color-mix(in srgb, var(--chart-2) calc(100% * <alpha-value>), transparent)',
          3: 'color-mix(in srgb, var(--chart-3) calc(100% * <alpha-value>), transparent)',
          4: 'color-mix(in srgb, var(--chart-4) calc(100% * <alpha-value>), transparent)',
          5: 'color-mix(in srgb, var(--chart-5) calc(100% * <alpha-value>), transparent)',
        },
        gray: {
          1: 'color-mix(in srgb, var(--gray-1) calc(100% * <alpha-value>), transparent)',
          2: 'color-mix(in srgb, var(--gray-2) calc(100% * <alpha-value>), transparent)',
        },
        purple: {
          1: 'color-mix(in srgb, var(--purple-1) calc(100% * <alpha-value>), transparent)',
          2: 'color-mix(in srgb, var(--purple-2) calc(100% * <alpha-value>), transparent)',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        shine: {
          '0%': {
            backgroundPosition: '0% 0%',
          },
          '50%': {
            backgroundPosition: '100% 100%',
          },
          to: {
            backgroundPosition: '0% 0%',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shine: 'shine 7s linear infinite',
      },
    },
  },
  keyframes: {
    slideDownAndFade: {
      from: { opacity: '0', transform: 'translateY(-2px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    slideLeftAndFade: {
      from: { opacity: '0', transform: 'translateX(2px)' },
      to: { opacity: '1', transform: 'translateX(0)' },
    },
    slideUpAndFade: {
      from: { opacity: '0', transform: 'translateY(2px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    slideRightAndFade: {
      from: { opacity: '0', transform: 'translateX(-2px)' },
      to: { opacity: '1', transform: 'translateX(0)' },
    },
  },
  animation: {
    slideDownAndFade: 'slideDownAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)',
    slideLeftAndFade: 'slideLeftAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)',
    slideUpAndFade: 'slideUpAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)',
    slideRightAndFade: 'slideRightAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)',
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
}
